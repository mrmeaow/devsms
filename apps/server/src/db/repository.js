import { db } from './client.js';

const insertStmt = db.prepare(`
  INSERT INTO sms_messages (
    id, provider, provider_message_id, direction, status, sender, recipient, body,
    encoding, parts, cost, currency, campaign_id, transaction_type, retention_policy,
    meta, created_at, updated_at
  ) VALUES (
    @id, @provider, @provider_message_id, @direction, @status, @sender, @recipient, @body,
    @encoding, @parts, @cost, @currency, @campaign_id, @transaction_type, @retention_policy,
    json(@meta), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
`);

const listBase = `
  SELECT id, provider, provider_message_id, direction, status, sender, recipient, body,
         encoding, parts, cost, currency, campaign_id, transaction_type, retention_policy,
         meta, created_at, updated_at
  FROM sms_messages
`;

export function insertSms(normalized) {
  insertStmt.run({
    id: normalized.id,
    provider: normalized.provider,
    provider_message_id: normalized.provider_message_id ?? null,
    direction: normalized.direction,
    status: normalized.status,
    sender: normalized.sender ?? null,
    recipient: normalized.recipient,
    body: normalized.body,
    encoding: normalized.encoding ?? null,
    parts: normalized.parts ?? 1,
    cost: normalized.cost ?? null,
    currency: normalized.currency ?? null,
    campaign_id: normalized.campaign_id ?? null,
    transaction_type: normalized.transaction_type ?? null,
    retention_policy: normalized.retention_policy ?? 'audit',
    meta: JSON.stringify(normalized.meta ?? {})
  });

  return getSmsById(normalized.id);
}

export function getSmsById(id) {
  const row = db.prepare(`${listBase} WHERE id = ?`).get(id);
  if (!row) return null;
  return { ...row, meta: JSON.parse(row.meta || '{}') };
}

export function listSms({ provider, limit = 100 } = {}) {
  const cap = Math.min(Number(limit) || 100, 500);
  const sql = provider
    ? `${listBase} WHERE provider = ? ORDER BY created_at DESC LIMIT ?`
    : `${listBase} ORDER BY created_at DESC LIMIT ?`;

  const rows = provider ? db.prepare(sql).all(provider, cap) : db.prepare(sql).all(cap);
  return rows.map((row) => ({ ...row, meta: JSON.parse(row.meta || '{}') }));
}

export function markQueuedAsDelivered() {
  const info = db.prepare(`
    UPDATE sms_messages
    SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'queued'
  `).run();

  return info.changes;
}
