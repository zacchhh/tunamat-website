const VARIANTS = {
  solid: 'bg-sage-bg text-sage border border-sage/20',
  outline: 'bg-transparent text-slate border border-slate-light/50 border-dashed',
  earth: 'bg-earth-bg text-earth border border-earth/20',
  clay: 'bg-clay-bg text-clay border border-clay/20',
  moss: 'bg-moss-bg text-moss border border-moss/20',
  slate: 'bg-slate-bg text-slate border border-slate/20',
}

export default function Badge({ children, variant = 'solid', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  )
}
