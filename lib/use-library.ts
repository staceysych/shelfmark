'use client'

import { useSyncExternalStore } from 'react'
import useSWR from 'swr'
import type { Book } from '@/lib/books'
import { DriveError, forgetDriveFile, getLibraryFileId, readLibrary, writeLibrary } from '@/lib/drive'
import { getAccessToken, useGoogleSession } from '@/lib/google-auth'

const LEGACY_STORAGE_KEY = 'shelfmark:books:v1'

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

type SyncState = {
  status: SyncStatus
  message: string | null
}

let syncState: SyncState = { status: 'idle', message: null }
const syncListeners = new Set<() => void>()
let persistChain = Promise.resolve()
let pendingBooks: Book[] | null = null

function setSyncState(next: SyncState) {
  syncState = next
  syncListeners.forEach((listener) => listener())
}

function cacheKey(userSub: string) {
  return `shelfmark:books:${userSub}`
}

function readCache(userSub: string): Book[] | undefined {
  try {
    const raw = window.localStorage.getItem(cacheKey(userSub))
    return raw ? (JSON.parse(raw) as Book[]) : undefined
  } catch {
    return undefined
  }
}

function writeCache(userSub: string, books: Book[]) {
  window.localStorage.setItem(cacheKey(userSub), JSON.stringify(books))
}

function readLegacyBooks(): Book[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Book[]) : []
  } catch {
    return []
  }
}

async function withLibraryFile<T>(userSub: string, work: (token: string, fileId: string) => Promise<T>) {
  const token = await getAccessToken()
  try {
    return await work(token, await getLibraryFileId(token, userSub))
  } catch (error) {
    if (!(error instanceof DriveError) || error.status !== 404) throw error
    forgetDriveFile(userSub)
    const retryToken = await getAccessToken()
    return work(retryToken, await getLibraryFileId(retryToken, userSub))
  }
}

async function loadBooks(userSub: string) {
  const books = await withLibraryFile(userSub, async (token, fileId) => {
    const fromDrive = await readLibrary(token, fileId)
    if (fromDrive.length > 0) return fromDrive
    const legacy = readLegacyBooks()
    if (legacy.length === 0) return fromDrive
    await writeLibrary(token, fileId, legacy)
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    return legacy
  })
  writeCache(userSub, books)
  return books
}

function persistBooks(userSub: string, books: Book[]) {
  pendingBooks = books
  persistChain = persistChain
    .then(async () => {
      if (!pendingBooks) return
      const snapshot = pendingBooks
      pendingBooks = null
      setSyncState({ status: 'saving', message: null })
      await withLibraryFile(userSub, (token, fileId) => writeLibrary(token, fileId, snapshot))
      setSyncState({ status: 'saved', message: null })
    })
    .catch((error: unknown) => {
      setSyncState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Could not save to Google Drive.',
      })
    })
}

export function useLibrary() {
  const { status, user } = useGoogleSession()
  const signedIn = status === 'signed-in' && user
  const { data, mutate, isLoading, error } = useSWR<Book[]>(
    signedIn ? ['library', user.sub] : null,
    ([, userSub]: [string, string]) => loadBooks(userSub),
    {
      fallbackData: typeof window !== 'undefined' && signedIn ? readCache(user.sub) : undefined,
      revalidateOnFocus: false,
    },
  )
  const sync = useSyncExternalStore(
    (listener) => {
      syncListeners.add(listener)
      return () => syncListeners.delete(listener)
    },
    () => syncState,
    () => syncState,
  )
  const books = data ?? []

  const save = (next: Book[]) => {
    if (!user) return
    writeCache(user.sub, next)
    mutate(next, { revalidate: false })
    persistBooks(user.sub, next)
  }

  return {
    books,
    isLoading: Boolean(signedIn) && isLoading && !data,
    error: error instanceof Error ? error.message : null,
    syncStatus: sync.status,
    syncMessage: sync.message,
    addBook: (book: Omit<Book, 'id' | 'addedAt'>) =>
      save([
        { ...book, id: crypto.randomUUID(), addedAt: new Date().toISOString() },
        ...books,
      ]),
    updateBook: (id: string, patch: Partial<Book>) =>
      save(books.map((book) => (book.id === id ? { ...book, ...patch } : book))),
    removeBook: (id: string) => save(books.filter((book) => book.id !== id)),
    hasBook: (olKey: string) => books.some((book) => book.olKey === olKey),
    retry: () => mutate(),
    retrySave: () => {
      if (user) persistBooks(user.sub, books)
    },
  }
}

export function clearLibrarySession(userSub?: string) {
  forgetDriveFile(userSub)
  setSyncState({ status: 'idle', message: null })
  pendingBooks = null
}
