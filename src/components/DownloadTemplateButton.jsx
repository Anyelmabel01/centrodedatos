import React from 'react';

// Adjusted for Light Theme & Smaller Size
const DownloadTemplateButton = () => {
  
  const handleDownload = async () => {
    // Dynamically import the utility function only when needed
    const { generateExcelTemplate } = await import('../utils/excelUtils');
    const XLSX = await import('xlsx');

    // Generate the Excel workbook
    const wb = generateExcelTemplate();

    // Trigger the download
    XLSX.writeFile(wb, "Plantilla_Mantenimiento_Empresa.xlsx");
  };

  return (
    // Apply outline button style
    <button
      onClick={handleDownload}
      className="inline-flex items-center px-3 py-1.5 bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50 rounded-md transition-colors duration-200 ease-in-out text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      Descargar Plantilla
    </button>
  );
};

export default DownloadTemplateButton; 