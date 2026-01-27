import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Smart Expense Splitter',
  description: 'Split expenses smartly with your friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
