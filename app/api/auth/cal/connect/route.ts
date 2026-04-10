import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { error } from '@/lib/api-response'
import { CAL_AUTH_URL, CAL_SCOPES, getCalClientId, getCalRedirectUri } from '@/constants/cal'

/**
 * GET /api/auth/cal/connect
 * Redirects the authenticated mentor to the Cal.com OAuth authorization page.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'mentor') {
    return error('Unauthorized', 401)
  }

  const clientId   = getCalClientId()
  const redirectUri = getCalRedirectUri()

  if (!clientId || !redirectUri) {
    return error('Cal.com integration is not configured on this server.', 500)
  }

  const authUrl = new URL(CAL_AUTH_URL)
  
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", CAL_SCOPES)
  // use userId as CSRF-lite state param so callback still successfully identifies user
  authUrl.searchParams.set("state", session.user.id) 

  console.log("Cal OAuth URL:", authUrl.toString())

  return Response.redirect(authUrl.toString())
}
