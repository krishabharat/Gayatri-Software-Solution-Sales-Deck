import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import Topbar from './components/Layout/Topbar'
import BottomNav from './components/Layout/BottomNav'
import Home from './pages/Home'
import Sales from './pages/Sales'
import NewSale from './pages/NewSale'
import Inventory from './pages/Inventory'
import ProductMaster from './pages/ProductMaster'
import AddInventory from './pages/AddInventory'
import Reports from './pages/Reports'

export default function App() {
  return (
    <div
      className="min-h-screen w-full text-slate-800"
      style={{
        background: 'linear-gradient(135deg, #1a1022 0%, #2a1634 18%, #3d2249 38%, #f4f0f7 39%, #f4f0f7 100%)'
      }}
    >
      <div className="mx-auto flex max-w-[1600px] px-2 py-2 sm:px-3 lg:px-4">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col overflow-hidden rounded-[30px] border border-[#eadff2] bg-[#f7f3fa]/95 shadow-[0_25px_70px_rgba(18,7,21,0.18)] backdrop-blur-sm">
          <Topbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/sales/new" element={<NewSale />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/add" element={<AddInventory />} />
              <Route path="/inventory/product-master" element={<ProductMaster />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
