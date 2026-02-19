const MIMSMS_STATUS_MAP = {
  Success: 'queued',
  Delivered: 'delivered',
  Invalid: 'failed'
};

const SMPP_DLR_MAP = {
  0: 'queued',
  1: 'sent',
  2: 'delivered',
  5: 'expired'
};

export function mapMimsmsStatus(status) {
  return MIMSMS_STATUS_MAP[status] ?? 'failed';
}

export function mapTwilioStatus(status) {
  const allowed = new Set(['queued', 'sent', 'delivered', 'failed', 'expired']);
  return allowed.has(status) ? status : 'failed';
}

export function mapSmppStatus(dlrCode) {
  return SMPP_DLR_MAP[Number(dlrCode)] ?? 'failed';
}
