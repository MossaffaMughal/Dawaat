const DEFAULT_OPTIONS = {
  maxDimension: 1600,
  maxBytes: 3.5 * 1024 * 1024,
  quality: 0.82,
  mimeType: "image/webp",
};

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = (error) => {
      URL.revokeObjectURL(imageUrl);
      reject(error);
    };

    image.src = imageUrl;
  });

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });

export const compressImageFile = async (file, options = {}) => {
  const settings = { ...DEFAULT_OPTIONS, ...options };

  if (!file || !file.type?.startsWith("image/")) {
    return file;
  }

  if (file.size <= settings.maxBytes && file.type === settings.mimeType) {
    return file;
  }

  const image = await loadImage(file);
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;
  const scale = Math.min(
    1,
    settings.maxDimension / Math.max(originalWidth, originalHeight),
  );
  const width = Math.max(1, Math.round(originalWidth * scale));
  const height = Math.max(1, Math.round(originalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = settings.quality;
  let blob = await canvasToBlob(canvas, settings.mimeType, quality);

  while (blob && blob.size > settings.maxBytes && quality > 0.5) {
    quality = Math.max(0.5, quality - 0.12);
    blob = await canvasToBlob(canvas, settings.mimeType, quality);
  }

  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  const compressedName = `${baseName}.webp`;

  return new File([blob], compressedName, {
    type: blob.type || settings.mimeType,
    lastModified: file.lastModified,
  });
};
