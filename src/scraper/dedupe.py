import hashlib
import logging
from typing import List, Dict, Any

from src.db.models import Article, get_session

logger = logging.getLogger(__name__)

def compute_url_hash(url: str) -> str:
    """
    Compute a SHA-256 hash for a given URL.
    """
    return hashlib.sha256(url.encode('utf-8')).hexdigest()

def dedupe_and_store(articles: List[Dict[str, Any]]) -> int:
    """
    Deduplicate scraped articles based on URL hash and insert new ones into the database.
    """
    new_articles_count = 0
    session = get_session()
    
    try:
        for article_data in articles:
            url = article_data.get('url')
            if not url:
                continue
                
            url_hash = compute_url_hash(url)
            
            # Check if article exists
            existing = session.query(Article).filter_by(url_hash=url_hash).first()
            if existing:
                logger.debug(f"Article already exists: {url}")
                continue
                
            # Create new Article
            new_article = Article(
                url_hash=url_hash,
                url=url,
                title=article_data.get('title'),
                body=article_data.get('body'),
                author=article_data.get('author'),
                published_at=article_data.get('published_at'),
                source=article_data.get('source'),
                category=article_data.get('category'),
                subreddit=article_data.get('subreddit'),
                status='scraped'
            )
            
            session.add(new_article)
            new_articles_count += 1
            
        session.commit()
        logger.info(f"Inserted {new_articles_count} new articles into the database.")
    except Exception as e:
        session.rollback()
        logger.error(f"Error during dedupe_and_store: {e}", exc_info=True)
    finally:
        session.close()
        
    return new_articles_count
