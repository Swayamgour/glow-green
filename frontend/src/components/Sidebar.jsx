// src/components/Dashboard/Sidebar.jsx
import { useState } from 'react';
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
    Settings,
    BookOpen,
    FileSpreadsheet
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, currentUser, activeTab, onNavigate, onClose, onLogout }) => {
    const [leadsMenuOpen, setLeadsMenuOpen] = useState(false);
    const isAdmin = currentUser?.role === 'admin';

    const leadSubItems = [
        { id: 'leads', label: 'All Leads', icon: UsersRound },
        { id: 'lead-sources', label: 'Lead Sources', icon: TrendingUp },
        { id: 'lead-pipeline', label: 'Lead Pipeline', icon: FileSpreadsheet },
        { id: 'follow-up', label: 'Follow Up', icon: Calendar },
        { id: 'lead-timeline', label: 'Lead Timeline', icon: Clock },
    ];

    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        ...(isAdmin ? [{ id: 'sales-executives', label: 'Sales Executives', icon: UserPlus }] : []),
        { id: 'leads-parent', label: 'Leads', icon: Users, isParent: true },
        { id: 'customers', label: 'Customers', icon: UsersRound },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'quotations', label: 'Quotations', icon: FileText },
        { id: 'tds', label: 'TDS Documents', icon: FileBarChart },
        ...(isAdmin ? [{ id: 'reports', label: 'Reports', icon: FileSpreadsheet }] : []),
        { id: 'mom', label: 'Minutes of Meeting', icon: BookOpen },
    ];

    const isLeadTab = (tab) => {
        return ['leads', 'lead-sources', 'lead-pipeline', 'follow-up', 'lead-timeline'].includes(tab);
    };

    const handleNavigate = (id) => {
        onNavigate(id);
        onClose();
        if (window.innerWidth <= 768) {
            onClose();
        }
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
                <span className="logo-text">Glow Green</span>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar-sidebar">
                    {(currentUser?.name || 'U')[0].toUpperCase()}
                </div>
                <div className="user-info">
                    <span className="user-name">{currentUser?.name || 'User'}</span>
                    <span className="user-role">
                        {currentUser?.role === 'admin' ? 'Administrator' : 'Sales Executive'}
                    </span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = item.isParent
                        ? leadsMenuOpen || isLeadTab(activeTab)
                        : activeTab === item.id;

                    return (
                        <div key={item.id}>
                            <button
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    if (item.isParent) {
                                        setLeadsMenuOpen(!leadsMenuOpen);
                                    } else {
                                        handleNavigate(item.id);
                                    }
                                }}
                            >
                                <Icon size={18} className="nav-icon" />
                                <span className="nav-label">{item.label}</span>
                                {item.isParent && (
                                    <ChevronRight
                                        size={14}
                                        className={`nav-chevron ${leadsMenuOpen ? 'open' : ''}`}
                                    />
                                )}
                            </button>

                            {item.isParent && leadsMenuOpen && (
                                <div className="submenu">
                                    {leadSubItems.map(subItem => {
                                        const SubIcon = subItem.icon;
                                        return (
                                            <button
                                                key={subItem.id}
                                                className={`nav-item submenu-item ${activeTab === subItem.id ? 'active' : ''}`}
                                                onClick={() => handleNavigate(subItem.id)}
                                            >
                                                <SubIcon size={16} className="nav-icon" />
                                                <span className="nav-label">{subItem.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user-compact">
                    <div className="sidebar-user-avatar">
                        {(currentUser?.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{currentUser?.name || 'User'}</span>
                        <span className="sidebar-user-role">
                            {currentUser?.role === 'admin' ? '🔑 Admin' : '👤 Executive'}
                        </span>
                    </div>
                </div>
                <button className="sidebar-logout-btn" onClick={onLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;