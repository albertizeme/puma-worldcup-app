export type ChampionTeam = {
  id: string;
  name: string;
  flag_code: string | null;
  is_puma_team?: boolean | null;
};

export type ChampionPrediction = {
  id: string;
  user_id: string;
  predicted_team_id: string;
  created_at: string;
  updated_at: string;
};

export type ChampionPageData = {
  teams: ChampionTeam[];
  prediction: ChampionPrediction | null;
  deadline: string | null;
  isOpen: boolean;
};