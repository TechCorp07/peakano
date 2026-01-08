/**
 * IndexedDB Storage Service for DICOM Files
 * Persists DICOM files across page refreshes using IndexedDB
 * 
 * This service stores the actual file bytes so they survive page reloads,
 * unlike blob URLs which are session-specific.
 */

const DB_NAME = 'mri-platform-dicom-storage';
const DB_VERSION = 1;
const FILES_STORE = 'dicom-files';
const STUDIES_STORE = 'studies';

interface StoredDicomFile {
    id: string;  // studyInstanceUID + index
    studyInstanceUID: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    data: ArrayBuffer;
    createdAt: string;
}

interface StoredStudy {
    studyInstanceUID: string;
    patientName: string | null;
    patientId: string | null;
    studyDate: string | null;
    studyDescription: string | null;
    modality: string;
    numberOfInstances: number;
    fileIds: string[];
    createdAt: string;
    updatedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open or create the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB not available'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('[DicomStorage] Failed to open database:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create files store with studyInstanceUID index
            if (!db.objectStoreNames.contains(FILES_STORE)) {
                const filesStore = db.createObjectStore(FILES_STORE, { keyPath: 'id' });
                filesStore.createIndex('studyInstanceUID', 'studyInstanceUID', { unique: false });
            }

            // Create studies store
            if (!db.objectStoreNames.contains(STUDIES_STORE)) {
                db.createObjectStore(STUDIES_STORE, { keyPath: 'studyInstanceUID' });
            }
        };
    });

    return dbPromise;
}

/**
 * Store a DICOM file in IndexedDB
 */
export async function storeDicomFile(
    studyInstanceUID: string,
    file: File,
    index: number
): Promise<string> {
    const db = await openDatabase();
    const fileId = `${studyInstanceUID}-file-${index}`;

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    const storedFile: StoredDicomFile = {
        id: fileId,
        studyInstanceUID,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/dicom',
        data: arrayBuffer,
        createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([FILES_STORE], 'readwrite');
        const store = transaction.objectStore(FILES_STORE);
        const request = store.put(storedFile);

        request.onsuccess = () => {
            resolve(fileId);
        };

        request.onerror = () => {
            console.error('[DicomStorage] Failed to store file:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Store a study with its metadata
 */
export async function storeStudy(study: StoredStudy): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STUDIES_STORE], 'readwrite');
        const store = transaction.objectStore(STUDIES_STORE);
        const request = store.put(study);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('[DicomStorage] Failed to store study:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Store multiple DICOM files and create a study entry
 */
export async function storeStudyWithFiles(
    studyInstanceUID: string,
    files: File[],
    metadata: Omit<StoredStudy, 'studyInstanceUID' | 'fileIds' | 'createdAt' | 'updatedAt'>
): Promise<StoredStudy> {
    // Store all files
    const fileIds: string[] = [];
    for (let i = 0; i < files.length; i++) {
        const fileId = await storeDicomFile(studyInstanceUID, files[i], i);
        fileIds.push(fileId);
    }

    // Create and store study entry
    const study: StoredStudy = {
        studyInstanceUID,
        ...metadata,
        fileIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await storeStudy(study);

    return study;
}

/**
 * Get all stored studies
 */
export async function getAllStudies(): Promise<StoredStudy[]> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STUDIES_STORE], 'readonly');
        const store = transaction.objectStore(STUDIES_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            console.error('[DicomStorage] Failed to get studies:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Get a study by its UID
 */
export async function getStudy(studyInstanceUID: string): Promise<StoredStudy | null> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STUDIES_STORE], 'readonly');
        const store = transaction.objectStore(STUDIES_STORE);
        const request = store.get(studyInstanceUID);

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = () => {
            console.error('[DicomStorage] Failed to get study:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Get files for a study and create fresh blob URLs
 * Returns an array of blob URLs that can be used with wadouri:
 */
export async function getStudyFilesAsBlobUrls(studyInstanceUID: string): Promise<string[]> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([FILES_STORE], 'readonly');
        const store = transaction.objectStore(FILES_STORE);
        const index = store.index('studyInstanceUID');
        const request = index.getAll(studyInstanceUID);

        request.onsuccess = () => {
            const files: StoredDicomFile[] = request.result || [];

            // Sort by id to maintain order
            files.sort((a, b) => a.id.localeCompare(b.id));

            // Create fresh blob URLs from the stored ArrayBuffers
            const blobUrls = files.map((file) => {
                const blob = new Blob([file.data], { type: file.mimeType });
                return URL.createObjectURL(blob);
            });

            resolve(blobUrls);
        };

        request.onerror = () => {
            console.error('[DicomStorage] Failed to get files:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Delete a study and its files
 */
export async function deleteStudy(studyInstanceUID: string): Promise<void> {
    const db = await openDatabase();

    // First, delete all files for this study
    await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([FILES_STORE], 'readwrite');
        const store = transaction.objectStore(FILES_STORE);
        const index = store.index('studyInstanceUID');
        const request = index.openCursor(studyInstanceUID);

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            } else {
                resolve();
            }
        };

        request.onerror = () => {
            reject(request.error);
        };
    });

    // Then, delete the study entry
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STUDIES_STORE], 'readwrite');
        const store = transaction.objectStore(STUDIES_STORE);
        const request = store.delete(studyInstanceUID);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('[DicomStorage] Failed to delete study:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Clear all stored data
 */
export async function clearAllData(): Promise<void> {
    const db = await openDatabase();

    await Promise.all([
        new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([FILES_STORE], 'readwrite');
            const store = transaction.objectStore(FILES_STORE);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([STUDIES_STORE], 'readwrite');
            const store = transaction.objectStore(STUDIES_STORE);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        }),
    ]);
}

/**
 * Get storage usage estimate
 */
export async function getStorageUsage(): Promise<{ used: number; quota: number } | null> {
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage || 0,
                quota: estimate.quota || 0,
            };
        } catch (e) {
            console.warn('[DicomStorage] Failed to get storage estimate:', e);
        }
    }
    return null;
}

export type { StoredStudy, StoredDicomFile };
