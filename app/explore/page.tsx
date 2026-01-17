'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { formatAddress, resolveDomainInBackground } from '@/lib/domains'
import { Loader2, Search, UserPlus, Lock, Shield } from 'lucide-react'
import Link from 'next/link'

interface User {
  wallet_address: string
  username?: string
  resolved_domain?: string | null
  bio?: string
  encryption_enabled: boolean
  created_at: string
}

export default function ExplorePage() {
  const { address, isConnected } = useAccount()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(
        (user) =>
          user.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.resolved_domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setUsers(data || [])
      setFilteredUsers(data || [])

      data?.forEach((user) => {
        if (!user.resolved_domain && !user.username) {
          resolveDomainInBackground(user.wallet_address)
        }
      })
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Explore</h1>
          <p className="text-muted-foreground">
            Discover privacy-focused users on the decentralized network
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by address, username, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <p className="text-lg text-muted-foreground">
                {searchQuery ? 'No users found' : 'No users yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try a different search query'
                  : 'Be the first to join the network!'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const displayAddress = formatAddress(
                user.wallet_address,
                user.username || user.resolved_domain
              )
              const isCurrentUser =
                address?.toLowerCase() === user.wallet_address

              return (
                <Card key={user.wallet_address} className="p-6 hover:bg-card/80 transition-all">
                  <div className="flex items-start gap-4">
                    <Link href={`/profile/${user.wallet_address}`}>
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold cursor-pointer hover:bg-primary/20 transition-colors">
                        {displayAddress[0].toUpperCase()}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${user.wallet_address}`}
                        className="hover:underline"
                      >
                        <h3 className="font-semibold text-lg">{displayAddress}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground font-mono truncate">
                        {user.wallet_address}
                      </p>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {user.bio}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        {user.encryption_enabled && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Lock className="h-3 w-3" />
                            <span>Encrypted</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          <span>Privacy-First</span>
                        </div>
                      </div>
                    </div>

                    {!isCurrentUser && isConnected && (
                      <Link href={`/profile/${user.wallet_address}`}>
                        <Button size="sm" variant="outline" className="gap-2">
                          <UserPlus className="h-4 w-4" />
                          View Profile
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
