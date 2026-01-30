export const metadata = {
  title: 'INOPNC Preview',
  description: 'Next + Tailwind preview for existing HTML',
}

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
