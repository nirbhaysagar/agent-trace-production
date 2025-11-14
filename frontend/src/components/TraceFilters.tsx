import { useEffect, useState } from 'react'
import { Filter, Search, X, CheckSquare, Square, Bookmark, BookmarkPlus, Trash2 } from 'lucide-react'
import type { AgentTrace, TraceFilters } from '../types/trace'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

interface TraceFiltersProps {
  trace: AgentTrace
  filters: TraceFilters
  onFiltersChange: (filters: TraceFilters) => void
}

interface SavedFilter {
  id: string
  name: string
  filters: TraceFilters
}

const TraceFilters: React.FC<TraceFiltersProps> = ({ trace, filters, onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setSavedFilters([])
      return
    }
    const fetchFilters = async () => {
      try {
        const res = await api.get<{ filters: SavedFilter[] }>('/api/filters')
        setSavedFilters(res.data.filters || [])
      } catch (error) {
        // Silently fail for guest mode
        setSavedFilters([])
      }
    }
    void fetchFilters()
  }, [user])

  const handleSaveFilter = async () => {
    if (!user) return
    const name = window.prompt('Save filters as (name):')
    if (!name) return
    try {
      await api.post('/api/filters', { name, filters })
      const res = await api.get<{ filters: SavedFilter[] }>('/api/filters')
      setSavedFilters(res.data.filters || [])
    } catch (error) {
      console.error('Failed to save filter', error)
    }
  }

  const handleApplyFilter = (filter: SavedFilter) => {
    onFiltersChange(filter.filters)
  }

  const handleDeleteFilter = async (filterId: string) => {
    try {
      await api.delete(`/api/filters/${filterId}`)
      setSavedFilters((prev) => prev.filter((f) => f.id !== filterId))
    } catch (error) {
      console.error('Failed to delete filter', error)
    }
  }

  // Get unique step types from the trace
  const stepTypes = Array.from(new Set(trace.steps.map(step => step.step_type)))

  const handleStepTypeToggle = (stepType: string) => {
    const newStepTypes = filters.stepTypes.includes(stepType)
      ? filters.stepTypes.filter(type => type !== stepType)
      : [...filters.stepTypes, stepType]
    
    onFiltersChange({
      ...filters,
      stepTypes: newStepTypes
    })
  }

  const handleShowErrorsToggle = () => {
    onFiltersChange({
      ...filters,
      showErrors: !filters.showErrors
    })
  }

  const handleSearchChange = (query: string) => {
    onFiltersChange({
      ...filters,
      searchQuery: query
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      stepTypes: [],
      showErrors: false,
      searchQuery: ''
    })
  }

  const hasActiveFilters = filters.stepTypes.length > 0 || filters.showErrors || filters.searchQuery.length > 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                {filters.stepTypes.length + (filters.showErrors ? 1 : 0) + (filters.searchQuery ? 1 : 0)} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Clear all filters"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? (
                <X className="w-4 h-4 text-gray-500" />
              ) : (
                <Filter className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Steps
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search step content..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Step Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step Types
            </label>
            <div className="space-y-2">
              {stepTypes.map(stepType => {
                const isSelected = filters.stepTypes.includes(stepType)
                const stepCount = trace.steps.filter(step => step.step_type === stepType).length
                
                return (
                  <label key={stepType} className="flex items-center space-x-2 cursor-pointer">
                    <button
                      onClick={() => handleStepTypeToggle(stepType)}
                      className="flex items-center justify-center w-4 h-4"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <span className="text-sm text-gray-700 capitalize">{stepType}</span>
                    <span className="text-xs text-gray-500">({stepCount})</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Show Errors Only */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <button
                onClick={handleShowErrorsToggle}
                className="flex items-center justify-center w-4 h-4"
              >
                {filters.showErrors ? (
                  <CheckSquare className="w-4 h-4 text-primary-600" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <span className="text-sm text-gray-700">Show errors only</span>
              {trace.error_count > 0 && (
                <span className="text-xs text-red-600">({trace.error_count})</span>
              )}
            </label>
          </div>

          {/* Trace Stats */}
          <div className="pt-4 border-t border-gray-200 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Trace Statistics</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Steps:</span>
                  <span className="font-medium">{trace.steps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">
                    {trace.total_duration_ms ? `${trace.total_duration_ms}ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tokens:</span>
                  <span className="font-medium">{trace.total_tokens || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Errors:</span>
                  <span className={`font-medium ${trace.error_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {trace.error_count}
                  </span>
                </div>
              </div>
            </div>

            {user && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1"><Bookmark className="h-4 w-4" /> Saved Filters</h4>
                  <button onClick={handleSaveFilter} className="btn-secondary text-xs px-2 py-1">
                    <BookmarkPlus className="mr-1 h-3 w-3" /> Save current
                  </button>
                </div>
                {savedFilters.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved filters yet.</p>
                ) : (
                  <div className="space-y-2">
                    {savedFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-gray-600">
                        <button onClick={() => handleApplyFilter(filter)} className="text-left font-medium text-gray-700 hover:text-primary-600">
                          {filter.name}
                        </button>
                        <button onClick={() => handleDeleteFilter(filter.id)} className="text-gray-400 hover:text-red-600" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TraceFilters
