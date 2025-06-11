export interface User {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  isCreator: boolean
  avatar?: string
  joinedDate: string
  location?: string
  website?: string
  allowMessages: boolean
  showEmail: boolean
  showPhone: boolean
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (userData: SignupData) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => Promise<void>
}

export interface SignupData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  isCreator: boolean
}

export interface LoginData {
  email: string
  password: string
  rememberMe?: boolean
}
