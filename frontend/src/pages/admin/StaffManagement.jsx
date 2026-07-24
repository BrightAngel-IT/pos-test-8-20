/**
 * Module: StaffManagement
 * 
 * React UI page component representing the StaffManagement view.
 */

import React, { useEffect, useState } from 'react'
import {
  Users,
  User,
  Plus,
  Search,
  Mail,
  Shield,
  MapPin,
  Edit,
  Trash2,
  UserCheck,
  AlertCircle,
  MoreVertical,
  Filter,
  Download,
  Building
} from 'lucide-react'
import { SectionHeading } from '../../components/SectionHeading'
import { useNavigate } from 'react-router-dom'
import { authConfig, readErrorMessage } from '../../utils'
import { Pagination } from '../../components/Pagination'

export default function StaffManagement({ api, session, onNotice, setEditingStaff }) {
  const navigate = useNavigate()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchStaff()
  }, [])

  async function fetchStaff() {
    setLoading(true)
    try {
      const response = await api.get('/users', authConfig(session.token))
      setStaff(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      onNotice({ type: 'error', text: 'Authorization sync failed. Check connection.' })
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(member) {
    setEditingStaff(member)
    navigate('/staff-form')
  }

  function handleAdd() {
    setEditingStaff(null)
    navigate('/staff-form')
  }

  async function handleDelete(id) {
    if (id === session.user._id) {
      onNotice({ type: 'error', text: 'Self-deletion protocol blocked by security.' })
      return
    }
    if (!window.confirm('CRITICAL: Permanent removal of staff access. Confirm identity de-authorization?')) return
    try {
      await api.delete(`/users/${id}`, authConfig(session.token))
      onNotice({ type: 'success', text: 'Personnel de-authorized successfully.' })
      fetchStaff()
    } catch (err) {
      onNotice({ type: 'error', text: readErrorMessage(err) })
    }
  }
  const filtered = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || s.role === roleFilter
    return matchesSearch && matchesRole
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedStaff = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="stack gap-6 animate-fade">
      {/* Header Section */}
      <div className="between wrap-row panel p-6 glass-panel" style={{ borderLeft: '4px solid var(--accent)' }}>
        {/* Background Accent */}
        <div className="cluster gap-6 relative z-10">
          <div className="icon-btn large accent-glow" style={{ width: '64px', height: '64px', background: 'var(--accent-soft)', color: 'var(--accent-strong)', border: 'none' }}>
            <Users size={32} />
          </div>
          <div>
            <SectionHeading
              title="Identity & Access Management"
              text="Centralized control over system operatives, security roles, and branch permissions."
            />
            <div className="cluster gap-4 mt-2">
              <span className="pill small success-soft cluster gap-1">
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div>
                {staff.length} Active Accounts
              </span>
              <span className="pill small accent-soft">Enterprise Shield Enabled</span>
            </div>
          </div>
        </div>

        <div className="cluster gap-3 relative z-10">
          <button className="btn btn-secondary cluster gap-2" onClick={() => onNotice({ type: 'info', text: 'Access log export coming soon.' })}>
            <Download size={18} />
            Export Logs
          </button>
          <button className="btn btn-primary glow-on-hover cluster gap-2" onClick={handleAdd}>
            <Plus size={18} />
            Onboard Personnel
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="panel glass-panel p-4 between wrap-row gap-4">
        <div className="cluster gap-4 flex-1">
          <div className="input-shell shadow-inner" style={{ maxWidth: '350px', background: 'var(--bg-soft)' }}>
            <Search size={18} className="muted" />
            <input
              className="ghost-input"
              placeholder="Search by name, identity, or username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="cluster gap-2 muted small">
            <Filter size={16} />
            <select
              className="ghost-input font-bold cursor-pointer"
              style={{ background: 'transparent', border: 'none', color: 'inherit' }}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="cashier">Operatives</option>
            </select>
          </div>
        </div>

        <div className="cluster gap-2 muted x-small uppercase tracking-widest font-bold">
          <span>Security Level:</span>
          <span className="success-text">Operational</span>
        </div>
      </div>

      {/* Main List */}
      <div className="panel glass-panel overflow-hidden border-glow-soft">
        <table className="w-full professional-table">
          <thead style={{ background: 'var(--bg-soft)' }}>
            <tr>
              <th style={{ paddingLeft: '32px' }}>Personnel Profile</th>
              <th>System Role</th>
              <th>Deployment Branch</th>
              <th>Security Status</th>
              <th style={{ textAlign: 'right', paddingRight: '32px' }}>Access Control</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStaff.map(member => (
              <tr key={member._id} className="table-row-hover transition-all duration-200">
                <td style={{ paddingLeft: '32px', paddingY: '20px' }}>
                  <div className="cluster gap-4">
                    <div className="avatar accent-glow-soft" style={{
                      width: '48px',
                      height: '48px',
                      background: member.role === 'admin' ? 'linear-gradient(135deg, var(--accent), var(--accent-strong))' : 'var(--bg-strong)',
                      color: member.role === 'admin' ? 'white' : 'var(--text)',
                      borderRadius: '14px',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      border: '2px solid var(--border)'
                    }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="stack gap-0">
                      <strong className="font-strong" style={{ fontSize: '1rem' }}>
                        {member.name}
                        {member._id === session.user._id && <span className="pill x-small success ml-2 font-bold uppercase tracking-tighter">Current User</span>}
                      </strong>
                      <span className="muted x-small font-mono cluster gap-1 mt-1">
                        <User size={10} /> {member.username}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={`cluster gap-2 font-bold ${member.role === 'admin' ? 'accent-text' : 'muted'}`}>
                    {member.role === 'admin' ? <Shield size={16} /> : <UserCheck size={16} />}
                    <span className="small tracking-wide">
                      {member.role.toUpperCase()}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="cluster gap-2 muted small">
                    <Building size={14} className="accent-text" />
                    <span>{member.branch || 'Main Operations'}</span>
                  </div>
                </td>
                <td>
                  <div className="cluster gap-2">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                    <span className="x-small font-bold text-success uppercase">Verified</span>
                  </div>
                </td>
                <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                  <div className="cluster gap-1 justify-end">
                    <button
                      className="icon-btn ghost hover-accent p-2"
                      onClick={() => handleEdit(member)}
                      title="Update profile & permissions"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="icon-btn ghost hover-danger p-2"
                      onClick={() => handleDelete(member._id)}
                      disabled={member._id === session.user._id}
                      title={member._id === session.user._id ? "Security override: User cannot de-authorize self" : "Revoke system access"}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button className="icon-btn ghost p-2"><MoreVertical size={18} className="muted" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
        />

        {filtered.length === 0 && !loading && (
          <div className="p-20 text-center muted stack align-center gap-6 animate-fade">
            <div className="icon-btn x-large neutral opacity-20 shadow-none">
              <Users size={64} />
            </div>
            <div className="stack gap-2">
              <h3 className="font-strong" style={{ fontSize: '1.25rem' }}>No operatives matching criteria</h3>
              <p className="small">Adjust your filters or initiate a new onboarding sequence.</p>
            </div>
            <button className="btn btn-secondary small mt-4" onClick={() => { setSearch(''); setRoleFilter('all'); }}>
              Clear Security Filter
            </button>
          </div>
        )}

        {loading && (
          <div className="p-20 text-center stack align-center gap-4">
            <div className="spinner accent" />
            <p className="muted small tracking-widest uppercase">Syncing Security Matrix...</p>
          </div>
        )}
      </div>    
    </div>
  )
}
