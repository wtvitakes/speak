'use client'

import Link from 'next/link'
import { WalletConnect } from './WalletConnect'
import { Radio, Search, User, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Radio className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Speak
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === '/' ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Feed
          </Link>
          <Link
            href="/explore"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === '/explore' ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Explore
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/compose">
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Compose</span>
            </Button>
          </Link>
          <WalletConnect />
        </div>
      </div>
    </header>
  )
}
