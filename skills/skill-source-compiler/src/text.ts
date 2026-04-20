import { createHash } from "node:crypto";

/**
 * Normalizes text for duplicate detection.
 */
export const normalizeText = (input: string): string =>
  input
    .toLowerCase()
    .replace(/`+/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Computes a stable SHA-256 hash.
 */
export const sha256 = (input: string): string =>
  createHash("sha256").update(input).digest("hex");

/**
 * Detects whether a path-like string is an absolute filesystem path.
 */
export const containsAbsolutePath = (input: string): boolean => {
  const absoluteUnix = /(^|[\s"'`(])\/(?:home|Users|var|opt|tmp|etc|code|workspace|mnt)\//u;
  const absoluteWindows = /(^|[\s"'`(])(?:[A-Za-z]:\\)/u;
  return absoluteUnix.test(input) || absoluteWindows.test(input);
};
