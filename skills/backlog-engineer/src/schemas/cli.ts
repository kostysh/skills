import { z } from 'zod';

import { NonEmptyStringSchema } from './scalars.ts';

export const CommandCatalogEntrySchema = z.strictObject({
  name: NonEmptyStringSchema,
  summary: NonEmptyStringSchema,
});

export const CommandHelpOptionSchema = z.strictObject({
  flags: z.array(NonEmptyStringSchema).min(1),
  value_name: NonEmptyStringSchema.optional(),
  description: NonEmptyStringSchema,
  required: z.boolean().optional(),
  repeatable: z.boolean().optional(),
});

export const GlobalHelpOutputSchema = z.strictObject({
  cli_name: NonEmptyStringSchema,
  version: NonEmptyStringSchema,
  usage: z.array(NonEmptyStringSchema).min(1),
  commands: z.array(CommandCatalogEntrySchema).min(1),
});

export const CommandHelpOutputSchema = z.strictObject({
  cli_name: NonEmptyStringSchema,
  version: NonEmptyStringSchema,
  command: NonEmptyStringSchema,
  summary: NonEmptyStringSchema,
  usage: z.array(NonEmptyStringSchema).min(1),
  options: z.array(CommandHelpOptionSchema),
});

export const VersionOutputSchema = z.strictObject({
  cli_name: NonEmptyStringSchema,
  version: NonEmptyStringSchema,
});

export type CommandCatalogEntry = z.infer<typeof CommandCatalogEntrySchema>;
export type CommandHelpOption = z.infer<typeof CommandHelpOptionSchema>;
export type GlobalHelpOutput = z.infer<typeof GlobalHelpOutputSchema>;
export type CommandHelpOutput = z.infer<typeof CommandHelpOutputSchema>;
export type VersionOutput = z.infer<typeof VersionOutputSchema>;
