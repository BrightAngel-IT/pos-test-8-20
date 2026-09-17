import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Wallet,
  CreditCard,
  Building2
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading';
import { authConfig, formatCurrency } from '../../utils';
import { saveShiftOffline, getOfflineShifts } from '../../utils/offlineSync';

export function DailyWorksheet({ api, session, onNotice, company, refreshCoreData }) {
  const [currentShift, setCurrentShift] = useState(null);
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [opening, setOpening] = useState(false);
  
  const [filters, setFilters] = useState({
    date: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  async function fetchData() {
    setLoading(true);
    try {
      if (!navigator.onLine) {
        const offlineShifts = await getOfflineShifts();
        if (offlineShifts.length > 0) {
          const lastShift = offlineShifts[offlineShifts.length - 1];
          if (lastShift.action === 'open') {
            setCurrentShift(lastShift.payload);
          } else {
            setCurrentShift(null);
          }
        } else {
          const lastKnown = localStorage.getItem('ims-last-known-job') === 'true';
          if (lastKnown) {
             setCurrentShift({ status: 'open', date: new Date().toISOString().split('T')[0] });
          } else {
             setCurrentShift(null);
          }
        }
        setWorksheets([]);
        setLoading(false);
        return;
      }

      // Get current active shift
      const currentRes = await api.get(`/shifts/current?_t=${Date.now()}`, authConfig(session.token));
      setCurrentShift(currentRes.data || null);
      localStorage.setItem('ims-last-known-job', currentRes.data ? 'true' : 'false');

      // Get past closed worksheets
      let query = '';
      if (filters.date) {
        query = `?date=${filters.date}`;
      }
      const historyRes = await api.get(`/shifts/worksheets${query}`, authConfig(session.token));
      setWorksheets(historyRes.data || []);
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to load daily worksheet data.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenShift() {
    setOpening(true);
    try {
      const startTime = Date.now();
      if (!navigator.onLine) {
        const offlineShiftData = {
          startTime,
          cashierId: session.user._id,
          cashierName: session.user.name,
          cashierUsername: session.user.username,
          branch: session.user.branch || 'Main Branch',
          date: new Date(startTime).toISOString().split('T')[0],
          status: 'open'
        };
        await saveShiftOffline({ action: 'open', payload: { startTime } });
      setCurrentShift(offlineShiftData);
      localStorage.setItem('ims-last-known-job', 'true');
      onNotice({ type: 'success', text: 'Offline: Job started successfully! Will sync when online.' });
      if (refreshCoreData) await refreshCoreData();
      return;
    }
    const res = await api.post('/shifts/open', { startTime }, authConfig(session.token));
    onNotice({ type: 'success', text: 'Job started successfully!' });
    setCurrentShift(res.data.shift);
    localStorage.setItem('ims-last-known-job', 'true');
    if (refreshCoreData) await refreshCoreData();
  } catch (err) {
      onNotice({ type: 'error', text: err.response?.data?.message || 'Failed to start job.' });
    } finally {
      setOpening(false);
    }
  }

  async function handleCloseShift() {
    if (!window.confirm('Are you sure you want to end your job for today?')) return;
    
    setClosing(true);
    try {
      const endTime = Date.now();
      if (!navigator.onLine) {
        await saveShiftOffline({ action: 'close', payload: { endTime } });
        
        // Mock a closed worksheet for local display
        const closedWorksheet = {
          ...currentShift,
          endTime,
          status: 'closed',
          totals: {
            cash: '0.00', card: '0.00', credit: '0.00', total: '0.00' // Real totals will calculate on sync
          },
          salesCount: 0,
          isOfflineMock: true
        };
        setCurrentShift(null);
        localStorage.setItem('ims-last-known-job', 'false');
        setWorksheets(prev => [closedWorksheet, ...prev]);
        onNotice({ type: 'success', text: 'Offline: Job closed successfully! Will sync when online.' });
        if (refreshCoreData) await refreshCoreData();
        return;
      }

      const res = await api.post('/shifts/close', { endTime }, authConfig(session.token));
      
      // Refresh worksheets view
      const wRes = await api.get('/shifts/worksheets', authConfig(session.token));
      setWorksheets(wRes.data || []);
      
      setCurrentShift(null);
      localStorage.setItem('ims-last-known-job', 'false');
      onNotice({ type: 'success', text: 'Job closed successfully.' });
      if (refreshCoreData) await refreshCoreData();
    } catch (err) {
      onNotice({ type: 'error', text: err.response?.data?.message || 'Failed to end job.' });
    } finally {
      setClosing(false);
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

  return (
    <div className="stack gap-6 animate-fade">
      <SectionHeading
        title="Work Shift Management"
        subtitle="Start your job to process sales, and end your job to generate the daily summary."
        icon={Clock}
      />

      <div className="grid-2 gap-6 align-start">
        {/* Current Shift Panel */}
        <section className="panel p-6 glass-panel stack gap-6" style={{ borderRadius: '20px' }}>
          <div className="cluster gap-2 mb-2">
            <Clock size={18} style={{ color: 'var(--accent)' }} />
            <span className="eyebrow">Active Shift Status</span>
          </div>

          {loading && !currentShift && !worksheets.length ? (
             <div className="stack align-center gap-3 p-10 muted">
               <div className="spinner accent" />
               Checking shift status...
             </div>
          ) : currentShift ? (
            <div className="stack gap-5">
              <div className="p-4" style={{ borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div className="cluster gap-2 mb-2" style={{ color: 'var(--accent-strong)' }}>
                  <CheckCircle2 size={18} />
                  <strong>Job Currently Active</strong>
                </div>
                <p className="muted small">
                  Your job was started on <strong>{new Date(currentShift.startTime).toLocaleString()}</strong>. You can now process sales.
                </p>
              </div>

              <div className="panel-strong p-4 stack gap-3" style={{ borderRadius: '16px', background: 'var(--bg-soft)', border: '1px dashed var(--border)' }}>
                <div className="between x-small muted font-bold uppercase">
                  <span>Branch</span>
                  <span style={{ color: 'var(--text)' }}>{currentShift.branch}</span>
                </div>
                <div className="between x-small muted font-bold uppercase">
                  <span>Date</span>
                  <span style={{ color: 'var(--text)' }}>{currentShift.date}</span>
                </div>
              </div>

              <button
                className="btn btn-primary large-btn"
                onClick={handleCloseShift}
                disabled={closing}
                style={{
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, var(--danger), #be123c)'
                }}
              >
                {closing ? (
                  <div className="cluster gap-2">
                    <div className="spinner small white" />
                    Ending Job...
                  </div>
                ) : (
                  <div className="cluster gap-2">
                    <CheckCircle2 size={18} />
                    End Job
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="stack align-center gap-5 p-10 text-center">
              <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)' }}>
                <Clock size={48} style={{ color: 'var(--danger)' }} />
              </div>
              <div>
                <h3 className="mb-2">No Active Job</h3>
                <p className="muted small max-w-md" style={{ margin: '0 auto' }}>
                  You must start your job before you can process any sales at the POS terminal.
                </p>
              </div>
              
              <button
                className="btn btn-primary large-btn"
                onClick={handleOpenShift}
                disabled={opening}
                style={{
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '1.1rem',
                  marginTop: '10px'
                }}
              >
                {opening ? (
                  <div className="cluster gap-2">
                    <div className="spinner small white" />
                    Starting Job...
                  </div>
                ) : (
                  <div className="cluster gap-2">
                    <CheckCircle2 size={18} />
                    Start Job
                  </div>
                )}
              </button>
            </div>
          )}
        </section>

        {/* History Panel */}
        <section className="panel p-0 glass-panel overflow-hidden stack gap-0" style={{ borderRadius: '20px' }}>
          <div className="p-6 between">
            <div>
              <div className="cluster gap-2 mb-2">
                <Wallet size={18} style={{ color: 'var(--accent)' }} />
                <span className="eyebrow">Past Worksheets</span>
              </div>
              <p className="muted small">Your closed daily summaries.</p>
            </div>
            
            <div className="input-shell compact" style={{ borderRadius: '8px' }}>
              <Calendar size={14} className="muted" />
              <input 
                type="date"
                className="ghost-input x-small"
                value={filters.date}
                onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="overflow-auto" style={{ maxHeight: '600px' }}>
            <table className="w-full professional-table">
              <thead style={{ background: 'var(--bg-soft)', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Date</th>
                  <th className="text-right">Cash</th>
                  <th className="text-right">Total Sales</th>
                  <th className="text-right" style={{ paddingRight: '24px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && worksheets.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-20">
                      <div className="spinner accent" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : worksheets.length > 0 ? (
                  worksheets.map(sheet => (
                    <tr key={sheet._id} className="table-row-hover">
                      <td style={{ paddingLeft: '24px' }}>
                        <strong>{sheet.date}</strong>
                      </td>
                      <td className="text-right text-success font-strong small">
                        {formatCurrency(sheet.totals?.cash || 0)}
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
                    <td colSpan="4" className="text-center p-20 muted small">
                      No worksheets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
