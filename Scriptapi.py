from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import mysql.connector
import json
import datetime
import os
from functools import wraps
import PyJWT  # Cambiado de 'import jwt' a 'import PyJWT'

# Cargar variables de entorno (si existe un archivo .env)
app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Configuración de la aplicación
# Configuración de la base de datos Clever Cloud
# NOTA: En producción, estas credenciales deberían estar en variables de entorno
# Configuración de la aplicación
app.config['SECRET_KEY'] = 'carlos'  # Cambiar en producción
app.config['DB_CONFIG'] = {
    'host': 'bic5kyumpz3l7qtcvkdh-mysql.services.clever-cloud.com',
    'port': 20123,
    'user': 'u8xdtibxyyvsvs8u',
    'password': 'cvIBZc73q4nXT0BimqI',
    'database': 'bic5kyumpz3l7qtcvkdh'
}
# Función para ejecutar consultas SQL (equivalente a executeQuery)
def execute_query(query, params=None):
    """
    Ejecuta una consulta SQL en la base de datos
    
    Args:
        query (str): Consulta SQL a ejecutar
        params (tuple, optional): Parámetros para la consulta
        
    Returns:
        list: Resultados de la consulta
    """
    connection = None
    cursor = None
    try:
        # Establecer conexión con la base de datos
        connection = mysql.connector.connect(**app.config['DB_CONFIG'])
        cursor = connection.cursor(dictionary=True)
        
        # Ejecutar la consulta
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
            
        # Si es una consulta SELECT, devolver resultados
        if query.lower().strip().startswith('select'):
            results = cursor.fetchall()
            return results
        else:
            # Si es una consulta INSERT, UPDATE, DELETE, hacer commit
            connection.commit()
            return cursor.lastrowid
            
    except mysql.connector.Error as error:
        print(f"Error en la base de datos: {error}")
        if connection:
            connection.rollback()
        raise error
    finally:
        # Cerrar cursor y conexión
        if cursor:
            cursor.close()
        if connection:
            connection.close()

# Decorador para verificar token JWT
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Verificar si hay token en los headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        # Si no hay token, devolver error
        if not token:
            return jsonify({'error': 'Token no proporcionado'}), 401
        
        try:
            # Decodificar token
            data = PyJWT.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            user_id = data['user_id']
        except Exception as e:
            print(f"Error al decodificar token: {e}")
            return jsonify({'error': 'Token inválido'}), 401
            
        return f(user_id, *args, **kwargs)
    
    return decorated

# Endpoint: consultarEstados
@app.route('/api/consultarEstados', methods=['GET'])
def consultar_estados():
    """
    Obtiene el último estado de los LEDs y sensores
    
    Returns:
        JSON: Estado actual de los LEDs y sensores
    """
    try:
        # Obtener el último registro de accion_led
        led_result = execute_query(
            "SELECT estadoled1, estadoled2, estadoled3 FROM accion_led ORDER BY fechahoraregistro DESC LIMIT 1"
        )
        
        # Obtener el último registro de accion_sensor
        sensor_result = execute_query(
            "SELECT estadosensor, estado_obstaculo FROM accion_sensor ORDER BY fechahoraregistro DESC LIMIT 1"
        )
        
        # Manejar si hay datos o no
        if not led_result or not sensor_result:
            return jsonify({"mensaje": "No hay datos disponibles"})
        
        # Armar el JSON de respuesta
        response = {
            "estadoled1": bool(led_result[0]["estadoled1"]),
            "estadoled2": bool(led_result[0]["estadoled2"]),
            "estadoled3": bool(led_result[0]["estadoled3"]),
            "estadosensor": bool(sensor_result[0]["estadosensor"]),
            "estadoledobstaculosensor": bool(sensor_result[0]["estado_obstaculo"])
        }
        
        return jsonify(response)
    
    except Exception as error:
        print(f"Error en consultarEstados: {error}")
        return jsonify({"error": str(error)}), 500

# Endpoint: insertarEstados
@app.route('/api/insertarEstados', methods=['POST'])
def insertar_estados():
    """
    Inserta nuevos estados para LEDs y sensores
    
    Returns:
        JSON: Mensaje de confirmación
    """
    try:
        # Obtener los datos del cuerpo de la solicitud
        data = request.json
        
        estadoled1 = data.get("estadoled1")
        estadoled2 = data.get("estadoled2")
        estadoled3 = data.get("estadoled3")
        estadosensor = data.get("estadosensor")
        estado_obstaculo = data.get("estadoobstaculo")
        user_id = data.get("user_id")
        
        # Convertir valores booleanos a enteros para MySQL
        estadoled1 = 1 if estadoled1 else 0
        estadoled2 = 1 if estadoled2 else 0
        estadoled3 = 1 if estadoled3 else 0
        estadosensor = 1 if estadosensor else 0
        estado_obstaculo = 1 if estado_obstaculo else 0
        
        # Insertar en accion_led
        execute_query(
            "INSERT INTO accion_led (estadoled1, estadoled2, estadoled3, user) VALUES (%s, %s, %s, %s)",
            (estadoled1, estadoled2, estadoled3, user_id)
        )
        
        # Insertar en accion_sensor
        execute_query(
            "INSERT INTO accion_sensor (estadosensor, estado_obstaculo, user) VALUES (%s, %s, %s)",
            (estadosensor, estado_obstaculo, user_id)
        )
        
        return jsonify({"mensaje": "Datos insertados correctamente"})
    
    except Exception as error:
        print(f"Error en insertarEstados: {error}")
        return jsonify({"error": str(error)}), 500

