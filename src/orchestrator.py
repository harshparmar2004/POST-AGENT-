"""
Orchestrator — Main pipeline coordinator.

Runs the full news automation pipeline in sequence:
  1. Scrape articles from all configured sources
  2. Deduplicate and store in SQLite
  3. Rewrite with Gemini AI for 4 platforms
  4. Generate thumbnail images with Gemini
  5. Publish to Reddit (live) and Twitter (text-only live)
  6. Queue for Instagram and LinkedIn (local JSON + image)
"""

import os
import sys
import time
import logging
from typing import Any

import yaml

from src.db.models import Article, get_session, init_db
from src.scraper.feed_scraper import scrape_feed
from src.scraper.html_scraper import scrape_html
from src.scraper.ai_scraper import scrape_with_ai
from src.scraper.dedupe import dedupe_and_store
from src.ai.rewriter import rewrite_article
from src.ai.image_gen import generate_image
from src.publishers.reddit_publisher import publish_all_to_reddit
from src.publishers.twitter_publisher import publish_all_to_twitter
from src.publishers.instagram_publisher import queue_all_for_instagram
from src.publishers.linkedin_publisher import queue_all_for_linkedin

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(PROJECT_ROOT, "config", "sources.yaml")


def load_sources() -> list[dict[str, Any]]:
    """Load source configuration from YAML file."""
    if not os.path.exists(CONFIG_PATH):
        logger.error(f"Config file not found: {CONFIG_PATH}")
        sys.exit(1)

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    sources = config.get("sources", [])
    logger.info(f"Loaded {len(sources)} sources from config")
    return sources


# ---------------------------------------------------------------------------
# Pipeline stages
# ---------------------------------------------------------------------------

def stage_scrape(sources: list[dict], max_articles: int | None = None) -> int:
    """
    Stage 1: Scrape articles from all configured sources.
    Returns total number of new articles stored.
    """
    logger.info("=" * 60)
    logger.info("STAGE 1: SCRAPING ARTICLES")
    logger.info("=" * 60)

    total_new = 0
    total_scraped = 0

    for source in sources:
        name = source.get("name", "Unknown")
        tier = source.get("tier", 1)

        # Override per-source max_articles if global limit is set
        if max_articles is not None:
            source = {**source, "max_articles": min(source.get("max_articles", 5), max_articles)}

        logger.info(f"--- Scraping: {name} (Tier {tier}) ---")

        try:
            if tier == 2:
                # Tier 2: AI-powered scraping
                articles = scrape_with_ai(source)
            elif source.get("feed_url"):
                # Tier 1 with RSS feed
                articles = scrape_feed(source)
            else:
                # Tier 1 without RSS feed — direct HTML scraping
                articles = scrape_html(source)

            total_scraped += len(articles)

            if articles:
                new_count = dedupe_and_store(articles)
                total_new += new_count
                logger.info(f"  {name}: scraped {len(articles)}, {new_count} new")
            else:
                logger.warning(f"  {name}: no articles scraped")

        except Exception as e:
            logger.error(f"  {name}: scraping FAILED — {e}", exc_info=True)
            continue

    logger.info(f"Scraping complete: {total_scraped} total, {total_new} new articles")
    return total_new


def stage_rewrite(max_articles: int | None = None) -> int:
    """
    Stage 2: Rewrite scraped articles with Gemini AI.
    Returns count of successfully rewritten articles.
    """
    logger.info("=" * 60)
    logger.info("STAGE 2: AI REWRITE (Gemini 2.5 Flash)")
    logger.info("=" * 60)

    session = get_session()
    try:
        query = session.query(Article).filter(Article.status == "scraped")
        if max_articles:
            query = query.limit(max_articles)
        articles = query.all()
        article_ids = [a.id for a in articles]
    finally:
        session.close()

    if not article_ids:
        logger.info("No articles to rewrite")
        return 0

    logger.info(f"Rewriting {len(article_ids)} articles...")
    count = 0

    for aid in article_ids:
        try:
            if rewrite_article(aid):
                count += 1
                logger.info(f"  Article {aid}: rewrite OK")
            else:
                logger.warning(f"  Article {aid}: rewrite FAILED")
        except Exception as e:
            logger.error(f"  Article {aid}: rewrite ERROR — {e}")
        time.sleep(1)  # Rate limiting

    logger.info(f"Rewrite complete: {count}/{len(article_ids)} successful")
    return count


def stage_image_gen(max_articles: int | None = None) -> int:
    """
    Stage 3: Generate thumbnail images with Gemini.
    Returns count of successfully generated images.
    """
    logger.info("=" * 60)
    logger.info("STAGE 3: IMAGE GENERATION (Gemini 2.0 Flash)")
    logger.info("=" * 60)

    session = get_session()
    try:
        query = session.query(Article).filter(
            Article.twitter_text.isnot(None),
            Article.image_path.is_(None),
        )
        if max_articles:
            query = query.limit(max_articles)
        articles = query.all()
        article_ids = [a.id for a in articles]
    finally:
        session.close()

    if not article_ids:
        logger.info("No articles need image generation")
        return 0

    logger.info(f"Generating images for {len(article_ids)} articles...")
    count = 0

    for aid in article_ids:
        try:
            if generate_image(aid):
                count += 1
                logger.info(f"  Article {aid}: image OK")
            else:
                logger.warning(f"  Article {aid}: image FAILED")
        except Exception as e:
            logger.error(f"  Article {aid}: image ERROR — {e}")
        time.sleep(2)  # Rate limiting (25 images/day on free tier)

    logger.info(f"Image gen complete: {count}/{len(article_ids)} successful")
    return count


