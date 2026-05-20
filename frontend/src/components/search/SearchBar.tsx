import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePersonSearch } from '../../hooks/usePersonSearch'
import SearchResults from './SearchResults'

export default function SearchBar() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const { query, setQuery, results, isFetching } = usePersonSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(val: string) {
    setQuery(val)
    setOpen(val.length > 0)
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => query && setOpen(true)}
        placeholder={t('searchPlaceholder')}
        className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {isFetching && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">…</span>
      )}
      {open && results.length > 0 && (
        <SearchResults results={results} onClose={() => { setOpen(false); setQuery('') }} />
      )}
    </div>
  )
}
