export interface User {
  id: string
  username: string
  email: string
}

export interface CrewRank {
  crewName: string
  rank: number
}

export interface Category {
  slug: string
  name: string
  icon: string
  typeName: string
  totalChallenges: number
  solvedChallenges: number
}

export interface Challenge {
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  solved: boolean
}

export interface Question {
  id: string
  text: string
  solved: boolean
  pointsEarned: number
}

export interface ChallengeDetail {
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  embedUrl: string | null
  downloadUrls: string[]
  questions: Question[]
  flagSolved: boolean
}

export interface SubmitResponse {
  correct: boolean
  pointsEarned: number
}

export interface BountyEntry {
  rank: number
  crewId: string
  crewName: string
  totalPoints: number
  solveCount: number
  members: string[]
  isCurrentCrew?: boolean
}

export interface Crew {
  id: string
  name: string
  inviteCode: string
  members: CrewMember[]
}

export interface CrewMember {
  id: string
  username: string
  points: number
}

export interface CrewPreview {
  id: string
  name: string
  members: string[]
}

export interface CategoryProgress {
  name: string
  icon: string
  slug: string
  solvedQuestions: number
  totalQuestions: number
}

export interface DashboardStats {
  totalPoints: number
  solvedChallenges: number
  totalChallenges: number
  solvedQuestions: number
  totalQuestions: number
  recentSolves: RecentSolve[]
  categoryProgress: CategoryProgress[]
}

export interface RecentSolve {
  challengeTitle: string
  category: string
  pointsEarned: number
  solvedAt: string
}

export interface ProfileStats extends DashboardStats {
  username: string
  crewName: string | null
}
