import os
import time
import logging
import tweepy
from dotenv import load_dotenv
from typing import Optional
from src.db.models import Article, get_session

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_twitter_client() -> Optional[tweepy.Client]:
    """Initialize and return a tweepy.Client (v2 API)."""
    api_key = os.getenv("TWITTER_API_KEY")
    api_secret = os.getenv("TWITTER_API_SECRET")
    access_token = os.getenv("TWITTER_ACCESS_TOKEN")
    access_secret = os.getenv("TWITTER_ACCESS_SECRET")

    if not all([api_key, api_secret, access_token, access_secret]):
        logger.error("Missing Twitter credentials in environment variables.")
        return None

    try:
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret
        )
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Twitter client: {e}")
        return None

def publish_to_twitter(article_id: int) -> bool:
    """Publish a single article to Twitter (text only)."""
    client = get_twitter_client()
    if not client:
        return False

    with get_session() as session:
        article = session.query(Article).filter(Article.id == article_id).first()
        
        if not article:
            logger.warning(f"Article {article_id} not found.")
            return False
            
        if article.status != 'ready':
            logger.info(f"Article {article_id} is not ready (status: {article.status}).")
            return False
            
        if article.twitter_posted:
            logger.info(f"Article {article_id} already posted to Twitter.")
            return False

        if not article.twitter_text:
            logger.warning(f"Article {article_id} has no twitter text.")
            return False

        try:
            # Truncate text to 280 chars if needed
            tweet_text = article.twitter_text
            if len(tweet_text) > 280:
                tweet_text = tweet_text[:277] + "..."

            logger.info(f"Posting tweet for article {article_id}")
            client.create_tweet(text=tweet_text)
                
            # Update database
            article.twitter_posted = True
            session.commit()
            logger.info(f"Successfully posted article {article_id} to Twitter.")
            return True
            
        except tweepy.TweepyException as e:
            logger.error(f"Twitter API Error for article {article_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error posting to Twitter for article {article_id}: {e}")
            return False

def publish_all_to_twitter() -> int:
    """Publish all ready and unposted articles to Twitter."""
    posted_count = 0
    with get_session() as session:
        articles = session.query(Article).filter(
            Article.status == 'ready', 
            Article.twitter_posted == False
        ).all()
        
        article_ids = [a.id for a in articles]
        
    for article_id in article_ids:
        if publish_to_twitter(article_id):
            posted_count += 1
            # Delay between tweets (5 seconds)
            time.sleep(5)
            
    logger.info(f"Published {posted_count} articles to Twitter.")
    return posted_count
