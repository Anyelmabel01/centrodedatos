import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const FileUploadModal = ({ isOpen, onClose, fileInfo }) => {
  const [excelData, setExcelData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && fileInfo) {
      loadExcelContent();
    }
  }, [isOpen, fileInfo]);

  const loadExcelContent = async () => {
    if (!fileInfo.file) return;
    
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setExcelData(jsonData);
      };
      reader.readAsArrayBuffer(fileInfo.file);
    } catch (error) {
      console.error('Error al leer el archivo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Información del Archivo
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Archivo</label>
              <p className="mt-1 text-sm text-gray-900">{fileInfo.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Archivo</label>
              <p className="mt-1 text-sm text-gray-900">{fileInfo.type}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tamaño</label>
              <p className="mt-1 text-sm text-gray-900">{fileInfo.size}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Subida</label>
              <p className="mt-1 text-sm text-gray-900">{fileInfo.uploadDate}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                fileInfo.status === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {fileInfo.status === 'success' ? 'Procesado Correctamente' : 'Error en el Procesamiento'}
              </span>
            </div>

            {/* Contenido del Excel */}
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : excelData ? (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido del Archivo
                </label>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {excelData[0]?.map((header, index) => (
                          <th
                            key={index}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {excelData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal; 