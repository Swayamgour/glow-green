import React from 'react';
import '../Dashboard.css';
import { useGetLeadsQuery } from '../../Redux/api';

function LeadSourses() {
    // Use RTK Query hook to fetch leads
    const { data: leads = [], isLoading, error } = useGetLeadsQuery({});

    // Calculate lead source statistics
    const sourceStats = leads.reduce((acc, l) => {
        const src = l.leadSource || l.source || 'Unknown';
        if (!acc[src]) {
            acc[src] = { total: 0, won: 0, lost: 0, inProgress: 0 };
        }
        acc[src].total++;
        if (l.leadStatus === 'won') {
            acc[src].won++;
        } else if (l.leadStatus === 'lost') {
            acc[src].lost++;
        } else {
            acc[src].inProgress++;
        }
        return acc;
    }, {});

    // Loading state
    if (isLoading) {
        return (
            <div className="crm-page">
                <div className="crm-page-header"><h2>Lead Sources</h2></div>
                <div className="card">
                    <div className="card-header"><h3>Leads by Source</h3></div>
                    <div className="table-container">
                        <div className="loading-state">Loading leads data...</div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="crm-page">
                <div className="crm-page-header"><h2>Lead Sources</h2></div>
                <div className="card">
                    <div className="card-header"><h3>Leads by Source</h3></div>
                    <div className="table-container">
                        <div className="error-state">
                            Error loading leads: {error.data?.message || error.message || 'Please try again later'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="crm-page">
            <div className="crm-page-header"><h2>Lead Sources</h2></div>
            <div className="card">
                <div className="card-header"><h3>Leads by Source</h3></div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Source</th>
                                <th>Total Leads</th>
                                <th>Won</th>
                                <th>Lost</th>
                                <th>In Progress</th>
                                <th>Win Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(sourceStats).map(([src, data]) => (
                                <tr key={src}>
                                    <td style={{ fontWeight: 600 }}>{src}</td>
                                    <td>{data.total}</td>
                                    <td>
                                        <span className="status-badge status-closed-won">{data.won}</span>
                                    </td>
                                    <td>
                                        <span className="status-badge status-closed-lost">{data.lost}</span>
                                    </td>
                                    <td>{data.inProgress}</td>
                                    <td>
                                        {data.total > 0 ? `${Math.round((data.won / data.total) * 100)}%` : '0%'}
                                    </td>
                                </tr>
                            ))}
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="empty-state">No leads yet.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default LeadSourses;