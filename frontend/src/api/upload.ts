/**
 * Upload API
 * Maneja la subida de archivos al servidor
 */

import apiClient from './client';

/**
 * Subir imagen de producto
 * @param file - Archivo de imagen a subir
 * @returns URL de la imagen subida
 */
export const uploadProductImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post<{ imageUrl: string; filename: string }>(
    '/upload/product-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  // Retornar la URL de la imagen (puede ser de Supabase o local)
  const imageUrl = response.data.imageUrl;
  
  // Si la URL ya es completa (https://...), retornarla tal cual
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Si es una ruta local, agregar el dominio del backend
  return `http://localhost:3000${imageUrl}`;
};
