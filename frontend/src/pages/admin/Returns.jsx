/**
 * Module: Returns
 * 
 * React UI page component representing the Returns view.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  RotateCcw, 
  Search, 
  Filter, 
  Plus, 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  XCircle,
  MoreVertical,
  History,
  Boxes,
  ScanLine,
  Eye,
  Check,
  DollarSign
} from 'lucide-react'
import { authConfig, formatCurrency, formatDate } from '../../utils'
import { SectionHeading } from '../../components/SectionHeading'
import { Pagination } from '../../components/Pagination'
import _BarcodeReader from 'react-barcode-reader'
const BarcodeReader = _BarcodeReader.default || _BarcodeReader

export default function Returns({ api, session, onNotice, refreshCoreData }) {
  const navigate = useNavigate()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchMethod, setSearchMethod] = useState('all') // 'all', 'returnNo', 'entityName', 'referenceNo'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateFilterPreset, setDateFilterPreset] = useState('all') // 'all', 'today', '7days', '30days', 'custom'
  const [showForm, setShowForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Reset page to 1 on filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, searchMethod, startDate, endDate, dateFilterPreset])
  
  const [returnMode, setReturnMode] = useState('customer') // 'customer' or 'supplier'
  
  // New Return Form State
  const [newReturn, setNewReturn] = useState({
    type: 'customer',
    entityId: '',
    entityName: '',
    referenceNo: '',
    reason: '',
    refundMethod: 'credit-note',
    items: []
  })

  useEffect(() => {
    setNewReturn(prev => ({ ...prev, type: returnMode }))
  }, [returnMode])
  
  const [foundInvoice, setFoundInvoice] = useState(null)
  const [isSearchingInvoice, setIsSearchingInvoice] = useState(false)
  const [lastScannedBarcode, setLastScannedBarcode] = useState('')
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [settlingReturn, setSettlingReturn] = useState(null)
  const [settling, setSettling] = useState(false)

  // Autocomplete suggestions states
  const [availableInvoices, setAvailableInvoices] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [lookupStartDate, setLookupStartDate] = useState('')
  const [lookupEndDate, setLookupEndDate] = useState('')
  const [lookupEntityName, setLookupEntityName] = useState('')

  useEffect(() => {
    if (!showForm) return;
    async function loadInvoices() {
      try {
        if (newReturn.type === 'customer') {
          const response = await api.get('/sales', authConfig(session.token))
          setAvailableInvoices(response.data.sales || [])
        } else {
          const response = await api.get('/supplier-invoices', authConfig(session.token))
          setAvailableInvoices(response.data || [])
        }
      } catch (error) {
        console.error('Failed to load suggestions', error)
      }
    }
    loadInvoices()
  }, [showForm, newReturn.type, session.token])

  useEffect(() => {
    fetchReturns()
  }, [])

  async function fetchReturns() {
    try {
      const res = await api.get('/returns', authConfig(session.token))
      setReturns(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSettle = async () => {
    setSettling(true)
    try {
      await api.put(`/returns/${settlingReturn._id}/settle`, {}, authConfig(session.token))
      onNotice({ type: 'success', text: 'Return settled successfully' })
      setSettlingReturn(null)
      fetchReturns()
      if (refreshCoreData) refreshCoreData()
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to settle return' })
    } finally {
      setSettling(false)
    }
  }

  async function searchInvoice(referenceOverride) {
    const ref = typeof referenceOverride === 'string' ? referenceOverride : newReturn.referenceNo;
    if (!ref) return
    setIsSearchingInvoice(true)
    setFoundInvoice(null)
    try {
      if (newReturn.type === 'customer') {
        // Searching for original sale/invoice
        const response = await api.get(`/sales?query=${ref}`, authConfig(session.token))
        const sale = response.data.sales.find(s => s.invoiceNumber === ref)
        
        if (sale) {
          setFoundInvoice(sale)
          setNewReturn(prev => ({
            ...prev,
            entityId: sale.customerId || '',
            entityName: sale.customerName || '',
            referenceNo: ref,
            items: sale.items.map(item => ({
              ...item,
              quantity: 0, // Default to 0 for returning single item
              maxQuantity: item.quantity,
              unitPrice: item.price
            }))
          }))
        } else {
          onNotice({ type: 'warning', text: 'Invoice not found.' })
        }
      } else {
        // supplier return
        const response = await api.get('/supplier-invoices', authConfig(session.token))
        const sInvoice = response.data.find(inv => inv.invoiceNo === ref)
        if (sInvoice) {
          const purchasesRes = await api.get('/purchases', authConfig(session.token))
          const purchase = purchasesRes.data.find(p => p.supplier?._id === sInvoice.supplierId?._id && Math.abs(p.total - sInvoice.totalAmount) < 0.01)
          if (purchase) {
            setFoundInvoice(purchase)
            setNewReturn(prev => ({
              ...prev,
              entityId: purchase.supplier?._id || '',
              entityName: purchase.supplier?.name || '',
              referenceNo: ref,
              items: purchase.products.map(item => ({
                productId: item.product?._id,
                name: item.product?.name,
                sku: item.product?.sku,
                barcode: item.product?.barcode,
                quantity: 0, // Default to 0
                maxQuantity: item.quantity,
                unitPrice: item.costPrice // Use cost price for supplier return
              }))
            }))
          } else {
            onNotice({ type: 'warning', text: 'Original purchase order not found for this invoice.' })
          }
        } else {
          onNotice({ type: 'warning', text: 'Supplier Invoice not found.' })
        }
      }
    } catch (error) {
      onNotice({ type: 'error', text: 'Error searching transaction.' })
    } finally {
      setIsSearchingInvoice(false)
    }
  }

  async function handleSubmitReturn(e) {
    e.preventDefault()
    const itemsToReturn = newReturn.items.filter(item => item.quantity > 0)
    
    if (itemsToReturn.length === 0) {
      onNotice({ type: 'warning', text: 'Please select at least one item to return with a quantity greater than zero.' })
      return
    }
    
    try {
      await api.post('/returns', { ...newReturn, items: itemsToReturn }, authConfig(session.token))
      onNotice({ type: 'success', text: 'Return processed successfully.' })
      setShowForm(false)
      if (refreshCoreData) await refreshCoreData()
      fetchReturns()
      resetForm()
    } catch (error) {
      onNotice({ type: 'error', text: 'Failed to process return.' })
    }
  }

  function resetForm() {
    setNewReturn({
      type: returnMode,
      entityId: '',
      entityName: '',
      referenceNo: '',
      reason: '',
      refundMethod: 'credit-note',
      items: []
    })
    setFoundInvoice(null)
    setLastScannedBarcode('')
    setLookupStartDate('')
    setLookupEndDate('')
    setLookupEntityName('')
  }

  async function handleBarcodeScan(code) {
    const cleanedCode = String(code || '').trim();
    if (!cleanedCode) return;
    setLastScannedBarcode(cleanedCode);

    // If an invoice is already found, try to select/increment the item in the return list
    if (foundInvoice) {
      const itemIndex = newReturn.items.findIndex(i => i.barcode === cleanedCode || i.sku === cleanedCode);
      if (itemIndex !== -1) {
        const nextItems = [...newReturn.items];
        const item = nextItems[itemIndex];
        if (item.quantity < item.maxQuantity) {
          item.quantity += 1;
          setNewReturn({ ...newReturn, items: nextItems });
          onNotice({ type: 'success', text: `Increased return qty for ${item.name}` });
        } else {
          onNotice({ type: 'warning', text: `Maximum return quantity reached for ${item.name}` });
        }
        return;
      } else {
        onNotice({ type: 'warning', text: `Scanned item is not part of this transaction.` });
        return;
      }
    }

    // Otherwise, try to find an invoice that contains this product
    onNotice({ type: 'info', text: `Searching for transactions containing: ${cleanedCode}` });
    try {
      if (newReturn.type === 'customer') {
        const response = await api.get(`/sales?query=${cleanedCode}`, authConfig(session.token));
        const relevantSales = response.data.sales;
        
        if (relevantSales.length > 0) {
          const latestSale = relevantSales[0];
          setFoundInvoice(latestSale);
          setNewReturn(prev => ({
            ...prev,
            referenceNo: latestSale.invoiceNumber,
            entityId: latestSale.customerId || '',
            entityName: latestSale.customerName || '',
            items: latestSale.items.map(item => ({
              ...item,
              quantity: (item.barcode === cleanedCode || item.sku === cleanedCode) ? 1 : 0, 
              maxQuantity: item.quantity,
              unitPrice: item.price
            }))
          }));
          onNotice({ type: 'success', text: `Found invoice ${latestSale.invoiceNumber}` });
          if (!showForm) setShowForm(true);
        } else {
          onNotice({ type: 'warning', text: 'No recent invoices found for this item.' });
        }
      } else {
        // supplier return type
        const purchasesRes = await api.get('/purchases', authConfig(session.token));
        const relevantPurchases = purchasesRes.data.filter(p => 
          p.products?.some(prod => prod.product?.barcode === cleanedCode || prod.product?.sku === cleanedCode)
        );

        if (relevantPurchases.length > 0) {
          const latestPurchase = relevantPurchases[relevantPurchases.length - 1];
          
          const sInvoicesRes = await api.get('/supplier-invoices', authConfig(session.token));
          const matchingInvoice = sInvoicesRes.data.find(inv => 
            inv.supplierId?._id === latestPurchase.supplier?._id && 
            Math.abs(inv.totalAmount - latestPurchase.total) < 0.01
          );

          setFoundInvoice(latestPurchase);
          setNewReturn(prev => ({
            ...prev,
            referenceNo: matchingInvoice ? matchingInvoice.invoiceNo : `PUR-${new Date(latestPurchase.date).getTime()}`,
            entityId: latestPurchase.supplier?._id || '',
            entityName: latestPurchase.supplier?.name || '',
            items: latestPurchase.products.map(item => ({
              productId: item.product?._id,
              name: item.product?.name,
              sku: item.product?.sku,
              barcode: item.product?.barcode,
              quantity: (item.product?.barcode === cleanedCode || item.product?.sku === cleanedCode) ? 1 : 0,
              maxQuantity: item.quantity,
              unitPrice: item.costPrice
            }))
          }));
          onNotice({ type: 'success', text: `Found purchase for supplier: ${latestPurchase.supplier?.name}` });
          if (!showForm) setShowForm(true);
        } else {
          onNotice({ type: 'warning', text: 'No recent purchases found for this item.' });
        }
      }
    } catch (error) {
      onNotice({ type: 'error', text: 'Error searching by barcode.' });
    }
  }

  function toggleItemInclusion(idx) {
    const nextItems = [...newReturn.items];
    const item = nextItems[idx];
    if (item.quantity > 0) {
      item.quantity = 0;
    } else {
      item.quantity = 1;
    }
    setNewReturn({ ...newReturn, items: nextItems });
  }

  function handleQuantityChange(idx, val) {
    const nextItems = [...newReturn.items];
    const item = nextItems[idx];
    const newQty = Math.max(0, Math.min(item.maxQuantity, val));
    item.quantity = newQty;
    setNewReturn({ ...newReturn, items: nextItems });
  }

  function selectAllItems() {
    setNewReturn(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        quantity: item.maxQuantity
      }))
    }));
  }

  function clearAllItems() {
    setNewReturn(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        quantity: 0
      }))
    }));
  }

  const filteredReturns = returns.filter(r => {
    // 1. Filter by active returnMode (customer vs supplier)
    if (r.type !== returnMode) return false;

    // 2. Filter by search term and searchMethod
    if (search.trim().length > 0) {
      const term = search.toLowerCase();
      if (searchMethod === 'returnNo') {
        if (!r.returnNo.toLowerCase().includes(term)) return false;
      } else if (searchMethod === 'entityName') {
        if (!r.entityName?.toLowerCase().includes(term)) return false;
      } else if (searchMethod === 'referenceNo') {
        if (!r.referenceNo?.toLowerCase().includes(term)) return false;
      } else {
        // 'all'
        const matchesAll = r.returnNo.toLowerCase().includes(term) ||
          r.entityName?.toLowerCase().includes(term) ||
          r.referenceNo?.toLowerCase().includes(term);
        if (!matchesAll) return false;
      }
    }

    // 3. Filter by date range (startDate & endDate or quickDateFilter presets)
    const createdAtDate = r.createdAt ? new Date(r.createdAt) : null;
    if (createdAtDate) {
      const retTime = createdAtDate.getTime();

      // Quick date filter presets comparison
      if (dateFilterPreset !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();

        if (dateFilterPreset === 'today') {
          const compareDate = new Date(r.createdAt);
          compareDate.setHours(0, 0, 0, 0);
          if (compareDate.getTime() !== todayTime) return false;
        } else if (dateFilterPreset === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          if (retTime < sevenDaysAgo.getTime()) return false;
        } else if (dateFilterPreset === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          if (retTime < thirtyDaysAgo.getTime()) return false;
        }
      }

      // Explicit startDate and endDate
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        if (retTime < sDate.getTime()) return false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        if (retTime > eDate.getTime()) return false;
      }
    } else if (startDate || endDate || dateFilterPreset !== 'all') {
      // If no date field exists on record but user filters by date, exclude
      return false;
    }

    return true;
  })

  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage)
  const paginatedReturns = filteredReturns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (showForm) {
    return (
      <div className="stack gap-4">
        <BarcodeReader onError={() => {}} onScan={handleBarcodeScan} />
        <div className="cluster gap-4 align-center wrap-row">
          <button onClick={() => { setShowForm(false); resetForm(); }} className="btn btn-secondary cluster gap-2" style={{ borderRadius: '12px', height: '38px', padding: '0 16px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ height: '20px', width: '1px', background: 'var(--border)' }}></div>
          <SectionHeading 
            title={newReturn.type === 'customer' ? "New Customer Return" : "New Supplier Return"} 
            subtitle={newReturn.type === 'customer' ? "Process a sale reversal and credit note" : "Process a vendor return and debit note"} 
          />
        </div>

        <div className="grid-2 gap-4 align-start">
          <div className="panel glass-panel stack gap-4 p-4">
            <div style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '12px', marginBottom: '4px' }}>
              <h3 className="font-bold cluster gap-2" style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>
                <History size={18} className="accent-text" /> 1. Locate Original Transaction
              </h3>
            </div>
            
            <div className="stack gap-3">
              <div className="field" style={{ position: 'relative' }}>
                <span>{newReturn.type === 'customer' ? 'Original Invoice Number' : 'Supplier Invoice Reference'}</span>
                <div className="cluster gap-2">
                  <input 
                    type="text" 
                    value={newReturn.referenceNo} 
                    onChange={e => {
                      setNewReturn({...newReturn, referenceNo: e.target.value})
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={newReturn.type === 'customer' ? 'e.g. C-INV-2026...' : 'e.g. PUR-2026...'}
                    style={{
                      flex: 1,
                      height: '42px',
                      borderRadius: '12px',
                      background: 'var(--panel-strong)',
                      border: '1px solid var(--border)',
                      padding: '0 16px',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  />
                  <button onClick={searchInvoice} className="btn btn-primary" disabled={isSearchingInvoice} style={{ height: '42px', borderRadius: '12px' }}>
                    {isSearchingInvoice ? 'Searching...' : 'Find'}
                  </button>
                </div>

                {showSuggestions && newReturn.referenceNo.trim().length > 0 && (
                  <>
                    <div 
                      onClick={() => setShowSuggestions(false)}
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998, background: 'transparent' }}
                    />
                    <div 
                      className="panel glass-panel stack"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '8px',
                        zIndex: 999,
                        maxHeight: '260px',
                        overflowY: 'auto',
                        boxShadow: 'var(--shadow-xl)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        background: 'var(--panel-strong)',
                        backdropFilter: 'blur(20px)',
                        padding: '6px'
                      }}
                    >
                      {availableInvoices
                        .filter(inv => {
                          const invNo = inv.invoiceNumber || inv.invoiceNo || '';
                          return invNo.toLowerCase().includes(newReturn.referenceNo.toLowerCase());
                        })
                        .slice(0, 5)
                        .map(inv => {
                          const invNo = inv.invoiceNumber || inv.invoiceNo;
                          const supplierName = typeof inv.supplierId === 'object' ? inv.supplierId?.name : inv.supplierId;
                          const name = inv.customerName || supplierName || inv.supplier?.name || inv.entityName || (newReturn.type === 'supplier' ? 'Unknown Supplier' : 'Walk-in Customer');
                          const amount = inv.total || inv.totalAmount || 0;
                          const dateStr = inv.createdAt || inv.date ? formatDate(inv.createdAt || inv.date) : '';
                          
                          return (
                            <button
                              key={inv._id || invNo}
                              type="button"
                              className="cursor-pointer"
                              style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                                textAlign: 'left',
                                marginBottom: '4px'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--accent-soft)';
                                e.currentTarget.style.transform = 'translateX(4px)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.transform = 'none';
                              }}
                              onClick={() => {
                                setNewReturn(prev => ({ ...prev, referenceNo: invNo }))
                                setShowSuggestions(false)
                                searchInvoice(invNo)
                              }}
                            >
                              <div 
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: 'var(--accent-soft)',
                                  display: 'grid',
                                  placeItems: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <FileText size={16} className="accent-text" />
                              </div>
                              <div className="stack" style={{ gap: '2px', flex: 1 }}>
                                <div className="between align-center" style={{ width: '100%' }}>
                                  <strong className="accent-text" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{invNo}</strong>
                                  {dateStr && <span className="muted x-small" style={{ fontSize: '0.7rem' }}>{dateStr}</span>}
                                </div>
                                <span className="muted x-small" style={{ display: 'block', fontSize: '0.75rem' }}>
                                  {name} • <span className="font-bold" style={{ color: 'var(--text)' }}>{formatCurrency(amount)}</span>
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      {availableInvoices.filter(inv => {
                        const invNo = inv.invoiceNumber || inv.invoiceNo || '';
                        return invNo.toLowerCase().includes(newReturn.referenceNo.toLowerCase());
                      }).length === 0 && (
                        <div className="p-4 muted small text-center">No matching invoices found</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Interactive Invoices Finder (Date, Entity Search & Select) */}
              <div 
                style={{ 
                  marginTop: '12px', 
                  borderTop: '1px dashed var(--border)', 
                  paddingTop: '12px' 
                }}
              >
                <div className="between align-center mb-2">
                  <span className="muted font-bold small uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                    Or browse & select matching transactions
                  </span>
                </div>
                
                <div className="grid-3 gap-2" style={{ marginBottom: '8px' }}>
                  <div className="stack gap-1">
                    <span className="muted small" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Contact / Client</span>
                    <input 
                      type="text" 
                      placeholder="Filter by contact name..." 
                      value={lookupEntityName}
                      onChange={e => setLookupEntityName(e.target.value)}
                      style={{ 
                        height: '30px', 
                        borderRadius: '8px', 
                        background: 'var(--panel-strong)', 
                        border: '1px solid var(--border)', 
                        padding: '0 8px', 
                        fontSize: '0.75rem', 
                        color: 'var(--text)',
                        width: '100%'
                      }}
                    />
                  </div>
                  <div className="stack gap-1">
                    <span className="muted small" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>From Date</span>
                    <input 
                      type="date" 
                      value={lookupStartDate}
                      onChange={e => setLookupStartDate(e.target.value)}
                      style={{ 
                        height: '30px', 
                        borderRadius: '8px', 
                        background: 'var(--panel-strong)', 
                        border: '1px solid var(--border)', 
                        padding: '0 8px', 
                        fontSize: '0.75rem', 
                        color: 'var(--text)',
                        width: '100%'
                      }}
                    />
                  </div>
                  <div className="stack gap-1">
                    <span className="muted small" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>To Date</span>
                    <input 
                      type="date" 
                      value={lookupEndDate}
                      onChange={e => setLookupEndDate(e.target.value)}
                      style={{ 
                        height: '30px', 
                        borderRadius: '8px', 
                        background: 'var(--panel-strong)', 
                        border: '1px solid var(--border)', 
                        padding: '0 8px', 
                        fontSize: '0.75rem', 
                        color: 'var(--text)',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>

                <div 
                  style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    background: 'var(--bg-soft)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  {(() => {
                    const filtered = availableInvoices.filter(inv => {
                      const supplierName = typeof inv.supplierId === 'object' ? inv.supplierId?.name : inv.supplierId;
                      const name = inv.customerName || supplierName || inv.supplier?.name || inv.entityName || (newReturn.type === 'supplier' ? 'Unknown Supplier' : 'Walk-in Customer');
                      if (lookupEntityName && !name.toLowerCase().includes(lookupEntityName.toLowerCase())) return false;
                      
                      const date = new Date(inv.createdAt || inv.date);
                      if (lookupStartDate) {
                        const sDate = new Date(lookupStartDate);
                        sDate.setHours(0,0,0,0);
                        if (date.getTime() < sDate.getTime()) return false;
                      }
                      if (lookupEndDate) {
                        const eDate = new Date(lookupEndDate);
                        eDate.setHours(23,59,59,999);
                        if (date.getTime() > eDate.getTime()) return false;
                      }
                      
                      return true;
                    });

                    if (filtered.length === 0) {
                      return <div className="p-3 text-center muted small">No transactions match your query.</div>;
                    }

                    return filtered.slice(0, 10).map(inv => {
                      const invNo = inv.invoiceNumber || inv.invoiceNo;
                      const supplierName = typeof inv.supplierId === 'object' ? inv.supplierId?.name : inv.supplierId;
                      const name = inv.customerName || supplierName || inv.supplier?.name || inv.entityName || (newReturn.type === 'supplier' ? 'Unknown Supplier' : 'Walk-in Customer');
                      const amount = inv.total || inv.totalAmount || 0;
                      const dateStr = formatDate(inv.createdAt || inv.date);
                      
                      return (
                        <div 
                          key={inv._id || invNo} 
                          className="between p-2 table-row-hover" 
                          style={{ 
                            borderBottom: '1px solid var(--border)', 
                            cursor: 'pointer', 
                            fontSize: '0.75rem', 
                            gap: '8px',
                            alignItems: 'center'
                          }}
                          onClick={() => {
                            setNewReturn(prev => ({ ...prev, referenceNo: invNo }));
                            searchInvoice(invNo);
                          }}
                        >
                          <div className="stack" style={{ gap: '2px' }}>
                            <strong className="accent-text" style={{ fontFamily: 'var(--font-mono)' }}>{invNo}</strong>
                            <span className="muted x-small">{name}</span>
                          </div>
                          <div className="stack text-right" style={{ gap: '2px' }}>
                            <span className="font-bold">{formatCurrency(amount)}</span>
                            <span className="muted x-small">{dateStr}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Barcode Scanner panel */}
              <div 
                className={`scanner-panel p-3 ${lastScannedBarcode ? 'animate-pulse-soft' : ''}`} 
                style={{ 
                  borderRadius: '12px', 
                  background: lastScannedBarcode ? 'linear-gradient(145deg, var(--accent-soft), var(--bg-soft))' : 'var(--bg-soft)', 
                  border: `1px solid ${lastScannedBarcode ? 'var(--accent)' : 'var(--border)'}`, 
                  transition: 'all 0.3s ease',
                  marginBottom: '8px'
                }}
              >
                <div className="between mb-1">
                  <div className="cluster gap-2">
                    <ScanLine size={16} className={lastScannedBarcode ? 'accent-text' : 'muted'} />
                    <strong style={{ fontSize: '0.8rem' }}>Barcode Scanner / Manual SKU</strong>
                  </div>
                  {lastScannedBarcode && <span className="pill" style={{ fontSize: '0.55rem', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Captured</span>}
                </div>
                <p className="muted small" style={{ fontSize: '0.7rem' }}>
                  {lastScannedBarcode ? `Last Scanned: ${lastScannedBarcode}` : 'Awaiting scanner input...'}
                </p>
                
                <div className="cluster gap-2 mt-2">
                  <input 
                    type="text" 
                    placeholder="Scan or type barcode/SKU & press Enter..." 
                    style={{ 
                      flex: 1,
                      width: '100%',
                      height: '36px', 
                      borderRadius: '8px', 
                      background: 'var(--panel)', 
                      border: '1px solid var(--border)',
                      padding: '0 12px',
                      color: 'var(--text)',
                      fontSize: '0.8rem'
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeScan(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
              
              {foundInvoice && (
                <div className="panel-strong p-4 rounded-xl border border-dashed border-accent-soft" style={{ background: 'var(--bg-soft)' }}>
                  <div className="between mb-2">
                    <span className="muted x-small uppercase font-bold" style={{ letterSpacing: '0.05em' }}>Transaction Found</span>
                    <span className="success-text x-small font-bold cluster gap-1"><CheckCircle2 size={12} /> VERIFIED</span>
                  </div>
                  <p className="font-bold">{newReturn.type === 'customer' ? (foundInvoice.customerName || 'Walk-in Customer') : (foundInvoice.supplier?.name || foundInvoice.entityName)}</p>
                  <div className="cluster gap-4 mt-2">
                    <span className="muted small cluster gap-1"><Calendar size={14} /> {formatDate(foundInvoice.createdAt || foundInvoice.date)}</span>
                    <span className="muted small cluster gap-1"><FileText size={14} /> {formatCurrency(foundInvoice.total || foundInvoice.totalAmount)}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '12px', marginTop: '16px', marginBottom: '8px' }}>
              <h3 className="font-bold cluster gap-2" style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>
                <RotateCcw size={18} className="accent-text" /> 2. Return Details
              </h3>
            </div>
            <div className="stack gap-3">
              <div className="field">
                <span>Reason for Return</span>
                <textarea 
                  value={newReturn.reason} 
                  onChange={e => setNewReturn({...newReturn, reason: e.target.value})}
                  placeholder="e.g. Damaged during transit, Wrong item..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    borderRadius: '12px',
                    background: 'var(--panel-strong)',
                    border: '1px solid var(--border)',
                    padding: '12px 16px',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    boxShadow: 'var(--shadow-sm)',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          </div>

          <div className="panel glass-panel stack gap-4 p-4">
            <div className="between align-center">
              <div style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '12px' }}>
                <h3 className="font-bold cluster gap-2" style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>
                  <Boxes size={18} className="accent-text" /> 3. Select Items to Return
                </h3>
              </div>
              {foundInvoice && (
                <div className="cluster gap-2">
                  <button 
                    type="button" 
                    onClick={selectAllItems} 
                    className="pill neutral-soft small glow-on-hover"
                    style={{ fontSize: '0.7rem', padding: '4px 10px', border: '1px solid var(--border)', cursor: 'pointer' }}
                  >
                    Select All
                  </button>
                  <button 
                    type="button" 
                    onClick={clearAllItems} 
                    className="pill neutral-soft small glow-on-hover"
                    style={{ fontSize: '0.7rem', padding: '4px 10px', border: '1px solid var(--border)', color: 'var(--danger)', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
            
            {!foundInvoice ? (
              <div className="stack align-center justify-center p-12 text-center" style={{ border: '2px dashed var(--border)', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.01)', minHeight: '280px' }}>
                <div style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)', width: '60px', height: '60px', borderRadius: '50%', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                  <RotateCcw size={28} />
                </div>
                <h4 className="font-bold mb-1" style={{ fontSize: '1.05rem', color: 'var(--text)' }}>Awaiting Transaction Lookup</h4>
                <p className="muted small max-w-xs" style={{ maxWidth: '280px', margin: '0 auto', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  Search for an invoice reference number above or scan product barcodes directly to begin processing items.
                </p>
              </div>
            ) : (
              <div className="stack gap-4">
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-soft)' }}>
                  <table className="professional-table density-compact" style={{ width: '100%' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--panel)' }}>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}></th>
                        <th>Product</th>
                        <th style={{ width: '130px', textAlign: 'center' }}>Return Qty</th>
                        <th className="text-right" style={{ width: '100px' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newReturn.items.map((item, idx) => {
                        const isSelected = item.quantity > 0;
                        return (
                          <tr 
                            key={idx} 
                            className="table-row-hover" 
                            style={{ 
                              background: isSelected ? 'var(--accent-soft)' : 'transparent',
                              transition: 'background 0.2s ease',
                              borderBottom: '1px solid var(--border)'
                            }}
                          >
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={() => toggleItemInclusion(idx)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                            </td>
                            <td>
                              <div className="stack" style={{ gap: '2px' }}>
                                <span className="font-bold" style={{ color: isSelected ? 'var(--text-strong)' : 'var(--text)' }}>{item.name}</span>
                                <div className="cluster gap-2 muted x-small">
                                  <span>SKU: {item.sku}</span>
                                  <span>•</span>
                                  <span>Max: {item.maxQuantity}</span>
                                  <span>•</span>
                                  <span>Price: {formatCurrency(item.unitPrice)}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <div className="cluster gap-1 align-center" style={{ background: 'var(--panel)', borderRadius: '8px', padding: '2px', display: 'inline-flex', border: '1px solid var(--border)' }}>
                                <button 
                                  type="button" 
                                  onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                                  style={{
                                    width: '24px', 
                                    height: '24px', 
                                    borderRadius: '6px', 
                                    border: 'none', 
                                    background: 'var(--bg-soft)', 
                                    color: 'var(--text)', 
                                    cursor: 'pointer',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem'
                                  }}
                                  className="glow-on-hover"
                                >
                                  -
                                </button>
                                <input 
                                  type="number" 
                                  value={item.quantity} 
                                  min="0" 
                                  max={item.maxQuantity}
                                  onChange={e => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                                  className="text-center font-bold"
                                  style={{ 
                                    width: '32px', 
                                    border: 'none', 
                                    background: 'transparent', 
                                    color: 'var(--text-strong)', 
                                    fontSize: '0.85rem',
                                    padding: '0',
                                    appearance: 'none',
                                    MozAppearance: 'textfield'
                                  }}
                                />
                                <button 
                                  type="button" 
                                  onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                                  style={{
                                    width: '24px', 
                                    height: '24px', 
                                    borderRadius: '6px', 
                                    border: 'none', 
                                    background: 'var(--bg-soft)', 
                                    color: 'var(--text)', 
                                    cursor: 'pointer',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem'
                                  }}
                                  className="glow-on-hover"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="text-right font-strong" style={{ verticalAlign: 'middle', color: isSelected ? 'var(--accent-strong)' : 'var(--text-soft)' }}>
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="panel-strong p-4 rounded-xl between mt-2" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
                  <div className="stack gap-1">
                    <span className="muted small">Items returning</span>
                    <strong style={{ fontSize: '0.95rem' }}>{newReturn.items.filter(i => i.quantity > 0).length} of {newReturn.items.length} items</strong>
                  </div>
                  <div className="stack gap-1 text-right">
                    <span className="muted small">Total Refund Value</span>
                    <strong className="accent-text" style={{ fontSize: '1.5rem' }}>
                      {formatCurrency(newReturn.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0))}
                    </strong>
                  </div>
                </div>

                <button onClick={handleSubmitReturn} className="btn btn-primary w-full p-4 mt-2 glow-on-hover" style={{ borderRadius: '12px', fontWeight: 'bold' }}>
                  Complete Return & Refund
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleNewReturnClick = () => {
    setNewReturn(prev => ({
      ...prev,
      type: returnMode
    }));
    setShowForm(true);
  }

  const modeAccent = returnMode === 'customer' ? 'var(--accent)' : 'var(--accent)'
  const modeAccentSoft = returnMode === 'customer' ? 'var(--accent-soft)' : 'var(--accent-soft)'

  return (
    <div className="stack gap-4 animate-fade">
      <BarcodeReader onError={() => {}} onScan={handleBarcodeScan} />
      
      {/* Header with Mode Toggle */}
      <div className="between wrap-row panel p-4 glass-panel" style={{ borderLeft: `4px solid ${modeAccent}`, borderRadius: '16px', gap: '16px' }}>
        <div className="cluster gap-4">
          <div className="icon-btn" style={{ background: modeAccentSoft, color: modeAccent, border: 'none', width: '44px', height: '44px' }}>
            <RotateCcw size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {returnMode === 'customer' ? 'Customer Returns' : 'Supplier Returns'}
            </h2>
            <p className="muted small" style={{ fontSize: '0.8rem' }}>
              {returnMode === 'customer'
                ? 'Manage merchandise returns from customers and issue credit notes or refunds.'
                : 'Process returns of purchased goods back to suppliers and track reversals.'}
            </p>
          </div>
        </div>

        <div className="cluster gap-3 wrap-row">
          <div className="cluster p-1 panel-strong" style={{ background: 'var(--bg-soft)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <button
              className={`btn sm ${returnMode === 'customer' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setReturnMode('customer');
              }}
              style={{ borderRadius: '10px', minWidth: '100px', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <User size={14} />
              Customer
            </button>
            <button
              className={`btn sm ${returnMode === 'supplier' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ 
                borderRadius: '10px', 
                minWidth: '100px', 
                padding: '6px 12px', 
                fontSize: '0.85rem',
                background: returnMode === 'supplier' ? 'var(--accent)' : 'transparent' 
              }}
              onClick={() => {
                setReturnMode('supplier');
              }}
            >
              <History size={14} />
              Supplier
            </button>
          </div>

          <button onClick={handleNewReturnClick} className="btn btn-primary cluster gap-2 glow-on-hover" style={{ height: '36px', borderRadius: '10px', fontSize: '0.85rem', padding: '0 16px' }}>
            <Plus size={16} /> New Return
          </button>
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      {(() => {
        const modeReturns = returns.filter(r => r.type === returnMode);
        return (
          <div className="metric-grid">
            <div className="panel glass-panel metric-card animate-fade">
              <div className="between align-center">
                <span className="eyebrow muted">Total Returns</span>
                <div className="metric-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}>
                  <RotateCcw size={20} />
                </div>
              </div>
              <div className="stack gap-1">
                <h2 className="metric-value">{modeReturns.length}</h2>
                <span className="muted small">Processed ledger items</span>
              </div>
            </div>

            <div className="panel glass-panel metric-card animate-fade" style={{ background: 'linear-gradient(135deg, var(--accent-soft), transparent)' }}>
              <div className="between align-center">
                <span className="eyebrow muted">Total Refunded</span>
                <div className="metric-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}>
                  <FileText size={20} />
                </div>
              </div>
              <div className="stack gap-1">
                <h2 className="metric-value" style={{ color: 'var(--accent-strong)' }}>
                  {formatCurrency(modeReturns.reduce((sum, r) => sum + r.totalAmount, 0))}
                </h2>
                <span className="muted small">Reversed institutional capital</span>
              </div>
            </div>

            <div className="panel glass-panel metric-card animate-fade">
              <div className="between align-center">
                <span className="eyebrow muted">Avg. Return Value</span>
                <div className="metric-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}>
                  <Boxes size={20} />
                </div>
              </div>
              <div className="stack gap-1">
                <h2 className="metric-value">
                  {formatCurrency(modeReturns.length ? (modeReturns.reduce((sum, r) => sum + r.totalAmount, 0) / modeReturns.length) : 0)}
                </h2>
                <span className="muted small">Average cost per reversal</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Advanced Search & Date Filter Panel */}
      <div className="panel glass-panel stack gap-4 p-4 overflow-hidden" style={{ borderLeft: '4px solid var(--accent)', borderRadius: '16px' }}>
        <div className="grid-12 gap-4 align-center wrap-row">
          <div className="grid-colspan-6 stack gap-1">
            <span className="muted small font-bold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Search Query</span>
            <div className="input-shell compact" style={{ background: 'var(--bg-soft)', borderRadius: '10px', height: '38px', padding: '0 12px' }}>
              <Search size={16} className="muted" />
              <input 
                type="text" 
                placeholder={
                  searchMethod === 'returnNo' ? 'Search by return number (e.g. RET...)' :
                  searchMethod === 'entityName' ? 'Search by customer/supplier name...' :
                  searchMethod === 'referenceNo' ? 'Search by original invoice/reference...' :
                  'Search returns by No, Entity or Ref...'
                } 
                className="ghost-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: '0.85rem', color: 'var(--text)' }}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="icon-btn ghost hover-danger"
                  style={{ width: '20px', height: '20px', border: 'none', background: 'transparent', display: 'grid', placeItems: 'center' }}
                  title="Clear Search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="grid-colspan-3 stack gap-1">
            <span className="muted small font-bold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Search Method</span>
            <select
              value={searchMethod}
              onChange={e => setSearchMethod(e.target.value)}
              style={{
                height: '38px',
                borderRadius: '10px',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                padding: '0 12px',
                color: 'var(--text)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <option value="all">🔍 Search All Fields</option>
              <option value="returnNo">🎫 Return Number</option>
              <option value="entityName">👤 Contact / Entity Name</option>
              <option value="referenceNo">📄 Reference Invoice No</option>
            </select>
          </div>

          <div className="grid-colspan-3 stack gap-1">
            <span className="muted small font-bold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Date Quick Presets</span>
            <div className="cluster gap-1" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '10px', padding: '2px', height: '38px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'today', label: 'Today' },
                { id: '7days', label: '7 Days' },
                { id: '30days', label: '30 Days' }
              ].map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setDateFilterPreset(preset.id);
                    if (preset.id !== 'custom') {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                  className={`btn sm ${dateFilterPreset === preset.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    height: '100%',
                    background: dateFilterPreset === preset.id ? 'var(--accent)' : 'transparent',
                    color: dateFilterPreset === preset.id ? 'white' : 'var(--text-soft)'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range Selectors */}
        <div className="between wrap-row gap-4 pt-2" style={{ borderTop: '1px dashed var(--border)' }}>
          <div className="cluster gap-3 wrap-row">
            <div className="cluster gap-2">
              <Calendar size={16} className="accent-text" />
              <span className="muted small font-bold">Custom Date Range:</span>
            </div>
            
            <div className="cluster gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDateFilterPreset('custom');
                }}
                style={{
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--bg-soft)',
                  border: '1px solid var(--border)',
                  padding: '0 10px',
                  color: 'var(--text)',
                  fontSize: '0.8rem'
                }}
              />
              <span className="muted small">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDateFilterPreset('custom');
                }}
                style={{
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--bg-soft)',
                  border: '1px solid var(--border)',
                  padding: '0 10px',
                  color: 'var(--text)',
                  fontSize: '0.8rem'
                }}
              />
            </div>
          </div>

          {(search || startDate || endDate || dateFilterPreset !== 'all' || searchMethod !== 'all') && (
            <button 
              onClick={() => {
                setSearch('');
                setSearchMethod('all');
                setStartDate('');
                setEndDate('');
                setDateFilterPreset('all');
              }}
              className="btn btn-ghost cluster gap-1 text-danger hover-danger"
              style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              <XCircle size={14} /> Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table Panel */}
      <div className="panel glass-panel p-0 overflow-hidden stack gap-3">
        <div className="overflow-auto">
          <table className="w-full professional-table density-compact">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Return No</th>
                <th>Date</th>
                <th>Entity</th>
                <th>Reference</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th className="text-center" style={{ paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center p-12 muted">Loading institutional ledger...</td></tr>
              ) : filteredReturns.length === 0 ? (
                <tr><td colSpan="8" className="text-center p-12 muted">No returns found matching your query.</td></tr>
              ) : paginatedReturns.map((ret) => (
                <tr key={ret._id} className="table-row-hover">
                  <td style={{ paddingLeft: '24px' }}><strong className="accent-text" style={{ fontFamily: 'var(--font-mono)' }}>{ret.returnNo}</strong></td>
                  <td className="muted">{formatDate(ret.createdAt)}</td>
                  <td>
                    <div className="cluster gap-2">
                      <div className="avatar" style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        background: 'var(--accent-soft)', 
                        color: 'var(--accent-strong)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase'
                      }}>
                        {ret.entityName?.[0] || '?'}
                      </div>
                      <span className="font-bold">{ret.entityName || 'Walk-in Customer'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="muted small font-bold" style={{ background: 'var(--bg-soft)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      {ret.referenceNo || 'N/A'}
                    </span>
                  </td>
                  <td className="text-right font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                    -{formatCurrency(ret.totalAmount)}
                  </td>
                  <td>
                    {ret.status === 'completed' ? (
                      <span className="pill success-soft cluster gap-1" style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px' }}>
                        <CheckCircle2 size={12} /> {ret.status.toUpperCase()}
                      </span>
                    ) : ret.status === 'cancelled' ? (
                      <span className="pill danger-soft cluster gap-1" style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px' }}>
                        {ret.status.toUpperCase()}
                      </span>
                    ) : (
                      <span className="pill warning-soft cluster gap-1" style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px' }}>
                        {ret.status.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`pill ${ret.paymentStatus === 'paid' ? 'success' : 'warning-soft'} small`} style={{ textTransform: 'uppercase' }}>
                      {ret.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                    </span>
                  </td>
                  <td className="text-center" style={{ paddingRight: '24px' }}>
                    <div className="cluster gap-2 justify-end">
                      {ret.type === 'supplier' && ret.entityId && ret.paymentStatus !== 'paid' && (
                        <button 
                          className="icon-btn ghost hover-accent" 
                          title="Settle Return" 
                          onClick={() => setSettlingReturn(ret)}
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedReturn(ret)}
                        className="icon-btn ghost hover-accent" 
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredReturns.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {selectedReturn && (
        <div className="modal-overlay animate-fade" style={{ position: 'fixed', inset: 0, backdropFilter: 'blur(12px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.4)' }}>
          <div className="panel glass-panel p-6 animate-slide" style={{ width: '100%', maxWidth: '650px', background: 'var(--panel-strong)', borderRadius: '24px', boxShadow: 'var(--shadow-xl)' }}>
            <div className="between align-center mb-6">
              <div className="stack gap-1">
                <span className="eyebrow">Return Information</span>
                <h2 className="font-bold">{selectedReturn.returnNo}</h2>
              </div>
              <button 
                onClick={() => setSelectedReturn(null)}
                className="icon-btn ghost hover-danger"
                style={{ borderRadius: '50%', width: '36px', height: '36px', display: 'grid', placeItems: 'center' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="grid cols-2 gap-4 mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
              <div>
                <span className="muted small font-bold block mb-1">Return Type</span>
                <span className="font-bold" style={{ textTransform: 'capitalize' }}>{selectedReturn.type} Return</span>
              </div>
              <div>
                <span className="muted small font-bold block mb-1">Date & Time</span>
                <span className="font-bold">{formatDate(selectedReturn.createdAt)}</span>
              </div>
              <div>
                <span className="muted small font-bold block mb-1">{selectedReturn.type === 'customer' ? 'Customer' : 'Supplier'}</span>
                <span className="font-bold">{selectedReturn.entityName}</span>
              </div>
              <div>
                <span className="muted small font-bold block mb-1">Reference Invoice</span>
                <span className="font-bold">{selectedReturn.referenceNo || 'N/A'}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span className="muted small font-bold block mb-1">Reason</span>
                <p className="font-medium" style={{ fontSize: '0.9rem' }}>{selectedReturn.reason || 'No reason specified'}</p>
              </div>
            </div>

            <h4 className="font-bold mb-3 cluster gap-2"><Boxes size={18} /> Returned Products</h4>
            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-soft)', marginBottom: '24px' }}>
              <table className="professional-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--panel)' }}>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                    <th className="text-right" style={{ width: '120px' }}>Unit Price</th>
                    <th className="text-right" style={{ width: '120px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReturn.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="font-bold">{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td className="text-right" style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-strong)' }}>{formatCurrency(item.total || (item.quantity * item.unitPrice))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="between align-center p-4 rounded-xl" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
              <div>
                <span className="muted small font-bold">Refund Method</span>
                <div className="font-bold" style={{ textTransform: 'uppercase', fontSize: '0.9rem', marginTop: '2px' }}>{selectedReturn.refundMethod?.replace('-', ' ')}</div>
              </div>
              <div className="text-right">
                <span className="muted small font-bold">Total Refunded</span>
                <div className="accent-text font-bold" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)' }}>{formatCurrency(selectedReturn.totalAmount)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {settlingReturn && (
        <div className="modal-overlay animate-fade" style={{ position: 'fixed', inset: 0, backdropFilter: 'blur(12px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.4)' }}>
          <div className="panel glass-panel p-6 animate-slide" style={{ width: '100%', maxWidth: '400px', background: 'var(--panel-strong)', borderRadius: '24px', boxShadow: 'var(--shadow-xl)' }}>
            <div className="between align-center mb-6">
              <h3 className="font-bold">Settle Return</h3>
              <button onClick={() => setSettlingReturn(null)} className="icon-btn ghost hover-danger">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="stack gap-4 mb-6">
              <p className="muted small">Are you sure you want to mark this return as fully settled by the supplier?</p>
              
              <div className="card p-3 stack gap-2" style={{ background: 'var(--bg-soft)', borderRadius: '12px' }}>
                <div className="between">
                  <span className="muted small">Return No</span>
                  <span className="font-mono font-bold">{settlingReturn.returnNo}</span>
                </div>
                <div className="between">
                  <span className="muted small">Supplier</span>
                  <span className="font-bold">{settlingReturn.entityName}</span>
                </div>
                <div className="between pt-2 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="muted small">Settlement Amount</span>
                  <span className="font-mono font-bold accent-text">{formatCurrency(settlingReturn.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="cluster gap-3 end">
              <button className="btn btn-ghost" onClick={() => setSettlingReturn(null)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSettle}
                disabled={settling}
              >
                {settling ? 'Settling...' : 'Confirm Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
