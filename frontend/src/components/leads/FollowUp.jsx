import React from 'react';
import '../Dashboard.css';
import { useGetLeadsQuery } from '../../Redux/api';

function FollowUp() {
    // Use RTK Query hook to fetch leads
    const { data: leads = [], isLoading, error } = useGetLeadsQuery({});

    // Helper function to format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter leads with follow-up dates
    const leadsWithFollowUp = leads
        .filter(l => l.followUpDate)
        .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

    // Get all activity logs from all leads
    const allActivities = leads
        .flatMap(l =>
            (l.activityLog || []).map(a => ({
                ...a,
                leadName: l.leadName || l.name,
                leadId: l._id
            }))
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50);

    // Loading state
    if (isLoading) {
        return (
            <div className="crm-page">
                <div className="crm-page-header"><h2>Follow Up</h2></div>
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3>Leads with Follow-Up Scheduled</h3></div>
                    <div className="table-container">
                        <div className="loading-state">Loading follow-ups...</div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Recent Activity Log</h3></div>
                    <div className="loading-state" style={{ padding: '24px', textAlign: 'center' }}>
                        Loading activities...
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="crm-page">
                <div className="crm-page-header"><h2>Follow Up</h2></div>
                <div className="card">
                    <div className="error-state" style={{ padding: '24px', textAlign: 'center' }}>
                        Error loading data: {error.data?.message || error.message || 'Please try again later'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="crm-page">
            <div className="crm-page-header"><h2>Follow Up</h2></div>

            {/* Follow-ups Table */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <h3>Leads with Follow-Up Scheduled</h3>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                        Total: {leadsWithFollowUp.length}
                    </span>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Lead Name</th>
                                <th>Company</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Follow-Up Date</th>
                                <th>Days Left</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leadsWithFollowUp.map((lead, i) => {
                                const days = Math.ceil(
                                    (new Date(lead.followUpDate) - new Date()) / (1000 * 60 * 60 * 24)
                                );
                                const isOverdue = days < 0;
                                const isToday = days === 0;

                                return (
                                    <tr key={lead._id}>
                                        <td className="row-num">{i + 1}</td>
                                        <td className="lead-name-cell">{lead.leadName || lead.name}</td>
                                        <td>{lead.company || '—'}</td>
                                        <td>{lead.phone}</td>
                                        <td>
                                            <span className={`status-badge status-${lead.leadStatus}`}>
                                                {lead.leadStatus}
                                            </span>
                                        </td>
                                        <td>{formatDate(lead.followUpDate)}</td>
                                        <td>
                                            <span style={{
                                                fontWeight: 600,
                                                fontSize: 12,
                                                padding: '2px 10px',
                                                borderRadius: 20,
                                                background: isOverdue ? '#fee2e2' : isToday ? '#fef3c7' : '#dcfce7',
                                                color: isOverdue ? '#dc2626' : isToday ? '#92400e' : '#166534'
                                            }}>
                                                {isOverdue
                                                    ? `${Math.abs(days)}d overdue`
                                                    : isToday
                                                        ? 'Today'
                                                        : `${days}d left`}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {leadsWithFollowUp.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">No follow-ups scheduled.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Activity Log */}
            <div className="card">
                <div className="card-header">
                    <h3>Recent Activity Log</h3>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                        Last 50 activities
                    </span>
                </div>
                <div style={{ padding: '8px 0', maxHeight: 500, overflowY: 'auto' }}>
                    {allActivities.map((event, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                gap: 12,
                                padding: '10px 20px',
                                borderBottom: '1px solid var(--bg-secondary)',
                                alignItems: 'flex-start',
                                transition: 'background 0.2s',
                                hover: { background: 'var(--bg-secondary)' }
                            }}
                        >
                            <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#6366f1',
                                marginTop: 5,
                                flexShrink: 0
                            }} />
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 4
                                }}>
                                    <span style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>
                                        {event.leadName}
                                    </span>
                                    <span style={{
                                        fontSize: 11,
                                        color: '#9ca3af'
                                    }}>
                                        {formatDateTime(event.timestamp)}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    color: '#6366f1',
                                    fontWeight: 500,
                                    marginTop: 2
                                }}>
                                    {event.action}
                                </div>
                                {event.details && (
                                    <div style={{
                                        fontSize: 12,
                                        color: 'var(--text-secondary)',
                                        marginTop: 1
                                    }}>
                                        {event.details}
                                    </div>
                                )}
                                {event.changedBy && (
                                    <div style={{
                                        fontSize: 11,
                                        color: '#9ca3af',
                                        marginTop: 1
                                    }}>
                                        by {event.changedBy}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {allActivities.length === 0 && (
                        <div className="empty-state">No activity yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FollowUp;