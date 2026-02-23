import { useEffect, useMemo, useState } from 'react';
import { fetchMessages, maskRecipient, redactOtp } from './lib.js';

const PROVIDERS = ['all', 'mimsms', 'twilio', 'smpp'];
const PAGE_SIZES = [10, 20, 50];

function statusTone(status) {
  switch (status) {
    case 'delivered':
      return 'text-emerald-200 bg-emerald-950/70 border-emerald-800';
    case 'failed':
      return 'text-rose-200 bg-rose-950/70 border-rose-800';
    case 'expired':
      return 'text-amber-200 bg-amber-950/70 border-amber-800';
    case 'sent':
      return 'text-sky-200 bg-sky-950/70 border-sky-800';
    default:
      return 'text-zinc-300 bg-zinc-900/70 border-zinc-700';
  }
}

function providerLabel(provider) {
  if (provider === 'all') return 'All providers';
  return provider.toUpperCase();
}

function themeLabel(theme) {
  return theme === 'dark' ? 'Dark mode' : 'Light mode';
}

export function App({ initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [provider, setProvider] = useState('all');
  const [maskMobile, setMaskMobile] = useState(true);
  const [hideOtp, setHideOtp] = useState(false);
  const [targetFilter, setTargetFilter] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [theme, setTheme] = useState('dark');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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

  const filteredMessages = useMemo(() => {
    const target = targetFilter.trim().toLowerCase();
    const sender = senderFilter.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesTarget = !target || (message.recipient || '').toLowerCase().includes(target);
      const matchesSender = !sender || (message.sender || '').toLowerCase().includes(sender);
      const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
      return matchesTarget && matchesSender && matchesStatus;
    });
  }, [messages, targetFilter, senderFilter, statusFilter]);

  const total = filteredMessages.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  useEffect(() => {
    setPage(1);
  }, [provider, targetFilter, senderFilter, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedMessages = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMessages.slice(start, start + pageSize);
  }, [filteredMessages, page, pageSize]);

  return (
    <main className="min-h-screen p-3 md:p-6 lg:p-8">
      <section className="retro-shell mx-auto max-w-6xl overflow-hidden rounded-3xl border shadow-2xl">
        <header className="retro-header sticky top-0 z-10 border-b p-4 backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="retro-kicker">Signal desk · unified stream</p>
              <h1 className="retro-title flex items-center">
                <span>DevSMS</span>
                <span className="inline-block ml-2 text-xs p-1 px-2 border rounded-md border-amber-400 bg-amber-100 text-gray-700">
                  alpha
                </span>
              </h1>
              <p className="retro-subtitle">A crisp, operator-first inbox for live carrier traffic.</p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-3">
              <label className="sr-only" htmlFor="provider-filter">Provider filter</label>
              <select
                id="provider-filter"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="retro-input"
              >
                {PROVIDERS.map((item) => (
                  <option key={item} value={item}>
                    {providerLabel(item)}
                  </option>
                ))}
              </select>

              <button onClick={() => setMaskMobile((v) => !v)} className="retro-button">
                {maskMobile ? 'Unmask Mobile' : 'Mask Mobile'}
              </button>

              <button onClick={() => setHideOtp((v) => !v)} className="retro-button">
                {hideOtp ? 'Show OTP' : 'Hide OTP'}
              </button>

              <button
                onClick={() => setTheme((v) => (v === 'dark' ? 'light' : 'dark'))}
                className="retro-button"
              >
                {themeLabel(theme)}
              </button>

              <input
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                placeholder="Filter target receiver"
                className="retro-input"
              />

              <input
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value)}
                placeholder="Filter sender"
                className="retro-input"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="retro-chip">{total} filtered</span>
            <span className="retro-chip">Page {page} / {totalPages}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="retro-input !w-auto"
              aria-label="Status filter"
            >
              <option value="all">All status</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="retro-input !w-auto"
              aria-label="Page size"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
            {isLoading ? <span className="retro-chip">Refreshing…</span> : null}
            {error ? <span className="retro-chip retro-chip-warn">{error}</span> : null}
          </div>
        </header>

        <ul className="divide-y border-zinc-700/70">
          {pagedMessages.map((message) => (
            <li
              key={message.id}
              className="grid gap-3 p-4 transition-colors hover:bg-[var(--row-hover)] md:grid-cols-[180px_1fr_auto] md:items-center md:p-5"
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
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(message.status)}`}>
                  {message.status}
                </span>
              </div>
            </li>
          ))}
          {!isLoading && pagedMessages.length === 0 ? (
            <li className="p-10 text-center">
              <p className="text-base font-medium">No messages match current filters</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Try another provider, target receiver, sender, or status.</p>
            </li>
          ) : null}
        </ul>

        <footer className="retro-footer flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
          <p className="text-xs text-[var(--muted)]">Showing {(page - 1) * pageSize + (pagedMessages.length ? 1 : 0)}–{(page - 1) * pageSize + pagedMessages.length} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((v) => Math.max(v - 1, 1))} disabled={page <= 1} className="retro-button disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button onClick={() => setPage((v) => Math.min(v + 1, totalPages))} disabled={page >= totalPages} className="retro-button disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </footer>
      </section>
    </main>
  );
}
