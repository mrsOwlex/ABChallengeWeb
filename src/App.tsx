import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './state/authStore'
import LoginPage from './pages/LoginPage'
import TilesPage from './pages/TilesPage'
import TileDetailPage from './pages/TileDetailPage'
import ViewPage from './pages/ViewPage'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen">
      <Routes>
        {/* Public viewer — no auth required */}
        <Route path="/view/:fileId" element={<ViewPage />} />

        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/tiles" replace /> : <LoginPage />}
        />
        <Route
          path="/tiles"
          element={isAuthenticated ? <TilesPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/tiles/:id"
          element={isAuthenticated ? <TileDetailPage /> : <Navigate to="/login" replace />}
        />
        <Route path="/" element={<Navigate to="/tiles" replace />} />
      </Routes>
    </div>
  )
}

export default App
