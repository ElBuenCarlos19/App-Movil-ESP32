"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/auth"
import { LineChart } from "react-native-chart-kit"
import {
  consultarEstados,
  insertarEstados,
  consultarObstaculo,
  consultarHistorial,
  insertarHistorial,
} from "../services/api"
import { router } from "expo-router"

interface LogEntry {
  id: number
  usuario: number
  accion: string
  fechahora: string
}

export default function DashboardScreen() {
  const { isAuthenticated, login, logout, user, token, loading } = useAuth()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [led1, setLed1] = useState(false)
  const [led2, setLed2] = useState(false)
  const [led3, setLed3] = useState(false)
  const [motor, setMotor] = useState(false)
  const [obstacleDetected, setObstacleDetected] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [connectionError, setConnectionError] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  const { width } = Dimensions.get("window")

  // Referencia para los intervalos
  const estadosIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const obstaculoIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Función para cargar el historial
  const loadHistorial = useCallback(async () => {
    if (!token) return

    try {
      const historial = await consultarHistorial(token)
      if (historial) {
        setLogs(historial)
        setConnectionError(false)
      }
    } catch (error) {
      console.error("Error al cargar historial:", error)
      setConnectionError(true)
    }
  }, [token])

  // Función para cargar los estados
  const loadEstados = useCallback(async () => {
    if (!token) return

    try {
      const estados = await consultarEstados(token)
      if (estados) {
        setLed1(estados.estadoled1)
        setLed2(estados.estadoled2)
        setLed3(estados.estadoled3)
        setMotor(estados.estadosensor)
        setConnectionError(false)
      }
    } catch (error) {
      console.error("Error al cargar estados:", error)
      setConnectionError(true)
    } finally {
      setLoadingData(false)
    }
  }, [token])

  // Función para cargar el estado del obstáculo
  const loadObstaculo = useCallback(async () => {
    if (!token) return

    try {
      const obstaculo = await consultarObstaculo(token)
      if (obstaculo !== null) {
        setObstacleDetected(obstaculo)
        setConnectionError(false)
      }
    } catch (error) {
      console.error("Error al cargar obstáculo:", error)
      setConnectionError(true)
    }
  }, [token])

  // Función para actualizar los estados en la base de datos
  const updateEstados = useCallback(
    async (newLed1 = led1, newLed2 = led2, newLed3 = led3, newMotor = motor) => {
      if (!token || !user || isUpdating) return

      setIsUpdating(true)
      try {
        const result = await insertarEstados(token, user, {
          estadoled1: newLed1,
          estadoled2: newLed2,
          estadoled3: newLed3,
          estadosensor: newMotor,
          estadoobstaculo: obstacleDetected,
        })

        if (!result) {
          throw new Error("Error al actualizar estados")
        }
        setConnectionError(false)
      } catch (error) {
        console.error("Error al actualizar estados:", error)
        setConnectionError(true)
        Alert.alert("Error", "No se pudieron actualizar los estados")
      } finally {
        setIsUpdating(false)
      }
    },
    [led1, led2, led3, motor, obstacleDetected, token, user, isUpdating],
  )

  // Función para registrar una acción en el historial
  const registrarAccion = useCallback(
    async (accion: string) => {
      if (!token || !user) return

      try {
        await insertarHistorial(token, user, accion)
        // Recargar el historial después de registrar una acción
        loadHistorial()
        setConnectionError(false)
      } catch (error) {
        console.error("Error al registrar acción:", error)
        setConnectionError(true)
      }
    },
    [token, user, loadHistorial],
  )

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (isAuthenticated && token) {
      loadEstados()
      loadObstaculo()
      loadHistorial()
    }
  }, [isAuthenticated, token, loadEstados, loadObstaculo, loadHistorial])

  // Efecto para configurar intervalos de actualización
  useEffect(() => {
    if (isAuthenticated && token) {
      // Limpiar intervalos existentes
      if (estadosIntervalRef.current) clearInterval(estadosIntervalRef.current)
      if (obstaculoIntervalRef.current) clearInterval(obstaculoIntervalRef.current)

      // Configurar nuevos intervalos
      estadosIntervalRef.current = setInterval(() => {
        loadEstados()
      }, 2000)

      obstaculoIntervalRef.current = setInterval(() => {
        loadObstaculo()
      }, 2000)
    }

    // Limpiar intervalos al desmontar
    return () => {
      if (estadosIntervalRef.current) clearInterval(estadosIntervalRef.current)
      if (obstaculoIntervalRef.current) clearInterval(obstaculoIntervalRef.current)
    }
  }, [isAuthenticated, token, loadEstados, loadObstaculo])

  // Efecto para animación
  useEffect(() => {
    if (isAuthenticated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isAuthenticated, fadeAnim, scaleAnim])

  const toggleLed = async (ledNumber: number, newState: boolean) => {
    const action = newState ? "Encendido" : "Apagado"
    const ledName = `LED ${ledNumber}`

    switch (ledNumber) {
      case 1:
        setLed1(newState)
        await updateEstados(newState, led2, led3, motor)
        break
      case 2:
        setLed2(newState)
        await updateEstados(led1, newState, led3, motor)
        break
      case 3:
        setLed3(newState)
        await updateEstados(led1, led2, newState, motor)
        break
    }

    await registrarAccion(`${action} ${ledName}`)
  }

  const toggleMotor = async (newState: boolean) => {
    setMotor(newState)
    await updateEstados(led1, led2, led3, newState)
    const action = newState ? "Encendido" : "Apagado"
    await registrarAccion(`${action} Motor`)
  }

  const toggleAllLeds = async (state: boolean) => {
    setLed1(state)
    setLed2(state)
    setLed3(state)
    await updateEstados(state, state, state, motor)
    const action = state ? "Encendidos" : "Apagados"
    await registrarAccion(`${action} Todos los LEDs`)
  }

  const handleLogout = () => {
    logout()
    router.replace("/dashboard")
  }

  const handleLogin = async () => {
    setLoginError("")
    if (!username || !password) {
      setLoginError("Por favor ingresa usuario y contraseña")
      return
    }

    const success = await login(username, password)
    if (!success) {
      setLoginError("Usuario o contraseña incorrectos")
    }
  }

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    )
  }

  // Mostrar pantalla de login si no está autenticado
  if (!isAuthenticated) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Iniciar Sesión</Text>
          <Text style={styles.loginSubtitle}>Accede al panel de control</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color="#95a5a6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#95a5a6"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#95a5a6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#95a5a6"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <Text style={styles.loginHint}>Usa "admin" y "123" para acceder</Text>
        </View>
      </View>
    )
  }

  // Mostrar pantalla de carga mientras se cargan los datos
  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    )
  }

  const chartData = {
    labels: ["LED1", "LED2", "LED3", "Motor"],
    datasets: [
      {
        data: [led1 ? 1 : 0, led2 ? 1 : 0, led3 ? 1 : 0, motor ? 1 : 0],
      },
    ],
  }

  return (
    <ScrollView style={styles.container}>
      {connectionError && (
        <View style={styles.connectionErrorBanner}>
          <Ionicons name="wifi-off" size={20} color="#fff" />
          <Text style={styles.connectionErrorText}>Error de conexión con el servidor</Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Panel de Control</Text>
          <Text style={styles.subtitle}>Controla tu circuito ESP32</Text>

          <View style={styles.userInfoContainer}>
            <Ionicons name="person-circle" size={24} color="#3498db" />
            <Text style={styles.userInfoText}>Usuario ID: {user}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={18} color="#fff" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.controlCard}>
            <Text style={styles.controlTitle}>Control de LEDs</Text>

            <View style={styles.controlRow}>
              <View style={styles.controlItem}>
                <Text style={styles.controlLabel}>LED 1</Text>
                <View style={styles.switchContainer}>
                  <View style={[styles.ledIndicator, { backgroundColor: led1 ? "#2ecc71" : "#e74c3c" }]} />
                  <Switch
                    value={led1}
                    onValueChange={(value) => toggleLed(1, value)}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={led1 ? "#3498db" : "#f4f3f4"}
                    disabled={isUpdating}
                  />
                </View>
              </View>

              <View style={styles.controlItem}>
                <Text style={styles.controlLabel}>LED 2</Text>
                <View style={styles.switchContainer}>
                  <View style={[styles.ledIndicator, { backgroundColor: led2 ? "#2ecc71" : "#e74c3c" }]} />
                  <Switch
                    value={led2}
                    onValueChange={(value) => toggleLed(2, value)}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={led2 ? "#3498db" : "#f4f3f4"}
                    disabled={isUpdating}
                  />
                </View>
              </View>

              <View style={styles.controlItem}>
                <Text style={styles.controlLabel}>LED 3</Text>
                <View style={styles.switchContainer}>
                  <View style={[styles.ledIndicator, { backgroundColor: led3 ? "#2ecc71" : "#e74c3c" }]} />
                  <Switch
                    value={led3}
                    onValueChange={(value) => toggleLed(3, value)}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={led3 ? "#3498db" : "#f4f3f4"}
                    disabled={isUpdating}
                  />
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#2ecc71" }]}
                onPress={() => toggleAllLeds(true)}
                disabled={isUpdating}
              >
                <Text style={styles.buttonText}>Encender Todos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#e74c3c" }]}
                onPress={() => toggleAllLeds(false)}
                disabled={isUpdating}
              >
                <Text style={styles.buttonText}>Apagar Todos</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controlCard}>
            <Text style={styles.controlTitle}>Control de Motor</Text>
            <View style={styles.controlRow}>
              <View style={styles.controlItem}>
                <Text style={styles.controlLabel}>Motor</Text>
                <View style={styles.switchContainer}>
                  <View style={[styles.ledIndicator, { backgroundColor: motor ? "#2ecc71" : "#e74c3c" }]} />
                  <Switch
                    value={motor}
                    onValueChange={toggleMotor}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={motor ? "#3498db" : "#f4f3f4"}
                    disabled={isUpdating}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.controlCard}>
            <Text style={styles.controlTitle}>Sensor de Obstáculos</Text>
            <View
              style={[
                styles.obstacleIndicator,
                {
                  backgroundColor: obstacleDetected ? "#e74c3c" : "#2ecc71",
                  borderColor: obstacleDetected ? "#c0392b" : "#27ae60",
                },
              ]}
            >
              <Ionicons name={obstacleDetected ? "alert-circle" : "checkmark-circle"} size={24} color="#fff" />
              <Text style={styles.obstacleText}>{obstacleDetected ? "Obstáculo Detectado" : "Sin Obstáculos"}</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.controlTitle}>Estado del Sistema</Text>
            <LineChart
              data={chartData}
              width={width - 60}
              height={220}
              chartConfig={{
                backgroundColor: "#1e272e",
                backgroundGradientFrom: "#1e272e",
                backgroundGradientTo: "#2c3e50",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#3498db",
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>

          <View style={styles.logCard}>
            <Text style={styles.controlTitle}>Historial de Cambios</Text>
            {logs.length === 0 ? (
              <Text style={styles.emptyLogText}>No hay actividad reciente</Text>
            ) : (
              <FlatList
                data={logs}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.logEntry}>
                    <View style={styles.logIcon}>
                      <Ionicons
                        name={item.accion.includes("LED") ? "bulb" : item.accion.includes("Motor") ? "cog" : "eye"}
                        size={16}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.logInfo}>
                      <Text style={styles.logAction}>{item.accion}</Text>
                      <Text style={styles.logComponent}>Usuario: {item.usuario}</Text>
                    </View>
                    <Text style={styles.logTime}>{new Date(item.fechahora).toLocaleTimeString()}</Text>
                  </View>
                )}
                style={styles.logList}
                scrollEnabled={false}
              />
            )}
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontFamily: "Poppins-Bold",
    fontSize: 28,
    color: "#fff",
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#95a5a6",
    textAlign: "center",
    marginBottom: 10,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e272e",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    justifyContent: "space-between",
  },
  userInfoText: {
    fontFamily: "Poppins-Medium",
    color: "#ecf0f1",
    fontSize: 14,
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e74c3c",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    fontFamily: "Poppins-Medium",
    color: "#fff",
    fontSize: 12,
    marginLeft: 5,
  },
  controlsContainer: {
    padding: 15,
  },
  controlCard: {
    backgroundColor: "#1e272e",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  controlTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: "#3498db",
    marginBottom: 15,
  },
  controlRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  controlItem: {
    width: "48%",
    marginBottom: 15,
  },
  controlLabel: {
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    color: "#ecf0f1",
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ledIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonText: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#fff",
  },
  obstacleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  obstacleText: {
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    color: "#fff",
    marginLeft: 10,
  },
  chartCard: {
    backgroundColor: "#1e272e",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  logCard: {
    backgroundColor: "#1e272e",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  logList: {
    maxHeight: 300,
  },
  logEntry: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  logIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logInfo: {
    flex: 1,
  },
  logAction: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#ecf0f1",
  },
  logComponent: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#95a5a6",
  },
  logTime: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#95a5a6",
  },
  emptyLogText: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    padding: 20,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#121212",
  },
  loginCard: {
    backgroundColor: "#1e272e",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  loginTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 24,
    color: "#fff",
    marginBottom: 5,
  },
  loginSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#95a5a6",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c3e50",
    borderRadius: 8,
    marginBottom: 15,
    width: "100%",
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    padding: 12,
  },
  loginButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    padding: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#fff",
  },
  errorText: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#e74c3c",
    marginBottom: 10,
  },
  loginHint: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  loadingText: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#ecf0f1",
    marginTop: 10,
  },
  connectionErrorBanner: {
    backgroundColor: "#e74c3c",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  connectionErrorText: {
    color: "#fff",
    fontFamily: "Poppins-Medium",
    marginLeft: 8,
  },
})
