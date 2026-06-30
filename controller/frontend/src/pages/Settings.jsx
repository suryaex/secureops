import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n'
import api, { apiBaseURL, setApiBaseURL } from '../api/client'
import Flag from '../components/Flag'

export default function Settings() {
  const { user } = useAuth()
  const { t, lang, setLang, languages } = useI18n()
  const [health, setHealth] = useState(null)
  const [notif, setNotif] = useState(() => localStorage.getItem('so_notif') !== '0')
  const [autoRefresh, setAutoRefresh] = useState(() => localStorage.getItem('so_autorefresh') !== '0')
  const [saved, setSaved] = useState(false)
  const [serverURL, setServerURL] = useState(() => {
    const raw = localStorage.getItem('so_api_base') || ''
    return raw
  })

  useEffect(() => {
    api.get('/system/health').then(({ data }) => setHealth(data)).catch(() => {})
  }, [])

  const save = () => {
    localStorage.setItem('so_notif', notif ? '1' : '0')
    localStorage.setItem('so_autorefresh', autoRefresh ? '1' : '0')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{t('settings.subtitle')}</p>
      </div>

      <div className="card p-5">
        <h3 className="text-gray-800 font-semibold mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">translate</span>
          {t('settings.language')}
        </h3>
        <p className="text-gray-500 text-xs mb-4">{t('settings.languageDesc')} · {languages.length}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                lang === l.code
                  ? 'border-primary bg-blue-50 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-primary'
              }`}
            >
              <Flag flag={l.flag} />
              <span className="truncate">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">person</span>
          {t('settings.account')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t('settings.acctUsername')} value={user?.username} />
          <Field label={t('settings.acctRole')} value={user?.role} />
          <Field label={t('settings.acctAuth')} value="Linux PAM" />
          <Field label={t('settings.acctTokenExpiry')} value={t('settings.acctTokenExpiryVal')} />
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <span className="material-symbols-outlined text-base align-middle mr-1">info</span>
          {t('settings.acctPwHint', { cmd: 'passwd' }).split('passwd').flatMap((part, i) => i === 0 ? [part] : [<code key={i} className="font-mono bg-white px-1.5 py-0.5 rounded">passwd</code>, part])}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">dns</span>
          {t('settings.apiServer')}
        </h3>
        <p className="text-gray-500 text-xs mb-3">
          {t('settings.apiServerDesc', { url: 'https://secureops.polsri.ac.id', api: '/api' })}
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={serverURL}
            onChange={e => setServerURL(e.target.value)}
            placeholder="https://secureops.example.com"
            className="input flex-1"
          />
          <button onClick={() => setApiBaseURL(serverURL.trim())} className="btn-primary shrink-0">
            <span className="material-symbols-outlined text-lg">save</span>{t('common.applyReload')}
          </button>
          {serverURL && (
            <button onClick={() => setApiBaseURL('')} className="btn-secondary shrink-0" title={t('settings.resetDefault')}>
              <span className="material-symbols-outlined text-lg">restart_alt</span>
            </button>
          )}
        </div>
        <p className="text-gray-400 text-xs mt-2">
          {t('settings.apiServerCurrent')} <code className="font-mono text-gray-700">{apiBaseURL || t('settings.apiServerNone')}</code>
        </p>
      </div>

      <div className="card p-5">
        <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          {t('settings.preferences')}
        </h3>
        <div className="space-y-3">
          <Toggle label={t('settings.prefNotif')} checked={notif} onChange={setNotif} />
          <Toggle label={t('settings.prefAutoRefresh')} checked={autoRefresh} onChange={setAutoRefresh} />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} className="btn-primary">
            <span className="material-symbols-outlined text-lg">save</span>{t('settings.savePrefs')}
          </button>
          {saved && <span className="text-success text-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-base">check_circle</span>{t('common.saved')}
          </span>}
        </div>
      </div>

      {health?.available && (
        <div className="card p-5">
          <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">dns</span>
            {t('settings.server')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('settings.srvHostname')} value={health.hostname} />
            <Field label={t('settings.srvSystem')}   value={`${health.system} ${health.release}`} />
            <Field label={t('settings.srvPlatform')} value={health.platform} mono />
            <Field label={t('settings.srvPython')}   value={health.python_version} mono />
          </div>
        </div>
      )}

      <UpdateCard isAdmin={user?.role === 'admin'} />

      <div className="card p-5">
        <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">info</span>
          {t('settings.about')}
        </h3>
        <div className="space-y-2 text-sm">
          <p className="text-gray-700"><span className="font-semibold">SecureOps</span> {health?.app_version ? `v${health.app_version}` : ''}</p>
          <p className="text-gray-500">{t('settings.aboutDesc')}</p>
          <p className="text-gray-400 text-xs">FastAPI · React · SQLite · Linux PAM</p>
        </div>
      </div>
    </div>
  )
}

const Field = ({ label, value, mono }) => (
  <div>
    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">{label}</p>
    <p className={`text-gray-800 font-medium ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value || '—'}</p>
  </div>
)

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
    <span className="text-gray-700 text-sm flex-1">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: '44px',
        height: '24px',
        minWidth: '44px',
        maxWidth: '44px',
        flexShrink: 0,
        padding: 0,
        border: 'none',
        position: 'relative',
        borderRadius: '9999px',
        backgroundColor: checked ? '#2563EB' : '#E5E7EB',
        transition: 'background-color 0.15s ease',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '9999px',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          transition: 'left 0.15s ease',
        }}
      />
    </button>
  </label>
)

