# Sai Gayatri Industries

Web-based industrial business management application built with React, TypeScript, Vite and Supabase.

---

## 📚 Complete Learning & Interview Notebooks

Comprehensive notebook-style guides covering the complete system architecture, frontend engineering, backend schema, PL/pgSQL triggers, real-time algorithms, and interview mastery are available in the [`docs/`](./docs/README.md) directory:

- 📖 **[Master Unified Notebook (All-in-One Guide)](./docs/SAI_GAYATRI_FULL_SYSTEM_NOTEBOOK.md)**
- 📘 **[Chapter 01: System Overview & Architecture](./docs/01_SYSTEM_OVERVIEW_AND_ARCHITECTURE.md)**
- 📘 **[Chapter 02: Frontend Engineering Deep Dive](./docs/02_FRONTEND_ENGINEERING_DEEP_DIVE.md)**
- 📘 **[Chapter 03: Modules, Workflow & Business Logic](./docs/03_MODULES_WORKFLOW_AND_LOGIC.md)**
- 📘 **[Chapter 04: Backend, Supabase & SQL Database](./docs/04_BACKEND_SUPABASE_AND_SQL_DATABASE.md)**
- 📘 **[Chapter 05: Data Flow & Storage Lifecycle](./docs/05_DATA_FLOW_AND_STORAGE_LIFECYCLE.md)**
- 🎯 **[Chapter 06: Interview Preparation & System Design Q&A Playbook](./docs/06_INTERVIEW_PREPARATION_AND_QA_GUIDE.md)**

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
