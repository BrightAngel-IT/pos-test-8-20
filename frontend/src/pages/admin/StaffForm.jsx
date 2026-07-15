import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Shield, 
  MapPin, 
  Key,
  Info,
  ShieldCheck,
  Building
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authConfig, readErrorMessage } from '../../utils'

export default function StaffForm({ api, session, onNotice, editingStaff, setEditingStaff }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: session.user.role === 'admin' ? 'cashier' : 'cashier',
    branch: session.user.role === 'admin' ? session.user.branch : 'Main Branch'
  })
  const [branches, setBranches] = useState([])

  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await api.get('/branches', authConfig(session.token))
        setBranches(res.data || [])
      } catch (err) {
        console.error('Failed to load branches', err)
      }
    }
    if (session.user.role === 'super_admin') {
      fetchBranches()
    }
  }, [api, session])

  useEffect(() => {
    if (editingStaff) {
      setFormData({
        name: editingStaff.name,
        username: editingStaff.username || '',
        password: '', // Password is empty for editing unless changed
        role: editingStaff.role || 'cashier',
        branch: editingStaff.branch || 'Main Branch'
      })
    }
  }, [editingStaff])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...formData }
      if (payload.role === 'admin') {
        payload.branch = 'Unassigned'
      }

      if (editingStaff) {
        payload._id = editingStaff._id
        if (!payload.password) delete payload.password 
      }

      await api.post('/users', payload, authConfig(session.token))
      onNotice({ 
        type: 'success', 
        text: editingStaff ? 'Security profile updated successfully.' : 'New operative successfully onboarded.' 
      })
      
      handleBack()
    } catch (err) {
      onNotice({ type: 'error', text: readErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setEditingStaff(null)
    navigate('/staff')
  }

  return (
    <div className="stack gap-8 animate-fade max-w-5xl mx-auto py-8">
      <div className="between wrap-row panel p-8 glass-panel border-glow">
        <div className="cluster gap-4">
          <button className="icon-btn ghost hover-accent" onClick={handleBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-strong" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
              {editingStaff ? 'Edit Staff Credentials' : 'Staff Onboarding'}
            </h2>
            <p className="muted small">Configure security access and organizational placement.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid-12 gap-6 items-start">
        {/* Left Column: Basic Info */}
        <div className="grid-colspan-8 stack gap-8">
          <div className="panel p-10 glass-panel stack gap-10">
            <div className="cluster gap-3 mb-2">
              <div className="icon-btn small neutral" style={{ pointerEvents: 'none' }}>
                <Info size={16} />
              </div>
              <h3 className="accent-text uppercase tracking-widest font-bold" style={{ fontSize: '0.75rem' }}>Core Identity</h3>
            </div>

            <div className="grid-2 gap-6">
              <label className="field">
                <span>Full Legal Name</span>
                <div className="input-shell">
                  <User size={18} className="muted" />
                  <input 
                    className="ghost-input" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                    placeholder="e.g. Julian Anderson" 
                  />
                </div>
              </label>

              <label className="field">
                <span>Username</span>
                <div className="input-shell">
                  <User size={18} className="muted" />
                  <input 
                    className="ghost-input" 
                    type="text" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                    required 
                    placeholder="e.g. julian_a" 
                  />
                </div>
              </label>
            </div>

            <div className="grid-2 gap-6">
              <label className={`field ${formData.role === 'admin' ? 'opacity-50' : ''}`}>
                <span>Branch Location</span>
                <div className="input-shell">
                  <Building size={18} className="muted" />
                  {session.user.role === 'super_admin' ? (
                    <select
                      className="ghost-input cursor-pointer"
                      value={formData.role === 'admin' ? '' : formData.branch}
                      onChange={e => setFormData({ ...formData, branch: e.target.value })}
                      disabled={formData.role === 'admin'}
                    >
                      {formData.role === 'admin' ? (
                        <option value="">Unassigned</option>
                      ) : (
                        <>
                          <option value="Main Branch">Main Branch</option>
                          {branches.map(b => (
                            b.name !== 'Main Branch' && <option key={b._id} value={b.name}>{b.name}</option>
                          ))}
                        </>
                      )}
                    </select>
                  ) : (
                    <input 
                      className="ghost-input" 
                      value={formData.branch} 
                      readOnly
                      disabled
                    />
                  )}
                </div>
              </label>

              <label className="field">
                <span>Access Role</span>
                <div className="input-shell">
                  <ShieldCheck size={18} className="muted" />
                  <select 
                    className="ghost-input cursor-pointer" 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    disabled={session.user.role === 'admin'}
                  >
                    <option value="cashier">Standard Operative (Cashier)</option>
                    {session.user.role === 'super_admin' && (
                      <option value="admin">System Administrator</option>
                    )}
                  </select>
                </div>
              </label>
            </div>
          </div>

          <div className="panel p-10 glass-panel stack gap-8 border-warning-soft">
            <div className="cluster gap-3 mb-2">
              <div className="icon-btn small neutral" style={{ pointerEvents: 'none', background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                <Key size={16} />
              </div>
              <h3 className="accent-text uppercase tracking-widest font-bold" style={{ fontSize: '0.75rem' }}>Security Protocol</h3>
            </div>

            <label className="field">
              <span>{editingStaff ? 'Update Password (Leave empty to keep current)' : 'Initialize Password'}</span>
              <div className="input-shell">
                <Key size={18} className="muted" />
                <input 
                  className="ghost-input" 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  required={!editingStaff}
                  placeholder="Minimum 8 characters with symbols recommended" 
                />
              </div>
              <p className="muted x-small mt-2">Passwords are hashed using industry-standard salt-encryption.</p>
            </label>
          </div>
        </div>

        <div className="grid-colspan-4 stack gap-8 sticky top-4">
          <div className="panel p-8 glass-panel stack gap-8 bg-accent-soft">
            <h3 className="font-strong">Onboarding Summary</h3>
            <div className="stack gap-4 py-4 border-y border-border-dashed">
              <div className="between x-small">
                <span className="muted">Role Level:</span>
                <span className="pill accent-soft">{formData.role.toUpperCase()}</span>
              </div>
              <div className="between x-small">
                <span className="muted">Branch:</span>
                <span className="font-bold">{formData.role === 'admin' ? 'Unassigned' : (formData.branch || 'Pending')}</span>
              </div>
              <div className="between x-small">
                <span className="muted">Encryption:</span>
                <span className="success-text font-bold">AES-Ready</span>
              </div>
            </div>
            
            <button 
              className="btn btn-primary w-full shadow-lg" 
              type="submit" 
              disabled={loading}
              style={{ padding: '16px' }}
            >
              {loading ? (
                <div className="spinner small" />
              ) : (
                <div className="cluster gap-2">
                  <Save size={18} />
                  {editingStaff ? 'Update Security File' : 'Complete Registration'}
                </div>
              )}
            </button>
            <button 
              className="btn ghost w-full" 
              type="button" 
              onClick={handleBack}
            >
              Cancel Operation
            </button>
          </div>

          <div className="panel p-6 glass-panel muted x-small stack gap-3" style={{ background: 'var(--bg-soft)' }}>
            <div className="cluster gap-2 font-bold accent-text">
              <Shield size={14} />
              <span>Data Protection Notice</span>
            </div>
            <p>Access logs will be recorded for all administrative changes. Ensure user data follows GDPR/local compliance before final submission.</p>
          </div>
        </div>
      </form>
    </div>
  )
}
