'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut } from 'lucide-react'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-primary/20">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Disconnect</span>
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => {
        const connector = connectors[0]
        if (connector) {
          connect({ connector })
        }
      }}
      className="gap-2 bg-primary hover:bg-primary/90"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  )
}
