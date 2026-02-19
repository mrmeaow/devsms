const clients = new Set();

export function registerSseClient(res) {
  clients.add(res);
  res.on('close', () => clients.delete(res));
}

export function broadcastSmsNew(message) {
  const payload = {
    event: 'sms.new',
    id: message.id,
    provider: message.provider,
    recipient: message.recipient,
    body: message.body,
    status: message.status
  };

  const wire = `event: sms.new\\ndata: ${JSON.stringify(payload)}\\n\\n`;
  for (const client of clients) {
    client.write(wire);
  }
}
