# /track-event
Add an audit-log event with action / reason / metadata.
## Template
```ts
await auditLog({
  action: 'ACTION_NAME',
  actor_id: session.userId,
  actor_role: session.role,
  is_dev: session.isDev,
  patient_id: patientId || null,
  reason: reason || null,
  metadata: { key: value },
  request_id: requestId,
});
```
## Rules
- PutItem ONLY on midland-sleep-audit
- Write BEFORE the sensitive action, not after
- maskNHI in metadata values
- safeLog the audit_id for traceability
