import { useEffect, useState } from 'react'
import api from '../api/client'
import { useServers } from '../context/ServerContext'
import { useI18n } from '../i18n'

export default function Network() {
  const { t } = useI18n()
  const { queryParam, selected } = useServers() || { queryParam: {} }
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/system/network', { params: queryParam })
    .then(({ data }) => setData(data))
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

  if (!data?.available) return <div className="card p-6 text-gray-500 text-sm">{data?.reason || t('network.unavailable')}</div>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('network.title')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t('network.subtitle', { host: data.hostname })}</p>
        </div>
        <button onClick={load} className="btn-secondary shrink-0">
          <span className="material-symbols-outlined text-lg">refresh</span>
          <span className="hidden sm:inline">{t('common.refresh')}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label={t('network.statSent')}   value={`${data.total.bytes_sent_mb.toLocaleString()} MB`} icon="upload"   color="text-blue-500 bg-blue-50" />
        <Stat label={t('network.statRecv')}   value={`${data.total.bytes_recv_mb.toLocaleString()} MB`} icon="download" color="text-emerald-500 bg-emerald-50" />
        <Stat label={t('network.statPktIn')}  value={data.total.packets_recv.toLocaleString()}          icon="south"    color="text-violet-500 bg-violet-50" />
        <Stat label={t('network.statErrors')} value={data.total.errin + data.total.errout}              icon="error"    color={data.total.errin + data.total.errout > 0 ? 'text-danger bg-danger-light' : 'text-gray-400 bg-gray-50'} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-gray-800 font-semibold">{t('network.ifaces', { n: data.interfaces.length })}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>{[t('network.colInterface'), t('network.colIpv4'), t('network.colMac'), t('common.status'), t('network.colSpeed'), t('network.colSent'), t('network.colReceived')].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.interfaces.map(i => (
                <tr key={i.name}>
                  <td className="font-mono text-sm font-medium text-gray-800">{i.name}</td>
                  <td className="font-mono text-xs text-gray-600">{i.ipv4 || '—'}</td>
                  <td className="font-mono text-xs text-gray-500">{i.mac || '—'}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      i.is_up ? 'bg-success-light text-success border-success-border' : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${i.is_up ? 'bg-success' : 'bg-gray-400'}`} />
                      {i.is_up ? t('network.up') : t('network.down')}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">{i.speed_mbps > 0 ? `${i.speed_mbps} Mbps` : '—'}</td>
                  <td className="text-xs text-gray-700 font-mono">{i.bytes_sent_mb} MB</td>
                  <td className="text-xs text-gray-700 font-mono">{i.bytes_recv_mb} MB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-gray-800 font-semibold">{t('network.ports', { n: data.listening_ports.length })}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr>{[t('network.colProtocol'), t('network.colAddress'), t('network.colPort'), t('network.colPid')].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {data.listening_ports.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">{t('network.noPorts')}</td></tr>
              ) : data.listening_ports.map((p, i) => (
                <tr key={i}>
                  <td><span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">{p.type}</span></td>
                  <td className="font-mono text-xs text-gray-600">{p.ip || '—'}</td>
                  <td className="font-mono text-sm font-bold text-primary">{p.port}</td>
                  <td className="font-mono text-xs text-gray-500">{p.pid || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const Stat = ({ label, value, icon, color }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-lg" style={{fontVariationSettings:"'FILL' 1"}}>{icon}</span>
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
  </div>
)
