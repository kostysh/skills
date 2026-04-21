#!/usr/bin/env node
import { n as package_default, t as runLauncher } from "./assets/launcher.js";
//#region src/entrypoints/backlog-engineer.ts
var io = {
	stdout: process.stdout,
	stderr: process.stderr
};
var exitCode = await runLauncher(process.argv.slice(2), io, package_default.version, "compat-backlog");
process.exitCode = exitCode;
//#endregion
