import React from 'react';
import '../Dashboard.css';
import { useGetLeadsQuery } from '../../Redux/api';

function LeadPipeline() {
    // Use RTK Query hook to fetch leads
    const { data: leads = [], isLoading, error } = useGetLeadsQuery({});

    // Define status configurations
    const statuses = ['open', 'in-progress', 'follow-up', 'won', 'lost'];
    const colors = {
        open: '#dbeafe',
        'in-progress': '#fef3c7',
        'follow-up': '#ede9fe',
        won: '#dcfce7',
        lost: '#fee2e2'
    };
    const textColors = {
        open: '#1d4ed8',
        'in-progress': '#92400e',
        'follow-up': '#6d28d9',
        won: '#166534',
        lost: '#991b1b'
    };

    // Group leads by status
    const groupedLeads = statuses.reduce((acc, status) => {
        acc[status] = leads.filter(lead => lead.leadStatus === status);
        return acc;
    }, {});

    // Loading state
    if (isLoading) {
        return (
            <div className="crm-page">
                <div className="crm-page-header"><h2>Lead Pipeline</h2></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16 }}>
                    {statuses.map(status => (
                        <div key={status} style={{ background: 'var(--bg-card)', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ background: colors[status], padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                <span style={{ fontWeight: 700, fontSize: 13, color: textColors[status], textTransform: 'capitalize' }}>
                                    {status.replace('-', ' ')}
                                </span>
                                <span style={{ float: 'right', fontWeight: 700, fontSize: 18, color: textColors[status] }}>
                                    <span className="loading-pulse">...</span>
                                </span>
                            </div>
                            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                                <div className="loading-state">Loading...</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="crm-page">
                <div className="crm-page-header"><h2>Lead Pipeline</h2></div>
                <div className="card">
                    <div className="error-state" style={{ padding: '24px', textAlign: 'center' }}>
                        Error loading pipeline: {error.data?.message || error.message || 'Please try again later'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="crm-page">
            <div className="crm-page-header"><h2>Lead Pipeline</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16 }}>
                {statuses.map(status => {
                    const group = groupedLeads[status];
                    return (
                        <div key={status} style={{ background: 'var(--bg-card)', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ background: colors[status], padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                <span style={{ fontWeight: 700, fontSize: 13, color: textColors[status], textTransform: 'capitalize' }}>
                                    {status.replace('-', ' ')}
                                </span>
                                <span style={{ float: 'right', fontWeight: 700, fontSize: 18, color: textColors[status] }}>
                                    {group.length}
                                </span>
                            </div>
                            <div style={{ padding: '8px 0', maxHeight: 400, overflowY: 'auto' }}>
                                {group.length === 0 && (
                                    <div className="empty-state" style={{ padding: '20px 16px', textAlign: 'center', color: '#9ca3af' }}>
                                        No leads
                                    </div>
                                )}
                                {group.map(lead => (
                                    <div key={lead._id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--bg-secondary)' }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                                            {lead.leadName || lead.name}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                                            {lead.company || lead.leadSource || ''}
                                        </div>
                                        {lead.expectedValue > 0 && (
                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#059669', marginTop: 3 }}>
                                                ₹{Number(lead.expectedValue).toLocaleString('en-IN')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default LeadPipeline;