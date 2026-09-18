import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  name: string
  picture?: string
  provider: 'google' | 'email'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'nummuss_auth_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = (newUser: User) => {
    setUser(newUser)
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
    } catch (error) {
      console.error('Failed to save user to storage:', error)
    }
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to remove user from storage:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
