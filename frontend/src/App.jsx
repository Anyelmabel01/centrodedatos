import { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Button, 
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import InventoryManagement from './components/InventoryManagement';

function App() {
  const [openInventory, setOpenInventory] = useState(false);

  const handleOpenInventory = () => {
    setOpenInventory(true);
  };

  const handleCloseInventory = () => {
    setOpenInventory(false);
  };

  // Datos de ejemplo - después los conectaremos con la base de datos
  const startups = [
    { nombre: 'La Haus', pais: 'Colombia', empleados: 300 },
    { nombre: 'Platzi', pais: 'Colombia', empleados: 250 },
    { nombre: 'Tül', pais: 'Colombia', empleados: 500 },
    { nombre: 'Trii', pais: 'Colombia', empleados: 120 },
    { nombre: 'Vozy', pais: 'México', empleados: 80 }
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Centro de Datos
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<InventoryIcon />}
            onClick={handleOpenInventory}
          >
            Inventario
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>NOMBRE DE LA STARTUP</TableCell>
                <TableCell>PAÍS DE ORIGEN</TableCell>
                <TableCell>NÚMERO DE EMPLEADOS</TableCell>
                <TableCell>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {startups.map((startup) => (
                <TableRow key={startup.nombre}>
                  <TableCell>{startup.nombre}</TableCell>
                  <TableCell>{startup.pais}</TableCell>
                  <TableCell>{startup.empleados}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      startIcon={<InventoryIcon />}
                      onClick={handleOpenInventory}
                      size="small"
                    >
                      Inventario
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Dialog
        open={openInventory}
        onClose={handleCloseInventory}
        maxWidth="xl"
        fullWidth
      >
        <InventoryManagement onClose={handleCloseInventory} />
      </Dialog>
    </>
  );
}

export default App; 