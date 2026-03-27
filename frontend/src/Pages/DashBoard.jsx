
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    CheckCircle,

} from 'lucide-react';
import '../components/Dashboard.css';
import { useGetLeadsQuery, useGetExecutivesQuery } from '../Redux/api';

const Overview = ({ setActiveTab }) => {
    // RTK Query hooks
    const { data: leads = [], isLoading: leadsLoading } = useGetLeadsQuery();
    const { data: executives = [], isLoading: execsLoading } = useGetExecutivesQuery();

    // Calculate stats
    const stats = [
        {
            label: 'Total Leads',
            value: leads.length.toString(),
            trend: 'up',
            icon: LayoutDashboard,
            color: '#6366f1',
            bgColor: '#eef2ff'
        },
        {
            label: 'Active Leads',
            value: leads.filter(l => l.leadStatus === 'in-progress').length.toString(),
            trend: 'up',
            icon: TrendingUp,
            color: '#f59e0b',
            bgColor: '#fffbeb'
        },
        {
            label: 'Executives',
            value: executives.length.toString(),
            trend: 'up',
            icon: Users,
            color: '#10b981',
            bgColor: '#ecfdf5'
        },
        {
            label: 'Closed Won',
            value: leads.filter(l => l.leadStatus === 'won').length.toString(),
            trend: 'up',
            icon: CheckCircle,
            color: '#22c55e',
            bgColor: '#f0fdf4'
        },
    ];

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            open: '#3b82f6',
            'in-progress': '#f59e0b',
            'follow-up': '#8b5cf6',
            won: '#22c55e',
            lost: '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    const getStatusBgColor = (status) => {
        const colors = {
            open: '#dbeafe',
            'in-progress': '#fef3c7',
            'follow-up': '#ede9fe',
            won: '#dcfce7',
            lost: '#fee2e2'
        };
        return colors[status] || '#f3f4f6';
    };

    if (leadsLoading || execsLoading) {
        return (
            <div className="overview-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <>
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">{stat.label}</span>
                            {stat.change && <span className={`stat-change ${stat.trend}`}>{stat.change}</span>}
                        </div>
                        <div className="stat-value">{stat.value}</div>
                    </div>
                ))}
            </div>
            <div className="content-grid">
                <div className="card">
                    <div className="card-header">
                        <h3>Recent Leads</h3>
                        <button className="btn-secondary" onClick={() => setActiveTab('lead-pipeline')}>View All</button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Source</th>
                                    <th>Status</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.slice(0, 5).map(lead => (
                                    <tr key={lead._id}>
                                        <td>{lead.leadName || '—'}</td>
                                        <td>{lead.phone}</td>
                                        <td className="capitalize">{lead.leadSource || '—'}</td>
                                        <td><span className={`status-badge status-${lead.leadStatus}`}>{lead.leadStatus}</span></td>
                                        <td className="value">{lead.expectedValue ? `₹${Number(lead.expectedValue).toLocaleString('en-IN')}` : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {leads.length === 0 && <div className="empty-state">No leads yet.</div>}
                    </div>
                </div>
                <div className="card activity-card">
                    <div className="card-header"><h3>Executives ({executives.length})</h3></div>
                    <div className="activity-list">
                        {executives.slice(0, 5).map((exec, index) => (
                            <div key={index} className="activity-item">
                                <div className="activity-dot" />
                                <div className="activity-content">
                                    <p className="activity-action">{exec.name}</p>
                                    <p className="activity-meta">{exec.phone} • {exec.email}</p>
                                </div>
                            </div>
                        ))}
                        {executives.length === 0 && <div className="empty-state">No executives yet.</div>}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Overview;