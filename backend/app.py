from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from supabase import create_client, Client
import pandas as pd
from werkzeug.utils import secure_filename

# Cargar variables de entorno
load_dotenv()

# Configuración de Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Inicializar Flask
app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Configuración para subida de archivos
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv'}

# Crear carpeta de uploads si no existe
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def hello():
    return jsonify({"message": "¡Bienvenido a la API del Centro de Datos!"})

@app.route('/api/datos', methods=['GET'])
def get_datos():
    try:
        # Ejemplo de consulta a Supabase
        response = supabase.table('tu_tabla').select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    # Verificar si se envió un archivo
    if 'file' not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400
    
    file = request.files['file']
    
    # Verificar si se seleccionó un archivo
    if file.filename == '':
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400
    
    # Verificar si es un archivo CSV
    if file and allowed_file(file.filename):
        try:
            # Guardar el archivo
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Leer el CSV con pandas
            df = pd.read_csv(filepath)
            
            # Procesar los datos y subirlos a Supabase
            data = df.to_dict('records')
            
            # Subir datos a Supabase (ajusta el nombre de la tabla según tu necesidad)
            response = supabase.table('datos').insert(data).execute()
            
            # Eliminar el archivo temporal
            os.remove(filepath)
            
            return jsonify({
                "message": "Archivo procesado correctamente",
                "rows_processed": len(data)
            })
            
        except Exception as e:
            # Si ocurre un error, intentar eliminar el archivo si existe
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "Tipo de archivo no permitido"}), 400

if __name__ == '__main__':
    app.run(debug=True) 