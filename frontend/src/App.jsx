




import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import Login from "./components/Login";
import Dashboard from "./Pages/DashBoard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";


import Executives from "./Pages/sales/Executives";

// import { Toaster } from 'react-hot-toast';

import Customers from "./components/Customers";
import Products from "./components/Products";
import Quotations from "./components/Quotations";
import TDS from "./components/TDS";
import Reports from "./components/Reports";
import Leads from "./components/leads/Leads";
import LeadSourses from "./components/leads/LeadSourses";
import LeadPipeline from "./components/leads/LeadPipeline";
import FollowUp from "./components/leads/FollowUp";
import LeadTimeLine from "./components/leads/LeadTimeLine";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster />

      <BrowserRouter>
        <Routes>

          {/* 🔓 Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* 🔒 Protected */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/Dashboard" replace />} />
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/Executives" element={<Executives />} />
            <Route path="/Lead" element={<Leads />} />
            <Route path="/LeadSouses" element={<LeadSourses />} />
            <Route path="/LeadPipeline" element={<LeadPipeline />} />
            <Route path="/FollowUp" element={<FollowUp />} />
            <Route path="/LeadTimeLine" element={<LeadTimeLine />} />
            <Route path="/Customers" element={<Customers />} />
            <Route path="/Products" element={<Products />} />
            <Route path="/Quotations" element={<Quotations />} />
            <Route path="/TDS" element={<TDS />} />
            <Route path="/Reports" element={<Reports />} />
          </Route>

          {/* ❌ 404 */}
          <Route path="*" element={<h2>404 - Not Found</h2>} />

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;