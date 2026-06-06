import { useTranslation } from 'react-i18next'
import { AppLayout } from '../components/layout/AppLayout'
import { useAuth } from '../hooks/useAuth'
import { getInitials } from '../lib/utils'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <AppLayout title={t('profile.title')}>
      <div className="max-w-lg mx-auto space-y-4">
        {user && (
          <div className="glass rounded-3xl p-6 flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-display-sm font-heading font-bold text-primary">
              {getInitials(user.full_name)}
            </div>
            <div className="text-center">
              <p className="text-title-lg font-heading font-semibold text-on-surface">{user.full_name}</p>
              <p className="text-body-md text-on-surface-variant">{user.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-pill bg-primary/10 text-primary text-label-sm font-label border border-primary/20 capitalize">
                {user.role}
              </span>
            </div>
            {user.region && (
              <p className="text-body-sm text-on-surface-variant">📍 {user.region}</p>
            )}
            <button
              onClick={logout}
              className="mt-2 w-full py-3 rounded-xl bg-error/10 text-error border border-error/25 text-label-md font-label hover:bg-error/20 transition-colors"
            >
              {t('profile.sign_out')}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

