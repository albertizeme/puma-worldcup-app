const TEAM_TO_FLAG: Record<string, string> = {
  Portugal: "pt",
  Mexico: "mx",
  Brazil: "br",
  Switzerland: "ch",
  Morocco: "ma",
  USA: "us",
  Ghana: "gh",
  Netherlands: "nl",
  France: "fr",
  Japan: "jp",
};

export function resolveFlagCode(
  flagCode: string | null | undefined,
  teamName: string | null | undefined
): string | null {
  const cleanFlag = flagCode?.trim().toLowerCase();

  if (cleanFlag && cleanFlag.length === 2) {
    return cleanFlag;
  }

  if (!teamName) return null;

  return TEAM_TO_FLAG[teamName] ?? null;
}