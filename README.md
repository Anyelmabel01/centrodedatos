# Centro de Datos

Este proyecto está dividido en dos partes principales:

## Frontend (React + Tailwind CSS)

Para ejecutar el frontend:
```bash
cd frontend
npm install
npm run dev
```

## Backend (Flask + Supabase)

Para ejecutar el backend:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # En Windows
source venv/bin/activate  # En Linux/Mac
pip install -r requirements.txt
python app.py
```

## Variables de Entorno

El backend requiere un archivo `.env` con las siguientes variables:
- SUPABASE_URL
- SUPABASE_KEY

## Estructura del Proyecto

```
centro-datos/
├── frontend/               # Proyecto React
│   ├── src/
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/               # Servidor Flask
│   ├── app.py
│   ├── .env
│   └── requirements.txt
│
└── README.md
```
