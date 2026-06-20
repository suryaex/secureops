import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useI18n } from '../i18n'

const SEV_BADGE = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  High:     'bg-orange-50 text-orange-700 border-orange-200',
  Medium:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  Low:      'bg-blue-50 text-blue-700 border-blue-200',
}

const CAT_ICON = {
  'Permission':     'policy',
  'File Integrity': 'verified_user',
  'Sudo Monitor':   'manage_accounts',
  'Authentication': 'lock_person',
}

const CAT_ROUTE = {
  'Permission':     '/permission-audit',
  'File Integrity': '/file-integrity',
  'Sudo Monitor':   '/sudo-monitor',
  'Authentication': '/activity-logs',
}

const timeAgo = (ts) => {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(ts).toLocaleDateString()
}

export default function Alerts() {
  const { t } = useI18n()
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/system/alerts').then(({ data }) => setData(data)).finally(() => setLoading(false))

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  const filtered = data.alerts.filter(a => filter === 'All' || a.severity === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('alerts.title')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t('alerts.subtitle')}</p>
        </div>
        <button onClick={load} className="btn-secondary shrink-0">
          <span className="material-symbols-outlined text-lg">refresh</span>
          <span className="hidden sm:inline">{t('common.refresh')}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['Critical', 'High', 'Medium', 'Low'].map(sev => (
          <div key={sev} className={`stat-card border-l-4 ${
            sev === 'Critical' ? 'border-danger' :
            sev === 'High' ? 'border-warning' :
            sev === 'Medium' ? 'border-yellow-400' : 'border-blue-400'
          }`}>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{t(`sev.${sev.toLowerCase()}`)}</p>
            <p className={`text-3xl font-bold mt-2 ${
              sev === 'Critical' ? 'text-danger' :
              sev === 'High' ? 'text-warning' :
              sev === 'Medium' ? 'text-yellow-600' : 'text-blue-600'
            }`}>{data.by_severity[sev] || 0}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['All', 'Critical', 'High', 'Medium'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            filter === s ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-primary hover:text-primary'
          }`}>
            {s === 'All' ? t('common.all') : t(`sev.${s.toLowerCase()}`)}{s !== 'All' && ` (${data.by_severity[s] || 0})`}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-gray-800 font-semibold">{t('alerts.active', { n: filtered.length })}</h3>
        </div>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-success" style={{fontVariationSettings:"'FILL' 1"}}>verified</span>
            <p className="text-gray-700 font-semibold mt-3">{t('alerts.allClear')}</p>
            <p className="text-gray-400 text-sm">{t('alerts.noAlerts', { sev: filter !== 'All' ? t(`sev.${filter.toLowerCase()}`) : '' })}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(a => (
              <Link to={CAT_ROUTE[a.category] || '/dashboard'} key={a.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${SEV_BADGE[a.severity]} border`}>
                  <span className="material-symbols-outlined text-lg" style={{fontVariationSettings:"'FILL' 1"}}>
                    {CAT_ICON[a.category] || 'warning'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-gray-900 font-semibold text-sm truncate">{a.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEV_BADGE[a.severity]}`}>
                      {t(`sev.${String(a.severity).toLowerCase()}`)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs truncate">{a.details}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-gray-400 text-[11px]">{a.category}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400 text-[11px]">{timeAgo(a.timestamp)}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400 text-[11px]">{t('alerts.source', { s: a.source })}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-300 text-base shrink-0 mt-2">chevron_right</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
