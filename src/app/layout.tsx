import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WeddingRingRing - Voice Message Guestbook for Weddings',
  description: 'The charming rotary phone guestbook that captures heartfelt voice messages from your wedding guests',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
