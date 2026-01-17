export async function encryptContent(content: string, publicKey?: string): Promise<string> {
  if (!publicKey) {
    return content
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return `encrypted_${hashHex}_${content}`
}

export async function decryptContent(encryptedContent: string, privateKey?: string): Promise<string> {
  if (!encryptedContent.startsWith('encrypted_')) {
    return encryptedContent
  }

  const parts = encryptedContent.split('_')
  if (parts.length < 3) {
    return encryptedContent
  }

  return parts.slice(2).join('_')
}
