import React from 'react';

// Adjusted for Light Theme
const FileContentModal = ({ isOpen, onClose, file }) => {
  if (!isOpen || !file) return null;

  const content = file.content || []; 
  const headers = content.length > 0 ? content[0] : [];
  const dataRows = content.length > 1 ? content.slice(1) : [];

  return (
    // Overlay - keep it dark for contrast
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      {/* Modal Container - Light theme */}
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header - Light theme */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Contenido de: {file.name}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Cerrar modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body (Table Container) - Light theme */}
        <div className="p-5 overflow-auto flex-grow">
          {content.length === 0 ? (
            <p className="text-gray-500 text-center">El archivo parece estar vacío o no tiene contenido procesable.</p>
          ) : (
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                {/* Table Head - Lighter background */}
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {headers.map((header, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                {/* Table Body - Light theme */}
                <tbody className="bg-white divide-y divide-gray-200">
                  {dataRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-3 whitespace-nowrap text-sm text-gray-700"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {dataRows.length === 0 && (
                     <tr>
                       <td colSpan={headers.length} className="px-4 py-4 text-center text-sm text-gray-500">
                         No hay datos para mostrar (solo cabeceras).
                       </td>
                     </tr>
                   )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Optional Footer - Example with light theme button */}
        {/* <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
          <button 
            onClick={onClose} 
            className="btn btn-secondary"
          >
            Cerrar
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default FileContentModal; 