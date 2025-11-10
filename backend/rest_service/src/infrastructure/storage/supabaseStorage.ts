import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Variables de Supabase no configuradas. Las imágenes se guardarán localmente.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Sube un archivo a Supabase Storage
 * @param file - Buffer del archivo
 * @param fileName - Nombre del archivo
 * @param bucket - Nombre del bucket (por defecto 'products')
 * @returns URL pública del archivo o null si falla
 */
export const uploadToSupabase = async (
  file: Buffer,
  fileName: string,
  bucket: string = 'products'
): Promise<string | null> => {
  try {
    // Verificar que Supabase esté configurado
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase no configurado. URL:', supabaseUrl, 'Key:', supabaseKey ? 'exists' : 'missing');
      return null;
    }

    console.log('📤 Intentando subir archivo a Supabase...');
    console.log('   Bucket:', bucket);
    console.log('   Nombre:', fileName);
    console.log('   Tamaño:', file.length, 'bytes');

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: 'image/*',
        upsert: true, // Sobrescribe si ya existe
      });

    if (error) {
      console.error('❌ Error al subir archivo a Supabase:', error.message);
      console.error('   Error completo:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log('✅ Archivo subido exitosamente:', data.path);

    // Obtener URL pública del archivo
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('🔗 URL pública generada:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('💥 Error en uploadToSupabase:', error);
    return null;
  }
};

/**
 * Elimina un archivo de Supabase Storage
 * @param filePath - Ruta del archivo en Supabase (ej: "folder/image.jpg")
 * @param bucket - Nombre del bucket
 * @returns true si se eliminó correctamente
 */
export const deleteFromSupabase = async (
  filePath: string,
  bucket: string = 'products'
): Promise<boolean> => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return false;
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error al eliminar archivo de Supabase:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en deleteFromSupabase:', error);
    return false;
  }
};

/**
 * Extrae el nombre del archivo de una URL de Supabase
 * @param url - URL completa de Supabase
 * @param bucket - Nombre del bucket (opcional, detecta automáticamente)
 * @returns Nombre del archivo o null
 */
export const extractFilePathFromUrl = (url: string, bucket?: string): string | null => {
  try {
    // Ejemplo de URL: https://xxx.supabase.co/storage/v1/object/public/products/folder/image.jpg
    // O: https://xxx.supabase.co/storage/v1/object/public/payment-receipts/orders/123/receipt.jpg
    
    if (bucket) {
      // Si se especifica el bucket, buscar específicamente
      const regex = new RegExp(`\/${bucket}\/(.+)$`);
      const match = url.match(regex);
      return match && match[1] ? match[1] : null;
    } else {
      // Detectar automáticamente (después de /public/)
      const match = url.match(/\/public\/[^\/]+\/(.+)$/);
      return match && match[1] ? match[1] : null;
    }
  } catch (error) {
    return null;
  }
};
