import packageJson from "../package.json" with { type: "json" };
import { runCli, type CliIo } from "./cli/run-cli.ts";

const io: CliIo = {
	stdout: process.stdout,
	stderr: process.stderr,
};

process.exitCode = await runCli(process.argv.slice(2), io, packageJson.version);

export { runCli };
