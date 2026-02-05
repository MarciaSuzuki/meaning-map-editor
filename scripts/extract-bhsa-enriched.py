#!/usr/bin/env python3
"""
Enriched BHSA Extraction Script
Produces one JSON file per book with clause → phrase → word structure
including all morphological features needed for Tier 1 pre-fill.

Usage:
    python extract-bhsa-enriched.py ruth          # single book
    python extract-bhsa-enriched.py               # all books (takes ~5 min)
    python extract-bhsa-enriched.py --output ../data/bhsa  # custom output dir

Requirements:
    pip install text-fabric
    (Data auto-downloads on first run, ~500MB)
"""

import json
import os
import sys
import time
from pathlib import Path

from tf.app import use

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# BHSA book names (English, as Text-Fabric expects them)
ALL_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth",
    "1_Samuel", "2_Samuel", "1_Kings", "2_Kings",
    "1_Chronicles", "2_Chronicles",
    "Ezra", "Nehemiah", "Esther",
    "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song_of_songs",
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel",
    "Daniel", "Hosea", "Joel", "Amos", "Obadiah",
    "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
    "Haggai", "Zechariah", "Malachi",
]

# Priority books for pilot testing
PILOT_BOOKS = ["Ruth", "Jonah", "Genesis"]

BHSA_VERSION = "2021"
EXTRACTION_VERSION = "enriched-v1"

# ---------------------------------------------------------------------------
# Feature extraction functions
# ---------------------------------------------------------------------------

def safe(feature_func, node, default="NA"):
    """Safely get a feature value, returning default if None."""
    val = feature_func(node)
    return val if val is not None else default


def extract_word(F, word):
    """Extract all relevant features for a single word node."""
    return {
        "word_id": int(word),
        "text_utf8": safe(F.g_word_utf8.v, word, ""),
        "lex": safe(F.lex.v, word, ""),
        "lex_utf8": safe(F.lex_utf8.v, word, ""),
        "gloss": safe(F.gloss.v, word, ""),
        "sp": safe(F.sp.v, word, ""),
        "pdp": safe(F.pdp.v, word, ""),
        "gn": safe(F.gn.v, word, "NA"),
        "nu": safe(F.nu.v, word, "NA"),
        "ps": safe(F.ps.v, word, "NA"),
        "vs": safe(F.vs.v, word, "NA"),
        "vt": safe(F.vt.v, word, "NA"),
        "st": safe(F.st.v, word, "NA"),
        "ls": safe(F.ls.v, word, "NA"),
        "nametype": safe(F.nametype.v, word, "NA"),
        "prs": safe(F.prs.v, word, "absent"),
        "prs_gn": safe(F.prs_gn.v, word, "NA"),
        "prs_nu": safe(F.prs_nu.v, word, "NA"),
        "prs_ps": safe(F.prs_ps.v, word, "NA"),
    }


def extract_phrase(F, L, phrase):
    """Extract phrase-level features and all contained words."""
    words = [extract_word(F, w) for w in L.d(phrase, otype="word")]
    return {
        "phrase_id": int(phrase),
        "function": safe(F.function.v, phrase, "NA"),
        "typ": safe(F.typ.v, phrase, "NA"),
        "rela": safe(F.rela.v, phrase, "NA"),
        "words": words,
    }


def extract_clause(F, L, T, clause):
    """Extract clause-level features, phrases, and a flat word list."""
    phrases = [extract_phrase(F, L, p) for p in L.d(clause, otype="phrase")]
    words = [extract_word(F, w) for w in L.d(clause, otype="word")]

    # Build Hebrew text and gloss from words
    hebrew_text = " ".join(w["text_utf8"] for w in words if w["text_utf8"])
    gloss = " ".join(w["gloss"] for w in words if w["gloss"])

    kind_value = safe(F.kind.v, clause, "") if hasattr(F, "kind") else ""
    return {
        "clause_id": int(clause),
        "typ": safe(F.typ.v, clause, ""),
        "txt": safe(F.txt.v, clause, ""),
        "rela": safe(F.rela.v, clause, ""),
        "domain": safe(F.domain.v, clause, ""),
        "kind": kind_value,
        "hebrew_text": hebrew_text,
        "transliteration": "",  # could add if needed
        "gloss": gloss,
        "phrases": phrases,
        "words": words,
    }


def extract_book(A, F, L, T, book_name):
    """Extract all data for one biblical book."""
    print(f"  Extracting {book_name}...", end=" ", flush=True)
    start = time.time()

    book_data = {
        "book": book_name,
        "extraction_version": EXTRACTION_VERSION,
        "bhsa_version": BHSA_VERSION,
        "verses": [],
    }

    clause_count = 0

    for chapter in F.otype.s("chapter"):
        section = T.sectionFromNode(chapter)
        if section[0] != book_name:
            continue
        ch_num = section[1]

        for verse in L.d(chapter, otype="verse"):
            v_num = F.verse.v(verse)
            clauses = []

            for clause in L.d(verse, otype="clause"):
                clauses.append(extract_clause(F, L, T, clause))
                clause_count += 1

            if clauses:
                book_data["verses"].append({
                    "chapter": ch_num,
                    "verse": v_num,
                    "clauses": clauses,
                })

    elapsed = time.time() - start
    verse_count = len(book_data["verses"])
    print(f"{verse_count} verses, {clause_count} clauses ({elapsed:.1f}s)")

    return book_data


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Extract enriched BHSA data for Meaning Map Editor Tier 1 pre-fill."
    )
    parser.add_argument(
        "books",
        nargs="*",
        help="Book names to extract (e.g., 'ruth', 'genesis'). If empty, extracts pilot books.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Extract all 39 OT books.",
    )
    parser.add_argument(
        "--output", "-o",
        default="data/bhsa",
        help="Output directory for JSON files (default: data/bhsa).",
    )
    args = parser.parse_args()

    # Determine which books to extract
    if args.all:
        books = ALL_BOOKS
    elif args.books:
        # Normalize input: "ruth" → "Ruth", "1_samuel" → "1_Samuel"
        book_map = {b.lower().replace(" ", "_"): b for b in ALL_BOOKS}
        books = []
        for b in args.books:
            key = b.lower().replace(" ", "_")
            if key in book_map:
                books.append(book_map[key])
            else:
                print(f"  Warning: unknown book '{b}', skipping.")
        if not books:
            print("No valid books specified. Available books:")
            for b in ALL_BOOKS:
                print(f"  {b}")
            sys.exit(1)
    else:
        books = PILOT_BOOKS
        print(f"No books specified. Extracting pilot set: {', '.join(books)}")

    # Initialize Text-Fabric
    print(f"Loading BHSA (version {BHSA_VERSION})...")
    A = use("ETCBC/bhsa", hoist=globals())

    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Extract each book
    print(f"\nExtracting {len(books)} book(s) to {output_dir}/")
    total_start = time.time()

    for book_name in books:
        book_data = extract_book(A, F, L, T, book_name)

        filename = output_dir / f"{book_name.lower().replace(' ', '_')}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(book_data, f, ensure_ascii=False, indent=2)

    total_elapsed = time.time() - total_start
    print(f"\nDone. {len(books)} books extracted in {total_elapsed:.1f}s")
    print(f"Output: {output_dir.resolve()}")


if __name__ == "__main__":
    main()
