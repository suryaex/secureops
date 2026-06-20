import { useEffect, useState } from 'react'
import api from '../api/client'
import { useServers } from '../context/ServerContext'
import { useI18n } from '../i18n'

const formatUptime = (s) => {
  if (!s) return '—'
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

function Bar({ percent, danger = 75, warn = 50 }) {
  const color = percent >= danger ? 'bg-danger' : percent >= warn ? 'bg-warning' : 'bg-success'
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  )
}

function Metric({ label, value, unit, percent, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-gray-400 text-xs">{sub}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}<span className="text-base text-gray-400 ml-1">{unit}</span></p>
      {percent !== undefined && <div className="mt-3"><Bar percent={percent} /></div>}
    </div>
  )
}

export default function SystemHealth() {
  const { t } = useI18n()
  const { queryParam, selected } = useServers() || { queryParam: {} }
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => api.get('/system/health', { params: queryParam })
    .then(({ data }) => { setData(data); setError(null) })
    .catch(err => setError(err.response?.data?.detail || t('health.failedLoad')))
    .finally(() => setLoading(false))

  useEffect(() => {
    setLoading(true)
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [selected?.id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  if (error) return <div className="card p-6 text-danger text-sm">{error}</div>
  if (!data?.available) return <div className="card p-6 text-gray-500 text-sm">{data?.reason || t('health.unavailable')}</div>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('health.title')}</h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {t('health.live')} · {data.hostname} · {data.system} {data.release}
          </p>
        </div>
        <button onClick={load} className="btn-secondary shrink-0">
          <span className="material-symbols-outlined text-lg">refresh</span>
          <span className="hidden sm:inline">{t('common.refresh')}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label={t('health.cpuUsage')} value={data.cpu.percent} unit="%" percent={data.cpu.percent}
                sub={t('health.cores', { n: data.cpu.cores_logical })} />
        <Metric label={t('health.memory')}   value={data.memory.percent} unit="%" percent={data.memory.percent}
                sub={`${data.memory.used_gb}/${data.memory.total_gb} GB`} />
        <Metric label={t('health.disk')}     value={data.disk.percent} unit="%" percent={data.disk.percent}
                sub={`${data.disk.used_gb}/${data.disk.total_gb} GB`} />
        <Metric label={t('health.uptime')}   value={formatUptime(data.uptime_seconds)} unit=""
                sub={t('health.since', { date: new Date(data.boot_time).toLocaleDateString() })} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="text-gray-800 font-semibold mb-4">{t('health.cpuPerCore')}</h3>
          <div className="space-y-2">
            {data.cpu.per_cpu.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500 w-12">{t('health.core', { i })}</span>
                <div className="flex-1"><Bar percent={p} /></div>
                <span className="text-xs font-mono text-gray-700 w-12 text-right">{p.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            <div><p className="text-xs text-gray-400">{t('health.load1')}</p><p className="text-lg font-bold text-gray-800">{data.cpu.load_1m}</p></div>
            <div><p className="text-xs text-gray-400">{t('health.load5')}</p><p className="text-lg font-bold text-gray-800">{data.cpu.load_5m}</p></div>
            <div><p className="text-xs text-gray-400">{t('health.load15')}</p><p className="text-lg font-bold text-gray-800">{data.cpu.load_15m}</p></div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-gray-800 font-semibold mb-4">{t('health.sysInfo')}</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              <Row k={t('health.rowHostname')} v={data.hostname} />
              <Row k={t('health.rowPlatform')} v={data.platform} />
              <Row k={t('health.rowArch')}     v={data.architecture} />
              <Row k={t('health.rowPython')}   v={data.python_version} />
              <Row k={t('health.rowProcesses')} v={data.processes} />
              <Row k={t('health.rowMemTotal')} v={`${data.memory.total_gb} GB`} />
              <Row k={t('health.rowSwap')}     v={`${data.swap.used_gb} / ${data.swap.total_gb} GB (${data.swap.percent}%)`} />
              <Row k={t('health.rowDiskFree')} v={`${data.disk.free_gb} GB`} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const Row = ({ k, v }) => (
  <tr><td className="py-2 text-gray-500 text-xs uppercase tracking-wider">{k}</td><td className="py-2 text-gray-800 font-medium text-right font-mono text-xs">{v}</td></tr>
)
