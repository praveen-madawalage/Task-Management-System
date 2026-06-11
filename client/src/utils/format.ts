export const formatBytes = (bytes?: number | null): string => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const isImageFile = (fileName: string): boolean =>
  /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(fileName);
