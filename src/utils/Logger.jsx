const isDev = import.meta.env.DEV; 
export const logger = (file, method, message, data = "") => {
  if (isDev) {
    console.trace(`[${file}][${method}] : ${message}`, data);
  }
};
