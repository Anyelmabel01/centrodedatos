import React from 'react';
import * as XLSX from 'xlsx';
import { generateExcelTemplate } from '../utils/excelUtils';

function DownloadTemplateButton() {
  const handleDownload = () => {
    // Generate the Excel workbook
    const wb = generateExcelTemplate();

    // Trigger the download
    // Use the specified filename "Plantilla_Mantenimiento_Empresa.xlsx"
    XLSX.writeFile(wb, "Plantilla_Mantenimiento_Empresa.xlsx");
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Descargar Plantilla
    </button>
  );
}

export default DownloadTemplateButton; 