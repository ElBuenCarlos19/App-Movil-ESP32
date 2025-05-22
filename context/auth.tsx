"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Alert } from "react-native"
import { API_URL } from "../config/api"

interface AuthContextType {
  isAuthenticated: boolean
  user: number | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  login: async () => false,
  logout: () => {},
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<number | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificar si hay una sesión guardada al iniciar la app
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token")
        const storedUser = await AsyncStorage.getItem("user")

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(Number.parseInt(storedUser))
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Error al recuperar la sesión:", error)
      } finally {
        setLoading(false)
      }
    }

    checkToken()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Guardar token y usuario en AsyncStorage
        await AsyncStorage.setItem("token", data.token)
        await AsyncStorage.setItem("user", data.user.toString())

        // Actualizar estado
        setToken(data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        return true
      } else {
        Alert.alert("Error", data.error || "Error al iniciar sesión")
        return false
      }
    } catch (error) {
      console.error("Error en login:", error)
      Alert.alert("Error", "No se pudo conectar con el servidor")
      return false
    }
  }

  const logout = async () => {
    try {
      // Eliminar token y usuario de AsyncStorage
      await AsyncStorage.removeItem("token")
      await AsyncStorage.removeItem("user")

      // Actualizar estado
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
