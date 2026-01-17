'use client'

import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PrivacyBadge } from './PrivacyBadge'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { formatAddress } from '@/lib/domains'

interface PostCardProps {
  post: {
    id: string
    wallet_address: string
    content: string
    is_encrypted: boolean
    visibility: 'public' | 'followers' | 'private'
    likes_count: number
    created_at: string
  }
  user?: {
    username?: string
    resolved_domain?: string | null
    avatar_url?: string
  }
  onLike?: (postId: string) => void
  isLiked?: boolean
}

export function PostCard({ post, user, onLike, isLiked = false }: PostCardProps) {
  const [localLiked, setLocalLiked] = useState(isLiked)
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count)

  const handleLike = () => {
    if (onLike) {
      onLike(post.id)
      setLocalLiked(!localLiked)
      setLocalLikesCount(localLiked ? localLikesCount - 1 : localLikesCount + 1)
    }
  }

  const displayAddress = formatAddress(
    post.wallet_address,
    user?.username || user?.resolved_domain
  )

  return (
    <Card className="p-6 bg-card border-border hover:bg-card/80 transition-all duration-200">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {displayAddress[0].toUpperCase()}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-foreground">{displayAddress}</div>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </div>
            </div>
            <PrivacyBadge
              isEncrypted={post.is_encrypted}
              visibility={post.visibility}
            />
          </div>

          <p className="text-foreground leading-relaxed">{post.content}</p>

          <div className="flex items-center gap-6 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:text-primary"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${localLiked ? 'fill-primary text-primary' : ''}`} />
              <span>{localLikesCount}</span>
            </Button>

            <Button variant="ghost" size="sm" className="gap-2 hover:text-primary">
              <MessageCircle className="h-4 w-4" />
              <span>0</span>
            </Button>

            <Button variant="ghost" size="sm" className="gap-2 hover:text-primary">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
