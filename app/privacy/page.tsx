import type { Metadata } from 'next'
import Link from 'next/link'
import { BookMarked } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy — Shelfmark',
  description: 'How Shelfmark handles your Google account and reading data.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <BookMarked className="size-5 text-primary" aria-hidden />
          <span className="font-serif text-2xl">Shelfmark</span>
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to app
        </Link>
      </header>

      <article className="flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl text-foreground">Privacy Policy</h1>
          <p>Last updated: November 10, 2026</p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">What Shelfmark is</h2>
          <p>
            Shelfmark is a personal reading journal. You sign in with Google, and your shelf (books, ratings, notes,
            and reading status) is stored in a file in your own Google Drive.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">Information we access</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="text-foreground">Google account basics</span> — name, email, and profile photo, used to
              show who is signed in.
            </li>
            <li>
              <span className="text-foreground">Google Drive (limited)</span> — permission to create and update a
              Shelfmark library file in Drive that you own. We do not request access to your full Drive.
            </li>
            <li>
              <span className="text-foreground">Book catalog lookups</span> — title/author searches may be sent to Open
              Library to find covers and book details.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">Where your data lives</h2>
          <p>
            Your reading library is saved as <code className="text-foreground">shelfmark-library.json</code> in your
            Google Drive. A short-lived copy may also be cached in your browser so the app loads faster. Shelfmark does
            not keep a separate server-side database of your books.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">How we use data</h2>
          <p>
            We use this information only to run Shelfmark for you: sign-in, saving your shelf, showing covers and
            insights, and optional share cards you create. We do not sell your personal data.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">Analytics</h2>
          <p>
            In production, the site may use Vercel Analytics for basic, privacy-oriented traffic metrics (such as page
            views). This is not used to build advertising profiles of your reading list.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">Your choices</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>You can sign out at any time.</li>
            <li>You can delete the Shelfmark file from your Google Drive.</li>
            <li>
              You can revoke Shelfmark’s access in your{' '}
              <a
                href="https://myaccount.google.com/permissions"
                className="text-foreground underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Google Account permissions
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">Contact</h2>
          <p>
            Questions about privacy: use the support email listed on the Shelfmark Google OAuth consent screen for this
            project.
          </p>
        </section>
      </article>
    </div>
  )
}
