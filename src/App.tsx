import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import Topbar from './components/Layout/Topbar'
import BottomNav from './components/Layout/BottomNav'
import AIChatWidget from './components/AIChat/AIChatWidget'

const Home = lazy(() => import('./pages/Home'))
const Categories = lazy(() => import('./pages/Categories'))
const Sales = lazy(() => import('./pages/Sales'))
const NewSale = lazy(() => import('./pages/NewSale'))
const ProductMaster = lazy(() => import('./pages/ProductMaster'))
const AddInventory = lazy(() => import('./pages/AddInventory'))
const Reports = lazy(() => import('./pages/Reports'))
const OrderQueries = lazy(() => import('./pages/OrderQueries'))
const BusinessExpenses = lazy(() => import('./pages/BusinessExpenses'))
const MasterData = lazy(() => import('./pages/MasterData'))
const AIChatPage = lazy(() => import('./pages/AIChatPage'))

export default function App() {
  return (
    <div className="min-h-screen w-full text-[#2B1810] antialiased">
      <div className="mx-auto flex max-w-[1720px] gap-0 md:p-3">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col overflow-hidden bg-[#FFFDF9] md:rounded-[26px] md:border md:border-[#E6D7C3] md:shadow-[0_18px_50px_-15px_rgba(59,35,20,0.12)]">
          <Topbar />
          <main className="flex-1 bg-[#FAF5EE]/65 px-4 py-5 pb-28 sm:px-6 lg:px-8 md:pb-8">
            <Suspense
              fallback={
                <div className="empty-panel" role="status" aria-live="polite">
                  <div className="mb-3 h-8 w-8 animate-spin rounded-full border-3 border-[#E6D7C3] border-t-[#8C4A1F]" />
                  <div className="text-sm font-semibold text-[#5C3317]">Loading page...</div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/ai-chat" element={<AIChatPage />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/sales/new" element={<NewSale />} />
                <Route path="/inventory" element={<ProductMaster />} />
                <Route path="/inventory/add" element={<AddInventory />} />
                <Route path="/inventory/product-master" element={<ProductMaster />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/orders" element={<OrderQueries />} />
                <Route path="/expenses" element={<BusinessExpenses />} />
                <Route path="/customers" element={<MasterData mode="customers" />} />
                <Route path="/suppliers" element={<MasterData mode="suppliers" />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
      {/* Floating AI launcher available anywhere */}
      <AIChatWidget inline={false} />
      <BottomNav />
    </div>
  )
}
