import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Establecer una sesión fija para el usuario
const FIXED_USER_ID = '00000000-0000-0000-0000-000000000000'; // Este ID lo obtendremos de Supabase

// Función para subir archivo
export const uploadFile = async (file, companyName) => {
  try {
    // 1. Subir archivo al storage
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${FIXED_USER_ID}/files/${fileName}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('files')
      .upload(filePath, file);

    if (storageError) throw storageError;

    // 2. Crear registro en la tabla files
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .insert([{
        name: companyName,
        original_name: file.name,
        size: file.size,
        type: file.type,
        storage_path: storageData.path,
        user_id: FIXED_USER_ID
      }])
      .select()
      .single();

    if (fileError) throw fileError;

    return fileData;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Función para obtener archivos
export const getFiles = async () => {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', FIXED_USER_ID)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error getting files:', error);
    throw error;
  }
};

// Función para eliminar archivo
export const deleteFile = async (fileId, filePath) => {
  try {
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([filePath]);

    if (storageError) throw storageError;

    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', FIXED_USER_ID);

    if (dbError) throw dbError;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Función de utilidad para manejar errores
const handleError = (error, customMessage) => {
  console.error(customMessage, error);
  throw error;
};

export const getFileUrl = (path) => {
  const { data } = supabase.storage
    .from('files')
    .getPublicUrl(path);
  return data.publicUrl;
};

export default supabase;

// Funciones para el inventario
export const addInventoryItem = async (fileId, item) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        file_id: fileId,
        item_name: item.name,
        installation_date: item.installationDate,
        condition: item.condition,
        last_maintenance: item.lastMaintenance,
        notes: item.notes
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
};

export const updateInventoryItem = async (itemId, updates) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .match({ id: itemId })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
};

export const deleteInventoryItem = async (itemId) => {
  try {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .match({ id: itemId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

// Función para obtener el historial de un archivo
export const getFileHistory = async (fileId) => {
  try {
    const { data, error } = await supabase
      .from('file_history')
      .select('*')
      .match({ file_id: fileId })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching file history:', error);
    throw error;
  }
}; 