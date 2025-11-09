/**
 * Image Compression Utility
 * Comprime imágenes antes de subirlas para optimizar espacio en Supabase Storage
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

/**
 * Comprime una imagen manteniendo calidad aceptable
 * @param file - Archivo de imagen a comprimir
 * @param options - Opciones de compresión
 * @returns Promise con archivo comprimido
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxSizeMB = 1, // 1 MB por defecto
    maxWidthOrHeight = 1920, // Full HD por defecto
    fileType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar manteniendo aspect ratio
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width;
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height;
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto del canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convertir canvas a blob con compresión
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir la imagen'));
              return;
            }

            // Si el blob resultante es mayor al límite, reducir calidad
            if (blob.size > maxSizeMB * 1024 * 1024) {
              // Comprimir más agresivamente
              canvas.toBlob(
                (secondBlob) => {
                  if (!secondBlob) {
                    reject(new Error('Error al comprimir la imagen'));
                    return;
                  }
                  
                  const compressedFile = new File(
                    [secondBlob],
                    file.name.replace(/\.[^.]+$/, '.jpg'),
                    { type: fileType }
                  );
                  resolve(compressedFile);
                },
                fileType,
                0.7 // Calidad 70%
              );
            } else {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'),
                { type: fileType }
              );
              resolve(compressedFile);
            }
          },
          fileType,
          0.85 // Calidad 85% por defecto
        );
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Valida que el archivo sea una imagen válida
 * @param file - Archivo a validar
 * @returns true si es válido
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato no válido. Solo se permiten JPG, PNG, WEBP o PDF',
    };
  }

  // Validar tamaño máximo (5MB antes de comprimir)
  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'El archivo es demasiado grande. Máximo 5 MB',
    };
  }

  return { valid: true };
};

/**
 * Formatea el tamaño del archivo
 * @param bytes - Tamaño en bytes
 * @returns String formateado
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
