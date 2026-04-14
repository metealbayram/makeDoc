import type { ReactNode } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LandingPage from "./components/LandingPage"
import LoginPage from "./components/LoginPage"
import SignUpPage from "./components/SignUpPage"
import DashboardPage from "./components/DashboardPage"
import CreateDocumentPage from "./components/CreateDocumentPage"
import VerifyDocumentPage from "./components/VerifyDocumentPage"

import DocumentsPage from "./components/DocumentsPage"
import CalendarPage from "./components/CalendarPage"
import FriendsPage from "./components/FriendsPage"
import GroupsPage from "./components/GroupsPage"
import MessagesPage from "./components/MessagesPage"
import ClientsPage from "./components/ClientsPage"
import ToolsPage from "./components/ToolsPage"
import GlobalNotification from "./components/GlobalNotification"

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("token")
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return (
    <>
      {children}
      <GlobalNotification />
    </>
  )
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
            path="/edit-document/:id"
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
          path="/verify-document"
          element={
            <ProtectedRoute>
              <VerifyDocumentPage />
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
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <FriendsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <ClientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <ToolsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}
