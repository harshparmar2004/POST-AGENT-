import os
import time
import logging
from typing import Optional

from google import genai
from google.genai import types

from src.db.models import Article, get_session

logger = logging.getLogger(__name__)

def generate_image(article_id: int) -> bool:
    """
    Generates a thumbnail image for an article using Gemini.
    Uses 'gemini-2.0-flash-preview-image-generation'.
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
                f"Create a professional, eye-catching news thumbnail image for this article: {article.title}. "
                f"Category: {article.category or 'General'}. Style: modern, clean, suitable for social media."
            )
            
            response = client.models.generate_content(
                model='gemini-2.0-flash-preview-image-generation',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=['IMAGE', 'TEXT']
                ),
            )
            
            image_bytes = None
            if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        image_bytes = part.inline_data.data
                        break
                        
            if not image_bytes:
                logger.error(f"No image data returned for article {article_id}")
                return False
                
            # Use a project-level images directory relative to the current working directory
            images_dir = os.path.join(os.getcwd(), 'images')
            os.makedirs(images_dir, exist_ok=True)
            image_path = os.path.join(images_dir, f"{article_id}.png")
            
            with open(image_path, 'wb') as f:
                f.write(image_bytes)
                
            article.image_path = image_path
            
            # Check if rewrite has also succeeded (twitter_text is a proxy for all texts)
            if article.twitter_text and article.image_path:
                article.status = 'ready'
                
            session.commit()
            logger.info(f"Successfully generated image for article {article_id}")
            return True
            
    except Exception as e:
        logger.exception(f"Failed to generate image for article {article_id}: {e}")
        return False

def generate_all_images(delay_seconds: float = 2.0) -> int:
    """
    Finds articles that have been rewritten but don't have image_path set yet.
    Returns the count of successfully generated images.
    """
    count = 0
    try:
        with get_session() as session:
            # Articles that are rewritten (have twitter_text) but no image
            articles = session.query(Article).filter(
                Article.twitter_text.isnot(None),
                Article.image_path.is_(None)
            ).all()
            article_ids = [a.id for a in articles]
            
        for aid in article_ids:
            if generate_image(aid):
                count += 1
            time.sleep(delay_seconds)
            
    except Exception as e:
        logger.exception(f"Error while generating all images: {e}")
        
    return count
