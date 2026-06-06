import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

// ─── Schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

// ─── Component ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const storeLogin = useAuthStore((s) => s.login)
  const navigate   = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(data)
      storeLogin(response.access_token, response.user)
      toast.success(t('auth.login.success_toast', { defaultValue: 'Welcome back, {{name}}! 🌿', name: response.user.full_name.split(' ')[0] }))
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; error?: { message?: string } } } })
          ?.response?.data?.detail ||
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ||
        t('auth.login.error_toast', { defaultValue: 'Invalid email or password' })
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footerText={t('auth.login.no_account')}
      footerLink={{ label: t('auth.login.register_link'), to: '/register' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email */}
        <Input
          id="login-email"
          label={t('auth.login.email_label')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.login.email_placeholder')}
          error={errors.email?.message}
          leftAddon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          {...register('email')}
        />

        {/* Password */}
        <div>
          <Input
            id="login-password"
            label={t('auth.login.password_label')}
            type="password"
            autoComplete="current-password"
            placeholder={t('auth.login.password_placeholder')}
            error={errors.password?.message}
            leftAddon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            }
            {...register('password')}
          />
          <div className="mt-1.5 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-body-sm text-primary hover:text-primary-container font-label transition-colors"
            >
              {t('auth.login.forgot_password', { defaultValue: 'Forgot password?' })}
            </Link>
          </div>
        </div>

        {/* Submit */}
        <Button
          id="login-submit"
          type="submit"
          fullWidth
          size="lg"
          loading={isLoading}
          className="mt-2"
        >
          {t('auth.login.submit')}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-outline-variant/30" />
          <span className="text-body-sm text-on-surface-variant">{t('auth.login.or_divider', { defaultValue: 'or' })}</span>
          <div className="flex-1 h-px bg-outline-variant/30" />
        </div>

        {/* Google (future) */}
        <Button
          id="login-google"
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => toast.info(t('auth.login.google_coming_soon', { defaultValue: 'Google sign-in coming soon!' }))}
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          }
        >
          {t('auth.login.google_btn', { defaultValue: 'Continue with Google' })}
        </Button>
      </form>
    </AuthLayout>
  )
}
