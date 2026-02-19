export function maskRecipient(recipient) {
  if (!recipient) return '';
  if (recipient.length <= 4) return recipient;
  return `${'*'.repeat(Math.max(recipient.length - 4, 0))}${recipient.slice(-4)}`;
}

export function redactOtp(body, enabled) {
  if (!enabled) return body;
  return body.replace(/\b\d{4,8}\b/g, '••••');
}

export async function fetchMessages(provider) {
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : '';
  const response = await fetch(`/api/sms${query}`);
  if (!response.ok) throw new Error('Failed to load inbox');
  return response.json();
}
