import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import FileUploadModal from '../components/FileUploadModal';
import InventoryModal from '../components/InventoryModal';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState({});
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedInventoryFileId, setSelectedInventoryFileId] = useState(null);
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

  const handleOpenInventory = (fileId) => {
    setSelectedInventoryFileId(fileId);
    setIsInventoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navbar mejorado */}
      <nav className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <h1 className="ml-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Centro de Datos
              </h1>
            </div>
            <div>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors shadow-md group">
                <svg className="h-5 w-5 mr-2 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Subir Archivo</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".xlsx,.xls"
                />
              </label>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Archivos Recientes</h2>
          
          {files.length === 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center shadow-xl">
              <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-lg mb-4">No hay archivos cargados</p>
              <p className="text-gray-500">Sube tu primer archivo Excel para comenzar</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-blue-500/10 hover:-translate-y-1"
              >
                <div className="p-5 border-b border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{file.name}</h3>
                        <p className="text-sm text-gray-400 truncate max-w-[200px]" title={file.original_name}>
                          {file.original_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenInventory(file.id)}
                        className="bg-green-500/10 p-1.5 rounded-lg text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-colors"
                        title="Abrir inventario"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(file.id, file.storage_path)}
                        className="bg-red-500/10 p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                        title="Eliminar archivo"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-gray-500 space-x-2">
                    <span className="flex items-center">
                      <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {file.content && (
                  <div className="p-3 bg-gray-900/50">
                    <button 
                      onClick={() => {
                        // Toggle para expandir/contraer la tabla
                        setCurrentPage(prev => ({
                          ...prev,
                          [`expanded_${file.id}`]: !prev[`expanded_${file.id}`]
                        }))
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                    >
                      <span className="font-medium">Ver contenido del archivo</span>
                      <svg 
                        className={`h-4 w-4 transform transition-transform ${currentPage[`expanded_${file.id}`] ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {currentPage[`expanded_${file.id}`] && (
                      <div className="mt-3 overflow-x-auto rounded border border-gray-700">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-800">
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
                          <tbody className="bg-gray-900 divide-y divide-gray-800">
                            {file.content
                              .slice(
                                (currentPage[file.id] - 1) * rowsPerPage + 1,
                                currentPage[file.id] * rowsPerPage + 1
                              )
                              .map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-800/70 transition-colors">
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
                        
                        <div className="px-3 py-2 bg-gray-800 border-t border-gray-700 flex justify-between items-center text-sm">
                          <div className="text-gray-400">
                            {(currentPage[file.id] - 1) * rowsPerPage + 1} - {Math.min(currentPage[file.id] * rowsPerPage, file.content.length - 1)} de {file.content.length - 1}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => setCurrentPage(prev => ({
                                ...prev,
                                [file.id]: Math.max(prev[file.id] - 1, 1)
                              }))}
                              disabled={currentPage[file.id] === 1}
                              className="p-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
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
                              className="p-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
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
      
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        fileId={selectedInventoryFileId}
      />
    </div>
  );
};

export default DashboardPage;