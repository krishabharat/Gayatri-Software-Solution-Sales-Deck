# Sai Gayatri Industries

Web-based industrial business management application built with React, TypeScript, Vite and Supabase.

---

## 📖 App Build & Architecture Notes

A single, practical, diagram-driven guide covering how the app was built stage by stage, Mobile vs Laptop UI/UX, React, Python/Vercel backends, Supabase, RAG, and Gemini AI is available here:

- **[APP_BUILD_NOTES.md](./APP_BUILD_NOTES.md)**

---

## Run the web app

```sh
npm install
npm run dev
```

Create a production web build with:

```sh
npm run build
```

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the web deployment environment.

## Inventory setup

For an existing Supabase database, apply `supabase/migrations/20261007_stock_intakes.sql` before deploying this version. It creates the stock-intake table, safely copies the existing inventory rows, checks for duplicate products before migration, and preserves the old `inventory` table. If it finds ambiguous duplicate product names or IDs, it stops rather than merging or dropping history.

For a new, empty Supabase database, use `supabase/schema.sql`.

Products are created once in Product Master. Each delivery is recorded as a new, append-only stock intake. A multi-product intake shares one date, supplier and batch; purchase history and price trends remain on the product. Current stock uses the migrated inventory balance and subtracts sales recorded after the migration cutover, avoiding counting legacy sales twice.

Stock intake records cannot be edited or deleted. Correct an entry by adding a new intake record.