// Software-update card: checks GitHub for a newer SecureOps release and lets an
// admin apply it (pull + rebuild + restart) straight from the dashboard.
const UpdateCard = ({ isAdmin }) => {
  const [info, setInfo] = useState(null)
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  const check = async () => {
    setBusy(true)
    try {
      const { data } = await api.get('/update/check')
      setInfo(data)
    } catch {
      setInfo({ current: '?', latest: null, update_available: false, error: 'Could not reach the controller.' })
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { check() }, [])

  const apply = async () => {
    setBusy(true)
    try {
      const { data } = await api.post('/update/apply')
      setStatus(data)
      const poll = setInterval(async () => {
        try {
          const { data: s } = await api.get('/update/status')
          setStatus(s)
          if (['done', 'error', 'up-to-date'].includes(s.state)) {
            clearInterval(poll)
            if (s.state === 'done') setTimeout(() => window.location.reload(), 2000)
          }
        } catch {
          setStatus({ state: 'restarting', message: 'Controller is restarting…' })
        }
      }, 3000)
    } catch (e) {
      setStatus({ state: 'error', message: e?.response?.data?.detail || 'Apply failed.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-5">
      <h3 className="text-gray-800 font-semibold mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">system_update</span>
        Software update
      </h3>
      <p className="text-gray-500 text-xs mb-4">
        {info?.update_available
          ? `New version available: v${info.latest}`
          : info?.error ? info.error : "You're up to date."}
      </p>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <Field label="Current" value={info ? `v${info.current}` : '…'} mono />
        <Field label="Latest" value={info?.latest ? `v${info.latest}` : (info?.error ? '—' : '…')} mono />
      </div>

      {info?.update_available && info?.notes && (
        <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{info.notes}</pre>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button onClick={check} disabled={busy} className="btn-secondary">
          <span className="material-symbols-outlined text-lg">refresh</span>Check
        </button>
        {info?.update_available && isAdmin && (
          <button onClick={apply} disabled={busy} className="btn-primary">
            <span className="material-symbols-outlined text-lg">download</span>Update &amp; restart
          </button>
        )}
        {info?.update_available && !isAdmin && (
          <span className="text-gray-400 text-xs">Admin role required to apply updates.</span>
        )}
      </div>

      {status && (
        <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
          <span className="font-medium capitalize">{status.state}</span>
          {status.message ? ` — ${status.message}` : ''}
        </p>
      )}
    </div>
  )
}
