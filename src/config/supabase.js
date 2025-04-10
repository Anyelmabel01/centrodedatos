import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Añadir opciones adicionales para la conexión
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    fetch: fetch.bind(globalThis)
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

export const getFileUrl = (path) => {
  const { data } = supabase.storage
    .from('files')
    .getPublicUrl(path);
  return data.publicUrl;
};

export default supabase;
