'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useParams } from 'next/navigation'
import { PostCard } from '@/components/PostCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { formatAddress, resolveDomainInBackground } from '@/lib/domains'
import { Loader2, UserPlus, UserMinus, Database, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  wallet_address: string
  username?: string
  resolved_domain?: string | null
  bio?: string
  avatar_url?: string
  encryption_enabled: boolean
  created_at: string
}

interface Post {
  id: string
  wallet_address: string
  content: string
  is_encrypted: boolean
  visibility: 'public' | 'followers' | 'private'
  likes_count: number
  created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const { address: currentUserAddress, isConnected } = useAccount()
  const profileAddress = (params.address as string)?.toLowerCase()

  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  const isOwnProfile = currentUserAddress?.toLowerCase() === profileAddress

  useEffect(() => {
    if (profileAddress) {
      fetchProfile()
      fetchPosts()
      fetchFollowStats()
      if (isConnected && currentUserAddress) {
        checkIfFollowing()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileAddress, currentUserAddress, isConnected])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', profileAddress)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        const newUser = {
          wallet_address: profileAddress,
          encryption_enabled: true,
          created_at: new Date().toISOString(),
        }
        setUser(newUser)
        resolveDomainInBackground(profileAddress)
      } else {
        setUser(data)
        if (!data.resolved_domain && !data.username) {
          resolveDomainInBackground(profileAddress)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('wallet_address', profileAddress)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowStats = async () => {
    try {
      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_address', profileAddress),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_address', profileAddress),
      ])

      setFollowersCount(followersResult.count || 0)
      setFollowingCount(followingResult.count || 0)
    } catch (error) {
      console.error('Error fetching follow stats:', error)
    }
  }

  const checkIfFollowing = async () => {
    if (!currentUserAddress) return

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_address', currentUserAddress.toLowerCase())
        .eq('following_address', profileAddress)
        .maybeSingle()

      if (error) throw error
      setIsFollowing(!!data)
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollow = async () => {
    if (!isConnected || !currentUserAddress) return

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_address', currentUserAddress.toLowerCase())
          .eq('following_address', profileAddress)

        if (error) throw error
        setIsFollowing(false)
        setFollowersCount((prev) => prev - 1)
        toast.success('Unfollowed successfully')
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_address: currentUserAddress.toLowerCase(),
          following_address: profileAddress,
        })

        if (error) throw error
        setIsFollowing(true)
        setFollowersCount((prev) => prev + 1)
        toast.success('Following successfully')
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast.error('Failed to update follow status')
    }
  }

  const displayAddress = formatAddress(
    profileAddress,
    user?.username || user?.resolved_domain
  )

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
              {displayAddress[0].toUpperCase()}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{displayAddress}</h1>
                  <p className="text-sm text-muted-foreground font-mono">
                    {profileAddress}
                  </p>
                  {user?.bio && (
                    <p className="text-muted-foreground mt-2">{user.bio}</p>
                  )}
                </div>

                {!isOwnProfile && isConnected && (
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? 'outline' : 'default'}
                    className="gap-2"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="font-bold">{posts.length}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
                <div>
                  <span className="font-bold">{followersCount}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-bold">{followingCount}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
              </div>

              {user?.encryption_enabled && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Lock className="h-4 w-4" />
                  <span>Encryption Enabled</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="vault">Data Vault</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4 mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <p className="text-lg text-muted-foreground">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} post={post} user={user || undefined} />
              ))
            )}
          </TabsContent>

          <TabsContent value="vault" className="mt-6">
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
                <Database className="h-16 w-16 text-primary" />
                <h3 className="text-xl font-bold">Data Vault</h3>
                <p className="text-muted-foreground max-w-md">
                  {isOwnProfile
                    ? 'Your personal data vault. All your content is encrypted and stored on IPFS. You have complete control over your data.'
                    : 'This user\'s data is encrypted and stored securely on IPFS.'}
                </p>
                {isOwnProfile && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-6">
                    <div className="p-4 rounded-lg border bg-card/50">
                      <p className="text-sm font-medium">Total Posts</p>
                      <p className="text-2xl font-bold text-primary">{posts.length}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card/50">
                      <p className="text-sm font-medium">Encrypted Content</p>
                      <p className="text-2xl font-bold text-primary">
                        {posts.filter((p) => p.is_encrypted).length}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
