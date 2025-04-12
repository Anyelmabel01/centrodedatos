import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { toast } from 'react-hot-toast';

const InventoryModal = ({ isOpen, onClose, fileId }) => {
  const [inventory, setInventory] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    item_name: '',
    quantity: 1,
    installation_date: new Date().toISOString().split('T')[0],
    last_maintenance: null,
    description: '',
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
        .select('id, name, item_name, quantity, installation_date, last_maintenance, description, notes, created_at')
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
    const updatedValue = name === 'last_maintenance' && !value ? null : value;

    if (editItem) {
      setEditItem(prev => ({ ...prev, [name]: updatedValue }));
    } else {
      setNewItem(prev => ({ ...prev, [name]: updatedValue }));
    }
  };

  const handleSaveItem = async () => {
    const currentItem = editItem || newItem;
    const requiredFields = ['name', 'item_name', 'installation_date'];
    
    for (const field of requiredFields) {
      if (!currentItem[field]) {
        toast.error(`El campo ${field.replace('_',' ')} es obligatorio`);
        return;
      }
    }

    try {
      const dataToSave = {
        name: currentItem.name,
        item_name: currentItem.item_name,
        quantity: currentItem.quantity,
        installation_date: currentItem.installation_date,
        last_maintenance: currentItem.last_maintenance || null,
        description: currentItem.description,
        notes: currentItem.notes,
        updated_at: new Date()
      };

      if (editItem) {
        const { error } = await supabase
          .from('inventory')
          .update(dataToSave)
          .eq('id', editItem.id);
        if (error) throw error;
        toast.success('Elemento actualizado correctamente');
      } else {
        const itemToInsert = {
          ...dataToSave,
          file_id: fileId,
          user_id: null,
          created_at: new Date()
        };
        const { error } = await supabase
          .from('inventory')
          .insert([itemToInsert]);
        if (error) throw error;
        toast.success('Elemento añadido correctamente');
        setNewItem({
          name: '',
          item_name: '',
          quantity: 1,
          installation_date: new Date().toISOString().split('T')[0],
          last_maintenance: null,
          description: '',
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
      const { error } = await supabase.from('inventory').delete().eq('id', id);
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
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Inventario</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-gray-700 bg-gray-750 flex-shrink-0">
          <h3 className="text-lg font-medium mb-4 text-white">
            {editItem ? 'Editar elemento' : 'Añadir nuevo elemento'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
              <input
                type="text" name="name" value={editItem ? editItem.name : newItem.name}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Item *</label>
              <input
                type="text" name="item_name" value={editItem ? editItem.item_name : newItem.item_name}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Cantidad *</label>
              <input
                type="number" name="quantity" value={editItem ? editItem.quantity : newItem.quantity}
                onChange={handleInputChange} min="0"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de instalación *</label>
              <input
                type="date" name="installation_date" value={editItem ? editItem.installation_date : newItem.installation_date}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Último mantenimiento</label>
              <input
                type="date"
                name="last_maintenance"
                value={editItem ? (editItem.last_maintenance || '') : (newItem.last_maintenance || '')}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
            <textarea
              name="description"
              value={editItem ? editItem.description : newItem.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
            <textarea
              name="notes"
              value={editItem ? editItem.notes : newItem.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setEditItem(null)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Cancelar Edición
            </button>
            <button
              onClick={handleSaveItem}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
            >
              {editItem ? 'Actualizar Elemento' : 'Añadir Elemento'}
            </button>
          </div>
        </div>

        <div className="p-6 overflow-auto flex-grow">
          <h3 className="text-lg font-medium mb-4 text-white">Elementos del Inventario</h3>
          <div className="overflow-x-auto rounded border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Instalación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Últ. Mant.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Notas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{item.item_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{item.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{item.installation_date}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{item.last_maintenance || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-xs" title={item.description}>{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-xs" title={item.notes}>{item.notes}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditItem(item)}
                        className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 && (
                   <tr>
                     <td colSpan="8" className="px-4 py-4 text-center text-sm text-gray-500">
                       No hay elementos en este inventario.
                     </td>
                   </tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal; 