# Endpoint: consultarObstaculo
@app.route('/api/consultarObstaculo', methods=['GET'])
def consultar_obstaculo():
    """
    Obtiene el último estado del obstáculo
    
    Returns:
        JSON: Estado del obstáculo
    """
    try:
        # Obtener si hay obstáculo
        obst = execute_query(
            "SELECT estado_obstaculo FROM accion_sensor ORDER BY fechahoraregistro DESC LIMIT 1"
        )
        
        if not obst:
            return jsonify({"mensaje": "No hay datos disponibles"})
        
        response = bool(obst[0]["estado_obstaculo"])
        return jsonify(response)
    
    except Exception as error:
        print(f"Error en consultarObstaculo: {error}")
        return jsonify({"error": str(error)}), 500

# Endpoint: consultarHistorial
@app.route('/api/consultarHistorial', methods=['GET'])
def consultar_historial():
    """
    Obtiene los últimos 20 registros del historial
    
    Returns:
        JSON: Historial de acciones
    """
    try:
        history = execute_query(
            "SELECT * FROM historial ORDER BY fechahora DESC LIMIT 20"
        )
        
        if not history:
            return jsonify({"historial": []})
        
        # Armar el JSON de respuesta
        response = {
            "historial": [
                {
                    "id": item["id"],
                    "usuario": item["user_id"],
                    "accion": item["accion"],
                    "fechahora": item["fechahora"].isoformat() if isinstance(item["fechahora"], datetime.datetime) else item["fechahora"]
                }
                for item in history
            ]
        }
        
        return jsonify(response)
    
    except Exception as error:
        print(f"Error en consultarHistorial: {error}")
        return jsonify({"error": str(error)}), 500

# Endpoint: insertarHistorial
@app.route('/api/insertarHistorial', methods=['POST'])
def insertar_historial():
    """
    Inserta un nuevo registro en el historial
    
    Returns:
        JSON: Mensaje de confirmación
    """
    try:
        # Obtener los datos del cuerpo de la solicitud
        data = request.json
        
        # Insertar en el historial
        execute_query(
            "INSERT INTO historial (user_id, accion, fechahora) VALUES (%s, %s, NOW())",
            (data.get("user_id"), data.get("accion"))
        )
        
        return jsonify({"mensaje": "Registro de historial creado correctamente"})
    
    except Exception as error:
        print(f"Error en insertarHistorial: {error}")
        return jsonify({"error": str(error)}), 500

# Endpoint: login
@app.route('/api/login', methods=['POST'])
def login():
    """
    Autentica a un usuario y genera un token JWT
    
    Returns:
        JSON: ID de usuario y token JWT
    """
    try:
        # Obtener los datos del cuerpo de la solicitud
        data = request.json
        
        username = data.get("username")
        password = data.get("password")
        
        print(f"Intento de login: usuario={username}, contraseña={password}")
        
        # Verificar si el usuario existe en la base de datos
        user = execute_query(
            "SELECT id FROM usuario WHERE nombre = %s AND contraseña = %s",
            (username, password)
        )
        
        # Verificar si el usuario existe y si las credenciales coinciden
        if user:
            # Crear un token JWT
            token = PyJWT.encode(
                {
                    'user_id': user[0]['id'],
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
                },
                app.config['SECRET_KEY'],
                algorithm="HS256"
            )
            
            print(f"Login exitoso para usuario ID: {user[0]['id']}")
            
            # Enviar el token al cliente
            return jsonify({
                "user": user[0]['id'],
                "token": token
            })
        else:
            print(f"Login fallido: credenciales incorrectas")
            return jsonify({"error": "Usuario o contraseña incorrectos"}), 401
    
    except Exception as error:
        print(f"Error en login: {error}")
        return jsonify({"error": str(error)}), 500

# Endpoint: verificar conexión a la base de datos
@app.route('/api/test-db', methods=['GET'])
def test_db():
    """
    Verifica la conexión a la base de datos
    
    Returns:
        JSON: Estado de la conexión
    """
    try:
        # Intentar ejecutar una consulta simple
        result = execute_query("SELECT 1 as test")
        return jsonify({"mensaje": "Conexión a la base de datos exitosa", "resultado": result})
    except Exception as error:
        return jsonify({"error": f"Error de conexión: {str(error)}"}), 500

# Ruta principal para verificar que la API está funcionando
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "mensaje": "API de Control de LEDs y Sensores funcionando correctamente",
        "endpoints": [
            "/api/consultarEstados",
            "/api/insertarEstados",
            "/api/consultarObstaculo",
            "/api/consultarHistorial",
            "/api/insertarHistorial",
            "/api/login",
            "/api/test-db"
        ]
    })

# Iniciar el servidor si este archivo se ejecuta directamente
if __name__ == '__main__':
    # Obtener el puerto del entorno o usar 5000 por defecto
    port = int(os.environ.get('PORT', 5000))
    # Ejecutar la aplicación en modo debug y accesible desde cualquier IP
    app.run(host='0.0.0.0', port=port, debug=True)