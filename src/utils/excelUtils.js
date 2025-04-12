import * as XLSX from 'xlsx';

export function generateExcelTemplate() {
  // Define the new headers based on the image
  const headers = [
    "Nombre de Empresa", 
    "Ubicacion", 
    "Categoria", 
    "Datos", 
    "Tiempo de uso"
  ];

  // --- Create Header Style --- 
  const headerCellStyle = {
    font: {
      bold: true,
      color: { rgb: "FFFFFFFF" } // White font color
    },
    fill: {
      patternType: "solid",
      fgColor: { rgb: "FF002060" } // Dark Blue background (ARGB format)
    },
    alignment: {
      vertical: "center",
      horizontal: "center"
    }
  };

  // --- Define the structure based on the image, removing "Estado" --- 
  const dataForSheet = [
    ["Datos Generales de la Empresa"], // Row 1: Title
    ["Nombre de la Empresa"],        // Row 2: Label A2
    ["Ubicación"],                   // Row 3: Label A3
    ["Categoría"],                   // Row 4: Label A4
    ["Responsable de Mantenimiento"],// Row 5: Label A5
    ["Contacto del Responsable"],    // Row 6: Label A6
    [],                            // Row 7: Blank separator row
    ["Registro de Mantenimiento"],   // Row 8: Title
    [                              // Row 9: Headers for the maintenance table (Estado removed)
      "Fecha", 
      "Área / Ubicación Interna", 
      "Tipo de Mantenimiento", 
      "Descripción del Trabajo", 
      "Frecuencia", 
      // "Estado", // Removed
      "Proveedor", 
      "Costo Estimado", 
      "Costo Real", 
      "Observaciones"
    ]
    // Subsequent rows will be blank for user input
  ];

  // --- Create worksheet using sheet_add_aoa --- 
  const ws = {}; // Start with an empty worksheet object

  // Add rows 1-8 (Titles and Labels - no special styling needed here)
  for (let R = 0; R < 8; ++R) {
      XLSX.utils.sheet_add_aoa(ws, [dataForSheet[R]], { origin: { r: R, c: 0 } });
  }

  // Create styled header row for the table (Row 9)
  const tableHeaderRow = dataForSheet[8].map(header => ({
    v: header, 
    t: 's',    
    s: headerCellStyle
  }));
  
  // Add the styled header row to the worksheet at row index 8 (which is the 9th row -> A9)
  XLSX.utils.sheet_add_aoa(ws, [tableHeaderRow], { origin: 'A9' });

  // Set column widths (Adjusted for removed column)
  ws['!cols'] = [
    { wch: 20 }, // Fecha
    { wch: 25 }, // Área / Ubicación Interna
    { wch: 25 }, // Tipo de Mantenimiento
    { wch: 40 }, // Descripción del Trabajo
    { wch: 15 }, // Frecuencia
    // No width needed for Estado
    { wch: 20 }, // Proveedor
    { wch: 15 }, // Costo Estimado
    { wch: 15 }, // Costo Real
    { wch: 30 }  // Observaciones
  ];
  
  // Set the range of the worksheet to cover all added data (up to row 9)
  // Number of columns is now dataForSheet[8].length
  ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: dataForSheet[8].length - 1, r: 8 } });

  // Create workbook
  const wb = XLSX.utils.book_new();
  // You might want to change the sheet name if this is a different template
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla Mantenimiento"); 

  return wb;
} 