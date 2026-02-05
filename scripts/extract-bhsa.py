#!/usr/bin/env python3
"""
BHSA Extraction Script for Meaning Map Editor
==============================================
Extracts clause-level data from the BHSA (Biblia Hebraica Stuttgartensia
Amstelodamensis) using Text-Fabric. Outputs one JSON file per biblical book
into /data/bhsa/.

Requirements:
    pip install text-fabric

Usage:
    python scripts/extract-bhsa.py              # extract all books
    python scripts/extract-bhsa.py ruth         # extract one book
    python scripts/extract-bhsa.py ruth genesis # extract multiple books

Output format per book (e.g., ruth.json):
{
  "name": "Ruth",
  "chapters": 4,
  "verses": [
    {
      "book": "Ruth",
      "chapter": 1,
      "verse": 1,
      "reference": "Ruth 1:1",
      "clauses": [
        {
          "id": 427571,
          "clause_type": "xQtX",
          "is_verbless": false,
          "hebrew_text": "...",
          "transliteration": "...",
          "gloss": "...",
          "phrases": [
            {
              "id": 651234,
              "function": "subj",
              "hebrew": "...",
              "transliteration": "...",
              "gloss": "..."
            }
          ]
        }
      ]
    }
  ]
}

The clause segmentation is sacred \u2014 we never split or merge BHSA clauses.
This data is committed to the repo and only updated when the BHSA version changes.
"""

import json
import os
import sys
from pathlib import Path

try:
    from tf.app import use
except ImportError:
    print("ERROR: text-fabric is not installed.")
    print("Install it with: pip install text-fabric")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OUTPUT_DIR = Path(__file__).parent.parent / "data" / "bhsa"
BHSA_VERSION = "2021"  # BHSA version to use

# Book name mapping: Text-Fabric name \u2192 clean filename
BOOK_NAMES = {
    "Genesis": "genesis",
    "Exodus": "exodus",
    "Leviticus": "leviticus",
    "Numbers": "numbers",
    "Deuteronomy": "deuteronomy",
    "Joshua": "joshua",
    "Judges": "judges",
    "Ruth": "ruth",
    "1_Samuel": "1_samuel",
    "2_Samuel": "2_samuel",
    "1_Kings": "1_kings",
    "2_Kings": "2_kings",
    "1_Chronicles": "1_chronicles",
    "2_Chronicles": "2_chronicles",
    "Ezra": "ezra",
    "Nehemiah": "nehemiah",
    "Esther": "esther",
    "Job": "job",
    "Psalms": "psalms",
    "Proverbs": "proverbs",
    "Ecclesiastes": "ecclesiastes",
    "Song_of_songs": "song_of_songs",
    "Isaiah": "isaiah",
    "Jeremiah": "jeremiah",
    "Lamentations": "lamentations",
    "Ezekiel": "ezekiel",
    "Daniel": "daniel",
    "Hosea": "hosea",
    "Joel": "joel",
    "Amos": "amos",
    "Obadiah": "obadiah",
    "Jonah": "jonah",
    "Micah": "micah",
    "Nahum": "nahum",
    "Habakkuk": "habakkuk",
    "Zephaniah": "zephaniah",
    "Haggai": "haggai",
    "Zechariah": "zechariah",
    "Malachi": "malachi",
}


def is_verbless_clause(api, clause_node):
    """
    Determine if a clause is verbless (nominal clause).
    A clause is verbless if it contains no phrase with function 'Pred'
    or 'PreO' that contains a verb (pdp='verb').
    """
    F = api.F
    L = api.L

    for phrase in L.d(clause_node, "phrase"):
        pf = F.function.v(phrase)
        if pf in ("Pred", "PreO"):
            # Check if any word in this phrase is a verb
            for word in L.d(phrase, "word"):
                if F.pdp.v(word) == "verb":
                    return False
    return True


def extract_phrase(api, phrase_node):
    """Extract data for a single phrase."""
    F = api.F
    L = api.L
    T = api.T

    words = L.d(phrase_node, "word")

    hebrew_parts = []
    translit_parts = []
    gloss_parts = []

    for w in words:
        hebrew_parts.append(T.text(w, fmt="text-orig-full"))
        # Transliteration
        tr = F.phono.v(w) if hasattr(F, "phono") and F.phono.v(w) else F.lex_utf8.v(w)
        translit_parts.append(tr or "")
        # Gloss
        gl = F.gloss.v(w) if hasattr(F, "gloss") and F.gloss.v(w) else ""
        gloss_parts.append(gl)

    return {
        "id": phrase_node,
        "function": F.function.v(phrase_node) or "",
        "hebrew": "".join(hebrew_parts).strip(),
        "transliteration": " ".join(translit_parts).strip(),
        "gloss": " ".join(g for g in gloss_parts if g).strip(),
    }


