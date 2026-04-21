import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const descriptionString = nonEmptyString.max(1024);
const positiveInteger = z.number().int().positive();
const versionString = z
  .string()
  .trim()
  .regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u, "Version must be semver-like.");
const skillName = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Skill names must be lowercase kebab-case.")
  .max(64);
const relativePortablePath = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !value.startsWith("/") && !/^[A-Za-z]:\\/u.test(value), {
    message: "Path must be relative.",
  })
  .refine((value) => !value.includes("\\"), {
    message: "Use forward slashes in portable paths.",
  })
  .refine((value) => !value.split("/").some((segment) => segment === ".."), {
    message: "Path traversal is not allowed.",
  });

const supportGlob = relativePortablePath.refine(
  (value) => !value.startsWith("references/") && !value.startsWith("assets/") && !value.startsWith("scripts/"),
  {
    message: "Supporting content should not live inside active runtime directories.",
  },
);

const copiedFileSchema = z.object({
  id: nonEmptyString,
  source: relativePortablePath,
  target: relativePortablePath,
  description: nonEmptyString.optional(),
});

const referenceSchema = copiedFileSchema.extend({
  title: nonEmptyString,
  trigger: nonEmptyString,
  required: z.boolean().default(false),
});

const interopRuleSchema = z.object({
  id: nonEmptyString,
  domain: nonEmptyString,
  winner: nonEmptyString,
  rationale: nonEmptyString,
});

const workflowStageSchema = z.object({
  id: nonEmptyString,
  title: nonEmptyString,
  goal: nonEmptyString,
  steps: z.array(nonEmptyString).min(1),
  validation: z.array(nonEmptyString).default([]),
});

const gotchaSchema = z.object({
  id: nonEmptyString,
  priority: z.enum(["high", "medium", "low"]),
  text: nonEmptyString,
});

const commandSchema = z.object({
  id: nonEmptyString,
  command: nonEmptyString,
  summary: nonEmptyString,
  when: nonEmptyString,
  script: relativePortablePath.optional(),
  inputs: z.array(nonEmptyString).default([]),
  outputs: z.array(nonEmptyString).default([]),
  tests: z.array(relativePortablePath).default([]),
  examples: z.array(nonEmptyString).default([]),
});

const policySchema = z.object({
  id: nonEmptyString,
  title: nonEmptyString,
  text: nonEmptyString,
});

const portabilitySchema = z.object({
  required: z.literal(true),
  rules: z.array(nonEmptyString).min(1),
  checklist: z.array(nonEmptyString).min(1),
});

export const skillSourceSchema = z.object({
  apiVersion: z.literal("skillforge/v1alpha1"),
  kind: z.literal("SkillSource"),
  skill: z.object({
    name: skillName,
    "source-version": versionString,
    "recommended-skill-md-max-bytes": positiveInteger.default(20_000),
    description: descriptionString,
    license: nonEmptyString.optional(),
    compatibility: nonEmptyString.max(500).optional(),
    metadata: z.record(z.string(), z.string()).default({}),
    allowedTools: z.array(nonEmptyString).default([]),
  }),
  fragments: z.record(z.string(), relativePortablePath).default({}),
  references: z.array(referenceSchema).default([]),
  assets: z.array(copiedFileSchema).default([]),
  copies: z.array(copiedFileSchema).default([]),
  supporting: z.array(copiedFileSchema).default([]),
  surfaces: z.object({
    active: z.object({
      requiredReferences: z.array(nonEmptyString).default([]),
      optionalReferences: z.array(nonEmptyString).default([]),
    }),
    supportingGlobs: z.array(supportGlob).default([]),
  }),
  sections: z.object({
    startHere: z.array(nonEmptyString).min(1),
    whenToUse: z.array(nonEmptyString).min(1),
    whenNotToUse: z.array(nonEmptyString).min(1),
    workflow: z.array(workflowStageSchema).min(1),
    interop: z.array(interopRuleSchema).default([]),
    commands: z.array(commandSchema).default([]),
    gotchas: z.array(gotchaSchema).default([]),
    policies: z.array(policySchema).default([]),
    portability: portabilitySchema,
  }),
});

export type SkillSource = z.infer<typeof skillSourceSchema>;
export type SkillSourceFile = z.infer<typeof copiedFileSchema>;
export type SkillReference = z.infer<typeof referenceSchema>;
export type WorkflowStage = z.infer<typeof workflowStageSchema>;

export const compiledFrontmatterSchema = z.object({
  name: skillName,
  description: descriptionString,
  license: nonEmptyString.optional(),
  compatibility: nonEmptyString.max(500).optional(),
  metadata: z
    .object({
      "source-version": versionString,
      "skillforge-source-manifest": nonEmptyString.optional(),
      "skillforge-source-hash": nonEmptyString.optional(),
    })
    .catchall(z.string()),
  "allowed-tools": nonEmptyString.optional(),
});

export type CompiledFrontmatter = z.infer<typeof compiledFrontmatterSchema>;
