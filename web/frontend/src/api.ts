// Types and calls for the Python API in web/server.py.

export type Tier = "standard" | "night_owl";

export interface Book {
  id: string;
  title: string;
  life: string;
  onLoan: boolean;
}

export interface Loan {
  bookId: string;
  memberId: string;
  borrowedAt: string;
  due: string;
  returnedAt: string | null;
}

export interface Member {
  id: string;
  name: string;
  tier: Tier;
  borrowLimit: number;
  lateReturns: number;
  loans: Loan[];
  history: Loan[];
}

export interface LibraryState {
  books: Book[];
  members: Member[];
  waitlists: Record<string, string[]>;
}

export interface ApiError {
  type: string;
  message: string;
}

export type ApiResponse<T> =
  | { ok: true; result: T; state: LibraryState }
  | { ok: false; error: ApiError; state?: LibraryState };

export interface ReturnResult {
  fee: number;
  feeExact: string;
}

export interface Report {
  booksOnLoan: string[];
  averageLoanDays: number | null;
  averageError: string | null;
}

async function request<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return {
      ok: false,
      error: {
        type: "ConnectionError",
        message: "Can't reach the Python server. Is `python web/server.py` running?",
      },
    };
  }
}

export const api = {
  state: () => request<null>("/api/state"),
  search: (text: string) => request<Book[]>("/api/search", { text }),
  isOpen: (when: string) => request<boolean>("/api/is-open", { when }),
  checkout: (memberId: string, bookId: string, when: string) =>
    request<Loan>("/api/checkout", { memberId, bookId, when }),
  returnBook: (memberId: string, bookId: string, when: string) =>
    request<ReturnResult>("/api/return", { memberId, bookId, when }),
  addMember: (name: string, tier: Tier) => request<string>("/api/members", { name, tier }),
  joinWaitlist: (bookId: string, memberId: string) =>
    request<string[]>("/api/waitlist/join", { bookId, memberId }),
  nextInLine: (bookId: string) => request<string | null>("/api/waitlist/next", { bookId }),
  reports: () => request<Report>("/api/reports", {}),
  reset: () => request<null>("/api/reset", {}),
};
