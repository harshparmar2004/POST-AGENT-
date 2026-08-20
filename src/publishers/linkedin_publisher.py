"""
LinkedIn Publisher — Handles both live API publishing (if credentials provided)
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


def queue_for_linkedin(article_id: int) -> bool:
    """Publish to LinkedIn live API if credentials exist, otherwise queue locally."""
    token = os.getenv("LINKEDIN_ACCESS_TOKEN")
    author_urn = os.getenv("LINKEDIN_AUTHOR_URN")  # e.g., "urn:li:person:XXXXXX"

    with get_session() as session:
        article = session.query(Article).filter(Article.id == article_id).first()
        
        if not article or not article.title:
            logger.warning(f"Article {article_id} invalid or not found.")
            return False
            
        if article.linkedin_queued:
            logger.info(f"Article {article_id} already processed for LinkedIn.")
            return False

        # Live LinkedIn API Posting if credentials provided
        if token and author_urn and not token.startswith("your_"):
            try:
                text = article.linkedin_text or article.title
                logger.info(f"Publishing article {article_id} to LinkedIn API...")
                
                url = "https://api.linkedin.com/v2/ugcPosts"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "X-Restli-Protocol-Version": "2.0.0"
                }
                
                payload = {
                    "author": author_urn,
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary": {
                                "text": text
                            },
                            "shareMediaCategory": "NONE"
                        }
                    },
                    "visibility": {
                        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                    }
                }
                
                resp = requests.post(url, headers=headers, json=payload, timeout=10)
                
                if resp.status_code in [200, 201]:
                    article.linkedin_queued = True
                    session.commit()
                    logger.info(f"Successfully posted article {article_id} to LinkedIn live!")
                    return True
                else:
                    logger.warning(f"LinkedIn API response ({resp.status_code}): {resp.text}. Falling back to local queue.")
            except Exception as ex:
                logger.error(f"Live LinkedIn posting failed: {ex}. Falling back to local queue.")

        # Local Queue Fallback
        try:
            queue_dir = os.path.join(PROJECT_ROOT, "queue", "linkedin", str(article_id))
            os.makedirs(queue_dir, exist_ok=True)
            
            image_filename = None
            if article.image_path and os.path.exists(article.image_path):
                image_filename = "image.png"
                dest_path = os.path.join(queue_dir, image_filename)
                shutil.copy2(article.image_path, dest_path)
            
            post_data = {
                "text": article.linkedin_text,
                "image_path": image_filename,
                "source": article.source,
                "title": article.title,
                "created_at": datetime.utcnow().isoformat() + "Z"
            }
            
            json_path = os.path.join(queue_dir, "post.json")
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(post_data, f, indent=4)
                
            article.linkedin_queued = True
            session.commit()
            logger.info(f"Successfully queued article {article_id} for LinkedIn locally.")
            return True
            
        except Exception as e:
            logger.error(f"Error queuing article {article_id} for LinkedIn: {e}")
            return False


def queue_all_for_linkedin() -> int:
    """Queue all ready and unqueued articles for LinkedIn."""
    queued_count = 0
    with get_session() as session:
        articles = session.query(Article).filter(
            Article.linkedin_queued == False
        ).all()
        article_ids = [a.id for a in articles]
        
    for article_id in article_ids:
        if queue_for_linkedin(article_id):
            queued_count += 1
            
    logger.info(f"Processed {queued_count} articles for LinkedIn.")
    return queued_count
