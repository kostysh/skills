import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import assert from "node:assert/strict";

import { checkCompiledSkill } from "../src/check.ts";

void test("checkCompiledSkill rejects invalid folders", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "skillforge-check-"));
  await writeFile(join(tempRoot, "SKILL.md"), "# missing frontmatter\n", "utf8");

  const result = await checkCompiledSkill(tempRoot);
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((entry) => entry.code === "missing-frontmatter"));
});
