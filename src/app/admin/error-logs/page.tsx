'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface ErrorLog {
  id: string
  source: string
  error_message: string
  error_stack: string | null
  context: any
  severity: 'info' | 'warning' | 'error' | 'critical'
  resolved: boolean
  created_at: string
}

export default function AdminErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  
  useEffect(() => {
    loadLogs()
  }, [filter, severityFilter])
  
  const loadLogs = async () => {
    try {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (filter === 'unresolved') {
        query = query.eq('resolved', false)
      }
      
      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setLogs(data || [])
    } catch (err) {
      console.error('Error loading logs:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const markResolved = async (id: string) => {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (error) throw error
      
      loadLogs()
    } catch (err) {
      console.error('Error marking resolved:', err)
    }
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'error': return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-sage-light text-sage-dark border-sage'
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-sage-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/admin/dashboard" className="text-sm text-sage-dark hover:text-charcoal mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="font-serif text-3xl text-charcoal">Error Logs</h1>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green"
              >
                <option value="all">All Errors</option>
                <option value="unresolved">Unresolved Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-4 py-2 border border-sage-light rounded-lg focus:ring-2 focus:ring-deep-green"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            
            <div className="ml-auto flex items-end">
              <button
                onClick={loadLogs}
                className="px-4 py-2 bg-deep-green text-white rounded-lg hover:bg-deep-green-dark"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        {/* Error Logs */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-sage-dark">No error logs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                  log.severity === 'critical' ? 'border-red-500' :
                  log.severity === 'error' ? 'border-rose-500' :
                  log.severity === 'warning' ? 'border-yellow-500' :
                  'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(log.severity)}`}>
                        {log.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-sage-dark">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      {log.resolved && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          RESOLVED
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-charcoal mb-1">{log.source}</p>
                    <p className="text-sm text-charcoal">{log.error_message}</p>
                  </div>
                  
                  {!log.resolved && (
                    <button
                      onClick={() => markResolved(log.id)}
                      className="ml-4 px-4 py-2 text-sm bg-sage-light text-charcoal rounded-lg hover:bg-sage"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
                
                {log.context && Object.keys(log.context).length > 0 && (
                  <div className="mt-4 p-4 bg-sage-light/30 rounded-lg">
                    <p className="text-xs font-medium text-sage-dark mb-2">Context:</p>
                    <pre className="text-xs text-charcoal overflow-x-auto">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  </div>
                )}
                
                {log.error_stack && (
                  <details className="mt-4">
                    <summary className="text-xs font-medium text-sage-dark cursor-pointer hover:text-charcoal">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 p-4 bg-sage-light/30 rounded-lg text-xs text-charcoal overflow-x-auto">
                      {log.error_stack}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
