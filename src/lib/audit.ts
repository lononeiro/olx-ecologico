type AuditEvent = {
  userId: number;
  action: string;
  resource: string;
  resourceId: number;
  metadata?: Record<string, unknown>;
};

export function auditAccess(event: AuditEvent) {
  console.info("[audit]", {
    ...event,
    occurredAt: new Date().toISOString(),
  });
}
