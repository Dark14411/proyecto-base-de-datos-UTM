// ═══════════════════════════════════════════════════════════════
// config/supabase.js — Cliente de Supabase Storage (evidencias)
// ═══════════════════════════════════════════════════════════════
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'evidencias-incidencias';

/**
 * Sube un archivo al bucket privado de Supabase Storage.
 * @param {Buffer} fileBuffer - Contenido del archivo
 * @param {string} fileName - Nombre del archivo
 * @param {string} mimeType - Tipo MIME
 * @returns {{ url: string, path: string }}
 */
const uploadFile = async (fileBuffer, fileName, mimeType) => {
  const filePath = `incidencias/${Date.now()}_${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Error subiendo archivo: ${error.message}`);

  return {
    path: data.path,
    url: getSignedUrl(data.path),
  };
};

/**
 * Genera una URL firmada de corta vigencia (1 hora) para acceder a un archivo.
 * MongoDB solo guarda la ruta; la URL se genera bajo demanda.
 * @param {string} filePath - Ruta del archivo en el bucket
 * @returns {string}
 */
const getSignedUrl = async (filePath) => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600); // 1 hora de vigencia

  if (error) throw new Error(`Error generando URL firmada: ${error.message}`);
  return data.signedUrl;
};

/**
 * Elimina un archivo del bucket.
 * @param {string} filePath
 */
const deleteFile = async (filePath) => {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) throw new Error(`Error eliminando archivo: ${error.message}`);
};

module.exports = { supabase, uploadFile, getSignedUrl, deleteFile };
