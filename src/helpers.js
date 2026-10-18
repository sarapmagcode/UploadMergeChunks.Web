export function validateFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/jfif', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message: 'Oops! Please choose a JPG, JPEG, JFIF, PNG, or WebP image file.'
    };
  }

  const maxSize = 250 * 1024 * 1024; // 250 MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: 'File is too large. Please choose an image smaller than 250MB.'
    };
  }

  return { isValid: true };
}
