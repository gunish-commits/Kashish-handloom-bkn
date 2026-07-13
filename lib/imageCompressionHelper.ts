export const convertHEICtoJPEG = async (file: File): Promise<File> => {
  if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
    try {
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      }) as Blob;
      return new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg',
      });
    } catch (err) {
      console.error('HEIC conversion failed, returning original file:', err);
      return file;
    }
  }
  return file; // Return as-is if not HEIC
};

interface CompressOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  fileType?: string;
  initialQuality?: number;
  onProgress?: (progress: number) => void;
}

export const compressImage = async (
  file: File,
  options: CompressOptions
): Promise<File> => {
  try {
    const imageCompression = (await import('browser-image-compression')).default;
    const compressionOptions = {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: true,
      fileType: options.fileType || 'image/webp',
      initialQuality: options.initialQuality || 0.82,
      onProgress: options.onProgress,
    };
    return await imageCompression(file, compressionOptions);
  } catch (err) {
    console.error('Image compression failed, returning original file:', err);
    return file;
  }
};
