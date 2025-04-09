import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';

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

      // Obtener el usuario actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No hay sesión activa');

      const userId = session.user.id;

      // 1. Subir archivo al storage
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${userId}/files/${fileName}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (storageError) throw storageError;

      // 2. Crear registro en la tabla files
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert([{
          name: companyName,
          original_name: file.name,
          size: file.size,
          type: file.type,
          storage_path: storageData.path,
          content: excelData,
          status: 'success',
          user_id: userId
        }])
        .select()
        .single();

      if (fileError) throw fileError;

      // 3. Procesar datos del inventario
      const headers = excelData[0];
      const items = excelData.slice(1).map(row => {
        const item = {};
        headers.forEach((header, index) => {
          item[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
        });
        return {
          ...item,
          file_id: fileData.id,
          user_id: userId
        };
      });

      // 4. Insertar items en la tabla inventory
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert(items);

      if (inventoryError) throw inventoryError;

      onUploadSuccess(fileData);
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
    }
  }, [isOpen, file, processExcelFile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-white mb-4">Subir Archivo</h2>
        
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-white mb-2">Nombre de la Empresa</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            placeholder="Ingrese el nombre de la empresa"
            disabled={loading}
          />
        </div>

        {excelData && (
          <div className="mb-4">
            <p className="text-green-400 mb-2">✓ Archivo procesado correctamente</p>
            <p className="text-gray-300">
              Registros encontrados: {excelData.length - 1}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || !excelData || !companyName}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal; 