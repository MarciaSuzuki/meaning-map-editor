# Shema Meaning Maps

**Semantic Mapping of Biblical Text for AI-Assisted OBT**

The Meaning Map Editor is the core tool of the Tripod Method. It creates clause-level semantic annotations of biblical Hebrew text. The method separates meaning from expression to avoid translationese in Bible translation for oral communities.

## The Tripod Method

1. **Meaning Maps** \u2014 clause-level semantic annotations (this app)
2. **Language Archive** \u2014 community speech samples tagged with the same ontology
3. **Concept Bank** \u2014 validated natural expressions matched between Maps and Archive

## Stack

- **Frontend:** Next.js (React + TypeScript) on Vercel
- **Database:** Supabase (PostgreSQL with row-level security)
- **AI Review:** Claude Sonnet via Anthropic API (Pass 4 only)
- **Source Text:** BHSA (bundled as static JSON, not fetched at runtime)

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd meaning-map-editor
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Fill in your Supabase and Anthropic API keys
```

### 3. Set up Supabase

Run the migration in `supabase/migrations/001_initial_schema.sql` against your Supabase project.

### 4. Extract BHSA data

```bash
pip install text-fabric
python scripts/extract-bhsa.py ruth    # single book
python scripts/extract-bhsa.py         # all books
```

The extraction creates one JSON file per book in `/data/bhsa/`.

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Four-Pass Workflow

| Pass | Focus | Question |
|------|-------|----------|
| 1 | Structural Skeleton | WHO does WHAT |
| 2 | Semantic Context | HOW and WHY |
| 3 | Expressive Layer | WHAT DOES IT FEEL LIKE |
| 4 | AI Review | Quality check (Claude flags, humans decide) |

## Project Structure

```
meaning-map-editor/
\u251c\u2500\u2500 app/                    # Next.js app router
\u2502   \u251c\u2500\u2500 page.tsx            # Landing / project list
\u2502   \u251c\u2500\u2500 editor/[id]/        # Main editor for a pericope
\u2502   \u2514\u2500\u2500 api/review/         # Claude AI review endpoint
\u251c\u2500\u2500 components/             # React components (to be ported)
\u251c\u2500\u2500 data/bhsa/              # Static BHSA JSON per book
\u251c\u2500\u2500 lib/
\u2502   \u251c\u2500\u2500 ontology.ts         # Tripod Ontology v5.3 constants
\u2502   \u251c\u2500\u2500 types.ts            # TypeScript interfaces
\u2502   \u251c\u2500\u2500 supabase.ts         # Supabase client
\u2502   \u2514\u2500\u2500 bhsa.ts             # BHSA data loader
\u251c\u2500\u2500 scripts/
\u2502   \u2514\u2500\u2500 extract-bhsa.py     # Text-Fabric extraction script
\u251c\u2500\u2500 supabase/migrations/    # Database schema SQL
\u2514\u2500\u2500 public/logos/            # Shema brand assets
```

## Design Principles

1. **Human authority over AI.** AI reviews, humans decide.
2. **Genre determines active layers.** 40\u201360% question reduction.
3. **not_specified > guessing.** Sparse accurate beats dense speculative.
4. **Verbless clauses are first-class events.** No ghost verbs.
5. **BHSA clause segmentation is sacred.** Never split or merge.

## Ontology

Tripod Ontology v5.3 \u2014 14 layers, 7 genres, 38 sub-genres. Full specification in `lib/ontology.ts` and `lib/types.ts`.

---

Shema Bible Translation \u00b7 Ready Vessels Project \u00b7 YWAM Kansas City \u00b7 2026
