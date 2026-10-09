const MAX_EDITOR_REFERENCE_IMAGES = 3;

export type EditorDraft = {
  prompt: string;
  imageUrls: string[];
};

export function isSafeEditorImageUrl(value: unknown, origin?: string) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value, origin);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (url.protocol === 'http:' && url.hostname !== 'localhost') return false;
    return true;
  } catch {
    return false;
  }
}

export function parseEditorDraft(
  raw: string | null,
  origin?: string
): EditorDraft {
  if (!raw) return { prompt: '', imageUrls: [] };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const prompt = typeof parsed.prompt === 'string' ? parsed.prompt : '';
    const imageUrls = Array.isArray(parsed.imageUrls)
      ? parsed.imageUrls
          .filter((value) => isSafeEditorImageUrl(value, origin))
          .slice(0, MAX_EDITOR_REFERENCE_IMAGES)
      : [];
    return { prompt, imageUrls: imageUrls as string[] };
  } catch {
    return { prompt: '', imageUrls: [] };
  }
}

const EDITOR_DRAFT_DB = 'qwenimage3-editor-draft';
const EDITOR_DRAFT_STORE = 'drafts';
const EDITOR_REFERENCE_KEY = 'reference-files';

function openEditorDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(EDITOR_DRAFT_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(EDITOR_DRAFT_STORE)) {
        request.result.createObjectStore(EDITOR_DRAFT_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEditorReferenceFiles(files: File[]) {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  const database = await openEditorDraftDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(EDITOR_DRAFT_STORE, 'readwrite');
    transaction
      .objectStore(EDITOR_DRAFT_STORE)
      .put(files.slice(0, MAX_EDITOR_REFERENCE_IMAGES), EDITOR_REFERENCE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function loadEditorReferenceFiles() {
  if (typeof window === 'undefined' || !window.indexedDB) return [] as File[];
  const database = await openEditorDraftDatabase();
  const files = await new Promise<File[]>((resolve, reject) => {
    const request = database
      .transaction(EDITOR_DRAFT_STORE, 'readonly')
      .objectStore(EDITOR_DRAFT_STORE)
      .get(EDITOR_REFERENCE_KEY);
    request.onsuccess = () =>
      resolve(Array.isArray(request.result) ? request.result.slice(0, 3) : []);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return files;
}

export async function clearEditorReferenceFiles() {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  const database = await openEditorDraftDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(EDITOR_DRAFT_STORE, 'readwrite');
    transaction.objectStore(EDITOR_DRAFT_STORE).delete(EDITOR_REFERENCE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
