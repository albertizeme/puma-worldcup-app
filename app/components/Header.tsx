type HeaderProps = {
  title: string
  subtitle: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="mb-5 rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-orange-500 p-5 text-white shadow-lg">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/75">
        PUMA Internal PoC
      </p>
      <h1 className="mt-2 text-3xl font-black">{title}</h1>
      <p className="mt-2 text-sm text-white/90">{subtitle}</p>
    </header>
  )
}