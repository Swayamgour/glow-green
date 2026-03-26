import React, { useState } from 'react';
// import '../components/Dashboard.css';
import '../Dashboard.css';
import { useGetLeadsQuery } from '../../Redux/api';

function LeadTimeLine() {
    const [viewTimelineLead, setViewTimelineLead] = useState(null);

    // Use RTK Query hook to fetch leads
    const { data: leads = [], isLoading, error } = useGetLeadsQuery({});

    // Status colors and backgrounds
    const statusColors = {
        open: '#3b82f6',
        'in-progress': '#f59e0b',
        'follow-up': '#8b5cf6',
        won: '#22c55e',
        lost: '#ef4444'
    };

    const statusBg = {
        open: '#dbeafe',
        'in-progress': '#fef3c7',
        'follow-up': '#ede9fe',
        won: '#dcfce7',
        lost: '#fee2e2'
    };

    // Helper function to format date
    const formatDateTime = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper function to get all events for a lead
    const getAllEvents = (lead) => {
        return [
            {
                timestamp: lead.createdAt,
                action: 'Lead Created',
                details: `Lead "${lead.leadName}" was created`,
                isCreation: true
            },
            ...(lead.activityLog || []).map(a => ({ ...a, isCreation: false })),
            ...(lead.notes || []).map(n => ({
                action: 'Note Added',
                details: n.text,
                changedBy: n.addedBy || '',
                timestamp: n.createdAt,
                isCreation: false,
                isNote: true
            })),
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    // Sort leads by createdAt (newest first)
    const sortedLeads = [...leads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Loading state
    if (isLoading) {
        return (
            <div className="crm-page">
                <div className="crm-page-header"><h2>Lead Timeline</h2></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div
                            key={i}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid #e5e7eb',
                                borderRadius: 12,
                                padding: 16,
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e5e7eb' }} />
                                <div>
                                    <div style={{ width: 120, height: 16, background: '#e5e7eb', borderRadius: 4, marginBottom: 4 }} />
                                    <div style={{ width: 80, height: 12, background: '#e5e7eb', borderRadius: 4 }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ width: 60, height: 12, background: '#e5e7eb', borderRadius: 4 }} />
                                <div style={{ width: 80, height: 12, background: '#e5e7eb', borderRadius: 4 }} />
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
                <div className="crm-page-header"><h2>Lead Timeline</h2></div>
                <div className="card">
                    <div className="error-state" style={{ padding: '24px', textAlign: 'center' }}>
                        Error loading timeline: {error.data?.message || error.message || 'Please try again later'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="crm-page">
            <div className="crm-page-header"><h2>Lead Timeline</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {leads.length === 0 && (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                        No leads yet. Add your first lead to see timeline.
                    </div>
                )}
                {sortedLeads.map((lead) => {
                    const allEvents = getAllEvents(lead);

                    return (
                        <div
                            key={lead._id}
                            onClick={() => setViewTimelineLead(lead)}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid #e5e7eb',
                                borderRadius: 12,
                                padding: 16,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                borderLeft: `4px solid ${statusColors[lead.leadStatus] || '#9ca3af'}`,
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: `linear-gradient(135deg, ${statusColors[lead.leadStatus] || '#9ca3af'}33, ${statusColors[lead.leadStatus] || '#9ca3af'}66)`,
                                        color: statusColors[lead.leadStatus] || '#9ca3af',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: 15,
                                    }}>
                                        {(lead.leadName || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                                            {lead.leadName}
                                        </div>
                                        {lead.company && (
                                            <div style={{ fontSize: 12, color: '#9ca3af' }}>
                                                {lead.company}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                                    background: statusBg[lead.leadStatus] || '#f3f4f6',
                                    color: statusColors[lead.leadStatus] || '#6b7280',
                                }}>
                                    {lead.leadStatus}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
                                <span>{allEvents.length} event{allEvents.length !== 1 ? 's' : ''}</span>
                                <span style={{ color: '#6366f1', fontWeight: 600 }}>View Timeline →</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Timeline Detail Modal */}
            {viewTimelineLead && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15,15,30,0.5)',
                        backdropFilter: 'blur(3px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20
                    }}
                    onClick={() => setViewTimelineLead(null)}
                >
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: 18,
                            width: '100%',
                            maxWidth: 560,
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.18)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{
                            padding: '20px 24px 16px',
                            borderBottom: '1px solid #f0f2f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    color: '#fff', fontWeight: 700, fontSize: 17,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {(viewTimelineLead.leadName || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                                        {viewTimelineLead.leadName}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                                        {viewTimelineLead.company || viewTimelineLead.phone}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewTimelineLead(null)}
                                style={{
                                    width: 32, height: 32, border: 'none',
                                    background: '#f3f4f6', borderRadius: 8,
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, color: '#6b7280'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
                            {(() => {
                                const allEvents = getAllEvents(viewTimelineLead);

                                if (allEvents.length === 0) {
                                    return <div className="empty-state">No activity recorded yet.</div>;
                                }

                                return allEvents.map((event, ei) => (
                                    <div key={ei} style={{ display: 'flex', gap: 14, paddingBottom: 16, position: 'relative' }}>
                                        {ei < allEvents.length - 1 && (
                                            <div style={{
                                                position: 'absolute',
                                                left: 11, top: 24, bottom: 0,
                                                width: 2, background: '#f0f2f5'
                                            }} />
                                        )}
                                        <div style={{
                                            width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: event.isCreation ? '#ede9fe' : event.isNote ? '#fef3c7' : '#f3f4f6',
                                            border: `2px solid ${event.isCreation ? '#6366f1' : event.isNote ? '#f59e0b' : '#d1d5db'}`,
                                            zIndex: 1,
                                        }}>
                                            <div style={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: event.isCreation ? '#6366f1' : event.isNote ? '#f59e0b' : '#9ca3af',
                                            }} />
                                        </div>
                                        <div style={{ flex: 1, paddingTop: 2 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                flexWrap: 'wrap',
                                                gap: 4,
                                                marginBottom: 4
                                            }}>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                                                    background: event.isCreation ? '#ede9fe' : event.isNote ? '#fef9c3' : '#f3f4f6',
                                                    color: event.isCreation ? '#6366f1' : event.isNote ? '#d97706' : '#374151',
                                                }}>
                                                    {event.action}
                                                </span>
                                                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                                                    {formatDateTime(event.timestamp)}
                                                </span>
                                            </div>
                                            {event.details && (
                                                <div style={{
                                                    fontSize: 13,
                                                    color: event.isNote ? 'var(--text-primary)' : 'var(--text-secondary, #6b7280)',
                                                    background: event.isNote ? '#fffbeb' : 'transparent',
                                                    padding: event.isNote ? '8px 12px' : '0',
                                                    borderRadius: event.isNote ? 8 : 0,
                                                    borderLeft: event.isNote ? '3px solid #f59e0b' : 'none',
                                                    lineHeight: 1.5,
                                                }}>
                                                    {event.details}
                                                </div>
                                            )}
                                            {event.changedBy && !event.isCreation && (
                                                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                                                    by {event.changedBy}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        <div style={{
                            padding: '14px 24px',
                            borderTop: '1px solid #f0f2f5',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            flexShrink: 0
                        }}>
                            <button
                                className="btn-reset"
                                onClick={() => setViewTimelineLead(null)}
                                style={{
                                    padding: '8px 20px',
                                    background: '#f3f4f6',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: '#374151'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LeadTimeLine;