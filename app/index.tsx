"use client"

import { useRef, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Carousel from "react-native-reanimated-carousel"

const { width } = Dimensions.get("window")

interface ComponentInfo {
  title: string
  description: string
  icon: string
}

const components: ComponentInfo[] = [
  {
    title: "ESP32",
    description:
      "Microcontrolador con WiFi y Bluetooth integrado. Es el cerebro del circuito, encargado de controlar todos los componentes y comunicarse con la aplicación móvil y web.",
    icon: "hardware-chip",
  },
  {
    title: "LEDs",
    description:
      "Diodos emisores de luz que se utilizan como indicadores visuales. En este circuito, hay 3 LEDs que pueden ser controlados de forma independiente.",
    icon: "bulb",
  },
  {
    title: "Sensor FC-51",
    description:
      "Sensor infrarrojo para detección de obstáculos. Emite una señal cuando detecta un objeto en su rango de detección, permitiendo al circuito reaccionar ante obstáculos.",
    icon: "eye",
  },
  {
    title: "Teclado Matricial 16x16",
    description:
      "Teclado de 16 botones organizados en una matriz de 4x4. Permite la entrada de datos numéricos y comandos al circuito sin necesidad de una aplicación.",
    icon: "keypad",
  },
  {
    title: "LCD I2C",
    description:
      "Pantalla de cristal líquido con interfaz I2C que muestra información del estado del circuito. Permite visualizar datos sin necesidad de conectarse a la aplicación.",
    icon: "tv",
  },
]

const tools: ComponentInfo[] = [
  {
    title: "Expo",
    description:
      "Framework para desarrollo de aplicaciones móviles con React Native. Facilita la creación de aplicaciones multiplataforma con un solo código base.",
    icon: "phone-portrait",
  },
  {
    title: "Blynk",
    description:
      "Plataforma IoT que permite controlar hardware de forma remota. Proporciona una interfaz para comunicarse con el ESP32 a través de Internet.",
    icon: "cloud",
  },
  {
    title: "CleverCloud",
    description:
      "Plataforma de alojamiento en la nube donde se almacenará la base de datos del proyecto. Ofrece escalabilidad y alta disponibilidad para aplicaciones web.",
    icon: "server",
  },
]

export default function InfoScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const renderComponent = (item: ComponentInfo, index: number) => {
    return (
      <Animated.View
        key={index}
        style={[
          styles.componentCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon as any} size={32} color="#3498db" />
        </View>
        <View style={styles.componentInfo}>
          <Text style={styles.componentTitle}>{item.title}</Text>
          <Text style={styles.componentDescription}>{item.description}</Text>
        </View>
      </Animated.View>
    )
  }

  const carouselItems = [
    {
      title: "Control de LEDs",
      description: "Controla 3 LEDs de forma independiente desde la aplicación móvil, web o teclado físico.",
      color: "#3498db",
      icon: "bulb",
    },
    {
      title: "Detección de Obstáculos",
      description: "El sensor FC-51 detecta obstáculos y envía la información a la aplicación.",
      color: "#e74c3c",
      icon: "alert-circle",
    },
    {
      title: "Control IoT",
      description: "Controla tu circuito desde cualquier lugar usando Blynk y conexión a Internet.",
      color: "#2ecc71",
      icon: "globe",
    },
  ]

  const renderCarouselItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.carouselItem, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={50} color="#fff" />
        <Text style={styles.carouselTitle}>{item.title}</Text>
        <Text style={styles.carouselDescription}>{item.description}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Circuito ESP32</Text>
        <Text style={styles.subtitle}>Control de LEDs y Sensor de Obstáculos</Text>
      </View>

      <Carousel
        loop
        width={width}
        height={200}
        autoPlay={true}
        data={carouselItems}
        scrollAnimationDuration={1000}
        renderItem={renderCarouselItem}
        autoPlayInterval={3000}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explicación del Circuito</Text>
        <Text style={styles.sectionContent}>
          Este circuito está basado en el ESP32, un potente microcontrolador con WiFi y Bluetooth integrado. Sus
          funciones principales son controlar 3 LEDs y un sensor FC-51 para detección de obstáculos. El circuito puede
          ser controlado mediante: • Aplicación móvil (la que estás usando ahora) • Aplicación web • Plataforma IoT
          Blynk • Teclado físico matricial 16x16 La información se muestra en un LCD I2C conectado al circuito,
          permitiendo visualizar el estado de los componentes sin necesidad de usar la aplicación.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Componentes</Text>
        {components.map(renderComponent)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Herramientas Utilizadas</Text>
        {tools.map(renderComponent)}
      </View>

      <TouchableOpacity style={styles.dashboardButton}>
        <Text style={styles.dashboardButtonText}>Ir al Dashboard</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
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
    marginBottom: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 22,
    color: "#3498db",
    marginBottom: 15,
  },
  sectionContent: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#ecf0f1",
    lineHeight: 24,
    marginBottom: 20,
  },
  componentCard: {
    flexDirection: "row",
    backgroundColor: "#1e272e",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  componentInfo: {
    flex: 1,
  },
  componentTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: "#fff",
    marginBottom: 5,
  },
  componentDescription: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#bdc3c7",
    lineHeight: 20,
  },
  carouselItem: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  carouselTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: "#fff",
    marginTop: 10,
    marginBottom: 5,
  },
  carouselDescription: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  dashboardButton: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    margin: 20,
  },
  dashboardButtonText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#fff",
    marginRight: 10,
  },
})
