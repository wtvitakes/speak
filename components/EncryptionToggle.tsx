'use client'

import { Lock, LockOpen } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface EncryptionToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function EncryptionToggle({ enabled, onChange }: EncryptionToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        {enabled ? (
          <Lock className="h-5 w-5 text-primary" />
        ) : (
          <LockOpen className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="flex flex-col gap-1">
          <Label htmlFor="encryption-toggle" className="cursor-pointer">
            End-to-End Encryption
          </Label>
          <p className="text-sm text-muted-foreground">
            {enabled
              ? 'Your post will be encrypted for privacy'
              : 'Your post will be stored in plain text'}
          </p>
        </div>
      </div>
      <Switch
        id="encryption-toggle"
        checked={enabled}
        onCheckedChange={onChange}
      />
    </div>
  )
}
