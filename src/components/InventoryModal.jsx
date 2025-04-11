import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { toast } from 'react-hot-toast';

const InventoryModal = ({ isOpen, onClose, fileId }) => {
  const [inventory, setInventory] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: 1,
    status: 'disponible',
    item_name: '',
    installation_date: new Date().toISOString().split('T')[0],
    condition: 'Bueno',
    last_maintenance: null,
    notes: ''
  });

  useEffect(() => {
    if (isOpen && fileId) {
      loadInventory();
    }
  }, [isOpen, fileId]);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      toast.error('Error al cargar los elementos del inventario');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Tratamiento especial para campos de fecha
    if (name === 'last_maintenance') {
      // Si el valor está vacío, establecer como null
      if (!value) {
        if (editItem) {
          setEditItem({
            ...editItem,
            [name]: null
          });
        } else {
          setNewItem({
            ...newItem,
            [name]: null
          });
        }
        return;
      }
    }

    if (editItem) {
      setEditItem({
        ...editItem,
        [name]: value
      });
    } else {
      setNewItem({
        ...newItem,
        [name]: value
      });
    }
  };

  const handleSaveItem = async () => {
    // Validar campos requeridos
    const requiredFields = ['name', 'item_name', 'installation_date', 'condition'];
    const requiredData = editItem || newItem;
    
    for (const field of requiredFields) {
      if (!requiredData[field]) {
        toast.error(`El campo ${field} es obligatorio`);
        return;
      }
    }

    try {
      if (editItem) {
        // Actualizar item existente
        const { error } = await supabase
          .from('inventory')
          .update({
            name: editItem.name,
            description: editItem.description,
            quantity: editItem.quantity,
            status: editItem.status,
            item_name: editItem.item_name,
            installation_date: editItem.installation_date,
            condition: editItem.condition,
            last_maintenance: editItem.last_maintenance || null,
            notes: editItem.notes,
            updated_at: new Date()
          })
          .eq('id', editItem.id);

        if (error) throw error;
        toast.success('Elemento actualizado correctamente');
      } else {
        // Crear nuevo item
        const itemToInsert = {
          ...newItem,
          file_id: fileId,
          user_id: null,
          created_at: new Date()
        };

        // Asegurarse de que los valores vacíos de fecha se guarden como null
        if (itemToInsert.last_maintenance === '') {
          itemToInsert.last_maintenance = null;
        }

        const { error } = await supabase
          .from('inventory')
          .insert([itemToInsert]);

        if (error) throw error;
        toast.success('Elemento añadido correctamente');
        setNewItem({
          name: '',
          description: '',
          quantity: 1,
          status: 'disponible',
          item_name: '',
          installation_date: new Date().toISOString().split('T')[0],
          condition: 'Bueno',
          last_maintenance: null,
          notes: ''
        });
      }
      
      setEditItem(null);
      loadInventory();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar el elemento: ' + error.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Elemento eliminado correctamente');
      loadInventory();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar el elemento');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Inventario</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Formulario para añadir/editar items */}
        <div className="p-6 border-b border-gray-700 bg-gray-750">
          <h3 className="text-lg font-medium mb-4 text-white">
            {editItem ? 'Editar elemento' : 'Añadir nuevo elemento'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
              <input
                type="text"
                name="name"
                value={editItem ? editItem.name : newItem.name}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Item *</label>
              <input
                type="text"
                name="item_name"
                value={editItem ? editItem.item_name : newItem.item_name}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Cantidad *</label>
              <input
                type="number"
                name="quantity"
                value={editItem ? editItem.quantity : newItem.quantity}
                onChange={handleInputChange}
                min="0"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de instalación *</label>
              <input
                type="date"
                name="installation_date"
                value={editItem ? editItem.installation_date : newItem.installation_date}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Condición *</label>
              <select
                name="condition"
                value={editItem ? editItem.condition : newItem.condition}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
                <option value="Malo">Malo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
              <select
                name="status"
                value={editItem ? editItem.status : newItem.status}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="disponible">Disponible</option>
                <option value="agotado">Agotado</option>
                <option value="baja">Baja</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Último mantenimiento</label>
              <input
                type="date"
                name="last_maintenance"
                value={editItem ? (editItem.last_maintenance || '') : (newItem.last_maintenance || '')}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
              <textarea
                name="description"
                value={editItem ? editItem.description || '' : newItem.description}
                onChange={handleInputChange}
                rows="2"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
              <textarea
                name="notes"
                value={editItem ? editItem.notes || '' : newItem.notes}
                onChange={handleInputChange}
                rows="2"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSaveItem}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {editItem ? 'Actualizar' : 'Añadir'}
              </button>
              {editItem && (
                <button
                  onClick={() => setEditItem(null)}
                  className="ml-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">* Campos obligatorios</p>
        </div>

        {/* Lista de items */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4 text-white">Elementos ({inventory.length})</h3>
          
          {inventory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="h-12 w-12 mx-auto mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p>No hay elementos en el inventario</p>
              <p className="text-sm">Añade tu primer elemento utilizando el formulario de arriba</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nombre</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Item</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cant.</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Instalación</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Condición</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Últ. Mant.</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-white">{item.name}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-white">{item.item_name}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-white">{item.quantity}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-white">{new Date(item.installation_date).toLocaleDateString()}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-white">{item.condition}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.status === 'disponible' ? 'bg-green-100 text-green-800' : 
                          item.status === 'agotado' ? 'bg-red-100 text-red-800' : 
                          item.status === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-white">
                        {item.last_maintenance ? new Date(item.last_maintenance).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditItem(item)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                          title="Editar"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Eliminar"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryModal; 