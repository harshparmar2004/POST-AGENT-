"""
FastAPI route definitions for the NewsFlow dashboard.
Serves API endpoints for stats, articles, sources, queues, logs, and pipeline triggers.
"""

import os
import json
import yaml
import asyncio
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import func, desc

from src.db.models import Article, get_session
from src.orchestrator import run_pipeline, load_sources

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOG_FILE_PATH = os.path.join(PROJECT_ROOT, "logs", "pipeline.log")
IMAGES_DIR = os.path.join(PROJECT_ROOT, "images")
QUEUE_DIR = os.path.join(PROJECT_ROOT, "queue")

# Track background pipeline state
_pipeline_state = {
    "is_running": False,
    "last_run": None,
    "last_duration_seconds": None,
    "last_result": None,
    "current_stage": None
}


def _run_pipeline_background(max_articles: Optional[int] = None):
    """Background runner for pipeline execution."""
    global _pipeline_state
    _pipeline_state["is_running"] = True
    _pipeline_state["current_stage"] = "Running pipeline"
    start = datetime.utcnow()
    
    try:
        run_pipeline(max_articles=max_articles)
        duration = (datetime.utcnow() - start).total_seconds()
        _pipeline_state["last_run"] = datetime.utcnow().isoformat() + "Z"
        _pipeline_state["last_duration_seconds"] = round(duration, 1)
        _pipeline_state["last_result"] = "success"
    except Exception as e:
        logger.exception(f"Background pipeline run failed: {e}")
        _pipeline_state["last_result"] = f"error: {str(e)}"
    finally:
        _pipeline_state["is_running"] = False
        _pipeline_state["current_stage"] = None


# ---------------------------------------------------------------------------
# Overview & Stats Endpoints
# ---------------------------------------------------------------------------

@router.get("/stats")
def get_stats():
    """Returns overview statistics for dashboard metrics, platform distribution, categories and sources."""
    with get_session() as session:
        total = session.query(func.count(Article.id)).scalar() or 0
        scraped = session.query(func.count(Article.id)).filter(Article.status == "scraped").scalar() or 0
        ready = session.query(func.count(Article.id)).filter(Article.status == "ready").scalar() or 0
        published = session.query(func.count(Article.id)).filter(Article.status == "published").scalar() or 0
        queued = session.query(func.count(Article.id)).filter(Article.status == "queued").scalar() or 0
        failed = session.query(func.count(Article.id)).filter(Article.status == "failed").scalar() or 0

        reddit_posted = session.query(func.count(Article.id)).filter(Article.reddit_posted == True).scalar() or 0
        twitter_posted = session.query(func.count(Article.id)).filter(Article.twitter_posted == True).scalar() or 0
        instagram_queued = session.query(func.count(Article.id)).filter(Article.instagram_queued == True).scalar() or 0
        linkedin_queued = session.query(func.count(Article.id)).filter(Article.linkedin_queued == True).scalar() or 0

        # Category breakdown
        cat_rows = session.query(Article.category, func.count(Article.id)).group_by(Article.category).all()
        categories = {cat or "General": cnt for cat, cnt in cat_rows}

        # Source breakdown
        src_rows = session.query(Article.source, func.count(Article.id)).group_by(Article.source).all()
        sources_breakdown = {src or "Unknown": cnt for src, cnt in src_rows}

    return {
        "summary": {
            "total": total,
            "scraped": scraped,
            "ready": ready,
            "published": published,
            "queued": queued,
            "failed": failed,
        },
        "platforms": {
            "reddit": reddit_posted,
            "twitter": twitter_posted,
            "instagram": instagram_queued,
            "linkedin": linkedin_queued,
        },
        "categories": categories,
        "sources": sources_breakdown,
        "pipeline": _pipeline_state
    }


