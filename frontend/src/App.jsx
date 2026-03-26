import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import Login from "./components/Login";
import Dashboard from "./Pages/DashBoard";
import Executives from "./Pages/sales/Executives";
// import Leads from "./components/Leads";
import toast, { Toaster } from 'react-hot-toast';
// import LeadSourses from "./Pages/LeadSourses";
// import LeadPipeline from "./components/LeadPipeline";
// import FollowUp from "./components/FollowUp";
// import LeadTimeLine from "./components/LeadTimeLine";
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

function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter> {/* ✅ MUST */}

        <Routes>


          {/* 🔓 Public */}
          <Route path="/login" element={<Login />} />

          {/* 🔒 Protected */}
          <Route element={<MainLayout />}>

            {/* ✅ Default */}
            <Route path="/" element={<Navigate to="/Dashboard" />} />

            {/* Dashboard */}
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/Executives" element={<Executives />} />
            <Route path="/Lead" element={<Leads />} />
            <Route path="/LeadSouses" element={<LeadSourses />} />
            <Route path="/LeadPipeline" element={<LeadPipeline
             />} />
            <Route path="/FollowUp" element={<FollowUp />} />
            <Route path="/LeadTimeLine" element={<LeadTimeLine />} />
            <Route path="/Customers" element={<Customers />} />
            <Route path="/Products" element={<Products />} />
            <Route path="/Quotations" element={<Quotations />} />
            <Route path="/TDS" element={<TDS />} />
            <Route path="/Reports" element={<Reports />} />

          </Route>

          {/* ❌ 404 */}
          <Route path="*" element={<h2 style={{ textAlign: "center" }}>404 - Page Not Found</h2>} />

        </Routes>

      </BrowserRouter>
    </>
  );
}

export default App;