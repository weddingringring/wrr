import { Metadata } from 'next'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { verifyMessageShareToken } from '@/lib/message-share'
import MessageShareClient from './MessageShareClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { messageId: string }
  searchParams: { e?: string; s?: string }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { messageId } = params
  const { e, s } = searchParams

  // Determine base URL from actual request headers
  const headersList = headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || ''
  const proto = headersList.get('x-forwarded-proto') || 'https'
  const baseUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'https://weddingringring.com')

  // Default fallback metadata
  const fallback: Metadata = {
    title: 'Audio Guestbook Message | WeddingRingRing',
    description: 'Listen to a special voice message from a celebration.',
    robots: { index: false, follow: false },
    openGraph: {
      title: 'Audio Guestbook Message',
      description: 'Listen to a special voice message from a celebration.',
      type: 'website',
      images: [`${baseUrl}/api/og/message?id=${messageId}&e=${e || ''}&s=${s || ''}`],
    },
  }

  if (!e || !s) return fallback

  try {
    const verification = await verifyMessageShareToken(messageId, e, s)
    if (!verification.valid) return fallback

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: message } = await supabase
      .from('messages')
      .select('caller_name, event_id')
      .eq('id', messageId)
      .eq('is_deleted', false)
      .single()

    if (!message) return fallback

    const { data: event } = await supabase
      .from('events')
      .select('partner_1_first_name, partner_2_first_name, event_type')
      .eq('id', message.event_id)
      .single()

    const callerName = message.caller_name || 'A guest'
    const couple = event
      ? (event.partner_1_first_name && event.partner_2_first_name
        ? `${event.partner_1_first_name} & ${event.partner_2_first_name}`
        : event.partner_1_first_name || '')
      : ''

    const eventType = formatEventType(event?.event_type)
    const title = couple
      ? `Message from ${callerName} — ${couple}'s ${eventType}`
      : `Voice message from ${callerName}`
    const description = couple
      ? `Listen to ${callerName}'s voice message from ${couple}'s ${eventType} 🤍`
      : `Listen to a special voice message from ${callerName} 🤍`

    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'WeddingRingRing',
        images: [{
          url: `${baseUrl}/api/og/message?id=${messageId}&e=${e}&s=${s}`,
          width: 1200,
          height: 630,
          alt: title,
        }],
      },
    }
  } catch {
    return fallback
  }
}

function formatEventType(type: string | null | undefined): string {
  if (!type) return 'celebration'
  const t = type.toLowerCase()
  if (t.includes('wedding')) return 'wedding'
  if (t.includes('birthday')) return 'birthday'
  if (t.includes('anniversary')) return 'anniversary'
  return 'celebration'
}

export default function MessageSharePage({ params }: PageProps) {
  return <MessageShareClient params={params} />
}
