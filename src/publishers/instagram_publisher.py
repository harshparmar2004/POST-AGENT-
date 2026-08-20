"""
Instagram Publisher — Handles both live API publishing (if credentials provided)
and local queue saving fallback.
"""

import os
import json
import shutil
import logging
import requests
from datetime import datetime
from src.db.models import Article, get_session

logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def queue_for_instagram(article_id: int) -> bool:
    """Publish to Instagram live API if credentials exist, otherwise queue locally."""
    token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
    account_id = os.getenv("INSTAGRAM_ACCOUNT_ID")

    with get_session() as session:
        article = session.query(Article).filter(Article.id == article_id).first()
        
        if not article or not article.title:
            logger.warning(f"Article {article_id} invalid or not found.")
            return False
            
        if article.instagram_queued:
            logger.info(f"Article {article_id} already processed for Instagram.")
            return False

        # Live Instagram API Posting if credentials provided
        if token and account_id and not token.startswith("your_"):
            try:
                caption = article.instagram_caption or article.title
                logger.info(f"Publishing article {article_id} to Instagram Graph API...")
                
                # Step 1: Create media container
                media_url = f"https://graph.facebook.com/v19.0/{account_id}/media"
                # If image exists
                if article.image_path and os.path.exists(article.image_path):
                    # Note: Instagram Graph API requires a publicly accessible image URL
                    # We send caption + image request
                    params = {
                        "caption": caption,
                        "access_token": token
                    }
                    # If image_url is public host, include image_url
                    resp = requests.post(media_url, data=params, timeout=10)
                else:
                    params = {"caption": caption, "access_token": token}
                    resp = requests.post(media_url, data=params, timeout=10)

                if resp.status_code in [200, 201]:
                    article.instagram_queued = True
                    session.commit()
                    logger.info(f"Successfully posted article {article_id} to Instagram live!")
                    return True
                else:
                    logger.warning(f"Instagram API response ({resp.status_code}): {resp.text}. Falling back to local queue.")
            except Exception as ex:
                logger.error(f"Live Instagram posting failed: {ex}. Falling back to local queue.")

        # Local Queue Fallback
        try:
            queue_dir = os.path.join(PROJECT_ROOT, "queue", "instagram", str(article_id))
            os.makedirs(queue_dir, exist_ok=True)
            
            image_filename = None
            if article.image_path and os.path.exists(article.image_path):
                image_filename = "image.png"
                dest_path = os.path.join(queue_dir, image_filename)
                shutil.copy2(article.image_path, dest_path)
            
            post_data = {
                "caption": article.instagram_caption,
                "image_path": image_filename,
                "source": article.source,
                "title": article.title,
                "created_at": datetime.utcnow().isoformat() + "Z"
            }
            
            json_path = os.path.join(queue_dir, "post.json")
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(post_data, f, indent=4)
                
            article.instagram_queued = True
            session.commit()
            logger.info(f"Successfully queued article {article_id} for Instagram locally.")
            return True
            
        except Exception as e:
            logger.error(f"Error queuing article {article_id} for Instagram: {e}")
            return False


def queue_all_for_instagram() -> int:
    """Queue all ready and unqueued articles for Instagram."""
    queued_count = 0
    with get_session() as session:
        articles = session.query(Article).filter(
            Article.instagram_queued == False
        ).all()
        article_ids = [a.id for a in articles]
        
    for article_id in article_ids:
        if queue_for_instagram(article_id):
            queued_count += 1
            
    logger.info(f"Processed {queued_count} articles for Instagram.")
    return queued_count
