import { parseArgs } from "node:util";

import { checkCompiledSkill } from "./check.ts";
import { compileAllSourceBundles, compileSourceBundle } from "./compiler.ts";
import { SkillforgeError } from "./errors.ts";
import { lintSourceBundle } from "./lint.ts";

export interface CliIo {
  readonly stdout: Pick<NodeJS.WriteStream, "write">;
  readonly stderr: Pick<NodeJS.WriteStream, "write">;
}

const TOOL_NAME = "skill-source-compiler";
const RUNTIME_SCRIPT = "scripts/skill-source-compiler.mjs";

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const EXIT_USAGE = 2;
const EXIT_INTERNAL = 3;

type CommandName = "check" | "compile" | "compile-all" | "help" | "lint";

class CliUsageError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

const COMMANDS: Readonly<Record<Exclude<CommandName, "help">, { readonly summary: string; readonly usage: string[] }>> = {
  check: {
    summary: "Validate a compiled skill folder for frontmatter, headings, links, and portability invariants.",
    usage: [`node ${RUNTIME_SCRIPT} check <compiled-skill-dir>`],
  },
  compile: {
    summary: "Compile one source bundle into a skill folder under the provided output directory.",
    usage: [`node ${RUNTIME_SCRIPT} compile <source-dir> --out-dir <skills-dir>`],
  },
  "compile-all": {
    summary: "Compile every source bundle found directly under the provided sources root.",
    usage: [`node ${RUNTIME_SCRIPT} compile-all <sources-root> --out-dir <skills-dir>`],
  },
  lint: {
    summary: "Validate a source bundle without writing output files.",
    usage: [`node ${RUNTIME_SCRIPT} lint <source-dir>`],
  },
};

const writeLine = (stream: Pick<NodeJS.WriteStream, "write">, value = ""): void => {
  stream.write(`${value}\n`);
};

const formatDiagnostics = (
  diagnostics: readonly { code: string; level: string; message: string }[],
): string => diagnostics.map((entry) => `[${entry.level}] ${entry.code}: ${entry.message}`).join("\n");

const renderGlobalHelp = (version: string): string =>
  [
    `${TOOL_NAME} CLI v${version}`,
    "",
    "Shipped commands:",
    "  help [command]                                  Show global help or command-local help.",
    `  lint <source-dir>                               ${COMMANDS.lint.summary}`,
    `  compile <source-dir> --out-dir <skills-dir>    ${COMMANDS.compile.summary}`,
    `  compile-all <sources-root> --out-dir <skills-dir> ${COMMANDS["compile-all"].summary}`,
    `  check <compiled-skill-dir>                      ${COMMANDS.check.summary}`,
    "",
    "Exit codes:",
    "  0 success",
    "  1 command completed but found validation/runtime problems",
    "  2 usage error",
    "  3 unexpected internal failure",
    "",
    `Run \`${TOOL_NAME} help <command>\` for command-local examples.`,
  ].join("\n");

const renderCommandHelp = (command: CommandName): string => {
  if (command === "help") {
    return [
      "help - Show global help or command-local help.",
      "",
      "Usage:",
      `  node ${RUNTIME_SCRIPT} --help`,
      `  node ${RUNTIME_SCRIPT} help <command>`,
      "",
      "Supported commands:",
      ...Object.keys(COMMANDS).map((name) => `  - ${name}`),
    ].join("\n");
  }

  const details = COMMANDS[command];
  return [
    `${command} - ${details.summary}`,
    "",
    "Usage:",
    ...details.usage.map((entry) => `  ${entry}`),
    "",
    "Exit codes:",
    "  0 success",
    command === "compile" || command === "compile-all"
      ? "  1 source validation or file-system failure"
      : "  1 command found validation issues",
    "  2 usage error",
    "  3 unexpected internal failure",
  ].join("\n");
};

const toUsageError = (error: unknown): CliUsageError =>
  new CliUsageError(error instanceof Error ? error.message : String(error));

const parseOutDirArgs = (args: readonly string[]) => {
  try {
    return parseArgs({
      allowPositionals: true,
      args,
      options: {
        "out-dir": { type: "string" },
      } as const,
      strict: true,
    });
  } catch (error: unknown) {
    throw toUsageError(error);
  }
};

const isHelpFlag = (value: string | undefined): boolean => value === "-h" || value === "--help";

const resolveCommand = (rawCommand: string | undefined): CommandName | null => {
  if (rawCommand === undefined || rawCommand === "help") {
    return "help";
  }

  if (rawCommand === "lint" || rawCommand === "compile" || rawCommand === "compile-all" || rawCommand === "check") {
    return rawCommand;
  }

  return null;
};

const ensureSinglePositional = (commandName: string, positionals: readonly string[], expected: string): string => {
  if (positionals.length !== 1 || positionals[0] === undefined) {
    throw new CliUsageError(`${commandName} requires ${expected}.`);
  }

  return positionals[0];
};

