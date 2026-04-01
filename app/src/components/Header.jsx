export default function Header({ count }) {
  return (
    <header className="bg-surface border-b border-card-border px-5 py-3 flex items-center gap-4 shrink-0 z-20 relative"
      style={{ boxShadow: '0 4px 24px rgba(10, 8, 20, 0.5)' }}>
      <div className="flex items-baseline gap-3 min-w-0">
        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-purple select-none">
          TunaMat
        </span>
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
