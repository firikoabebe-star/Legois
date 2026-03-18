import compression from 'compression';
import { Request, Response } from 'express';

// Custom compression configuration
export const compressionMiddleware = compression({
  // Only compress responses larger than 1kb
  threshold: 1024,
  
  // Compression level (1-9, 6 is default)
  level: 6,
  
  // Custom filter function
  filter: (req: Request, res: Response) => {
    // Don't compress if the request includes a cache-control: no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }

    // Don't compress already compressed responses
    const contentEncoding = res.getHeader('content-encoding');
    if (contentEncoding) {
      return false;
    }

    // Don't compress images, videos, or already compressed files
    const contentType = res.getHeader('content-type') as string;
    if (contentType) {
      const skipTypes = [
        'image/',
        'video/',
        'audio/',
        'application/zip',
        'application/gzip',
        'application/x-rar-compressed',
        'application/pdf',
      ];
      
      if (skipTypes.some(type => contentType.startsWith(type))) {
        return false;
      }
    }

    // Use compression's default filter for everything else
    return compression.filter(req, res);
  },
  
  // Custom memory level (1-9, 8 is default)
  memLevel: 8,
  
  // Custom window bits (9-15, 15 is default)
  windowBits: 15,
});