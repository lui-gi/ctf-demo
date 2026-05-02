// Shared types contract with Bosun's REST API (spec §2 + §3).
// These are intentionally narrow — Bosun is the source of truth and we
// expand here as endpoints land.

export type IslandStatus = 'draft' | 'published' | 'archived';

export type IslandCategory =
  | 'cursed_ports'
  | 'cipher_cove'
  | 'shipwrights_forge'
  | 'lighthouse'
  | 'crows_nest'
  | 'hidden_cargo'
  | 'keymaster';

export type IslandDifficulty = 'port' | 'open_sea' | 'cursed_depths';

export interface Whisper {
  id: string;
  ordinal: 1 | 2 | 3;
  body_md: string;
  cost_points: number;
  /** Whether the current Crew has revealed it (server-decorated). */
  revealed?: boolean;
}

export interface IslandSummary {
  id: string;
  slug: string;
  title: string;
  category: IslandCategory;
  difficulty: IslandDifficulty;
  current_points: number;
  base_points: number;
  status: IslandStatus;
  solved_by_crew?: boolean;
  first_blood_crew_name?: string | null;
  solve_count?: number;
}

export interface IslandFile {
  name: string;
  url: string;
  size_bytes?: number;
}

export interface IslandDetail extends IslandSummary {
  description_md: string;
  files: IslandFile[];
  whispers: Whisper[];
  sandbox_image?: string | null;
}

export interface SubmitResult {
  correct: boolean;
  awarded_points: number;
  crew_name: string;
  first_blood?: boolean;
  message?: string;
}

export interface ChartsRow {
  rank: number;
  crew_id: string;
  crew_name: string;
  flag_emoji?: string | null;
  score: number;
  last_solve_at: string | null;
  solves: number;
}

export interface ChartsSnapshot {
  rows: ChartsRow[];
  frozen: boolean;
  generated_at: string;
}

export interface CrewProfile {
  id: string;
  name: string;
  flag_emoji?: string | null;
  invite_code?: string;
  members: { id: string; handle: string; role: 'pirate' | 'admin' }[];
  solved: { island_slug: string; island_title: string; awarded_points: number; solved_at: string }[];
  total_score: number;
  created_at: string;
}

export interface AuthMe {
  id: string;
  handle: string;
  email: string;
  role: 'pirate' | 'admin';
  crew?: { id: string; name: string; flag_emoji?: string | null } | null;
}

export interface AdminSubmissionRow {
  id: number;
  created_at: string;
  crew_id: string | null;
  crew_name: string | null;
  pirate_id: string | null;
  pirate_handle: string | null;
  island_id: string;
  island_slug: string;
  submitted: string;
  is_correct: boolean;
  awarded_points: number;
  ip: string | null;
}
