import { google } from "googleapis"
import { prisma } from "@/lib/prisma"

export async function getValidGoogleAuth(user: any) {
  console.log(`[GOOGLE_AUTH] Initializing auth for user ID: ${user.id}`)

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  auth.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken
  })

  if (!user.googleRefreshToken) {
    throw new Error("No refresh_token available for offline sync")
  }

  // 🔥 Smart Hybrid Strategy: Try existing token first, refresh if invalid
  try {
    console.log(`[GOOGLE_AUTH] Validating existing token...`)
    const tokenResponse = await auth.getAccessToken()
    if (!tokenResponse?.token) {
      throw new Error("Invalid access token returned")
    }
    console.log(`[GOOGLE_AUTH] Existing token is valid.`)
  } catch (err) {
    console.log("[GOOGLE_AUTH] Token invalid or expired, refreshing...")

    try {
      const { credentials } = await auth.refreshAccessToken()

      if (credentials && credentials.access_token) {
        console.log(`[GOOGLE_AUTH] Successfully refreshed token, updating DB...`)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            googleAccessToken: credentials.access_token,
            googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
          }
        })
        auth.setCredentials(credentials)
      } else {
        throw new Error("No access_token returned during refresh")
      }
    } catch (refreshErr: any) {
      if (refreshErr.response?.data?.error === "invalid_grant") {
        console.error("[GOOGLE_AUTH] Refresh token revoked (invalid_grant). Clearing credentials.")
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            googleAccessToken: null,
            googleRefreshToken: null,
            googleTokenExpiry: null
          }
        })
        
        throw new Error("GOOGLE_RECONNECT_REQUIRED")
      }

      console.error("[GOOGLE_AUTH] Failed to refresh token. Full error:", {
        status: refreshErr.response?.status,
        data: refreshErr.response?.data,
        message: refreshErr.message
      })
      throw new Error("Failed to refresh Google OAuth token")
    }
  }

  return auth
}
