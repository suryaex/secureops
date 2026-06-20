import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n'
import api from '../api/client'

const AVATAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500']

const initialForm = { username: '', email: '', password: '', confirm: '', role: 'auditor' }

export default function Users() {
  const { t } = useI18n()
  const { user: me } = useAuth()
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(initialForm)
  const [showPw, setShowPw]     = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [pwModal, setPwModal]   = useState(null) // { id, username }

  const isAdmin = me?.role === 'admin'

  const fetchUsers = () => {
    setLoading(true)
    api.get('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (isAdmin) fetchUsers() }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="card p-10 text-center">
        <span className="material-symbols-outlined text-6xl text-warning" style={{fontVariationSettings:"'FILL' 1"}}>lock</span>
        <h2 className="text-xl font-bold text-gray-800 mt-3">{t('users.adminRequired')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('users.adminRequiredDesc', { admin: 'admin' })}</p>
        <p className="text-gray-400 text-xs mt-1">{t('users.signedInAs', { name: me?.username, role: me?.role })}</p>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (form.password !== form.confirm) { setError(t('users.passNoMatch')); return }
    if (form.password.length < 6) { setError(t('users.passMin')); return }

    setCreating(true)
    try {
      await api.post('/users', {
        username: form.username.trim(),
        email:    form.email.trim() || null,
        password: form.password,
        role:     form.role,
      })
      setSuccess(t('users.createdOk', { name: form.username }))
      setForm(initialForm)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.detail || t('users.createFailed'))
    } finally {
      setCreating(false)
    }
  }

  const updateRole = async (id, role) => {
    try {
      await api.patch(`/users/${id}/role`, { role })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || t('users.updateRoleFailed'))
    }
  }

  const remove = async (u) => {
    if (!confirm(t('users.deleteConfirm', { name: u.username }))) return
    try {
      await api.delete(`/users/${u.id}`)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || t('users.deleteFailed'))
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{t('users.subtitle')}</p>
      </div>

      <div className="card p-4 border-l-4 border-blue-400 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-500 text-xl mt-0.5">info</span>
        <div className="text-sm">
          <p className="text-gray-800 font-medium">{t('users.twoKinds')}</p>
          <p className="text-gray-500 mt-0.5">
            {t('users.twoKindsDesc', { pam: 'Linux PAM', useradd: 'useradd', passwd: 'passwd', db: 'DB' })}
          </p>
        </div>
      </div>

      {/* Create form */}
      <div className="card p-5">
        <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">person_add</span>
          {t('users.addNew')}
        </h3>

        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-danger-light border border-danger-border rounded-xl">
            <span className="material-symbols-outlined text-danger text-base">error</span>
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-success-light border border-success-border rounded-xl">
            <span className="material-symbols-outlined text-success text-base">check_circle</span>
            <p className="text-success text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t('users.username')} required>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder={t('users.usernamePh')}
              autoComplete="off"
              spellCheck="false"
              minLength={3}
              required
              className="input"
            />
          </Field>

          <Field label={t('users.emailOpt')}>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="alice@polsri.ac.id"
              className="input"
            />
          </Field>

          <Field label={t('users.password')} required>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={t('users.passwordPh')}
                minLength={6}
                required
                className="input pr-11"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-lg">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </Field>

          <Field label={t('users.confirmPw')} required>
            <input
              type={showPw ? 'text' : 'password'}
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder={t('users.confirmPwPh')}
              required
              className="input"
            />
          </Field>

          <Field label={t('users.role')} required>
            <div className="flex gap-2">
              {['admin', 'auditor'].map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    form.role === r
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-base align-middle mr-1">
                    {r === 'admin' ? 'admin_panel_settings' : 'visibility'}
                  </span>
                  {r === 'admin' ? t('users.admin') : t('users.auditor')}
                </button>
              ))}
            </div>
          </Field>

          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t('users.creating')}</>
              ) : (
                <><span className="material-symbols-outlined text-lg">add</span>{t('users.createUser')}</>
              )}
            </button>
            <button type="button" onClick={() => { setForm(initialForm); setError(''); setSuccess('') }} className="btn-ghost">
              {t('users.reset')}
            </button>
          </div>
        </form>
      </div>

      {/* Users list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-gray-800 font-semibold">{t('users.allUsers', { n: users.length })}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>{[t('users.colUser'), t('users.colEmail'), t('users.colRole'), t('users.colSource'), t('users.colCreated'), t('users.colLastLogin'), t('users.colActions')].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <span className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">{t('users.noUsers')}</td></tr>
              ) : users.map((u, i) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`avatar ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium text-sm">{u.username}</p>
                        {u.id === me?.id && <p className="text-xs text-primary">{t('users.you')}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-500 text-xs">{u.email || '—'}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => updateRole(u.id, e.target.value)}
                      disabled={u.id === me?.id}
                      className={`px-2 py-1 rounded-md text-xs font-medium border ${
                        u.role === 'admin'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      } ${u.id === me?.id ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <option value="admin">{t('users.admin')}</option>
                      <option value="auditor">{t('users.auditor')}</option>
                    </select>
                  </td>
                  <td>
                    {u.is_linux_pam ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                        <span className="material-symbols-outlined text-sm">terminal</span>
                        Linux PAM
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                        <span className="material-symbols-outlined text-sm">database</span>
                        DB
                      </span>
                    )}
                  </td>
                  <td className="text-gray-400 text-xs whitespace-nowrap">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="text-gray-400 text-xs whitespace-nowrap">
                    {u.last_login ? new Date(u.last_login).toLocaleString() : t('users.never')}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPwModal({ id: u.id, username: u.username, is_pam: u.is_linux_pam })}
                        title={t('users.titleResetPw')}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">key</span>
                      </button>
                      <button
                        onClick={() => remove(u)}
                        disabled={u.id === me?.id || u.is_linux_pam}
                        title={u.is_linux_pam ? t('users.titleManageOs') : u.id === me?.id ? t('users.titleCannotSelf') : t('users.titleDelete')}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pwModal && (
        <PasswordModal
          target={pwModal}
          onClose={() => setPwModal(null)}
          onSaved={() => { setPwModal(null); fetchUsers() }}
        />
      )}
    </div>
  )
}

const Field = ({ label, required, children }) => (
  <div>
    <label className="text-gray-700 text-xs font-semibold mb-1.5 block uppercase tracking-wider">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    {children}
  </div>
)

function PasswordModal({ target, onClose, onSaved }) {
  const { t } = useI18n()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (pw !== confirm) { setErr(t('users.passNoMatch')); return }
    if (pw.length < 6) { setErr(t('users.passMin')); return }
    setBusy(true)
    try {
      await api.patch(`/users/${target.id}/password`, { password: pw })
      onSaved()
    } catch (e2) {
      setErr(e2.response?.data?.detail || t('users.resetPwFailed'))
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-gray-800 font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">key</span>
            {t('users.resetPwTitle', { name: target.username })}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {target.is_pam ? (
          <div className="p-6">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
              <span className="material-symbols-outlined text-yellow-600 mt-0.5">warning</span>
              <div className="text-yellow-800">
                <p className="font-medium mb-1">{t('users.pamTitle')}</p>
                <p>{t('users.pamDesc')}</p>
                <pre className="bg-yellow-100/60 px-3 py-2 rounded-lg mt-2 font-mono text-xs">sudo passwd {target.username}</pre>
              </div>
            </div>
            <button onClick={onClose} className="btn-secondary mt-4 w-full justify-center">{t('users.close')}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            {err && <p className="text-danger text-sm px-3 py-2 bg-danger-light border border-danger-border rounded-lg">{err}</p>}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">{t('users.newPassword')}</label>
              <input type="password" value={pw} onChange={e => setPw(e.target.value)} required minLength={6} className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">{t('users.confirmPassword')}</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="input" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center">
                {busy ? t('users.saving') : t('users.savePassword')}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">{t('users.cancel')}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
