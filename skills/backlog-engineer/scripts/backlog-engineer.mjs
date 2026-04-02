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
	"format": "biome format --files-ignore-unknown=true --write src test package.json tsconfig.json vite.config.ts",
	"format:check": "biome check --files-ignore-unknown=true --formatter-enabled=true --linter-enabled=false --assist-enabled=false src test package.json tsconfig.json vite.config.ts",
	"lint:biome": "biome lint --files-ignore-unknown=true --diagnostic-level=warn --error-on-warnings src test package.json tsconfig.json vite.config.ts",
	"lint:eslint": "eslint \"src/**/*.ts\" \"test/**/*.mjs\" \"vite.config.ts\"",
	"lint": "pnpm run lint:biome && pnpm run lint:eslint && pnpm run typecheck",
	"lint:fix": "biome lint --files-ignore-unknown=true --diagnostic-level=warn --error-on-warnings --write src test package.json tsconfig.json vite.config.ts && eslint --fix \"src/**/*.ts\" \"test/**/*.mjs\" \"vite.config.ts\" && pnpm run typecheck",
	"pretest": "pnpm run build",
	"test": "node --test test/*.test.mjs",
	"typecheck": "tsc --noEmit"
};
var devDependencies = {
	"@types/node": "^25.5.0",
	"typescript": "^5.9.3",
	"vite": "^8.0.3"
};
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
	devDependencies
};
//#endregion
//#region src/commands.ts
var CLI_DISPLAY_NAME = "backlog-engineer";
function writeLine$1(stream, line = "") {
	stream.write(`${line}\n`);
}
function placeholderHelp(name, summary) {
	return [
		`${CLI_DISPLAY_NAME} ${name}`,
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
function defineCommand(name, summary) {
	return {
		name,
		summary,
		helpText: () => placeholderHelp(name, summary),
		execute: (args, io) => runPlaceholderCommand(name, io, args)
	};
}
var COMMANDS = [
	defineCommand("init", "Initialize a backlog directory and utility-owned artifacts."),
	defineCommand("register-source", "Register a source document and obtain a source ID."),
	defineCommand("list-sources", "List registered sources and source metadata."),
	defineCommand("template", "Generate packet or patch templates."),
	defineCommand("packet", "Apply a packet that adds new backlog tasks."),
	defineCommand("patch-item", "Apply a patch that updates existing tasks."),
	defineCommand("remove-item", "Apply a patch that removes obsolete tasks."),
	defineCommand("refresh", "Refresh source-derived state in full or scoped form."),
	defineCommand("status", "Show short backlog status summary."),
	defineCommand("report", "Generate a human-readable backlog report on disk."),
	defineCommand("items", "Show one or more full task cards by item key."),
	defineCommand("search", "Search tasks when keys are not yet known."),
	defineCommand("gaps", "List explicit blockers and unresolved gaps."),
	defineCommand("queue", "Return ordered chains of tasks that can be taken next."),
	defineCommand("attention", "Return tasks that require review or re-checking."),
	defineCommand("delete-backlog", "Delete the backlog and its utility-owned artifacts.")
];
var COMMAND_MAP = new Map(COMMANDS.map((command) => [command.name, command]));
function findCommand(name) {
	return COMMAND_MAP.get(name);
}
async function executeCommand(command, args, io) {
	return await command.execute(args, io);
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
//#region src/cli.ts
var io = {
	stdout: process.stdout,
	stderr: process.stderr
};
function writeLine(stream, line = "") {
	stream.write(`${line}\n`);
}
async function runCli(argv, cliIo) {
	const [commandName, ...rest] = argv;
	if (!commandName || commandName === "--help" || commandName === "-h") {
		writeLine(cliIo.stdout, globalHelp());
		return 0;
	}
	if (commandName === "--version") {
		writeLine(cliIo.stdout, package_default.version);
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
			return 64;
		}
		writeLine(cliIo.stdout, command.helpText());
		return 0;
	}
	const command = findCommand(commandName);
	if (!command) {
		writeLine(cliIo.stderr, `Unknown command: ${commandName}`);
		writeLine(cliIo.stderr, "");
		writeLine(cliIo.stderr, `Run \`${CLI_DISPLAY_NAME} help\` to list available commands.`);
		return 64;
	}
	return executeCommand(command, rest, cliIo);
}
var exitCode = await runCli(process.argv.slice(2), io);
process.exitCode = exitCode;
//#endregion
export { COMMANDS, runCli };

//# sourceMappingURL=backlog-engineer.mjs.map