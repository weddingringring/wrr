import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── IP hashing (never store raw IPs) ──

export async function hashIP(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT || 'wrr-share-default-salt'
  const data = new TextEncoder().encode(`${salt}:${ip}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function extractIP(request: Request): string {
  const headers = new Headers(request.headers)
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')
    || 'unknown'
}

// ── Persistent rate limiting via Supabase ──
// Falls back to in-memory if DB call fails (resilient)

const memoryLimiter = new Map<string, { minute: number[]; hour: number[] }>()

function checkMemoryRateLimit(key: string, maxPerMinute: number, maxPerHour: number): boolean {
  const now = Date.now()
  let entry = memoryLimiter.get(key)
  if (!entry) { entry = { minute: [], hour: [] }; memoryLimiter.set(key, entry) }
  entry.minute = entry.minute.filter(t => t > now - 60_000)
  entry.hour = entry.hour.filter(t => t > now - 3_600_000)
  if (entry.minute.length >= maxPerMinute || entry.hour.length >= maxPerHour) return false
  entry.minute.push(now)
  entry.hour.push(now)
  return true
}

// Clean memory limiter periodically
setInterval(() => {
  const cutoff = Date.now() - 3_600_000
  Array.from(memoryLimiter.entries()).forEach(([key, entry]) => {
    entry.hour = entry.hour.filter(t => t > cutoff)
    if (entry.hour.length === 0) memoryLimiter.delete(key)
  })
}, 600_000)

export async function checkRateLimit(
  ip: string,
  endpoint: string,
  maxPerMinute: number = 5,
  maxPerHour: number = 20
): Promise<boolean> {
  const ipHash = await hashIP(ip)
  const key = `${ipHash}:${endpoint}`

  // In-memory check first (fast path)
  if (!checkMemoryRateLimit(key, maxPerMinute, maxPerHour)) {
    return false
  }

  // Persistent check via Supabase RPC
  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_ip_hash: ipHash,
      p_endpoint: endpoint,
      p_max_per_minute: maxPerMinute,
      p_max_per_hour: maxPerHour,
    })

    if (error) {
      console.warn('Rate limit DB check failed, using memory only:', error.message)
      return true // Fail open — memory limiter is still enforced
    }

    return data === true
  } catch (err) {
    console.warn('Rate limit DB error, using memory only:', err)
    return true // Fail open
  }
}

// ── Access logging ──

export async function logAccess(
  eventId: string | null,
  ip: string,
  endpoint: string,
  success: boolean
): Promise<void> {
  try {
    const ipHash = await hashIP(ip)
    if (!eventId) return

    await supabaseAdmin
      .from('share_access_log')
      .insert({
        event_id: eventId,
        ip_hash: ipHash,
        endpoint,
        success,
      })
  } catch (err) {
    // Non-blocking — don't fail the request if logging fails
    console.error('Access logging error:', err)
  }
}

// ── Code expiry check ──

export function isCodeExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false // No expiry set = never expires (legacy codes)
  return new Date(expiresAt) < new Date()
}

// ── Default expiry duration ──

export const CODE_EXPIRY_DAYS = 30

export function getExpiryDate(days: number = CODE_EXPIRY_DAYS): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}
