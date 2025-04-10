import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';
import { toast } from 'react-hot-toast';

// Usar un ID fijo para todos los archivos - Debe ser un usuario real que exista en auth.users
// Deberías obtener este ID de la sesión de usuario o de una variable de entorno
const FIXED_USER_ID = '00000000-0000-0000-0000-000000000000';

const FileUploadModal = ({ isOpen, onClose, file, onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [companyName, setCompanyName] = useState('');

  // Procesar archivo Excel
  const processExcelFile = useCallback(async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          // Validar que el archivo tenga datos
          if (!jsonData || jsonData.length < 2) {
            throw new Error('El archivo Excel está vacío o no tiene el formato esperado');
          }

          setExcelData(jsonData);
        } catch (error) {
          setError('Error al procesar el archivo Excel: ' + error.message);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Error al leer el archivo');
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      setError('Error al procesar el archivo: ' + error.message);
      setLoading(false);
    }
  }, [file]);

  // Subir archivo y datos a Supabase
  const handleUpload = async () => {
    if (!file || !excelData || !companyName) {
      setError('Faltan datos requeridos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Subir archivo al storage
      // Simplificar el nombre del archivo aún más (solo números y extensión)
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `file_${timestamp}.${extension}`;
      
      // Convertir el archivo a un Blob
      const fileBuffer = await file.arrayBuffer();
      const fileBlob = new Blob([fileBuffer], { type: file.type });
      
      const { data: uploadData, error: storageError } = await supabase.storage
        .from('files')
        .upload(fileName, fileBlob, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false // Cambiado a false para evitar conflictos
        });

      if (storageError) throw storageError;

      // Obtener la URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(fileName);

      // 2. Crear registro en la tabla files
      const fileRecord = {
        name: companyName,
        original_name: file.name,
        size: file.size,
        type: file.type,
        storage_path: fileName,
        content: excelData,
        user_id: FIXED_USER_ID,
        status: 'active' // Añadir el campo status que es obligatorio
      };
      
      const { data, error: fileError } = await supabase
        .from('files')
        .insert([fileRecord])
        .select()
        .single();

      if (fileError) throw fileError;

      onUploadSuccess(data);
      toast.success('Archivo subido correctamente');
      onClose();
    } catch (error) {
      console.error('Error uploading:', error);
      setError('Error al subir el archivo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para procesar el archivo cuando se abre el modal
  React.useEffect(() => {
    if (isOpen && file) {
      processExcelFile();
      // Limpiar estado al abrir modal
      setCompanyName('');
      setError(null);
    }
  }, [isOpen, file, processExcelFile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg className="h-6 w-6 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Subir Archivo Excel
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300 flex items-start">
            <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {file && (
          <div className="mb-5 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-gray-300">
            <div className="flex items-center mb-2">
              <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium text-blue-300">{file.name}</span>
            </div>
            <div className="text-sm text-gray-400">
              Tamaño: {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="block text-gray-300 mb-2 font-medium">Nombre de la Empresa</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700/70 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            placeholder="Ingrese el nombre de la empresa"
            disabled={loading}
          />
        </div>

        {excelData && (
          <div className="mb-5 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center text-green-300 mb-2">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Archivo procesado correctamente</span>
            </div>
            <div className="text-sm text-gray-400 flex items-center">
              <svg className="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Registros encontrados: <strong className="text-green-400">{excelData.length - 1}</strong></span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-gray-500/20 focus:outline-none"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || !excelData || !companyName}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subiendo...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Subir Archivo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal; 