def stage_publish() -> dict[str, int]:
    """
    Stage 4: Publish/queue articles to all platforms.
    Returns dict with counts per platform.
    """
    logger.info("=" * 60)
    logger.info("STAGE 4: PUBLISHING & QUEUING")
    logger.info("=" * 60)

    results = {}

    # Reddit — live post with image
    logger.info("--- Publishing to Reddit (live) ---")
    try:
        results["reddit"] = publish_all_to_reddit()
    except Exception as e:
        logger.error(f"Reddit publishing failed: {e}")
        results["reddit"] = 0

    # Twitter — live post, text only
    logger.info("--- Publishing to Twitter (text only, live) ---")
    try:
        results["twitter"] = publish_all_to_twitter()
    except Exception as e:
        logger.error(f"Twitter publishing failed: {e}")
        results["twitter"] = 0

    # Instagram — local queue
    logger.info("--- Queuing for Instagram (local) ---")
    try:
        results["instagram"] = queue_all_for_instagram()
    except Exception as e:
        logger.error(f"Instagram queuing failed: {e}")
        results["instagram"] = 0

    # LinkedIn — local queue
    logger.info("--- Queuing for LinkedIn (local) ---")
    try:
        results["linkedin"] = queue_all_for_linkedin()
    except Exception as e:
        logger.error(f"LinkedIn queuing failed: {e}")
        results["linkedin"] = 0

    # Update status for fully published/queued articles
    _update_final_status()

    logger.info(f"Publishing complete: {results}")
    return results


def _update_final_status() -> None:
    """Update article status to 'published' or 'queued' based on what was posted."""
    session = get_session()
    try:
        articles = session.query(Article).filter(Article.status == "ready").all()
        for article in articles:
            if article.reddit_posted or article.twitter_posted:
                article.status = "published"
            elif article.instagram_queued or article.linkedin_queued:
                article.status = "queued"
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating final status: {e}")
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Main pipeline runner
# ---------------------------------------------------------------------------

def run_pipeline(max_articles: int | None = None) -> None:
    """
    Run the complete pipeline from scrape to publish.

    Args:
        max_articles: Optional limit on articles to process per stage.
                      Useful for testing and controlling API usage.
    """
    start_time = time.time()

    logger.info("╔══════════════════════════════════════════════════════════╗")
    logger.info("║         NEWS AUTO-PIPELINE — Starting Run              ║")
    logger.info("╚══════════════════════════════════════════════════════════╝")

    if max_articles:
        logger.info(f"Article limit: {max_articles} per source/stage")

    # Initialize database
    init_db()
    logger.info("Database initialized")

    # Load sources
    sources = load_sources()

    # Stage 1: Scrape
    new_articles = stage_scrape(sources, max_articles)

    # Stage 2: AI Rewrite
    rewritten = stage_rewrite(max_articles)

    # Stage 3: Image Generation
    images = stage_image_gen(max_articles)

    # Stage 4: Publish / Queue
    publish_results = stage_publish()

    # Summary
    elapsed = time.time() - start_time
    total_pub = sum(publish_results.values())

    # Save PipelineRun history in DB
    try:
        from src.db.models import PipelineRun
        with get_session() as session:
            pr = PipelineRun(
                started_at=datetime.utcfromtimestamp(start_time),
                completed_at=datetime.utcnow(),
                status="completed",
                articles_scraped=new_articles,
                articles_rewritten=rewritten,
                images_generated=images,
                published_count=total_pub,
                duration_seconds=round(elapsed, 2)
            )
            session.add(pr)
            session.commit()
    except Exception as ex:
        logger.warning(f"Failed to record PipelineRun history: {ex}")

    logger.info("+----------------------------------------------------------+")
    logger.info("|              PIPELINE RUN COMPLETE                       |")
    logger.info("+----------------------------------------------------------+")
    logger.info(f"|  New articles scraped:    {new_articles:<30}|")
    logger.info(f"|  Articles rewritten:      {rewritten:<30}|")
    logger.info(f"|  Images generated:        {images:<30}|")
    logger.info(f"|  Reddit posted:           {publish_results.get('reddit', 0):<30}|")
    logger.info(f"|  Twitter posted:          {publish_results.get('twitter', 0):<30}|")
    logger.info(f"|  Instagram queued:        {publish_results.get('instagram', 0):<30}|")
    logger.info(f"|  LinkedIn queued:         {publish_results.get('linkedin', 0):<30}|")
    logger.info(f"|  Total time:              {elapsed:.1f}s{' ' * (29 - len(f'{elapsed:.1f}s'))}|")
    logger.info("+----------------------------------------------------------+")
