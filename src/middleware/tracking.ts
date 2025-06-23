import { MiddlewareHandler } from 'hono'
import { getEnvironment } from '@/lib/env'
import { PostHogService } from '@/lib/services/posthog'
import { SERVICE_NAME } from '@/lib/constants'

interface PostHogAnalyticsOptions {
  excludePaths?: string[]
  captureHeaders?: boolean
  captureUserAgent?: boolean
  captureIP?: boolean
  getUserId?: (c: any) => string | undefined
  getProperties?: (c: any) => Record<string, any>
  forceTracking?: boolean
}

export const posthogAnalytics = (options: PostHogAnalyticsOptions = {}): MiddlewareHandler => {
  return async (c, next) => {
    const startTime = Date.now()
    const path = c.req.path
    const method = c.req.method

    // Initialize PostHog service if not already done
    if (!PostHogService.isInitialized()) {
      PostHogService.initialize(c, options.forceTracking)
    }

    // Skip tracking for excluded paths
    if (options.excludePaths?.some(excludePath => path.startsWith(excludePath))) {
      await next()
      return
    }

    // Execute the request
    await next()

    const endTime = Date.now()
    const duration = endTime - startTime
    const status = c.res.status
    const environment = getEnvironment(c)

    // Get user ID from Clerk auth or custom function
    const userId = options.getUserId?.(c) || c.get('userId') || 'anonymous'

    // Get additional user context if available
    const userProperties: Record<string, any> = {}
    const clerkUserId = c.get('userId')
    if (clerkUserId) {
      userProperties.clerk_user_id = clerkUserId
      userProperties.is_authenticated = true

      // Try to get user details from Clerk
      try {
        const clerkClient = c.get('clerk')
        if (clerkClient) {
          const user = await clerkClient.users.getUser(clerkUserId)
          if (user) {
            userProperties.user_role = user.privateMetadata?.role || 'user'
            userProperties.user_email_verified = user.emailAddresses?.[0]?.verification?.status === 'verified'
            userProperties.user_created_at = user.createdAt
          }
        }
      } catch (error) {
        console.warn('[PostHogAnalytics] Failed to fetch user details:', error)
      }
    } else {
      userProperties.is_authenticated = false
    }

    // Prepare event properties
    const properties: Record<string, any> = {
      $current_url: path,
      method,
      status_code: status,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      route: path,
      environment,
      service: SERVICE_NAME,
      ...userProperties,
      ...options.getProperties?.(c),
    }

    // Add optional properties
    if (options.captureHeaders) {
      const headers: Record<string, string> = {}
      c.req.raw.headers.forEach((value, key) => {
        if (!['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())) {
          headers[key] = value
        }
      })
      properties.headers = headers
    }

    if (options.captureUserAgent) {
      properties.user_agent = c.req.header('user-agent')
    }

    if (options.captureIP) {
      properties.ip = c.req.header('x-forwarded-for') ||
                     c.req.header('x-real-ip') ||
                     c.req.header('cf-connecting-ip')
    }

    // Track the event using shared service
    PostHogService.capture({
      distinctId: userId,
      event: 'api_request',
      properties,
    })

    // Identify user if authenticated
    if (clerkUserId && userId !== 'anonymous') {
      PostHogService.identify({
        distinctId: userId,
        properties: {
          clerk_user_id: clerkUserId,
          ...userProperties,
        }
      })
    }
  }
}
