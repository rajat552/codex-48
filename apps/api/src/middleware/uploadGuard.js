import multer from 'multer';
import path from 'path';
import { env } from '../config/env.js';
import { UnsupportedMediaTypeError, ValidationError } from './errorHandler.js';

// Memory storage so we can validate magic bytes before committing to disk
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES
  }
});

/**
 * Validates magic bytes / file signatures to prevent disguised file attacks
 */
export function validateFileSignature(buffer, declaredMime, filename) {
  if (!buffer || buffer.length < 4) {
    throw new ValidationError('Uploaded file is empty or corrupted.');
  }

  const ext = path.extname(filename).toLowerCase();

  // PNG signature: 89 50 4E 47
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  
  // JPEG signature: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // PDF signature: 25 50 44 46 (%PDF)
  const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

  // DOCX (Zip archive): 50 4B 03 04 or 50 4B 05 06 or 50 4B 07 08
  const isDocxZip = buffer[0] === 0x50 && buffer[1] === 0x4b;

  if (ext === '.png') {
    if (!isPng) throw new UnsupportedMediaTypeError('File extension is .png but file content does not match PNG signature.');
    return 'image/png';
  } else if (ext === '.jpg' || ext === '.jpeg') {
    if (!isJpeg) throw new UnsupportedMediaTypeError('File extension is .jpg but file content does not match JPEG signature.');
    return 'image/jpeg';
  } else if (ext === '.pdf') {
    if (!isPdf) throw new UnsupportedMediaTypeError('File extension is .pdf but file content does not match PDF signature (%PDF).');
    return 'application/pdf';
  } else if (ext === '.docx') {
    if (!isDocxZip) throw new UnsupportedMediaTypeError('File extension is .docx but file content does not match DOCX/ZIP signature.');
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else {
    throw new UnsupportedMediaTypeError(`Unsupported file extension: ${ext}. Allowed: .png, .jpg, .jpeg, .pdf, .docx`);
  }
}
