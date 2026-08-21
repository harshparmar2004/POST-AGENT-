"""
Diagnostic test for Nano Banana / Imagen 3 API image generation.
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY", "")
print(f"Testing Google API Key: {api_key[:10]}...")

prompt = "A high quality minimalist tech infographic social media card about AI agents."

# 1. Test google-genai SDK
try:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    print("Testing client.models.generate_images with imagen-3.0-generate-002...")
    result = client.models.generate_images(
        model='imagen-3.0-generate-002',
        prompt=prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="1:1"
        )
    )
    if result.generated_images:
        print("✅ SUCCESS! Imagen 3 generated image bytes length:", len(result.generated_images[0].image.image_bytes))
    else:
        print("❌ No images returned by SDK.")
except Exception as e:
    print(f"❌ SDK Imagen 3 error: {e}")

# 2. Test REST API endpoint
try:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={api_key}"
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {"sampleCount": 1, "aspectRatio": "1:1"}
    }
    resp = requests.post(url, json=payload, timeout=20)
    print(f"REST API Response Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print("✅ SUCCESS REST API! Response keys:", list(data.keys()))
    else:
        print("REST API Error response:", resp.text[:300])
except Exception as ex:
    print(f"REST API Error: {ex}")
