// src/components/Layout/MainLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
// import { useGetMeQuery } from "../../services/api";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./MainLayout.css";
import { useGetMeQuery } from "../../Redux/api";

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: currentUser } = useGetMeQuery();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Handle responsive sidebar
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('gg_token');
        localStorage.removeItem('gg_user');
        navigate('/login');
    };

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setMobileMenuOpen(!mobileMenuOpen);
        } else {
            setSidebarOpen(!sidebarOpen);
        }
    };

    return (
        <div className="main-layout">
            {/* Sidebar */}
            {/* <Sidebar
                isOpen={sidebarOpen}
                mobileOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                currentUser={currentUser}
                onLogout={handleLogout}
            /> */}

            <Sidebar
                isOpen={sidebarOpen}
                mobileOpen={mobileMenuOpen}  // This is correct
                onClose={() => setMobileMenuOpen(false)}
                currentUser={currentUser}
                onLogout={handleLogout}
            />

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Main Content Area */}
            <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
                <Header
                    onMenuClick={toggleSidebar}
                    currentUser={currentUser}
                    showUserMenu={showUserMenu}
                    setShowUserMenu={setShowUserMenu}
                    onLogout={handleLogout}
                />
                <div className="page-container">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default MainLayout;