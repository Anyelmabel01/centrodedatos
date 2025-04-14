import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import FileUploadModal from '../components/FileUploadModal';
import InventoryModal from '../components/InventoryModal';
import DownloadTemplateButton from '../components/DownloadTemplateButton';
import FileContentModal from '../components/FileContentModal';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedInventoryFileId, setSelectedInventoryFileId] = useState(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedFileForContent, setSelectedFileForContent] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('id, name, original_name, size, created_at, storage_path, content')
        .order('created_at', { ascending: false });

      if (filesError) throw filesError;

      setFiles(filesData || []);
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
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (fileData) => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    toast.success('Archivo subido exitosamente');
    loadFiles();
  };

  const handleDelete = async (fileId, filePath) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath]);

      if (storageError) {
          console.warn('Storage deletion warning:', storageError.message);
      }

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== fileId));

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

  const handleOpenContentModal = (file) => {
    if (!file.content) {
        console.warn('File content not loaded for file:', file.name);
        toast.error('El contenido de este archivo no está disponible.');
        return;
    }
    setSelectedFileForContent(file);
    setIsContentModalOpen(true);
  };

  const handleCloseContentModal = () => {
    setIsContentModalOpen(false);
    setSelectedFileForContent(null);
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-secondary-100 border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <h1 className="ml-2 text-2xl font-bold text-primary-600">
                Centro de Datos
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <label className="inline-flex items-center px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md group text-sm font-medium focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2">
                <svg className="h-4 w-4 mr-1.5 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <DownloadTemplateButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Archivos Recientes</h2>
          
          {files.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg mb-4">No hay archivos cargados</p>
              <p className="text-gray-500 text-sm">Sube tu primer archivo Excel para comenzar</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="card flex flex-col transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-1"
              >
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary-100 p-2 rounded-lg">
                        <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{file.name}</h3>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]" title={file.original_name}>
                          {file.original_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenInventory(file.id)}
                        className="p-1.5 rounded-lg text-green-600 bg-green-100 hover:bg-green-200 transition-all duration-200 ease-in-out hover:scale-110"
                        title="Abrir inventario"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(file.id, file.storage_path)}
                        className="p-1.5 rounded-lg text-red-600 bg-red-100 hover:bg-red-200 transition-all duration-200 ease-in-out hover:scale-110"
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
                
                <div className="pt-4 mt-auto">
                  <button 
                    onClick={() => handleOpenContentModal(file)}
                    className="btn btn-secondary w-full text-center justify-center"
                  >
                    Ver contenido del archivo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isUploadModalOpen && (
          <FileUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadSuccess={handleUploadSuccess}
            selectedFile={selectedFile}
          />
        )}

        {isInventoryModalOpen && (
          <InventoryModal
            isOpen={isInventoryModalOpen}
            onClose={() => setIsInventoryModalOpen(false)}
            fileId={selectedInventoryFileId}
          />
        )}

        <FileContentModal
          isOpen={isContentModalOpen}
          onClose={handleCloseContentModal}
          fileData={selectedFileForContent} 
        />
      </div>
    </div>
  );
};

export default DashboardPage;