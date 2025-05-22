"use client"

import { useEffect } from "react"
import { Tabs } from "expo-router"
import { useFonts } from "expo-font"
import { SplashScreen } from "expo-router"
import { AuthProvider } from "../context/auth"
import { Ionicons } from "@expo/vector-icons"
import { ThemeProvider, DarkTheme } from "@react-navigation/native"
import { StatusBar } from "expo-status-bar"
import { GestureHandlerRootView } from "react-native-gesture-handler"

export default function RootLayout() {
  const [loaded] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <AuthProvider>
          <StatusBar style="light" />
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: "#3498db",
              tabBarInactiveTintColor: "#95a5a6",
              tabBarStyle: {
                backgroundColor: "#1e272e",
                borderTopWidth: 0,
                elevation: 0,
                height: 60,
                paddingBottom: 10,
              },
              tabBarLabelStyle: {
                fontFamily: "Poppins-Medium",
                fontSize: 12,
              },
              headerStyle: {
                backgroundColor: "#1e272e",
                elevation: 0,
                shadowOpacity: 0,
              },
              headerTitleStyle: {
                fontFamily: "Poppins-Bold",
                color: "#fff",
              },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Información",
                tabBarIcon: ({ color, size }) => <Ionicons name="information-circle" size={size} color={color} />,
              }}
            />
            <Tabs.Screen
              name="dashboard"
              options={{
                title: "Dashboard",
                tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" size={size} color={color} />,
              }}
            />
          </Tabs>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
