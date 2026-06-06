import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

// ─── Schema ────────────────────────────────────────────────────────────────

const schema = z
  .object({
    full_name:     z.string().min(2, 'Name must be at least 2 characters'),
    email:         z.string().email('Enter a valid email address'),
    password:      z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone:         z.string().optional(),
    region:        z.string().optional(),
    language_pref: z.enum(['en', 'hi', 'mr', 'pa', 'te', 'ta', 'kn', 'bn']).default('en'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

const REGIONS = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
]

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी (Hindi)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'bn', label: 'বাংলা (Bengali)' },
]

// ─── Step Indicator ────────────────────────────────────────────────────────

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i + 1 === step
              ? 'w-6 bg-primary shadow-neon-sm'
              : i + 1 < step
              ? 'w-3 bg-primary/50'
              : 'w-3 bg-surface-container-highest',
          )}
        />
      ))}
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { t } = useTranslation()
  const [step, setStep]       = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const storeLogin = useAuthStore((s) => s.login)
  const navigate   = useNavigate()

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { language_pref: 'en' },
  })

  const goNext = async () => {
    const valid = await trigger(['full_name', 'email', 'password', 'confirmPassword'])
    if (valid) setStep(2)
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const response = await authApi.register({
        email:         data.email,
        password:      data.password,
        full_name:     data.full_name,
        phone:         data.phone || undefined,
        region:        data.region || undefined,
        language_pref: data.language_pref,
      })
      storeLogin(response.access_token, response.user)
      toast.success(t('auth.register.success_toast', { defaultValue: 'Welcome to CropGuard, {{name}}! 🌿', name: response.user.full_name.split(' ')[0] }))
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('auth.register.error_toast', { defaultValue: 'Registration failed. Please try again.' })
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footerText={t('auth.register.has_account')}
      footerLink={{ label: t('auth.register.login_link'), to: '/login' }}
    >
      <StepDots step={step} total={2} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {step === 1 ? (
          <>
            {/* Step 1: Core credentials */}
            <Input
              id="register-name"
              label={t('auth.register.name_label')}
              placeholder={t('auth.register.name_placeholder')}
              error={errors.full_name?.message}
              leftAddon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              {...register('full_name')}
            />

            <Input
              id="register-email"
              label={t('auth.register.email_label')}
              type="email"
              placeholder={t('auth.register.email_placeholder')}
              error={errors.email?.message}
              leftAddon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              {...register('email')}
            />

            <Input
              id="register-password"
              label={t('auth.register.password_label')}
              type="password"
              placeholder={t('auth.register.password_placeholder', { defaultValue: 'Min. 8 characters' })}
              error={errors.password?.message}
              hint={t('auth.register.password_hint', { defaultValue: 'Use a strong, unique password' })}
              {...register('password')}
            />

            <Input
              id="register-confirm-password"
              label={t('auth.register.confirm_password_label', { defaultValue: 'Confirm password' })}
              type="password"
              placeholder={t('auth.register.confirm_password_placeholder', { defaultValue: 'Re-enter password' })}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button id="register-next" type="button" fullWidth size="lg" onClick={goNext} className="mt-2">
              {t('common.continue', { defaultValue: 'Continue' })} →
            </Button>
          </>
        ) : (
          <>
            {/* Step 2: Profile details */}
            <Input
              id="register-phone"
              label={t('auth.register.phone_label')}
              type="tel"
              placeholder={t('auth.register.phone_placeholder')}
              error={errors.phone?.message}
              leftAddon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
              {...register('phone')}
            />

            {/* Region select */}
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5 font-label uppercase tracking-wider">
                {t('auth.register.region_label')}
              </label>
              <select
                id="register-region"
                className="w-full bg-surface-container-lowest text-on-surface rounded-xl px-4 py-3 text-body-md border border-outline-variant/30 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                {...register('region')}
              >
                <option value="">{t('auth.register.region_placeholder', { defaultValue: 'Select state…' })}</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Language preference */}
            <div>
              <label className="block text-label-md text-on-surface-variant mb-1.5 font-label uppercase tracking-wider">
                {t('profile.language')}
              </label>
              <select
                id="register-language"
                className="w-full bg-surface-container-lowest text-on-surface rounded-xl px-4 py-3 text-body-md border border-outline-variant/30 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                {...register('language_pref')}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              {errors.language_pref && (
                <p className="mt-1.5 text-body-sm text-error">{errors.language_pref.message}</p>
              )}
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                id="register-back"
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                className="flex-1"
                size="lg"
              >
                ← {t('common.back', { defaultValue: 'Back' })}
              </Button>
              <Button
                id="register-submit"
                type="submit"
                loading={isLoading}
                className="flex-1"
                size="lg"
              >
                {t('auth.register.submit')}
              </Button>
            </div>
          </>
        )}
      </form>
    </AuthLayout>
  )
}
