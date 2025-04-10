from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from supabase import create_client, Client
import pandas as pd
from werkzeug.utils import secure_filename
import traceback

# Cargar variables de entorno
load_dotenv()

# Configuración de Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase environment variables. Please check .env file.")

supabase: Client = create_client(supabase_url, supabase_key)

# ID de usuario fijo para todos los archivos (sin autenticación)
FIXED_USER_ID = '00000000-0000-0000-0000-000000000000'

# Inicializar Flask
app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Configuración para subida de archivos
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}

# Crear carpeta de uploads si no existe
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def hello():
    return jsonify({"message": "¡Bienvenido a la API del Centro de Datos!"})

@app.route('/api/files', methods=['GET'])
def get_files():
    try:
        response = supabase.table('files').select("*").order('created_at', desc=True).execute()
        return jsonify(response.data)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    # Verificar si se envió un archivo
    if 'file' not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400
    
    file = request.files['file']
    
    # Verificar si se seleccionó un archivo
    if file.filename == '':
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400
    
    # Verificar si se proporcionó el nombre de la empresa
    company_name = request.form.get('company_name')
    if not company_name:
        return jsonify({"error": "No se proporcionó el nombre de la empresa"}), 400
    
    # Verificar si es un archivo permitido
    if file and allowed_file(file.filename):
        try:
            # Guardar el archivo
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Leer el archivo con pandas
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            # Convertir a formato JSON para almacenar
            data = df.fillna('').to_dict('records')
            headers = list(df.columns)
            
            # Usar el ID de usuario fijo
            file_storage_path = f"{FIXED_USER_ID}/files/{filename}"
            
            # Subir archivo al storage de Supabase
            with open(filepath, 'rb') as f:
                storage_response = supabase.storage.from_('files').upload(file_storage_path, f)
                
                if hasattr(storage_response, 'error') and storage_response.error:
                    raise Exception(f"Error al subir a storage: {storage_response.error}")
            
            # Crear registro en la tabla files
            file_data = {
                "name": company_name,
                "original_name": filename,
                "size": os.path.getsize(filepath),
                "type": file.content_type,
                "storage_path": file_storage_path,
                "content": [headers] + [list(row.values()) for row in data],
                "user_id": FIXED_USER_ID
            }
            
            insert_response = supabase.table('files').insert(file_data).execute()
            
            # Limpiar el archivo temporal
            os.remove(filepath)
            
            return jsonify({
                "message": "Archivo procesado correctamente",
                "file_data": insert_response.data[0] if insert_response.data else None,
                "rows_processed": len(data)
            })
            
        except Exception as e:
            # Si ocurre un error, intentar eliminar el archivo si existe
            if os.path.exists(filepath):
                os.remove(filepath)
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "Tipo de archivo no permitido"}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000))) 