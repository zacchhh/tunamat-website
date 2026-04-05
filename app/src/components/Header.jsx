export default function Header({ count }) {
  return (
    <header className="bg-surface border-b border-card-border px-5 py-3 flex items-center gap-4 shrink-0 z-20 relative"
      style={{ boxShadow: '0 4px 24px rgba(10, 8, 20, 0.5)' }}>
      <a href="/tunamat"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium no-underline shrink-0 transition-all"
        style={{ background: 'rgba(166,117,255,0.1)', border: '1px solid rgba(166,117,255,0.25)', color: '#A675FF' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(166,117,255,0.2)'; e.currentTarget.style.borderColor = 'rgba(166,117,255,0.4)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(166,117,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(166,117,255,0.25)' }}
      >&larr; TunaMat</a>
      <div className="flex items-baseline gap-3 min-w-0">
        <h1 className="text-lg md:text-xl text-text/90 m-0 leading-none whitespace-nowrap font-semibold">
          Movement Explorer
        </h1>
      </div>
      <div className="ml-auto text-xs text-text-muted font-medium tabular-nums">
        {count > 0 && (
          <>
            <span className="text-purple font-semibold">{count}</span>
            <span className="ml-1 text-text-dim">movements</span>
          </>
        )}
      </div>
    </header>
  )
}
