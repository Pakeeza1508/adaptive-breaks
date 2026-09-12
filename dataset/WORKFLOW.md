# Dataset Workflow

## v0.1

Current seed file:

- `data/seeds.jsonl`
- `data/seeds.csv`

80 curated seed statements:
- 20 drained
- 20 overwhelmed
- 20 distracted
- 20 stuck

## Expansion

Set the API key outside the repository:

Windows PowerShell:

```powershell
$env:GROQ_API_KEY="your-key"
python dataset/scripts/expand_with_groq.py
```

Do NOT commit your API key.

The script creates:

`data/generated_candidates.jsonl`

These rows have:

`review_status = pending`

Human review them before release.

## Target size

For the hackathon:

- 80 human seeds
- ~240 generated paraphrase candidates
- retain ~180-220 after human review
- total v0.2 dataset: roughly 250-300 examples

This is enough for a credible small-domain experiment without pretending it is a large production dataset.

## Split rule

Never randomly split paraphrases.

All rows sharing the same `seed_id` must remain in the same split.

Recommended group split:

- 70% seed groups -> train
- 15% seed groups -> validation
- 15% seed groups -> test

This prevents near-duplicate leakage.

## Hugging Face publishing

Install:

```bash
pip install -r dataset/requirements.txt
huggingface-cli login
```

Upload:

```bash
python dataset/scripts/upload_to_hf.py Pakeeza1508/kya-scene-hai-cognitive-states
```

Recommended first public version tag:

`v0.1-seeds`
