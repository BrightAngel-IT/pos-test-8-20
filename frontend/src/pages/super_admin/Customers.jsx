/**
 * Module: Customers
 * 
 * React UI page component representing the Customers view.
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  X,
  CreditCard,
  History,
  AlertCircle
} from 'lucide-react'
import { SectionHeading } from '../../components/SectionHeading'
import { authConfig, readErrorMessage, formatCurrency } from '../../utils'
import { Pagination } from '../../components/Pagination'

export default function Customers({ api, session, onNotice }) {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
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
    address: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    try {
      const response = await api.get('/customers', authConfig(session.token))
      setCustomers(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to fetch customers.' })
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(cus) {
    setEditingId(cus._id)
    setFormData({
      name: cus.name,
      email: cus.email || '',
      phone: cus.phone || '',
      address: cus.address || ''
    })
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this customer?')) return
    try {
      await api.delete(`/customers/${id}`, authConfig(session.token))
      onNotice({ type: 'success', text: 'Customer removed.' })
      fetchCustomers()
    } catch (err) {
      onNotice({ type: 'error', text: readErrorMessage(err) })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editingId) {
        await api.patch(`/customers/${editingId}`, formData, authConfig(session.token))
        onNotice({ type: 'success', text: 'Customer updated.' })
      } else {
        await api.post('/customers', formData, authConfig(session.token))
        onNotice({ type: 'success', text: 'Customer registered.' })
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({ name: '', email: '', phone: '', address: '' })
      fetchCustomers()
    } catch (err) {
      onNotice({ type: 'error', text: readErrorMessage(err) })
    }
  }
  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedCustomers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="stack gap-6 animate-fade">
      <div className="between wrap-row panel p-6 glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
        <div className="cluster gap-4">
          <div className="icon-btn" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none' }}>
            <UserPlus size={24} />
          </div>
          <SectionHeading
            title="Customer Base"
            text="Manage retail clients, account balances, and profiles."
          />
        </div>
        <button className="btn btn-primary glow-on-hover" onClick={() => setShowForm(true)}>
          <UserPlus size={18} />
          New Customer
        </button>
      </div>

      {showForm && (
        <div className="panel p-8 glass-panel animate-fade relative">
          <button className="icon-btn ghost absolute top-4 right-4" onClick={() => { setShowForm(false); setEditingId(null); }}>
            <X size={20} />
          </button>
          <form onSubmit={handleSubmit} className="stack gap-6">
            <h3 className="success-text">{editingId ? 'Edit Profile' : 'Register Profile'}</h3>
            <div className="grid-2 gap-6">
              <label className="field">
                <span>Customer Name</span>
                <input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. John Doe" />
              </label>
              <label className="field">
                <span>Phone Number</span>
                <input className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 890" />
              </label>
              <label className="field">
                <span>Email Address</span>
                <input className="input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
              </label>
              <label className="field">
                <span>Business Address</span>
                <input className="input" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main St, NY" />
              </label>
            </div>
            <button className="btn btn-primary w-full" type="submit">
              {editingId ? 'Save Changes' : 'Create Profile'}
            </button>
          </form>
        </div>
      )}

      <div className="panel glass-panel stack gap-4">
        <div className="p-6 pb-0">
          <div className="input-shell compact" style={{ maxWidth: '400px' }}>
            <Search size={18} className="muted" />
            <input className="ghost-input" placeholder="Find by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full professional-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Customer Profile</th>
                <th>Contact Details</th>

                <th>Address</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((cus) => (
                <tr key={cus._id} className="table-row-hover">
                  <td style={{ paddingLeft: '24px' }}>
                    <div className="stack">
                      <strong className="font-strong">{cus.name}</strong>
                      <span className="muted x-small">Customer ID: {cus._id.slice(-6)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="stack gap-1">
                      <div className="cluster gap-2 muted small">
                        <Phone size={12} /> {cus.phone || 'No phone'}
                      </div>
                      <div className="cluster gap-2 muted small">
                        <Mail size={12} /> {cus.email || 'No email'}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="cluster gap-2 muted small">
                      <MapPin size={14} />
                      <span className="truncate" style={{ maxWidth: '200px' }}>{cus.address || 'Not specified'}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <div className="cluster gap-2 justify-end">
                      <button className="icon-btn ghost hover-accent" title="Statement of Account" onClick={() => navigate(`/accounts/customer/${cus._id}`)}><History size={16} /></button>
                      <button className="icon-btn ghost hover-accent" onClick={() => handleEdit(cus)}><Edit size={16} /></button>
                      {session.user.role === 'admin' && (
                        <button className="icon-btn ghost hover-danger" onClick={() => handleDelete(cus._id)}><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div className="p-12 text-center muted stack align-center gap-4">
              <AlertCircle size={48} opacity={0.2} />
              <p>No customer records found.</p>
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
