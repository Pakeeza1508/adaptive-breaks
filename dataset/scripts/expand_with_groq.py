"""
Generate candidate paraphrases with Groq.

Requirements:
- GROQ_API_KEY must be set in environment
- Generated rows are candidates only
- Human review before publishing
"""

import os
import json
import time
from pathlib import Path

from groq import Groq


MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b"
)

INPUT = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "seeds.jsonl"
)

OUTPUT = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "generated_candidates.jsonl"
)

FAILED_OUTPUT = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "generation_failures.jsonl"
)


client = Groq(
    api_key=os.environ["GROQ_API_KEY"]
)


SYSTEM = """
You generate natural paraphrases for a non-clinical
student cognitive-state dataset.

Preserve the original cognitive meaning exactly.

Generate exactly three variants:

1. English
2. Roman Urdu
3. Natural Urdu-English code-mixed language

Rules:

- Do not change the original state.
- Do not increase or decrease severity.
- Do not introduce a psychiatric diagnosis.
- Do not introduce self-harm language.
- Do not mention the labels themselves.
- Roman Urdu should sound natural for a Pakistani
  university student.
- Code-mixed text should sound natural, not translated.
- Keep each statement short and conversational.
"""


RESPONSE_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "dataset_paraphrases",
        "strict": True,
        "schema": {
            "type": "object",

            "properties": {
                "variants": {
                    "type": "array",

                    "minItems": 3,
                    "maxItems": 3,

                    "items": {
                        "type": "object",

                        "properties": {
                            "text": {
                                "type": "string"
                            },

                            "language_style": {
                                "type": "string",
                                "enum": [
                                    "english",
                                    "roman_urdu",
                                    "code_mixed"
                                ]
                            }
                        },

                        "required": [
                            "text",
                            "language_style"
                        ],

                        "additionalProperties": False
                    }
                }
            },

            "required": [
                "variants"
            ],

            "additionalProperties": False
        }
    }
}


def generate(row):

    user_payload = {
        "seed_id": row["seed_id"],
        "original_text": row["text"],

        "labels": {
            "energy": row["energy"],
            "tension": row["tension"],
            "attention": row["attention"],
            "primary_state": row[
                "primary_state"
            ]
        },

        "instruction":
            "Generate exactly three meaning-preserving variants."
    }

    response = (
        client.chat.completions.create(
            model=MODEL,

            temperature=0.7,

            messages=[
                {
                    "role": "system",
                    "content": SYSTEM
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        user_payload,
                        ensure_ascii=False
                    )
                }
            ],

            response_format=RESPONSE_SCHEMA
        )
    )

    content = (
        response
        .choices[0]
        .message
        .content
    )

    return json.loads(content)


def already_generated():

    completed = set()

    if not OUTPUT.exists():
        return completed

    with OUTPUT.open(
        "r",
        encoding="utf-8"
    ) as file:

        for line in file:

            if not line.strip():
                continue

            try:
                row = json.loads(line)

                completed.add(
                    row["seed_id"]
                )

            except Exception:
                pass

    return completed


completed = already_generated()

print(
    f"Already completed: {len(completed)} seeds"
)


with INPUT.open(
    "r",
    encoding="utf-8"
) as source:

    for line in source:

        row = json.loads(line)

        seed_id = row["seed_id"]

        if seed_id in completed:

            print(
                f"SKIP {seed_id}"
            )

            continue

        try:

            result = generate(row)

            variants = result["variants"]

            # Extra sanity check
            expected_styles = {
                "english",
                "roman_urdu",
                "code_mixed"
            }

            actual_styles = {
                item["language_style"]
                for item in variants
            }

            if actual_styles != expected_styles:

                raise ValueError(
                    f"Wrong language styles: "
                    f"{actual_styles}"
                )

            with OUTPUT.open(
                "a",
                encoding="utf-8"
            ) as target:

                for index, variant in enumerate(
                    variants,
                    start=1
                ):

                    output_row = {
                        "seed_id": seed_id,

                        "variant_id":
                            f"{seed_id}_g{index}",

                        "text":
                            variant["text"],

                        "language_style":
                            variant[
                                "language_style"
                            ],

                        "energy":
                            row["energy"],

                        "tension":
                            row["tension"],

                        "attention":
                            row["attention"],

                        "primary_state":
                            row["primary_state"],

                        "source":
                            "groq_generated_unreviewed",

                        "review_status":
                            "pending"
                    }

                    target.write(
                        json.dumps(
                            output_row,
                            ensure_ascii=False
                        )
                        + "\n"
                    )

            print(
                f"OK   {seed_id}"
            )

            time.sleep(0.25)

        except Exception as exc:

            print(
                f"FAILED {seed_id}: {exc}"
            )

            with FAILED_OUTPUT.open(
                "a",
                encoding="utf-8"
            ) as failure_file:

                failure_file.write(
                    json.dumps(
                        {
                            "seed_id":
                                seed_id,

                            "error":
                                str(exc)
                        },
                        ensure_ascii=False
                    )
                    + "\n"
                )


print()
print("Generation finished.")
print(f"Output:   {OUTPUT}")
print(f"Failures: {FAILED_OUTPUT}")