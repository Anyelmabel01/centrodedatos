import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';
import { toast } from 'react-hot-toast';

// Usar un ID fijo para todos los archivos - Debe ser un usuario real que exista en auth.users
// Deberías obtener este ID de la sesión de usuario o de una variable de entorno
const FIXED_USER_ID = '00000000-0000-0000-0000-000000000000';

// Adjusted for Light Theme
const FileUploadModal = ({ isOpen, onClose, selectedFile, onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [companyName, setCompanyName] = useState('');

  // Procesar archivo Excel
  const processExcelFile = useCallback(async () => {
    if (!selectedFile) return;

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

      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      setError('Error al procesar el archivo: ' + error.message);
      setLoading(false);
    }
  }, [selectedFile]);

  // Subir archivo y datos a Supabase
  const handleUpload = async () => {
    if (!selectedFile || !excelData || !companyName) {
      setError('Faltan datos requeridos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Subir archivo al storage
      // Simplificar el nombre del archivo aún más (solo números y extensión)
      const timestamp = Date.now();
      const extension = selectedFile.name.split('.').pop();
      const fileName = `file_${timestamp}.${extension}`;
      
      // Convertir el archivo a un Blob
      const fileBuffer = await selectedFile.arrayBuffer();
      const fileBlob = new Blob([fileBuffer], { type: selectedFile.type });
      
      const { data: uploadData, error: storageError } = await supabase.storage
        .from('files')
        .upload(fileName, fileBlob, {
          contentType: selectedFile.type,
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
        original_name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
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
    if (isOpen && selectedFile) {
      processExcelFile();
      // Limpiar estado al abrir modal
      setCompanyName('');
      setError(null);
    }
  }, [isOpen, selectedFile, processExcelFile]);

  if (!isOpen) return null;

  return (
    // Overlay - Keep dark
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Modal Container - Light theme */}
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="h-6 w-6 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Subir Archivo Excel
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Error Message - Light theme */}
        {error && (
          <div className="mb-5 bg-red-50 border border-red-300 rounded-lg p-4 text-red-700 flex items-start">
            <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* File Info - Light theme */}
        {selectedFile && (
          <div className="mb-5 bg-primary-50 border border-primary-200 rounded-lg p-4 text-gray-700">
            <div className="flex items-center mb-2">
              <svg className="h-5 w-5 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium text-primary-700">{selectedFile.name}</span>
            </div>
            <div className="text-sm text-gray-600">
              Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        )}

        {/* Company Name Input - Light theme */}
        <div className="mb-5">
          <label className="label">Nombre de la Empresa</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="input" // Use .input style from index.css
            placeholder="Ingrese el nombre de la empresa"
            disabled={loading}
          />
        </div>

        {/* Processed File Info - Light theme */}
        {excelData && (
          <div className="mb-5 bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="flex items-center text-green-700 mb-2">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Archivo procesado correctamente</span>
            </div>
            <div className="text-sm text-gray-600 flex items-center">
              <svg className="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Registros encontrados: <strong className="text-green-600">{excelData.length - 1}</strong></span>
            </div>
          </div>
        )}

        {/* Action Buttons - Light theme */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary" // Use secondary button style
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={loading || !excelData || !companyName}
            className="btn btn-primary flex items-center disabled:opacity-50" // Use primary button style
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
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