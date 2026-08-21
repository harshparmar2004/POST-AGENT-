"""
Nano Banana / Imagen 3 Contextual Image Generator Module — Google AI Pro Nano Banana Model Support.
Generates high-resolution social media visual graphics enriched with full article context.
Includes PIL Pillow graphic renderer fallback.
"""

import os
import time
import logging
from typing import Optional
from PIL import Image, ImageDraw, ImageFont

from src.db.models import Article, get_session

logger = logging.getLogger(__name__)


def generate_image(article_id: int) -> bool:
    """
    Generates a high-quality news post image using Nano Banana (Imagen 3 / Gemini 2.0 Flash)
    enriched with full article context and target niche metadata.
    """
    api_key = os.getenv('GOOGLE_API_KEY')
    niche = os.getenv('NICHE_FOCUS', 'Technology, AI & Business Trends')
    image_model = os.getenv('IMAGE_MODEL', 'imagen-3.0-generate-002')  # Nano Banana Imagen 3

    with get_session() as session:
        article = session.query(Article).filter(Article.id == article_id).first()
        if not article:
            logger.error(f"Article with id {article_id} not found.")
            return False

        # Context-enriched prompt for Nano Banana
        title_snippet = article.title[:120]
        body_snippet = article.body[:200] if article.body else ""
        category = article.category or 'General'

        prompt = (
            f"High-quality professional 1:1 square social media news slide card for the '{niche}' niche.\n"
            f"Article Title: '{title_snippet}'\n"
            f"Context Summary: {body_snippet}\n"
            f"Category: {category}\n"
            "Visual Style: Modern editorial layout, bold typography, warm minimalist aesthetic, crisp infographic card, high contrast."
        )

        image_bytes = None

        # 1. Try Nano Banana / Imagen 3 via Google GenAI SDK
        if api_key and not api_key.startswith("your_"):
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=api_key)
                logger.info(f"Generating image for Article #{article_id} using Nano Banana / Imagen 3 ({image_model})...")

                # Try Imagen 3 Image Generation API first
                try:
                    result = client.models.generate_images(
                        model=image_model,
                        prompt=prompt,
                        config=types.GenerateImagesConfig(
                            number_of_images=1,
                            aspect_ratio="1:1"
                        )
                    )
                    if result.generated_images:
                        image_bytes = result.generated_images[0].image.image_bytes
                        logger.info(f"Successfully generated Nano Banana image using Imagen 3 model '{image_model}'!")
                except Exception as img_err:
                    logger.warning(f"Imagen 3 generate_images call failed: {img_err}")

                # Try Gemini Multimodal Flash fallback if needed
                if not image_bytes:
                    for model_candidate in ['gemini-2.0-flash-exp', 'gemini-2.0-flash-preview-image-generation']:
                        try:
                            resp = client.models.generate_content(
                                model=model_candidate,
                                contents=prompt,
                                config=types.GenerateContentConfig(
                                    response_modalities=['IMAGE', 'TEXT']
                                )
                            )
                            if resp.candidates and resp.candidates[0].content and resp.candidates[0].content.parts:
                                for part in resp.candidates[0].content.parts:
                                    if part.inline_data:
                                        image_bytes = part.inline_data.data
                                        break
                            if image_bytes:
                                logger.info(f"Successfully generated Nano Banana image using model '{model_candidate}'!")
                                break
                        except Exception as model_err:
                            logger.debug(f"Model candidate '{model_candidate}' failed: {model_err}")

            except Exception as ex:
                logger.warning(f"Nano Banana API generation failed: {ex}. Using PIL Graphic fallback.")

        # 2. Fallback PIL Pillow Custom Graphic Generator (Ensures an image is ALWAYS generated!)
        images_dir = os.path.join(os.getcwd(), 'images')
        os.makedirs(images_dir, exist_ok=True)
        image_path = os.path.join(images_dir, f"{article_id}.png")

        if image_bytes:
            with open(image_path, 'wb') as f:
                f.write(image_bytes)
        else:
            logger.info(f"Creating PIL context graphic slide card for Article #{article_id}...")
            _create_pil_slide_card(article, niche, image_path)

        article.image_path = image_path
        article.status = 'ready'

        session.commit()
        logger.info(f"Image successfully assigned to Article #{article_id} at {image_path}")
        return True


def _create_pil_slide_card(article: Article, niche: str, output_path: str):
    """
    Renders a high-resolution 1080x1080 social media slide card using PIL.
    """
    img = Image.new('RGB', (1080, 1080), color='#faf7f2')
    draw = ImageDraw.Draw(img)

    # Draw Header & Category Pill
    draw.rectangle([60, 60, 1020, 1020], outline='#e5e0d8', width=3)
    draw.rectangle([100, 100, 340, 145], fill='#d97757')
    draw.text((115, 112), f"NICHE: {niche[:16].upper()}", fill='#ffffff')

    # Draw Title Text
    words = article.title.split()
    lines = []
    current_line = []
    for w in words:
        current_line.append(w)
        if len(' '.join(current_line)) > 26:
            lines.append(' '.join(current_line[:-1]))
            current_line = [w]
    if current_line:
        lines.append(' '.join(current_line))

    y = 220
    for line in lines[:4]:
        draw.text((100, y), line, fill='#1f1e1b')
        y += 65

    # Body snippet
    if article.body:
        snippet = article.body[:200] + "..."
        draw.text((100, y + 30), snippet, fill='#6e6b65')

    # Footer Branding
    draw.line([(100, 960), (980, 960)], fill='#d97757', width=2)
    draw.text((100, 980), "NewsFlow AI • Powered by Nano Banana & Multi-LLM Engine", fill='#9e9a91')

    img.save(output_path)


def generate_all_images(delay_seconds: float = 1.0) -> int:
    """Finds articles needing images and processes them."""
    count = 0
    with get_session() as session:
        articles = session.query(Article).filter(
            Article.image_path.is_(None)
        ).all()
        article_ids = [a.id for a in articles]

    for aid in article_ids:
        if generate_image(aid):
            count += 1
        time.sleep(delay_seconds)

    return count
