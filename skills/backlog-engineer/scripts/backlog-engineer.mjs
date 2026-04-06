#!/usr/bin/env node
//#region package.json
var name = "@kostysh/backlog-engineer-cli";
var version = "0.1.0";
var description = "CLI utilities for the backlog-engineer skill.";
var type = "module";
var bin = { "backlog-engineer": "scripts/backlog-engineer.mjs" };
var exports = { ".": "./scripts/backlog-engineer.mjs" };
var files = ["scripts"];
var engines = { "node": ">=22.22.0" };
var scripts = {
	"build": "vite build && chmod +x scripts/backlog-engineer.mjs",
	"format": "biome format --files-ignore-unknown=true --write src test package.json tsconfig.json vite.config.ts biome.json",
	"format:check": "biome check --files-ignore-unknown=true --formatter-enabled=true --linter-enabled=false --assist-enabled=false src test package.json tsconfig.json vite.config.ts biome.json",
	"lint:biome": "biome lint --files-ignore-unknown=true --diagnostic-level=warn --error-on-warnings src test package.json tsconfig.json vite.config.ts biome.json",
	"lint:eslint": "eslint \"src/**/*.ts\" \"test/**/*.ts\" \"vite.config.ts\"",
	"lint": "pnpm run lint:biome && pnpm run lint:eslint && pnpm run typecheck",
	"lint:fix": "biome lint --files-ignore-unknown=true --diagnostic-level=warn --error-on-warnings --write src test package.json tsconfig.json vite.config.ts biome.json && eslint --fix \"src/**/*.ts\" \"test/**/*.ts\" \"vite.config.ts\" && pnpm run typecheck",
	"pretest": "pnpm run build",
	"test": "node --experimental-strip-types --test test/*.test.ts",
	"typecheck": "tsc --noEmit"
};
var devDependencies = {
	"@types/node": "^25.5.0",
	"typescript": "^5.9.3",
	"vite": "^8.0.3"
};
var dependencies = { "zod": "^4.3.6" };
var package_default = {
	name,
	version,
	"private": true,
	description,
	type,
	bin,
	exports,
	files,
	engines,
	scripts,
	devDependencies,
	dependencies
};
//#endregion
//#region src/commands/placeholder.ts
function writeLine$1(stream, line = "") {
	stream.write(`${line}\n`);
}
function placeholderHelp(name, summary) {
	return [
		`backlog-engineer ${name}`,
		"",
		summary,
		"",
		"Status: scaffolded command, behavior not implemented yet."
	].join("\n");
}
function runPlaceholderCommand(commandName, io, args) {
	writeLine$1(io.stderr, `Command \`${commandName}\` is scaffolded but not implemented yet.`);
	if (args.length > 0) writeLine$1(io.stderr, `Received args: ${args.join(" ")}`);
	writeLine$1(io.stderr, "Use `backlog-engineer help` to inspect the planned command surface.");
	return 3;
}
function definePlaceholderCommand(name, summary) {
	return {
		name,
		summary,
		helpText: () => placeholderHelp(name, summary),
		execute: (args, io) => runPlaceholderCommand(name, io, args)
	};
}
//#endregion
//#region src/commands/attention.ts
var ATTENTION_COMMAND = definePlaceholderCommand("attention", "Return tasks that require review or re-checking.");
//#endregion
//#region src/commands/delete-backlog.ts
var DELETE_BACKLOG_COMMAND = definePlaceholderCommand("delete-backlog", "Delete the backlog and its utility-owned artifacts.");
//#endregion
//#region src/commands/gaps.ts
var GAPS_COMMAND = definePlaceholderCommand("gaps", "List explicit blockers and unresolved gaps.");
//#endregion
//#region src/commands/init.ts
var INIT_COMMAND = definePlaceholderCommand("init", "Initialize a backlog directory and utility-owned artifacts.");
//#endregion
//#region src/commands/items.ts
var ITEMS_COMMAND = definePlaceholderCommand("items", "Show one or more full task cards by item key.");
//#endregion
//#region src/commands/list-sources.ts
var LIST_SOURCES_COMMAND = definePlaceholderCommand("list-sources", "List registered sources and source metadata.");
//#endregion
//#region src/commands/packet.ts
var PACKET_COMMAND = definePlaceholderCommand("packet", "Apply a packet that adds new backlog tasks.");
//#endregion
//#region src/commands/patch-item.ts
var PATCH_ITEM_COMMAND = definePlaceholderCommand("patch-item", "Apply a patch that updates existing tasks.");
//#endregion
//#region src/commands/queue.ts
var QUEUE_COMMAND = definePlaceholderCommand("queue", "Return ordered chains of tasks that can be taken next.");
//#endregion
//#region src/commands/refresh.ts
var REFRESH_COMMAND = definePlaceholderCommand("refresh", "Refresh source-derived state in full or scoped form.");
//#endregion
//#region src/commands/register-source.ts
var REGISTER_SOURCE_COMMAND = definePlaceholderCommand("register-source", "Register a source document and obtain a source ID.");
//#endregion
//#region src/commands/remove-item.ts
var REMOVE_ITEM_COMMAND = definePlaceholderCommand("remove-item", "Apply a patch that removes obsolete tasks.");
//#endregion
//#region src/commands/report.ts
var REPORT_COMMAND = definePlaceholderCommand("report", "Generate a human-readable backlog report on disk.");
//#endregion
//#region src/commands/search.ts
var SEARCH_COMMAND = definePlaceholderCommand("search", "Search tasks when keys are not yet known.");
//#endregion
//#region src/commands/status.ts
var STATUS_COMMAND = definePlaceholderCommand("status", "Show short backlog status summary.");
//#endregion
//#region src/commands/template.ts
var TEMPLATE_COMMAND = definePlaceholderCommand("template", "Generate packet or patch templates.");
//#endregion
//#region src/commands/index.ts
async function executeCommand(command, args, io) {
	return await command.execute(args, io);
}
//#endregion
//#region src/cli/command-registry.ts
var CLI_DISPLAY_NAME = "backlog-engineer";
var COMMANDS = [
	INIT_COMMAND,
	REGISTER_SOURCE_COMMAND,
	LIST_SOURCES_COMMAND,
	TEMPLATE_COMMAND,
	PACKET_COMMAND,
	PATCH_ITEM_COMMAND,
	REMOVE_ITEM_COMMAND,
	REFRESH_COMMAND,
	STATUS_COMMAND,
	REPORT_COMMAND,
	ITEMS_COMMAND,
	SEARCH_COMMAND,
	GAPS_COMMAND,
	QUEUE_COMMAND,
	ATTENTION_COMMAND,
	DELETE_BACKLOG_COMMAND
];
var COMMAND_MAP = new Map(COMMANDS.map((command) => [command.name, command]));
function findCommand(name) {
	return COMMAND_MAP.get(name);
}
function globalHelp() {
	const lines = [
		`${CLI_DISPLAY_NAME}`,
		"",
		"Scaffolded CLI for the backlog-engineer skill.",
		"The command surface exists, but command behavior is still to be implemented.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} <command> [options]`,
		`  ${CLI_DISPLAY_NAME} help [command]`,
		`  ${CLI_DISPLAY_NAME} --version`,
		"",
		"Commands:"
	];
	for (const command of COMMANDS) lines.push(`  ${command.name.padEnd(16)} ${command.summary}`);
	return lines.join("\n");
}
//#endregion
//#region src/cli/run-cli.ts
function writeLine(stream, line = "") {
	stream.write(`${line}\n`);
}
async function runCli(argv, cliIo, version) {
	const [commandName, ...rest] = argv;
	if (!commandName || commandName === "--help" || commandName === "-h") {
		writeLine(cliIo.stdout, globalHelp());
		return 0;
	}
	if (commandName === "--version") {
		writeLine(cliIo.stdout, version);
		return 0;
	}
	if (commandName === "help") {
		const helpTarget = rest[0];
		if (!helpTarget) {
			writeLine(cliIo.stdout, globalHelp());
			return 0;
		}
		const command = findCommand(helpTarget);
		if (!command) {
			writeLine(cliIo.stderr, `Unknown command: ${helpTarget}`);
			writeLine(cliIo.stderr, globalHelp());
			return 2;
		}
		writeLine(cliIo.stdout, command.helpText());
		return 0;
	}
	const command = findCommand(commandName);
	if (!command) {
		writeLine(cliIo.stderr, `Unknown command: ${commandName}`);
		writeLine(cliIo.stderr, "");
		writeLine(cliIo.stderr, `Run \`${CLI_DISPLAY_NAME} help\` to list available commands.`);
		return 2;
	}
	return await executeCommand(command, rest, cliIo);
}
//#endregion
//#region src/cli.ts
var io = {
	stdout: process.stdout,
	stderr: process.stderr
};
var exitCode = await runCli(process.argv.slice(2), io, package_default.version);
process.exitCode = exitCode;
//#endregion
export { runCli };

//# sourceMappingURL=backlog-engineer.mjs.map