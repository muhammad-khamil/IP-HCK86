import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SPPDList from "./pages/SPPDList";
import AdminDashboard from "./pages/AdminDashboard";
import EditSPPD from "./pages/EditSPPD";
import CreateSPPD from "./pages/CreateSPPD";
import SPPDDetail from "./pages/SPPDDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sppd" element={<SPPDList />} />
        <Route path="/sppd/create" element={<CreateSPPD />} />
        <Route path="/sppd/:id/edit" element={<EditSPPD />} />
        <Route path="/sppd/:id" element={<SPPDDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App