const VARIANTS = {
  purple: { border: 'rgba(166,117,255,0.4)', text: '#A675FF', hoverBg: 'rgba(166,117,255,0.12)' },
  orange: { border: 'rgba(245,160,64,0.4)', text: '#F5A040', hoverBg: 'rgba(245,160,64,0.12)' },
  teal: { border: 'rgba(60,200,180,0.4)', text: '#3CC8B4', hoverBg: 'rgba(60,200,180,0.12)' },
  pink: { border: 'rgba(232,93,159,0.4)', text: '#E85D9F', hoverBg: 'rgba(232,93,159,0.12)' },
  gold: { border: 'rgba(212,184,72,0.4)', text: '#D4B848', hoverBg: 'rgba(212,184,72,0.12)' },
  green: { border: 'rgba(52,199,89,0.4)', text: '#34C759', hoverBg: 'rgba(52,199,89,0.12)' },
  muted: { border: 'rgba(139,132,168,0.3)', text: '#8B84A8', hoverBg: 'rgba(139,132,168,0.1)' },
}

export default function Badge({ children, variant = 'purple', className = '' }) {
  const v = VARIANTS[variant] || VARIANTS.purple
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${className}`}
      style={{
        border: `1px solid ${v.border}`,
        color: v.text,
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = v.hoverBg }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {children}
    </span>
  )
}
