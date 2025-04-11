from supabase import create_client

# Configuración de Supabase
supabase_url = "https://cwkzukhtktgnvkygxyrv.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3a3p1a2h0a3RnbnZreWd4eXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzU5MTcsImV4cCI6MjA1OTExMTkxN30.-Xyb_lms3OfU67ld5H-hqnBypEo1r3Ga2OOwCxRJteM"

# Crear cliente Supabase
supabase = create_client(supabase_url, supabase_key)

print("\n===== PROYECTOS DEL CENTRO DE DATOS =====\n")

# Intentar obtener proyectos de la tabla 'files'
try:
    # Asumimos que la tabla 'files' contiene los proyectos con información de archivos
    response = supabase.table('files').select("id, name, original_name, created_at").order('created_at', desc=True).execute()
    
    if response.data:
        print(f"Proyectos encontrados: {len(response.data)}\n")
        
        for i, proyecto in enumerate(response.data):
            print(f"{i+1}. Nombre: {proyecto['name']}")
            print(f"   Archivo original: {proyecto['original_name']}")
            print(f"   Fecha de creación: {proyecto['created_at']}")
            print("")
    else:
        print("No se encontraron proyectos en la tabla 'files'.")
except Exception as e:
    print(f"Error al consultar proyectos: {e}")

# También verificar si hay proyectos en inventory
try:
    inventory = supabase.table('inventory').select("id, name, description, created_at").order('created_at', desc=True).execute()
    
    if inventory.data:
        print("\n===== INVENTARIO =====\n")
        print(f"Elementos en inventario: {len(inventory.data)}\n")
        
        for i, item in enumerate(inventory.data):
            print(f"{i+1}. Nombre: {item['name']}")
            if 'description' in item and item['description']:
                print(f"   Descripción: {item['description']}")
            print(f"   Fecha de registro: {item['created_at']}")
            print("")
except Exception as e:
    print(f"Nota: La tabla de inventario está vacía o no accesible.")

print("\n===== FIN DEL REPORTE =====\n") 