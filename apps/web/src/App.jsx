import { useEffect, useMemo, useState } from 'react';
import { fetchMessages, maskRecipient, redactOtp } from './lib.js';

const PROVIDERS = ['all', 'mimsms', 'twilio', 'smpp'];

function statusTone(status) {
  switch (status) {
    case 'delivered':
      return 'text-emerald-700 bg-emerald-50 ring-emerald-200';
    case 'failed':
      return 'text-red-700 bg-red-50 ring-red-200';
    case 'expired':
      return 'text-amber-700 bg-amber-50 ring-amber-200';
    case 'sent':
      return 'text-sky-700 bg-sky-50 ring-sky-200';
    default:
      return 'text-zinc-700 bg-zinc-100 ring-zinc-200';
  }
}

function providerLabel(provider) {
  if (provider === 'all') return 'All providers';
  return provider.toUpperCase();
}

export function App({ initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [provider, setProvider] = useState('all');
  const [maskMobile, setMaskMobile] = useState(true);
  const [hideOtp, setHideOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError('');

    fetchMessages(provider === 'all' ? '' : provider)
      .then(setMessages)
      .catch((err) => {
        console.error(err);
        setError('Could not load live messages. Showing latest snapshot.');
      })
      .finally(() => setIsLoading(false));
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
        .catch((err) => {
          console.error(err);
          setError('Live refresh failed. Please retry in a moment.');
        });
    });

    events.onerror = () => {
      setError('Live stream disconnected. Reconnecting automatically.');
    };

    return () => events.close();
  }, [provider]);

  const total = useMemo(() => messages.length, [messages]);

  return (
    <main className="min-h-screen p-3 md:p-6 lg:p-8">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)] shadow-xl shadow-slate-200/70">
        <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[color:var(--accent-soft)]/90 p-4 backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Canonical Inbox</p>
              <h1 className="text-2xl font-semibold md:text-3xl">devsms Message Stream</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">{total} messages in unified model</p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-[minmax(170px,1fr)_auto_auto]">
              <label className="sr-only" htmlFor="provider-filter">Provider filter</label>
              <select
                id="provider-filter"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                {PROVIDERS.map((item) => (
                  <option key={item} value={item}>
                    {providerLabel(item)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setMaskMobile((v) => !v)}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {maskMobile ? 'Unmask Mobile' : 'Mask Mobile'}
              </button>
              <button
                onClick={() => setHideOtp((v) => !v)}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {hideOtp ? 'Show OTP' : 'Hide OTP'}
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[var(--line)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live updates
            </span>
            {isLoading ? <span className="rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[var(--line)]">Refreshing…</span> : null}
            {error ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700 ring-1 ring-red-200">{error}</span> : null}
          </div>
        </header>

        <ul className="divide-y divide-[var(--line)]">
          {messages.map((message) => (
            <li
              key={message.id}
              className="grid gap-3 p-4 transition-colors hover:bg-slate-50/70 md:grid-cols-[180px_1fr_auto] md:items-center md:p-5"
            >
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{message.provider}</p>
                <p className="text-sm text-[var(--muted)]">{new Date(message.created_at).toLocaleString()}</p>
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm text-[var(--muted)]">
                  {message.sender || 'n/a'} to {maskMobile ? maskRecipient(message.recipient) : message.recipient}
                </p>
                <p className="mt-1 text-base leading-relaxed">{redactOtp(message.body, hideOtp)}</p>
              </div>

              <div className="flex items-center md:justify-end">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusTone(message.status)}`}
                >
                  {message.status}
                </span>
              </div>
            </li>
          ))}
          {!isLoading && messages.length === 0 ? (
            <li className="p-10 text-center">
              <p className="text-base font-medium">No messages yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Incoming provider events will appear here in real time.</p>
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
