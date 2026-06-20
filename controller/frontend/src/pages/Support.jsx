import { useI18n } from '../i18n'

const links = [
  { icon: 'description', key: 'api',     href: '/docs' },
  { icon: 'code',        key: 'github',  href: 'https://github.com/suryaex/secureops' },
  { icon: 'mail',        key: 'contact', href: 'mailto:it@polsri.ac.id' },
]

const faqKeys = ['q1', 'q2', 'q3', 'q4', 'q5']

export default function Support() {
  const { t } = useI18n()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('support.title')}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{t('support.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map(l => (
          <a key={l.key} href={l.href} target="_blank" rel="noreferrer" className="card p-5 hover:shadow-md transition-shadow flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">{l.icon}</span>
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-sm">{t(`support.link.${l.key}`)}</p>
              <p className="text-gray-400 text-xs">{t(`support.link.${l.key}Sub`)}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">help_outline</span>
          {t('support.faqTitle')}
        </h3>
        <div className="space-y-3">
          {faqKeys.map(k => (
            <details key={k} className="group border border-gray-100 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 list-none">
                <span className="text-gray-800 font-medium text-sm">{t(`support.faq.${k}`)}</span>
                <span className="material-symbols-outlined text-gray-400 text-lg group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">{t(`support.faq.${k}a`)}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-gray-800 font-semibold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">terminal</span>
          {t('support.cmdTitle')}
        </h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto leading-relaxed">
{`# Check service status
sudo systemctl status secureops-backend
sudo systemctl status secureops-frontend

# View recent logs
sudo journalctl -u secureops-backend -n 50

# Restart services
sudo systemctl restart secureops-backend secureops-frontend

# Add a user to sudo group (becomes SecureOps admin)
sudo usermod -aG sudo username`}
        </pre>
      </div>
    </div>
  )
}
