import type { Metadata } from "next";
import Link from "next/link";
import { adminListInquiries } from "@/lib/admin";
import { deleteInquiry, markInquiryRead } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata: Metadata = { title: "Inbox" };

function formatDate(sqlite: string) {
  return new Date(sqlite.replace(" ", "T") + "Z").toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

export default async function InboxPage() {
  const inquiries = await adminListInquiries();
  const link = "text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1
        className="text-2xl text-[var(--color-text)] mb-8"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Inbox
      </h1>

      {inquiries.length === 0 ? (
        <div className="py-16 text-center border border-[var(--color-border)] rounded">
          <p className="text-[var(--color-muted)]">No messages yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {inquiries.map((q) => {
            const unread = !q.read_at;
            const subject = q.subject || "Your message";
            return (
              <li
                key={q.id}
                className={`rounded border bg-white p-5 ${
                  unread ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-[var(--color-text)]">
                    <span className={unread ? "font-semibold" : "font-medium"}>{q.name}</span>{" "}
                    <span className="text-[var(--color-muted)]">&lt;{q.email}&gt;</span>
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">{formatDate(q.created_at)}</p>
                </div>
                {q.subject && <p className="mt-1 text-sm font-medium">{q.subject}</p>}
                {q.artwork_slug && (
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    About:{" "}
                    <Link href={`/gallery/${q.artwork_slug}`} target="_blank" className="underline">
                      {q.artwork_slug}
                    </Link>
                  </p>
                )}
                <p className="mt-3 text-sm text-[var(--color-text)] whitespace-pre-line">{q.message}</p>

                <div className="mt-4 flex items-center gap-4">
                  <a
                    href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${subject}`)}`}
                    className="text-xs text-[var(--color-text)] underline underline-offset-2"
                  >
                    Reply by email
                  </a>
                  <form action={markInquiryRead.bind(null, q.id, unread)}>
                    <button className={link}>{unread ? "Mark read" : "Mark unread"}</button>
                  </form>
                  <form action={deleteInquiry.bind(null, q.id)}>
                    <ConfirmButton
                      message="Delete this message?"
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
