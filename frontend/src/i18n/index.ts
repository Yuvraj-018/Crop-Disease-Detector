import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import en from './locales/en.json'
import hi from './locales/hi.json'

// Retrieve stored language preference from Zustand store (localStorage-backed)
const getInitialLanguage = (): string => {
  try {
    const user = useAuthStore.getState().user
    return user?.language_pref || 'en'
  } catch {
    return 'en'
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React handles escaping
    },
  })

// Subscribe to store updates to dynamically sync language if user language_pref changes
let currentLang = getInitialLanguage()
useAuthStore.subscribe((state) => {
  const newLang = state.user?.language_pref
  if (newLang && newLang !== currentLang) {
    currentLang = newLang
    i18n.changeLanguage(newLang).catch(() => {})
  }
})

export default i18n
