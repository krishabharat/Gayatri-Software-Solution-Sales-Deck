# 📓 Chapter 06: Interview Preparation & QA Guide

## 1. Elevator Pitches (Memorize & Adapt)

### ⏱️ The 30-Second Pitch
> "I built an industrial ERP and inventory management platform for **Sai Gayatri Industries**, a disposable paper and plastic plate manufacturer. The system replaces error-prone paper registers with an automated web application built on **React 19, TypeScript, TailwindCSS v4, and Supabase PostgreSQL**. It features an append-only audited inventory ledger, real-time stock-on-hand calculations, client-side PDF invoice generation, an inquiry-to-order pipeline, and a consolidated P&L reporting engine."

---

### ⏱️ The 2-Minute Technical Walkthrough
> "Sai Gayatri Industries needed a streamlined system to manage their manufacturing workflows, supplier procurement, multi-product sales, and daily operational overhead.
>
> On the frontend, I engineered a responsive interface using **React 19, TypeScript, and Vite**. I implemented route-level code splitting with `React.lazy` and a custom in-memory TTL read cache (`createReadCache`) that deduplicates network requests, yielding instant screen transitions while invalidating automatically on database mutations. For sales billing, I built an interactive invoice generator that calculates sub-totals, discounts, and payment balances in real time, and renders branded, publication-ready PDF invoices directly in the browser via `jsPDF` and `jspdf-autotable`.
>
> On the backend, I utilized **Supabase and PostgreSQL** with Row Level Security. Instead of mutable CRUD inventory tables, I designed an append-only stock intake ledger with PL/pgSQL database triggers. When delivery quantities need correction, an automated database trigger logs the exact JSONB diff to an audit table while forbidding deletions. The system links sales, stock intakes, and 12 distinct factory expense categories into a live financial engine that computes real net profit margins."

---

### ⏱️ The 5-Minute Architectural Deep Dive
> "When designing the architecture for Sai Gayatri Industries, my priority was **financial accuracy, operational auditability, and speed**.
>
> **1. Data Architecture & Integrity**:
> In industrial manufacturing, procurement costs fluctuate per delivery based on paper GSM, supplier rates, and transport freight. Traditional inventory databases update a single `quantity` column, which destroys historical cost data. I designed an append-only delivery ledger (`stock_intakes`) grouped by UUID batch IDs. Stock-on-hand is calculated dynamically:
> $$\text{Stock on Hand} = \text{Total Received} - \text{Tracked Sales}$$
> To prevent double-counting historical sales during migration from the legacy daybook, I introduced a database cutover setting (`sales_stock_tracking_started_at`) that only deducts sales created after the transition timestamp.
>
> **2. Audited Database Triggers**:
> To prevent internal fraud or accidental deletions on the factory floor, I wrote PL/pgSQL triggers. A `BEFORE DELETE` trigger explicitly rejects receipt deletion with a custom Postgres exception. Meanwhile, a `BEFORE UPDATE` trigger automatically captures the old and new record states into `stock_intake_audit` as JSONB snapshots.
>
> **3. Client-Side Performance & Caching**:
> Rather than bloating the bundle with heavy state libraries, I built a lightweight in-memory cache wrapper with generation tokens and a 15-second TTL. This deduplicates identical concurrent requests across components and gives sub-second page switches.
>
> **4. Financial Tracking & P&L**:
> Each sale line item records both `selling_price` and `purchase_cost` at the moment of sale. This enables exact Cost of Goods Sold (COGS) tracking. When combined with our operational expenses module—which tracks rent, power, diesel, heating elements, and machine tooling—the application generates granular monthly P&L statements exportable to Excel and PDF."

---

## 2. Core Architecture & System Design Questions

### Q1: Why did you choose React 19 + Supabase instead of a custom Node/Express/MongoDB stack?
**Answer**:
"For a business ERP of this scale, speed-to-market, relational data integrity, and strict ACID guarantees were critical.
- **Relational Integrity over NoSQL**: Manufacturing data is inherently relational: Products belong to categories, sales contain multiple line items, deliveries link to suppliers, and invoices link to orders. PostgreSQL guarantees foreign key integrity, cascade deletes, and check constraints that MongoDB documents cannot easily enforce.
- **PostgREST Architecture**: Supabase provides auto-generated RESTful endpoints directly from the PostgreSQL schema, eliminating thousands of lines of boilerplate CRUD controller code in Express.
- **Database-Level Business Rules**: PostgreSQL allows writing PL/pgSQL triggers for immutable audit logging and Row Level Security, keeping security rules adjacent to the data rather than spread across API endpoints."

---

