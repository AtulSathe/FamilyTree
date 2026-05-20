import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../common/Avatar'
import { Badge } from '../common/Badge'
import SearchBar from '../search/SearchBar'
import MockRoleSwitcher from '../common/MockRoleSwitcher'

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const langs = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'mr', label: 'म' },
]

export default function TopBar() {
  const { t, i18n } = useTranslation('common')
  const { user } = useAuth()

  return (
    <header className="flex items-center gap-4 px-4 h-14 bg-white border-b shadow-sm shrink-0">
      <Link to="/" className="text-blue-700 font-bold text-lg tracking-tight whitespace-nowrap">
        🌳 {t('appName')}
      </Link>

      <div className="flex-1 max-w-md">
        <SearchBar />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Dev role switcher — only in mock mode */}
      {IS_MOCK && <MockRoleSwitcher />}

      {/* Language switcher */}
      <div className="flex items-center gap-1">
        {langs.map(l => (
          <button
            key={l.code}
            onClick={() => i18n.changeLanguage(l.code)}
            className={`px-2 py-1 text-xs rounded ${
              i18n.language === l.code
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* User info */}
      <div className="flex items-center gap-2 shrink-0">
        <Avatar src={null} name={user.fullName} size={32} />
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-medium text-gray-800">{user.fullName}</span>
          <Badge label={user.role} />
        </div>
      </div>
    </header>
  )
}
