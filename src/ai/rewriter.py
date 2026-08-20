import os
import time
import json
import logging
from typing import Optional

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from src.db.models import Article, get_session

logger = logging.getLogger(__name__)

class RewriteOutput(BaseModel):
    twitter_text: str = Field(..., description="<=280 chars, punchy, informative, text-only")
    linkedin_text: str = Field(..., description="professional tone, 1-3 paragraphs, suitable for business audience")
    instagram_caption: str = Field(..., description="engaging, conversational, with 5-10 relevant hashtags")
    reddit_title: str = Field(..., description="informative, discussion-sparking, <=300 chars")
    reddit_body: str = Field(..., description="2-3 paragraphs, objective summary, ends with discussion question")

def rewrite_article(article_id: int) -> bool:
    """
    Rewrites an article for different social media platforms using Gemini.
    Uses 'gemini-2.5-flash' to generate structured JSON output.
    """
    try:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            logger.error("GOOGLE_API_KEY environment variable not set.")
            return False
            
        client = genai.Client(api_key=api_key)
        
        with get_session() as session:
            article = session.query(Article).filter(Article.id == article_id).first()
            if not article:
                logger.error(f"Article with id {article_id} not found.")
                return False
                
            prompt = (
                f"Title: {article.title}\n"
                f"Body: {article.body}\n\n"
                "Please rewrite this article for the following platforms according to the schema."
            )
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=RewriteOutput,
                ),
            )
            
            # The response text should be JSON
            data = json.loads(response.text)
            
            article.twitter_text = data.get("twitter_text", "")
            article.linkedin_text = data.get("linkedin_text", "")
            article.instagram_caption = data.get("instagram_caption", "")
            article.reddit_title = data.get("reddit_title", "")
            article.reddit_body = data.get("reddit_body", "")
            
            session.commit()
            logger.info(f"Successfully rewritten article {article_id}")
            return True
            
    except json.JSONDecodeError as e:
        logger.error(f"Malformed JSON returned for article {article_id}: {e}")
        return False
    except Exception as e:
        logger.exception(f"Failed to rewrite article {article_id}: {e}")
        return False

def rewrite_all_scraped(delay_seconds: float = 1.0) -> int:
    """
    Finds all articles with status='scraped' and rewrites them.
    Returns the count of successfully rewritten articles.
    """
    count = 0
    try:
        with get_session() as session:
            articles = session.query(Article).filter(Article.status == 'scraped').all()
            article_ids = [a.id for a in articles]
            
        for aid in article_ids:
            if rewrite_article(aid):
                count += 1
            time.sleep(delay_seconds)
            
    except Exception as e:
        logger.exception(f"Error while rewriting all scraped articles: {e}")
        
    return count
