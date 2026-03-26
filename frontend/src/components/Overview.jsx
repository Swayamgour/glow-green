// src/components/Dashboard/Overview.jsx
import { useGetLeadsQuery, useGetExecutivesQuery } from '../../services/api';
import { Users, TrendingUp, CheckCircle, Clock, DollarSign } from 'lucide-react';
import './Overview.css';

const Overview = () => {
  const { data: leads = [] } = useGetLeadsQuery();
  const { data: executives = [] } = useGetExecutivesQuery();

  const stats = [
    { 
      label: 'Total Leads', 
      value: leads.length, 
      icon: Users,
      color: '#6366f1',
      bgColor: '#eef2ff'
    },
    { 
      label: 'Active Leads', 
      value: leads.filter(l => l.leadStatus === 'in-progress').length, 
      icon: TrendingUp,
      color: '#f59e0b',
      bgColor: '#fffbeb'
    },
    { 
      label: 'Closed Won', 
      value: leads.filter(l => l.leadStatus === 'won').length, 
      icon: CheckCircle,
      color: '#10b981',
      bgColor: '#ecfdf5'
    },
    { 
      label: 'Executives', 
      value: executives.length, 
      icon: Users,
      color: '#8b5cf6',
      bgColor: '#f5f3ff'
    },
    { 
      label: 'Total Value', 
      value: `₹${leads.reduce((sum, l) => sum + (Number(l.expectedValue) || 0), 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: '#ef4444',
      bgColor: '#fef2f2'
    },
    { 
      label: 'Follow-ups', 
      value: leads.filter(l => l.followUpDate && new Date(l.followUpDate) >= new Date()).length, 
      icon: Clock,
      color: '#14b8a6',
      bgColor: '#f0fdfa'
    },
  ];

  const recentLeads = leads.slice(0, 5);

  return (
    <div className="overview-container">
      <div className="stats-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card">
              <div className="stat-header">
                <div className="stat-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
                  <Icon size={20} />
                </div>
                <span className="stat-label">{stat.label}</span>
              </div>
              <div className="stat-value">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent Leads</h3>
            <span className="card-badge">{leads.length} Total</span>
          </div>
          <div className="table-container">
            {recentLeads.length === 0 ? (
              <div className="empty-state">No leads yet</div>
            ) : (
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
                  {recentLeads.map(lead => (
                    <tr key={lead._id}>
                      <td className="lead-name">{lead.leadName || lead.name}</td>
                      <td>{lead.phone}</td>
                      <td className="capitalize">{lead.leadSource || lead.source || '—'}</td>
                      <td>
                        <span className={`status-badge status-${lead.leadStatus}`}>
                          {lead.leadStatus}
                        </span>
                      </td>
                      <td className="value">
                        {lead.expectedValue ? `₹${Number(lead.expectedValue).toLocaleString('en-IN')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Executives</h3>
            <span className="card-badge">{executives.length} Total</span>
          </div>
          <div className="executives-list">
            {executives.length === 0 ? (
              <div className="empty-state">No executives yet</div>
            ) : (
              executives.slice(0, 5).map(exec => (
                <div key={exec._id} className="executive-item">
                  <div className="executive-avatar">
                    {(exec.name?.[0] || 'E').toUpperCase()}
                  </div>
                  <div className="executive-info">
                    <div className="executive-name">{exec.name}</div>
                    <div className="executive-contact">{exec.phone} • {exec.email}</div>
                  </div>
                  <div className={`executive-status ${exec.status === 'active' ? 'active' : 'inactive'}`}>
                    {exec.status === 'active' ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;