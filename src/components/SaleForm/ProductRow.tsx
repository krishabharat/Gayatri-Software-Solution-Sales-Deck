type Product = {
  id?: string
  name?: string
  quantity?: number
  selling?: number
}

type InventoryOption = {
  id: string
  name: string
  selling: number
}

type Props = {
  index: number
  product: Product
  inventoryOptions: InventoryOption[]
  onChange: (index: number, changes: Partial<Product>) => void
  onRemove: (index: number) => void
  onSelectInventory: (index: number, option: InventoryOption) => void
}

export default function ProductRow({ index, product, inventoryOptions, onChange, onRemove, onSelectInventory }: Props) {
  const total = (Number(product.quantity) || 0) * (Number(product.selling) || 0)

  return (
    <div className="rounded-2xl border border-[#e3efec] bg-[#f9fffd] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700">Product {index + 1}</div>
        <button type="button" onClick={() => onRemove(index)} className="text-xs font-medium text-red-600 hover:text-red-700">
          Remove
        </button>
      </div>

      {inventoryOptions.length > 0 && (
        <div className="mb-3">
          <label className="form-label">Select inventory item</label>
          <select
            value={product.id || ''}
            onChange={(e) => {
              const selected = inventoryOptions.find((option) => option.id === e.target.value)
              if (selected) {
                onSelectInventory(index, selected)
              }
            }}
            className="form-input"
          >
            <option value="">Choose product from inventory</option>
            {inventoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} ({option.id})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label className="form-label">Product ID</label>
          <input value={product.id || ''} onChange={(e) => onChange(index, { id: e.target.value })} className="form-input" placeholder="Product ID" />
        </div>

        <div className="xl:col-span-2">
          <label className="form-label">Product Name</label>
          <input value={product.name || ''} onChange={(e) => onChange(index, { name: e.target.value })} className="form-input" placeholder="Product name" />
        </div>

        <div>
          <label className="form-label">Quantity / Total Plates</label>
          <input type="number" min={0} value={product.quantity ?? ''} onChange={(e) => onChange(index, { quantity: Number(e.target.value) })} className="form-input" placeholder="0" />
        </div>

        <div>
          <label className="form-label">Selling Cost</label>
          <input type="number" min={0} step="0.01" value={product.selling ?? ''} onChange={(e) => onChange(index, { selling: Number(e.target.value) })} className="form-input" placeholder="₹0" />
        </div>

        <div className="md:col-span-2 xl:col-span-1">
          <label className="form-label">Total</label>
          <div className="flex h-[46px] items-center justify-center rounded-xl border border-[#dfeae7] bg-white px-3 text-sm font-semibold text-slate-700">
            ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  )
}
