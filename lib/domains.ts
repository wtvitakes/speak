import { supabase } from './supabase'

const DOMAIN_CACHE_DURATION = 24 * 60 * 60 * 1000
const RESOLUTION_TIMEOUT = 3000

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function resolveUnstoppableDomain(address: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(
      `https://resolve.unstoppabledomains.com/reverse/${address}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_UNSTOPPABLE_API_KEY || ''}`,
        },
      },
      RESOLUTION_TIMEOUT
    )

    if (!response.ok) return null

    const data = await response.json()
    return data.meta?.domain || null
  } catch (error) {
    console.warn('Unstoppable Domains resolution timed out or failed')
    return null
  }
}

async function resolveENS(address: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(
      `https://api.ensideas.com/ens/resolve/${address}`,
      {},
      RESOLUTION_TIMEOUT
    )

    if (!response.ok) return null

    const data = await response.json()
    return data.name || null
  } catch (error) {
    console.warn('ENS resolution timed out or failed')
    return null
  }
}

export async function resolveDomain(address: string): Promise<string | null> {
  const normalizedAddress = address.toLowerCase()

  const cachedDomain = await getCachedDomain(normalizedAddress)
  if (cachedDomain !== undefined) {
    return cachedDomain
  }

  const unstoppableDomain = await resolveUnstoppableDomain(normalizedAddress)
  if (unstoppableDomain) {
    await cacheDomain(normalizedAddress, unstoppableDomain, false)
    return unstoppableDomain
  }

  const ensDomain = await resolveENS(normalizedAddress)
  if (ensDomain) {
    await cacheDomain(normalizedAddress, ensDomain, false)
    return ensDomain
  }

  await cacheDomain(normalizedAddress, null, true)
  return null
}

export async function getCachedDomain(address: string): Promise<string | null | undefined> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('resolved_domain, domain_resolved_at, domain_resolution_failed')
      .eq('wallet_address', address.toLowerCase())
      .maybeSingle()

    if (error || !data) return undefined

    if (data.domain_resolution_failed) {
      const resolvedAt = data.domain_resolved_at ? new Date(data.domain_resolved_at).getTime() : 0
      if (Date.now() - resolvedAt < DOMAIN_CACHE_DURATION) {
        return null
      }
      return undefined
    }

    if (data.resolved_domain && data.domain_resolved_at) {
      const resolvedAt = new Date(data.domain_resolved_at).getTime()
      if (Date.now() - resolvedAt < DOMAIN_CACHE_DURATION) {
        return data.resolved_domain
      }
    }

    return undefined
  } catch (error) {
    console.error('Error fetching cached domain:', error)
    return undefined
  }
}

async function cacheDomain(
  address: string,
  domain: string | null,
  failed: boolean
): Promise<void> {
  try {
    await supabase
      .from('users')
      .upsert(
        {
          wallet_address: address.toLowerCase(),
          resolved_domain: domain,
          domain_resolved_at: new Date().toISOString(),
          domain_resolution_failed: failed,
        },
        { onConflict: 'wallet_address' }
      )
  } catch (error) {
    console.error('Error caching domain:', error)
  }
}

export async function resolveDomainInBackground(address: string): Promise<void> {
  setTimeout(async () => {
    try {
      await resolveDomain(address)
    } catch (error) {
      console.error('Background domain resolution failed:', error)
    }
  }, 100)
}

export function formatAddress(address: string, domain?: string | null): string {
  if (domain) return domain
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
