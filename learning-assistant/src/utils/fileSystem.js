/**
 * File System Access API utilities for reading/writing local files
 * Works with modern browsers that support the File System Access API
 */

let projectFolderHandle = null;

// Request permission to access a folder
export const requestFolderAccess = async () => {
  try {
    const handle = await window.showDirectoryPicker();
    projectFolderHandle = handle;
    localStorage.setItem('projectFolderName', handle.name);
    return handle;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Folder access cancelled');
    } else {
      console.error('Error accessing folder:', err);
    }
    return null;
  }
};

// Get or request folder access
export const getFolderHandle = async () => {
  if (projectFolderHandle) {
    return projectFolderHandle;
  }

  // Try to restore from IndexedDB if available
  try {
    const stored = await restoreFolderHandle();
    if (stored) {
      projectFolderHandle = stored;
      return stored;
    }
  } catch (err) {
    console.log('Could not restore folder handle:', err);
  }

  // Request new access
  return await requestFolderAccess();
};

// Save folder handle to IndexedDB for persistence
export const saveFolderHandle = async (handle) => {
  if ('getFile' in handle) {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('LearningAssistant', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('handles');
      };
    });

    return new Promise((resolve, reject) => {
      const tx = db.transaction('handles', 'readwrite');
      const store = tx.objectStore('handles');
      const request = store.put(handle, 'projectFolder');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(handle);
    });
  }
};

// Restore folder handle from IndexedDB
export const restoreFolderHandle = async () => {
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('LearningAssistant', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('handles');
      };
    });

    return new Promise((resolve, reject) => {
      const tx = db.transaction('handles', 'readonly');
      const store = tx.objectStore('handles');
      const request = store.get('projectFolder');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (err) {
    return null;
  }
};

// Read a file from the folder
export const readFile = async (filename) => {
  try {
    const folderHandle = await getFolderHandle();
    if (!folderHandle) throw new Error('Folder not accessible');

    const fileHandle = await folderHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    throw err;
  }
};

// Write to a file (creates if doesn't exist, overwrites if exists)
export const writeFile = async (filename, content) => {
  try {
    const folderHandle = await getFolderHandle();
    if (!folderHandle) throw new Error('Folder not accessible');

    const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    console.log(`File ${filename} written successfully`);
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    throw err;
  }
};

// Append to a file (similar to write for now, can be optimized)
export const appendFile = async (filename, content) => {
  try {
    const folderHandle = await getFolderHandle();
    if (!folderHandle) throw new Error('Folder not accessible');

    let existing = '';
    try {
      existing = await readFile(filename);
    } catch {
      // File doesn't exist, that's okay
    }

    await writeFile(filename, existing + content);
  } catch (err) {
    console.error(`Error appending to ${filename}:`, err);
    throw err;
  }
};

// Check if a file exists
export const fileExists = async (filename) => {
  try {
    const folderHandle = await getFolderHandle();
    if (!folderHandle) return false;

    await folderHandle.getFileHandle(filename);
    return true;
  } catch {
    return false;
  }
};

// Delete a file
export const deleteFile = async (filename) => {
  try {
    const folderHandle = await getFolderHandle();
    if (!folderHandle) throw new Error('Folder not accessible');

    await folderHandle.removeEntry(filename);
    console.log(`File ${filename} deleted successfully`);
  } catch (err) {
    console.error(`Error deleting ${filename}:`, err);
    throw err;
  }
};

// List all files in the folder
export const listFiles = async () => {
  try {
    const folderHandle = await getFolderHandle();
    if (!folderHandle) return [];

    const files = [];
    for await (const handle of folderHandle.values()) {
      if (handle.kind === 'file') {
        files.push(handle.name);
      }
    }
    return files;
  } catch (err) {
    console.error('Error listing files:', err);
    return [];
  }
};
