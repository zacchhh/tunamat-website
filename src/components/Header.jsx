export default function Header({ count }) {
  return (
    <header className="bg-bark text-cream px-6 py-5">
      <div className="max-w-7xl mx-auto flex items-baseline gap-4 flex-wrap">
        <span className="text-xs tracking-[0.25em] uppercase font-sans font-semibold text-earth-light">
          TunaMat
        </span>
        <h1 className="font-serif text-2xl md:text-3xl text-cream m-0 leading-tight">
          Movement Explorer
        </h1>
        <span className="text-sm text-earth-light ml-auto">
          {count > 0 && `${count} movements`}
        </span>
      </div>
    </header>
  )
}
