"""
Create/update a Hugging Face dataset repository and upload this dataset folder.

Usage:
  pip install huggingface_hub
  huggingface-cli login
  python upload_to_hf.py Pakeeza1508/kya-scene-hai-cognitive-states
"""

import sys
from pathlib import Path
from huggingface_hub import HfApi

if len(sys.argv) != 2:
    raise SystemExit(
        "Usage: python upload_to_hf.py <username/dataset-name>"
    )

repo_id = sys.argv[1]
dataset_dir = Path(__file__).resolve().parents[1]

api = HfApi()

api.create_repo(
    repo_id=repo_id,
    repo_type="dataset",
    exist_ok=True,
    private=False,
)

api.upload_folder(
    folder_path=str(dataset_dir),
    repo_id=repo_id,
    repo_type="dataset",
    ignore_patterns=[
        "scripts/*",
        "__pycache__/*",
        "*.pyc",
    ],
)

print(f"Uploaded dataset to: {repo_id}")
