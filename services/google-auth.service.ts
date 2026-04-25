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

  if (!user.googleRefreshToken) {
    throw new Error("No refresh_token available for offline sync")
  }

  // 🔥 Smart Hybrid Strategy: Try existing token first, refresh if invalid
  try {
    await auth.getAccessToken()
  } catch (err) {
    console.log("[GOOGLE_AUTH] Token invalid or expired, refreshing...")

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
    } catch (refreshErr: any) {
      console.error("[GOOGLE_AUTH] Failed to refresh token", refreshErr.response?.data || refreshErr.message || refreshErr)
      throw new Error("Failed to refresh Google OAuth token")
    }
  }

  return auth
}
