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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Inventario</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h3 className="text-lg font-medium mb-4 text-gray-700">
            {editItem ? 'Editar elemento' : 'Añadir nuevo elemento'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="label">Nombre *</label>
              <input
                type="text" name="name" value={editItem ? editItem.name : newItem.name}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Nombre del Item *</label>
              <input
                type="text" name="item_name" value={editItem ? editItem.item_name : newItem.item_name}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Cantidad *</label>
              <input
                type="number" name="quantity" value={editItem ? editItem.quantity : newItem.quantity}
                onChange={handleInputChange} min="0"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Fecha de instalación *</label>
              <input
                type="date" name="installation_date" value={editItem ? editItem.installation_date : newItem.installation_date}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Último mantenimiento</label>
              <input
                type="date"
                name="last_maintenance"
                value={editItem ? (editItem.last_maintenance || '') : (newItem.last_maintenance || '')}
                onChange={handleInputChange}
                className="input"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="label">Descripción</label>
            <textarea
              name="description"
              value={editItem ? editItem.description : newItem.description}
              onChange={handleInputChange}
              rows="2"
              className="input"
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="label">Notas</label>
            <textarea
              name="notes"
              value={editItem ? editItem.notes : newItem.notes}
              onChange={handleInputChange}
              rows="2"
              className="input"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setEditItem(null)}
              className="btn btn-secondary"
            >
              Cancelar Edición
            </button>
            <button
              type="button"
              onClick={handleSaveItem}
              className="btn btn-primary"
            >
              {editItem ? 'Actualizar Elemento' : 'Añadir Elemento'}
            </button>
          </div>
        </div>

        <div className="p-5 overflow-auto flex-grow">
          <h3 className="text-lg font-medium mb-4 text-gray-700">Elementos del Inventario</h3>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Instalación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Últ. Mant.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Notas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.item_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.installation_date}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.last_maintenance || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs" title={item.description}>{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs" title={item.notes}>{item.notes}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditItem(item)}
                        className="text-primary-600 hover:text-primary-800 mr-3 transition-colors font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-800 transition-colors font-medium"
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