import type { ReactNode } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LandingPage from "./components/LandingPage"
import LoginPage from "./components/LoginPage"
import SignUpPage from "./components/SignUpPage"
import DashboardPage from "./components/DashboardPage"
import CreateDocumentPage from "./components/CreateDocumentPage"

import DocumentsPage from "./components/DocumentsPage"
import CalendarPage from "./components/CalendarPage"

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("token")
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route
            path="/create-document"
            element={
                <ProtectedRoute>
                    <CreateDocumentPage />
                </ProtectedRoute>
            }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}
