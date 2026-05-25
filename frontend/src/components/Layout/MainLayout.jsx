// src/components/Layout/MainLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileDrawer from "../MobileDrawer";
import "./MainLayout.css";
import { useGetMeQuery } from "../../Redux/api";

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: currentUser } = useGetMeQuery();

    console.log('main')


    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
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

    // Close mobile drawer on route change
    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [location]);

    // const handleLogout = () => {
    //     localStorage.removeItem('gg_token');
    //     localStorage.removeItem('gg_user');
    //     navigate('/login');
    // };


    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.setItem("gg_logout_msg", "Logged out successfully");

        window.location.href = "/login"; // safe reset
    };

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setMobileDrawerOpen(!mobileDrawerOpen);
        } else {
            setSidebarOpen(!sidebarOpen);
        }
    };

    return (
        <div className="main-layout">
            {/* Desktop Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                currentUser={currentUser}
                onLogout={handleLogout}
            />

            {/* Mobile Drawer - Using MUI Drawer for phone devices */}
            <MobileDrawer
                open={mobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                currentUser={currentUser}
                onLogout={handleLogout}
            />

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