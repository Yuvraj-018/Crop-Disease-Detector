import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ListItemSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import apiClient from '../../api/client'
import { formatDate } from '../../lib/utils'
import type { User, PaginatedResponse } from '../../types'

// ─── API call ────────────────────────────────────────────────────────────────

async function listUsers(page: number, search: string): Promise<PaginatedResponse<User>> {
  const res = await apiClient.get<PaginatedResponse<User>>('/users', {
    params: { page, per_page: 20, search: search || undefined },
  })
  return res.data
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const roleBadge: Record<string, string> = {
  admin:      'bg-error/10 text-error border-error/25',
  agronomist: 'bg-blue-400/10 text-blue-400 border-blue-400/25',
  farmer:     'bg-primary/10 text-primary border-primary/25',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-label border capitalize ${roleBadge[role] ?? roleBadge.farmer}`}>
      {role}
    </span>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-label-sm font-label ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary shadow-neon-sm' : 'bg-on-surface-variant/30'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({ user }: { user: User }) {
  const initials = user.full_name
    .split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('')

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-surface-container-high transition-colors">
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-surface-container-highest border border-white/[0.06] flex items-center justify-center shrink-0">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-label-sm font-label text-primary">{initials}</span>
        )}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-heading font-semibold text-on-surface truncate">{user.full_name}</p>
        <p className="text-label-sm font-label text-on-surface-variant truncate">{user.email}</p>
      </div>

      {/* Region */}
      <span className="hidden md:block text-body-sm text-on-surface-variant shrink-0 w-24 truncate">
        {user.region ?? '—'}
      </span>

      {/* Role */}
      <div className="shrink-0">
        <RoleBadge role={user.role} />
      </div>

      {/* Status */}
      <div className="hidden sm:block shrink-0 w-16">
        <StatusDot active={user.is_active} />
      </div>

      {/* Joined */}
      <span className="hidden lg:block text-label-sm font-label text-on-surface-variant shrink-0 w-24">
        {formatDate(user.created_at)}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery]   = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey:  ['admin', 'users', page, query],
    queryFn:   () => listUsers(page, query),
    staleTime: 30_000,
  })

  const users      = data?.items ?? []
  const totalPages = data?.total_pages ?? 1
  const total      = data?.total ?? 0

  return (
    <div className="max-w-5xl space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-headline-sm font-heading font-bold text-on-surface">User Management</h2>
          {data && (
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              {total.toLocaleString('en-IN')} registered users
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); setQuery(search); setPage(1) }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass text-body-sm text-on-surface placeholder:text-on-surface-variant/40 border border-white/[0.06] focus:border-primary/30 focus:outline-none transition-colors bg-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 text-label-sm font-label hover:bg-primary/15 transition-colors"
        >
          Search
        </button>
        {query && (
          <button
            type="button"
            onClick={() => { setSearch(''); setQuery(''); setPage(1) }}
            className="px-4 py-2.5 rounded-2xl glass text-label-sm font-label text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Table header */}
      <div className="hidden md:flex items-center gap-4 px-4 py-2 text-label-sm font-label text-on-surface-variant uppercase tracking-widest">
        <div className="w-9 shrink-0" />
        <p className="flex-1">User</p>
        <p className="w-24 shrink-0">Region</p>
        <p className="shrink-0">Role</p>
        <p className="hidden sm:block w-16 shrink-0">Status</p>
        <p className="hidden lg:block w-24 shrink-0">Joined</p>
      </div>

      {/* Users list */}
      <div className="glass rounded-2xl overflow-hidden">
        {isLoading && (
          <div className="p-2 space-y-0.5">
            {Array.from({ length: 8 }).map((_, i) => <ListItemSkeleton key={i} />)}
          </div>
        )}

        {isError && (
          <div className="py-10 text-center">
            <p className="text-body-md text-error">Failed to load users.</p>
            <p className="text-body-sm text-on-surface-variant mt-1">Ensure backend is running.</p>
          </div>
        )}

        {!isLoading && !isError && users.length === 0 && (
          <EmptyState
            icon={<span className="text-3xl">👥</span>}
            title="No users found"
            description={query ? `No users match "${query}".` : 'No registered users yet.'}
            className="py-12"
          />
        )}

        {!isLoading && !isError && users.length > 0 && (
          <div className="p-2 space-y-0.5">
            {users.map((u) => <UserRow key={u.id} user={u} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full glass text-label-sm font-label transition-all ${page === 1 ? 'text-on-surface-variant/30 cursor-not-allowed' : 'text-on-surface hover:text-primary'}`}
          >
            ← Prev
          </button>
          <span className="text-label-sm font-label text-on-surface-variant">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full glass text-label-sm font-label transition-all ${page === totalPages ? 'text-on-surface-variant/30 cursor-not-allowed' : 'text-on-surface hover:text-primary'}`}
          >
            Next →
          </button>
        </div>
      )}

    </div>
  )
}
