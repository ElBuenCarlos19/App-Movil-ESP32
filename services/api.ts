import { API_URL } from "../config/api"
import { Alert } from "react-native"

// Interfaz para los estados
interface Estados {
  estadoled1: boolean
  estadoled2: boolean
  estadoled3: boolean
  estadosensor: boolean
  estadoledobstaculosensor: boolean
}

// Interfaz para el historial
interface HistorialItem {
  id: number
  usuario: number
  accion: string
  fechahora: string
}

// Función para manejar errores de red
const handleNetworkError = (error: any, functionName: string) => {
  console.error(`Error en ${functionName}:`, error)
  Alert.alert(
    "Error de conexión",
    "No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté en funcionamiento.",
  )
  return null
}

// Función para consultar estados
export const consultarEstados = async (token: string): Promise<Estados | null> => {
  try {
    console.log(`Consultando estados en ${API_URL}/api/consultarEstados`)
    const response = await fetch(`${API_URL}/api/consultarEstados`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al consultar estados")
    }

    return await response.json()
  } catch (error) {
    return handleNetworkError(error, "consultarEstados")
  }
}

// Función para insertar estados
export const insertarEstados = async (
  token: string,
  userId: number,
  estados: {
    estadoled1: boolean
    estadoled2: boolean
    estadoled3: boolean
    estadosensor: boolean
    estadoobstaculo: boolean
  },
): Promise<boolean> => {
  try {
    console.log(`Insertando estados en ${API_URL}/api/insertarEstados`, estados)
    const response = await fetch(`${API_URL}/api/insertarEstados`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...estados,
        user_id: userId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al insertar estados")
    }

    return true
  } catch (error) {
    handleNetworkError(error, "insertarEstados")
    return false
  }
}

// Función para consultar obstáculo
export const consultarObstaculo = async (token: string): Promise<boolean | null> => {
  try {
    console.log(`Consultando obstáculo en ${API_URL}/api/consultarObstaculo`)
    const response = await fetch(`${API_URL}/api/consultarObstaculo`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al consultar obstáculo")
    }
    return await response.json()
  } catch (error) {
    return handleNetworkError(error, "consultarObstaculo")
  }
}

// Función para consultar historial
export const consultarHistorial = async (token: string): Promise<HistorialItem[] | null> => {
  try {
    console.log(`Consultando historial en ${API_URL}/api/consultarHistorial`)
    const response = await fetch(`${API_URL}/api/consultarHistorial`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al consultar historial")
    }

    const data = await response.json()
    return data.historial
  } catch (error) {
    handleNetworkError(error, "consultarHistorial")
    return null
  }
}

// Función para insertar historial
export const insertarHistorial = async (token: string, userId: number, accion: string): Promise<boolean> => {
  try {
    console.log(`Insertando historial en ${API_URL}/api/insertarHistorial`, { user_id: userId, accion })
    const response = await fetch(`${API_URL}/api/insertarHistorial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        accion,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al insertar historial")
    }

    return true
  } catch (error) {
    handleNetworkError(error, "insertarHistorial")
    return false
  }
}

// Función para iniciar sesión
export const login = async (username: string, password: string): Promise<{ user: number; token: string } | null> => {
  try {
    console.log(`Iniciando sesión en ${API_URL}/api/login`, { username })
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Error al iniciar sesión")
    }

    return data
  } catch (error) {
    handleNetworkError(error, "login")
    return null
  }
}
