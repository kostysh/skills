import YAML from "yaml";

import type { LoadedSourceBundle } from "./source-loader.ts";
import { sha256 } from "./text.ts";

const renderBulletList = (items: readonly string[]): string =>
  items.map((item) => `- ${item}`).join("\n");

const renderNumberedList = (items: readonly string[]): string =>
  items.map((item, index) => `${index + 1}. ${item}`).join("\n");

const renderFrontmatter = (loaded: LoadedSourceBundle): string => {
  const { source } = loaded;
  const frontmatter = {
    name: source.skill.name,
    description: source.skill.description,
    ...(source.skill.license === undefined ? {} : { license: source.skill.license }),
    ...(source.skill.compatibility === undefined ? {} : { compatibility: source.skill.compatibility }),
    metadata: {
      "source-version": source.skill["source-version"],
      ...source.skill.metadata,
      "skillforge-source-manifest": "skill.yaml",
      "skillforge-source-hash": sha256(JSON.stringify(source)),
    },
    ...(source.skill.allowedTools.length === 0
      ? {}
      : {
          "allowed-tools": source.skill.allowedTools.join(" "),
        }),
  };

  return `---\n${YAML.stringify(frontmatter).trimEnd()}\n---`;
};

const renderReferenceList = (
  loaded: LoadedSourceBundle,
  referenceIds: readonly string[],
  heading: string,
): string | null => {
  const references = referenceIds
    .map((referenceId) => loaded.source.references.find((entry) => entry.id === referenceId))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined);

  if (references.length === 0) {
    return null;
  }

  const items = references.map(
    (reference) => `- [${reference.title}](${reference.target}) — ${reference.trigger}`,
  );

  return `## ${heading}\n${items.join("\n")}`;
};

