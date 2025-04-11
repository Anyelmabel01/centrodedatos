from supabase import create_client
import os

# Configuración de Supabase
supabase_url = "https://cwkzukhtktgnvkygxyrv.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3a3p1a2h0a3RnbnZreWd4eXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzU5MTcsImV4cCI6MjA1OTExMTkxN30.-Xyb_lms3OfU67ld5H-hqnBypEo1r3Ga2OOwCxRJteM"

# Crear cliente Supabase
supabase = create_client(supabase_url, supabase_key)

# Lista de tablas que sabemos que existen
tablas_conocidas = ['inventory', 'files']
print("\n=== TABLAS ENCONTRADAS ===")

for tabla in tablas_conocidas:
    try:
        # Intenta seleccionar las primeras 3 filas para verificar la existencia
        response = supabase.table(tabla).select("*").limit(3).execute()
        
        # Si llegamos aquí, la tabla existe
        print(f"\n📋 TABLA: {tabla.upper()}")
        
        # Obtener datos de la tabla
        if response.data:
            # Mostrar columnas
            columnas = list(response.data[0].keys())
            print(f"\nColumnas ({len(columnas)}):")
            for col in columnas:
                print(f"  - {col}")
            
            # Mostrar muestra de datos
            print(f"\nMuestra de datos ({len(response.data)} filas):")
            for i, fila in enumerate(response.data):
                print(f"\nFila {i+1}:")
                for key, value in fila.items():
                    # Limitar el tamaño del valor para mejor visualización
                    if isinstance(value, str) and len(value) > 100:
                        value = value[:100] + "..."
                    print(f"  {key}: {value}")
        else:
            print(f"  [Tabla vacía - no hay datos para mostrar]")
            
    except Exception as e:
        print(f"\n❌ Error al consultar tabla '{tabla}': {e}")

# Intentar descubrir más tablas
print("\n\n=== BUSCANDO TABLAS ADICIONALES ===")
tablas_comunes = [
    'users', 'profiles', 'auth', 'storage', 'buckets', 
    'customers', 'products', 'orders', 'transactions',
    'logs', 'settings', 'categories', 'tags', 'comments'
]

for tabla in tablas_comunes:
    if tabla not in tablas_conocidas:
        try:
            # Intenta seleccionar una fila para verificar la existencia
            response = supabase.table(tabla).select("*").limit(1).execute()
            # Si llegamos aquí, la tabla existe
            print(f"✓ Encontrada tabla adicional: {tabla}")
        except:
            # Tabla no existe o error de permisos
            pass 