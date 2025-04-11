import { useState, useEffect } from 'react';
import { authenticateWithToken, isMCPAuthenticated } from '../config/cursor-mcp';

const MCPAuth = ({ onAuthSuccess }) => {
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si ya está autenticado al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isMCPAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated && onAuthSuccess) {
        onAuthSuccess();
      }
    };
    checkAuth();
  }, [onAuthSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken.trim()) {
      setError('El access token es requerido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authenticateWithToken(accessToken);
      
      if (result.success) {
        setIsAuthenticated(true);
        if (onAuthSuccess) {
          onAuthSuccess(result.user);
        }
      } else {
        setError(result.error || 'Error de autenticación');
      }
    } catch (err) {
      setError('Error al procesar la autenticación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="bg-green-100 p-4 rounded-md mb-4">
        <p className="text-green-700 font-medium">¡Conectado a Supabase para MCP!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Conectar con Supabase MCP</h2>
      
      {error && (
        <div className="bg-red-100 p-3 rounded-md mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="accessToken" className="block text-gray-700 mb-2">
            Access Token de Supabase
          </label>
          <input
            type="text"
            id="accessToken"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Ingresa tu access token"
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-1">
            Puedes obtener tu access token desde la configuración de tu proyecto en Supabase.
          </p>
        </div>
        
        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md text-white font-medium 
            ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          disabled={loading}
        >
          {loading ? 'Conectando...' : 'Conectar a Supabase'}
        </button>
      </form>
    </div>
  );
};

export default MCPAuth; 