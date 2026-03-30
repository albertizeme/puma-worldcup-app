export default function StatsCards() {
  const stats = [
    { label: 'Rank', value: '#12' },
    { label: 'Points', value: '110' },
    { label: 'Bonus', value: '+14' },
  ]

  return (
    <section className="mb-4 grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-black/45">
            {stat.label}
          </p>
          <p className="mt-2 text-2xl font-black">{stat.value}</p>
        </div>
      ))}
    </section>
  )
}