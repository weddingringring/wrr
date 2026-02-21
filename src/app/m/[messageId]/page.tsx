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

function getBaseUrl(): string {
  const headersList = headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || ''
  const proto = headersList.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://weddingringring.com'
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { messageId } = params
  const { e, s } = searchParams

  const baseUrl = getBaseUrl()
  const pageUrl = `${baseUrl}/m/${messageId}${e ? `?e=${e}` : ''}${s ? `&s=${s}` : ''}`
  const ogImageUrl = `${baseUrl}/api/og/message?id=${messageId}&e=${e || ''}&s=${s || ''}`

  // WhatsApp requires og:image, og:image:width, og:image:height, og:image:type
  // Next.js 14.1 metadata API doesn't reliably output og:image sub-properties,
  // so we use 'other' for name-based fallbacks and render property-based tags
  // directly in the page component below.
  const buildMeta = (
    title: string,
    description: string,
    imageUrl: string,
    url: string
  ): Metadata => ({
    metadataBase: new URL(baseUrl),
    title,
    description,
    // REMOVED robots noindex - WhatsApp crawler respects it and won't fetch OG images
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: 'WeddingRingRing',
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
  })

  const fallback = buildMeta(
    'Audio Guestbook Message | WeddingRingRing',
    'Listen to a special voice message from a celebration.',
    ogImageUrl,
    pageUrl
  )

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

    const successOgImageUrl = `${baseUrl}/api/og/message?id=${messageId}&e=${e}&s=${s}`

    return buildMeta(title, description, successOgImageUrl, pageUrl)
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

/**
 * Page component renders MessageShareClient.
 * All OG meta tags are handled by generateMetadata() above — 
 * Next.js 14.1 metadata API correctly outputs og:image, og:image:width,
 * og:image:height, og:image:type in the right order.
 * 
 * DO NOT add explicit <meta property="og:image:..."> tags here!
 * They render BEFORE the metadata API tags in <head>, creating
 * "orphaned" structured OG properties (no parent og:image).
 * Facebook/WhatsApp parsers create a phantom image object with
 * no URL from them, which breaks link previews entirely.
 */
export default function MessageSharePage({ params, searchParams }: PageProps) {
  return <MessageShareClient params={params} />
}
