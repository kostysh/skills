import { resolve } from "node:path";
import YAML from "yaml";
import { z } from "zod";

import { fileExists, readTextFile } from "./fs-utils.ts";
import { SkillforgeError } from "./errors.ts";
import { skillSourceSchema, type SkillSource } from "./schema.ts";

export interface LoadedSourceFile {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly content: string;
}

export interface LoadedSourceBundle {
  readonly rootDir: string;
  readonly manifestPath: string;
  readonly packageVersion: string | null;
  readonly source: SkillSource;
  readonly files: ReadonlyMap<string, LoadedSourceFile>;
}

const packageManifestSchema = z.object({
  version: z.string().trim().min(1),
});

const collectReferencedPaths = (source: SkillSource): readonly string[] => {
  const result: string[] = ["skill.yaml"];
  result.push(...Object.values(source.fragments));

  for (const reference of source.references) {
    result.push(reference.source);
  }
  for (const asset of source.assets) {
    result.push(asset.source);
  }
  for (const copy of source.copies) {
    result.push(copy.source);
  }
  for (const supporting of source.supporting) {
    result.push(supporting.source);
  }

  return [...new Set(result)].sort();
};

/**
 * Loads and validates a source skill bundle.
 */
export const loadSourceBundle = async (rootDir: string): Promise<LoadedSourceBundle> => {
  const normalizedRootDir = resolve(rootDir);
  const manifestPath = resolve(normalizedRootDir, "skill.yaml");
  const manifestContent = await readTextFile(manifestPath).catch((error: unknown) => {
    throw new SkillforgeError(
      "missing-manifest",
      `Could not read ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  });

  const rawDocument: unknown = YAML.parse(manifestContent);
  const parsed = skillSourceSchema.safeParse(rawDocument);
  if (!parsed.success) {
    throw new SkillforgeError("invalid-source", parsed.error.message);
  }

  const source = parsed.data;
  const files = new Map<string, LoadedSourceFile>();
  for (const relativePath of collectReferencedPaths(source)) {
    const absolutePath = resolve(normalizedRootDir, relativePath);
    const content = await readTextFile(absolutePath).catch((error: unknown) => {
      throw new SkillforgeError(
        "missing-source-file",
        `Could not read ${relativePath} from ${normalizedRootDir}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
    files.set(relativePath, { absolutePath, content, relativePath });
  }

  const packageManifestPath = resolve(normalizedRootDir, "package.json");
  const hasPackageManifest = await fileExists(packageManifestPath);
  let packageVersion: string | null = null;

  if (hasPackageManifest) {
    const packageManifestContent = await readTextFile(packageManifestPath).catch((error: unknown) => {
      throw new SkillforgeError(
        "invalid-package-manifest",
        `Could not read package.json from ${normalizedRootDir}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    let rawPackageDocument: unknown;
    try {
      rawPackageDocument = JSON.parse(packageManifestContent);
    } catch (error: unknown) {
      throw new SkillforgeError(
        "invalid-package-manifest",
        `Could not parse package.json from ${normalizedRootDir}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    const parsedPackageManifest = packageManifestSchema.safeParse(rawPackageDocument);
    if (!parsedPackageManifest.success) {
      throw new SkillforgeError("invalid-package-manifest", parsedPackageManifest.error.message);
    }

    packageVersion = parsedPackageManifest.data.version;
    files.set("package.json", {
      absolutePath: packageManifestPath,
      content: packageManifestContent,
      relativePath: "package.json",
    });
  }

  return {
    files,
    manifestPath,
    packageVersion,
    rootDir: normalizedRootDir,
    source,
  };
};
