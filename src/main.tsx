import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import App from './App'
import './index.css'

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </Router>
  </React.StrictMode>
)
