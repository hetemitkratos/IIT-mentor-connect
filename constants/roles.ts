export const ROLES = {
  ASPIRANT: 'aspirant',
  MENTOR: 'mentor',
  ADMIN: 'admin',
} as const

export type RoleValue = typeof ROLES[keyof typeof ROLES]
