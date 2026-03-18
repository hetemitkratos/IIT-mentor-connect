import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client using SERVICE_ROLE_KEY (not anon key).
 * Has full DB and Storage access — server-only.
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Generate a signed URL for a private college ID file.
 * TTL: 15 minutes (900 seconds)
 */
export async function getCollegeIdSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from('mentor-applications')
    .createSignedUrl(filePath, 900)

  if (error) return null
  return data.signedUrl
}
