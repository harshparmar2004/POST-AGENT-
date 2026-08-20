import time
import logging
import datetime
from typing import List, Dict, Any
from urllib.parse import urlparse

import feedparser
from robotexclusionrulesparser import RobotExclusionRulesParser
import trafilatura
from newspaper import Article as NewspaperArticle

logger = logging.getLogger(__name__)

rerp = RobotExclusionRulesParser()

def is_allowed(url: str, user_agent: str = 'NewsAutoPipeline/1.0') -> bool:
    """
    Check if scraping the URL is allowed by the site's robots.txt.
    """
    try:
        parsed_url = urlparse(url)
        robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
        rerp.fetch(robots_url)
        return rerp.is_allowed(user_agent, url)
    except Exception as e:
        logger.warning(f"Failed to check robots.txt for {url}: {e}")
        # Default to allowed if we can't fetch/parse robots.txt
        return True

def scrape_feed(source: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Scrape an RSS/Atom feed based on the provided source configuration.
    """
    name = source.get('name', 'Unknown')
    feed_url = source.get('feed_url')
    max_articles = source.get('max_articles', 10)
    delay_seconds = source.get('delay_seconds', 2)
    category = source.get('category')
    subreddit = source.get('subreddit')

    if not feed_url:
        logger.error(f"No feed_url provided for source {name}")
        return []

    logger.info(f"Parsing feed for {name} from {feed_url}")
    try:
        feed = feedparser.parse(feed_url)
    except Exception as e:
        logger.error(f"Failed to parse feed {feed_url}: {e}")
        return []

    articles = []
    
    entries = feed.entries[:max_articles]
    for entry in entries:
        try:
            url = entry.get('link')
            title = entry.get('title')
            
            if not url or not title:
                logger.warning(f"Missing url or title for entry in {name} feed, skipping.")
                continue

            # Parse published date
            published_at = datetime.datetime.utcnow()
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                published_at = datetime.datetime(*entry.published_parsed[:6])

            if not is_allowed(url):
                logger.warning(f"Scraping not allowed by robots.txt for URL: {url}")
                continue

            logger.info(f"Fetching article content for: {url}")
            body = None
            author = None
            
            # Fetch with trafilatura
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                extracted = trafilatura.extract(downloaded, output_format="json")
                if extracted:
                    import json
                    try:
                        ext_dict = json.loads(extracted)
                        body = ext_dict.get('text')
                        author = ext_dict.get('author')
                    except Exception:
                        body = trafilatura.extract(downloaded)

            # Fallback to newspaper3k
            if not body or not body.strip():
                logger.debug(f"Trafilatura failed or empty for {url}, falling back to newspaper3k.")
                np_article = NewspaperArticle(url)
                np_article.download()
                np_article.parse()
                body = np_article.text
                if not author and np_article.authors:
                    author = ", ".join(np_article.authors)

            if not body or not body.strip():
                logger.warning(f"Could not extract body text for {url}, skipping.")
                continue

            articles.append({
                'title': title,
                'url': url,
                'body': body.strip(),
                'author': author,
                'published_at': published_at,
                'source': name,
                'category': category,
                'subreddit': subreddit
            })

        except Exception as e:
            logger.error(f"Error scraping entry from {name}: {e}", exc_info=True)
            continue
        finally:
            time.sleep(delay_seconds)

    return articles
