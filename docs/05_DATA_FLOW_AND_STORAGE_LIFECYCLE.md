# 📓 Chapter 05: Data Flow & Storage Lifecycle

## 1. End-to-End Data Flow Overview

Every transaction in the Sai Gayatri Industries system follows a disciplined, predictable lifecycle from the user's keystroke down to the PostgreSQL disk blocks and back to the UI.

```mermaid
flowchart TD
    User([User Action / Input]) --> ReactHook[React Component State / Form]
    ReactHook --> Validation[Client Validation & Sanitization]
    Validation --> Service[cloudStorage.ts Service Layer]
    Service --> CacheCheck{Cache Invalidation}
    CacheCheck --> SupabaseSDK[Supabase JS Client / PostgREST]
    SupabaseSDK --> RLS[PostgreSQL RLS Security Check]
    RLS --> Triggers[PL/pgSQL Triggers & Audit Engine]
    Triggers --> TableStore[(PostgreSQL Tables)]
    TableStore --> PGResponse[PostgreSQL Success Response]
    PGResponse --> CacheEvict[Invalidate Specific Memory Cache]
    CacheEvict --> StateUpdate[React Re-render / UI Refresh]
```

---

## 2. Deep Dive: Creating a Sale Order

When a user records a customer purchase on `/sales/new`, here is the exact chronological sequence:

```mermaid
sequenceDiagram
    autonumber
    actor Cashier
    participant UI as SaleForm.tsx
    participant Service as cloudStorage.ts
    participant Supabase as PostgREST API
    participant PG as PostgreSQL Database

    Cashier->>UI: Selects Customer, selects Products, enters Quantity & Discount
    UI->>UI: useMemo computes Total Plates, Subtotal, Grand Total & Balance
    Cashier->>UI: Clicks "Save Sale"
    UI->>Service: getNextInvoiceId(saleDate)
    Service->>Supabase: SELECT id FROM sales WHERE id LIKE 'SG20261123%' ORDER BY id DESC LIMIT 1
    Supabase-->>Service: Latest ID (e.g. "SG2026112300004")
    Service-->>UI: Next ID = "SG2026112300005"
    UI->>Service: saveCloudSale(salePayload)
    Service->>Supabase: UPSERT INTO sales VALUES (...)
    Supabase->>PG: Insert sales record
    Service->>Supabase: DELETE FROM sale_products WHERE sale_id = 'SG2026112300005'
    Service->>Supabase: INSERT INTO sale_products VALUES (...) [Line items with purchase_cost]
    Supabase->>PG: Insert line items
    Service->>Service: salesCache.invalidate()
    Service->>Service: stockSalesCache.invalidate()
    Service-->>UI: Success confirmation
    UI->>Cashier: Redirects to /sales with notification
```

---

## 3. Deep Dive: Receiving Stock & Auditing Corrections

Stock receipts are mission-critical because they establish raw inventory balances and procurement valuation.

### A. New Stock Intake Flow
1. Cashier opens the "Add Stock" modal in `ProductMaster.tsx`.
2. Enters batch date, supplier name, quantity, purchase cost per unit, and transport charges.
3. `saveCloudStockIntakes()` verifies all batch rows share one supplier and receipt date.
4. Generates an `intake_batch_id` UUID grouping the delivery.
5. Performs a batch insert into `public.stock_intakes`.
6. Calls `inventoryCache.invalidate()`.
7. `getInventoryProducts()` recalculates live Stock-on-Hand and weighted average costs across all products.

### B. Audited Correction Flow
If a cashier realizes they entered an incorrect quantity or price:

```mermaid
sequenceDiagram
    autonumber
    actor Manager
    participant UI as ProductMaster.tsx
    participant Service as updateCloudStockIntake()
    participant Trigger as audit_stock_intake_update()
    participant AuditTable as stock_intake_audit
    participant IntakeTable as stock_intakes

    Manager->>UI: Modifies receipt quantity from 5,000 to 4,800
    Manager->>UI: Clicks "Save Receipt Changes"
    UI->>Service: updateCloudStockIntake(updatedItem)
    Service->>IntakeTable: UPDATE stock_intakes SET quantity = 4800 WHERE id = ...
    IntakeTable->>Trigger: Fires BEFORE UPDATE FOR EACH ROW
    Trigger->>AuditTable: INSERT INTO stock_intake_audit (stock_intake_id, changed_by, old_values, new_values)
    Note over AuditTable: Complete JSONB diff snapshot saved
    Trigger-->>IntakeTable: Return NEW
    IntakeTable-->>Service: Success
    Service->>Service: inventoryCache.invalidate()
    Service-->>UI: Update complete
    UI->>Manager: Displays corrected balance with audit trail
```

---

## 4. Intelligent Error Translation (`describeCloudError`)

Raw database errors from PostgreSQL or PostgREST are cryptic to end users (e.g., `42P01` or `23505`).

In `src/utils/cloudStorage.ts`, the `describeCloudError()` utility intercepts and translates these codes into actionable, plain-English instructions:

```typescript
export function describeCloudError(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const details = error as { message?: string; details?: string; hint?: string; code?: string }
    
    // Missing table error
    if (details.code === '42P01' || details.message?.toLowerCase().includes('does not exist')) {
      return `${fallback} The new tool tables are not installed in Supabase yet. Run the latest SQL from supabase/schema.sql, then refresh.`
    }
    // RLS permission denial
    if (details.code === '42501' || details.message?.toLowerCase().includes('row-level security')) {
      return `${fallback} Supabase permissions are blocking this action. Run the latest RLS policy SQL from supabase/schema.sql.`
    }
    // Foreign key violation
    if (details.code === '23503') {
      return `${fallback} A linked database record is missing. Check that the sales and sale_products tables were created from the latest schema.`
    }
    // Unique constraint violation (duplicate key)
    if (details.code === '23505') {
      return `${fallback} A product ID/name or intake record already exists. Check for a duplicate and try again.`
    }
    // PostgREST schema cache out of sync
    if (details.code === 'PGRST204' || details.message?.toLowerCase().includes('schema cache')) {
      return `${fallback} Supabase is missing a required column. Run the latest migration SQL in supabase/schema.sql, then run notify pgrst, 'reload schema'; and wait 30 seconds before retrying.`
    }
  }
  if (error instanceof Error) return error.message
  return fallback
}
```

---

## 5. Offline Resiliency & Fallback Local Storage

In `src/utils/storage.ts`, fallback helper functions are maintained (`readStorage`, `writeStorage`, `getInventoryItems`, `saveInventoryItems`).

When running in offline demonstration environments without internet access or during local mock testing:
- Components can fall back to browser `localStorage`.
- Data is serialized as JSON strings with defensive error boundaries (`try...catch`).
- Ensures zero UI crashes if third-party network gateways are unreachable.
