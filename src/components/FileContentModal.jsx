import React from 'react';

const FileContentModal = ({ isOpen, onClose, fileData }) => {
  if (!isOpen || !fileData) return null;

  const content = fileData.content || []; // Ensure content is an array
  const headers = content.length > 0 ? content[0] : [];
  const dataRows = content.length > 1 ? content.slice(1) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Contenido de: {fileData.name}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
            aria-label="Cerrar modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body (Table Container) */}
        <div className="p-5 overflow-auto flex-grow"> {/* Added flex-grow */}
          {content.length === 0 ? (
            <p className="text-gray-400 text-center">El archivo parece estar vacío o no tiene contenido procesable.</p>
          ) : (
            <div className="overflow-x-auto rounded border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900 sticky top-0 z-10"> {/* Make header sticky */}
                  <tr>
                    {headers.map((header, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {dataRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-700/50 transition-colors">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-3 whitespace-nowrap text-sm text-gray-300"
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

        {/* Modal Footer (Optional) */}
        {/* <div className="flex justify-end p-4 border-t border-gray-700">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
          >
            Cerrar
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default FileContentModal; 