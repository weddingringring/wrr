'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import AdminHeader from '@/components/AdminHeader'
import { RefreshCw, CheckCircle, Copy, Check } from 'lucide-react'

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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  
  useEffect(() => { loadLogs() }, [filter, severityFilter])
  
  const loadLogs = async () => {
    try {
      let query = supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(100)
      if (filter === 'unresolved') query = query.eq('resolved', false)
      if (severityFilter !== 'all') query = query.eq('severity', severityFilter)
      const { data, error } = await query
      if (error) throw error
      setLogs(data || [])
    } catch (err) { console.error('Error loading logs:', err) }
    finally { setLoading(false) }
  }
  
  const markResolved = async (id: string) => {
    setResolvingId(id)
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      // Update local state immediately for instant feedback
      setLogs(prev => prev.map(l => l.id === id ? { ...l, resolved: true } : l))
      // If filtering unresolved, remove from list after brief delay
      if (filter === 'unresolved') {
        setTimeout(() => {
          setLogs(prev => prev.filter(l => l.id !== id))
        }, 800)
      }
    } catch (err) {
      console.error('Error marking resolved:', err)
      alert('Failed to mark as resolved. Check RLS policies on error_logs table.')
    } finally {
      setResolvingId(null)
    }
  }

  const copyError = async (log: ErrorLog) => {
    const text = [
      `[${log.severity.toUpperCase()}] ${log.source}`,
      `Date: ${new Date(log.created_at).toLocaleString()}`,
      `Message: ${log.error_message}`,
      log.context ? `\nContext:\n${JSON.stringify(log.context, null, 2)}` : '',
      log.error_stack ? `\nStack Trace:\n${log.error_stack}` : ''
    ].filter(Boolean).join('\n')

    await navigator.clipboard.writeText(text)
    setCopiedId(log.id)
    setTimeout(() => setCopiedId(null), 2000)
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'rgba(180,60,60,0.08)', color: '#a33', border: '#c44' }
      case 'error': return { bg: 'rgba(180,80,80,0.08)', color: '#b05050', border: '#d88' }
      case 'warning': return { bg: 'rgba(180,140,60,0.08)', color: '#8a7020', border: '#c4a030' }
      case 'info': return { bg: 'rgba(80,120,180,0.06)', color: '#4a7090', border: '#7aa0c0' }
      default: return { bg: '#f5f5f5', color: '#888', border: '#ccc' }
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F5F3' }}>
        <div className="w-16 h-16 border-4 border-deep-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen" style={{ background: '#F6F5F3' }}>
      <AdminHeader currentPage="errors" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl" style={{ color: "#111" }}>Error Logs</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6" style={{ border: "1px solid #E8E6E2" }}>
          <div className="flex flex-wrap gap-4">
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Status</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: "1px solid #E8E6E2" }}>
                <option value="all">All Errors</option>
                <option value="unresolved">Unresolved Only</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#555", marginBottom: "0.375rem", display: "block" }}>Severity</label>
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-4 py-2 rounded-lg focus:ring-2 focus:ring-deep-green" style={{ border: "1px solid #E8E6E2" }}>
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div className="ml-auto flex items-end">
              <button onClick={loadLogs}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition"
                style={{ border: '1px solid #E8E6E2', cursor: 'pointer', background: '#fff', color: '#555', fontSize: '0.875rem', fontWeight: 500 }}>
                <RefreshCw size={14} style={{ opacity: 0.6 }} />
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        {logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center" style={{ border: '1px solid #E8E6E2' }}>
            <p style={{ color: '#999' }}>No error logs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const sevColor = getSeverityColor(log.severity)
              return (
              <div key={log.id}
                className="bg-white rounded-lg shadow-sm p-5"
                style={{ border: '1px solid #E8E6E2', borderLeft: `4px solid ${sevColor.border}`, position: 'relative' }}>

                {/* Copy button — top right */}
                <button
                  onClick={() => copyError(log)}
                  title="Copy error details"
                  style={{
                    position: 'absolute', top: '0.875rem', right: '0.875rem',
                    background: 'none', border: '1px solid #E8E6E2', borderRadius: '0.25rem',
                    cursor: 'pointer', padding: '0.375rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: copiedId === log.id ? '#3D5A4C' : '#bbb',
                    transition: 'color 0.15s'
                  }}
                >
                  {copiedId === log.id ? <Check size={14} /> : <Copy size={14} />}
                </button>

                <div className="flex items-start justify-between mb-3 pr-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span style={{
                        display: 'inline-flex', padding: '2px 10px', borderRadius: '999px',
                        fontSize: '0.6875rem', fontWeight: 600, background: sevColor.bg, color: sevColor.color,
                      }}>
                        {log.severity.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: '#999' }}>{new Date(log.created_at).toLocaleString()}</span>
                      {log.resolved && (
                        <span className="inline-flex items-center gap-1" style={{
                          padding: '2px 10px', borderRadius: '999px',
                          fontSize: '0.6875rem', fontWeight: 500, background: 'rgba(61,90,76,0.08)', color: '#3D5A4C',
                        }}>
                          <CheckCircle size={11} /> Resolved
                        </span>
                      )}
                    </div>
                    <p style={{ fontWeight: 600, color: '#111', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{log.source}</p>
                    <p style={{ fontSize: '0.8125rem', color: '#555' }}>{log.error_message}</p>
                  </div>
                  {!log.resolved && (
                    <button onClick={() => markResolved(log.id)}
                      disabled={resolvingId === log.id}
                      className="ml-4 px-3 py-1.5 text-sm rounded-lg transition"
                      style={{
                        border: '1px solid #E8E6E2', cursor: resolvingId === log.id ? 'wait' : 'pointer',
                        background: resolvingId === log.id ? 'rgba(61,90,76,0.06)' : '#fff',
                        color: resolvingId === log.id ? '#3D5A4C' : '#555',
                        fontWeight: 500, fontSize: '0.8125rem'
                      }}>
                      {resolvingId === log.id ? 'Resolving...' : 'Mark Resolved'}
                    </button>
                  )}
                </div>
                {log.context && Object.keys(log.context).length > 0 && (
                  <div className="mt-3 p-3 rounded-lg" style={{ background: '#FAFAF9', border: '1px solid #E8E6E2' }}>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#888', marginBottom: '0.375rem' }}>Context:</p>
                    <pre style={{ fontSize: '0.6875rem', color: '#555' }} className="overflow-x-auto">{JSON.stringify(log.context, null, 2)}</pre>
                  </div>
                )}
                {log.error_stack && (
                  <details className="mt-3">
                    <summary style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#888', cursor: 'pointer' }}>Stack Trace</summary>
                    <pre className="mt-2 p-3 rounded-lg overflow-x-auto" style={{ background: '#FAFAF9', border: '1px solid #E8E6E2', fontSize: '0.6875rem', color: '#555' }}>{log.error_stack}</pre>
                  </details>
                )}
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
