import { useState, useEffect } from 'react'
import { useSearch } from '../api/search'

export function usePersonSearch(surname?: string) {
  const [query, setQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 350)
    return () => clearTimeout(t)
  }, [query])

  const { data: results = [], isFetching } = useSearch(debouncedQ, surname)

  return { query, setQuery, results, isFetching }
}
