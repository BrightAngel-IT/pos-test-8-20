import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Download,
  Calendar,
  Search,
  Filter,
  User as UserIcon,
  Building2
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { authConfig, formatCurrency } from '../../utils';

export function DailyWorksheets({ api, session, onNotice, company }) {
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  
  const [filters, setFilters] = useState({
    date: '',
    cashierId: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  async function fetchUsers() {
    try {
      const res = await api.get('/users', authConfig(session.token));
      setUsers(res.data.filter(u => u.role === 'cashier'));
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      let query = '?';
      if (filters.date) query += `date=${filters.date}&`;
      if (filters.cashierId) query += `cashierId=${filters.cashierId}&`;
      
      const res = await api.get(`/shifts/worksheets${query}`, authConfig(session.token));
      setWorksheets(res.data || []);
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to load worksheets.' });
    } finally {
      setLoading(false);
    }
  }

  function handlePrintWorksheet(sheet) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Worksheet - ${sheet.date}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 20px; color: #000; font-size: 14px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .totals-section { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
          .grand-total { font-size: 16px; font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${company?.name || 'Inventory System'}</div>
          <div>Daily Cashier Worksheet</div>
        </div>
        
        <div class="row">
          <span>Date:</span>
          <span>${sheet.date}</span>
        </div>
        <div class="row">
          <span>Cashier:</span>
          <span>${sheet.cashierName || sheet.cashierUsername}</span>
        </div>
        <div class="row">
          <span>Branch:</span>
          <span>${sheet.branch}</span>
        </div>
        <div class="row">
          <span>Sales Count:</span>
          <span>${sheet.salesCount || 0}</span>
        </div>
        <div class="row">
          <span>Opened:</span>
          <span>${new Date(sheet.startTime).toLocaleTimeString()}</span>
        </div>
        <div class="row">
          <span>Closed:</span>
          <span>${new Date(sheet.endTime).toLocaleTimeString()}</span>
        </div>

        <div class="totals-section">
          <div class="row">
            <span>Cash Collection:</span>
            <span>${formatCurrency(sheet.totals?.cash || 0)}</span>
          </div>
          <div class="row">
            <span>Card Collection:</span>
            <span>${formatCurrency(sheet.totals?.card || 0)}</span>
          </div>
          <div class="row">
            <span>Credit Sales:</span>
            <span>${formatCurrency(sheet.totals?.credit || 0)}</span>
          </div>
          
          <div class="row grand-total">
            <span>Total Sales:</span>
            <span>${formatCurrency(sheet.totals?.total || 0)}</span>
          </div>
        </div>
        
        <div class="footer">
          Signature: ______________________
          <br><br>
          Printed on: ${new Date().toLocaleString()}
        </div>
        <script>
          window.onload = () => { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  // Calculate totals for currently displayed worksheets
  const aggCash = worksheets.reduce((sum, w) => sum + (w.totals?.cash || 0), 0);
  const aggCard = worksheets.reduce((sum, w) => sum + (w.totals?.card || 0), 0);
  const aggCredit = worksheets.reduce((sum, w) => sum + (w.totals?.credit || 0), 0);
  const aggTotal = worksheets.reduce((sum, w) => sum + (w.totals?.total || 0), 0);

  return (
    <div className="stack gap-6 animate-fade">
      <SectionHeading
        title="Daily Worksheets"
        subtitle="View and download daily billing summaries from cashiers."
        icon={Wallet}
      />

      {/* Aggregate Cards */}
      <div className="grid-4 gap-4">
        <div className="panel p-4 glass-panel stack gap-2" style={{ borderRadius: '16px' }}>
          <span className="eyebrow muted">Aggregated Cash</span>
          <span className="h3 font-strong" style={{ color: 'var(--success)' }}>{formatCurrency(aggCash)}</span>
        </div>
        <div className="panel p-4 glass-panel stack gap-2" style={{ borderRadius: '16px' }}>
          <span className="eyebrow muted">Aggregated Card</span>
          <span className="h3 font-strong text-accent">{formatCurrency(aggCard)}</span>
        </div>
        <div className="panel p-4 glass-panel stack gap-2" style={{ borderRadius: '16px' }}>
          <span className="eyebrow muted">Aggregated Credit</span>
          <span className="h3 font-strong text-warning">{formatCurrency(aggCredit)}</span>
        </div>
        <div className="panel-strong p-4 stack gap-2" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))', color: 'white' }}>
          <span className="eyebrow opacity-80">Total Billings</span>
          <span className="h3 font-strong">{formatCurrency(aggTotal)}</span>
        </div>
      </div>

      <section className="panel p-0 glass-panel overflow-hidden stack gap-0" style={{ borderRadius: '20px' }}>
        <div className="p-6 between">
          <div className="cluster gap-4 flex-wrap">
            <div className="input-shell compact" style={{ borderRadius: '10px' }}>
              <Calendar size={14} className="muted" />
              <input 
                type="date"
                className="ghost-input small"
                value={filters.date}
                onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div className="input-shell compact" style={{ borderRadius: '10px' }}>
              <UserIcon size={14} className="muted" />
              <select 
                className="ghost-input small"
                value={filters.cashierId}
                onChange={e => setFilters(prev => ({ ...prev, cashierId: e.target.value }))}
                style={{ appearance: 'none', paddingRight: '20px' }}
              >
                <option value="">All Cashiers</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight: '600px' }}>
          <table className="w-full professional-table">
            <thead style={{ background: 'var(--bg-soft)', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Date</th>
                <th>Cashier</th>
                <th>Branch</th>
                <th className="text-right">Cash</th>
                <th className="text-right">Card</th>
                <th className="text-right">Credit</th>
                <th className="text-right">Total</th>
                <th className="text-right" style={{ paddingRight: '24px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-20">
                    <div className="spinner accent" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : worksheets.length > 0 ? (
                worksheets.map(sheet => (
                  <tr key={sheet._id} className="table-row-hover">
                    <td style={{ paddingLeft: '24px' }}>
                      <strong>{sheet.date}</strong>
                    </td>
                    <td>
                      <div className="stack gap-1">
                        <span className="font-strong small">{sheet.cashierName}</span>
                        <span className="muted x-small">@{sheet.cashierUsername}</span>
                      </div>
                    </td>
                    <td className="muted small">{sheet.branch}</td>
                    <td className="text-right font-strong small text-success">
                      {formatCurrency(sheet.totals?.cash || 0)}
                    </td>
                    <td className="text-right font-strong small text-accent">
                      {formatCurrency(sheet.totals?.card || 0)}
                    </td>
                    <td className="text-right font-strong small text-warning">
                      {formatCurrency(sheet.totals?.credit || 0)}
                    </td>
                    <td className="text-right font-strong small">
                      {formatCurrency(sheet.totals?.total || 0)}
                    </td>
                    <td className="text-right" style={{ paddingRight: '24px' }}>
                      <button 
                        className="btn btn-ghost small" 
                        onClick={() => handlePrintWorksheet(sheet)}
                        title="Download / Print Worksheet"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-20 muted small">
                    No worksheets found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
