import { ApiError, apiPostForm } from './api-client';

// The server limits uploads to one request per second. Multiple reference images
// and tool masks share this queue instead of racing and failing with HTTP 429.
let pending: Promise<unknown> = Promise.resolve();
let nextUploadAt = 0;

export function uploadImageFile(file: File): Promise<string> {
  const task = pending.then(async () => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Choose a JPG, PNG or WebP image');
    }
    if (!file.size || file.size > 10 * 1024 * 1024) {
      throw new Error('Images must be between 1 byte and 10MB');
    }
    const delay = nextUploadAt - Date.now();
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    nextUploadAt = Date.now() + 1100;
    const form = new FormData();
    form.append('files', file);
    const send = () =>
      apiPostForm<{ urls: string[] }>('/api/storage/upload-image', form);
    let result;
    try {
      result = await send();
    } catch (error) {
      // Another tab can consume the account-wide interval despite this tab's
      // queue. Retry only the explicit pre-upload rate-limit response, once.
      const wait =
        error instanceof ApiError
          ? error.message.match(/^Please retry after ([1-5])s\.$/)
          : null;
      if (!wait) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Number(wait[1]) * 1000 + 100)
      );
      nextUploadAt = Date.now() + 1100;
      result = await send();
    }
    const url = result?.urls?.[0];
    if (!url)
      throw new Error('Upload did not return an image URL. Please retry.');
    return url;
  });
  pending = task.catch(() => undefined);
  return task;
}
