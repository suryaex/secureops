// SecureOps — kamus terjemahan antarmuka.
//
// Daftar 100 bahasa (untuk pemilih) ada di ./languages.js. Berkas ini berisi
// kamus LENGKAP untuk 20 bahasa utama. Bahasa lain otomatis jatuh ke bahasa
// default (Inggris) per-kunci — lihat fungsi t() di ./index.jsx.
//
// Cara menambah/menyempurnakan bahasa: salin blok `en`, terjemahkan nilainya,
// simpan dengan kode bahasa yang sama seperti di languages.js.

export const DEFAULT_LANG = 'en'

export const translations = {
  en: {
    common: { loading: 'Loading…', generating: 'Generating…', save: 'Save', saved: 'Saved', cancel: 'Cancel', search: 'Search', all: 'All', today: 'Today', days7: '7 Days', next: 'Next', prev: 'Previous', active: 'active', success: 'Success', failed: 'Failed', applyReload: 'Apply & Reload' },
    sev: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' },
    nav: { dashboard: 'Dashboard', fleet: 'Fleet', audit: 'Audit', sudo: 'Sudo', integrity: 'Integrity', logs: 'Logs', terminal: 'Terminal', replays: 'Replays', servers: 'Servers', users: 'Users', settings: 'Settings', support: 'Support' },
    top: { systemHealth: 'System Health', network: 'Network', alerts: 'Alerts', searchPlaceholder: 'Search logs, users, or alerts…', searching: 'Searching…', noResults: 'No results for "{q}"', serversCount: 'Servers ({n})', manage: 'Manage', fleetOverview: 'Fleet Overview', noServer: 'No server', group: { logs: 'Activity Logs', users: 'Sudo Users', files: 'Files', permissions: 'Permissions' } },
    menu: { linuxAccount: 'Linux Account', settings: 'Settings', support: 'Support', servers: 'Servers', logout: 'Logout' },
    dash: { title: 'System Overview', lastUpdated: 'Last updated: Just now', report: 'View Report', totalSudoFiles: 'Total Sudo Files', criticalN: 'Critical: {n}', sudoUsers: 'Sudo Users', integrityStatus: 'Integrity Status', newAlerts: 'New Alerts', actionNeeded: 'action needed', allClear: 'all clear', severityDist: 'Severity Level Distribution', totalIssues: 'Total Issues', noScanData: 'No scan data — run a scan first', scanActivity: 'System Scan Activity (24 Hours)', scans: 'Scans', recentActivity: 'Recent Activity', viewAllLogs: 'View All Logs', noActivity: 'No activity yet — login and run scans to populate', colAdmin: 'Admin', colAction: 'Action', colTime: 'Time', colIp: 'IP Address', reportFail: 'Failed to create report: {msg}' },
    login: { subtitle: 'Security Audit Dashboard', usernamePlaceholder: 'superadmin or email@domain', passwordPlaceholder: 'Your OS account password', signIn: 'Sign In', usernameLabel: 'Username / Email', passwordLabel: 'Linux Password', passwdHint: 'Use `passwd` on server', invalid: 'Invalid username or password.', pamFooter: 'Authenticated via Linux PAM', osHint: 'Sign in with your real OS account.', adminHint: 'sudo / wheel members → admin role' },
    settings: { language: 'Language', languageDesc: 'Choose the interface language' },
  },

  id: {
    common: { loading: 'Memuat…', generating: 'Membuat…', save: 'Simpan', saved: 'Tersimpan', cancel: 'Batal', search: 'Cari', all: 'Semua', today: 'Hari ini', days7: '7 Hari', next: 'Berikutnya', prev: 'Sebelumnya', active: 'aktif', success: 'Berhasil', failed: 'Gagal', applyReload: 'Terapkan & Muat Ulang' },
    sev: { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' },
    nav: { dashboard: 'Dasbor', fleet: 'Armada', audit: 'Audit', sudo: 'Sudo', integrity: 'Integritas', logs: 'Log', terminal: 'Terminal', replays: 'Rekaman', servers: 'Server', users: 'Pengguna', settings: 'Pengaturan', support: 'Bantuan' },
    top: { systemHealth: 'Kesehatan Sistem', network: 'Jaringan', alerts: 'Peringatan', searchPlaceholder: 'Cari log, pengguna, atau peringatan…', searching: 'Mencari…', noResults: 'Tidak ada hasil untuk "{q}"', serversCount: 'Server ({n})', manage: 'Kelola', fleetOverview: 'Ikhtisar Armada', noServer: 'Tidak ada server', group: { logs: 'Log Aktivitas', users: 'Pengguna Sudo', files: 'Berkas', permissions: 'Izin Akses' } },
    menu: { linuxAccount: 'Akun Linux', settings: 'Pengaturan', support: 'Bantuan', servers: 'Server', logout: 'Keluar' },
    dash: { title: 'Ikhtisar Sistem', lastUpdated: 'Terakhir diperbarui: Baru saja', report: 'Lihat Laporan', totalSudoFiles: 'Total Berkas Sudo', criticalN: 'Kritis: {n}', sudoUsers: 'Pengguna Sudo', integrityStatus: 'Status Integritas', newAlerts: 'Peringatan Baru', actionNeeded: 'perlu tindakan', allClear: 'aman', severityDist: 'Distribusi Tingkat Keparahan', totalIssues: 'Total Masalah', noScanData: 'Belum ada data pindai — jalankan pemindaian dulu', scanActivity: 'Aktivitas Pemindaian Sistem (24 Jam)', scans: 'Pemindaian', recentActivity: 'Aktivitas Terbaru', viewAllLogs: 'Lihat Semua Log', noActivity: 'Belum ada aktivitas — masuk dan jalankan pindai untuk mengisi', colAdmin: 'Admin', colAction: 'Aksi', colTime: 'Waktu', colIp: 'Alamat IP', reportFail: 'Gagal membuat laporan: {msg}' },
    login: { subtitle: 'Dasbor Audit Keamanan', usernamePlaceholder: 'superadmin atau email@domain', passwordPlaceholder: 'Kata sandi akun OS Anda', signIn: 'Masuk', usernameLabel: 'Nama Pengguna / Email', passwordLabel: 'Kata Sandi Linux', passwdHint: 'Gunakan `passwd` di server', invalid: 'Nama pengguna atau kata sandi salah.', pamFooter: 'Terautentikasi via Linux PAM', osHint: 'Masuk dengan akun OS asli Anda.', adminHint: 'anggota sudo / wheel → peran admin' },
    settings: { language: 'Bahasa', languageDesc: 'Pilih bahasa antarmuka' },
  },

  ms: {
    common: { loading: 'Memuatkan…', generating: 'Menjana…', save: 'Simpan', saved: 'Disimpan', cancel: 'Batal', search: 'Cari', all: 'Semua', today: 'Hari ini', days7: '7 Hari', next: 'Seterusnya', prev: 'Sebelumnya', active: 'aktif', success: 'Berjaya', failed: 'Gagal', applyReload: 'Guna & Muat Semula' },
    sev: { critical: 'Kritikal', high: 'Tinggi', medium: 'Sederhana', low: 'Rendah' },
    nav: { dashboard: 'Papan Pemuka', fleet: 'Armada', audit: 'Audit', sudo: 'Sudo', integrity: 'Integriti', logs: 'Log', terminal: 'Terminal', replays: 'Rakaman', servers: 'Pelayan', users: 'Pengguna', settings: 'Tetapan', support: 'Sokongan' },
    top: { systemHealth: 'Kesihatan Sistem', network: 'Rangkaian', alerts: 'Amaran', searchPlaceholder: 'Cari log, pengguna atau amaran…', searching: 'Mencari…', noResults: 'Tiada hasil untuk "{q}"', serversCount: 'Pelayan ({n})', manage: 'Urus', fleetOverview: 'Gambaran Armada', noServer: 'Tiada pelayan', group: { logs: 'Log Aktiviti', users: 'Pengguna Sudo', files: 'Fail', permissions: 'Kebenaran' } },
    menu: { linuxAccount: 'Akaun Linux', settings: 'Tetapan', support: 'Sokongan', servers: 'Pelayan', logout: 'Log Keluar' },
    dash: { title: 'Gambaran Keseluruhan Sistem', lastUpdated: 'Dikemas kini: Sebentar tadi', report: 'Lihat Laporan', totalSudoFiles: 'Jumlah Fail Sudo', criticalN: 'Kritikal: {n}', sudoUsers: 'Pengguna Sudo', integrityStatus: 'Status Integriti', newAlerts: 'Amaran Baharu', actionNeeded: 'perlu tindakan', allClear: 'selamat', severityDist: 'Taburan Tahap Keterukan', totalIssues: 'Jumlah Isu', noScanData: 'Tiada data imbasan — jalankan imbasan dahulu', scanActivity: 'Aktiviti Imbasan Sistem (24 Jam)', scans: 'Imbasan', recentActivity: 'Aktiviti Terkini', viewAllLogs: 'Lihat Semua Log', noActivity: 'Belum ada aktiviti — log masuk dan jalankan imbasan', colAdmin: 'Admin', colAction: 'Tindakan', colTime: 'Masa', colIp: 'Alamat IP', reportFail: 'Gagal mencipta laporan: {msg}' },
    login: { subtitle: 'Papan Pemuka Audit Keselamatan', usernamePlaceholder: 'superadmin atau email@domain', passwordPlaceholder: 'Kata laluan akaun OS anda', signIn: 'Log Masuk' },
    settings: { language: 'Bahasa', languageDesc: 'Pilih bahasa antara muka' },
  },

  zh: {
    common: { loading: '加载中…', generating: '生成中…', save: '保存', saved: '已保存', cancel: '取消', search: '搜索', all: '全部', today: '今天', days7: '7 天', next: '下一页', prev: '上一页', active: '活跃', success: '成功', failed: '失败', applyReload: '应用并重新加载' },
    sev: { critical: '严重', high: '高', medium: '中', low: '低' },
    nav: { dashboard: '仪表板', fleet: '集群', audit: '审计', sudo: 'Sudo', integrity: '完整性', logs: '日志', terminal: '终端', replays: '回放', servers: '服务器', users: '用户', settings: '设置', support: '支持' },
    top: { systemHealth: '系统运行状况', network: '网络', alerts: '警报', searchPlaceholder: '搜索日志、用户或警报…', searching: '搜索中…', noResults: '没有“{q}”的结果', serversCount: '服务器 ({n})', manage: '管理', fleetOverview: '集群概览', noServer: '无服务器', group: { logs: '活动日志', users: 'Sudo 用户', files: '文件', permissions: '权限' } },
    menu: { linuxAccount: 'Linux 账户', settings: '设置', support: '支持', servers: '服务器', logout: '退出登录' },
    dash: { title: '系统概览', lastUpdated: '最后更新：刚刚', report: '查看报告', totalSudoFiles: 'Sudo 文件总数', criticalN: '严重：{n}', sudoUsers: 'Sudo 用户', integrityStatus: '完整性状态', newAlerts: '新警报', actionNeeded: '需要处理', allClear: '一切正常', severityDist: '严重程度分布', totalIssues: '问题总数', noScanData: '暂无扫描数据 — 请先运行扫描', scanActivity: '系统扫描活动（24 小时）', scans: '扫描', recentActivity: '近期活动', viewAllLogs: '查看全部日志', noActivity: '暂无活动 — 登录并运行扫描以填充', colAdmin: '管理员', colAction: '操作', colTime: '时间', colIp: 'IP 地址', reportFail: '创建报告失败：{msg}' },
    login: { subtitle: '安全审计仪表板', usernamePlaceholder: 'superadmin 或 email@domain', passwordPlaceholder: '您的操作系统账户密码', signIn: '登录' },
    settings: { language: '语言', languageDesc: '选择界面语言' },
  },

  ja: {
    common: { loading: '読み込み中…', generating: '生成中…', save: '保存', saved: '保存しました', cancel: 'キャンセル', search: '検索', all: 'すべて', today: '今日', days7: '7日間', next: '次へ', prev: '前へ', active: '有効', success: '成功', failed: '失敗', applyReload: '適用して再読み込み' },
    sev: { critical: '重大', high: '高', medium: '中', low: '低' },
    nav: { dashboard: 'ダッシュボード', fleet: 'フリート', audit: '監査', sudo: 'Sudo', integrity: '整合性', logs: 'ログ', terminal: 'ターミナル', replays: '録画', servers: 'サーバー', users: 'ユーザー', settings: '設定', support: 'サポート' },
    top: { systemHealth: 'システム稼働状況', network: 'ネットワーク', alerts: 'アラート', searchPlaceholder: 'ログ・ユーザー・アラートを検索…', searching: '検索中…', noResults: '「{q}」の結果はありません', serversCount: 'サーバー ({n})', manage: '管理', fleetOverview: 'フリート概要', noServer: 'サーバーなし', group: { logs: 'アクティビティログ', users: 'Sudo ユーザー', files: 'ファイル', permissions: '権限' } },
    menu: { linuxAccount: 'Linux アカウント', settings: '設定', support: 'サポート', servers: 'サーバー', logout: 'ログアウト' },
    dash: { title: 'システム概要', lastUpdated: '最終更新：たった今', report: 'レポートを表示', totalSudoFiles: 'Sudo ファイル総数', criticalN: '重大：{n}', sudoUsers: 'Sudo ユーザー', integrityStatus: '整合性ステータス', newAlerts: '新規アラート', actionNeeded: '対応が必要', allClear: '異常なし', severityDist: '深刻度の分布', totalIssues: '問題の総数', noScanData: 'スキャンデータがありません — まずスキャンを実行', scanActivity: 'システムスキャン活動（24時間）', scans: 'スキャン', recentActivity: '最近のアクティビティ', viewAllLogs: 'すべてのログを表示', noActivity: 'アクティビティはまだありません — ログインしてスキャンを実行', colAdmin: '管理者', colAction: '操作', colTime: '時刻', colIp: 'IP アドレス', reportFail: 'レポートの作成に失敗しました：{msg}' },
    login: { subtitle: 'セキュリティ監査ダッシュボード', usernamePlaceholder: 'superadmin または email@domain', passwordPlaceholder: 'OS アカウントのパスワード', signIn: 'サインイン' },
    settings: { language: '言語', languageDesc: 'インターフェースの言語を選択' },
  },

  ko: {
    common: { loading: '불러오는 중…', generating: '생성 중…', save: '저장', saved: '저장됨', cancel: '취소', search: '검색', all: '전체', today: '오늘', days7: '7일', next: '다음', prev: '이전', active: '활성', success: '성공', failed: '실패', applyReload: '적용 후 새로고침' },
    sev: { critical: '심각', high: '높음', medium: '중간', low: '낮음' },
    nav: { dashboard: '대시보드', fleet: '플릿', audit: '감사', sudo: 'Sudo', integrity: '무결성', logs: '로그', terminal: '터미널', replays: '녹화', servers: '서버', users: '사용자', settings: '설정', support: '지원' },
    top: { systemHealth: '시스템 상태', network: '네트워크', alerts: '경고', searchPlaceholder: '로그, 사용자 또는 경고 검색…', searching: '검색 중…', noResults: '"{q}"에 대한 결과 없음', serversCount: '서버 ({n})', manage: '관리', fleetOverview: '플릿 개요', noServer: '서버 없음', group: { logs: '활동 로그', users: 'Sudo 사용자', files: '파일', permissions: '권한' } },
    menu: { linuxAccount: 'Linux 계정', settings: '설정', support: '지원', servers: '서버', logout: '로그아웃' },
    dash: { title: '시스템 개요', lastUpdated: '마지막 업데이트: 방금', report: '보고서 보기', totalSudoFiles: '총 Sudo 파일', criticalN: '심각: {n}', sudoUsers: 'Sudo 사용자', integrityStatus: '무결성 상태', newAlerts: '새 경고', actionNeeded: '조치 필요', allClear: '이상 없음', severityDist: '심각도 분포', totalIssues: '총 문제 수', noScanData: '스캔 데이터 없음 — 먼저 스캔을 실행하세요', scanActivity: '시스템 스캔 활동(24시간)', scans: '스캔', recentActivity: '최근 활동', viewAllLogs: '모든 로그 보기', noActivity: '아직 활동 없음 — 로그인하고 스캔을 실행하세요', colAdmin: '관리자', colAction: '작업', colTime: '시간', colIp: 'IP 주소', reportFail: '보고서 생성 실패: {msg}' },
    login: { subtitle: '보안 감사 대시보드', usernamePlaceholder: 'superadmin 또는 email@domain', passwordPlaceholder: 'OS 계정 비밀번호', signIn: '로그인' },
    settings: { language: '언어', languageDesc: '인터페이스 언어 선택' },
  },

  hi: {
    common: { loading: 'लोड हो रहा है…', generating: 'बना रहे हैं…', save: 'सहेजें', saved: 'सहेजा गया', cancel: 'रद्द करें', search: 'खोजें', all: 'सभी', today: 'आज', days7: '7 दिन', next: 'अगला', prev: 'पिछला', active: 'सक्रिय', success: 'सफल', failed: 'विफल', applyReload: 'लागू करें और रीलोड करें' },
    sev: { critical: 'गंभीर', high: 'उच्च', medium: 'मध्यम', low: 'निम्न' },
    nav: { dashboard: 'डैशबोर्ड', fleet: 'फ्लीट', audit: 'ऑडिट', sudo: 'Sudo', integrity: 'अखंडता', logs: 'लॉग', terminal: 'टर्मिनल', replays: 'रिकॉर्डिंग', servers: 'सर्वर', users: 'उपयोगकर्ता', settings: 'सेटिंग्स', support: 'सहायता' },
    top: { systemHealth: 'सिस्टम स्वास्थ्य', network: 'नेटवर्क', alerts: 'अलर्ट', searchPlaceholder: 'लॉग, उपयोगकर्ता या अलर्ट खोजें…', searching: 'खोज रहे हैं…', noResults: '"{q}" के लिए कोई परिणाम नहीं', serversCount: 'सर्वर ({n})', manage: 'प्रबंधित करें', fleetOverview: 'फ्लीट अवलोकन', noServer: 'कोई सर्वर नहीं', group: { logs: 'गतिविधि लॉग', users: 'Sudo उपयोगकर्ता', files: 'फ़ाइलें', permissions: 'अनुमतियाँ' } },
    menu: { linuxAccount: 'Linux खाता', settings: 'सेटिंग्स', support: 'सहायता', servers: 'सर्वर', logout: 'लॉग आउट' },
    dash: { title: 'सिस्टम अवलोकन', lastUpdated: 'अंतिम अद्यतन: अभी', report: 'रिपोर्ट देखें', totalSudoFiles: 'कुल Sudo फ़ाइलें', criticalN: 'गंभीर: {n}', sudoUsers: 'Sudo उपयोगकर्ता', integrityStatus: 'अखंडता स्थिति', newAlerts: 'नए अलर्ट', actionNeeded: 'कार्रवाई आवश्यक', allClear: 'सब ठीक है', severityDist: 'गंभीरता स्तर वितरण', totalIssues: 'कुल समस्याएँ', noScanData: 'कोई स्कैन डेटा नहीं — पहले स्कैन चलाएँ', scanActivity: 'सिस्टम स्कैन गतिविधि (24 घंटे)', scans: 'स्कैन', recentActivity: 'हाल की गतिविधि', viewAllLogs: 'सभी लॉग देखें', noActivity: 'अभी कोई गतिविधि नहीं — लॉगिन करें और स्कैन चलाएँ', colAdmin: 'एडमिन', colAction: 'क्रिया', colTime: 'समय', colIp: 'IP पता', reportFail: 'रिपोर्ट बनाने में विफल: {msg}' },
    login: { subtitle: 'सुरक्षा ऑडिट डैशबोर्ड', usernamePlaceholder: 'superadmin या email@domain', passwordPlaceholder: 'आपका OS खाता पासवर्ड', signIn: 'साइन इन करें' },
    settings: { language: 'भाषा', languageDesc: 'इंटरफ़ेस भाषा चुनें' },
  },

  ar: {
    common: { loading: 'جارٍ التحميل…', generating: 'جارٍ الإنشاء…', save: 'حفظ', saved: 'تم الحفظ', cancel: 'إلغاء', search: 'بحث', all: 'الكل', today: 'اليوم', days7: '7 أيام', next: 'التالي', prev: 'السابق', active: 'نشط', success: 'نجاح', failed: 'فشل', applyReload: 'تطبيق وإعادة التحميل' },
    sev: { critical: 'حرج', high: 'مرتفع', medium: 'متوسط', low: 'منخفض' },
    nav: { dashboard: 'لوحة التحكم', fleet: 'الأسطول', audit: 'التدقيق', sudo: 'Sudo', integrity: 'السلامة', logs: 'السجلات', terminal: 'الطرفية', replays: 'التسجيلات', servers: 'الخوادم', users: 'المستخدمون', settings: 'الإعدادات', support: 'الدعم' },
    top: { systemHealth: 'حالة النظام', network: 'الشبكة', alerts: 'التنبيهات', searchPlaceholder: 'ابحث في السجلات أو المستخدمين أو التنبيهات…', searching: 'جارٍ البحث…', noResults: 'لا نتائج لـ "{q}"', serversCount: 'الخوادم ({n})', manage: 'إدارة', fleetOverview: 'نظرة عامة على الأسطول', noServer: 'لا يوجد خادم', group: { logs: 'سجلات النشاط', users: 'مستخدمو Sudo', files: 'الملفات', permissions: 'الأذونات' } },
    menu: { linuxAccount: 'حساب Linux', settings: 'الإعدادات', support: 'الدعم', servers: 'الخوادم', logout: 'تسجيل الخروج' },
    dash: { title: 'نظرة عامة على النظام', lastUpdated: 'آخر تحديث: الآن', report: 'عرض التقرير', totalSudoFiles: 'إجمالي ملفات Sudo', criticalN: 'حرج: {n}', sudoUsers: 'مستخدمو Sudo', integrityStatus: 'حالة السلامة', newAlerts: 'تنبيهات جديدة', actionNeeded: 'إجراء مطلوب', allClear: 'كل شيء سليم', severityDist: 'توزيع مستوى الخطورة', totalIssues: 'إجمالي المشكلات', noScanData: 'لا توجد بيانات فحص — شغّل فحصًا أولاً', scanActivity: 'نشاط فحص النظام (24 ساعة)', scans: 'عمليات الفحص', recentActivity: 'النشاط الأخير', viewAllLogs: 'عرض جميع السجلات', noActivity: 'لا يوجد نشاط بعد — سجّل الدخول وشغّل الفحوصات', colAdmin: 'المسؤول', colAction: 'الإجراء', colTime: 'الوقت', colIp: 'عنوان IP', reportFail: 'فشل إنشاء التقرير: {msg}' },
    login: { subtitle: 'لوحة تدقيق الأمان', usernamePlaceholder: 'superadmin أو email@domain', passwordPlaceholder: 'كلمة مرور حساب نظام التشغيل', signIn: 'تسجيل الدخول' },
    settings: { language: 'اللغة', languageDesc: 'اختر لغة الواجهة' },
  },

  es: {
    common: { loading: 'Cargando…', generating: 'Generando…', save: 'Guardar', saved: 'Guardado', cancel: 'Cancelar', search: 'Buscar', all: 'Todos', today: 'Hoy', days7: '7 días', next: 'Siguiente', prev: 'Anterior', active: 'activo', success: 'Éxito', failed: 'Fallido', applyReload: 'Aplicar y recargar' },
    sev: { critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo' },
    nav: { dashboard: 'Panel', fleet: 'Flota', audit: 'Auditoría', sudo: 'Sudo', integrity: 'Integridad', logs: 'Registros', terminal: 'Terminal', replays: 'Grabaciones', servers: 'Servidores', users: 'Usuarios', settings: 'Ajustes', support: 'Soporte' },
    top: { systemHealth: 'Estado del sistema', network: 'Red', alerts: 'Alertas', searchPlaceholder: 'Buscar registros, usuarios o alertas…', searching: 'Buscando…', noResults: 'Sin resultados para "{q}"', serversCount: 'Servidores ({n})', manage: 'Gestionar', fleetOverview: 'Resumen de la flota', noServer: 'Sin servidor', group: { logs: 'Registros de actividad', users: 'Usuarios Sudo', files: 'Archivos', permissions: 'Permisos' } },
    menu: { linuxAccount: 'Cuenta de Linux', settings: 'Ajustes', support: 'Soporte', servers: 'Servidores', logout: 'Cerrar sesión' },
    dash: { title: 'Resumen del sistema', lastUpdated: 'Última actualización: Ahora mismo', report: 'Ver informe', totalSudoFiles: 'Total de archivos Sudo', criticalN: 'Críticos: {n}', sudoUsers: 'Usuarios Sudo', integrityStatus: 'Estado de integridad', newAlerts: 'Nuevas alertas', actionNeeded: 'requiere acción', allClear: 'todo en orden', severityDist: 'Distribución por gravedad', totalIssues: 'Total de problemas', noScanData: 'Sin datos de escaneo — ejecuta un escaneo primero', scanActivity: 'Actividad de escaneo del sistema (24 horas)', scans: 'Escaneos', recentActivity: 'Actividad reciente', viewAllLogs: 'Ver todos los registros', noActivity: 'Aún no hay actividad — inicia sesión y ejecuta escaneos', colAdmin: 'Admin', colAction: 'Acción', colTime: 'Hora', colIp: 'Dirección IP', reportFail: 'Error al crear el informe: {msg}' },
    login: { subtitle: 'Panel de auditoría de seguridad', usernamePlaceholder: 'superadmin o email@dominio', passwordPlaceholder: 'Contraseña de tu cuenta del SO', signIn: 'Iniciar sesión' },
    settings: { language: 'Idioma', languageDesc: 'Elige el idioma de la interfaz' },
  },

  pt: {
    common: { loading: 'Carregando…', generating: 'Gerando…', save: 'Salvar', saved: 'Salvo', cancel: 'Cancelar', search: 'Pesquisar', all: 'Todos', today: 'Hoje', days7: '7 dias', next: 'Próximo', prev: 'Anterior', active: 'ativo', success: 'Sucesso', failed: 'Falhou', applyReload: 'Aplicar e recarregar' },
    sev: { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo' },
    nav: { dashboard: 'Painel', fleet: 'Frota', audit: 'Auditoria', sudo: 'Sudo', integrity: 'Integridade', logs: 'Registros', terminal: 'Terminal', replays: 'Gravações', servers: 'Servidores', users: 'Usuários', settings: 'Configurações', support: 'Suporte' },
    top: { systemHealth: 'Saúde do sistema', network: 'Rede', alerts: 'Alertas', searchPlaceholder: 'Pesquisar registros, usuários ou alertas…', searching: 'Pesquisando…', noResults: 'Nenhum resultado para "{q}"', serversCount: 'Servidores ({n})', manage: 'Gerenciar', fleetOverview: 'Visão geral da frota', noServer: 'Sem servidor', group: { logs: 'Registros de atividade', users: 'Usuários Sudo', files: 'Arquivos', permissions: 'Permissões' } },
    menu: { linuxAccount: 'Conta Linux', settings: 'Configurações', support: 'Suporte', servers: 'Servidores', logout: 'Sair' },
    dash: { title: 'Visão geral do sistema', lastUpdated: 'Última atualização: Agora mesmo', report: 'Ver relatório', totalSudoFiles: 'Total de arquivos Sudo', criticalN: 'Críticos: {n}', sudoUsers: 'Usuários Sudo', integrityStatus: 'Status de integridade', newAlerts: 'Novos alertas', actionNeeded: 'ação necessária', allClear: 'tudo certo', severityDist: 'Distribuição por gravidade', totalIssues: 'Total de problemas', noScanData: 'Sem dados de varredura — execute uma varredura primeiro', scanActivity: 'Atividade de varredura do sistema (24 horas)', scans: 'Varreduras', recentActivity: 'Atividade recente', viewAllLogs: 'Ver todos os registros', noActivity: 'Ainda sem atividade — faça login e execute varreduras', colAdmin: 'Admin', colAction: 'Ação', colTime: 'Hora', colIp: 'Endereço IP', reportFail: 'Falha ao criar relatório: {msg}' },
    login: { subtitle: 'Painel de auditoria de segurança', usernamePlaceholder: 'superadmin ou email@domínio', passwordPlaceholder: 'Senha da sua conta do SO', signIn: 'Entrar' },
    settings: { language: 'Idioma', languageDesc: 'Escolha o idioma da interface' },
  },

  fr: {
    common: { loading: 'Chargement…', generating: 'Génération…', save: 'Enregistrer', saved: 'Enregistré', cancel: 'Annuler', search: 'Rechercher', all: 'Tous', today: "Aujourd'hui", days7: '7 jours', next: 'Suivant', prev: 'Précédent', active: 'actif', success: 'Réussi', failed: 'Échec', applyReload: 'Appliquer et recharger' },
    sev: { critical: 'Critique', high: 'Élevé', medium: 'Moyen', low: 'Faible' },
    nav: { dashboard: 'Tableau de bord', fleet: 'Flotte', audit: 'Audit', sudo: 'Sudo', integrity: 'Intégrité', logs: 'Journaux', terminal: 'Terminal', replays: 'Enregistrements', servers: 'Serveurs', users: 'Utilisateurs', settings: 'Paramètres', support: 'Assistance' },
    top: { systemHealth: 'État du système', network: 'Réseau', alerts: 'Alertes', searchPlaceholder: 'Rechercher journaux, utilisateurs ou alertes…', searching: 'Recherche…', noResults: 'Aucun résultat pour "{q}"', serversCount: 'Serveurs ({n})', manage: 'Gérer', fleetOverview: 'Vue de la flotte', noServer: 'Aucun serveur', group: { logs: "Journaux d'activité", users: 'Utilisateurs Sudo', files: 'Fichiers', permissions: 'Autorisations' } },
    menu: { linuxAccount: 'Compte Linux', settings: 'Paramètres', support: 'Assistance', servers: 'Serveurs', logout: 'Déconnexion' },
    dash: { title: 'Aperçu du système', lastUpdated: 'Dernière mise à jour : à l’instant', report: 'Voir le rapport', totalSudoFiles: 'Total des fichiers Sudo', criticalN: 'Critiques : {n}', sudoUsers: 'Utilisateurs Sudo', integrityStatus: "État d'intégrité", newAlerts: 'Nouvelles alertes', actionNeeded: 'action requise', allClear: 'tout va bien', severityDist: 'Répartition par gravité', totalIssues: 'Total des problèmes', noScanData: 'Aucune donnée d’analyse — lancez d’abord une analyse', scanActivity: 'Activité d’analyse du système (24 heures)', scans: 'Analyses', recentActivity: 'Activité récente', viewAllLogs: 'Voir tous les journaux', noActivity: 'Aucune activité — connectez-vous et lancez des analyses', colAdmin: 'Admin', colAction: 'Action', colTime: 'Heure', colIp: 'Adresse IP', reportFail: 'Échec de la création du rapport : {msg}' },
    login: { subtitle: 'Tableau de bord d’audit de sécurité', usernamePlaceholder: 'superadmin ou email@domaine', passwordPlaceholder: 'Mot de passe de votre compte OS', signIn: 'Se connecter' },
    settings: { language: 'Langue', languageDesc: 'Choisissez la langue de l’interface' },
  },

  de: {
    common: { loading: 'Wird geladen…', generating: 'Wird erstellt…', save: 'Speichern', saved: 'Gespeichert', cancel: 'Abbrechen', search: 'Suchen', all: 'Alle', today: 'Heute', days7: '7 Tage', next: 'Weiter', prev: 'Zurück', active: 'aktiv', success: 'Erfolg', failed: 'Fehlgeschlagen', applyReload: 'Anwenden & neu laden' },
    sev: { critical: 'Kritisch', high: 'Hoch', medium: 'Mittel', low: 'Niedrig' },
    nav: { dashboard: 'Dashboard', fleet: 'Flotte', audit: 'Audit', sudo: 'Sudo', integrity: 'Integrität', logs: 'Protokolle', terminal: 'Terminal', replays: 'Aufzeichnungen', servers: 'Server', users: 'Benutzer', settings: 'Einstellungen', support: 'Support' },
    top: { systemHealth: 'Systemzustand', network: 'Netzwerk', alerts: 'Warnungen', searchPlaceholder: 'Protokolle, Benutzer oder Warnungen suchen…', searching: 'Suche…', noResults: 'Keine Ergebnisse für „{q}“', serversCount: 'Server ({n})', manage: 'Verwalten', fleetOverview: 'Flottenübersicht', noServer: 'Kein Server', group: { logs: 'Aktivitätsprotokolle', users: 'Sudo-Benutzer', files: 'Dateien', permissions: 'Berechtigungen' } },
    menu: { linuxAccount: 'Linux-Konto', settings: 'Einstellungen', support: 'Support', servers: 'Server', logout: 'Abmelden' },
    dash: { title: 'Systemübersicht', lastUpdated: 'Zuletzt aktualisiert: gerade eben', report: 'Bericht ansehen', totalSudoFiles: 'Sudo-Dateien gesamt', criticalN: 'Kritisch: {n}', sudoUsers: 'Sudo-Benutzer', integrityStatus: 'Integritätsstatus', newAlerts: 'Neue Warnungen', actionNeeded: 'Aktion erforderlich', allClear: 'alles in Ordnung', severityDist: 'Verteilung nach Schweregrad', totalIssues: 'Probleme gesamt', noScanData: 'Keine Scan-Daten — führen Sie zuerst einen Scan aus', scanActivity: 'System-Scan-Aktivität (24 Stunden)', scans: 'Scans', recentActivity: 'Letzte Aktivität', viewAllLogs: 'Alle Protokolle anzeigen', noActivity: 'Noch keine Aktivität — anmelden und Scans ausführen', colAdmin: 'Admin', colAction: 'Aktion', colTime: 'Zeit', colIp: 'IP-Adresse', reportFail: 'Bericht konnte nicht erstellt werden: {msg}' },
    login: { subtitle: 'Sicherheitsaudit-Dashboard', usernamePlaceholder: 'superadmin oder email@domain', passwordPlaceholder: 'Passwort Ihres OS-Kontos', signIn: 'Anmelden' },
    settings: { language: 'Sprache', languageDesc: 'Sprache der Oberfläche wählen' },
  },

  it: {
    common: { loading: 'Caricamento…', generating: 'Generazione…', save: 'Salva', saved: 'Salvato', cancel: 'Annulla', search: 'Cerca', all: 'Tutti', today: 'Oggi', days7: '7 giorni', next: 'Avanti', prev: 'Indietro', active: 'attivo', success: 'Successo', failed: 'Non riuscito', applyReload: 'Applica e ricarica' },
    sev: { critical: 'Critico', high: 'Alto', medium: 'Medio', low: 'Basso' },
    nav: { dashboard: 'Dashboard', fleet: 'Flotta', audit: 'Audit', sudo: 'Sudo', integrity: 'Integrità', logs: 'Log', terminal: 'Terminale', replays: 'Registrazioni', servers: 'Server', users: 'Utenti', settings: 'Impostazioni', support: 'Supporto' },
    top: { systemHealth: 'Stato del sistema', network: 'Rete', alerts: 'Avvisi', searchPlaceholder: 'Cerca log, utenti o avvisi…', searching: 'Ricerca…', noResults: 'Nessun risultato per "{q}"', serversCount: 'Server ({n})', manage: 'Gestisci', fleetOverview: 'Panoramica flotta', noServer: 'Nessun server', group: { logs: 'Log attività', users: 'Utenti Sudo', files: 'File', permissions: 'Autorizzazioni' } },
    menu: { linuxAccount: 'Account Linux', settings: 'Impostazioni', support: 'Supporto', servers: 'Server', logout: 'Esci' },
    dash: { title: 'Panoramica del sistema', lastUpdated: 'Ultimo aggiornamento: proprio ora', report: 'Vedi report', totalSudoFiles: 'Totale file Sudo', criticalN: 'Critici: {n}', sudoUsers: 'Utenti Sudo', integrityStatus: 'Stato integrità', newAlerts: 'Nuovi avvisi', actionNeeded: 'azione necessaria', allClear: 'tutto a posto', severityDist: 'Distribuzione per gravità', totalIssues: 'Totale problemi', noScanData: 'Nessun dato di scansione — esegui prima una scansione', scanActivity: 'Attività di scansione del sistema (24 ore)', scans: 'Scansioni', recentActivity: 'Attività recente', viewAllLogs: 'Vedi tutti i log', noActivity: 'Nessuna attività — accedi ed esegui scansioni', colAdmin: 'Admin', colAction: 'Azione', colTime: 'Ora', colIp: 'Indirizzo IP', reportFail: 'Creazione del report non riuscita: {msg}' },
    login: { subtitle: 'Dashboard di audit della sicurezza', usernamePlaceholder: 'superadmin o email@dominio', passwordPlaceholder: 'Password del tuo account OS', signIn: 'Accedi' },
    settings: { language: 'Lingua', languageDesc: 'Scegli la lingua dell’interfaccia' },
  },

  ru: {
    common: { loading: 'Загрузка…', generating: 'Создание…', save: 'Сохранить', saved: 'Сохранено', cancel: 'Отмена', search: 'Поиск', all: 'Все', today: 'Сегодня', days7: '7 дней', next: 'Далее', prev: 'Назад', active: 'активно', success: 'Успешно', failed: 'Ошибка', applyReload: 'Применить и перезагрузить' },
    sev: { critical: 'Критический', high: 'Высокий', medium: 'Средний', low: 'Низкий' },
    nav: { dashboard: 'Панель', fleet: 'Флот', audit: 'Аудит', sudo: 'Sudo', integrity: 'Целостность', logs: 'Журналы', terminal: 'Терминал', replays: 'Записи', servers: 'Серверы', users: 'Пользователи', settings: 'Настройки', support: 'Поддержка' },
    top: { systemHealth: 'Состояние системы', network: 'Сеть', alerts: 'Оповещения', searchPlaceholder: 'Поиск журналов, пользователей или оповещений…', searching: 'Поиск…', noResults: 'Нет результатов для «{q}»', serversCount: 'Серверы ({n})', manage: 'Управление', fleetOverview: 'Обзор флота', noServer: 'Нет сервера', group: { logs: 'Журналы активности', users: 'Пользователи Sudo', files: 'Файлы', permissions: 'Разрешения' } },
    menu: { linuxAccount: 'Учётная запись Linux', settings: 'Настройки', support: 'Поддержка', servers: 'Серверы', logout: 'Выйти' },
    dash: { title: 'Обзор системы', lastUpdated: 'Обновлено: только что', report: 'Открыть отчёт', totalSudoFiles: 'Всего файлов Sudo', criticalN: 'Критические: {n}', sudoUsers: 'Пользователи Sudo', integrityStatus: 'Статус целостности', newAlerts: 'Новые оповещения', actionNeeded: 'требуется действие', allClear: 'всё в порядке', severityDist: 'Распределение по уровню серьёзности', totalIssues: 'Всего проблем', noScanData: 'Нет данных сканирования — сначала запустите проверку', scanActivity: 'Активность сканирования системы (24 часа)', scans: 'Проверки', recentActivity: 'Недавняя активность', viewAllLogs: 'Показать все журналы', noActivity: 'Пока нет активности — войдите и запустите проверки', colAdmin: 'Админ', colAction: 'Действие', colTime: 'Время', colIp: 'IP-адрес', reportFail: 'Не удалось создать отчёт: {msg}' },
    login: { subtitle: 'Панель аудита безопасности', usernamePlaceholder: 'superadmin или email@domain', passwordPlaceholder: 'Пароль учётной записи ОС', signIn: 'Войти' },
    settings: { language: 'Язык', languageDesc: 'Выберите язык интерфейса' },
  },

  uk: {
    common: { loading: 'Завантаження…', generating: 'Створення…', save: 'Зберегти', saved: 'Збережено', cancel: 'Скасувати', search: 'Пошук', all: 'Усі', today: 'Сьогодні', days7: '7 днів', next: 'Далі', prev: 'Назад', active: 'активний', success: 'Успіх', failed: 'Помилка', applyReload: 'Застосувати та перезавантажити' },
    sev: { critical: 'Критичний', high: 'Високий', medium: 'Середній', low: 'Низький' },
    nav: { dashboard: 'Панель', fleet: 'Флот', audit: 'Аудит', sudo: 'Sudo', integrity: 'Цілісність', logs: 'Журнали', terminal: 'Термінал', replays: 'Записи', servers: 'Сервери', users: 'Користувачі', settings: 'Налаштування', support: 'Підтримка' },
    top: { systemHealth: 'Стан системи', network: 'Мережа', alerts: 'Сповіщення', searchPlaceholder: 'Пошук журналів, користувачів або сповіщень…', searching: 'Пошук…', noResults: 'Немає результатів для «{q}»', serversCount: 'Сервери ({n})', manage: 'Керувати', fleetOverview: 'Огляд флоту', noServer: 'Немає сервера', group: { logs: 'Журнали активності', users: 'Користувачі Sudo', files: 'Файли', permissions: 'Дозволи' } },
    menu: { linuxAccount: 'Обліковий запис Linux', settings: 'Налаштування', support: 'Підтримка', servers: 'Сервери', logout: 'Вийти' },
    dash: { title: 'Огляд системи', lastUpdated: 'Останнє оновлення: щойно', report: 'Переглянути звіт', totalSudoFiles: 'Усього файлів Sudo', criticalN: 'Критичні: {n}', sudoUsers: 'Користувачі Sudo', integrityStatus: 'Статус цілісності', newAlerts: 'Нові сповіщення', actionNeeded: 'потрібна дія', allClear: 'усе гаразд', severityDist: 'Розподіл за рівнем серйозності', totalIssues: 'Усього проблем', noScanData: 'Немає даних сканування — спершу запустіть перевірку', scanActivity: 'Активність сканування системи (24 години)', scans: 'Перевірки', recentActivity: 'Нещодавня активність', viewAllLogs: 'Переглянути всі журнали', noActivity: 'Поки немає активності — увійдіть і запустіть перевірки', colAdmin: 'Адмін', colAction: 'Дія', colTime: 'Час', colIp: 'IP-адреса', reportFail: 'Не вдалося створити звіт: {msg}' },
    login: { subtitle: 'Панель аудиту безпеки', usernamePlaceholder: 'superadmin або email@domain', passwordPlaceholder: 'Пароль облікового запису ОС', signIn: 'Увійти' },
    settings: { language: 'Мова', languageDesc: 'Виберіть мову інтерфейсу' },
  },

  pl: {
    common: { loading: 'Ładowanie…', generating: 'Generowanie…', save: 'Zapisz', saved: 'Zapisano', cancel: 'Anuluj', search: 'Szukaj', all: 'Wszystkie', today: 'Dziś', days7: '7 dni', next: 'Dalej', prev: 'Wstecz', active: 'aktywny', success: 'Sukces', failed: 'Niepowodzenie', applyReload: 'Zastosuj i przeładuj' },
    sev: { critical: 'Krytyczny', high: 'Wysoki', medium: 'Średni', low: 'Niski' },
    nav: { dashboard: 'Pulpit', fleet: 'Flota', audit: 'Audyt', sudo: 'Sudo', integrity: 'Integralność', logs: 'Dzienniki', terminal: 'Terminal', replays: 'Nagrania', servers: 'Serwery', users: 'Użytkownicy', settings: 'Ustawienia', support: 'Wsparcie' },
    top: { systemHealth: 'Stan systemu', network: 'Sieć', alerts: 'Alerty', searchPlaceholder: 'Szukaj dzienników, użytkowników lub alertów…', searching: 'Wyszukiwanie…', noResults: 'Brak wyników dla „{q}”', serversCount: 'Serwery ({n})', manage: 'Zarządzaj', fleetOverview: 'Przegląd floty', noServer: 'Brak serwera', group: { logs: 'Dzienniki aktywności', users: 'Użytkownicy Sudo', files: 'Pliki', permissions: 'Uprawnienia' } },
    menu: { linuxAccount: 'Konto Linux', settings: 'Ustawienia', support: 'Wsparcie', servers: 'Serwery', logout: 'Wyloguj' },
    dash: { title: 'Przegląd systemu', lastUpdated: 'Ostatnia aktualizacja: przed chwilą', report: 'Zobacz raport', totalSudoFiles: 'Łączna liczba plików Sudo', criticalN: 'Krytyczne: {n}', sudoUsers: 'Użytkownicy Sudo', integrityStatus: 'Stan integralności', newAlerts: 'Nowe alerty', actionNeeded: 'wymaga działania', allClear: 'wszystko w porządku', severityDist: 'Rozkład poziomów ważności', totalIssues: 'Łączna liczba problemów', noScanData: 'Brak danych skanowania — najpierw uruchom skanowanie', scanActivity: 'Aktywność skanowania systemu (24 godziny)', scans: 'Skanowania', recentActivity: 'Ostatnia aktywność', viewAllLogs: 'Zobacz wszystkie dzienniki', noActivity: 'Brak aktywności — zaloguj się i uruchom skanowania', colAdmin: 'Admin', colAction: 'Akcja', colTime: 'Czas', colIp: 'Adres IP', reportFail: 'Nie udało się utworzyć raportu: {msg}' },
    login: { subtitle: 'Pulpit audytu bezpieczeństwa', usernamePlaceholder: 'superadmin lub email@domena', passwordPlaceholder: 'Hasło Twojego konta systemowego', signIn: 'Zaloguj się' },
    settings: { language: 'Język', languageDesc: 'Wybierz język interfejsu' },
  },

  tr: {
    common: { loading: 'Yükleniyor…', generating: 'Oluşturuluyor…', save: 'Kaydet', saved: 'Kaydedildi', cancel: 'İptal', search: 'Ara', all: 'Tümü', today: 'Bugün', days7: '7 Gün', next: 'İleri', prev: 'Geri', active: 'etkin', success: 'Başarılı', failed: 'Başarısız', applyReload: 'Uygula ve yeniden yükle' },
    sev: { critical: 'Kritik', high: 'Yüksek', medium: 'Orta', low: 'Düşük' },
    nav: { dashboard: 'Panel', fleet: 'Filo', audit: 'Denetim', sudo: 'Sudo', integrity: 'Bütünlük', logs: 'Günlükler', terminal: 'Terminal', replays: 'Kayıtlar', servers: 'Sunucular', users: 'Kullanıcılar', settings: 'Ayarlar', support: 'Destek' },
    top: { systemHealth: 'Sistem Durumu', network: 'Ağ', alerts: 'Uyarılar', searchPlaceholder: 'Günlük, kullanıcı veya uyarı ara…', searching: 'Aranıyor…', noResults: '"{q}" için sonuç yok', serversCount: 'Sunucular ({n})', manage: 'Yönet', fleetOverview: 'Filo Genel Bakışı', noServer: 'Sunucu yok', group: { logs: 'Etkinlik Günlükleri', users: 'Sudo Kullanıcıları', files: 'Dosyalar', permissions: 'İzinler' } },
    menu: { linuxAccount: 'Linux Hesabı', settings: 'Ayarlar', support: 'Destek', servers: 'Sunucular', logout: 'Çıkış Yap' },
    dash: { title: 'Sistem Genel Bakışı', lastUpdated: 'Son güncelleme: Az önce', report: 'Raporu Görüntüle', totalSudoFiles: 'Toplam Sudo Dosyası', criticalN: 'Kritik: {n}', sudoUsers: 'Sudo Kullanıcıları', integrityStatus: 'Bütünlük Durumu', newAlerts: 'Yeni Uyarılar', actionNeeded: 'işlem gerekli', allClear: 'her şey yolunda', severityDist: 'Önem Düzeyi Dağılımı', totalIssues: 'Toplam Sorun', noScanData: 'Tarama verisi yok — önce bir tarama çalıştırın', scanActivity: 'Sistem Tarama Etkinliği (24 Saat)', scans: 'Taramalar', recentActivity: 'Son Etkinlik', viewAllLogs: 'Tüm Günlükleri Gör', noActivity: 'Henüz etkinlik yok — giriş yapın ve tarama çalıştırın', colAdmin: 'Yönetici', colAction: 'İşlem', colTime: 'Zaman', colIp: 'IP Adresi', reportFail: 'Rapor oluşturulamadı: {msg}' },
    login: { subtitle: 'Güvenlik Denetim Paneli', usernamePlaceholder: 'superadmin veya email@alanadi', passwordPlaceholder: 'İşletim sistemi hesabı parolanız', signIn: 'Giriş Yap' },
    settings: { language: 'Dil', languageDesc: 'Arayüz dilini seçin' },
  },

  vi: {
    common: { loading: 'Đang tải…', generating: 'Đang tạo…', save: 'Lưu', saved: 'Đã lưu', cancel: 'Hủy', search: 'Tìm kiếm', all: 'Tất cả', today: 'Hôm nay', days7: '7 ngày', next: 'Tiếp', prev: 'Trước', active: 'hoạt động', success: 'Thành công', failed: 'Thất bại', applyReload: 'Áp dụng & tải lại' },
    sev: { critical: 'Nghiêm trọng', high: 'Cao', medium: 'Trung bình', low: 'Thấp' },
    nav: { dashboard: 'Bảng điều khiển', fleet: 'Đội máy', audit: 'Kiểm toán', sudo: 'Sudo', integrity: 'Toàn vẹn', logs: 'Nhật ký', terminal: 'Terminal', replays: 'Bản ghi', servers: 'Máy chủ', users: 'Người dùng', settings: 'Cài đặt', support: 'Hỗ trợ' },
    top: { systemHealth: 'Tình trạng hệ thống', network: 'Mạng', alerts: 'Cảnh báo', searchPlaceholder: 'Tìm nhật ký, người dùng hoặc cảnh báo…', searching: 'Đang tìm…', noResults: 'Không có kết quả cho "{q}"', serversCount: 'Máy chủ ({n})', manage: 'Quản lý', fleetOverview: 'Tổng quan đội máy', noServer: 'Không có máy chủ', group: { logs: 'Nhật ký hoạt động', users: 'Người dùng Sudo', files: 'Tệp', permissions: 'Quyền' } },
    menu: { linuxAccount: 'Tài khoản Linux', settings: 'Cài đặt', support: 'Hỗ trợ', servers: 'Máy chủ', logout: 'Đăng xuất' },
    dash: { title: 'Tổng quan hệ thống', lastUpdated: 'Cập nhật lần cuối: Vừa xong', report: 'Xem báo cáo', totalSudoFiles: 'Tổng số tệp Sudo', criticalN: 'Nghiêm trọng: {n}', sudoUsers: 'Người dùng Sudo', integrityStatus: 'Trạng thái toàn vẹn', newAlerts: 'Cảnh báo mới', actionNeeded: 'cần xử lý', allClear: 'mọi thứ ổn', severityDist: 'Phân bố mức độ nghiêm trọng', totalIssues: 'Tổng số vấn đề', noScanData: 'Chưa có dữ liệu quét — hãy chạy quét trước', scanActivity: 'Hoạt động quét hệ thống (24 giờ)', scans: 'Lần quét', recentActivity: 'Hoạt động gần đây', viewAllLogs: 'Xem tất cả nhật ký', noActivity: 'Chưa có hoạt động — đăng nhập và chạy quét', colAdmin: 'Quản trị', colAction: 'Hành động', colTime: 'Thời gian', colIp: 'Địa chỉ IP', reportFail: 'Không thể tạo báo cáo: {msg}' },
    login: { subtitle: 'Bảng kiểm toán bảo mật', usernamePlaceholder: 'superadmin hoặc email@tenmien', passwordPlaceholder: 'Mật khẩu tài khoản hệ điều hành', signIn: 'Đăng nhập' },
    settings: { language: 'Ngôn ngữ', languageDesc: 'Chọn ngôn ngữ giao diện' },
  },

  th: {
    common: { loading: 'กำลังโหลด…', generating: 'กำลังสร้าง…', save: 'บันทึก', saved: 'บันทึกแล้ว', cancel: 'ยกเลิก', search: 'ค้นหา', all: 'ทั้งหมด', today: 'วันนี้', days7: '7 วัน', next: 'ถัดไป', prev: 'ก่อนหน้า', active: 'ใช้งาน', success: 'สำเร็จ', failed: 'ล้มเหลว', applyReload: 'ใช้และโหลดใหม่' },
    sev: { critical: 'วิกฤต', high: 'สูง', medium: 'ปานกลาง', low: 'ต่ำ' },
    nav: { dashboard: 'แดชบอร์ด', fleet: 'ฟลีต', audit: 'ตรวจสอบ', sudo: 'Sudo', integrity: 'ความสมบูรณ์', logs: 'บันทึก', terminal: 'เทอร์มินัล', replays: 'การบันทึก', servers: 'เซิร์ฟเวอร์', users: 'ผู้ใช้', settings: 'การตั้งค่า', support: 'สนับสนุน' },
    top: { systemHealth: 'สถานะระบบ', network: 'เครือข่าย', alerts: 'การแจ้งเตือน', searchPlaceholder: 'ค้นหาบันทึก ผู้ใช้ หรือการแจ้งเตือน…', searching: 'กำลังค้นหา…', noResults: 'ไม่พบผลลัพธ์สำหรับ "{q}"', serversCount: 'เซิร์ฟเวอร์ ({n})', manage: 'จัดการ', fleetOverview: 'ภาพรวมฟลีต', noServer: 'ไม่มีเซิร์ฟเวอร์', group: { logs: 'บันทึกกิจกรรม', users: 'ผู้ใช้ Sudo', files: 'ไฟล์', permissions: 'สิทธิ์' } },
    menu: { linuxAccount: 'บัญชี Linux', settings: 'การตั้งค่า', support: 'สนับสนุน', servers: 'เซิร์ฟเวอร์', logout: 'ออกจากระบบ' },
    dash: { title: 'ภาพรวมระบบ', lastUpdated: 'อัปเดตล่าสุด: เมื่อสักครู่', report: 'ดูรายงาน', totalSudoFiles: 'ไฟล์ Sudo ทั้งหมด', criticalN: 'วิกฤต: {n}', sudoUsers: 'ผู้ใช้ Sudo', integrityStatus: 'สถานะความสมบูรณ์', newAlerts: 'การแจ้งเตือนใหม่', actionNeeded: 'ต้องดำเนินการ', allClear: 'ปกติดี', severityDist: 'การกระจายระดับความรุนแรง', totalIssues: 'ปัญหาทั้งหมด', noScanData: 'ไม่มีข้อมูลการสแกน — โปรดเริ่มสแกนก่อน', scanActivity: 'กิจกรรมการสแกนระบบ (24 ชั่วโมง)', scans: 'การสแกน', recentActivity: 'กิจกรรมล่าสุด', viewAllLogs: 'ดูบันทึกทั้งหมด', noActivity: 'ยังไม่มีกิจกรรม — เข้าสู่ระบบและเริ่มสแกน', colAdmin: 'ผู้ดูแล', colAction: 'การกระทำ', colTime: 'เวลา', colIp: 'ที่อยู่ IP', reportFail: 'สร้างรายงานไม่สำเร็จ: {msg}' },
    login: { subtitle: 'แดชบอร์ดตรวจสอบความปลอดภัย', usernamePlaceholder: 'superadmin หรือ email@domain', passwordPlaceholder: 'รหัสผ่านบัญชีระบบปฏิบัติการของคุณ', signIn: 'เข้าสู่ระบบ' },
    settings: { language: 'ภาษา', languageDesc: 'เลือกภาษาของอินเทอร์เฟซ' },
  },

  nl: {
    common: { loading: 'Laden…', generating: 'Genereren…', save: 'Opslaan', saved: 'Opgeslagen', cancel: 'Annuleren', search: 'Zoeken', all: 'Alle', today: 'Vandaag', days7: '7 dagen', next: 'Volgende', prev: 'Vorige', active: 'actief', success: 'Gelukt', failed: 'Mislukt', applyReload: 'Toepassen & herladen' },
    sev: { critical: 'Kritiek', high: 'Hoog', medium: 'Gemiddeld', low: 'Laag' },
    nav: { dashboard: 'Dashboard', fleet: 'Vloot', audit: 'Audit', sudo: 'Sudo', integrity: 'Integriteit', logs: 'Logboeken', terminal: 'Terminal', replays: 'Opnamen', servers: 'Servers', users: 'Gebruikers', settings: 'Instellingen', support: 'Ondersteuning' },
    top: { systemHealth: 'Systeemstatus', network: 'Netwerk', alerts: 'Meldingen', searchPlaceholder: 'Zoek logboeken, gebruikers of meldingen…', searching: 'Zoeken…', noResults: 'Geen resultaten voor "{q}"', serversCount: 'Servers ({n})', manage: 'Beheren', fleetOverview: 'Vlootoverzicht', noServer: 'Geen server', group: { logs: 'Activiteitenlogboeken', users: 'Sudo-gebruikers', files: 'Bestanden', permissions: 'Machtigingen' } },
    menu: { linuxAccount: 'Linux-account', settings: 'Instellingen', support: 'Ondersteuning', servers: 'Servers', logout: 'Afmelden' },
    dash: { title: 'Systeemoverzicht', lastUpdated: 'Laatst bijgewerkt: zojuist', report: 'Rapport bekijken', totalSudoFiles: 'Totaal Sudo-bestanden', criticalN: 'Kritiek: {n}', sudoUsers: 'Sudo-gebruikers', integrityStatus: 'Integriteitsstatus', newAlerts: 'Nieuwe meldingen', actionNeeded: 'actie vereist', allClear: 'alles in orde', severityDist: 'Verdeling naar ernst', totalIssues: 'Totaal problemen', noScanData: 'Geen scangegevens — voer eerst een scan uit', scanActivity: 'Systeemscanactiviteit (24 uur)', scans: 'Scans', recentActivity: 'Recente activiteit', viewAllLogs: 'Alle logboeken bekijken', noActivity: 'Nog geen activiteit — log in en voer scans uit', colAdmin: 'Beheerder', colAction: 'Actie', colTime: 'Tijd', colIp: 'IP-adres', reportFail: 'Rapport maken mislukt: {msg}' },
    login: { subtitle: 'Beveiligingsaudit-dashboard', usernamePlaceholder: 'superadmin of email@domein', passwordPlaceholder: 'Wachtwoord van je OS-account', signIn: 'Aanmelden' },
    settings: { language: 'Taal', languageDesc: 'Kies de taal van de interface' },
  },
}
