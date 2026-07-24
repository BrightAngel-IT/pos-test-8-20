import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  ArrowRight
} from 'lucide-react'
import { SectionHeading } from '../../components/SectionHeading'
import { authConfig } from '../../utils'

/**
 * Module: Branches
 * 
 * React UI page component representing the Branches view.
 */

export function BranchManagement({ api, session }) {
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [users, setUsers] = useState([])

  const [form, setForm] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    manager: '',
    status: 'active'
  })

  useEffect(() => {
    fetchBranches()
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await api.get('/users', authConfig(session.token))
      setUsers(res.data)
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  async function fetchBranches() {
    try {
      setLoading(true)
      const res = await api.get('/branches', authConfig(session.token))
      setBranches(res.data)
    } catch (err) {
      console.error('Error fetching branches:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRegister = () => {
    setEditingBranch(null)
    setForm({
      name: '',
      location: '',
      phone: '',
      email: '',
      manager: '',
      status: 'active'
    })
    setShowModal(true)
  }

  const handleOpenEdit = (branch, e) => {
    e.stopPropagation() // Don't trigger card navigation
    setEditingBranch(branch)
    setForm({
      name: branch.name,
      location: branch.location || '',
      phone: branch.phone || '',
      email: branch.email || '',
      manager: branch.manager || '',
      status: branch.status || 'active'
    })
    setShowModal(true)
  }

  const handleDelete = async (branchId, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this branch? All associated stock configurations will be deleted.')) {
      return
    }
    try {
      await api.delete(`/branches/${branchId}`, authConfig(session.token))
      fetchBranches()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete branch')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch._id}`, form, authConfig(session.token))
      } else {
        await api.post('/branches', form, authConfig(session.token))
      }
      setShowModal(false)
      fetchBranches()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save branch')
    }
  }

  if (loading) {
    return (
      <div className="panel loading-state">
        <div className="spinner" />
        <p>Loading corporate directory...</p>
      </div>
    )
  }

  const availableAdmins = users.filter(u => 
    u.role === 'admin' && 
    !branches.some(b => b.manager === u.name && b._id !== editingBranch?._id)
  )

  return (
    <div className="stack gap-6 animate-fade">
      {/* Header Panel */}
      <div className="between wrap-row panel p-6 glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
        <div className="cluster gap-4">
          <div className="icon-btn" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', width: '48px', height: '48px' }}>
            <Building2 size={24} />
          </div>
          <div>
            <SectionHeading
              title="Branches Console"
              text="Manage physical terminals, inventory partitions, and locations."
            />
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ borderRadius: '14px', padding: '12px 24px' }}
          onClick={handleOpenRegister}
        >
          <Plus size={18} />
          Register New Branch
        </button>
      </div>

      {/* Grid of branches */}
      <div className="grid-2 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {branches.map((branch) => (
          <div
            key={branch._id}
            className="panel p-5 stack gap-4 glass-panel glow-on-hover cursor-pointer"
            style={{ borderRadius: '20px', border: '1px solid var(--border)' }}
            onClick={() => navigate(`/super-admin/branches/${encodeURIComponent(branch.name)}`)}
          >
            <div className="between align-center">
              <div className="cluster gap-2">
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent-strong)',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{branch.name}</h3>
                  <span className={`pill ${branch.status === 'active' ? 'success' : 'danger'}`} style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                    {branch.status}
                  </span>
                </div>
              </div>

              <div className="cluster gap-2">
                <button
                  className="icon-btn small"
                  style={{ background: 'var(--bg-soft)', border: 'none' }}
                  onClick={(e) => handleOpenEdit(branch, e)}
                  title="Modify details"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="icon-btn small"
                  style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: 'none' }}
                  onClick={(e) => handleDelete(branch._id, e)}
                  title="Delete branch"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="stack gap-2 muted small" style={{ fontSize: '0.85rem' }}>
              <div className="cluster gap-2 align-center">
                <MapPin size={14} />
                <span>{branch.location || 'No location set'}</span>
              </div>
              <div className="cluster gap-2 align-center">
                <Phone size={14} />
                <span>{branch.phone || 'No phone set'}</span>
              </div>
              <div className="cluster gap-2 align-center">
                <Mail size={14} />
                <span>{branch.email || 'No email set'}</span>
              </div>
              <div className="cluster gap-2 align-center">
                <User size={14} />
                <span>Manager: <strong>{branch.manager || 'Unassigned'}</strong></span>
              </div>
            </div>

            <div className="between align-center pt-3" style={{ borderTop: '1px solid var(--border)', marginTop: '4px' }}>
              <span className="accent-text font-bold small cluster gap-1 align-center">
                Access Branch Operations
                <ArrowRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Register/Edit Modal */}
      {showModal && (
        <div className="modal-overlay animate-fade" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 100 }}>
          <div className="panel p-6 stack gap-5 glass-panel animate-scale" style={{ width: '480px', borderRadius: '24px', background: 'var(--panel-strong)' }}>
            <div className="between align-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{editingBranch ? 'Modify Branch Info' : 'Register New Branch'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="stack gap-4">
              <label className="field">
                <span>Branch Identifier Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin1, Counter 02"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!!editingBranch} // Keep name locked once registered to avoid broken schema mapping
                />
              </label>

              <label className="field">
                <span>Location Address</span>
                <input
                  type="text"
                  placeholder="e.g. 123 Galle Rd, Colombo 03"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </label>

              <div className="grid-2 gap-4">
                <label className="field">
                  <span>Telephone Contact</span>
                  <input
                    type="text"
                    placeholder="e.g. +94 11 234 5678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Corporate Email</span>
                  <input
                    type="email"
                    placeholder="e.g. branch1@nilma.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </label>
              </div>

              <div className="grid-2 gap-4">
                <label className="field">
                  <span>Assigned Manager</span>
                  <select
                    value={form.manager}
                    onChange={(e) => setForm({ ...form, manager: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {availableAdmins.map(admin => (
                      <option key={admin._id} value={admin.name}>{admin.name}</option>
                    ))}
                    {form.manager && !availableAdmins.find(a => a.name === form.manager) && (
                      <option value={form.manager}>{form.manager} (Current)</option>
                    )}
                  </select>
                </label>
                <label className="field">
                  <span>Operating Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="cluster gap-3 end mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBranch ? 'Save Changes' : 'Register Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
