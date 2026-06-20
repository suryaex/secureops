import { useEffect, useState } from 'react'
import api from '../api/client'
import { useI18n } from '../i18n'

const AVATAR_COLORS = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-orange-500','bg-pink-500','bg-cyan-500']

const ACTION_TAGS = {
  'Login':               'bg-blue-50 text-blue-700 border-blue-200',
  'Login Failed':        'bg-red-50 text-red-600 border-red-200',
  'Permission Scan':     'bg-amber-50 text-amber-700 border-amber-200',
  'Sudo Scan':           'bg-purple-50 text-purple-700 border-purple-200',
  'File Integrity Scan': 'bg-teal-50 text-teal-700 border-teal-200',
  'Add Monitored File':  'bg-green-50 text-green-700 border-green-200',
}

// Pemetaan nilai aksi (dari API, bahasa Inggris) ke kunci i18n.
const ACTION_KEY = {
  'Login': 'login', 'Login Failed': 'loginFailed', 'Permission Scan': 'permissionScan',
  'Sudo Scan': 'sudoScan', 'File Integrity Scan': 'fileIntegrityScan', 'Add Monitored File': 'addMonitoredFile',
}

export default function ActivityLogs() {
  const { t } = useI18n()
  const tAction = (a) => ACTION_KEY[a] ? t(`logs.action.${ACTION_KEY[a]}`) : a
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const PER_PAGE = 20

  const fetchLogs = () => {
    setLoading(true)
    const params = {
      skip: page * PER_PAGE, limit: PER_PAGE,
      ...(search && { search }),
      ...(actionFilter && { action: actionFilter }),
      ...(statusFilter && { status: statusFilter }),
    }
    api.get('/activity-logs/', { params })
      .then(({ data }) => setLogs(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs() }, [search, actionFilter, statusFilter, page])

  const timeAgo = (ts) => {
    if (!ts) return '—'
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return new Date(ts).toLocaleDateString('id-ID')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('logs.title')}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{t('logs.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            type="text"
            placeholder={t('logs.searchAdmin')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="input pl-10"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(0) }}
          className="input w-auto"
        >
          <option value="">{t('logs.allActions')}</option>
          <option value="Login">{t('logs.action.login')}</option>
          <option value="Login Failed">{t('logs.action.loginFailed')}</option>
          <option value="Permission Scan">{t('logs.action.permissionScan')}</option>
          <option value="Sudo Scan">{t('logs.action.sudoScan')}</option>
          <option value="File Integrity Scan">{t('logs.action.fileIntegrityScan')}</option>
          <option value="Add Monitored File">{t('logs.action.addMonitoredFile')}</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="input w-auto"
        >
          <option value="">{t('logs.allStatus')}</option>
          <option value="success">{t('common.success')}</option>
          <option value="failed">{t('common.failed')}</option>
        </select>
        {(search || actionFilter || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setActionFilter(''); setStatusFilter(''); setPage(0) }}
            className="btn-ghost text-xs"
          >
            <span className="material-symbols-outlined text-base">filter_alt_off</span>
            {t('logs.clear')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {[t('dash.colAdmin'), t('dash.colAction'), t('logs.colDetails'), t('dash.colIp'), t('dash.colTime'), t('common.status')].map(h => (
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
                  {t('logs.noLogs')}
                </td></tr>
              ) : logs.map((log, i) => (
                <tr key={log.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`avatar ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {log.admin_username?.slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-gray-800 font-medium text-sm">{log.admin_username}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`action-tag border ${ACTION_TAGS[log.action] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {tAction(log.action)}
                    </span>
                  </td>
                  <td className="text-gray-500 text-xs max-w-xs truncate">{log.details || '—'}</td>
                  <td className="font-mono text-gray-500 text-xs">{log.ip_address}</td>
                  <td className="text-gray-400 text-xs whitespace-nowrap">{timeAgo(log.timestamp)}</td>
                  <td>
                    <span className={`badge-${log.status}`}>{t(`common.${log.status}`)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
          <p className="text-gray-400 text-xs">
            {t('logs.showing', { from: page * PER_PAGE + 1, to: page * PER_PAGE + logs.length })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >← {t('common.prev')}</button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={logs.length < PER_PAGE}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >{t('common.next')} →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
