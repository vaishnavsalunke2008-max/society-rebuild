import { ImageResponse } from 'next/og'
 
export const dynamic = 'force-static'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 320,
          background: '#10b981', // emerald-500
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '128px',
          fontWeight: 900,
        }}
      >
        SH
      </div>
    ),
    { ...size }
  )
}