### Q2: How did you implement caching and state management without Redux or React Query?
**Answer**:
"For this application, Redux would have introduced unnecessary boilerplate and bundle size. Instead, I separated concerns into two layers:
1. **Component State**: Local UI state (e.g., active modal, current input text, line item arrays) is handled with standard React hooks (`useState`, `useMemo`).
2. **In-Memory Service Cache (`createReadCache`)**: In `cloudStorage.ts`, I created a lightweight closure-based read cache with:
   - Request deduplication (sharing in-flight Promises).
   - A 15-second expiration TTL.
   - A generation token counter.
   - Instant explicit invalidation upon mutations (`invalidate()`).
This gave us 90% of React Query’s benefits with zero external dependencies and under 40 lines of code."

---

### Q3: How do you generate invoice IDs like `SG2026112300001` and prevent collisions?
**Answer**:
"In `cloudStorage.ts`, the `getNextInvoiceId(saleDate)` function extracts the date part (e.g., `20261123`), queries Supabase for the highest existing ID with that prefix:
```sql
SELECT id FROM sales WHERE id LIKE 'SG20261123%' ORDER BY id DESC LIMIT 1;
```
It extracts the 5-digit sequence suffix, increments it by 1, and pads it with leading zeros (`00001`, `00002`).
In high-concurrency environments, this can also be backed by a PostgreSQL database `SEQUENCE` or an atomic transaction counter to guarantee serializability."

---

### Q4: Why did you choose an append-only stock ledger instead of updating a simple `stock_quantity` column?
**Answer**:
"In manufacturing, simply incrementing or decrementing a single integer destroys operational history:
- You cannot verify *who* changed the stock, *when* it was delivered, or *which supplier* provided it.
- Paper plate raw materials vary in cost per batch (e.g., ₹45/kg in October, ₹52/kg in November due to raw pulp price shifts).
With an append-only delivery ledger (`stock_intakes`), we record every delivery batch with its specific unit cost, supplier, and freight fees. This allows us to calculate weighted average costs, analyze price trends, and provide full auditability."

---

### Q5: How does the system prevent double-counting historical inventory when migrating legacy sales?
**Answer**:
"This was one of the most interesting data challenges on the project.
When we migrated legacy inventory balances into the new database, the opening stock quantities already reflected past sales. If our algorithm subtracted *all* sales recorded in the database, old sales would have been subtracted twice!
To solve this, I stored a cutover configuration key `sales_stock_tracking_started_at` in table `stock_intake_settings`. In `src/utils/cloudStorage.ts`, the stock engine filters sales:
- All sales are displayed in historical revenue and financial reports.
- **Only sales timestamped after the cutover date** are deducted from the active stock-on-hand ledger."

---

### Q6: How does the order inquiries Kanban pipeline convert into a sales invoice?
**Answer**:
"In `src/pages/OrderQueries.tsx`, orders move through 5 operational stages:
`Order` $\rightarrow$ `To Pickup` $\rightarrow$ `To Deliver` $\rightarrow$ `Delivered` $\rightarrow$ `Cancelled`.
When factory dispatch marks an order as `Delivered`:
1. The system calls `getNextInvoiceId(orderDate)` to issue a formal invoice number.
2. It inserts a new record into `public.sales` and line items into `public.sale_products`.
3. It sets `order_queries.sale_id` to link both records.
4. It sets the payment status based on whether advance payment covered the total amount.
This ensures manufacturing inquiries automatically transition into billing records without re-typing data."

---

## 3. Database & SQL Deep Dive Questions

### Q7: Explain the PostgreSQL trigger you wrote for stock intake audit logging.
**Answer**:
"I authored a PL/pgSQL function named `audit_stock_intake_update()`:
```sql
create or replace function public.audit_stock_intake_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.stock_intake_audit (stock_intake_id, changed_by, old_values, new_values)
  values (old.id, coalesce(auth.uid()::text, current_user), to_jsonb(old), to_jsonb(new));
  return new;
end;
$$;
```
It is bound to `BEFORE UPDATE ON stock_intakes FOR EACH ROW`. By using `to_jsonb(old)` and `to_jsonb(new)`, it serializes the exact previous and updated rows into JSONB columns. This creates a tamper-proof audit log that tracks every price or quantity adjustment."

---

### Q8: What happens if someone tries to delete a stock receipt in SQL?
**Answer**:
"I attached a trigger `stock_intakes_prevent_delete` which invokes `reject_stock_intake_delete()`:
```sql
create or replace function public.reject_stock_intake_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Stock receipts cannot be deleted. Edit the receipt instead so the correction is audited.';
end;
$$;
```
If any client sends an HTTP `DELETE` or executes `DELETE FROM stock_intakes`, PostgreSQL immediately aborts the transaction with an exception. To correct a mistake, users must update the record so that the edit is audited."

