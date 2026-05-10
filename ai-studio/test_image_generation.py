import os
import base64
from openai import OpenAI

env_path = "/home/ubuntu/bayinai/ai-studio/.env"
api_key = None

if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('GPTAPI='):
                api_key = line.split('=', 1)[1].strip().strip('"').strip("'")
                break

if not api_key:
    raise ValueError("GPTAPI not found in .env file")

client = OpenAI(api_key=api_key)

prompt = """
A vibrant and festive shopping mall promotional poster featuring:
- A modern shopping mall interior with bright, warm lighting
- Large sale banners saying "GRAND OPENING" and "50% OFF"
- Elegant storefronts with luxurious brand displays
- Crowds of happy shoppers carrying colorful shopping bags
- A central fountain with sparkling water
- Soft bokeh effect on the background with warm golden tones
- Professional commercial photography style, high quality, 4K resolution
"""

print("正在生成商场海报，请稍候...")
print(f"使用的模型: gpt-image-2")

result = client.images.generate(
    model="gpt-image-2",
    prompt=prompt
)

image_base64 = result.data[0].b64_json
image_bytes = base64.b64decode(image_base64)

output_path = "/home/ubuntu/bayinai/ai-studio/shopping_mall_poster.png"

with open(output_path, "wb") as f:
    f.write(image_bytes)

print(f"\n✅ 商场海报生成成功！")
print(f"📁 图片保存位置: {output_path}")
print(f"📐 图片大小: {len(image_bytes) / 1024:.2f} KB")