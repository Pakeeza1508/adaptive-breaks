# Kya Scene Hai — Kaggle Experiment Bundle

This bundle is designed for a Windows + VS Code workflow:

```text
local reviewed data
      ↓
Kaggle Dataset
      ↓
Kaggle GPU script
      ↓
rules vs TF-IDF vs multilingual-E5
      ↓
metrics + models + confusion matrices
      ↓
downloaded automatically to local artifacts/
```

## Why we are not forcing two GPUs

The expected dataset is only around 300 examples.

For this experiment:

- Rule baseline uses CPU.
- TF-IDF + Logistic Regression uses CPU.
- multilingual-E5 embeddings can use one GPU.
- Logistic Regression uses CPU.

Two-GPU distributed training would add more synchronization/setup overhead than useful computation.

`train_and_compare.py` detects and records every visible GPU. If Kaggle exposes two GPUs, that is recorded in `environment.json`, but the current E5 baseline deliberately uses one.

If a later experiment fine-tunes XLM-R or another transformer end-to-end, multi-GPU can then be justified.

---

# 1. Install Kaggle CLI locally

Because some Windows machines block `pip.exe`, use:

```powershell
python -m pip install --upgrade kaggle
```

Verify:

```powershell
kaggle --version
```

Official Kaggle CLI authentication supports an API key from your Kaggle account.

For environment-variable auth:

```powershell
$env:KAGGLE_USERNAME="YOUR_KAGGLE_USERNAME"
$env:KAGGLE_KEY="YOUR_LEGACY_API_KEY"
```

Do not paste the key into source code or commit it.

Test:

```powershell
kaggle datasets list -s iris
```

---

# 2. Finish review

The training script intentionally refuses to train from a review CSV while any `decision` is empty.

Allowed decisions:

```text
keep
edit
drop
```

If `edit` is selected and an `edited_text` value exists, the corrected text is used.

Expected local files:

```text
dataset/data/seeds.jsonl
dataset/data/review_queue_reviewed.csv
```

`review_queue.csv` is also accepted.

---

# 3. Publish/update the reviewed data on Kaggle

From repository root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/publish_dataset_to_kaggle.ps1
```

The script:

1. creates a temporary staging folder;
2. copies only the human seeds and reviewed candidate file;
3. creates a Kaggle Dataset if it does not exist;
4. otherwise publishes a new dataset version.

Default dataset ID:

```text
YOUR_USERNAME/kya-scene-hai-reviewed-data
```

---

# 4. Run training remotely and automatically retrieve results

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run_kaggle_and_download.ps1
```

This:

1. dynamically writes `kaggle/kernel-metadata.json`;
2. attaches your Kaggle dataset;
3. requests a GPU-enabled Kaggle run;
4. polls until the kernel completes;
5. downloads all outputs back to your repository.

Local results appear under:

```text
artifacts/kaggle/YYYYMMDD-HHMMSS/
```

So a Kaggle session ending does **not** destroy your experiment outputs.

---

# 5. What the experiment does

## Leakage-safe split

Splits are created on unique `seed_id` groups:

```text
70% train
15% validation
15% test
```

A seed and all of its generated paraphrases remain in exactly one split.

## Models

### A. Deterministic rule baseline

Uses the same type of state logic as the initial MVP.

### B. TF-IDF + Logistic Regression

Uses both:

- word 1–2 grams
- character 3–5 grams

Character n-grams are useful for Roman Urdu spelling variation.

### C. multilingual-E5 + Logistic Regression

Uses:

```text
intfloat/multilingual-e5-small
```

as a frozen multilingual embedding model.

Logistic Regression is then trained independently for:

- energy
- tension
- attention
- primary_state

No large LLM fine-tuning is required.

---

# 6. Outputs

The Kaggle run writes:

```text
output/
├── environment.json
├── final_dataset_with_split.csv
├── final_dataset_with_split.jsonl
├── metrics_summary.csv
├── language_breakdown.csv
├── primary_state_ranking.csv
├── experiment_summary.md
│
├── splits/
│   ├── train.csv
│   ├── validation.csv
│   ├── test.csv
│   └── corresponding JSONL files
│
├── embeddings/
│   └── e5_embeddings.npz
│
└── models/
    ├── rules/
    ├── tfidf_logreg/
    └── e5_logreg/
```

Each evaluated model also receives:

- complete JSON metrics;
- confusion matrices;
- misclassified examples.

---

# 7. Primary metrics

The main comparison metric is:

```text
Macro-F1
```

Also reported:

- Accuracy
- Weighted-F1
- per-class precision/recall/F1
- confusion matrices
- primary-state performance by language style

The code does not fabricate any benchmark score.

---

# 8. Local dry run

You can verify the entire pipeline locally before spending Kaggle quota:

```powershell
python kaggle/train_and_compare.py `
  --data-dir dataset/data `
  --output-dir artifacts/local `
  --skip-e5
```

This tests:

- review completeness;
- dataset loading;
- group splitting;
- rule model;
- TF-IDF model;
- artifact generation.

Then let Kaggle run the E5/GPU experiment.

---

# 9. Git ignore

Do not commit:

```text
.kaggle_staging/
artifacts/
kaggle/kernel-metadata.json
kaggle.json
```

The template metadata is safe to commit:

```text
kaggle/kernel-metadata.template.json
```
