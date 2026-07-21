import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react'
import { SectionHeading } from '../../components/SectionHeading'
import { authConfig, readErrorMessage } from '../../utils'
import { Pagination } from '../../components/Pagination'

export default function Suppliers({ api, session, onNotice }) {
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    category: ''
  })

  const [branches, setBranches] = useState([])
  const [activeBranch, setActiveBranch] = useState('All')
  
  useEffect(() => {
    fetchSuppliers()
    fetchBranches()
  }, [])

  async function fetchBranches() {
    try {
      const res = await api.get('/branches', authConfig(session.token))
      setBranches(res.data || [])
    } catch (err) {
      console.error('Failed to load branches', err)
    }
  }

  async function fetchSuppliers() {
    setLoading(true)
    try {
      const response = await api.get('/suppliers', authConfig(session.token))
      setSuppliers(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to fetch suppliers.' })
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(sup) {
    setEditingId(sup._id)
    setFormData({
      name: sup.name,
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
      category: sup.category || '',
      branch: sup.branch || ''
    })
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this supplier?')) return
    try {
      await api.delete(`/suppliers/${id}`, authConfig(session.token))
      onNotice({ type: 'success', text: 'Supplier removed.' })
      fetchSuppliers()
    } catch (err) {
      onNotice({ type: 'error', text: readErrorMessage(err) })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editingId) {
        await api.patch(`/suppliers/${editingId}`, formData, authConfig(session.token))
        onNotice({ type: 'success', text: 'Supplier updated.' })
      } else {
        await api.post('/suppliers', formData, authConfig(session.token))
        onNotice({ type: 'success', text: 'Supplier registered.' })
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({ name: '', email: '', phone: '', address: '', category: '', branch: '' })
      fetchSuppliers()
    } catch (err) {
      onNotice({ type: 'error', text: readErrorMessage(err) })
    }
  }
  const filtered = suppliers.filter(s => {
    const searchMatch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        (s.category || '').toLowerCase().includes(search.toLowerCase())
    const branchMatch = activeBranch === 'All' || s.branch === activeBranch
    return searchMatch && branchMatch
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeBranch])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedSuppliers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="stack gap-6 animate-fade">
      <div className="between wrap-row panel p-6 glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
        <div className="cluster gap-4">
          <div className="icon-btn" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none' }}>
            <Users size={24} />
          </div>
          <SectionHeading
            title="Supplier Network"
            text="Manage procurement partners and supply chain sources."
          />
        </div>
        <button className="btn btn-primary glow-on-hover" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {showForm && (
        <div className="panel p-8 glass-panel animate-fade relative">
          <button className="icon-btn ghost absolute top-4 right-4" onClick={() => { setShowForm(false); setEditingId(null); }}>
            <X size={20} />
          </button>
          <form onSubmit={handleSubmit} className="stack gap-6">
            <h3 className="accent-text">{editingId ? 'Edit Partner Details' : 'Register New Partner'}</h3>
            <div className="grid-2 gap-6">
              <label className="field">
                <span>Company Name</span>
                <input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Global Tech Solutions" />
              </label>
              <label className="field">
                <span>Supply Category</span>
                <input className="input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Electronics, Furniture" />
              </label>
              <label className="field">
                <span>Email Address</span>
                <input className="input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="partner@company.com" />
              </label>
              <label className="field">
                <span>Phone Number</span>
                <input className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 890" />
              </label>
              <label className="field">
                <span>Branch Location</span>
                <select className="input" value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })}>
                  <option value="">Global / Unassigned</option>
                  {branches.map(b => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Business Address</span>
              <textarea className="input" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Warehouse 42, Silicon Valley..." />
            </label>
            <button className="btn btn-primary w-full" type="submit">
              {editingId ? 'Update Partner' : 'Confirm Registration'}
            </button>
          </form>
        </div>
      )}

      <div className="panel glass-panel stack gap-4">
        <div className="p-6 pb-0 flex wrap-row gap-4">
          <div className="input-shell compact" style={{ flex: 1, minWidth: '300px' }}>
            <Search size={18} className="muted" />
            <input className="ghost-input" placeholder="Search partners by name or category..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <select className="input compact" style={{ width: '200px' }} value={activeBranch} onChange={e => setActiveBranch(e.target.value)}>
              <option value="All">All Branches</option>
              {branches.map(b => (
                <option key={b._id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full professional-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Company Details</th>
                <th>Category</th>
                <th>Contact Info</th>
                <th>Address</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSuppliers.map((sup) => (
                <tr key={sup._id} className="table-row-hover">
                  <td style={{ paddingLeft: '24px' }}>
                    <div className="stack">
                      <strong className="font-strong">{sup.name}</strong>
                      <span className="muted x-small">ID: {sup._id.slice(-6)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="stack gap-1">
                      <span className="pill neutral small">{sup.category || 'General'}</span>
                      {sup.branch && <span className="muted x-small">Branch: {sup.branch}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="stack gap-1">
                      <div className="cluster gap-2 muted small">
                        <Mail size={12} /> {sup.email || 'N/A'}
                      </div>
                      <div className="cluster gap-2 muted small">
                        <Phone size={12} /> {sup.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cluster gap-2 muted small">
                      <MapPin size={14} />
                      <span style={{ maxWidth: '200px' }} className="truncate">{sup.address || 'No address set'}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <div className="cluster gap-2 justify-end">
                      <button className="icon-btn ghost hover-accent" title="Settlements" onClick={() => navigate('/payments', { state: { mode: 'supplier', entityId: sup._id } })}><DollarSign size={16} /></button>
                      <button className="icon-btn ghost hover-accent" title="Statement of Account" onClick={() => navigate(`/accounts/supplier/${sup._id}`)}><FileText size={16} /></button>
                      <button className="icon-btn ghost hover-accent" onClick={() => handleEdit(sup)}><Edit size={16} /></button>
                      <button className="icon-btn ghost hover-danger" onClick={() => handleDelete(sup._id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div className="p-12 text-center muted stack align-center gap-4">
              <AlertCircle size={48} opacity={0.2} />
              <p>No procurement partners found.</p>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  )
}
