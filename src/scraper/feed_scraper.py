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

def is_allowed(url: str, user_agent: str = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)') -> bool:
    """
    Check if scraping the URL is allowed by the site's robots.txt.
    """
    try:
        parsed_url = urlparse(url)
        robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
        rerp.fetch(robots_url)
        allowed = rerp.is_allowed(user_agent, url)
        return True if allowed is None else allowed
    except Exception as e:
        logger.warning(f"Failed to check robots.txt for {url}: {e}")
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
                try:
                    np_article = NewspaperArticle(url)
                    if downloaded:
                        np_article.set_html(downloaded)
                        np_article.parse()
                    else:
                        np_article.download()
                        np_article.parse()
                    body = np_article.text
                    if not author and np_article.authors:
                        author = ", ".join(np_article.authors)
                except Exception as npe:
                    logger.debug(f"Newspaper3k fallback failed for {url}: {npe}")

            # Fallback to RSS entry content / summary if body is still empty
            if not body or not body.strip():
                if hasattr(entry, 'content') and entry.content:
                    body = entry.content[0].get('value', '')
                elif entry.get('summary'):
                    body = entry.get('summary')
                elif entry.get('description'):
                    body = entry.get('description')
                
                # Strip HTML tags if fallback text used
                if body:
                    from bs4 import BeautifulSoup
                    body = BeautifulSoup(body, 'html.parser').get_text()

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
