// src/components/Layout/MobileDrawer.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Avatar,
    Typography,
    IconButton
} from "@mui/material";
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
    BookOpen,
    FileSpreadsheet,
    BarChart3,
    Settings,
    LifeBuoy,
    X,
    ClosedCaptionIcon
} from "lucide-react";
// import CloseIcon from '@mui/icons-material/Close';

const MobileDrawer = ({ open, onClose, currentUser, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [leadsMenuOpen, setLeadsMenuOpen] = useState(false);

    const isAdmin = currentUser?.role === 'admin';

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
            onClose();
        }
    };

    const handleLeadsToggle = () => {
        setLeadsMenuOpen(!leadsMenuOpen);
    };

    const renderIcon = (IconComponent, size = 20) => {
        return <IconComponent size={size} />;
    };

    return (
        <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: 280,
                    backgroundColor: '#1a1a2e',
                    color: '#fff',
                }
            }}
        >
            {/* Drawer Header with Close Button */}
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                        🌿 Glow Green
                    </Typography>
                </Box>
                {/* <IconButton onClick={onClose} sx={{ color: '#fff' }}>
                    <ClosedCaptionIcon
                     />
                </IconButton> */}
            </Box>

            {/* User Profile Section */}
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <Avatar sx={{
                    bgcolor: '#4caf50',
                    width: 48,
                    height: 48,
                    fontSize: '1.2rem'
                }}>
                    {(currentUser?.name || 'U')[0].toUpperCase()}
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 500 }}>
                        {currentUser?.name || 'User'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {currentUser?.role === 'admin' ? 'Administrator' : 'Sales Executive'}
                    </Typography>
                </Box>
            </Box>

            {/* Navigation List */}
            <List sx={{ flex: 1, py: 2 }}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.isParent
                        ? leadsMenuOpen || isLeadTabActive()
                        : isActivePath(item.path);

                    if (item.isParent) {
                        return (
                            <React.Fragment key={item.id}>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={handleLeadsToggle}>
                                        <ListItemIcon sx={{ color: isActive ? '#4caf50' : 'rgba(255,255,255,0.7)' }}>
                                            {renderIcon(Icon)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            sx={{
                                                '& .MuiListItemText-primary': {
                                                    color: isActive ? '#4caf50' : '#fff',
                                                    fontWeight: isActive ? 500 : 400
                                                }
                                            }}
                                        />
                                        <ChevronRight
                                            size={16}
                                            style={{
                                                color: 'rgba(255,255,255,0.5)',
                                                transform: leadsMenuOpen ? 'rotate(90deg)' : 'none',
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                                {leadsMenuOpen && (
                                    <List component="div" disablePadding>
                                        {leadSubItems.map(subItem => {
                                            const SubIcon = subItem.icon;
                                            const isSubActive = isActivePath(subItem.path);
                                            return (
                                                <ListItem key={subItem.id} disablePadding>
                                                    <ListItemButton
                                                        sx={{ pl: 4 }}
                                                        onClick={() => handleNavigate(subItem.path)}
                                                    >
                                                        <ListItemIcon sx={{ color: isSubActive ? '#4caf50' : 'rgba(255,255,255,0.5)' }}>
                                                            {renderIcon(SubIcon, 16)}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={subItem.label}
                                                            sx={{
                                                                '& .MuiListItemText-primary': {
                                                                    color: isSubActive ? '#4caf50' : 'rgba(255,255,255,0.8)',
                                                                    fontSize: '0.9rem'
                                                                }
                                                            }}
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                )}
                            </React.Fragment>
                        );
                    }

                    return (
                        <ListItem key={item.id} disablePadding>
                            <ListItemButton onClick={() => handleNavigate(item.path)}>
                                <ListItemIcon sx={{ color: isActive ? '#4caf50' : 'rgba(255,255,255,0.7)' }}>
                                    {renderIcon(Icon)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    sx={{
                                        '& .MuiListItemText-primary': {
                                            color: isActive ? '#4caf50' : '#fff',
                                            fontWeight: isActive ? 500 : 400
                                        }
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

            {/* Footer Section */}
            <Box sx={{ p: 2 }}>
                <ListItem disablePadding>
                    <ListItemButton onClick={onLogout}>
                        <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            <LogOut size={20} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Logout"
                            sx={{ '& .MuiListItemText-primary': { color: '#fff' } }}
                        />
                    </ListItemButton>
                </ListItem>
            </Box>
        </Drawer>
    );
};

export default MobileDrawer;