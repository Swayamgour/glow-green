// src/components/Layout/Sidebar.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    UserPlus,
    UsersRound,
    Package,
    FileText,
    FileBarChart,
    Calendar,
    Clock,
    TrendingUp,
    LogOut,
    ChevronRight,
    ChevronDown,
    BookOpen,
    FileSpreadsheet,
    BarChart3,
    Settings,
    LifeBuoy
} from "lucide-react";
import "./MainLayout.css";


const Sidebar = ({ isOpen, mobileOpen, onClose, currentUser, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [leadsMenuOpen, setLeadsMenuOpen] = useState(false);

    const isAdmin = currentUser?.role === 'admin';
    let sidebarVisible = isOpen || mobileOpen;

    const leadSubItems = [
        { id: 'leads', label: 'All Leads', icon: UsersRound, path: '/Lead' },
        { id: 'lead-sources', label: 'Lead Sources', icon: TrendingUp, path: '/LeadSouses' },
        { id: 'lead-pipeline', label: 'Lead Pipeline', icon: FileSpreadsheet, path: '/LeadPipeline' },
        { id: 'follow-up', label: 'Follow Up', icon: Calendar, path: '/FollowUp' },
        { id: 'lead-timeline', label: 'Lead Timeline', icon: Clock, path: '/LeadTimeLine' },
    ];

    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/Dashboard' },
        ...(isAdmin ? [{ id: 'sales-executives', label: 'Sales Executives', icon: UserPlus, path: '/Executives' }] : []),
        { id: 'leads-parent', label: 'Leads', icon: Users, isParent: true },
        { id: 'customers', label: 'Customers', icon: UsersRound, path: '/Customers' },
        { id: 'products', label: 'Products', icon: Package, path: '/Products' },
        { id: 'quotations', label: 'Quotations', icon: FileText, path: '/Quotations' },
        { id: 'tds', label: 'TDS Documents', icon: FileBarChart, path: '/TDS' },
        ...(isAdmin ? [{ id: 'reports', label: 'Reports', icon: BarChart3, path: '/Reports' }] : []),
        // { id: 'mom', label: 'Minutes of Meeting', icon: BookOpen, path: '/dashboard/mom' },
    ];

    const isActivePath = (path) => {
        if (!path) return false;
        return location.pathname === path;
    };

    const isLeadTabActive = () => {
        return leadSubItems.some(item => location.pathname === item.path);
    };

    const handleNavigate = (path) => {
        if (path) {
            navigate(path);
            if (mobileOpen) onClose();
        }
    };

    const handleLeadsToggle = () => {
        setLeadsMenuOpen(!leadsMenuOpen);
    };

    // if (!sidebarVisible) return null;
    sidebarVisible = isOpen || mobileOpen;

    return (
        //   return (
        <aside className={`sidebar ${!isOpen ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
            
            {/* Logo Section */}
            <div className="sidebar-logo">
                <div className="logo-icon">🌿</div>
                {isOpen && <span className="logo-text">Glow Green</span>}
            </div>

            {/* User Profile Section */}
            {isOpen && (
                <div className="sidebar-user">
                    <div className="user-avatar">
                        {(currentUser?.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{currentUser?.name || 'User'}</span>
                        <span className="user-role">
                            {currentUser?.role === 'admin' ? 'Administrator' : 'Sales Executive'}
                        </span>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = item.isParent
                        ? leadsMenuOpen || isLeadTabActive()
                        : isActivePath(item.path);

                    if (item.isParent) {
                        return (
                            <div key={item.id} className="nav-group">
                                <button
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                    onClick={handleLeadsToggle}
                                >
                                    <Icon size={20} className="nav-icon" />
                                    {isOpen && (
                                        <>
                                            <span className="nav-label">{item.label}</span>
                                            <ChevronDown
                                                size={16}
                                                className={`nav-chevron ${leadsMenuOpen ? 'open' : ''}`}
                                            />
                                        </>
                                    )}
                                </button>

                                {isOpen && leadsMenuOpen && (
                                    <div className="submenu">
                                        {leadSubItems.map(subItem => {
                                            const SubIcon = subItem.icon;
                                            return (
                                                <button
                                                    key={subItem.id}
                                                    className={`submenu-item ${isActivePath(subItem.path) ? 'active' : ''}`}
                                                    onClick={() => handleNavigate(subItem.path)}
                                                >
                                                    <SubIcon size={16} />
                                                    <span>{subItem.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <Icon size={20} className="nav-icon" />
                            {isOpen && <span className="nav-label">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Footer Section */}
            {isOpen && (
                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={onLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;