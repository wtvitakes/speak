'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { EncryptionToggle } from '@/components/EncryptionToggle'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { uploadToIPFS } from '@/lib/ipfs'
import { encryptContent } from '@/lib/encryption'
import { Loader2, Send, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function ComposePage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isEncrypted, setIsEncrypted] = useState(true)
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public')
  const [isPosting, setIsPosting] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  const handleSubmit = async () => {
    if (!content.trim() || !address) return

    setIsPosting(true)

    try {
      await supabase
        .from('users')
        .upsert(
          {
            wallet_address: address.toLowerCase(),
            encryption_enabled: isEncrypted,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'wallet_address' }
        )

      const processedContent = isEncrypted
        ? await encryptContent(content, address)
        : content

      const ipfsHash = await uploadToIPFS(processedContent)

      const { error } = await supabase.from('posts').insert({
        wallet_address: address.toLowerCase(),
        content: processedContent,
        ipfs_hash: ipfsHash,
        is_encrypted: isEncrypted,
        visibility,
      })

      if (error) throw error

      toast.success('Post published successfully!')
      router.push('/')
    } catch (error) {
      console.error('Error posting:', error)
      toast.error('Failed to publish post')
    } finally {
      setIsPosting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="container max-w-2xl py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-20">
          <Lock className="h-16 w-16 text-primary" />
          <p className="text-lg text-muted-foreground">
            Please connect your wallet to compose posts
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Create Post</h1>
            <p className="text-sm text-muted-foreground">
              Share your thoughts with end-to-end encryption
            </p>
          </div>

          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] resize-none"
          />

          <div className="space-y-4">
            <EncryptionToggle enabled={isEncrypted} onChange={setIsEncrypted} />

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Visibility</label>
                <p className="text-sm text-muted-foreground">
                  Who can see this post?
                </p>
              </div>
              <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              disabled={isPosting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isPosting}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {isPosting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
