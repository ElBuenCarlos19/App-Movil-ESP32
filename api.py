from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import mysql.connector
import json
import jwt
import datetime
import os
from functools import wraps

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Configuración de la aplicación
app.config['SECRET_KEY'] = 'tu_clave_secreta'  # Cambiar en producción
app.config['DB_CONFIG'] = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Cambiar según tu configuración
    'database': 'control_led_sensor'
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
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            user_id = data['user_id']
        except:
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
        
        response = obst[0]["estado_obstaculo"]
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
            return jsonify({"mensaje": "No hay datos disponibles"})
        
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
        
        # Verificar si el usuario existe en la base de datos
        user = execute_query(
            "SELECT id FROM usuario WHERE nombre = %s AND contraseña = %s",
            (username, password)
        )
        
        # Verificar si el usuario existe y si las credenciales coinciden
        if user:
            # Crear un token JWT
            token = jwt.encode(
                {
                    'user_id': user[0]['id'],
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
                },
                app.config['SECRET_KEY'],
                algorithm="HS256"
            )
            
            # Enviar el token al cliente
            return jsonify({
                "user": user[0]['id'],
                "token": token
            })
        else:
            return jsonify({"error": "Usuario o contraseña incorrectos"}), 401
    
    except Exception as error:
        print(f"Error en login: {error}")
        return jsonify({"error": str(error)}), 500

# Ruta principal para verificar que la API está funcionando
@app.route('/', methods=['GET'])
def index():
    return jsonify({"mensaje": "API de Control de LEDs y Sensores funcionando correctamente"})

# Iniciar el servidor si este archivo se ejecuta directamente
if __name__ == '__main__':
    # Obtener el puerto del entorno o usar 5000 por defecto
    port = int(os.environ.get('PORT', 5000))
    # Ejecutar la aplicación en modo debug y accesible desde cualquier IP
    app.run(host='0.0.0.0', port=port, debug=True)