// components/match/MatchOutcomeCard.tsx
type Props = {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  containerClass: string;
  badgeClass: string;
};

export default function MatchOutcomeCard({
  badge,
  title,
  subtitle,
  description,
  containerClass,
  badgeClass,
}: Props) {
  return (
    <section
      className={`rounded-3xl border px-5 py-5 shadow-sm sm:px-6 ${containerClass}`}
    >
      <div className="mb-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
        >
          {badge}
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="text-lg font-semibold">{subtitle}</p>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </section>
  );
}