export const runCli = async (
  args: readonly string[],
  io: CliIo,
  version: string,
): Promise<number> => {
  try {
    const [command, ...rest] = args;

    if (command === undefined || isHelpFlag(command)) {
      writeLine(io.stdout, renderGlobalHelp(version));
      return EXIT_SUCCESS;
    }

    if (command === "-v" || command === "--version") {
      writeLine(io.stdout, version);
      return EXIT_SUCCESS;
    }

    if (command === "help") {
      const requestedCommand = resolveCommand(rest[0]);
      if (rest.length > 1) {
        throw new CliUsageError("help accepts at most one command name.");
      }
      if (rest[0] !== undefined && requestedCommand === null) {
        throw new CliUsageError(`Unknown command: ${rest[0]}`);
      }

      writeLine(io.stdout, renderCommandHelp(requestedCommand ?? "help"));
      return EXIT_SUCCESS;
    }

    switch (command) {
      case "lint": {
        if (isHelpFlag(rest[0])) {
          writeLine(io.stdout, renderCommandHelp("lint"));
          return EXIT_SUCCESS;
        }

        const sourceDir = ensureSinglePositional("lint", rest, "<source-dir>");
        const result = await lintSourceBundle(sourceDir);
        writeLine(io.stdout, `${result.ok ? "OK" : "FAIL"} ${sourceDir}`);
        if (result.diagnostics.length > 0) {
          writeLine(io.stdout, formatDiagnostics(result.diagnostics));
        }
        return result.ok ? EXIT_SUCCESS : EXIT_FAILURE;
      }

      case "compile": {
        if (rest.some((value) => isHelpFlag(value))) {
          writeLine(io.stdout, renderCommandHelp("compile"));
          return EXIT_SUCCESS;
        }

        const parsed = parseOutDirArgs(rest);
        const sourceDir = ensureSinglePositional("compile", parsed.positionals, "<source-dir>");
        const outDir = parsed.values["out-dir"];
        if (outDir === undefined) {
          throw new CliUsageError("compile requires --out-dir <skills-dir>.");
        }

        const result = await compileSourceBundle(sourceDir, { outDir });
        writeLine(io.stdout, `Compiled ${sourceDir} -> ${result.outputDir}`);
        if (result.warnings.length > 0) {
          writeLine(io.stdout, "Warnings:");
          for (const warning of result.warnings) {
            writeLine(io.stdout, `- ${warning}`);
          }
        }
        return EXIT_SUCCESS;
      }

      case "compile-all": {
        if (rest.some((value) => isHelpFlag(value))) {
          writeLine(io.stdout, renderCommandHelp("compile-all"));
          return EXIT_SUCCESS;
        }

        const parsed = parseOutDirArgs(rest);
        const sourcesRoot = ensureSinglePositional("compile-all", parsed.positionals, "<sources-root>");
        const outDir = parsed.values["out-dir"];
        if (outDir === undefined) {
          throw new CliUsageError("compile-all requires --out-dir <skills-dir>.");
        }

        const results = await compileAllSourceBundles(sourcesRoot, { outDir });
        writeLine(io.stdout, `Compiled ${results.length} source bundle(s).`);
        for (const result of results) {
          writeLine(io.stdout, `- ${result.outputDir}`);
          if (result.warnings.length > 0) {
            writeLine(io.stdout, "  Warnings:");
            for (const warning of result.warnings) {
              writeLine(io.stdout, `  - ${warning}`);
            }
          }
        }
        return EXIT_SUCCESS;
      }

      case "check": {
        if (isHelpFlag(rest[0])) {
          writeLine(io.stdout, renderCommandHelp("check"));
          return EXIT_SUCCESS;
        }

        const skillDir = ensureSinglePositional("check", rest, "<compiled-skill-dir>");
        const result = await checkCompiledSkill(skillDir);
        writeLine(io.stdout, `${result.ok ? "OK" : "FAIL"} ${skillDir}`);
        if (result.diagnostics.length > 0) {
          writeLine(io.stdout, formatDiagnostics(result.diagnostics));
        }
        return result.ok ? EXIT_SUCCESS : EXIT_FAILURE;
      }

      default:
        throw new CliUsageError(`Unknown command: ${command}`);
    }
  } catch (error: unknown) {
    if (error instanceof CliUsageError) {
      writeLine(io.stderr, error.message);
      writeLine(io.stderr, `Run \`${TOOL_NAME} --help\` for usage.`);
      return EXIT_USAGE;
    }

    if (error instanceof SkillforgeError) {
      writeLine(io.stderr, error.message);
      return EXIT_FAILURE;
    }

    writeLine(io.stderr, error instanceof Error ? error.message : String(error));
    return EXIT_INTERNAL;
  }
};
