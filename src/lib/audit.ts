import { createAdminClient } from '@/lib/supabase/server'
import type { AuditAction } from '@/types/database'
import { headers } from 'next/headers'

interface WriteAuditLogParams {
  orgId: string
  userId: string
  action: AuditAction
  entityType: string
  entityId?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
}

// Always uses service role key — bypasses RLS
// Audit logs are immutable — no update or delete policies
export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  const admin = createAdminClient()
  const headersList = headers()

  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? headersList.get('x-real-ip')
    ?? null

  const userAgent = headersList.get('user-agent') ?? null

  const { error } = await admin.from('audit_logs').insert({
    org_id: params.orgId,
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    old_data: params.oldData ?? null,
    new_data: params.newData ?? null,
    ip_address: ip,
    user_agent: userAgent,
  })

  if (error) {
    // Log to server stderr — never throw, audit log failure should not break the request
    console.error('[AuditLog] Failed to write:', error.message, params)
  }
}
