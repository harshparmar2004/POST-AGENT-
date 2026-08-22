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

        # 1. Validate Google API Key format (Valid Google AI Studio keys start with 'AIzaSy')
        is_valid_key = api_key and api_key.startswith("AIzaSy")

        if not is_valid_key:
            if api_key and not api_key.startswith("your_"):
                logger.warning(
                    f"⚠️ Invalid GOOGLE_API_KEY detected ('{api_key[:10]}...'). "
                    "Valid Google AI Studio keys start with 'AIzaSy...' (get one free at https://aistudio.google.com/apikey). "
                    "Rendering PIL Studio graphic fallback."
                )
            else:
                logger.info("No GOOGLE_API_KEY set. Rendering PIL Studio graphic fallback.")

        # Try official Nano Banana models (Nano Banana 2, Nano Banana 2 Lite, Nano Banana Pro, Imagen 3)
        if is_valid_key:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=api_key)
                logger.info(f"Generating image for Article #{article_id} using official Nano Banana engine...")

                # 1. Try Nano Banana 2 Interactions API (gemini-3.1-flash-image)
                official_models = [
                    'gemini-3.1-flash-image',       # Nano Banana 2 (Workhorse)
                    'gemini-3.1-flash-lite-image',  # Nano Banana 2 Lite (Fast)
                    'gemini-3-pro-image',           # Nano Banana Pro (Premium)
                    'gemini-2.5-flash-image'        # Legacy Nano Banana
                ]

                for m in official_models:
                    try:
                        # Try client.interactions.create standard API
                        if hasattr(client, 'interactions'):
                            interaction = client.interactions.create(
                                model=m,
                                input=prompt,
                            )
                            if hasattr(interaction, 'output_image') and interaction.output_image:
                                import base64
                                image_bytes = base64.b64decode(interaction.output_image.data)
                                logger.info(f"Successfully generated Nano Banana image using model '{m}' via Interactions API!")
                                break

                        # Fallback to generate_content
                        resp = client.models.generate_content(
                            model=m,
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
                            logger.info(f"Successfully generated Nano Banana image using model '{m}'!")
                            break
                    except Exception as err:
                        logger.debug(f"Model candidate '{m}' failed: {err}")

                # 2. Try Imagen 3 generate_images API if needed
                if not image_bytes:
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
                            logger.info(f"Successfully generated image using Imagen 3 model '{image_model}'!")
                    except Exception as img_err:
                        logger.warning(f"Imagen 3 generate_images call failed: {img_err}")

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


def generate_carousel_slides(article_id: int) -> list[str]:
    """
    Generates a 4-card slide deck catalog (1 Main Title Banner + 3 Context/Description cards)
    for a top-ranked article using Nano Banana & PIL fallback.
    """
    images_dir = os.path.join(os.getcwd(), 'images')
    os.makedirs(images_dir, exist_ok=True)

    slide_paths = []

    with get_session() as session:
        article = session.query(Article).filter(Article.id == article_id).first()
        if not article:
            return []

        niche = os.getenv('NICHE_FOCUS', 'Technology & AI')

        # Slide 1: Main Title Banner Card
        p1 = os.path.join(images_dir, f"{article_id}_slide1.png")
        _create_pil_slide_card(article, niche, p1, slide_type="Banner Title Card", slide_num=1)
        slide_paths.append(f"/api/images/{article_id}_slide1.png")

        # Slide 2: Key Insight Context Card
        p2 = os.path.join(images_dir, f"{article_id}_slide2.png")
        _create_pil_slide_card(article, niche, p2, slide_type="Key Insight & Background", slide_num=2)
        slide_paths.append(f"/api/images/{article_id}_slide2.png")

        # Slide 3: Deep Analysis Description Card
        p3 = os.path.join(images_dir, f"{article_id}_slide3.png")
        _create_pil_slide_card(article, niche, p3, slide_type="Deep Analysis & Impact", slide_num=3)
        slide_paths.append(f"/api/images/{article_id}_slide3.png")

        # Slide 4: Discussion & CTA Card
        p4 = os.path.join(images_dir, f"{article_id}_slide4.png")
        _create_pil_slide_card(article, niche, p4, slide_type="Community Discussion & CTA", slide_num=4)
        slide_paths.append(f"/api/images/{article_id}_slide4.png")

        # Also set primary image_path
        article.image_path = p1
        article.status = 'ready'
        session.commit()

    return slide_paths


def _create_pil_slide_card(article: Article, niche: str, output_path: str, slide_type: str = "Banner Title Card", slide_num: int = 1):
    """
    Renders high-resolution social media slide card using PIL according to configured aspect ratio (16:9, 4:5, 1:1).
    """
    ratio = os.getenv('DEFAULT_ASPECT_RATIO', '16:9').strip()

    if ratio == '16:9':
        width, height = 1920, 1080
    elif ratio == '4:5':
        width, height = 1080, 1350
    else:
        width, height = 1080, 1080

    img = Image.new('RGB', (width, height), color='#faf7f2')
    draw = ImageDraw.Draw(img)

    margin = 50 if ratio == '16:9' else 60
    draw.rectangle([margin, margin, width - margin, height - margin], outline='#e5e0d8', width=3)
    
    fill_color = '#d97757' if slide_num == 1 else '#2b7bb9' if slide_num == 2 else '#c13584' if slide_num == 3 else '#2e7d32'
    draw.rectangle([margin + 40, margin + 40, margin + 480, margin + 90], fill=fill_color)
    draw.text((margin + 55, margin + 55), f"SLIDE {slide_num}/4 • {slide_type[:24].upper()}", fill='#ffffff')

    # Draw Title Text
    words = article.title.split()
    lines = []
    current_line = []
    line_limit = 45 if ratio == '16:9' else 26

    for w in words:
        current_line.append(w)
        if len(' '.join(current_line)) > line_limit:
            lines.append(' '.join(current_line[:-1]))
            current_line = [w]
    if current_line:
        lines.append(' '.join(current_line))

    y = margin + 140
    for line in lines[:3]:
        draw.text((margin + 40, y), line, fill='#1f1e1b')
        y += 65

    # Body snippet context per slide type
    if article.body:
        if slide_num == 1:
            snippet = f"🔥 HEADLINE BANNER HOOK:\n{(article.body[:240] + '...').strip()}"
        elif slide_num == 2:
            snippet = f"💡 CONCEPT VISUALIZATION & CONTEXT:\n{article.body[:280]}...".strip()
        elif slide_num == 3:
            snippet = f"🔬 DEEP STRATEGIC ANALYSIS & IMPACT:\n{(article.body[150:420] if len(article.body) > 150 else article.body[:280])}...".strip()
        else:
            snippet = f"💬 COMMUNITY DISCUSSION & TAKEAWAY:\nWhat do you think of this breakthrough? Drop your thoughts below!\nSource: {article.source}".strip()

        draw.text((margin + 40, y + 25), snippet, fill='#6e6b65')

    # Footer Branding
    draw.line([(margin + 40, height - margin - 50), (width - margin - 40, height - margin - 50)], fill=fill_color, width=2)
    draw.text((margin + 40, height - margin - 35), f"NewsFlow AI • Nano Banana Studio ({ratio}) • {niche}", fill='#9e9a91')

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
