export type Role = 'aspirant' | 'mentor' | 'admin'

export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: Role
  createdAt: string
}
