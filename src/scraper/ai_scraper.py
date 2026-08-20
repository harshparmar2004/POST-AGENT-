"""
AI-powered Tier 2 scraper using ScrapeGraphAI with Gemini.
Handles JavaScript-heavy sites that do not provide RSS feeds.
"""

import os
import time
import logging
from typing import List, Dict, Any
from datetime import datetime
from dotenv import load_dotenv

from scrapegraphai.graphs import SmartScraperGraph

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

def scrape_with_ai(source: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Scrape a JavaScript-heavy website using ScrapeGraphAI and Gemini LLM.

    Args:
        source (Dict[str, Any]): Configuration dictionary for the source.
            Must contain at least 'url', 'name', 'category', 'subreddit', and 'max_articles'.

    Returns:
        List[Dict[str, Any]]: A list of dictionaries representing scraped articles,
        with keys: title, url, body, author, published_at, source, category, subreddit.
    """
    url = source.get("url")
    source_name = source.get("name", "Unknown AI Source")
    category = source.get("category", "General")
    subreddit = source.get("subreddit", "news")
    max_articles = source.get("max_articles", 5)

    if not url:
        logger.error(f"Source configuration missing 'url': {source}")
        return []

    logger.info(f"Starting AI scrape for source: {source_name} at {url}")

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.error("GOOGLE_API_KEY environment variable is not set. Cannot run AI scraper.")
        return []

    graph_config = {
        "llm": {
            "model": "google_genai/gemini-2.5-flash",
            "api_key": api_key,
            "temperature": 0.1,
        },
        "verbose": False,
        "headless": True,
    }

    prompt = (
        "Extract all article headlines, their authors, publication dates, and "
        "the full body text of each article from this page. Return a list of articles."
    )

    articles = []
    
    try:
        # Respectful delay before hitting the site
        time.sleep(2)
        
        # Initialize and run the SmartScraperGraph
        smart_scraper_graph = SmartScraperGraph(
            prompt=prompt,
            source=url,
            config=graph_config
        )
        
        logger.debug(f"Executing ScrapeGraphAI for {url}")
        result = smart_scraper_graph.run()
        
        # Parse results, expecting a list of articles (dict) under some key or directly as a list
        raw_articles = []
        if isinstance(result, dict):
            # Try to find a list within the result
            for value in result.values():
                if isinstance(value, list):
                    raw_articles = value
                    break
            # Fallback if the whole result is interpreted as a single article
            if not raw_articles and result:
                raw_articles = [result]
        elif isinstance(result, list):
            raw_articles = result
            
        logger.info(f"ScrapeGraphAI returned {len(raw_articles)} potential articles from {url}")

        for idx, item in enumerate(raw_articles):
            if len(articles) >= max_articles:
                break
                
            if not isinstance(item, dict):
                continue
                
            title = item.get("headline") or item.get("title", "")
            body = item.get("body") or item.get("text", "")
            
            if not title or not body:
                logger.warning(f"Skipping article {idx+1} from {source_name} due to missing title or body.")
                continue
                
            published_at = item.get("publication date") or item.get("publication_date") or item.get("published_at") or item.get("date", datetime.utcnow().isoformat())
            author = item.get("author", "")
            
            articles.append({
                "title": str(title).strip(),
                "url": url,  # Using base URL since ScrapeGraphAI on a single page might not capture distinct article URLs
                "body": str(body).strip(),
                "author": str(author).strip() if author else "Unknown",
                "published_at": str(published_at).strip(),
                "source": source_name,
                "category": category,
                "subreddit": subreddit
            })

    except Exception as e:
        logger.error(f"ScrapeGraphAI failed for source {source_name} at {url}: {str(e)}", exc_info=True)
        return []

    logger.info(f"Successfully scraped {len(articles)} articles from {source_name}")
    return articles
