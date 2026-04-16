export const isDev =
  typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