def extract_clause(api, clause_node):
    """Extract data for a single clause."""
    F = api.F
    L = api.L
    T = api.T

    # Get all words in the clause for full text
    words = L.d(clause_node, "word")
    hebrew_text = T.text(clause_node, fmt="text-orig-full").strip()

    translit_parts = []
    gloss_parts = []
    for w in words:
        tr = F.phono.v(w) if hasattr(F, "phono") and F.phono.v(w) else F.lex_utf8.v(w)
        translit_parts.append(tr or "")
        gl = F.gloss.v(w) if hasattr(F, "gloss") and F.gloss.v(w) else ""
        gloss_parts.append(gl)

    # Extract phrases
    phrases = []
    for phrase in L.d(clause_node, "phrase"):
        phrases.append(extract_phrase(api, phrase))

    return {
        "id": clause_node,
        "clause_type": F.typ.v(clause_node) or "",
        "is_verbless": is_verbless_clause(api, clause_node),
        "hebrew_text": hebrew_text,
        "transliteration": " ".join(translit_parts).strip(),
        "gloss": " ".join(g for g in gloss_parts if g).strip(),
        "phrases": phrases,
    }


def extract_book(api, book_name):
    """Extract all verse and clause data for a single book."""
    T = api.T
    F = api.F
    L = api.L

    print(f"  Extracting {book_name}...")

    # Get all verses in this book
    book_node = None
    for b in F.otype.s("book"):
        if F.book.v(b) == book_name:
            book_node = b
            break

    if book_node is None:
        print(f"  WARNING: Book '{book_name}' not found in BHSA. Skipping.")
        return None

    # Count chapters
    chapters = L.d(book_node, "chapter")
    num_chapters = len(chapters)

    verses_data = []

    for verse_node in L.d(book_node, "verse"):
        chapter_num = F.chapter.v(verse_node)
        verse_num = F.verse.v(verse_node)
        display_name = book_name.replace("_", " ")
        reference = f"{display_name} {chapter_num}:{verse_num}"

        # Get clauses within this verse
        clauses = []
        for clause_node in L.d(verse_node, "clause"):
            clauses.append(extract_clause(api, clause_node))

        verses_data.append({
            "book": display_name,
            "chapter": chapter_num,
            "verse": verse_num,
            "reference": reference,
            "clauses": clauses,
        })

    return {
        "name": book_name.replace("_", " "),
        "chapters": num_chapters,
        "verses": verses_data,
    }


def main():
    """Main extraction pipeline."""
    # Determine which books to extract
    if len(sys.argv) > 1:
        requested = [b.lower() for b in sys.argv[1:]]
        # Map filenames back to TF book names
        reverse_map = {v: k for k, v in BOOK_NAMES.items()}
        books_to_extract = []
        for r in requested:
            if r in reverse_map:
                books_to_extract.append(reverse_map[r])
            else:
                # Try to match directly
                for tf_name in BOOK_NAMES:
                    if tf_name.lower() == r:
                        books_to_extract.append(tf_name)
                        break
                else:
                    print(f"  WARNING: Unknown book '{r}'. Skipping.")
    else:
        books_to_extract = list(BOOK_NAMES.keys())

    print(f"Meaning Map Editor \u2014 BHSA Extraction")
    print(f"=====================================")
    print(f"Books to extract: {len(books_to_extract)}")
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load BHSA via Text-Fabric
    print("Loading BHSA via Text-Fabric...")
    A = use("ETCBC/bhsa", version=BHSA_VERSION, silent="deep")
    api = A.api
    print("BHSA loaded successfully.\n")

    # Extract each book
    total_clauses = 0
    total_verses = 0

    for book_name in books_to_extract:
        book_data = extract_book(api, book_name)
        if book_data is None:
            continue

        filename = BOOK_NAMES.get(book_name, book_name.lower()) + ".json"
        filepath = OUTPUT_DIR / filename

        # Count stats
        num_verses = len(book_data["verses"])
        num_clauses = sum(len(v["clauses"]) for v in book_data["verses"])
        total_verses += num_verses
        total_clauses += num_clauses

        # Write JSON
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(book_data, f, ensure_ascii=False, indent=2)

        print(f"  \u2192 {filename}: {num_verses} verses, {num_clauses} clauses")

    print("\nExtraction complete.")
    print(f"  Total: {total_verses} verses, {total_clauses} clauses")
    print(f"  Output: {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
