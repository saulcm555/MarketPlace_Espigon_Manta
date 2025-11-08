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

  // Retornar la URL completa de la imagen
  return `http://localhost:3000${response.data.imageUrl}`;
};
