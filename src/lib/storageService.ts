import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from './firebase';

export interface UploadProgressCallback {
  (progressPercent: number, bytesTransferred: number, totalBytes: number): void;
}

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: number;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Validates a file before upload
 */
export function validateStudyFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { 
      valid: false, 
      error: `File size exceeds the 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller file.` 
    };
  }
  // Check mime type (or fallback to extension for edge-cases)
  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt', 'doc', 'docx'];
  if (!ALLOWED_MIME_TYPES.has(file.type) && (!ext || !allowedExtensions.includes(ext))) {
    return { 
      valid: false, 
      error: `Unsupported file type (${file.type || ext}). Supported formats: PDF, Images (JPG, PNG, WebP), TXT, Word DOCX.` 
    };
  }
  return { valid: true };
}

/**
 * Uploads a document to Firebase Storage under the authenticated user's isolated folder:
 * users/{userId}/documents/{timestamp}_{sanitizedName}
 */
export async function uploadStudyDocument(
  file: File,
  folder: 'documents' | 'images' | 'math' | 'notes' = 'documents',
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication required to upload study files to Firebase Storage.');
  }

  const validation = validateStudyFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `users/${user.uid}/${folder}/${timestamp}_${sanitizedName}`;
  const storageRef = ref(storage, storagePath);

  const metadata = {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      userId: user.uid,
      userEmail: user.email || 'anonymous',
      originalName: file.name,
      uploadedAt: timestamp.toString(),
      appName: 'Study Top'
    }
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress, snapshot.bytesTransferred, snapshot.totalBytes);
        }
      },
      (error) => {
        console.error('Firebase Storage upload failed:', error);
        reject(new Error(`Storage Upload Failed: ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            uploadedAt: timestamp
          });
        } catch (err: any) {
          reject(new Error(`Failed to retrieve download URL: ${err.message}`));
        }
      }
    );
  });
}

/**
 * Deletes a file from Firebase Storage
 */
export async function deleteStudyDocument(storagePath: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required.');

  // Security check: ensure path belongs to user
  if (!storagePath.startsWith(`users/${user.uid}/`)) {
    throw new Error('Unauthorized storage deletion attempt.');
  }

  const fileRef = ref(storage, storagePath);
  await deleteObject(fileRef);
}
