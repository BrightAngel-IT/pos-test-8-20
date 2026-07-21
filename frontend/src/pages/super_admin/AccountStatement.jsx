import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Download,
  Calendar,
  Eye,
  Building2,
  User,
  Info,
  Plus,
  AlertCircle,
  Printer,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Receipt,
  Filter,
  RefreshCw,
  MoreVertical
} from 'lucide-react'
import { authConfig, formatCurrency, formatDate, getBaseUrl } from '../../utils'
import { SectionHeading } from '../../components/SectionHeading'

export default function AccountStatement({ api, session, onNotice, company }) {
  const { type, id } = useParams()
  const navigate = useNavigate()

  const logoUrl = company?.logo ? `${getBaseUrl()}${company.logo}` : '/logo1.png'
  const companyName = company?.name || 'NILMA Alliance'
  const companyTagline = company?.tagline || 'INVENTORY MANAGEMENT SOLUTIONS'
  const companyAddress = company?.address || '295, 1/1 Galle Road, Colombo – 06, Sri Lanka'
  const companyPhone = company?.phone || '+94 11 234 5678'
  const companyEmail = company?.email || 'info@nilmaalliance.com'

  const [entity, setEntity] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAllocations, setShowAllocations] = useState(null) // ID of payment to show allocations for

  // Date range filters for user friendliness
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })

  useEffect(() => {
    if (type && id) {
      fetchData()
    }
  }, [type, id])

  async function fetchData() {
    setLoading(true)
    try {
      const config = authConfig(session.token)
      const [entityRes, invoicesRes, paymentsRes, returnsRes] = await Promise.all([
        api.get(`/${type}s/${id}`, config),
        api.get(`/${type === 'customer' ? 'customer-invoices/customer' : 'supplier-invoices/supplier'}/${id}`, config),
        api.get(`/${type === 'customer' ? 'payments' : 'supplier-payments'}?${type}Id=${id}`, config),
        api.get(`/returns?entityId=${id}`, config)
      ])

      setEntity(entityRes.data)
      setInvoices(invoicesRes.data || [])
      setPayments(paymentsRes.data || [])
      setReturns(returnsRes.data || [])
    } catch (err) {
      onNotice?.({ type: 'error', text: 'Failed to load account data.' })
    } finally {
      setLoading(false)
    }
  }

  const statementData = useMemo(() => {
    const transactions = [
      ...invoices.map(inv => ({
        _id: inv._id,
        date: inv.date,
        type: 'Invoice',
        reference: inv.invoiceNo,
        billing: inv.totalAmount,
        payment: 0,
        status: inv.status,
        raw: inv
      })),
      ...payments.map(pay => ({
        _id: pay._id,
        date: pay.paymentDate,
        type: 'Payment',
        reference: pay.paymentNo,
        method: pay.paymentMethod || 'N/A',
        billing: 0,
        payment: pay.totalAmount,
        status: 'PAID',
        raw: pay
      })),
      ...returns.filter(ret => ret.refundMethod === 'credit-note').map(ret => ({
        _id: ret._id,
        date: ret.createdAt,
        type: 'Return (Credit Note)',
        reference: ret.returnNo,
        method: 'CREDIT NOTE',
        billing: 0,
        payment: ret.totalAmount,
        status: 'COMPLETED',
        raw: ret
      }))
    ]

    // Sort by date (if same day, use precise createdAt time)
    transactions.sort((a, b) => {
      const dA = new Date(a.date)
      const dB = new Date(b.date)
      const isSameDay = dA.getFullYear() === dB.getFullYear() && 
                        dA.getMonth() === dB.getMonth() && 
                        dA.getDate() === dB.getDate()
      
      if (isSameDay) {
        const cA = new Date(a.raw.createdAt || a.date)
        const cB = new Date(b.raw.createdAt || b.date)
        return cA - cB
      }
      return dA - dB
    })

    // Calculate running balance
    let balance = 0
    return transactions.map(t => {
      balance += t.billing - t.payment
      return { ...t, balance }
    })
  }, [invoices, payments, returns])

  const filteredData = useMemo(() => {
    return statementData.filter(t => {
      const matchesSearch = String(t.reference || t._id || '').toLowerCase().includes(search.toLowerCase())

      const tDate = new Date(t.date)
      const matchesStart = !dateRange.start || tDate >= new Date(dateRange.start)
      const matchesEnd = !dateRange.end || tDate <= new Date(dateRange.end)

      return matchesSearch && matchesStart && matchesEnd
    })
  }, [statementData, search, dateRange])

  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0)
    const totalPaid = payments.reduce((sum, p) => sum + p.totalAmount, 0)
    const totalReturned = returns.filter(ret => ret.refundMethod === 'credit-note').reduce((sum, r) => sum + r.totalAmount, 0)
    const outstanding = totalInvoiced - totalPaid - totalReturned
    return { totalInvoiced, totalPaid, totalReturned, outstanding }
  }, [invoices, payments, returns])

  const handlePrint = () => {
    window.print()
  }

  if (loading) return (
    <div className="p-12 text-center stack align-center gap-6 animate-pulse">
      <RefreshCw size={48} className="spinner accent-text" />
      <p className="muted font-strong">Preparing high-fidelity statement...</p>
    </div>
  )

  if (!entity) return (
    <div className="p-20 text-center muted stack align-center gap-4">
      <AlertCircle size={64} className="danger-text" />
      <h3 className="font-strong">Entity Records Not Found</h3>
      <p>The requested {type} account could not be retrieved from the database.</p>
      <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  )

  return (
    <div className="stack gap-8 animate-fade account-statement-page">
      {/* Interactive Toolbelt (Non-Printable) */}
      <div className="between wrap-row no-print panel glass-panel p-4 shadow-sm" style={{ borderRadius: '16px' }}>
        <div className="cluster gap-4">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Accounts
          </button>
          <div className="v-divider"></div>
          <div className="cluster gap-3">
            <div className="input-shell compact" style={{ width: '200px' }}>
              <Calendar size={14} className="muted" />
              <input type="date" className="ghost-input x-small" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
            </div>
            <span className="muted small">to</span>
            <div className="input-shell compact" style={{ width: '200px' }}>
              <Calendar size={14} className="muted" />
              <input type="date" className="ghost-input x-small" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
            </div>
            {(dateRange.start || dateRange.end) && (
              <button className="btn btn-sm btn-ghost danger-text" onClick={() => setDateRange({ start: '', end: '' })}>Clear Filters</button>
            )}
          </div>
        </div>

        <div className="cluster gap-3">
          <button className="btn btn-outline" onClick={handlePrint}>
            <Printer size={16} />
            Download PDF
          </button>
          <button className="btn btn-primary shadow-lg" onClick={() => navigate('/payments')}>
            <Plus size={16} />
            Record Payment
          </button>
        </div>
      </div>

      {/* Official Statement Document */}
      <div className="document-container shadow-2xl">
        {/* Official Letterhead Watermark */}
        <div className="document-watermark">{company?.watermark || companyName.split(' ')[0]}</div>

        {/* Document Header (Custom Layout) */}
        <div className="custom-document-header">
          {/* Left Column: Company Identity & Supplier Details */}
          <div className="parties-col">
            <div className="company-branding-custom left-align">
              <div className="logo-vertical-stack">
                <img src={logoUrl} alt="Company Logo" className="header-logo-img large-logo" />
                <div className="brand-text-group">
                  <h1 className="brand-name">{companyName}</h1>
                  <p className="brand-slogan">{companyTagline}</p>
                </div>
              </div>
              <div className="company-address-minimal">
                <p>{companyAddress}</p>
                <p>{companyPhone} | {companyEmail}</p>
              </div>
            </div>

            <div className="branding-divider"></div>

            <div className="billed-to-col">
              <span className="col-label">{type === 'customer' ? 'BILLED TO (CUSTOMER):' : 'REMIT TO (SUPPLIER):'}</span>
              <h2 className="billed-party-name">{entity.name}</h2>
              <div className="billed-contact-list">
                {entity.email && (
                  <div className="contact-row">
                    <Mail size={12} className="muted" />
                    <span>{entity.email}</span>
                  </div>
                )}
                {entity.phone && (
                  <div className="contact-row">
                    <Phone size={12} className="muted" />
                    <span>{entity.phone}</span>
                  </div>
                )}
                {entity.address && (
                  <div className="contact-row">
                    <MapPin size={12} className="muted" />
                    <span>{entity.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Title & Summary */}
          <div className="branding-meta-col">
            <div className="statement-title-section">
              <h1 className="doc-title-large">
                {type === 'customer' ? 'CUSTOMER STATEMENT' : 'SUPPLIER STATEMENT'}
              </h1>
              <div className="doc-meta-minimal">
                <p>REF: {entity._id.slice(-8).toUpperCase()}</p>
                <p>Generated: {new Date().toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            <div className="financial-summary-box">
              <h3 className="summary-box-label">FINANCIAL SUMMARY</h3>
              <div className="summary-row">
                <span>{type === 'customer' ? 'Total Invoiced' : 'Total Purchases'}</span>
                <strong>{formatCurrency(stats.totalInvoiced)}</strong>
              </div>
              <div className="summary-row">
                <span>{type === 'customer' ? 'Total Payments' : 'Total Payments'}</span>
                <strong>{formatCurrency(stats.totalPaid)}</strong>
              </div>
              {stats.totalReturned > 0 && (
                <div className="summary-row">
                  <span>Total Returns (CN)</span>
                  <strong>{formatCurrency(stats.totalReturned)}</strong>
                </div>
              )}
              <div className="summary-divider"></div>
              <div className="summary-row balance-row">
                <span>Balance Due</span>
                <strong className="balance-value">
                  {stats.outstanding < 0 ? `(${formatCurrency(Math.abs(stats.outstanding))})` : formatCurrency(stats.outstanding)}
                </strong>
              </div>
              <div className="balance-underline"></div>
            </div>
          </div>
        </div>

        {/* Search Bar (Web only) */}
        <div className="document-toolbar no-print">
          <div className="input-shell ghost" style={{ flex: 1 }}>
            <Search size={18} className="muted" />
            <input className="ghost-input" placeholder="Search by reference number..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="document-body">
          <table className="statement-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref No</th>
                <th>Method</th>
                <th className="text-right">Debit (Dr)</th>
                <th className="text-right">Credit (Cr)</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <React.Fragment key={row._id}>
                  <tr className="statement-row">
                    <td>{new Date(row.date).toLocaleDateString()}</td>
                    <td>
                      <strong style={{ fontSize: '12px' }}>{row.reference}</strong>
                    </td>
                    <td>
                      <span className="muted x-small uppercase">{row.method || '-'}</span>
                    </td>
                    <td className="text-right">{row.billing > 0 ? formatCurrency(row.billing) : '-'}</td>
                    <td className="text-right success-text">{row.payment > 0 ? formatCurrency(row.payment) : '-'}</td>
                    <td className="text-right font-strong">
                      {row.balance < 0 ? `(${formatCurrency(Math.abs(row.balance))})` : formatCurrency(row.balance)}
                    </td>
                  </tr>

                  {/* Allocation breakdown (Optional in Web, Mandatory in Print if active) */}
                  {(showAllocations === row._id || window.matchMedia('print').matches) && row.type === 'Payment' && row.raw.allocations.length > 0 && (
                    <tr className="allocation-row no-hover">
                      <td colSpan="6">
                        <div className="allocation-details">
                          <span className="allocation-label">Settlement Breakdown:</span>
                          <div className="allocation-grid">
                            {row.raw.allocations.map((alloc, idx) => (
                              <div key={idx} className="allocation-item">
                                <span>Inv: {alloc.invoiceId?.invoiceNo || 'N/A'}</span>
                                <strong>{formatCurrency(alloc.allocatedAmount)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="empty-state">
              <Receipt size={48} opacity={0.1} />
              <p>No transactions found for the selected filters.</p>
            </div>
          )}
        </div>

        {/* Official Footer */}
        <div className="document-footer">
          <div className="footer-content-wrapper">
            <div className="footer-signature-block">
              <div className="signature-line"></div>
              <div className="signature-meta">
                <span className="signature-label">AUTHORIZED SIGNATURE & STAMP</span>
              </div>
            </div>

            <div className="footer-info-block">
              <p className="system-disclaimer">
                This is a computer-generated statement and does not require a physical signature.
                For any discrepancies, please notify us within 7 business days.
              </p>
              <div className="footer-pagination">
                <span>Page 01 of 01</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .document-container {
          background: var(--panel-strong);
          color: var(--text);
          border-radius: 24px;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          border: 1px solid var(--border);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
          position: relative;
        }

        .document-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 180px;
          font-weight: 900;
          color: var(--text);
          opacity: 0.02;
          pointer-events: none;
          z-index: 0;
          user-select: none;
        }

        .custom-document-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          padding: 40px 50px;
          background: transparent;
          position: relative;
          z-index: 1;
        }

        .col-label { font-size: 9px; font-weight: 800; color: var(--text-soft); opacity: 0.7; letter-spacing: 1.5px; display: block; margin-bottom: 12px; text-transform: uppercase; }
        .billed-party-name { font-size: 28px; font-weight: 900; color: var(--text); margin-bottom: 15px; letter-spacing: -0.5px; }
        .billed-contact-list { display: flex; flex-direction: column; gap: 6px; }
        .contact-row { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-soft); font-weight: 500; }

        .company-branding-custom { margin-bottom: 25px; }
        .company-branding-custom.left-align { text-align: left; }
        .logo-vertical-stack { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
        .brand-text-group { display: flex; flex-direction: column; gap: 2px; }
        .header-logo-img.large-logo { height: 100px; width: auto; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
        .brand-name { font-size: 26px; font-weight: 900; color: var(--text); margin: 0; line-height: 1.1; letter-spacing: -0.5px; white-space: nowrap; }
        .brand-name .pvt-ltd { color: var(--accent); }
        .brand-slogan { font-size: 10px; font-weight: 800; color: var(--text-soft); opacity: 0.6; letter-spacing: 2px; margin-top: 4px; }
        
        .company-address-minimal { font-size: 11px; color: var(--text-soft); margin-top: 12px; line-height: 1.5; font-weight: 500; }

        .branding-divider { height: 2px; background: var(--border); width: 100%; margin: 20px 0; opacity: 0.5; }

        .branding-meta-col { padding-top: 15px; }
        .statement-title-section { text-align: right; margin-bottom: 30px; }
        .doc-title-large { 
          font-size: 34px; 
          font-weight: 900; 
          color: var(--text); 
          margin-bottom: 8px; 
          letter-spacing: -1.5px; 
          line-height: 1; 
          white-space: nowrap;
        }
        .doc-meta-minimal { font-size: 11px; font-weight: 700; color: var(--text-soft); opacity: 0.6; line-height: 1.6; text-transform: uppercase; }

        .financial-summary-box {
          background: var(--panel);
          border: 1px solid var(--accent-soft);
          border-radius: 16px;
          padding: 15px 20px;
          margin-left: auto;
          width: 280px;
          position: relative;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        }

        .summary-box-label { font-size: 8px; font-weight: 800; color: var(--text-soft); opacity: 0.7; letter-spacing: 1.2px; margin-bottom: 12px; text-transform: uppercase; }
        .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; color: var(--text-soft); font-weight: 600; }
        .summary-row strong { color: var(--text); font-weight: 800; }
        .summary-divider { height: 1px; background: var(--border); margin: 10px 0; }
        .balance-row { font-size: 14px; margin-bottom: 4px; }
        .balance-value { font-size: 18px; font-weight: 900; color: var(--text); }
        .balance-underline { height: 2px; border-bottom: 1.5px solid var(--text); border-top: 1.5px solid var(--text); width: 100%; margin-top: 4px; opacity: 0.2; }

        .document-toolbar { padding: 15px 50px; background: transparent; border-bottom: 1px solid var(--border); }

        .document-body { padding: 0 50px 40px 50px; position: relative; z-index: 1; }
        .statement-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .statement-table th { 
          padding: 10px 8px; 
          text-align: left; 
          font-size: 9px; 
          font-weight: 900; 
          color: #ffffff; 
          background: var(--accent); 
          text-transform: uppercase; 
          letter-spacing: 1.5px;
          border: none;
        }
        .statement-table th:first-child { border-top-left-radius: 8px; padding-left: 20px; }
        .statement-table th:last-child { border-top-right-radius: 8px; padding-right: 20px; }

        .statement-row td { 
          padding: 8px; 
          border-bottom: 1px solid var(--border); 
          font-size: 12px;
          color: var(--text);
          font-weight: 500;
        }
        .statement-row td:first-child { padding-left: 20px; }
        .statement-row td:last-child { padding-right: 20px; }
        .statement-row:hover { background: var(--bg-soft); }

        .allocation-details { 
          padding: 20px; 
          background: var(--bg-soft); 
          border-radius: 16px; 
          margin: 10px 0; 
          border: 1px solid var(--border); 
        }
        .allocation-label { display: block; font-size: 10px; font-weight: 900; color: var(--text-soft); opacity: 0.7; text-transform: uppercase; margin-bottom: 15px; }
        .allocation-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .allocation-item { 
          display: flex; 
          justify-content: space-between; 
          font-size: 12px; 
          padding: 12px; 
          background: var(--panel); 
          border: 1px solid var(--border); 
          border-radius: 10px;
        }

        .document-footer { 
          padding: 50px; 
          background: transparent; 
          border-top: 2px solid var(--accent-soft); 
          page-break-inside: avoid;
          position: relative;
          z-index: 1;
        }

        .footer-content-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .footer-signature-block { text-align: left; flex-shrink: 0; }
        .signature-line { width: 240px; height: 2px; background: var(--text); margin-bottom: 12px; }
        .signature-meta { display: flex; flex-direction: column; gap: 4px; }
        .signature-label { font-size: 9px; font-weight: 900; color: var(--text-soft); opacity: 0.7; text-transform: uppercase; letter-spacing: 1.5px; }
        
        .footer-info-block { text-align: right; max-width: 450px; flex-shrink: 0; }
        .system-disclaimer { font-size: 9px; color: var(--text-soft); opacity: 0.6; line-height: 1.6; margin-bottom: 15px; font-weight: 500; font-style: italic; }
        .footer-pagination { font-size: 10px; font-weight: 800; color: var(--text-soft); opacity: 0.7; text-transform: uppercase; letter-spacing: 1.2px; }

        .empty-state { padding: 100px; text-align: center; color: var(--text-soft); opacity: 0.5; }

        @media print {
          @page { size: A4; margin: 0; }
          
          /* Force White theme for printing regardless of app theme */
          html, body, #root, .app-shell, .workspace, .account-statement-page {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            width: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          /* Explicitly Hide UI elements that leak into print */
          .sidebar, .topbar, .notice-banner, .no-print, .btn, button, .icon-btn, .v-divider, nav { 
            display: none !important; 
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            position: absolute !important;
            left: -9999px !important;
          }

          .document-container { 
            border: none !important;
            box-shadow: none !important;
            width: 210mm !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            visibility: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
          }

          /* Print Overrides to ensure dark text on white */
          .document-container { color: #000000 !important; }
          .billed-party-name, .brand-name, .doc-title-large, .summary-row strong, .balance-value, .statement-row td, .footer-brand-name { 
            color: #000000 !important; 
          }
          .col-label, .contact-row, .brand-slogan, .company-address-minimal, .doc-meta-minimal, .summary-box-label, .summary-row, .system-disclaimer, .footer-pagination, .signature-label {
            color: #444444 !important;
          }
          
          .financial-summary-box {
            border: 1px solid #000 !important;
            background: #fff !important;
          }
          
          .statement-table th {
            background: #1e293b !important;
            color: #ffffff !important;
            padding: 3mm 2mm !important;
            border-bottom: 1px solid #000 !important;
            -webkit-print-color-adjust: exact;
          }
          
          .statement-row td {
            border-bottom: 0.5pt solid #eee !important;
          }

          .signature-line {
            background: #000 !important;
          }

          .branding-divider {
            background: #eee !important;
          }

          .document-watermark {
            display: block !important;
            opacity: 0.08 !important;
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  )
}
