import fileUpload from 'express-fileupload';

export const fileUploadMiddleware = fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  useTempFiles: false,
  abortOnLimit: true,
  limitHandler: (req, res) => {
    res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  },
});