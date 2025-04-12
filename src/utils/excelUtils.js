import * as XLSX from 'xlsx';

export function generateExcelTemplate() {
  // Define the structure based on the image
  const dataForSheet = [
    ["Datos Generales de la Empresa"], // Row 1: Title
    ["Nombre de la Empresa"],        // Row 2: Label A2
    ["Ubicación"],                   // Row 3: Label A3
    ["Categoría"],                   // Row 4: Label A4
    ["Responsable de Mantenimiento"],// Row 5: Label A5
    ["Contacto del Responsable"],    // Row 6: Label A6
    [],                            // Row 7: Blank separator row
    ["Registro de Mantenimiento"],   // Row 8: Title
    [                              // Row 9: Headers for the maintenance table
      "Fecha", 
      "Área / Ubicación Interna", 
      "Tipo de Mantenimiento", 
      "Descripción del Trabajo", 
      "Frecuencia", 
      "Estado", 
      "Proveedor", 
      "Costo Estimado", 
      "Costo Real", 
      "Observaciones"
    ]
    // Subsequent rows will be blank for user input
  ];

  // Create worksheet from the defined structure
  const ws = XLSX.utils.aoa_to_sheet(dataForSheet);

  // Optional: Add basic styling or column widths if needed (advanced)
  // Example: Set column widths (approximate character widths)
  // ws['!cols'] = [
  //   { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 40 }, 
  //   { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, 
  //   { wch: 15 }, { wch: 30 }
  // ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla Mantenimiento"); // Rename sheet

  return wb;
} 