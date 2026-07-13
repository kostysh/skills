import { createHash } from 'node:crypto';

/**
 * Normalizes text for duplicate detection.
 */
export const normalizeText = (input: string): string =>
  input.toLowerCase().replace(/`+/g, '').replace(/\s+/g, ' ').trim();

/**
 * Computes a stable SHA-256 hash.
 */
export const sha256 = (input: string): string => createHash('sha256').update(input).digest('hex');

/**
 * Detects whether a path-like string is an absolute filesystem path.
 */
export const containsAbsolutePath = (input: string): boolean => {
  const withoutFencedExamples = input.replace(
    /(^|\n)(?:```|~~~)[^\n]*\n[\s\S]*?\n(?:```|~~~)(?=\n|$)/gu,
    '$1',
  );
  const knownInlineRoute =
    /(^|["'{:\s])\/(?:_next|api|auth|blog|coupon|dashboard|docs|feed|path|photo|photos|rest|shop|sitemap|users|v\d+)(?:\/[^\s",}]+)+/u;
  const withoutInlineRouteExamples = withoutFencedExamples
    .split('\n')
    .map((line) =>
      line.replace(/`([^`\n]+)`/gu, (inlineCode, content: string) =>
        knownInlineRoute.test(content) ? '' : inlineCode,
      ),
    )
    .join('\n');
  const withoutUrls = withoutInlineRouteExamples.replace(/\b(?:file|https?):\/\/[^\s)>'"`]+/gu, '');
  const withoutRouteDeclarations = withoutUrls.replace(
    /^\s*(?:baseUrl|pathname|route|slug):\s*\/[^\s#]+.*$/gmu,
    '',
  );
  const withoutWebRouteLiterals = withoutRouteDeclarations.replace(
    /(["'`])\/(?:api|v\d+)(?:\/[^"'`\s)]*)?\1/gu,
    '',
  );
  const withoutHttpRoutes = withoutWebRouteLiterals.replace(
    /\b(?:DELETE|GET|HEAD|OPTIONS|PATCH|POST|PUT)\s+\/(?!\/)[^\s`),;]+/gu,
    '',
  );
  const absolutePosix = /(^|[\s"'`(=:[,{])\/(?!\/)[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)+/u;
  const absoluteWindowsDrive = /(^|[\s"'`(=:[,{])[A-Za-z]:[\\/][^\s"'`)>,;]+/u;
  const absoluteWindowsUnc = /(^|[\s"'`(=:[,{])\\\\[^\\/\s]{2,}[\\/][^\s"'`)>,;]+/u;

  return (
    absolutePosix.test(withoutHttpRoutes) ||
    absoluteWindowsDrive.test(withoutHttpRoutes) ||
    absoluteWindowsUnc.test(withoutHttpRoutes)
  );
};
