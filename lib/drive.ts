import type { Book } from '@/lib/books'

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'
const FILE_NAME = 'shelfmark-library.json'
const fileIdByUser = new Map<string, string>()

export type LibraryFile = {
  version: 1
  updatedAt: string
  books: Book[]
}

export class DriveError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'DriveError'
  }
}

function cacheKey(userSub: string) {
  return `shelfmark:driveFile:${userSub}`
}

function rememberedFileId(userSub: string) {
  return fileIdByUser.get(userSub) ?? window.sessionStorage.getItem(cacheKey(userSub))
}

function rememberFileId(userSub: string, fileId: string) {
  fileIdByUser.set(userSub, fileId)
  window.sessionStorage.setItem(cacheKey(userSub), fileId)
}

export function forgetDriveFile(userSub?: string) {
  if (userSub) {
    fileIdByUser.delete(userSub)
    window.sessionStorage.removeItem(cacheKey(userSub))
    return
  }
  fileIdByUser.clear()
}

async function driveFetch(token: string, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(url, { ...init, headers })
  if (res.ok) return res

  let detail = res.statusText
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    if (body.error?.message) detail = body.error.message
  } catch {
    // Drive sometimes returns an empty body on auth failures.
  }
  throw new DriveError(detail, res.status)
}

async function searchLibraryFile(token: string) {
  const query = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`)
  const res = await driveFetch(
    token,
    `${DRIVE_API}/files?q=${query}&fields=files(id)&pageSize=1&spaces=drive`,
  )
  const data = (await res.json()) as { files?: { id: string }[] }
  return data.files?.[0]?.id ?? null
}

async function createLibraryFile(token: string) {
  const res = await driveFetch(token, `${DRIVE_API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' }),
  })
  const file = (await res.json()) as { id: string }
  return file.id
}

export async function getLibraryFileId(token: string, userSub: string) {
  const cached = rememberedFileId(userSub)
  if (cached) return cached

  const existing = await searchLibraryFile(token)
  const fileId = existing ?? (await createLibraryFile(token))
  rememberFileId(userSub, fileId)
  return fileId
}

function parseLibrary(value: unknown): Book[] {
  if (!value || typeof value !== 'object') return []
  const books = (value as { books?: unknown }).books
  return Array.isArray(books) ? (books as Book[]) : []
}

export async function readLibrary(token: string, fileId: string) {
  const res = await driveFetch(token, `${DRIVE_API}/files/${fileId}?alt=media`)
  const text = await res.text()
  if (!text.trim()) return []
  try {
    return parseLibrary(JSON.parse(text) as unknown)
  } catch {
    return []
  }
}

export async function writeLibrary(token: string, fileId: string, books: Book[]) {
  const payload: LibraryFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    books,
  }
  await driveFetch(token, `${DRIVE_UPLOAD}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload, null, 2),
  })
}
