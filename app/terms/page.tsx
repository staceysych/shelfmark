import type { Metadata } from 'next'
import Link from 'next/link'
import { BookMarked } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service — Shelfmark',
  description: 'Terms for using Shelfmark.',
}

export default function TermsPage() {
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
          <h1 className="font-serif text-3xl text-foreground">Terms of Service</h1>
          <p>Last updated: November 10, 2026</p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">Using Shelfmark</h2>
          <p>
            Shelfmark is provided as a personal reading journal. By signing in, you agree to use the app for your own
            reading records and to follow Google’s terms for account and Drive access.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">Your content</h2>
          <p>
            You own your shelf data. It is stored in your Google Drive. You are responsible for the books, notes, and
            ratings you add.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">Availability</h2>
          <p>
            The app depends on Google sign-in, Google Drive, and Open Library. Features may be unavailable if those
            services are down or if you revoke access.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">Disclaimer</h2>
          <p>
            Shelfmark is provided as-is, without warranties. Reading-age and insight features are approximate and for
            entertainment.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">Contact</h2>
          <p>For support, use the email listed on the Shelfmark Google OAuth consent screen.</p>
        </section>
      </article>
    </div>
  )
}
