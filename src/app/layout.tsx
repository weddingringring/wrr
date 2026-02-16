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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Beth+Ellen&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
