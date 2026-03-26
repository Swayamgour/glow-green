// src/components/Layout/Header.jsx
import React from "react";
import { Menu, ChevronDown, LogOut, User, Settings } from "lucide-react";
import "./MainLayout.css";


const Header = ({ onMenuClick, currentUser, showUserMenu, setShowUserMenu, onLogout }) => {
    const toggleUserMenu = () => {
        setShowUserMenu(!showUserMenu);
    };

    return (
        <header className="dashboard-header">
            <div className="header-left">
                <button className="menu-btn" onClick={onMenuClick}>
                    <Menu size={22} />
                </button>
                <h1 className="page-title">
                    {getPageTitle(window.location.pathname)}
                </h1>
            </div>

            <div className="header-right">
                <div className="user-menu-container">
                    <button className="user-menu-btn" onClick={toggleUserMenu}>
                        <div className="user-avatar">
                            {(currentUser?.name?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{currentUser?.name || 'User'}</span>
                            <span className="user-role">
                                {currentUser?.role === 'admin' ? 'Admin' : 'Executive'}
                            </span>
                        </div>
                        <ChevronDown size={16} className="chevron-icon" />
                    </button>

                    {showUserMenu && (
                        <div className="user-dropdown">
                            <div className="dropdown-header">
                                <div className="dropdown-avatar">
                                    {(currentUser?.name?.[0] || 'U').toUpperCase()}
                                </div>
                                <div className="dropdown-info">
                                    <div className="dropdown-name">{currentUser?.name || 'User'}</div>
                                    <div className="dropdown-email">{currentUser?.email || ''}</div>
                                    <div className="dropdown-role">
                                        {currentUser?.role === 'admin' ? 'Administrator' : 'Sales Executive'}
                                    </div>
                                </div>
                            </div>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item" onClick={onLogout}>
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

const getPageTitle = (path) => {
    const titles = {
        '/dashboard/overview': 'Dashboard',
        '/dashboard/sales-executives': 'Sales Executives',
        '/dashboard/leads': 'All Leads',
        '/dashboard/lead-sources': 'Lead Sources',
        '/dashboard/lead-pipeline': 'Lead Pipeline',
        '/dashboard/follow-up': 'Follow Up',
        '/dashboard/lead-timeline': 'Lead Timeline',
        '/dashboard/customers': 'Customers',
        '/dashboard/products': 'Products',
        '/dashboard/quotations': 'Quotations',
        '/dashboard/tds': 'TDS Documents',
        '/dashboard/reports': 'Reports',
        '/dashboard/mom': 'Minutes of Meeting'
    };
    return titles[path] || 'Dashboard';
};

export default Header;