"""
AI-powered Tier 2 scraper — Supports Groq (Llama 3.3 70B) & ScrapeGraphAI (Gemini).
Handles JavaScript-heavy sites and custom news URLs.
"""

import os
import time
import json
import logging
import requests
from typing import List, Dict, Any
from datetime import datetime
import trafilatura
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}


def scrape_with_ai(source: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Scrape a website using Groq (Llama 3.3 70B) or ScrapeGraphAI.
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

    groq_key = os.getenv("GROQ_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")

    # 1. Groq (Llama 3.3 70B) Fast AI Parsing
    if groq_key and not groq_key.startswith("your_"):
        try:
            logger.info(f"Fetching page HTML for {source_name} ({url})...")
            html = trafilatura.fetch_url(url)
            if not html:
                resp = requests.get(url, headers=HEADERS, timeout=10)
                if resp.status_code == 200:
                    html = resp.text

            if html:
                # Extract text using trafilatura
                raw_text = trafilatura.extract(html) or html[:4000]
                prompt = (
                    f"Page Content:\n{raw_text[:6000]}\n\n"
                    "Extract news articles from this page content. Return strictly a JSON object with key 'articles' containing a list of objects:\n"
                    "Each article object must have:\n"
                    "- 'headline': string\n"
                    "- 'body': 2-3 paragraph summary of article text\n"
                    "- 'author': string or 'Unknown'\n"
                )

                logger.info(f"Parsing webpage text with Groq (Llama 3.3 70B)...")
                groq_url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"}
                }
                groq_resp = requests.post(groq_url, headers=headers, json=payload, timeout=20)
                if groq_resp.status_code == 200:
                    data = groq_resp.json()["choices"][0]["message"]["content"]
                    parsed = json.loads(data)
                    raw_articles = parsed.get("articles", [])
                    
                    articles = []
                    for item in raw_articles[:max_articles]:
                        t = item.get("headline") or item.get("title")
                        b = item.get("body") or item.get("text")
                        if t and b:
                            articles.append({
                                "title": str(t).strip(),
                                "url": url,
                                "body": str(b).strip(),
                                "author": str(item.get("author", "Unknown")),
                                "published_at": datetime.utcnow().isoformat(),
                                "source": source_name,
                                "category": category,
                                "subreddit": subreddit
                            })
                    if articles:
                        logger.info(f"Groq AI Scraper successfully extracted {len(articles)} articles from {source_name}!")
                        return articles
        except Exception as ex:
            logger.warning(f"Groq AI scraping failed: {ex}. Falling back to ScrapeGraphAI.")

    # 2. ScrapeGraphAI + Gemini Fallback
    if google_key and not google_key.startswith("your_"):
        try:
            from scrapegraphai.graphs import SmartScraperGraph
            graph_config = {
                "llm": {"model": "google_genai/gemini-2.5-flash", "api_key": google_key, "temperature": 0.1},
                "verbose": False,
                "headless": True,
            }
            prompt = "Extract all article headlines, authors, and body text from this page. Return a list."
            smart_scraper = SmartScraperGraph(prompt=prompt, source=url, config=graph_config)
            result = smart_scraper.run()
            
            raw_articles = result if isinstance(result, list) else [result] if isinstance(result, dict) else []
            articles = []
            for item in raw_articles[:max_articles]:
                if isinstance(item, dict) and item.get("headline") and item.get("body"):
                    articles.append({
                        "title": str(item["headline"]).strip(),
                        "url": url,
                        "body": str(item["body"]).strip(),
                        "author": str(item.get("author", "Unknown")),
                        "published_at": datetime.utcnow().isoformat(),
                        "source": source_name,
                        "category": category,
                        "subreddit": subreddit
                    })
            return articles
        except Exception as e:
            logger.error(f"ScrapeGraphAI failed for source {source_name}: {e}")

    return []