const renderCommands = (loaded: LoadedSourceBundle): string | null => {
  const { commands } = loaded.source.sections;
  if (commands.length === 0) {
    return null;
  }

  const body = commands
    .map((command) => {
      const details = [
        `**Use when:** ${command.when}`,
        `**Summary:** ${command.summary}`,
        ...(command.script === undefined ? [] : [`**Runtime script:** \`${command.script}\``]),
        ...(command.inputs.length === 0 ? [] : [`**Inputs:** ${command.inputs.join("; ")}`]),
        ...(command.outputs.length === 0 ? [] : [`**Outputs:** ${command.outputs.join("; ")}`]),
        ...(command.tests.length === 0 ? [] : [`**Tests:** ${command.tests.map((item) => `\`${item}\``).join(", ")}`]),
        ...(command.examples.length === 0 ? [] : [`**Examples:** ${command.examples.join("; ")}`]),
      ];

      return `### CLI command: \`${command.command}\`\n${details.join("\n\n")}`;
    })
    .join("\n\n");

  return `## Runnable commands\n${body}`;
};

const firstNonEmptyLine = (value: string): string | null => {
  for (const line of value.split(/\r?\n/u)) {
    if (line.trim().length > 0) {
      return line.trim();
    }
  }
  return null;
};

const overviewProvidesTopLevelHeading = (value: string): boolean =>
  /^##\s+\S/u.test(firstNonEmptyLine(value) ?? "");

/**
 * Renders the generated SKILL.md content.
 */
export const renderSkillMarkdown = (loaded: LoadedSourceBundle): string => {
  const { source, files } = loaded;
  const overview = source.fragments.overview === undefined ? null : (files.get(source.fragments.overview)?.content.trim() ?? null);
  const finalChecks =
    source.fragments.finalChecks === undefined ? null : (files.get(source.fragments.finalChecks)?.content.trim() ?? null);

  const parts = [
    renderFrontmatter(loaded),
    `# ${source.skill.name}`,
    "## Start here",
    renderNumberedList(source.sections.startHere),
    "## When to use this skill",
    renderBulletList(source.sections.whenToUse),
    "## When NOT to use this skill",
    renderBulletList(source.sections.whenNotToUse),
  ];

  if (overview !== null && overview.length > 0 && overviewProvidesTopLevelHeading(overview)) {
    parts.push(overview);
  } else if (overview !== null && overview.length > 0) {
    parts.push("## Overview", overview);
  }

  const workflow = source.sections.workflow
    .map((stage) => {
      const lines = [
        `### Workflow stage: ${stage.title}`,
        stage.goal,
        renderNumberedList(stage.steps),
      ];
      if (stage.validation.length > 0) {
        lines.push("Validation:", renderBulletList(stage.validation));
      }
      return lines.join("\n\n");
    })
    .join("\n\n");
  parts.push("## Workflow stages", workflow);

  if (source.sections.interop.length > 0) {
    const interop = source.sections.interop
      .map(
        (entry) =>
          `- **${entry.domain}:** ${entry.winner}. ${entry.rationale}`,
      )
      .join("\n");
    parts.push("## Interop priority", interop);
  }

  const commandsSection = renderCommands(loaded);
  if (commandsSection !== null) {
    parts.push(commandsSection);
  }

  if (source.sections.gotchas.length > 0) {
    const gotchas = source.sections.gotchas
      .map((entry) => `- **${entry.priority}** — ${entry.text}`)
      .join("\n");
    parts.push("## Gotchas", gotchas);
  }

  if (source.sections.policies.length > 0) {
    const policies = source.sections.policies
      .map((entry) => `### ${entry.title}\n${entry.text}`)
      .join("\n\n");
    parts.push("## Policies", policies);
  }

  const requiredReferences = renderReferenceList(
    loaded,
    source.surfaces.active.requiredReferences,
    "Required active references",
  );
  if (requiredReferences !== null) {
    parts.push(requiredReferences);
  }

  const optionalReferences = renderReferenceList(
    loaded,
    source.surfaces.active.optionalReferences,
    "Optional references",
  );
  if (optionalReferences !== null) {
    parts.push(optionalReferences);
  }

  if (source.assets.length > 0) {
    const assets = source.assets
      .map((entry) => `- \`${entry.target}\`${entry.description === undefined ? "" : ` — ${entry.description}`}`)
      .join("\n");
    parts.push("## Bundled assets", assets);
  }

  parts.push(
    "## Portability rules",
    renderBulletList(source.sections.portability.rules),
    "## Portability checklist before finishing",
    renderBulletList(source.sections.portability.checklist),
  );

  if (source.surfaces.supportingGlobs.length > 0) {
    parts.push(
      "## Supporting and historical surface",
      [
        "- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.",
        ...source.surfaces.supportingGlobs.map((item) => `- Supporting glob: \`${item}\``),
      ].join("\n"),
    );
  }

  if (finalChecks !== null && finalChecks.length > 0) {
    parts.push("## Final checks", finalChecks);
  }

  return `${parts.join("\n\n").trim()}\n`;
};

/**
 * Renders a non-normative compile report.
 */
export const renderCompileReport = (
  loaded: LoadedSourceBundle,
  warnings: readonly string[],
): string => {
  const sourceFiles = [...loaded.files.keys()].sort().map((item) => `- \`${item}\``).join("\n");
  const versionLines = [
    `- Skill source version: \`${loaded.source.skill["source-version"]}\``,
    ...(loaded.packageVersion === null ? [] : [`- CLI package version: \`${loaded.packageVersion}\``]),
  ].join("\n");
  const requiredReferences = loaded.source.references
    .filter((reference) => reference.required)
    .map((reference) => `- \`${reference.target}\``)
    .join("\n");

  const warningSection = warnings.length === 0 ? "- none" : warnings.map((item) => `- ${item}`).join("\n");

  return [
    "# Compile report",
    "Generated from `skill.yaml`.",
    "",
    "## Versions",
    versionLines,
    "",
    "## Source files",
    sourceFiles,
    "",
    "## Required references",
    requiredReferences === "" ? "- none" : requiredReferences,
    "",
    "## Warnings",
    warningSection,
    "",
    "## Notes",
    "- This document is supporting output only.",
    "- It does not override `SKILL.md`.",
  ].join("\n");
};
