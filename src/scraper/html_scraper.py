import time
import logging
import datetime
from typing import List, Dict, Any
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup

import trafilatura
from newspaper import Article as NewspaperArticle
from robotexclusionrulesparser import RobotExclusionRulesParser

logger = logging.getLogger(__name__)
rerp = RobotExclusionRulesParser()

def is_allowed(url: str, user_agent: str = 'NewsAutoPipeline/1.0') -> bool:
    try:
        parsed = urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        rerp.fetch(robots_url)
        return rerp.is_allowed(user_agent, url)
    except Exception as e:
        logger.warning(f"Failed to check robots.txt for {url}: {e}")
        return True

def scrape_html(source: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Direct URL scraper for sources without an RSS feed.
    """
    name = source.get('name', 'Unknown')
    source_url = source.get('url')
    max_articles = source.get('max_articles', 10)
    delay_seconds = source.get('delay_seconds', 2)
    category = source.get('category')
    subreddit = source.get('subreddit')

    if not source_url:
        logger.error(f"No url provided for HTML source {name}")
        return []

    logger.info(f"Fetching homepage for {name} from {source_url}")
    try:
        html = trafilatura.fetch_url(source_url)
        if not html:
            logger.error(f"Failed to fetch homepage HTML for {source_url}")
            return []
            
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            # Basic validation
            full_url = urljoin(source_url, href)
            if full_url.startswith('http') and len(full_url) > len(source_url):
                if full_url not in links:
                    links.append(full_url)
    except Exception as e:
        logger.error(f"Error extracting links from {source_url}: {e}")
        return []

    articles = []
    
    for url in links[:max_articles]:
        try:
            if not is_allowed(url):
                logger.warning(f"Scraping not allowed by robots.txt for URL: {url}")
                continue

            logger.info(f"Fetching article content for: {url}")
            body = None
            title = None
            author = None
            
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                extracted = trafilatura.extract(downloaded, output_format="json")
                if extracted:
                    import json
                    try:
                        ext_dict = json.loads(extracted)
                        body = ext_dict.get('text')
                        title = ext_dict.get('title')
                        author = ext_dict.get('author')
                    except Exception:
                        body = trafilatura.extract(downloaded)

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
                    if not title:
                        title = np_article.title
                    if not author and np_article.authors:
                        author = ", ".join(np_article.authors)
                except Exception as npe:
                    logger.debug(f"Newspaper3k fallback failed for {url}: {npe}")
            
            if not body or not body.strip():
                logger.warning(f"Could not extract body text for {url}, skipping.")
                continue
                
            if not title:
                title = "Untitled Article"

            articles.append({
                'title': title,
                'url': url,
                'body': body.strip(),
                'author': author,
                'published_at': datetime.datetime.utcnow(),
                'source': name,
                'category': category,
                'subreddit': subreddit
            })
        except Exception as e:
            logger.error(f"Error scraping HTML entry from {name}: {e}", exc_info=True)
            continue
        finally:
            time.sleep(delay_seconds)

    return articles
