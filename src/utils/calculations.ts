export function productTotal(quantity: number, selling: number){
  return (Number(quantity) || 0) * (Number(selling) || 0)
}

export function sumTotals(products: Array<{quantity?: number; selling?: number}>) {
  const totalPlates = products.reduce((s,p)=> s + (Number(p.quantity)||0), 0)
  const subtotal = products.reduce((s,p)=> s + ((Number(p.quantity)||0) * (Number(p.selling)||0)), 0)
  return { totalPlates, subtotal }
}
