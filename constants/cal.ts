/**
 * Cal.com OAuth constants.
 * Add to .env.local:
 *   CAL_CLIENT_ID=your_client_id
 *   CAL_CLIENT_SECRET=your_client_secret
 *   CAL_REDIRECT_URI=https://yourdomain.com/api/auth/cal/callback
 */

export const CAL_AUTH_URL   = 'https://app.cal.com/auth/oauth2/authorize'
export const CAL_TOKEN_URL  = 'https://app.cal.com/auth/oauth2/token'
export const CAL_ME_URL     = 'https://api.cal.com/v1/me'

export const CAL_SCOPES     = ['READ_BOOKING', 'READ_PROFILE'].join(',')

export function getCalClientId()     { return process.env.CAL_CLIENT_ID! }
export function getCalClientSecret() { return process.env.CAL_CLIENT_SECRET! }
export function getCalRedirectUri()  { return process.env.CAL_REDIRECT_URI! }
