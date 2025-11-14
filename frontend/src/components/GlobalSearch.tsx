import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Search, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

interface SearchResult {
  trace_id: string
  step_id: string
  snippet: string
  trace_name?: string
}

const GlobalSearch: React.FC = () => {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const router = useRouter()

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        if (user) {
          // Authenticated: search via API
          const res = await api.get<{ results: SearchResult[] }>('/api/search', { params: { q: query } })
          setResults(res.data.results || [])
        } else {
          // Guest: search in localStorage
          const { getGuestTraces } = await import('../utils/guestSession')
          const guestTraces = getGuestTraces()
          const queryLower = query.toLowerCase()
          const results: SearchResult[] = []
          
          guestTraces.forEach(trace => {
            trace.steps.forEach(step => {
              const contentMatch = step.content?.toLowerCase().includes(queryLower)
              const errorMatch = step.error?.toLowerCase().includes(queryLower)
              
              if (contentMatch || errorMatch) {
                const snippet = (contentMatch ? step.content : step.error)?.substring(0, 200) || ''
                results.push({
                  trace_id: trace.id,
                  step_id: step.id,
                  snippet: snippet + (snippet.length >= 200 ? '...' : ''),
                  trace_name: trace.name,
                })
              }
            })
          })
          
          setResults(results.slice(0, 50))
        }
      } catch (error) {
        console.error('Search failed', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query, open, user])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    setQuery('')
    setResults([])
    void router.push(`/trace/${result.trace_id}?step=${result.step_id}`)
  }

  // Guest mode is supported, so always show search

  return (
    <div className="relative max-w-sm w-full">
      <div className={`flex items-center rounded-full border ${open ? 'border-primary-500' : 'border-gray-200'} bg-white px-3 py-2 shadow-sm transition-shadow`}
        onFocus={() => setOpen(true)}
      >
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search traces..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => setOpen(true)}
          className="ml-2 flex-1 border-none bg-transparent text-sm focus:outline-none"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </div>
      {open && query.length >= 2 && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">No matches</div>
          ) : (
            <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto">
              {results.map((result) => (
                <li
                  key={`${result.trace_id}-${result.step_id}`}
                  className="cursor-pointer px-4 py-3 text-sm hover:bg-gray-50"
                  onMouseDown={() => handleSelect(result)}
                >
                  <div className="font-medium text-gray-900">{result.trace_name || result.trace_id.slice(0, 8)}</div>
                  <div className="text-xs text-gray-500 line-clamp-2">{result.snippet}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
