import imageCompression from 'browser-image-compression';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const MAX_ORIGINAL_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Valida el archivo antes de comprimirlo.
 * @param {File} file 
 */
function validateImage(file) {
  if (!file) throw new Error("No se ha seleccionado ningún archivo.");
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Formato no permitido (${file.type}). Por favor selecciona JPEG, PNG, WebP o AVIF.`);
  }

  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB > MAX_ORIGINAL_SIZE_MB) {
    throw new Error(`El archivo es demasiado grande (${fileSizeMB.toFixed(2)} MB). El máximo permitido es ${MAX_ORIGINAL_SIZE_MB} MB.`);
  }
}

/**
 * Comprime la imagen y la sube a Cloudinary usando un unsigned upload preset.
 * @param {File} file 
 * @returns {Promise<Object>} Metadata de la imagen de Cloudinary
 */
export async function uploadImageToCloudinary(file) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Variables de entorno de Cloudinary no configuradas. Verifica tu archivo .env.");
  }

  // 1. Validar
  validateImage(file);

  // 2. Comprimir
  const compressionOptions = {
    maxSizeMB: 0.5, // Menor a 500 KB
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8
  };

  let compressedFile;
  try {
    compressedFile = await imageCompression(file, compressionOptions);
  } catch (error) {
    throw new Error(`Error al comprimir la imagen: ${error.message}`);
  }

  // 3. Subir
  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || "Error desconocido del servidor de Cloudinary.");
    }

    const data = await response.json();
    
    // Retornamos únicamente la data que necesitamos en Firestore
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes
    };
  } catch (error) {
    throw new Error(`Error al subir imagen a Cloudinary: ${error.message}`);
  }
}

/**
 * Genera una URL transformada optimizada para tarjetas (16/9)
 * @param {string} originalUrl 
 * @returns {string} Transformada url
 */
export function getOptimizedCardImageUrl(originalUrl) {
  if (!originalUrl || !originalUrl.includes('cloudinary.com')) return originalUrl;
  
  // Inserta las transformaciones (f_auto,q_auto,w_800,h_450,c_fill) justo después de /upload/
  return originalUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800,h_450,c_fill/');
}
