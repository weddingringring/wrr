import * as React from 'react'

export const WeddingRingRingLogo = () => {
  return (
    <svg width="240" height="60" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Two overlapping rings */}
      <g>
        {/* Left ring */}
        <circle cx="20" cy="30" r="12" stroke="#2D5016" strokeWidth="3" fill="none" />
        <circle cx="20" cy="30" r="8" stroke="#87A878" strokeWidth="2" fill="none" />
        
        {/* Right ring (overlapping) */}
        <circle cx="32" cy="30" r="12" stroke="#2D5016" strokeWidth="3" fill="none" />
        <circle cx="32" cy="30" r="8" stroke="#87A878" strokeWidth="2" fill="none" />
      </g>
      
      {/* Text: WeddingRingRing */}
      <text x="52" y="38" fontFamily="'Crimson Text', Georgia, serif" fontSize="24" fontWeight="700" fill="#2D5016">
        WeddingRingRing
      </text>
    </svg>
  )
}
