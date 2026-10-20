'use client'

import { useState } from 'react'
import { BookMarked, Plus } from 'lucide-react'
import type { Book } from '@/lib/books'
import { GOOGLE_CLIENT_ID, useGoogleSession } from '@/lib/google-auth'
import { useLibrary } from '@/lib/use-library'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LibraryView } from '@/components/library-view'
import { DashboardView } from '@/components/dashboard-view'
import { AddBookDialog } from '@/components/add-book-dialog'
import { BookDetailDialog } from '@/components/book-detail-dialog'
import { GoogleSessionProvider } from '@/components/google-session-provider'
import { SignInView } from '@/components/sign-in-view'
import { AccountButton } from '@/components/account-button'

export function ShelfApp() {
  return (
    <GoogleSessionProvider>
      <Shelf />
    </GoogleSessionProvider>
  )
}

function Shelf() {
  const { status } = useGoogleSession()
  const { books, isLoading, error, retry, retrySave, syncStatus, syncMessage } = useLibrary()
  const [adding, setAdding] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = books.find((b) => b.id === selectedId) ?? null
  const select = (book: Book) => setSelectedId(book.id)

  if (!GOOGLE_CLIENT_ID || status === 'signed-out' || status === 'misconfigured') return <SignInView />

  return (
    <Tabs defaultValue="shelf" className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <BookMarked className="size-5 text-primary" aria-hidden />
          <h1 className="font-serif text-2xl">Shelfmark</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {status === 'signed-in' ? (
            <AccountButton syncStatus={syncStatus} syncMessage={syncMessage} onRetrySave={retrySave} />
          ) : null}
          <TabsList>
            <TabsTrigger value="shelf">Shelf</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          <Button onClick={() => setAdding(true)} className="h-8" disabled={status !== 'signed-in'}>
            <Plus aria-hidden />
            Add book
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {status === 'loading' || isLoading ? null : error ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="max-w-md text-sm text-muted-foreground">Couldn’t load your shelf from Google Drive. {error}</p>
            <Button variant="secondary" onClick={() => retry()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <TabsContent value="shelf">
              <LibraryView books={books} onAdd={() => setAdding(true)} onSelect={select} />
            </TabsContent>
            <TabsContent value="insights">
              <DashboardView books={books} onSelect={select} />
            </TabsContent>
          </>
        )}
      </main>

      <AddBookDialog open={adding} onOpenChange={setAdding} />
      <BookDetailDialog book={selected} onOpenChange={(open) => !open && setSelectedId(null)} />
    </Tabs>
  )
}
