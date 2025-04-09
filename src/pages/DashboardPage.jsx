import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import FileUploadModal from '../components/FileUploadModal';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState({});
  const rowsPerPage = 10;

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (filesError) throw filesError;

      const filesWithUrls = await Promise.all(filesData.map(async (file) => {
        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(file.storage_path);
        return { ...file, url: publicUrl };
      }));

      setFiles(filesWithUrls);
      
      // Inicializar páginas
      const pages = {};
      filesWithUrls.forEach(file => {
        pages[file.id] = 1;
      });
      setCurrentPage(pages);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Error al cargar los archivos');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.includes('spreadsheet') && !file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB');
      return;
    }

    setSelectedFile(file);
    setIsModalOpen(true);
  };

  const handleUploadSuccess = (fileData) => {
    setFiles(prev => [fileData, ...prev]);
    setCurrentPage(prev => ({ ...prev, [fileData.id]: 1 }));
    setIsModalOpen(false);
    setSelectedFile(null);
    toast.success('Archivo subido exitosamente');
    loadFiles(); // Recargar la lista de archivos
  };

  const handleDelete = async (fileId, filePath) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== fileId));
      setCurrentPage(prev => {
        const newPages = { ...prev };
        delete newPages[fileId];
        return newPages;
      });

      toast.success('Archivo eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Error al eliminar el archivo: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Centro de Datos</h1>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
              <span className="mr-2">Subir Archivo</span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".xlsx,.xls"
              />
            </label>
          </div>
        </div>

        <div className="space-y-8">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">{file.original_name}</h3>
                  <p className="text-sm text-gray-400">{file.name}</p>
                  <div className="mt-2 space-x-4 text-sm text-gray-400">
                    <span>Tamaño: {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>Subido: {new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(file.id, file.storage_path)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {file.content && (
                <div className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          {file.content[0]?.map((header, index) => (
                            <th
                              key={index}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {file.content
                          .slice(
                            (currentPage[file.id] - 1) * rowsPerPage + 1,
                            currentPage[file.id] * rowsPerPage + 1
                          )
                          .map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-800">
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      Mostrando {(currentPage[file.id] - 1) * rowsPerPage + 1} a{' '}
                      {Math.min(currentPage[file.id] * rowsPerPage, file.content.length - 1)} de{' '}
                      {file.content.length - 1} registros
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => ({
                          ...prev,
                          [file.id]: Math.max(prev[file.id] - 1, 1)
                        }))}
                        disabled={currentPage[file.id] === 1}
                        className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-600 transition-colors"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => ({
                          ...prev,
                          [file.id]: Math.min(
                            prev[file.id] + 1,
                            Math.ceil((file.content.length - 1) / rowsPerPage)
                          )
                        }))}
                        disabled={currentPage[file.id] === Math.ceil((file.content.length - 1) / rowsPerPage)}
                        className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-600 transition-colors"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default DashboardPage;