---

### Q9: How do you calculate Net Profit in your financial reporting module?
**Answer**:
"Net Profit is computed through an exact 3-tier equation:
$$\text{Net Profit} = \text{Revenue} - \text{COGS} - \text{Operating Expenses}$$
1. **Gross Revenue**: Sum of all `sales.grand_total` within the selected date window.
2. **COGS (Cost of Goods Sold)**: For each sale, we iterate its `sale_products` and sum $(\text{quantity} \times \text{purchase\_cost})$. Because `purchase_cost` is locked in at the moment of sale, fluctuations in future supplier prices do not distort past profit margins.
3. **Operating Expenses**: Sum of all `business_expenses.amount` (electricity, machinery repairs, dies, petrol, rent, heating coils) within the same period."

---

## 4. Frontend & Performance Questions

### Q10: How did you optimize bundle size and load performance in Vite?
**Answer**:
"Three primary techniques:
1. **Route-Level Code Splitting**: All pages (`Home`, `Sales`, `ProductMaster`, `Reports`, etc.) are lazy-loaded via `React.lazy()` and `Suspense`. This breaks the app into smaller asynchronous chunks.
2. **Tree-Shaking**: Vite and Rollup prune unused exports from modern libraries like `@supabase/supabase-js` and `jspdf`.
3. **Zero-Runtime Tailwind v4**: Tailwind CSS v4 compiles classes ahead of time into a tiny ~39 kB CSS file without runtime JavaScript overhead."

---

### Q11: Why generate PDFs and Excel workbooks on the client instead of using a serverless backend?
**Answer**:
"1. **Zero Cold-Starts & Latency**: Serverless PDF generators (like Puppeteer/Chromium on AWS Lambda) have 3-5 second cold starts and high memory footprints (500 MB+). In contrast, `jsPDF` compiles vector A4 documents in the browser within 80 milliseconds.
2. **Zero Server Costs**: The client device does the rendering, saving backend CPU and bandwidth.
3. **Data Security**: Sensitive commercial customer invoices are formatted locally in memory without uploading intermediate files to third-party file buckets."

---

## 5. Behavioral & Challenge Questions (STAR Method)

### Question: "Describe a difficult technical bug or challenge you faced and how you resolved it."
**Situation**:
"During deployment, we noticed that when warehouse staff opened the inventory page, sales deductions were inconsistent and some products showed negative stock balances."

**Task**:
"I needed to trace why stock-on-hand was miscalculating and ensure stock balances accurately represented physical factory warehouse shelves."

**Action**:
"I audited the data pipeline and discovered two root causes:
1. Historical sales that occurred *before* the new digital intake ledger was launched were being subtracted from inventory balances that were already net of those sales (double deduction).
2. Product IDs and names had minor whitespace and casing inconsistencies (e.g. `'PL-07'` vs `'pl-07 '`), causing sale line items to miss matching inventory items.

I resolved this by:
1. Implementing a cutover timestamp setting in the database (`sales_stock_tracking_started_at`) so only sales occurring post-cutover are deducted from active intakes.
2. Building a SKU normalization engine (`getInventoryProductKey`) that lowercases and trims identifiers across sales and inventory.
3. Adding PostgreSQL unique normalized indexes on `lower(trim(product_id))` to permanently prevent duplicate variations at the database level."

**Result**:
"Stock calculations became 100% accurate, discrepancies dropped to zero, and the business could trust their live stock-on-hand balances completely."

---

## 6. Resume & Portfolio Bullet Points

Copy and customize these high-impact bullet points for your resume or LinkedIn profile:

- **Engineered full-stack industrial ERP platform** using React 19, TypeScript, TailwindCSS v4, and Supabase PostgreSQL for automated factory inventory and sales management.
- **Architected append-only inventory ledger** with PL/pgSQL database triggers, preventing unauthorized record deletions and logging JSONB audit diffs for all quantity adjustments.
- **Designed custom in-memory TTL caching engine** with request deduplication and generation tokens, cutting redundant network fetches by over 70% and providing sub-second page transitions.
- **Implemented real-time financial reporting & P&L engine**, tracking Gross Revenue, Cost of Goods Sold (COGS), and 12 operational factory overhead expense categories.
- **Developed client-side document generation suite** with `jsPDF` and `fflate`, rendering branded A4 sales invoices and multi-sheet Excel workbooks in under 100ms with zero server cost.
- **Standardized data integrity** with normalized PostgreSQL unique indexes, foreign key cascading constraints, and safe migration cutover scripts for legacy data.
