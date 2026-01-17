'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { PostCard } from '@/components/PostCard'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { resolveDomainInBackground } from '@/lib/domains'
import { Loader2, Lock } from 'lucide-react'

interface Post {
  id: string
  wallet_address: string
  content: string
  is_encrypted: boolean
  visibility: 'public' | 'followers' | 'private'
  likes_count: number
  created_at: string
}

interface UserData {
  wallet_address: string
  username?: string
  resolved_domain?: string | null
  avatar_url?: string
}

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<Map<string, UserData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPosts()
    if (isConnected && address) {
      fetchLikedPosts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setPosts(postsData || [])

      const uniqueAddresses = Array.from(
        new Set(postsData?.map((post) => post.wallet_address) || [])
      )

      const { data: usersData } = await supabase
        .from('users')
        .select('wallet_address, username, resolved_domain, avatar_url')
        .in('wallet_address', uniqueAddresses)

      const usersMap = new Map<string, UserData>()
      usersData?.forEach((user) => {
        usersMap.set(user.wallet_address, user)
      })
      setUsers(usersMap)

      uniqueAddresses.forEach((addr) => {
        const user = usersMap.get(addr)
        if (!user?.resolved_domain && !user?.username) {
          resolveDomainInBackground(addr)
        }
      })
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLikedPosts = async () => {
    if (!address) return

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('post_id')
        .eq('wallet_address', address.toLowerCase())

      if (error) throw error
      setLikedPosts(new Set(data?.map((like) => like.post_id) || []))
    } catch (error) {
      console.error('Error fetching liked posts:', error)
    }
  }

  const handleLike = async (postId: string) => {
    if (!isConnected || !address) return

    const isCurrentlyLiked = likedPosts.has(postId)

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('wallet_address', address.toLowerCase())

        if (error) throw error
        setLikedPosts((prev) => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
      } else {
        const { error } = await supabase.from('likes').insert({
          post_id: postId,
          wallet_address: address.toLowerCase(),
        })

        if (error) throw error
        setLikedPosts((prev) => new Set(prev).add(postId))
      }

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes_count: isCurrentlyLiked
                  ? post.likes_count - 1
                  : post.likes_count + 1,
              }
            : post
        )
      )
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  if (!isConnected) {
    return (
      <div className="container max-w-2xl py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-20">
          <Lock className="h-16 w-16 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome to Speak
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Privacy-first decentralized social media. Connect your wallet to start
            sharing encrypted content and take control of your data.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-primary" />
              <span>End-to-end encryption by default</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-primary" />
              <span>Your keys, your data, your control</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-primary" />
              <span>Decentralized storage on IPFS</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Feed</h1>
          <Button
            onClick={fetchPosts}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-lg text-muted-foreground">No posts yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to share something!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                user={users.get(post.wallet_address)}
                onLike={handleLike}
                isLiked={likedPosts.has(post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
