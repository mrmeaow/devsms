import { useEffect, useMemo, useState } from 'react';
import { fetchMessages, maskRecipient, redactOtp } from './lib.js';

const PROVIDERS = ['all', 'mimsms', 'twilio', 'smpp'];

function statusTone(status) {
  switch (status) {
    case 'delivered':
      return 'text-emerald-700 bg-emerald-50';
    case 'failed':
      return 'text-red-700 bg-red-50';
    case 'expired':
      return 'text-amber-700 bg-amber-50';
    case 'sent':
      return 'text-sky-700 bg-sky-50';
    default:
      return 'text-zinc-700 bg-zinc-100';
  }
}

export function App({ initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [provider, setProvider] = useState('all');
  const [maskMobile, setMaskMobile] = useState(true);
  const [hideOtp, setHideOtp] = useState(false);

  useEffect(() => {
    fetchMessages(provider === 'all' ? '' : provider)
      .then(setMessages)
      .catch((err) => console.error(err));
  }, [provider]);

  useEffect(() => {
    const events = new EventSource('/api/events');
    events.addEventListener('sms.new', (event) => {
      const payload = JSON.parse(event.data);
      if (provider !== 'all' && payload.provider !== provider) {
        return;
      }

      fetchMessages(provider === 'all' ? '' : provider)
        .then(setMessages)
        .catch((err) => console.error(err));
    });

    return () => events.close();
  }, [provider]);

  const total = useMemo(() => messages.length, [messages]);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)] shadow-sm">
        <header className="flex flex-col gap-4 border-b border-[var(--line)] bg-[var(--accent-soft)] p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Canonical Inbox</p>
            <h1 className="text-2xl font-semibold">devsms Message Stream</h1>
            <p className="text-sm text-[var(--muted)]">{total} messages in unified model</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
            >
              {PROVIDERS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              onClick={() => setMaskMobile((v) => !v)}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
            >
              {maskMobile ? 'Unmask Mobile' : 'Mask Mobile'}
            </button>
            <button
              onClick={() => setHideOtp((v) => !v)}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
            >
              {hideOtp ? 'Show OTP' : 'Hide OTP'}
            </button>
          </div>
        </header>

        <ul className="divide-y divide-[var(--line)]">
          {messages.map((message) => (
            <li key={message.id} className="grid gap-2 p-4 md:grid-cols-[150px_1fr_auto] md:items-center md:p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{message.provider}</p>
                <p className="text-sm text-[var(--muted)]">{new Date(message.created_at).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-sm text-[var(--muted)]">
                  {message.sender || 'n/a'} to {maskMobile ? maskRecipient(message.recipient) : message.recipient}
                </p>
                <p className="text-base">{redactOtp(message.body, hideOtp)}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone(message.status)}`}>
                  {message.status}
                </span>
              </div>
            </li>
          ))}
          {messages.length === 0 ? (
            <li className="p-8 text-center text-sm text-[var(--muted)]">No messages yet.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
