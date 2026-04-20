import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Reads a UTF-8 text file.
 */
export const readTextFile = async (path: string): Promise<string> =>
  readFile(path, "utf8");

/**
 * Writes a UTF-8 text file, creating parent directories as needed.
 */
export const writeTextFile = async (path: string, content: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
};

/**
 * Removes a directory if it exists.
 */
export const removeDirectory = async (path: string): Promise<void> => {
  await rm(path, { force: true, recursive: true });
};

/**
 * Copies a single file, creating parent directories as needed.
 */
export const copyFilePortable = async (sourcePath: string, targetPath: string): Promise<void> => {
  await mkdir(dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath);
};

/**
 * Recursively walks a directory and returns relative file paths with forward slashes.
 */
export const walkFiles = async (rootDir: string, relativeDir = ""): Promise<readonly string[]> => {
  const directoryPath = join(rootDir, relativeDir);
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const relativePath = relativeDir === "" ? entry.name : `${relativeDir}/${entry.name}`;
    if (entry.isDirectory()) {
      results.push(...(await walkFiles(rootDir, relativePath)));
      continue;
    }

    if (entry.isFile()) {
      results.push(relativePath);
    }
  }

  return results.sort();
};

/**
 * Checks whether a path exists and is a file.
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    const details = await stat(path);
    return details.isFile();
  } catch {
    return false;
  }
};
