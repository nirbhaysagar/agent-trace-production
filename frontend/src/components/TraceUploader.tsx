import { useState } from 'react'
import { Upload, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { AgentTrace, TraceUploadRequest, TraceResponse } from '../types/trace'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { saveGuestTrace } from '../utils/guestSession'

interface TraceUploaderProps {
  onTraceUploaded: (trace: AgentTrace) => void
  disabled?: boolean
}

const TraceUploader: React.FC<TraceUploaderProps> = ({ onTraceUploaded, disabled = false }) => {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [traceName, setTraceName] = useState('')
  const [traceDescription, setTraceDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use guest endpoint if not authenticated
      let endpoint = user ? '/api/traces/upload-file' : '/api/traces/upload-file-guest'
      let response: any
      
      try {
        response = await api.post<TraceResponse>(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } catch (error: any) {
        // If authenticated upload fails with 503 (service unavailable), fall back to guest mode
        if (user && error.response?.status === 503) {
          console.warn('Authenticated upload failed, falling back to guest mode')
          endpoint = '/api/traces/upload-file-guest'
          response = await api.post<TraceResponse>(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } else {
          throw error
        }
      }

      const trace = response.data
      // Save to localStorage if guest mode
      if (!user || endpoint === '/api/traces/upload-file-guest') {
        saveGuestTrace(trace)
        toast.success('Trace uploaded! (Guest mode - data will be cleared when you close the browser)')
      } else {
        toast.success('Trace uploaded successfully!')
      }

      onTraceUploaded(trace)
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Upload error:', error)
      
      // Provide more specific error messages
      if (error.response?.status === 503) {
        toast.error('Backend service unavailable. Please ensure the backend server is running.')
      } else if (error.response?.status === 400) {
        toast.error('Invalid file format. Please check that your file is valid JSON.')
      } else if (error.response?.status === 413) {
        toast.error('File too large. Please upload a smaller file.')
      } else {
        toast.error('Failed to upload trace. Please check your file format and try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleJsonUpload = async () => {
    if (!jsonInput.trim()) {
      toast.error('Please enter JSON data')
      return
    }

    setIsUploading(true)
    try {
      const jsonData = JSON.parse(jsonInput)
      
      const request: TraceUploadRequest = {
        trace_data: jsonData,
        name: traceName || undefined,
        description: traceDescription || undefined,
        is_public: user ? isPublic : false, // Guest traces can't be public
      }

      // Use guest endpoint if not authenticated
      let endpoint = user ? '/api/traces/upload' : '/api/traces/upload-guest'
      let response: any
      
      try {
        response = await api.post<TraceResponse>(endpoint, request)
      } catch (error: any) {
        // If authenticated upload fails with 503 (service unavailable), fall back to guest mode
        if (user && error.response?.status === 503) {
          console.warn('Authenticated upload failed, falling back to guest mode')
          endpoint = '/api/traces/upload-guest'
          const guestRequest = { ...request, is_public: false } // Guest traces can't be public
          response = await api.post<TraceResponse>(endpoint, guestRequest)
        } else {
          throw error
        }
      }

      const trace = response.data
      // Save to localStorage if guest mode
      if (!user || endpoint === '/api/traces/upload-guest') {
        saveGuestTrace(trace)
        toast.success('Trace uploaded! (Guest mode - data will be cleared when you close the browser)')
      } else {
        toast.success('Trace uploaded successfully!')
      }

      onTraceUploaded(trace)
      setJsonInput('')
      setTraceName('')
      setTraceDescription('')
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Upload error:', error)
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format. Please check your input.')
      } else if (error.response?.status === 503) {
        toast.error('Backend service unavailable. Please ensure the backend server is running.')
      } else if (error.response?.status === 400) {
        toast.error('Invalid trace data format. Please check your JSON structure.')
      } else if (error.response?.status === 413) {
        toast.error('Trace data too large. Please reduce the size of your trace.')
      } else {
        toast.error('Failed to upload trace. Please check your data format and try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const exampleJson = {
    steps: [
      {
        type: "thought",
        content: "I need to analyze the user's request",
        timestamp: "2024-01-01T10:00:00Z",
        duration_ms: 150
      },
      {
        type: "action",
        content: "Calling search API",
        inputs: { query: "example search" },
        outputs: { results: ["result1", "result2"] },
        timestamp: "2024-01-01T10:00:01Z",
        duration_ms: 500
      },
      {
        type: "observation",
        content: "Search completed successfully",
        timestamp: "2024-01-01T10:00:02Z",
        duration_ms: 50
      }
    ]
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload JSON File
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">JSON files only</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".json"
                onChange={handleFileUpload}
                disabled={isUploading || disabled}
              />
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or paste JSON directly</span>
          </div>
        </div>

        {/* JSON Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trace Name (Optional)
            </label>
            <input
              type="text"
              value={traceName}
              onChange={(e) => setTraceName(e.target.value)}
              placeholder="My Agent Trace"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={traceDescription}
              onChange={(e) => setTraceDescription(e.target.value)}
              placeholder="Brief description of this trace"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {user && (
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Make this trace publicly viewable</span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-6">Public traces can be viewed by anyone with the link, even without signing in</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JSON Data
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={JSON.stringify(exampleJson, null, 2)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
            />
          </div>

          <button
            onClick={handleJsonUpload}
            disabled={isUploading || !jsonInput.trim() || disabled}
            className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Upload Trace
              </>
            )}
          </button>
        </div>

        {!user && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Guest Mode:</strong> You're using the tool without signing in. Your traces will be stored temporarily and cleared when you close the browser. 
            <span className="block mt-1">Sign in to save traces permanently.</span>
          </div>
        )}

        {/* Example Format */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Expected JSON Format:</h4>
          <pre className="text-xs text-gray-600 overflow-x-auto">
{JSON.stringify(exampleJson, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default TraceUploader
