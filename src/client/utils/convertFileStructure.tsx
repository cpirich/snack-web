import { isEntryPoint } from './fileUtilities';
import { ExpoSnackFiles, FileSystemEntry } from '../types';

const getFolders = (path: string): string[] => {
  // TODO: change this to slice and join
  const pathSegments = path.split('/');
  if (pathSegments.length === 0) {
    return [];
  }
  const result = [];
  for (
    let pathIdx = 0;
    pathIdx < pathSegments.length - 1; // do not process the last element
    pathIdx++
  ) {
    result.push(pathSegments.slice(0, pathIdx + 1).join('/'));
  }
  return result;
};

export const snackToEntryArray = (snackFormat: ExpoSnackFiles): FileSystemEntry[] => {
  const fileSystem: FileSystemEntry[] = [];
  const foldersInFileSystem = new Set();
  for (const filename of Object.keys(snackFormat).sort()) {
    for (const folder of getFolders(filename)) {
      if (!foldersInFileSystem.has(folder)) {
        fileSystem.push({
          item: {
            path: folder,
            type: 'folder',
          },
          state: {},
        });
        foldersInFileSystem.add(folder);
      }
    }

    const isEntry = isEntryPoint(filename);

    fileSystem.push(
      snackFormat[filename].type === 'ASSET'
        ? {
            item: {
              path: filename,
              type: 'file',
              uri: snackFormat[filename].contents,
              asset: true,
            },
            state: {},
          }
        : {
            item: {
              path: filename,
              type: 'file',
              content: snackFormat[filename].contents,
            },
            state: {
              isOpen: isEntry,
              isSelected: isEntry,
              isFocused: isEntry,
            },
          }
    );
  }
  return fileSystem;
};

export const entryArrayToSnack = (entryArray: FileSystemEntry[]): ExpoSnackFiles => {
  const snackResult: ExpoSnackFiles = {};
  for (const { item } of entryArray) {
    if (item.type === 'file') {
      if (item.asset) {
        snackResult[item.path] = {
          contents: item.uri,
          type: 'ASSET', // TODO: support for different types
        };
      } else {
        snackResult[item.path] = {
          contents: item.content,
          type: 'CODE', // TODO: support for different types
        };
      }
    }
  }
  return snackResult;
};
