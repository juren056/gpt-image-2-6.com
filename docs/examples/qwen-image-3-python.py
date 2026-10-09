"""Submit a Qwen Image 3 request to fal's queue API."""

import os
import requests

api_key = os.environ.get("FAL_KEY")
if not api_key:
    raise RuntimeError("Set FAL_KEY before running this example.")

model = "alibaba/qwen-image-3/text-to-image"
response = requests.post(
    f"https://queue.fal.run/{model}",
    headers={"Authorization": f"Key {api_key}"},
    json={
        "prompt": 'Editorial poster with the exact headline "BUILD WITH CLARITY".',
        "image_size": "portrait_4_3",
        "enable_prompt_expansion": True,
        "enable_safety_checker": True,
        "num_images": 1,
        "output_format": "png",
    },
    timeout=30,
)
response.raise_for_status()
task = response.json()
print("Request queued:", task["request_id"])
print("Poll status:", task.get("status_url"))
print("Read result:", task.get("response_url"))
