'use client'

import { Cloud, CloudOff, Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearLibrarySession, type SyncStatus } from '@/lib/use-library'
import { useGoogleSession } from '@/lib/google-auth'

type AccountButtonProps = {
  syncStatus: SyncStatus
  syncMessage: string | null
  onRetrySave: () => void
}

export function AccountButton({ syncStatus, syncMessage, onRetrySave }: AccountButtonProps) {
  const { user, signOut } = useGoogleSession()
  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <SyncHint status={syncStatus} message={syncMessage} onRetrySave={onRetrySave} />
      {user.picture ? (
        <img
          src={user.picture}
          alt=""
          width={24}
          height={24}
          className="size-6 rounded-full bg-secondary object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">{user.email}</span>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Sign out ${user.email}`}
        onClick={() => {
          clearLibrarySession(user.sub)
          signOut()
        }}
      >
        <LogOut aria-hidden />
        Sign out
      </Button>
    </div>
  )
}

function SyncHint({
  status,
  message,
  onRetrySave,
}: {
  status: SyncStatus
  message: string | null
  onRetrySave: () => void
}) {
  if (status === 'idle') return null

  const label =
    status === 'saving'
      ? 'Saving to Drive'
      : status === 'saved'
        ? 'Saved to Drive'
        : (message ?? 'Could not save to Drive')

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={onRetrySave}
        title={label}
        className="hidden items-center gap-1.5 text-xs text-destructive sm:flex"
      >
        <CloudOff className="size-3.5" aria-hidden />
        Couldn’t save. Retry
      </button>
    )
  }

  return (
    <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex" title={label}>
      {status === 'saving' ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Cloud className="size-3.5" aria-hidden />
      )}
      {label}
    </span>
  )
}
