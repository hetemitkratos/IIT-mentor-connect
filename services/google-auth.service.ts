import { google } from "googleapis"
import { prisma } from "@/lib/prisma"

export async function getValidGoogleAuth(user: any) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  auth.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken
  })

  // Auto refresh if expired or missing expiry
  // Add 1 minute buffer for safety against drift
  const expiryTolerance = new Date(Date.now() + 60000)
  
  if (!user.googleTokenExpiry || user.googleTokenExpiry < expiryTolerance) {
    if (!user.googleRefreshToken) {
      throw new Error("No refresh_token available for offline sync")
    }

    try {
      const { credentials } = await auth.refreshAccessToken()

      if (credentials) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            googleAccessToken: credentials.access_token,
            googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
          }
        })
        auth.setCredentials(credentials)
      }
    } catch (e: any) {
      console.error("[GOOGLE_AUTH] Failed to refresh token", e)
      throw new Error("Failed to refresh Google OAuth token")
    }
  }

  return auth
}
