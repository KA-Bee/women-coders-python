import { useCallback, useEffect, useState } from "react";
import { api, ApiResponse, Book, LibraryState, Member, Report, Tier } from "./api";

type Tab = "shelves" | "members" | "waitlists" | "reports";

interface LogEntry {
  id: number;
  clock: string;
  action: string;
  ok: boolean;
  detail: string;
}

const DEFAULT_CLOCK = "2026-12-01T00:15";
const TIME_PRESETS = ["23:59", "00:00", "00:30", "00:58", "00:59", "01:00", "14:00"];

function shiftDays(clock: string, days: number): string {
  const [date, time] = clock.split("T");
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.toISOString().slice(0, 10)}T${time}`;
}

function prettyClock(clock: string): string {
  const [date, time] = clock.split("T");
  return `${date} ${time.slice(0, 5)}`;
}

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

let nextLogId = 1;

export default function App() {
  const [state, setState] = useState<LibraryState | null>(null);
  const [clock, setClock] = useState(DEFAULT_CLOCK);
  const [open, setOpen] = useState<boolean | null>(null);
  const [memberId, setMemberId] = useState("M-001");
  const [tab, setTab] = useState<Tab>("shelves");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [connError, setConnError] = useState<string | null>(null);

  const addLog = (action: string, ok: boolean, detail: string) =>
    setLog((prev) => [{ id: nextLogId++, clock, action, ok, detail }, ...prev].slice(0, 60));

  // Run an API call, update state, and write the outcome to the night log.
  async function run<T>(
    action: string,
    call: Promise<ApiResponse<T>>,
    describe: (result: T) => string,
  ): Promise<T | undefined> {
    const res = await call;
    if (res.state) setState(res.state);
    if (res.ok) {
      addLog(action, true, describe(res.result));
      return res.result;
    }
    addLog(action, false, `${res.error.type}: ${res.error.message}`);
    return undefined;
  }

  const refresh = useCallback(async () => {
    const res = await api.state();
    if (res.ok) {
      setState(res.state);
      setConnError(null);
    } else {
      setConnError(res.error.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    api.isOpen(`${clock}:00`).then((res) => setOpen(res.ok ? res.result : null));
  }, [clock]);

  const when = `${clock}:00`;
  const member = state?.members.find((m) => m.id === memberId);

  return (
    <div className="page">
      <div className="stars" aria-hidden />
      <header className="masthead">
        <div className="brand">
          <svg className="moon" viewBox="0 0 32 32" aria-hidden>
            <path d="M20 4a12 12 0 1 0 8 20A10 10 0 0 1 20 4z" />
          </svg>
          <div>
            <h1>The Midnight Library</h1>
            <p className="tagline">Every book is a life you could have lived. Open 00:00 to 00:59.</p>
          </div>
        </div>
        <button
          className="ghost"
          onClick={() => run("Reset library", api.reset(), () => "Back to the starter shelves")}
        >
          Reset library
        </button>
      </header>

      {connError && <div className="banner">{connError}</div>}

      <section className="desk panel">
        <div className="field">
          <label htmlFor="clock">Library clock</label>
          <input
            id="clock"
            type="datetime-local"
            value={clock}
            onChange={(e) => e.target.value && setClock(e.target.value.slice(0, 16))}
          />
          <div className="chips">
            {TIME_PRESETS.map((t) => (
              <button
                key={t}
                className={`chip ${clock.endsWith(t) ? "active" : ""}`}
                onClick={() => setClock(`${clock.split("T")[0]}T${t}`)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="chips">
            {[1, 13, 14, 15, 30].map((d) => (
              <button key={d} className="chip" onClick={() => setClock(shiftDays(clock, d))}>
                +{d} {d === 1 ? "day" : "days"}
              </button>
            ))}
          </div>
        </div>
        <div className={`status ${open ? "open" : "closed"}`}>
          <span className="dot" />
          {open === null ? "…" : open ? "Open" : "Closed"}
          <small>is_open() says</small>
        </div>
        <div className="field">
          <label htmlFor="member">At the desk</label>
          <select id="member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {state?.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id}) {m.tier === "night_owl" ? "· Night Owl" : ""}
              </option>
            ))}
          </select>
          {member && (
            <p className="hint">
              Holding {member.loans.length} of {member.borrowLimit} · {member.lateReturns} late
              returns
            </p>
          )}
        </div>
      </section>

      <div className="layout">
        <main>
          <nav className="tabs" role="tablist">
            {(["shelves", "members", "waitlists", "reports"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>

          {state && tab === "shelves" && (
            <Shelves
              books={state.books}
              onSearch={(text) =>
                run(`Search "${text}"`, api.search(text), (r) => `${r.length} book(s) found`)
              }
              onBorrow={(book) =>
                run(
                  `${member?.name} borrows ${book.id}`,
                  api.checkout(memberId, book.id, when),
                  (loan) => `Due back ${loan.due}`,
                )
              }
              onWaitlist={(book) =>
                run(
                  `${member?.name} joins waitlist for ${book.id}`,
                  api.joinWaitlist(book.id, memberId),
                  (w) => `Waitlist is now [${w.join(", ")}]`,
                )
              }
            />
          )}

          {state && tab === "members" && (
            <Members
              members={state.members}
              books={state.books}
              onReturn={(m, bookId) =>
                run(
                  `${m.name} returns ${bookId}`,
                  api.returnBook(m.id, bookId, when),
                  (r) => `Late fee ${money(r.fee)} (Python returned ${r.feeExact})`,
                )
              }
              onAdd={(name, tier) =>
                run(`Add member ${name}`, api.addMember(name, tier), (id) => `Created ${id}`)
              }
            />
          )}

          {state && tab === "waitlists" && (
            <Waitlists
              state={state}
              memberId={memberId}
              onJoin={(bookId) =>
                run(
                  `${member?.name} joins waitlist for ${bookId}`,
                  api.joinWaitlist(bookId, memberId),
                  (w) => `Waitlist is now [${w.join(", ")}]`,
                )
              }
              onNext={(bookId) =>
                run(`Next in line for ${bookId}`, api.nextInLine(bookId), (id) =>
                  id === null ? "Nobody waiting (None)" : `${id} is next`,
                )
              }
            />
          )}

          {state && tab === "reports" && (
            <Reports onRun={() => run("Run reports", api.reports(), () => "Report ready")} />
          )}
        </main>

        <aside className="panel log">
          <div className="log-head">
            <h2>Night log</h2>
            {log.length > 0 && (
              <button className="link" onClick={() => setLog([])}>
                Clear
              </button>
            )}
          </div>
          {log.length === 0 && <p className="hint">Everything you do appears here, with what the Python code returned.</p>}
          <ol>
            {log.map((e) => (
              <li key={e.id} className={e.ok ? "ok" : "err"}>
                <div className="log-meta">
                  <span>{prettyClock(e.clock)}</span>
                  <span>{e.ok ? "ok" : "error"}</span>
                </div>
                <strong>{e.action}</strong>
                <code>{e.detail}</code>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

function Shelves(props: {
  books: Book[];
  onSearch: (text: string) => Promise<Book[] | undefined>;
  onBorrow: (book: Book) => void;
  onWaitlist: (book: Book) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[] | null>(null);

  // Keep search results in sync with the latest on-loan status.
  const shown = results
    ? results.map((r) => props.books.find((b) => b.id === r.id) ?? r)
    : props.books;

  return (
    <section className="panel">
      <form
        className="search"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!query) return setResults(null);
          const found = await props.onSearch(query);
          if (found) setResults(found);
        }}
      >
        <input
          placeholder="Search titles, e.g. bakery"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
        {results && (
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setResults(null);
              setQuery("");
            }}
          >
            Show all
          </button>
        )}
      </form>
      {results && results.length === 0 && <p className="hint">No books matched "{query}".</p>}
      <ul className="books">
        {shown.map((b) => (
          <li key={b.id} className={`book ${b.onLoan ? "out" : ""}`}>
            <div className="spine" />
            <div className="book-body">
              <span className="book-id">{b.id}</span>
              <h3>{b.title}</h3>
              <p>{b.life}</p>
              <div className="book-foot">
                <span className={`pill ${b.onLoan ? "out" : "in"}`}>
                  {b.onLoan ? "On loan" : "On the shelf"}
                </span>
                <div className="actions">
                  <button onClick={() => props.onBorrow(b)}>Borrow</button>
                  <button className="ghost" onClick={() => props.onWaitlist(b)}>
                    Join waitlist
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Members(props: {
  members: Member[];
  books: Book[];
  onReturn: (m: Member, bookId: string) => void;
  onAdd: (name: string, tier: Tier) => void;
}) {
  const [name, setName] = useState("");
  const [tier, setTier] = useState<Tier>("standard");
  const title = (id: string) => props.books.find((b) => b.id === id)?.title ?? id;

  return (
    <section className="members">
      {props.members.map((m) => (
        <article key={m.id} className="panel member">
          <header>
            <h3>{m.name}</h3>
            <span className={`pill ${m.tier === "night_owl" ? "owl" : ""}`}>
              {m.tier === "night_owl" ? "Night Owl" : "Standard"}
            </span>
          </header>
          <p className="hint">
            {m.id} · holding {m.loans.length} of {m.borrowLimit} · {m.lateReturns} late returns
          </p>
          <h4>Borrowed now</h4>
          {m.loans.length === 0 && <p className="hint">Nothing out right now.</p>}
          <ul className="loans">
            {m.loans.map((l, i) => (
              <li key={`${l.bookId}-${i}`}>
                <div>
                  <strong>{title(l.bookId)}</strong>
                  <span className="hint">
                    Borrowed {prettyClock(l.borrowedAt)} · due {l.due}
                  </span>
                </div>
                <button onClick={() => props.onReturn(m, l.bookId)}>Return</button>
              </li>
            ))}
          </ul>
          <ReturnAny books={props.books} onReturn={(id) => props.onReturn(m, id)} />
          {m.history.length > 0 && (
            <>
              <h4>Returned</h4>
              <ul className="loans past">
                {m.history.map((l, i) => (
                  <li key={`${l.bookId}-h${i}`}>
                    <div>
                      <strong>{title(l.bookId)}</strong>
                      <span className="hint">
                        {prettyClock(l.borrowedAt)} → {l.returnedAt && prettyClock(l.returnedAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      ))}
      <form
        className="panel member add"
        onSubmit={(e) => {
          e.preventDefault();
          props.onAdd(name, tier);
          setName("");
        }}
      >
        <h3>New member</h3>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={tier} onChange={(e) => setTier(e.target.value as Tier)}>
          <option value="standard">Standard</option>
          <option value="night_owl">Night Owl</option>
        </select>
        <button type="submit">Add member</button>
      </form>
    </section>
  );
}

function ReturnAny(props: { books: Book[]; onReturn: (bookId: string) => void }) {
  const [bookId, setBookId] = useState(props.books[0]?.id ?? "");
  return (
    <div className="return-any">
      <select value={bookId} onChange={(e) => setBookId(e.target.value)} aria-label="Book to return">
        {props.books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.id}
          </option>
        ))}
      </select>
      <button className="ghost" onClick={() => props.onReturn(bookId)}>
        Return any book
      </button>
    </div>
  );
}

function Waitlists(props: {
  state: LibraryState;
  memberId: string;
  onJoin: (bookId: string) => void;
  onNext: (bookId: string) => void;
}) {
  const name = (id: string) => props.state.members.find((m) => m.id === id)?.name ?? id;
  return (
    <section className="panel">
      <p className="hint">Each book should have its own waitlist, and nobody should be on one twice.</p>
      <table className="waitlists">
        <thead>
          <tr>
            <th>Book</th>
            <th>Waiting</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {props.state.books.map((b) => {
            const w = props.state.waitlists[b.id] ?? [];
            return (
              <tr key={b.id}>
                <td>
                  <span className="book-id">{b.id}</span> <span className="wl-title">{b.title}</span>
                </td>
                <td>{w.length ? w.map((id) => `${name(id)} (${id})`).join(", ") : <span className="hint">nobody</span>}</td>
                <td>
                  <div className="actions end">
                    <button className="ghost" onClick={() => props.onJoin(b.id)}>
                      Join
                    </button>
                    <button onClick={() => props.onNext(b.id)}>Next in line</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Reports(props: { onRun: () => Promise<Report | undefined> }) {
  const [report, setReport] = useState<Report | null>(null);
  return (
    <section className="panel">
      <button onClick={async () => setReport((await props.onRun()) ?? null)}>Run reports</button>
      {report && (
        <div className="report">
          <div className="stat">
            <span className="stat-label">Average loan length</span>
            {report.averageError ? (
              <code className="err-text">{report.averageError}</code>
            ) : (
              <span className="stat-value">{report.averageLoanDays} days</span>
            )}
          </div>
          <div className="stat">
            <span className="stat-label">Books on loan ({report.booksOnLoan.length})</span>
            {report.booksOnLoan.length === 0 ? (
              <span className="hint">None</span>
            ) : (
              <ul>
                {report.booksOnLoan.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
