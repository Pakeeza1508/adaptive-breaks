#!/usr/bin/env python
"""
Kya Scene Hai? — Kaggle Training & Evaluation Pipeline

Compares:
1) Deterministic rule baseline
2) TF-IDF (word + character n-grams) + Logistic Regression
3) multilingual-e5-small embeddings + Logistic Regression

Targets:
- energy
- tension
- attention
- primary_state

Important:
- Splits are performed by seed_id, never by individual paraphrase.
- Human seeds and accepted/edited generated candidates stay together.
- All artifacts are written under /kaggle/working/output on Kaggle.
- The script also works locally with --data-dir.

Usage on Kaggle:
    python train_and_compare.py

Local dry-run:
    python kaggle/train_and_compare.py --data-dir dataset/data --output-dir artifacts/local

Expected input files:
    seeds.jsonl
    and one of:
      review_queue_reviewed.csv
      review_queue.csv
      clean_generated.jsonl

For CSV review files:
    decision must be keep/edit/drop.
    If decision == edit, edited_text is used when available.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import platform
import random
import re
import subprocess
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import numpy as np
import pandas as pd


SEED = 42
TARGETS = ["energy", "tension", "attention", "primary_state"]
VALID_LABELS = {
    "energy": {"low", "normal", "high"},
    "tension": {"low", "medium", "high"},
    "attention": {"okay", "scattered", "stuck"},
    "primary_state": {"drained", "overwhelmed", "distracted", "stuck"},
}
VALID_LANGUAGE_STYLES = {"english", "roman_urdu", "code_mixed"}


def set_global_seed(seed: int = SEED) -> None:
    random.seed(seed)
    np.random.seed(seed)


def ensure_package(import_name: str, pip_name: str | None = None) -> bool:
    """Best-effort install for Kaggle. Returns False rather than killing all baselines."""
    try:
        __import__(import_name)
        return True
    except ImportError:
        package = pip_name or import_name
        print(f"[setup] Missing {import_name}; attempting: python -m pip install -q {package}")
        try:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", "-q", package]
            )
            __import__(import_name)
            return True
        except Exception as exc:
            print(f"[setup] Could not install {package}: {exc}")
            return False


def environment_report() -> dict:
    info = {
        "python": sys.version,
        "platform": platform.platform(),
        "processor": platform.processor(),
        "kaggle_kernel_run_type": os.getenv("KAGGLE_KERNEL_RUN_TYPE"),
        "cuda_visible_devices": os.getenv("CUDA_VISIBLE_DEVICES"),
    }
    try:
        import torch
        info["torch"] = torch.__version__
        info["cuda_available"] = torch.cuda.is_available()
        info["gpu_count"] = torch.cuda.device_count()
        info["gpus"] = [
            torch.cuda.get_device_name(i)
            for i in range(torch.cuda.device_count())
        ]
    except Exception as exc:
        info["torch_error"] = str(exc)
    return info


def discover_data_dir(explicit: str | None) -> Path:
    if explicit:
        p = Path(explicit).resolve()
        if not p.exists():
            raise FileNotFoundError(f"Data directory does not exist: {p}")
        return p

    # Kaggle attached dataset locations.
    kaggle_input = Path("/kaggle/input")
    if kaggle_input.exists():
        candidates = []
        for seeds in kaggle_input.rglob("seeds.jsonl"):
            parent = seeds.parent
            has_review = any(
                (parent / name).exists()
                for name in [
                    "review_queue_reviewed.csv",
                    "review_queue.csv",
                    "clean_generated.jsonl",
                ]
            )
            if has_review:
                candidates.append(parent)

        if len(candidates) == 1:
            print(f"[data] Auto-discovered Kaggle data directory: {candidates[0]}")
            return candidates[0]

        if len(candidates) > 1:
            print("[data] Multiple matching Kaggle data directories:")
            for p in candidates:
                print("  ", p)
            raise RuntimeError(
                "Multiple dataset folders found. Pass --data-dir explicitly."
            )

    # Local repository default.
    local = Path("dataset/data").resolve()
    if (local / "seeds.jsonl").exists():
        return local

    raise FileNotFoundError(
        "Could not locate dataset. Attach Kaggle dataset or pass --data-dir."
    )


def read_jsonl(path: Path) -> List[dict]:
    rows = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def normalize_decision(value: str) -> str:
    return (value or "").strip().lower()


def load_reviewed_generated(data_dir: Path) -> Tuple[List[dict], str]:
    """
    Priority:
      review_queue_reviewed.csv
      review_queue.csv
      clean_generated.jsonl
    """
    reviewed_csv = data_dir / "review_queue_reviewed.csv"
    queue_csv = data_dir / "review_queue.csv"
    clean_jsonl = data_dir / "clean_generated.jsonl"

    csv_path = reviewed_csv if reviewed_csv.exists() else queue_csv

    if csv_path.exists():
        df = pd.read_csv(csv_path, dtype=str, keep_default_na=False)

        if "decision" not in df.columns:
            raise ValueError(f"{csv_path.name} has no decision column.")

        decisions = df["decision"].map(normalize_decision)
        valid = {"keep", "edit", "drop"}

        missing = (decisions == "").sum()
        invalid = (~decisions.isin(valid) & (decisions != "")).sum()

        if missing:
            raise ValueError(
                f"{csv_path.name}: {missing} rows have empty decision. "
                "Finish team review before final training."
            )
        if invalid:
            bad = sorted(set(decisions[~decisions.isin(valid)].tolist()))
            raise ValueError(
                f"{csv_path.name}: invalid decisions found: {bad}"
            )

        rows = []
        for _, r in df.iterrows():
            decision = normalize_decision(r.get("decision", ""))
            if decision == "drop":
                continue

            text = str(r.get("text", "")).strip()
            edited_text = str(r.get("edited_text", "")).strip()

            if decision == "edit" and edited_text:
                text = edited_text

            rows.append(
                {
                    "seed_id": str(r["seed_id"]).strip(),
                    "variant_id": str(r.get("variant_id", "")).strip(),
                    "text": text,
                    "language_style": str(r["language_style"]).strip(),
                    "energy": str(r["energy"]).strip(),
                    "tension": str(r["tension"]).strip(),
                    "attention": str(r["attention"]).strip(),
                    "primary_state": str(r["primary_state"]).strip(),
                    "source": "generated_team_reviewed",
                    "review_decision": decision,
                }
            )
        return rows, csv_path.name

    if clean_jsonl.exists():
        rows = read_jsonl(clean_jsonl)
        return rows, clean_jsonl.name

    raise FileNotFoundError(
        "No reviewed generated dataset found. Expected "
        "review_queue_reviewed.csv, review_queue.csv, or clean_generated.jsonl."
    )


def load_dataset(data_dir: Path) -> pd.DataFrame:
    seeds_path = data_dir / "seeds.jsonl"
    if not seeds_path.exists():
        raise FileNotFoundError(f"Missing {seeds_path}")

    seeds = read_jsonl(seeds_path)
    generated, generated_source = load_reviewed_generated(data_dir)

    for r in seeds:
        r = r
        r.setdefault("variant_id", f'{r["seed_id"]}_human')
        r.setdefault("source", "human_seed")

    all_rows = seeds + generated
    df = pd.DataFrame(all_rows)

    required = {
        "seed_id",
        "text",
        "language_style",
        "energy",
        "tension",
        "attention",
        "primary_state",
        "source",
    }
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Dataset missing columns: {sorted(missing)}")

    # Basic cleanup.
    for col in required:
        df[col] = df[col].astype(str).str.strip()

    df = df[df["text"].str.len() > 0].copy()
    df["normalized_text"] = (
        df["text"]
        .str.lower()
        .str.replace(r"[^\w\s]", "", regex=True)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )

    duplicate_count = df["normalized_text"].duplicated().sum()
    if duplicate_count:
        print(f"[quality] Removing {duplicate_count} exact normalized duplicates.")
        df = df.drop_duplicates("normalized_text", keep="first").copy()

    # Label validation.
    for target, allowed in VALID_LABELS.items():
        bad = sorted(set(df.loc[~df[target].isin(allowed), target]))
        if bad:
            raise ValueError(f"Invalid {target} labels: {bad}")

    bad_styles = sorted(
        set(df.loc[~df["language_style"].isin(VALID_LANGUAGE_STYLES), "language_style"])
    )
    if bad_styles:
        raise ValueError(f"Invalid language_style values: {bad_styles}")

    # Ensure one primary state per seed group.
    state_per_seed = df.groupby("seed_id")["primary_state"].nunique()
    inconsistent = state_per_seed[state_per_seed > 1]
    if not inconsistent.empty:
        raise ValueError(
            f"Label drift: {len(inconsistent)} seed groups have multiple primary_state labels: "
            f"{inconsistent.index.tolist()[:10]}"
        )

    print(f"[data] Human seeds: {len(seeds)}")
    print(f"[data] Reviewed/generated rows loaded from {generated_source}: {len(generated)}")
    print(f"[data] Final rows after cleanup: {len(df)}")
    print(f"[data] Unique seed groups: {df['seed_id'].nunique()}")
    print("[data] Primary-state distribution:")
    print(df["primary_state"].value_counts().sort_index().to_string())
    print("[data] Language-style distribution:")
    print(df["language_style"].value_counts().sort_index().to_string())

    return df.drop(columns=["normalized_text"])


def stratified_group_split(df: pd.DataFrame, seed: int = SEED) -> pd.DataFrame:
    """
    Split unique seed groups 70/15/15, stratified by primary_state.
    With 80 balanced seeds this should become 56/12/12 groups.
    """
    from sklearn.model_selection import train_test_split

    groups = (
        df[["seed_id", "primary_state"]]
        .drop_duplicates("seed_id")
        .sort_values("seed_id")
        .reset_index(drop=True)
    )

    trainval, test = train_test_split(
        groups,
        test_size=0.15,
        random_state=seed,
        stratify=groups["primary_state"],
    )

    # 15 / 85 of original set -> ~17.647% of the remaining groups.
    val_fraction_of_trainval = 0.15 / 0.85

    train, val = train_test_split(
        trainval,
        test_size=val_fraction_of_trainval,
        random_state=seed,
        stratify=trainval["primary_state"],
    )

    mapping = {}
    mapping.update({sid: "train" for sid in train["seed_id"]})
    mapping.update({sid: "validation" for sid in val["seed_id"]})
    mapping.update({sid: "test" for sid in test["seed_id"]})

    out = df.copy()
    out["split"] = out["seed_id"].map(mapping)

    assert out["split"].notna().all()

    # Leakage guard.
    split_counts = out.groupby("seed_id")["split"].nunique()
    assert split_counts.max() == 1, "Seed leakage detected."

    print("[split] Seed groups:")
    print(
        out[["seed_id", "split"]]
        .drop_duplicates()
        ["split"]
        .value_counts()
        .to_string()
    )

    print("[split] Rows:")
    print(out["split"].value_counts().to_string())

    group_distribution = (
        out[["seed_id", "primary_state", "split"]]
        .drop_duplicates()
        .groupby(["split", "primary_state"])
        .size()
        .unstack(fill_value=0)
    )
    print("[split] Primary-state seed groups per split:")
    print(group_distribution.to_string())

    return out


def save_jsonl(df: pd.DataFrame, path: Path) -> None:
    with path.open("w", encoding="utf-8") as f:
        for row in df.to_dict(orient="records"):
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------------------
# Rule baseline
# ---------------------------------------------------------------------------

LOW_ENERGY = [
    r"\btired\b", r"\bdrained\b", r"\bexhaust", r"\bsleepy\b",
    r"\bfried\b", r"\bcooked\b", r"brain dead",
    r"dimagh band", r"dimaag band", r"\bthak", r"energy (nahi|nai|nhi)",
]
HIGH_ENERGY = [
    r"\brestless\b", r"can't sit still", r"cant sit still", r"\bhyper\b",
    r"too much energy", r"chain nahi", r"sukoon nahi",
]
HIGH_TENSION = [
    r"\bpanic", r"\boverwhelm", r"\banxious\b", r"\bstress", r"\bpressure\b",
    r"\bdeadline\b", r"exam tomorrow", r"exam kal", r"kal exam",
    r"\bghabra", r"\btension\b", r"bohat load", r"bahut load",
]
MEDIUM_TENSION = [
    r"\bannoyed\b", r"\bfrustrat", r"\birritat", r"\bugh\b",
    r"\bragra\b", r"dimagh kha", r"dimaag kha",
]
SCATTERED = [
    r"can't focus", r"cant focus", r"cannot focus", r"can't concentrate",
    r"cant concentrate", r"\bdistract", r"keep switching", r"jumping",
    r"mind wandering", r"focus (nahi|nai|nhi)", r"concentrate nahi",
    r"dil (nahi|nai) lag", r"idhar udhar",
]
STUCK = [
    r"\bstuck\b", r"same bug", r"same question", r"same problem",
    r"staring at", r"can't solve", r"cant solve", r"getting nowhere",
    r"atka hua", r"atki hui", r"atak gaya", r"atak gayi",
    r"samajh (nahi|nai|nhi) aa", r"same code", r"same paragraph",
    r"\bfreeze", r"\bloop",
]


def any_pattern(text: str, patterns: Iterable[str]) -> bool:
    return any(re.search(p, text, flags=re.I) for p in patterns)


def rule_predict_one(text: str) -> dict:
    low_energy = any_pattern(text, LOW_ENERGY)
    high_energy = any_pattern(text, HIGH_ENERGY)
    high_tension = any_pattern(text, HIGH_TENSION)
    medium_tension = any_pattern(text, MEDIUM_TENSION)
    scattered = any_pattern(text, SCATTERED)
    stuck = any_pattern(text, STUCK)

    energy = "low" if low_energy else ("high" if high_energy else "normal")
    tension = "high" if high_tension else ("medium" if medium_tension else "low")
    attention = "stuck" if stuck else ("scattered" if scattered else "okay")

    if tension == "high":
        primary = "overwhelmed"
    elif attention == "stuck":
        primary = "stuck"
    elif attention == "scattered":
        primary = "distracted"
    else:
        primary = "drained"

    return {
        "energy": energy,
        "tension": tension,
        "attention": attention,
        "primary_state": primary,
    }


def rule_predictions(texts: Iterable[str]) -> Dict[str, np.ndarray]:
    outputs = {target: [] for target in TARGETS}
    for text in texts:
        pred = rule_predict_one(str(text))
        for target in TARGETS:
            outputs[target].append(pred[target])
    return {k: np.array(v) for k, v in outputs.items()}


# ---------------------------------------------------------------------------
# Evaluation helpers
# ---------------------------------------------------------------------------

def evaluate_predictions(
    model_name: str,
    split_df: pd.DataFrame,
    predictions: Dict[str, np.ndarray],
    output_dir: Path,
) -> Tuple[pd.DataFrame, dict]:
    from sklearn.metrics import (
        accuracy_score,
        classification_report,
        confusion_matrix,
        f1_score,
    )

    model_dir = output_dir / "models" / model_name
    model_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    full = {}

    for target in TARGETS:
        y_true = split_df[target].to_numpy()
        y_pred = predictions[target]

        accuracy = accuracy_score(y_true, y_pred)
        macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
        weighted_f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)

        rows.append(
            {
                "model": model_name,
                "target": target,
                "accuracy": accuracy,
                "macro_f1": macro_f1,
                "weighted_f1": weighted_f1,
                "n_test": len(y_true),
            }
        )

        labels = sorted(VALID_LABELS[target])
        report = classification_report(
            y_true,
            y_pred,
            labels=labels,
            output_dict=True,
            zero_division=0,
        )
        cm = confusion_matrix(y_true, y_pred, labels=labels)

        full[target] = {
            "accuracy": accuracy,
            "macro_f1": macro_f1,
            "weighted_f1": weighted_f1,
            "classification_report": report,
            "labels": labels,
            "confusion_matrix": cm.tolist(),
        }

        # Save confusion matrix PNG.
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(6, 5))
        im = ax.imshow(cm)
        ax.set_xticks(range(len(labels)), labels=labels, rotation=35, ha="right")
        ax.set_yticks(range(len(labels)), labels=labels)
        ax.set_xlabel("Predicted")
        ax.set_ylabel("True")
        ax.set_title(f"{model_name} — {target}")
        for i in range(len(labels)):
            for j in range(len(labels)):
                ax.text(j, i, str(cm[i, j]), ha="center", va="center")
        fig.colorbar(im, ax=ax)
        fig.tight_layout()
        fig.savefig(model_dir / f"confusion_{target}.png", dpi=160)
        plt.close(fig)

        # Misclassifications.
        mis = split_df.copy()
        mis["prediction"] = y_pred
        mis = mis[mis[target] != mis["prediction"]]
        mis[
            ["seed_id", "text", "language_style", target, "prediction"]
        ].to_csv(
            model_dir / f"misclassified_{target}.csv",
            index=False,
        )

    with (model_dir / "metrics_full.json").open("w", encoding="utf-8") as f:
        json.dump(full, f, indent=2, ensure_ascii=False)

    return pd.DataFrame(rows), full


def language_breakdown(
    model_name: str,
    test_df: pd.DataFrame,
    primary_pred: np.ndarray,
) -> pd.DataFrame:
    from sklearn.metrics import accuracy_score, f1_score

    temp = test_df.copy()
    temp["_pred"] = primary_pred
    rows = []

    for style, group in temp.groupby("language_style"):
        rows.append(
            {
                "model": model_name,
                "language_style": style,
                "n": len(group),
                "primary_state_accuracy": accuracy_score(
                    group["primary_state"], group["_pred"]
                ),
                "primary_state_macro_f1": f1_score(
                    group["primary_state"],
                    group["_pred"],
                    average="macro",
                    zero_division=0,
                ),
            }
        )
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# TF-IDF model
# ---------------------------------------------------------------------------

def run_tfidf(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    output_dir: Path,
) -> Tuple[Dict[str, np.ndarray], dict]:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.pipeline import FeatureUnion
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
    import joblib

    predictions = {}
    models = {}

    for target in TARGETS:
        features = FeatureUnion(
            [
                (
                    "word",
                    TfidfVectorizer(
                        lowercase=True,
                        analyzer="word",
                        ngram_range=(1, 2),
                        min_df=1,
                        max_features=25000,
                        sublinear_tf=True,
                    ),
                ),
                (
                    "char",
                    TfidfVectorizer(
                        lowercase=True,
                        analyzer="char_wb",
                        ngram_range=(3, 5),
                        min_df=1,
                        max_features=35000,
                        sublinear_tf=True,
                    ),
                ),
            ]
        )

        clf = LogisticRegression(
            max_iter=3000,
            class_weight="balanced",
            C=2.0,
            random_state=SEED,
        )

        pipe = Pipeline([("features", features), ("classifier", clf)])
        pipe.fit(train_df["text"], train_df[target])

        predictions[target] = pipe.predict(test_df["text"])
        models[target] = pipe

    model_dir = output_dir / "models" / "tfidf_logreg"
    model_dir.mkdir(parents=True, exist_ok=True)
    for target, model in models.items():
        joblib.dump(model, model_dir / f"{target}.joblib")

    return predictions, models


# ---------------------------------------------------------------------------
# E5 embeddings + logistic regression
# ---------------------------------------------------------------------------

def encode_e5(model, texts: List[str], batch_size: int = 64) -> np.ndarray:
    prefixed = [f"query: {t}" for t in texts]
    return model.encode(
        prefixed,
        batch_size=batch_size,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )


def run_e5(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    output_dir: Path,
    model_name: str = "intfloat/multilingual-e5-small",
) -> Tuple[Dict[str, np.ndarray], dict] | Tuple[None, None]:
    if not ensure_package("sentence_transformers", "sentence-transformers"):
        print("[e5] sentence-transformers unavailable. Skipping E5 baseline.")
        return None, None

    from sentence_transformers import SentenceTransformer
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import f1_score
    import joblib

    try:
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        gpu_count = torch.cuda.device_count() if torch.cuda.is_available() else 0
    except Exception:
        device = "cpu"
        gpu_count = 0

    print(f"[e5] Loading {model_name} on {device}")
    if gpu_count > 1:
        print(
            f"[e5] {gpu_count} GPUs detected. This dataset is tiny, so single-GPU "
            "embedding is intentionally used; multi-GPU overhead would dominate."
        )

    try:
        embedder = SentenceTransformer(model_name, device=device)
    except Exception as exc:
        print(f"[e5] Failed to load embedding model: {exc}")
        print("[e5] TF-IDF and rule baselines are still valid outputs.")
        return None, None

    X_train = encode_e5(embedder, train_df["text"].tolist())
    X_val = encode_e5(embedder, val_df["text"].tolist())
    X_test = encode_e5(embedder, test_df["text"].tolist())

    cache_dir = output_dir / "embeddings"
    cache_dir.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        cache_dir / "e5_embeddings.npz",
        X_train=X_train,
        X_val=X_val,
        X_test=X_test,
        train_seed_id=train_df["seed_id"].to_numpy(),
        val_seed_id=val_df["seed_id"].to_numpy(),
        test_seed_id=test_df["seed_id"].to_numpy(),
    )

    predictions = {}
    models = {}
    selected_c = {}

    # Tiny validation-based C selection.
    c_grid = [0.25, 0.5, 1.0, 2.0, 4.0, 8.0]

    for target in TARGETS:
        best = None
        for c in c_grid:
            clf = LogisticRegression(
                max_iter=3000,
                class_weight="balanced",
                C=c,
                random_state=SEED,
            )
            clf.fit(X_train, train_df[target])
            val_pred = clf.predict(X_val)
            score = f1_score(
                val_df[target],
                val_pred,
                average="macro",
                zero_division=0,
            )
            if best is None or score > best[0]:
                best = (score, c)

        assert best is not None
        selected_c[target] = {"validation_macro_f1": best[0], "C": best[1]}

        # Refit on train + validation after selecting C.
        X_trainval = np.vstack([X_train, X_val])
        y_trainval = pd.concat(
            [train_df[target], val_df[target]],
            ignore_index=True,
        )

        clf = LogisticRegression(
            max_iter=3000,
            class_weight="balanced",
            C=best[1],
            random_state=SEED,
        )
        clf.fit(X_trainval, y_trainval)

        predictions[target] = clf.predict(X_test)
        models[target] = clf

    model_dir = output_dir / "models" / "e5_logreg"
    model_dir.mkdir(parents=True, exist_ok=True)

    for target, clf in models.items():
        joblib.dump(clf, model_dir / f"{target}.joblib")

    with (model_dir / "selected_hyperparameters.json").open(
        "w", encoding="utf-8"
    ) as f:
        json.dump(selected_c, f, indent=2)

    # Do not save downloaded transformer weights as experiment output;
    # store the public model ID instead. Keeps Kaggle output small.
    (model_dir / "embedding_model.txt").write_text(
        model_name + "\n",
        encoding="utf-8",
    )

    return predictions, models


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

def make_summary_markdown(
    df: pd.DataFrame,
    metrics: pd.DataFrame,
    lang: pd.DataFrame,
    output_dir: Path,
    env: dict,
) -> None:
    primary = (
        metrics[metrics["target"] == "primary_state"]
        .sort_values("macro_f1", ascending=False)
        .reset_index(drop=True)
    )

    lines = [
        "# Kya Scene Hai — Experiment Summary",
        "",
        "## Dataset",
        "",
        f"- Rows: **{len(df)}**",
        f"- Unique seed groups: **{df['seed_id'].nunique()}**",
        f"- Train rows: **{(df['split']=='train').sum()}**",
        f"- Validation rows: **{(df['split']=='validation').sum()}**",
        f"- Test rows: **{(df['split']=='test').sum()}**",
        "",
        "Splits are grouped by `seed_id`; paraphrases of one seed cannot cross splits.",
        "",
        "## Primary-state benchmark",
        "",
        "| Model | Accuracy | Macro-F1 | Weighted-F1 |",
        "|---|---:|---:|---:|",
    ]

    for _, r in primary.iterrows():
        lines.append(
            f"| {r['model']} | {r['accuracy']:.4f} | "
            f"{r['macro_f1']:.4f} | {r['weighted_f1']:.4f} |"
        )

    lines.extend(
        [
            "",
            "## All targets",
            "",
            "| Model | Target | Accuracy | Macro-F1 |",
            "|---|---|---:|---:|",
        ]
    )

    for _, r in metrics.sort_values(["target", "macro_f1"], ascending=[True, False]).iterrows():
        lines.append(
            f"| {r['model']} | {r['target']} | "
            f"{r['accuracy']:.4f} | {r['macro_f1']:.4f} |"
        )

    lines.extend(
        [
            "",
            "## Primary-state results by language style",
            "",
            "| Model | Language | N | Accuracy | Macro-F1 |",
            "|---|---|---:|---:|---:|",
        ]
    )

    for _, r in lang.sort_values(["model", "language_style"]).iterrows():
        lines.append(
            f"| {r['model']} | {r['language_style']} | {int(r['n'])} | "
            f"{r['primary_state_accuracy']:.4f} | "
            f"{r['primary_state_macro_f1']:.4f} |"
        )

    lines.extend(
        [
            "",
            "## Environment",
            "",
            "```json",
            json.dumps(env, indent=2),
            "```",
            "",
            "## Interpretation note",
            "",
            "The dataset is intentionally small. These numbers are an MVP benchmark, "
            "not evidence of clinical validity or broad population generalization.",
        ]
    )

    (output_dir / "experiment_summary.md").write_text(
        "\n".join(lines),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default=None)
    parser.add_argument(
        "--output-dir",
        default="/kaggle/working/output"
        if Path("/kaggle/working").exists()
        else "artifacts/local",
    )
    parser.add_argument(
        "--e5-model",
        default="intfloat/multilingual-e5-small",
    )
    parser.add_argument(
        "--skip-e5",
        action="store_true",
        help="Run only rule and TF-IDF baselines.",
    )
    args = parser.parse_args()

    set_global_seed()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    env = environment_report()
    with (output_dir / "environment.json").open("w", encoding="utf-8") as f:
        json.dump(env, f, indent=2)

    print("[env]")
    print(json.dumps(env, indent=2))

    # Core dependencies are generally present on Kaggle.
    for import_name, pip_name in [
        ("sklearn", "scikit-learn"),
        ("joblib", "joblib"),
        ("matplotlib", "matplotlib"),
    ]:
        if not ensure_package(import_name, pip_name):
            raise RuntimeError(f"Required dependency unavailable: {pip_name}")

    data_dir = discover_data_dir(args.data_dir)
    df = load_dataset(data_dir)
    df = stratified_group_split(df)

    # Save the exact dataset/splits used for the run.
    split_dir = output_dir / "splits"
    split_dir.mkdir(parents=True, exist_ok=True)
    for split in ["train", "validation", "test"]:
        part = df[df["split"] == split].reset_index(drop=True)
        part.to_csv(split_dir / f"{split}.csv", index=False)
        save_jsonl(part, split_dir / f"{split}.jsonl")

    df.to_csv(output_dir / "final_dataset_with_split.csv", index=False)
    save_jsonl(df, output_dir / "final_dataset_with_split.jsonl")

    train_df = df[df["split"] == "train"].reset_index(drop=True)
    val_df = df[df["split"] == "validation"].reset_index(drop=True)
    test_df = df[df["split"] == "test"].reset_index(drop=True)

    all_metrics = []
    all_language = []

    # Rule baseline.
    print("\n=== Rule baseline ===")
    rule_pred = rule_predictions(test_df["text"])
    rule_metrics, _ = evaluate_predictions(
        "rules",
        test_df,
        rule_pred,
        output_dir,
    )
    all_metrics.append(rule_metrics)
    all_language.append(
        language_breakdown(
            "rules",
            test_df,
            rule_pred["primary_state"],
        )
    )

    # TF-IDF.
    print("\n=== TF-IDF + Logistic Regression ===")
    tfidf_pred, _ = run_tfidf(
        train_df,
        test_df,
        output_dir,
    )
    tfidf_metrics, _ = evaluate_predictions(
        "tfidf_logreg",
        test_df,
        tfidf_pred,
        output_dir,
    )
    all_metrics.append(tfidf_metrics)
    all_language.append(
        language_breakdown(
            "tfidf_logreg",
            test_df,
            tfidf_pred["primary_state"],
        )
    )

    # E5.
    if not args.skip_e5:
        print("\n=== multilingual-e5-small + Logistic Regression ===")
        e5_pred, _ = run_e5(
            train_df,
            val_df,
            test_df,
            output_dir,
            model_name=args.e5_model,
        )
        if e5_pred is not None:
            e5_metrics, _ = evaluate_predictions(
                "e5_logreg",
                test_df,
                e5_pred,
                output_dir,
            )
            all_metrics.append(e5_metrics)
            all_language.append(
                language_breakdown(
                    "e5_logreg",
                    test_df,
                    e5_pred["primary_state"],
                )
            )

    metrics_df = pd.concat(all_metrics, ignore_index=True)
    lang_df = pd.concat(all_language, ignore_index=True)

    metrics_df.to_csv(output_dir / "metrics_summary.csv", index=False)
    lang_df.to_csv(output_dir / "language_breakdown.csv", index=False)

    # Ranking table.
    ranking = (
        metrics_df[metrics_df["target"] == "primary_state"]
        .sort_values("macro_f1", ascending=False)
        .reset_index(drop=True)
    )
    ranking.to_csv(output_dir / "primary_state_ranking.csv", index=False)

    make_summary_markdown(
        df,
        metrics_df,
        lang_df,
        output_dir,
        env,
    )

    print("\n=== FINAL PRIMARY-STATE RANKING ===")
    print(
        ranking[
            ["model", "accuracy", "macro_f1", "weighted_f1"]
        ].to_string(index=False)
    )
    print(f"\nAll artifacts saved to: {output_dir}")


if __name__ == "__main__":
    main()
