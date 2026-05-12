import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { router } from './router'
import { FilterDefs } from './components/ui/AbilityPrims'
import { ScrollProgressBar } from './components/ui/ScrollProgressBar'
import { CursorTrail } from './components/ui/CursorTrail'
import { ScanlineOverlay } from './components/ui/ScanlineOverlay'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <FilterDefs />
      <ScanlineOverlay />
      <ScrollProgressBar />
      <CursorTrail />
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
)
