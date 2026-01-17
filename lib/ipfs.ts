export async function uploadToIPFS(content: string): Promise<string> {
  try {
    const data = JSON.stringify({
      pinataContent: { content },
      pinataMetadata: {
        name: `post-${Date.now()}`,
      },
    })

    const jwt = process.env.NEXT_PUBLIC_PINATA_JWT

    if (!jwt) {
      console.warn('Pinata JWT not configured, returning mock hash')
      return `mock-${Date.now()}`
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: data,
    })

    const result = await response.json()
    return result.IpfsHash
  } catch (error) {
    console.error('IPFS upload failed:', error)
    return `mock-${Date.now()}`
  }
}

export async function getFromIPFS(hash: string): Promise<string | null> {
  try {
    if (hash.startsWith('mock-')) {
      return null
    }

    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`)
    const data = await response.json()
    return data.content
  } catch (error) {
    console.error('IPFS fetch failed:', error)
    return null
  }
}
