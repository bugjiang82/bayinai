export function createImageThumbnail(src: string, maxSize = 512): Promise<string> {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;

      if (w > h) {
        if (w > maxSize) {
          h = (h * maxSize) / w;
          w = maxSize;
        }
      } else {
        if (h > maxSize) {
          w = (w * maxSize) / h;
          h = maxSize;
        }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export function generateVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = 0;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(videoUrl);
        return;
      }

      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;

      video.addEventListener(
        'seeked',
        () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnailUrl);
        },
        { once: true }
      );

      video.addEventListener(
        'error',
        () => {
          resolve(videoUrl);
        },
        { once: true }
      );
    });

    video.addEventListener(
      'error',
      () => {
        resolve(videoUrl);
      },
      { once: true }
    );
  });
}