@router.get("/stats/timeline")
def get_timeline(days: int = 14):
    """Returns article count timeline grouped by date for charts."""
    with get_session() as session:
        cutoff = datetime.utcnow() - timedelta(days=days)
        articles = session.query(Article.scraped_at, Article.status).filter(Article.scraped_at >= cutoff).all()

    timeline_data: Dict[str, Dict[str, int]] = {}
    for i in range(days):
        day_str = (datetime.utcnow() - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        timeline_data[day_str] = {"total": 0, "published": 0, "ready": 0, "scraped": 0, "queued": 0}

    for scraped_at, status in articles:
        if scraped_at:
            day_str = scraped_at.strftime("%Y-%m-%d")
            if day_str in timeline_data:
                timeline_data[day_str]["total"] += 1
                if status in timeline_data[day_str]:
                    timeline_data[day_str][status] += 1

    labels = list(timeline_data.keys())
    totals = [v["total"] for v in timeline_data.values()]
    published = [v["published"] for v in timeline_data.values()]
    ready = [v["ready"] for v in timeline_data.values()]

    return {
        "labels": labels,
        "totals": totals,
        "published": published,
        "ready": ready
    }


# ---------------------------------------------------------------------------
# Article Management Endpoints
# ---------------------------------------------------------------------------

@router.get("/articles")
def list_articles(
    status: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Paginated list of articles with filtering and search."""
    with get_session() as session:
        query = session.query(Article)

        if status and status != "all":
            query = query.filter(Article.status == status)

        if source and source != "all":
            query = query.filter(Article.source == source)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Article.title.ilike(search_pattern)) | 
                (Article.body.ilike(search_pattern)) | 
                (Article.source.ilike(search_pattern))
            )

        total_count = query.count()
        query = query.order_by(desc(Article.id))
        query = query.offset((page - 1) * limit).limit(limit)
        items = query.all()

        articles_data = []
        for a in items:
            articles_data.append({
                "id": a.id,
                "title": a.title,
                "source": a.source,
                "url": a.url,
                "author": a.author,
                "category": a.category,
                "subreddit": a.subreddit,
                "status": a.status,
                "scraped_at": a.scraped_at.isoformat() if a.scraped_at else None,
                "published_at": a.published_at.isoformat() if a.published_at else None,
                "has_image": bool(a.image_path and os.path.exists(a.image_path)),
                "image_url": f"/api/images/{a.id}.png" if a.image_path and os.path.exists(a.image_path) else None,
                "platforms": {
                    "reddit": a.reddit_posted,
                    "twitter": a.twitter_posted,
                    "instagram": a.instagram_queued,
                    "linkedin": a.linkedin_queued,
                }
            })

    return {
        "articles": articles_data,
        "pagination": {
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1
        }
    }


@router.get("/articles/{article_id}")
def get_article(article_id: int):
    """Returns complete article detail including all generated AI social content."""
    with get_session() as session:
        a = session.query(Article).filter(Article.id == article_id).first()
        if not a:
            raise HTTPException(status_code=404, detail="Article not found")

        return {
            "id": a.id,
            "url_hash": a.url_hash,
            "title": a.title,
            "body": a.body,
            "source": a.source,
            "url": a.url,
            "author": a.author,
            "category": a.category,
            "subreddit": a.subreddit,
            "status": a.status,
            "scraped_at": a.scraped_at.isoformat() if a.scraped_at else None,
            "published_at": a.published_at.isoformat() if a.published_at else None,
            "ai_content": {
                "twitter_text": a.twitter_text,
                "linkedin_text": a.linkedin_text,
                "instagram_caption": a.instagram_caption,
                "reddit_title": a.reddit_title,
                "reddit_body": a.reddit_body,
            },
            "image_path": a.image_path,
            "image_url": f"/api/images/{a.id}.png" if a.image_path and os.path.exists(a.image_path) else None,
            "posting_status": {
                "reddit": a.reddit_posted,
                "twitter": a.twitter_posted,
                "instagram": a.instagram_queued,
                "linkedin": a.linkedin_queued,
            }
        }


@router.post("/articles/{article_id}/publish")
def publish_single_article(article_id: int):
    """Publish a single article live across Reddit, Twitter, Instagram, and LinkedIn."""
    from src.publishers.reddit_publisher import publish_to_reddit
    from src.publishers.twitter_publisher import tweet_article
    from src.publishers.instagram_publisher import queue_for_instagram
    from src.publishers.linkedin_publisher import queue_for_linkedin

    r_ok = publish_to_reddit(article_id)
    t_ok = tweet_article(article_id)
    i_ok = queue_for_instagram(article_id)
    l_ok = queue_for_linkedin(article_id)

    with get_session() as session:
        a = session.query(Article).filter(Article.id == article_id).first()
        if a:
            a.status = "published"
            session.commit()

    return {
        "success": True,
        "message": f"Article {article_id} published across connected APIs!",
        "results": {
            "reddit": r_ok,
            "twitter": t_ok,
            "instagram": i_ok,
            "linkedin": l_ok
        }
    }


@router.delete("/articles/{article_id}")
def delete_article(article_id: int):
    """Delete an article from database and remove associated image/queue files."""
    with get_session() as session:
        a = session.query(Article).filter(Article.id == article_id).first()
        if not a:
            raise HTTPException(status_code=404, detail="Article not found")

        # Cleanup image file if exists
        if a.image_path and os.path.exists(a.image_path):
            try:
                os.remove(a.image_path)
            except Exception as e:
                logger.warning(f"Could not remove image file {a.image_path}: {e}")

        session.delete(a)
        session.commit()

    return {"success": True, "message": f"Article {article_id} deleted"}


# ---------------------------------------------------------------------------
# Sources & Configuration
# ---------------------------------------------------------------------------

@router.get("/sources")
def get_sources_list():
    """List all sources from config YAML merged with live database statistics."""
    sources_cfg = load_sources()
    
    with get_session() as session:
        # Article counts per source
        counts_raw = session.query(Article.source, func.count(Article.id)).group_by(Article.source).all()
        counts_map = {src: count for src, count in counts_raw}

    result = []
    for s in sources_cfg:
        name = s.get("name")
        result.append({
            "name": name,
            "url": s.get("url"),
            "feed_url": s.get("feed_url"),
            "tier": s.get("tier", 1),
            "category": s.get("category"),
            "subreddit": s.get("subreddit"),
            "delay_seconds": s.get("delay_seconds", 2),
            "max_articles": s.get("max_articles", 5),
            "article_count": counts_map.get(name, 0)
        })

    return {"sources": result}


@router.post("/sources")
def add_source(source_data: Dict[str, Any]):
    """Add a new news source via URL directly to sources.yaml."""
    name = source_data.get("name", "").strip()
    url = source_data.get("url", "").strip()
    feed_url = source_data.get("feed_url", "").strip() or None
    tier = int(source_data.get("tier", 1))
    category = source_data.get("category", "tech").strip()
    subreddit = source_data.get("subreddit", "technology").strip()
    delay_seconds = int(source_data.get("delay_seconds", 2))
    max_articles = int(source_data.get("max_articles", 5))

    if not url:
        raise HTTPException(status_code=400, detail="Website URL is required")

    if not name:
        from urllib.parse import urlparse
        name = urlparse(url).netloc.replace("www.", "").capitalize()

    # Simple RSS auto-detection if feed_url not specified and tier == 1
    if tier == 1 and not feed_url:
        import feedparser
        possible_feeds = [
            url.rstrip("/") + "/feed/",
            url.rstrip("/") + "/rss",
            url.rstrip("/") + "/feed",
            url.rstrip("/") + "/rss.xml",
            url.rstrip("/") + "/index.xml"
        ]
        for pf in possible_feeds:
            try:
                parsed = feedparser.parse(pf)
                if parsed.entries:
                    feed_url = pf
                    break
            except Exception:
                pass

    config_file = os.path.join(PROJECT_ROOT, "config", "sources.yaml")
    
    with open(config_file, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}

    sources = cfg.get("sources", [])
    
    # Check duplicate
    for existing in sources:
        if existing.get("url") == url or existing.get("name") == name:
            raise HTTPException(status_code=400, detail="Source with this URL or name already exists!")

    new_source = {
        "name": name,
        "url": url,
        "feed_url": feed_url,
        "tier": tier,
        "category": category,
        "subreddit": subreddit,
        "delay_seconds": delay_seconds,
        "max_articles": max_articles
    }

    sources.append(new_source)
    cfg["sources"] = sources

    with open(config_file, "w", encoding="utf-8") as f:
        yaml.safe_dump(cfg, f, sort_keys=False)

    return {"success": True, "message": f"Source '{name}' added successfully!", "source": new_source}


# ---------------------------------------------------------------------------
# Auto-Pilot Mode Scheduler
# ---------------------------------------------------------------------------

_autopilot_state = {
    "enabled": False,
    "interval_minutes": 15,
    "last_run": None,
    "next_run": None
}

_autopilot_task = None


async def _autopilot_loop():
    logger.info("Auto-Pilot loop started")
    while _autopilot_state["enabled"]:
        interval_secs = _autopilot_state["interval_minutes"] * 60
        _autopilot_state["next_run"] = (datetime.utcnow() + timedelta(seconds=interval_secs)).isoformat() + "Z"
        
        await asyncio.sleep(interval_secs)
        
        if not _autopilot_state["enabled"]:
            break
            
        if not _pipeline_state["is_running"]:
            logger.info("Auto-Pilot: Triggering scheduled automatic pipeline check...")
            _autopilot_state["last_run"] = datetime.utcnow().isoformat() + "Z"
            _run_pipeline_background(max_articles=3)


@router.get("/autopilot")
def get_autopilot_status():
    return _autopilot_state


@router.post("/autopilot")
async def toggle_autopilot(data: Dict[str, Any]):
    global _autopilot_task, _autopilot_state
    
    enabled = bool(data.get("enabled", False))
    interval = int(data.get("interval_minutes", 15))
    
    _autopilot_state["enabled"] = enabled
    _autopilot_state["interval_minutes"] = interval
    
    if enabled:
        if _autopilot_task is None or _autopilot_task.done():
            _autopilot_task = asyncio.create_task(_autopilot_loop())
        msg = f"Auto-Pilot ENABLED! Checking sources every {interval} minutes."
    else:
        if _autopilot_task and not _autopilot_task.done():
            _autopilot_task.cancel()
        _autopilot_state["next_run"] = None
        msg = "Auto-Pilot DISABLED."
        
    return {"success": True, "message": msg, "state": _autopilot_state}


# ---------------------------------------------------------------------------
# Local Queue Viewer (Instagram & LinkedIn)
# ---------------------------------------------------------------------------

@router.get("/queue/{platform}")
def get_queue(platform: str):
    """Returns queued posts for instagram or linkedin."""
    if platform not in ["instagram", "linkedin"]:
        raise HTTPException(status_code=400, detail="Invalid platform. Use 'instagram' or 'linkedin'.")

    platform_dir = os.path.join(QUEUE_DIR, platform)
    if not os.path.exists(platform_dir):
        return {"items": []}

    items = []
    for article_id in sorted(os.listdir(platform_dir), reverse=True):
        item_dir = os.path.join(platform_dir, article_id)
        if not os.path.isdir(item_dir):
            continue

        json_file = os.path.join(item_dir, "post.json")
        if not os.path.exists(json_file):
            continue

        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            image_file = os.path.join(item_dir, "image.png")
            has_image = os.path.exists(image_file)

            items.append({
                "article_id": article_id,
                "platform": platform,
                "title": data.get("title", f"Article #{article_id}"),
                "source": data.get("source", "Unknown"),
                "content": data.get("caption") if platform == "instagram" else data.get("text"),
                "created_at": data.get("created_at"),
                "has_image": has_image,
                "image_url": f"/api/queue/{platform}/{article_id}/image.png" if has_image else None
            })
        except Exception as e:
            logger.error(f"Error reading queue item {item_dir}: {e}")

    return {"items": items}


@router.get("/queue/{platform}/{article_id}/image.png")
def get_queue_image(platform: str, article_id: str):
    """Serve image for a queued item."""
    img_path = os.path.join(QUEUE_DIR, platform, article_id, "image.png")
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Queue image not found")
    return FileResponse(img_path, media_type="image/png")


# ---------------------------------------------------------------------------
# Images & Logs
# ---------------------------------------------------------------------------

@router.get("/images/{article_id}.png")
def get_article_image(article_id: int):
    """Serve article thumbnail image."""
    img_path = os.path.join(IMAGES_DIR, f"{article_id}.png")
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(img_path, media_type="image/png")


@router.get("/logs")
def get_logs(lines: int = 200):
    """Returns the tail of the log file."""
    if not os.path.exists(LOG_FILE_PATH):
        return {"logs": ["Log file does not exist yet. Run the pipeline first."]}

    try:
        with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
            all_lines = f.readlines()
            tail = [line.strip() for line in all_lines[-lines:]]
            return {"logs": tail, "total_lines": len(all_lines)}
    except Exception as e:
        return {"logs": [f"Error reading log file: {e}"]}


# ---------------------------------------------------------------------------
# Pipeline Trigger
# ---------------------------------------------------------------------------

@router.post("/pipeline/run")
def trigger_pipeline(max_articles: Optional[int] = Query(None, description="Max articles per source/stage")):
    """Triggers the full automation pipeline asynchronously in the background."""
    global _pipeline_state
    if _pipeline_state["is_running"]:
        return JSONResponse(
            status_code=400,
            content={"message": "Pipeline is already running!", "state": _pipeline_state}
        )

    # Start task in background thread
    asyncio.create_task(asyncio.to_thread(_run_pipeline_background, max_articles))

    return {
        "success": True,
        "message": f"Pipeline triggered in background! (max_articles={max_articles or 'default'})",
        "state": _pipeline_state
    }


@router.get("/pipeline/status")
def get_pipeline_status():
    """Returns current execution status of the pipeline."""
    return _pipeline_state


@router.get("/pipeline/history")
def get_pipeline_history(limit: int = 50):
    """Returns past pipeline batch execution runs history from SQLite database."""
    from src.db.models import PipelineRun
    with get_session() as session:
        runs = session.query(PipelineRun).order_by(PipelineRun.id.desc()).limit(limit).all()
        return {"history": [r.to_dict() for r in runs]}


# ---------------------------------------------------------------------------
# Settings & API Keys Management
# ---------------------------------------------------------------------------

ENV_KEYS = [
    "GOOGLE_API_KEY",
    "REDDIT_CLIENT_ID",
    "REDDIT_CLIENT_SECRET",
    "REDDIT_USERNAME",
    "REDDIT_PASSWORD",
    "TWITTER_API_KEY",
    "TWITTER_API_SECRET",
    "TWITTER_ACCESS_TOKEN",
    "TWITTER_ACCESS_SECRET",
    "INSTAGRAM_ACCESS_TOKEN",
    "INSTAGRAM_ACCOUNT_ID",
    "LINKEDIN_ACCESS_TOKEN",
    "LINKEDIN_AUTHOR_URN",
]

def _mask_val(val: Optional[str]) -> str:
    if not val:
        return ""
    if len(val) <= 8:
        return "*******"
    return val[:4] + "..." + val[-4:]


@router.get("/settings")
def get_settings():
    """Returns current environment key presence and masked key values."""
    env_file = os.path.join(PROJECT_ROOT, ".env")
    has_file = os.path.exists(env_file)
    
    keys_data = {}
    for k in ENV_KEYS:
        val = os.getenv(k, "")
        keys_data[k] = {
            "set": bool(val and not val.startswith("your_")),
            "masked": _mask_val(val) if val and not val.startswith("your_") else "",
            "raw": val if val and not val.startswith("your_") else ""
        }
        
    return {
        "env_file_exists": has_file,
        "keys": keys_data
    }


@router.post("/settings")
def update_settings(settings: Dict[str, str]):
    """Update API keys in .env file and live os.environ."""
    env_path = os.path.join(PROJECT_ROOT, ".env")
    
    existing = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    existing[k.strip()] = v.strip()

    # Update with new values provided
    for k in ENV_KEYS:
        if k in settings:
            new_val = settings[k].strip()
            if new_val and not new_val.startswith("****"):
                existing[k] = new_val
                os.environ[k] = new_val

    # Write updated .env
    with open(env_path, "w", encoding="utf-8") as f:
        f.write("# News Auto-Pipeline Environment Keys (Saved via Web Dashboard)\n")
        for k, v in existing.items():
            f.write(f"{k}={v}\n")

    return {"success": True, "message": ".env settings updated successfully!"}

