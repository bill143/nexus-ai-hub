// ============================================================
// NEXUS AI Hub — Database Types
// Auto-maintained to match supabase/migrations/001_initial_schema.sql
// ============================================================

export type UserRole = 'admin' | 'editor' | 'viewer'
export type AssetPriority = 'HIGH' | 'MED' | 'LOW'
export type AssetStage = 'BACKLOG' | 'EVAL' | 'PILOT' | 'LIVE'
export type AssetCategory =
  | 'RAG / Pipeline'
  | 'MCP'
  | 'LLM'
  | 'Agentic'
  | 'Eval'
  | 'Utility'
export type AuditAction =
  | 'asset.created'
  | 'asset.updated'
  | 'asset.deleted'
  | 'user.invited'
  | 'user.role_changed'
  | 'user.removed'
  | 'org.updated'
  | 'org.created'

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  org_id: string | null
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  theme: string
  created_at: string
  updated_at: string
}

export interface OrgInvite {
  id: string
  org_id: string
  email: string
  role: UserRole
  token: string
  invited_by: string | null
  accepted_at: string | null
  expires_at: string
  created_at: string
}

export interface Asset {
  id: string
  org_id: string
  name: string
  category: AssetCategory
  priority: AssetPriority
  stage: AssetStage
  fit: string | null
  project: string | null
  owner_id: string | null
  repo_url: string | null
  training_docs: string | null
  requirements: string | null
  notes: string | null
  last_reviewed: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  owner?: Profile | null
}

export interface Tag {
  id: string
  org_id: string
  name: string
  color: string
}

export interface AuditLog {
  id: string
  org_id: string
  user_id: string | null
  action: AuditAction
  entity_type: string
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  // Joined
  user?: Profile | null
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface AssetFilters {
  category?: AssetCategory | 'all'
  priority?: AssetPriority
  stage?: AssetStage
  project?: string
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  error: string
  code?: string
  status: number
}

// ============================================================
// Session / Auth Types
// ============================================================

export interface SessionUser {
  id: string
  email: string
  profile: Profile
  org: Organization | null
}
