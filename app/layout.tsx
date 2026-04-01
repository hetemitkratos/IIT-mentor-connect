import type { Metadata } from 'next'
import { Inter, Newsreader, Epilogue, Manrope } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['500', '600'],
  variable: '--font-newsreader',
})
const epilogue = Epilogue({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-epilogue',
})
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'MentorJEE — Talk to IITians. Get Real JEE Guidance.',
  description:
    '1-on-1 mentorship from IITians. 20 minutes of focused, practical advice to help you crack JEE.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} ${epilogue.variable} ${manrope.variable}`}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
