import * as React from 'react'
import { Img } from '@react-email/components'

export const WeddingRingRingLogo = () => {
  return (
    <Img
      src={`${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`}
      alt="WeddingRingRing"
      width="400"
      height="100"
      style={{ maxWidth: '200px', height: 'auto' }}
    />
  )
}
