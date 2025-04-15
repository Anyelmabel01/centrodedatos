import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import FileUploadModal from '../components/FileUploadModal';
import InventoryModal from '../components/InventoryModal';
import DownloadTemplateButton from '../components/DownloadTemplateButton';
import FileContentModal from '../components/FileContentModal';
import { toast } from 'react-hot-toast';
import { DocumentDuplicateIcon, ServerIcon } from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 9; // Constante para elementos por página

const DashboardPage = () => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Estado de carga inicial
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1); // Estado para página actual
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
    setIsLoading(true);
    try {
      // Por ahora, cargamos todos los archivos para filtrado/ordenación en cliente
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('id, name, original_name, size, created_at, storage_path, content')
        .order('created_at', { ascending: false }); // Orden inicial por defecto

      if (filesError) throw filesError;

      setFiles(filesData || []);
      setCurrentPage(1); // Resetea a la página 1 al cargar nuevos datos
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Error al cargar los archivos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Formato no válido. Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Archivo demasiado grande. El límite es 10MB.');
      return;
    }

    setSelectedFile(file);
    setIsUploadModalOpen(true);
    e.target.value = null;
  };

  const handleUploadSuccess = (fileData) => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    toast.success('Archivo subido exitosamente');
    loadFiles();
  };

  const handleDelete = async (fileId, filePath) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      return;
    }

    const toastId = toast.loading('Eliminando archivo...');

    try {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath]);

      if (storageError && storageError.message !== 'The resource was not found') {
        console.warn('Storage deletion warning:', storageError.message);
      } else if (storageError && storageError.message === 'The resource was not found') {
        console.log('File not found in storage, proceeding with DB deletion.');
      }

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== fileId));

      toast.success('Archivo eliminado exitosamente', { id: toastId });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(`Error al eliminar: ${error.message}`, { id: toastId });
    }
  };

  const handleOpenInventory = (fileId) => {
    setSelectedInventoryFileId(fileId);
    setIsInventoryModalOpen(true);
  };

  const handleOpenContentModal = (file) => {
    console.log('Button clicked, opening content modal for:', file?.name);
    if (!file.content || (typeof file.content === 'object' && Object.keys(file.content).length === 0) || (typeof file.content === 'string' && file.content.trim() === '')) {
      console.warn('File content is missing or empty for file:', file.name);
      toast.error('El contenido de este archivo aún no está disponible o está vacío.');
      return;
    }
    setSelectedFileForContent(file);
    setIsContentModalOpen(true);
    console.log('State updated to open modal');
  };

  const handleCloseContentModal = () => {
    setIsContentModalOpen(false);
    setSelectedFileForContent(null);
  };

  // Calcular estadísticas usando useMemo
  const stats = useMemo(() => {
    const totalFilesCount = files.length;
    const totalSizeBytes = files.reduce((acc, file) => acc + (file.size || 0), 0);
    
    // Formatear tamaño
    let totalSizeFormatted;
    if (totalSizeBytes < 1024 * 1024) {
        totalSizeFormatted = (totalSizeBytes / 1024).toFixed(2) + ' KB';
    } else if (totalSizeBytes < 1024 * 1024 * 1024) {
        totalSizeFormatted = (totalSizeBytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
        totalSizeFormatted = (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
    // Considerar 0 bytes
    if (totalSizeBytes === 0) totalSizeFormatted = '0 KB';

    return {
      totalFilesCount,
      totalSizeFormatted,
    };
  }, [files]); // Dependencia: recalcular solo si cambian los archivos

  // 1. Ordenar y Filtrar archivos
  const processedFiles = useMemo(() => {
    let sortedFilteredFiles = [...files];

    // Aplicar filtro de búsqueda primero
    if (searchTerm) {
        sortedFilteredFiles = sortedFilteredFiles.filter(file =>
          (file.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (file.original_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    // Luego ordenar los resultados filtrados
    sortedFilteredFiles.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'name':
          valA = a.name?.toLowerCase() || '';
          valB = b.name?.toLowerCase() || '';
          break;
        case 'size':
          valA = a.size || 0;
          valB = b.size || 0;
          break;
        case 'created_at':
        default:
          valA = new Date(a.created_at || 0);
          valB = new Date(b.created_at || 0);
          break;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedFilteredFiles;

  }, [files, searchTerm, sortBy, sortOrder]);

  // 2. Calcular datos para la paginación actual
  const { paginatedFiles, totalPages } = useMemo(() => {
    const total = processedFiles.length;
    const pages = Math.ceil(total / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const items = processedFiles.slice(startIndex, endIndex);
    return { paginatedFiles: items, totalPages: pages };
  }, [processedFiles, currentPage]);

  // Resetear página a 1 cuando cambia el filtro o la ordenación
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Cambiado a 'desc' por defecto al cambiar criterio
    }
    // No es necesario resetear currentPage aquí, el useEffect se encargará
  };

  const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
      }
  };

  // Componente local para las tarjetas de estadísticas (alternativa a archivo separado)
  const StatsCard = ({ icon, label, value, color = 'primary' }) => {
    const colorClasses = {
        primary: { bg: 'bg-blue-100', text: 'text-blue-600', iconBg: 'bg-blue-200' },
        green: { bg: 'bg-green-100', text: 'text-green-600', iconBg: 'bg-green-200' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', iconBg: 'bg-yellow-200' },
    };
    const selectedColor = colorClasses[color] || colorClasses.primary;

    return (
        <div className={`${selectedColor.bg} rounded-xl p-5 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:shadow-md`}>
        <div className={`${selectedColor.iconBg} p-3 rounded-lg`}>{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`text-2xl font-semibold ${selectedColor.text}`}>{value}</p>
        </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <h1 className="ml-3 text-2xl font-bold text-gray-800 tracking-tight">
                Centro de Datos
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <label className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg group text-sm font-medium focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-50">
                <svg className="h-5 w-5 mr-2 group-hover:rotate-[15deg] transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Subir Archivo</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                />
              </label>
              <DownloadTemplateButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Sección de Estadísticas */} 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2"> {/* Padding top/bottom */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Tarjeta Total Archivos */}
              <StatsCard
                  icon={<DocumentDuplicateIcon className="h-6 w-6 text-blue-600" />} // Pasando el icono como elemento
                  label="Total Archivos"
                  value={isLoading ? '...' : stats.totalFilesCount}
                  color="primary"
              />
              {/* Tarjeta Tamaño Total */}
              <StatsCard
                  icon={<ServerIcon className="h-6 w-6 text-green-600" />} // Pasando el icono como elemento
                  label="Espacio Utilizado"
                  value={isLoading ? '...' : stats.totalSizeFormatted}
                  color="green"
              />
              {/* Puedes añadir más tarjetas aquí si calculas más estadísticas */}
              {/* 
              <StatsCard
                  icon={<ClockIcon className="h-6 w-6 text-yellow-600" />} 
                  label="Subidos Hoy"
                  value={isLoading ? '...' : stats.uploadedTodayCount} // Necesitarías calcular esto
                  color="yellow"
              /> 
              */}
          </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"> {/* Ajustado padding top */}
        <header className="mb-6">
          <div className="md:flex md:items-center md:justify-between mb-4">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4 md:mb-0">Archivos Recientes</h2>
            <div className="relative w-full md:max-w-xs">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Ordenar por:</span>
            <button
              onClick={() => handleSortChange('created_at')}
              className={`px-2.5 py-1 rounded-md transition-colors ${sortBy === 'created_at' ? 'bg-primary-100 text-primary-700 font-medium' : 'hover:bg-gray-100'}`}
            >
              Fecha {sortBy === 'created_at' && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
            <button
              onClick={() => handleSortChange('name')}
              className={`px-2.5 py-1 rounded-md transition-colors ${sortBy === 'name' ? 'bg-primary-100 text-primary-700 font-medium' : 'hover:bg-gray-100'}`}
            >
              Nombre {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
            <button
              onClick={() => handleSortChange('size')}
              className={`px-2.5 py-1 rounded-md transition-colors ${sortBy === 'size' ? 'bg-primary-100 text-primary-700 font-medium' : 'hover:bg-gray-100'}`}
            >
              Tamaño {sortBy === 'size' && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
          </div>
        </header>

        {/* Estado de Carga Global */}
        {isLoading ? (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="ml-3 text-gray-600">Cargando archivos...</p>
            </div>
        ) : (
          <> {/* Fragmento para agrupar grid y paginación */}
            {/* Grid de archivos / Estado vacío */}
            {files.length === 0 ? (
                // Estado inicial vacío (cuando no hay archivos en total)
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center shadow-sm transform hover:shadow-md hover:border-primary-300 transition-all duration-300 ease-out">
                    <svg className="h-16 w-16 text-primary-400 mx-auto mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-700 text-xl font-medium mb-3">Tu centro de datos está vacío</p>
                    <p className="text-gray-500 max-w-md mx-auto">Sube tu primer archivo Excel (.xlsx o .xls) para comenzar a visualizar y gestionar tu inventario.</p>
                     <label className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg group text-sm font-medium focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-50">
                         <svg className="h-5 w-5 mr-2 group-hover:rotate-[15deg] transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                         </svg>
                         <span>Subir Primer Archivo</span>
                         <input type="file" className="hidden" onChange={handleFileChange} accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"/>
                     </label>
                </div>
            ) : processedFiles.length === 0 ? (
                // Estado vacío por filtro (cuando hay archivos pero ninguno coincide)
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm mt-6">
                   <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l4 4m0-4l-4 4"/>
                   </svg>
                   <p className="text-gray-600 text-lg mb-2 font-medium">No se encontraron archivos</p>
                   <p className="text-gray-500 text-sm">
                     Intenta con un término de búsqueda diferente o ajusta los filtros.
                   </p>
                </div>
            ) : (
               // Grid de Archivos (usando paginatedFiles)
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                 {paginatedFiles.map((file, index) => (
                   <div
                     key={file.id}
                     className="bg-green-50 rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1.5 group"
                     style={{ animation: `fadeInUp 0.4s ease-out ${index * 70}ms backwards` }}
                   >
                     <div className="p-5 border-b border-green-100">
                       <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center space-x-4 flex-1 min-w-0">
                           <div className="flex-shrink-0 bg-gradient-to-tr from-primary-100 to-primary-200 p-3 rounded-xl shadow-sm">
                             <svg className="h-7 w-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                             </svg>
                           </div>
                           <div className="flex-1 min-w-0">
                             <h3 className="text-md font-semibold text-gray-800 truncate group-hover:text-primary-700 transition-colors" title={file.name}>
                                 {file.name}
                             </h3>
                             <p className="text-sm text-gray-500 truncate" title={file.original_name}>
                                {file.original_name}
                             </p>
                           </div>
                         </div>
                          <div className="flex flex-col space-y-1.5 ml-2 flex-shrink-0">
                            <button
                               onClick={(e) => { e.stopPropagation(); handleOpenInventory(file.id); }}
                               className="p-1.5 rounded-full text-green-600 bg-green-50 hover:bg-green-100 transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                               title="Ver Inventario"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </button>
                            <button
                               onClick={(e) => { e.stopPropagation(); handleDelete(file.id, file.storage_path); }}
                               className="p-1.5 rounded-full text-red-500 bg-red-50 hover:bg-red-100 transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                               title="Eliminar Archivo"
                            >
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
                            </button>
                          </div>
                       </div>
                       <div className="mt-4 flex items-center justify-between text-xs text-gray-500 px-5">
                         <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                           <svg className="h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10m16-10v10M8 4h8m-8 16h8M5 11h14M5 15h14" />
                           </svg>
                           {(file.size / (1024 * 1024)).toFixed(2)} MB
                         </span>
                         <span className="flex items-center">
                           <svg className="h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                            {new Date(file.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </span>
                       </div>
                     </div>

                      <div className="p-4 mt-auto bg-green-100 border-t border-green-200 rounded-b-xl">
                        <button
                           onClick={() => handleOpenContentModal(file)}
                           disabled={!file.content || (typeof file.content === 'object' && Object.keys(file.content).length === 0)}
                           className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              !file.content || (typeof file.content === 'object' && Object.keys(file.content).length === 0)
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'text-white bg-blue-400 hover:bg-blue-500 focus:ring-blue-400 hover:shadow-md hover:-translate-y-0.5'
                            }`}
                        >
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                             <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                           Ver Contenido
                         </button>
                     </div>
                   </div>
                 ))}
               </div>
             )
            }

            {/* Controles de Paginación */}
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center space-x-3">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Siguiente
                    </button>
                </div>
            )}
          </>
        )}
      </main>

      {isUploadModalOpen && (
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
              setIsUploadModalOpen(false);
              setSelectedFile(null);
          }}
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

      {selectedFileForContent && (
          <FileContentModal
            isOpen={isContentModalOpen}
            onClose={handleCloseContentModal}
            file={selectedFileForContent}
          />
      )}
    </div>
  );
};

export default DashboardPage;