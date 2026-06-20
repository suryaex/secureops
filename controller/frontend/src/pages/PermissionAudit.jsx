import { useEffect, useState } from 'react'
import api from '../api/client'
import { useI18n } from '../i18n'

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low']

const SEV_BADGE = {
  Critical: 'badge-critical',
  High:     'badge-high',
  Medium:   'badge-medium',
  Low:      'badge-low',
}

const SEV_STAT = {
  Critical: { color: 'text-danger',  bg: 'bg-danger-light',  icon: 'dangerous',  border: 'border-danger-border' },
  High:     { color: 'text-warning', bg: 'bg-warning-light', icon: 'warning',    border: 'border-warning-border' },
  Medium:   { color: 'text-yellow-600', bg: 'bg-yellow-50',  icon: 'info',       border: 'border-yellow-200' },
  Low:      { color: 'text-success', bg: 'bg-success-light', icon: 'check_circle', border: 'border-success-border' },
}

export default function PermissionAudit() {
  const { t } = useI18n()
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)

  const fetchLogs = (sev) => {
    setLoading(true)
    const params = sev && sev !== 'All' ? { severity: sev } : {}
    api.get('/permission-audit/logs', { params })
      .then(({ data }) => setLogs(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs(filter) }, [filter])

  const runScan = async () => {
    setScanning(true)
    setResult(null)
    try {
      const { data } = await api.post('/permission-audit/scan')
      setResult(data)
      fetchLogs(filter)
    } finally {
      setScanning(false)
    }
  }

  const countBySev = (s) => logs.filter(l => l.severity === s).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('audit.title')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t('audit.subtitle')}</p>
        </div>
        <button onClick={runScan} disabled={scanning} className="btn-primary shrink-0">
          {scanning ? (
            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t('audit.scanning')}</>
          ) : (
            <><span className="material-symbols-outlined text-xl">search</span>{t('audit.startScan')}</>
          )}
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div className="card p-4 flex items-center gap-3 border-l-4 border-success">
          <span className="material-symbols-outlined text-success text-2xl" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
          <div>
            <p className="text-gray-800 font-semibold text-sm">{t('audit.scanComplete')}</p>
            <p className="text-gray-500 text-xs">{t('audit.scanStats', { scanned: result.total_scanned.toLocaleString(), issues: result.issues_found, sec: result.duration_seconds })}</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('audit.totalIssues'), value: logs.length, icon: 'folder_open', color: 'text-gray-900', bg: 'bg-blue-50 text-blue-500', border: '' },
          ...['Critical', 'High', 'Medium'].map(s => ({
            label: t(`sev.${s.toLowerCase()}`), value: countBySev(s), icon: SEV_STAT[s].icon,
            color: SEV_STAT[s].color, bg: `${SEV_STAT[s].bg} ${SEV_STAT[s].color}`, border: SEV_STAT[s].border
          }))
        ].map(({ label, value, icon, color, bg, border }) => (
          <div key={label} className={`stat-card ${border ? `border-l-4 ${border}` : ''}`}>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                <span className="material-symbols-outlined text-lg" style={{fontVariationSettings:"'FILL' 1"}}>{icon}</span>
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {SEVERITIES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === s
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {s === 'All' ? t('common.all') : t(`sev.${s.toLowerCase()}`)}
            {s !== 'All' && (
              <span className="ml-1.5 text-xs opacity-70">({countBySev(s)})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {[t('audit.colFilePath'), t('audit.colIssueType'), t('audit.colPermission'), t('audit.colSeverity'), t('audit.colDetected'), t('audit.colScannedBy')].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <span className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  {t('audit.noIssues')}
                </td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td className="font-mono text-xs text-gray-600 max-w-xs truncate">{log.file_path}</td>
                  <td className="text-gray-700">{log.issue_type}</td>
                  <td className="font-mono text-primary text-xs">{log.permission_value}</td>
                  <td><span className={SEV_BADGE[log.severity] || 'badge'}>{t(`sev.${String(log.severity).toLowerCase()}`)}</span></td>
                  <td className="text-gray-400 text-xs whitespace-nowrap">
                    {log.detected_at ? new Date(log.detected_at).toLocaleString('id-ID') : '—'}
                  </td>
                  <td className="text-gray-400 text-xs">{log.scanned_by || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
