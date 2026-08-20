"""
Orchestrator — Main pipeline coordinator with user abort support.

Runs the full news automation pipeline in sequence:
  1. Scrape articles from all configured sources
  2. Deduplicate and store in SQLite
  3. Rewrite with LLM AI (Groq/OpenAI/Claude/Gemini)
  4. Generate thumbnail images with Nano Banana / PIL
  5. Publish to Reddit, Twitter, Instagram & LinkedIn APIs
"""

import os
import sys
import time
import logging
from typing import Any
from datetime import datetime

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

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(PROJECT_ROOT, "config", "sources.yaml")

_ABORT_REQUESTED = False


def request_abort():
    """Signals all active pipeline loops to stop immediately to save API credits."""
    global _ABORT_REQUESTED
    _ABORT_REQUESTED = True
    logger.warning("🛑 Pipeline abort requested by user! Halting pipeline execution...")


def is_abort_requested() -> bool:
    global _ABORT_REQUESTED
    return _ABORT_REQUESTED


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


def stage_scrape(sources: list[dict], max_articles: int | None = None) -> int:
    """Stage 1: Scrape articles from all configured sources."""
    logger.info("=" * 60)
    logger.info("STAGE 1: SCRAPING ARTICLES")
    logger.info("=" * 60)

    total_new = 0
    total_scraped = 0

    for source in sources:
        if is_abort_requested():
            logger.warning("Stage 1 aborted by user.")
            break

        name = source.get("name", "Unknown")
        tier = source.get("tier", 1)

        if max_articles is not None:
            source = {**source, "max_articles": min(source.get("max_articles", 5), max_articles)}

        try:
            if tier == 1:
                articles = scrape_feed(source)
            elif tier == 2:
                articles = scrape_with_ai(source)
            else:
                articles = scrape_html(source)

            total_scraped += len(articles)
            if articles:
                new_count = dedupe_and_store(articles)
                total_new += new_count
                logger.info(f"{name}: {len(articles)} scraped, {new_count} new stored")
            else:
                logger.info(f"{name}: 0 articles extracted")

        except Exception as e:
            logger.error(f"Error scraping {name}: {e}")

    logger.info(f"Stage 1 complete: {total_scraped} articles scraped, {total_new} new stored")
    return total_new


def stage_rank(max_articles: int | None = None) -> int:
    """Stage 2: AI Agent News Ranking & Scoring (1-100)."""
    logger.info("=" * 60)
    logger.info("STAGE 2: AI AGENT NEWS RANKING & FILTERING (1-100)")
    logger.info("=" * 60)

    from src.ai.ranker import rank_article

    with get_session() as session:
        articles = session.query(Article).all()
        article_ids = [a.id for a in articles]

    if max_articles is not None:
        article_ids = article_ids[:max_articles]

    logger.info(f"Ranking {len(article_ids)} articles using AI Ranking Prompt...")
    ranked_count = 0

    for aid in article_ids:
        if is_abort_requested():
            logger.warning("Stage 2 AI Ranking aborted by user.")
            break

        try:
            if rank_article(aid):
                ranked_count += 1
        except Exception as e:
            logger.error(f"Failed to rank article #{aid}: {e}")

    logger.info(f"Stage 2 complete: {ranked_count}/{len(article_ids)} articles ranked with scores 1-100")
    return ranked_count


def stage_rewrite(max_articles: int | None = None) -> int:
    """Stage 2: Rewrite pending articles using active LLM."""
    logger.info("=" * 60)
    logger.info("STAGE 2: AI REWRITING ARTICLES")
    logger.info("=" * 60)

    with get_session() as session:
        articles = session.query(Article).filter(Article.status == "scraped").all()
        article_ids = [a.id for a in articles]

    if max_articles is not None:
        article_ids = article_ids[:max_articles]

    logger.info(f"Found {len(article_ids)} articles needing AI rewrite")
    rewritten_count = 0

    for aid in article_ids:
        if is_abort_requested():
            logger.warning("Stage 2 AI Rewrite aborted by user.")
            break

        try:
            if rewrite_article(aid):
                rewritten_count += 1
                logger.info(f"Rewrote article #{aid}")
        except Exception as e:
            logger.error(f"Failed to rewrite article #{aid}: {e}")

    logger.info(f"Stage 2 complete: {rewritten_count}/{len(article_ids)} rewritten")
    return rewritten_count


def stage_image_gen(max_articles: int | None = None) -> int:
    """Stage 3: Generate Nano Banana slide images."""
    logger.info("=" * 60)
    logger.info("STAGE 3: NANO BANANA IMAGE GENERATION")
    logger.info("=" * 60)

    with get_session() as session:
        articles = session.query(Article).filter(
            Article.twitter_text.isnot(None),
            Article.image_path.is_(None)
        ).all()
        article_ids = [a.id for a in articles]

    if max_articles is not None:
        article_ids = article_ids[:max_articles]

    logger.info(f"Found {len(article_ids)} articles needing images")
    image_count = 0

    for aid in article_ids:
        if is_abort_requested():
            logger.warning("Stage 3 Image Gen aborted by user.")
            break

        try:
            if generate_image(aid):
                image_count += 1
                logger.info(f"Generated image for article #{aid}")
        except Exception as e:
            logger.error(f"Failed image gen for article #{aid}: {e}")

    logger.info(f"Stage 3 complete: {image_count}/{len(article_ids)} images generated")
    return image_count


def stage_publish() -> dict[str, int]:
    """Stage 4: Multi-API Social Posting."""
    logger.info("=" * 60)
    logger.info("STAGE 4: MULTI-API SOCIAL PUBLISHING")
    logger.info("=" * 60)

    results = {"reddit": 0, "twitter": 0, "instagram": 0, "linkedin": 0}

    if is_abort_requested():
        logger.warning("Stage 4 aborted by user.")
        return results

    try:
        results["reddit"] = publish_all_to_reddit()
    except Exception as e:
        logger.error(f"Reddit posting failed: {e}")

    try:
        results["twitter"] = publish_all_to_twitter()
    except Exception as e:
        logger.error(f"Twitter posting failed: {e}")

    try:
        results["instagram"] = queue_all_for_instagram()
    except Exception as e:
        logger.error(f"Instagram processing failed: {e}")

    try:
        results["linkedin"] = queue_all_for_linkedin()
    except Exception as e:
        logger.error(f"LinkedIn processing failed: {e}")

    return results


def run_pipeline(max_articles: int | None = None):
    """Runs full automation pipeline."""
    global _ABORT_REQUESTED
    _ABORT_REQUESTED = False  # Reset flag at start
    start_time = time.time()

    logger.info("==========================================================")
    logger.info("         NEWS AUTO-PIPELINE — Starting Run                ")
    logger.info("==========================================================")

    init_db()
    sources = load_sources()

    new_articles = stage_scrape(sources, max_articles)
    ranked_count = stage_rank(max_articles)
    rewritten = stage_rewrite(max_articles)
    images = stage_image_gen(max_articles)
    publish_results = stage_publish()

    elapsed = time.time() - start_time
    total_pub = sum(publish_results.values())
    status_label = "stopped_by_user" if is_abort_requested() else "completed"

    try:
        from src.db.models import PipelineRun
        with get_session() as session:
            pr = PipelineRun(
                started_at=datetime.utcfromtimestamp(start_time),
                completed_at=datetime.utcnow(),
                status=status_label,
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
    logger.info(f"|   PIPELINE RUN {status_label.upper():<36}|")
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
