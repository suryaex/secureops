// Bendera negara berbasis SVG (flag-icons), bukan emoji.
//
// Kenapa: emoji bendera (regional indicator, mis. 🇮🇩) TIDAK punya glyph di
// font Windows (Segoe UI Emoji), sehingga di browser Windows hanya tampil
// dua huruf kode negara ("ID", "GB", ...). Di Linux/Fedora (Noto Color Emoji)
// bendera tampil normal — itu sebabnya bug ini hanya muncul di Windows.
// Solusi: render bendera sebagai SVG yang konsisten di semua platform
// (Windows, Linux, macOS, Android/iOS via Capacitor) dan offline.

// Ubah string emoji bendera menjadi kode flag-icons (ISO 3166-1 alpha-2).
// Emoji bendera tersusun dari dua "regional indicator" yang langsung
// memetakan ke kode negara: 🇮🇩 = RI-'I' + RI-'D' → "id".
function flagToCode(flag) {
  if (!flag) return null
  // Bendera subdivisi (tag sequence), mis. Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿 → "gb-wls".
  if (flag.includes('\u{E0077}')) return 'gb-wls' // tag latin small 'w'
  const indicators = [...flag]
    .map((ch) => ch.codePointAt(0))
    .filter((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff)
  if (indicators.length >= 2) {
    return indicators
      .slice(0, 2)
      .map((cp) => String.fromCharCode(cp - 0x1f1e6 + 0x61))
      .join('')
  }
  return null // mis. globe 🌍 (Esperanto) — tak ada negara.
}

// Render satu bendera. `flag` adalah string emoji dari languages.js.
export default function Flag({ flag, className = '' }) {
  const code = flagToCode(flag)
  if (!code) {
    // Tidak ada negara (mis. Esperanto) → ikon globe netral.
    return (
      <span
        className={`material-symbols-outlined text-base leading-none ${className}`}
        aria-hidden="true"
      >
        language
      </span>
    )
  }
  return (
    <span
      className={`fi fi-${code} rounded-[2px] shadow-sm ${className}`}
      role="img"
      aria-hidden="true"
    />
  )
}
