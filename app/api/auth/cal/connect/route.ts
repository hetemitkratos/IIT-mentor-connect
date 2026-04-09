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

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         CAL_SCOPES,
    state:         session.user.id,   // use userId as CSRF-lite state param
  })

  return Response.redirect(`${CAL_AUTH_URL}?${params.toString()}`)
}
