// components/match/PumaHighlightCard.tsx
import { getPumaImage, TeamMeta } from "@/lib/match-detail";

type Props = {
  isDualPuma: boolean;
  pumaTeams: TeamMeta[];
  primaryPumaTeam: TeamMeta | null;
  text: string | null;
};

export default function PumaHighlightCard({
  isDualPuma,
  pumaTeams,
  primaryPumaTeam,
  text,
}: Props) {
  if (!pumaTeams.length) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-sm">
      <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
        <div className="p-5 sm:p-6">
          <div className="mb-3">
            <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
              Showtime
            </span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {isDualPuma
              ? `${pumaTeams[0].name} vs ${pumaTeams[1].name}`
              : primaryPumaTeam?.sponsor_card_title ||
                `PUMA x ${primaryPumaTeam?.name}`}
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {text}
          </p>
        </div>

        {isDualPuma ? (
          <div className="grid min-h-[220px] grid-cols-2 divide-x divide-white/20 bg-slate-100">
            {pumaTeams.map((team) => {
              const teamImage = getPumaImage(team);

              return teamImage ? (
                <div key={team.id} className="relative min-h-[220px]">
                  <img
                    src={teamImage}
                    alt={`Imagen PUMA de ${team.name}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                    <div className="text-sm font-bold text-white">
                      {team.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={team.id}
                  className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-orange-100 via-white to-red-100 p-6"
                >
                  <div className="text-center">
                    <div className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">
                      PUMA
                    </div>
                    <div className="mt-2 text-lg font-semibold text-slate-700">
                      {team.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="min-h-[220px] bg-slate-100">
            {getPumaImage(primaryPumaTeam) ? (
              <img
                src={getPumaImage(primaryPumaTeam) ?? ""}
                alt={`Imagen PUMA de ${primaryPumaTeam?.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-orange-100 via-white to-red-100 p-6">
                <div className="text-center">
                  <div className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">
                    PUMA
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-700">
                    {primaryPumaTeam?.name}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}