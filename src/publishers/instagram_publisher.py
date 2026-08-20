import os
import json
import shutil
import logging
from datetime import datetime
from src.db.models import Article, get_session

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def queue_for_instagram(article_id: int) -> bool:
    """Queue a single article for Instagram posting locally."""
    with get_session() as session:
        article = session.query(Article).filter(Article.id == article_id).first()
        
        if not article:
            logger.warning(f"Article {article_id} not found.")
            return False
            
        if article.status != 'ready':
            logger.info(f"Article {article_id} is not ready (status: {article.status}).")
            return False
            
        if article.instagram_queued:
            logger.info(f"Article {article_id} already queued for Instagram.")
            return False

        try:
            # Create directory
            queue_dir = os.path.join(PROJECT_ROOT, "queue", "instagram", str(article_id))
            os.makedirs(queue_dir, exist_ok=True)
            
            image_filename = None
            # Copy image if exists
            if article.image_path and os.path.exists(article.image_path):
                # We always call it image.png as specified in prompt, but we can preserve ext if needed.
                # Prompt said: copy image to queue/instagram/{article_id}/image.png using shutil.copy2
                image_filename = "image.png"
                dest_path = os.path.join(queue_dir, image_filename)
                shutil.copy2(article.image_path, dest_path)
            
            # Write post.json
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
                
            # Update database
            article.instagram_queued = True
            session.commit()
            logger.info(f"Successfully queued article {article_id} for Instagram.")
            return True
            
        except Exception as e:
            logger.error(f"Error queuing article {article_id} for Instagram: {e}")
            return False

def queue_all_for_instagram() -> int:
    """Queue all ready and unqueued articles for Instagram."""
    queued_count = 0
    with get_session() as session:
        articles = session.query(Article).filter(
            Article.status == 'ready', 
            Article.instagram_queued == False
        ).all()
        
        article_ids = [a.id for a in articles]
        
    for article_id in article_ids:
        if queue_for_instagram(article_id):
            queued_count += 1
            
    logger.info(f"Queued {queued_count} articles for Instagram.")
    return queued_count
