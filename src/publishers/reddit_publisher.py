import os
import time
import logging
import praw
from praw.exceptions import RedditAPIException, ClientException
from dotenv import load_dotenv
from typing import Optional
from src.db.models import Article, get_session

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_reddit_client() -> Optional[praw.Reddit]:
    """Initialize and return a praw.Reddit client."""
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    username = os.getenv("REDDIT_USERNAME")
    password = os.getenv("REDDIT_PASSWORD")

    if not all([client_id, client_secret, username, password]):
        logger.error("Missing Reddit credentials in environment variables.")
        return None

    try:
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent=f'NewsAutoPipeline/1.0 (by u/{username})',
            username=username,
            password=password
        )
        return reddit
    except Exception as e:
        logger.error(f"Failed to initialize Reddit client: {e}")
        return None

def publish_to_reddit(article_id: int) -> bool:
    """Publish a single article to Reddit."""
    reddit = get_reddit_client()
    if not reddit:
        return False

    with get_session() as session:
        article = session.query(Article).filter(Article.id == article_id).first()
        
        if not article:
            logger.warning(f"Article {article_id} not found.")
            return False
            
        if article.status != 'ready':
            logger.info(f"Article {article_id} is not ready (status: {article.status}).")
            return False
            
        if article.reddit_posted:
            logger.info(f"Article {article_id} already posted to Reddit.")
            return False

        if not article.subreddit:
            logger.warning(f"Article {article_id} has no target subreddit.")
            return False

        try:
            subreddit = reddit.subreddit(article.subreddit)
            
            # Use submit_image if image_path exists and file exists
            if article.image_path and os.path.exists(article.image_path):
                logger.info(f"Posting image to r/{article.subreddit} for article {article_id}")
                subreddit.submit_image(title=article.reddit_title, image_path=article.image_path)
            else:
                logger.info(f"Posting text to r/{article.subreddit} for article {article_id}")
                subreddit.submit(title=article.reddit_title, selftext=article.reddit_body)
                
            # Update database
            article.reddit_posted = True
            session.commit()
            logger.info(f"Successfully posted article {article_id} to Reddit.")
            return True
            
        except (RedditAPIException, ClientException) as e:
            logger.error(f"Reddit API Error for article {article_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error posting to Reddit for article {article_id}: {e}")
            return False

def publish_all_to_reddit() -> int:
    """Publish all ready and unposted articles to Reddit."""
    posted_count = 0
    with get_session() as session:
        articles = session.query(Article).filter(
            Article.status == 'ready', 
            Article.reddit_posted == False
        ).all()
        
        article_ids = [a.id for a in articles]
        
    for article_id in article_ids:
        if publish_to_reddit(article_id):
            posted_count += 1
            # Delay between posts (10 seconds)
            time.sleep(10)
            
    logger.info(f"Published {posted_count} articles to Reddit.")
    return posted_count
