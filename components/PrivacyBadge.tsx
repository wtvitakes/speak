'use client'

import { Shield, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PrivacyBadgeProps {
  isEncrypted: boolean
  visibility: 'public' | 'followers' | 'private'
}

export function PrivacyBadge({ isEncrypted, visibility }: PrivacyBadgeProps) {
  const getVisibilityLabel = () => {
    switch (visibility) {
      case 'public':
        return 'Public'
      case 'followers':
        return 'Followers Only'
      case 'private':
        return 'Private'
      default:
        return 'Public'
    }
  }

  return (
    <div className="flex items-center gap-2">
      {isEncrypted && (
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1">
          <Lock className="h-3 w-3" />
          Encrypted
        </Badge>
      )}
      <Badge variant="outline" className="gap-1">
        <Shield className="h-3 w-3" />
        {getVisibilityLabel()}
      </Badge>
    </div>
  )
}
