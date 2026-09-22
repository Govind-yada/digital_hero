import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../uploads/proofs');

export const storageService = {
  async uploadWinnerProof(fileBuffer, originalName, mimeType) {
    const ext = path.extname(originalName) || '.png';
    const uniqueName = `proof_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;

    // 1. If Supabase configured, upload to Supabase Storage
    if (config.supabase.url && config.supabase.serviceRoleKey) {
      try {
        const url = `${config.supabase.url}/storage/v1/object/winner-proofs/${uniqueName}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
            'Content-Type': mimeType,
          },
          body: fileBuffer,
        });

        if (response.ok) {
          return `${config.supabase.url}/storage/v1/object/public/winner-proofs/${uniqueName}`;
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, falling back to local storage:', err.message);
      }
    }

    // 2. Safe local file system fallback
    if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
      fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
    }

    const filePath = path.join(LOCAL_UPLOADS_DIR, uniqueName);
    fs.writeFileSync(filePath, fileBuffer);

    return `/api/winners/proof-file/${uniqueName}`;
  },

  getLocalFilePath(filename) {
    const sanitized = path.basename(filename);
    const filePath = path.join(LOCAL_UPLOADS_DIR, sanitized);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  },
};
