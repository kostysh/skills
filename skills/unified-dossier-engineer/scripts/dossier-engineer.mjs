#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { constants, promises } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import crypto from "node:crypto";
import fs from "node:fs/promises";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region package.json
var name = "@kostysh/unified-dossier-engineer";
var version$1 = "0.2.0";
var description = "Unified CLI runtime for the merged dossier/backlog skill.";
var type = "module";
var bin = { "dossier-engineer": "scripts/dossier-engineer.mjs" };
var exports = { ".": "./scripts/dossier-engineer.mjs" };
var files = ["scripts"];
var engines = { "node": ">=22.22.0" };
var scripts = {
	"build": "vite build && node -e \"const fs=require('node:fs');const path=require('node:path');for(const name of fs.readdirSync('scripts')){if(!name.endsWith('.mjs')) continue; const filePath=path.join('scripts', name); const source=fs.readFileSync(filePath, 'utf8'); fs.writeFileSync(filePath, source.replace(/[ \\t]+$/gm, ''));}\" && chmod +x scripts/*.mjs",
	"format": "biome format --files-ignore-unknown=true --write src test package.json tsconfig.json vite.config.ts",
	"format:check": "biome check --files-ignore-unknown=true --formatter-enabled=true --linter-enabled=false --assist-enabled=false src test package.json tsconfig.json vite.config.ts",
	"lint:biome": "biome lint --files-ignore-unknown=true --diagnostic-level=warn --error-on-warnings src test package.json tsconfig.json vite.config.ts",
	"lint:eslint": "eslint \"src/**/*.ts\" \"test/**/*.ts\" \"vite.config.ts\"",
	"lint": "pnpm run lint:biome && pnpm run lint:eslint && pnpm run typecheck",
	"lint:fix": "biome lint --files-ignore-unknown=true --diagnostic-level=warn --error-on-warnings --write src test package.json tsconfig.json vite.config.ts && eslint --fix \"src/**/*.ts\" \"test/**/*.ts\" \"vite.config.ts\" && pnpm run typecheck",
	"pretest": "pnpm run build",
	"test": "node --experimental-strip-types --test test/*.test.ts",
	"typecheck": "tsc --noEmit"
};
var dependencies = {
	"yaml": "^2.8.1",
	"zod": "^4.3.6"
};
var devDependencies = {
	"@types/node": "^25.5.0",
	"typescript": "^5.9.3",
	"vite": "^8.0.3"
};
var package_default = {
	name,
	version: version$1,
	"private": true,
	description,
	type,
	bin,
	exports,
	files,
	engines,
	scripts,
	dependencies,
	devDependencies
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/nodes/identity.js
var ALIAS = Symbol.for("yaml.alias");
var DOC = Symbol.for("yaml.document");
var MAP = Symbol.for("yaml.map");
var PAIR = Symbol.for("yaml.pair");
var SCALAR$1 = Symbol.for("yaml.scalar");
var SEQ = Symbol.for("yaml.seq");
var NODE_TYPE = Symbol.for("yaml.node.type");
var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
var isScalar$1 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR$1;
var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
function isCollection$1(node) {
	if (node && typeof node === "object") switch (node[NODE_TYPE]) {
		case MAP:
		case SEQ: return true;
	}
	return false;
}
function isNode(node) {
	if (node && typeof node === "object") switch (node[NODE_TYPE]) {
		case ALIAS:
		case MAP:
		case SCALAR$1:
		case SEQ: return true;
	}
	return false;
}
var hasAnchor = (node) => (isScalar$1(node) || isCollection$1(node)) && !!node.anchor;
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/visit.js
var BREAK$1 = Symbol("break visit");
var SKIP$1 = Symbol("skip children");
var REMOVE$1 = Symbol("remove node");
/**
* Apply a visitor to an AST node or document.
*
* Walks through the tree (depth-first) starting from `node`, calling a
* `visitor` function with three arguments:
*   - `key`: For sequence values and map `Pair`, the node's index in the
*     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
*     `null` for the root node.
*   - `node`: The current node.
*   - `path`: The ancestry of the current node.
*
* The return value of the visitor may be used to control the traversal:
*   - `undefined` (default): Do nothing and continue
*   - `visit.SKIP`: Do not visit the children of this node, continue with next
*     sibling
*   - `visit.BREAK`: Terminate traversal completely
*   - `visit.REMOVE`: Remove the current node, then continue with the next one
*   - `Node`: Replace the current node, then continue by visiting it
*   - `number`: While iterating the items of a sequence or map, set the index
*     of the next step. This is useful especially if the index of the current
*     node has changed.
*
* If `visitor` is a single function, it will be called with all values
* encountered in the tree, including e.g. `null` values. Alternatively,
* separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
* `Alias` and `Scalar` node. To define the same visitor function for more than
* one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
* and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
* specific defined one will be used for each node.
*/
function visit$1(node, visitor) {
	const visitor_ = initVisitor(visitor);
	if (isDocument(node)) {
		if (visit_(null, node.contents, visitor_, Object.freeze([node])) === REMOVE$1) node.contents = null;
	} else visit_(null, node, visitor_, Object.freeze([]));
}
/** Terminate visit traversal completely */
visit$1.BREAK = BREAK$1;
/** Do not visit the children of the current node */
visit$1.SKIP = SKIP$1;
/** Remove the current node */
visit$1.REMOVE = REMOVE$1;
function visit_(key, node, visitor, path) {
	const ctrl = callVisitor(key, node, visitor, path);
	if (isNode(ctrl) || isPair(ctrl)) {
		replaceNode(key, path, ctrl);
		return visit_(key, ctrl, visitor, path);
	}
	if (typeof ctrl !== "symbol") {
		if (isCollection$1(node)) {
			path = Object.freeze(path.concat(node));
			for (let i = 0; i < node.items.length; ++i) {
				const ci = visit_(i, node.items[i], visitor, path);
				if (typeof ci === "number") i = ci - 1;
				else if (ci === BREAK$1) return BREAK$1;
				else if (ci === REMOVE$1) {
					node.items.splice(i, 1);
					i -= 1;
				}
			}
		} else if (isPair(node)) {
			path = Object.freeze(path.concat(node));
			const ck = visit_("key", node.key, visitor, path);
			if (ck === BREAK$1) return BREAK$1;
			else if (ck === REMOVE$1) node.key = null;
			const cv = visit_("value", node.value, visitor, path);
			if (cv === BREAK$1) return BREAK$1;
			else if (cv === REMOVE$1) node.value = null;
		}
	}
	return ctrl;
}
/**
* Apply an async visitor to an AST node or document.
*
* Walks through the tree (depth-first) starting from `node`, calling a
* `visitor` function with three arguments:
*   - `key`: For sequence values and map `Pair`, the node's index in the
*     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
*     `null` for the root node.
*   - `node`: The current node.
*   - `path`: The ancestry of the current node.
*
* The return value of the visitor may be used to control the traversal:
*   - `Promise`: Must resolve to one of the following values
*   - `undefined` (default): Do nothing and continue
*   - `visit.SKIP`: Do not visit the children of this node, continue with next
*     sibling
*   - `visit.BREAK`: Terminate traversal completely
*   - `visit.REMOVE`: Remove the current node, then continue with the next one
*   - `Node`: Replace the current node, then continue by visiting it
*   - `number`: While iterating the items of a sequence or map, set the index
*     of the next step. This is useful especially if the index of the current
*     node has changed.
*
* If `visitor` is a single function, it will be called with all values
* encountered in the tree, including e.g. `null` values. Alternatively,
* separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
* `Alias` and `Scalar` node. To define the same visitor function for more than
* one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
* and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
* specific defined one will be used for each node.
*/
async function visitAsync(node, visitor) {
	const visitor_ = initVisitor(visitor);
	if (isDocument(node)) {
		if (await visitAsync_(null, node.contents, visitor_, Object.freeze([node])) === REMOVE$1) node.contents = null;
	} else await visitAsync_(null, node, visitor_, Object.freeze([]));
}
/** Terminate visit traversal completely */
visitAsync.BREAK = BREAK$1;
/** Do not visit the children of the current node */
visitAsync.SKIP = SKIP$1;
/** Remove the current node */
visitAsync.REMOVE = REMOVE$1;
async function visitAsync_(key, node, visitor, path) {
	const ctrl = await callVisitor(key, node, visitor, path);
	if (isNode(ctrl) || isPair(ctrl)) {
		replaceNode(key, path, ctrl);
		return visitAsync_(key, ctrl, visitor, path);
	}
	if (typeof ctrl !== "symbol") {
		if (isCollection$1(node)) {
			path = Object.freeze(path.concat(node));
			for (let i = 0; i < node.items.length; ++i) {
				const ci = await visitAsync_(i, node.items[i], visitor, path);
				if (typeof ci === "number") i = ci - 1;
				else if (ci === BREAK$1) return BREAK$1;
				else if (ci === REMOVE$1) {
					node.items.splice(i, 1);
					i -= 1;
				}
			}
		} else if (isPair(node)) {
			path = Object.freeze(path.concat(node));
			const ck = await visitAsync_("key", node.key, visitor, path);
			if (ck === BREAK$1) return BREAK$1;
			else if (ck === REMOVE$1) node.key = null;
			const cv = await visitAsync_("value", node.value, visitor, path);
			if (cv === BREAK$1) return BREAK$1;
			else if (cv === REMOVE$1) node.value = null;
		}
	}
	return ctrl;
}
function initVisitor(visitor) {
	if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) return Object.assign({
		Alias: visitor.Node,
		Map: visitor.Node,
		Scalar: visitor.Node,
		Seq: visitor.Node
	}, visitor.Value && {
		Map: visitor.Value,
		Scalar: visitor.Value,
		Seq: visitor.Value
	}, visitor.Collection && {
		Map: visitor.Collection,
		Seq: visitor.Collection
	}, visitor);
	return visitor;
}
function callVisitor(key, node, visitor, path) {
	if (typeof visitor === "function") return visitor(key, node, path);
	if (isMap(node)) return visitor.Map?.(key, node, path);
	if (isSeq(node)) return visitor.Seq?.(key, node, path);
	if (isPair(node)) return visitor.Pair?.(key, node, path);
	if (isScalar$1(node)) return visitor.Scalar?.(key, node, path);
	if (isAlias(node)) return visitor.Alias?.(key, node, path);
}
function replaceNode(key, path, node) {
	const parent = path[path.length - 1];
	if (isCollection$1(parent)) parent.items[key] = node;
	else if (isPair(parent)) if (key === "key") parent.key = node;
	else parent.value = node;
	else if (isDocument(parent)) parent.contents = node;
	else {
		const pt = isAlias(parent) ? "alias" : "scalar";
		throw new Error(`Cannot replace node with ${pt} parent`);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/doc/directives.js
var escapeChars = {
	"!": "%21",
	",": "%2C",
	"[": "%5B",
	"]": "%5D",
	"{": "%7B",
	"}": "%7D"
};
var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
var Directives = class Directives {
	constructor(yaml, tags) {
		/**
		* The directives-end/doc-start marker `---`. If `null`, a marker may still be
		* included in the document's stringified representation.
		*/
		this.docStart = null;
		/** The doc-end marker `...`.  */
		this.docEnd = false;
		this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
		this.tags = Object.assign({}, Directives.defaultTags, tags);
	}
	clone() {
		const copy = new Directives(this.yaml, this.tags);
		copy.docStart = this.docStart;
		return copy;
	}
	/**
	* During parsing, get a Directives instance for the current document and
	* update the stream state according to the current version's spec.
	*/
	atDocument() {
		const res = new Directives(this.yaml, this.tags);
		switch (this.yaml.version) {
			case "1.1":
				this.atNextDocument = true;
				break;
			case "1.2":
				this.atNextDocument = false;
				this.yaml = {
					explicit: Directives.defaultYaml.explicit,
					version: "1.2"
				};
				this.tags = Object.assign({}, Directives.defaultTags);
				break;
		}
		return res;
	}
	/**
	* @param onError - May be called even if the action was successful
	* @returns `true` on success
	*/
	add(line, onError) {
		if (this.atNextDocument) {
			this.yaml = {
				explicit: Directives.defaultYaml.explicit,
				version: "1.1"
			};
			this.tags = Object.assign({}, Directives.defaultTags);
			this.atNextDocument = false;
		}
		const parts = line.trim().split(/[ \t]+/);
		const name = parts.shift();
		switch (name) {
			case "%TAG": {
				if (parts.length !== 2) {
					onError(0, "%TAG directive should contain exactly two parts");
					if (parts.length < 2) return false;
				}
				const [handle, prefix] = parts;
				this.tags[handle] = prefix;
				return true;
			}
			case "%YAML": {
				this.yaml.explicit = true;
				if (parts.length !== 1) {
					onError(0, "%YAML directive should contain exactly one part");
					return false;
				}
				const [version] = parts;
				if (version === "1.1" || version === "1.2") {
					this.yaml.version = version;
					return true;
				} else {
					const isValid = /^\d+\.\d+$/.test(version);
					onError(6, `Unsupported YAML version ${version}`, isValid);
					return false;
				}
			}
			default:
				onError(0, `Unknown directive ${name}`, true);
				return false;
		}
	}
	/**
	* Resolves a tag, matching handles to those defined in %TAG directives.
	*
	* @returns Resolved tag, which may also be the non-specific tag `'!'` or a
	*   `'!local'` tag, or `null` if unresolvable.
	*/
	tagName(source, onError) {
		if (source === "!") return "!";
		if (source[0] !== "!") {
			onError(`Not a valid tag: ${source}`);
			return null;
		}
		if (source[1] === "<") {
			const verbatim = source.slice(2, -1);
			if (verbatim === "!" || verbatim === "!!") {
				onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
				return null;
			}
			if (source[source.length - 1] !== ">") onError("Verbatim tags must end with a >");
			return verbatim;
		}
		const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
		if (!suffix) onError(`The ${source} tag has no suffix`);
		const prefix = this.tags[handle];
		if (prefix) try {
			return prefix + decodeURIComponent(suffix);
		} catch (error) {
			onError(String(error));
			return null;
		}
		if (handle === "!") return source;
		onError(`Could not resolve tag: ${source}`);
		return null;
	}
	/**
	* Given a fully resolved tag, returns its printable string form,
	* taking into account current tag prefixes and defaults.
	*/
	tagString(tag) {
		for (const [handle, prefix] of Object.entries(this.tags)) if (tag.startsWith(prefix)) return handle + escapeTagName(tag.substring(prefix.length));
		return tag[0] === "!" ? tag : `!<${tag}>`;
	}
	toString(doc) {
		const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
		const tagEntries = Object.entries(this.tags);
		let tagNames;
		if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
			const tags = {};
			visit$1(doc.contents, (_key, node) => {
				if (isNode(node) && node.tag) tags[node.tag] = true;
			});
			tagNames = Object.keys(tags);
		} else tagNames = [];
		for (const [handle, prefix] of tagEntries) {
			if (handle === "!!" && prefix === "tag:yaml.org,2002:") continue;
			if (!doc || tagNames.some((tn) => tn.startsWith(prefix))) lines.push(`%TAG ${handle} ${prefix}`);
		}
		return lines.join("\n");
	}
};
Directives.defaultYaml = {
	explicit: false,
	version: "1.2"
};
Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/doc/anchors.js
/**
* Verify that the input string is a valid anchor.
*
* Will throw on errors.
*/
function anchorIsValid(anchor) {
	if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
		const msg = `Anchor must not contain whitespace or control characters: ${JSON.stringify(anchor)}`;
		throw new Error(msg);
	}
	return true;
}
function anchorNames(root) {
	const anchors = /* @__PURE__ */ new Set();
	visit$1(root, { Value(_key, node) {
		if (node.anchor) anchors.add(node.anchor);
	} });
	return anchors;
}
/** Find a new anchor name with the given `prefix` and a one-indexed suffix. */
function findNewAnchor(prefix, exclude) {
	for (let i = 1;; ++i) {
		const name = `${prefix}${i}`;
		if (!exclude.has(name)) return name;
	}
}
function createNodeAnchors(doc, prefix) {
	const aliasObjects = [];
	const sourceObjects = /* @__PURE__ */ new Map();
	let prevAnchors = null;
	return {
		onAnchor: (source) => {
			aliasObjects.push(source);
			prevAnchors ?? (prevAnchors = anchorNames(doc));
			const anchor = findNewAnchor(prefix, prevAnchors);
			prevAnchors.add(anchor);
			return anchor;
		},
		setAnchors: () => {
			for (const source of aliasObjects) {
				const ref = sourceObjects.get(source);
				if (typeof ref === "object" && ref.anchor && (isScalar$1(ref.node) || isCollection$1(ref.node))) ref.node.anchor = ref.anchor;
				else {
					const error = /* @__PURE__ */ new Error("Failed to resolve repeated object (this should not happen)");
					error.source = source;
					throw error;
				}
			}
		},
		sourceObjects
	};
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/doc/applyReviver.js
/**
* Applies the JSON.parse reviver algorithm as defined in the ECMA-262 spec,
* in section 24.5.1.1 "Runtime Semantics: InternalizeJSONProperty" of the
* 2021 edition: https://tc39.es/ecma262/#sec-json.parse
*
* Includes extensions for handling Map and Set objects.
*/
function applyReviver(reviver, obj, key, val) {
	if (val && typeof val === "object") if (Array.isArray(val)) for (let i = 0, len = val.length; i < len; ++i) {
		const v0 = val[i];
		const v1 = applyReviver(reviver, val, String(i), v0);
		if (v1 === void 0) delete val[i];
		else if (v1 !== v0) val[i] = v1;
	}
	else if (val instanceof Map) for (const k of Array.from(val.keys())) {
		const v0 = val.get(k);
		const v1 = applyReviver(reviver, val, k, v0);
		if (v1 === void 0) val.delete(k);
		else if (v1 !== v0) val.set(k, v1);
	}
	else if (val instanceof Set) for (const v0 of Array.from(val)) {
		const v1 = applyReviver(reviver, val, v0, v0);
		if (v1 === void 0) val.delete(v0);
		else if (v1 !== v0) {
			val.delete(v0);
			val.add(v1);
		}
	}
	else for (const [k, v0] of Object.entries(val)) {
		const v1 = applyReviver(reviver, val, k, v0);
		if (v1 === void 0) delete val[k];
		else if (v1 !== v0) val[k] = v1;
	}
	return reviver.call(obj, key, val);
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/nodes/toJS.js
/**
* Recursively convert any node or its contents to native JavaScript
*
* @param value - The input value
* @param arg - If `value` defines a `toJSON()` method, use this
*   as its first argument
* @param ctx - Conversion context, originally set in Document#toJS(). If
*   `{ keep: true }` is not set, output should be suitable for JSON
*   stringification.
*/
function toJS(value, arg, ctx) {
	if (Array.isArray(value)) return value.map((v, i) => toJS(v, String(i), ctx));
	if (value && typeof value.toJSON === "function") {
		if (!ctx || !hasAnchor(value)) return value.toJSON(arg, ctx);
		const data = {
			aliasCount: 0,
			count: 1,
			res: void 0
		};
		ctx.anchors.set(value, data);
		ctx.onCreate = (res) => {
			data.res = res;
			delete ctx.onCreate;
		};
		const res = value.toJSON(arg, ctx);
		if (ctx.onCreate) ctx.onCreate(res);
		return res;
	}
	if (typeof value === "bigint" && !ctx?.keep) return Number(value);
	return value;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/nodes/Node.js
var NodeBase = class {
	constructor(type) {
		Object.defineProperty(this, NODE_TYPE, { value: type });
	}
	/** Create a copy of this node.  */
	clone() {
		const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
		if (this.range) copy.range = this.range.slice();
		return copy;
	}
	/** A plain JavaScript representation of this node. */
	toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
		if (!isDocument(doc)) throw new TypeError("A document argument is required");
		const ctx = {
			anchors: /* @__PURE__ */ new Map(),
			doc,
			keep: true,
			mapAsMap: mapAsMap === true,
			mapKeyWarned: false,
			maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
		};
		const res = toJS(this, "", ctx);
		if (typeof onAnchor === "function") for (const { count, res } of ctx.anchors.values()) onAnchor(res, count);
		return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/nodes/Alias.js
var Alias = class extends NodeBase {
	constructor(source) {
		super(ALIAS);
		this.source = source;
		Object.defineProperty(this, "tag", { set() {
			throw new Error("Alias nodes cannot have tags");
		} });
	}
	/**
	* Resolve the value of this alias within `doc`, finding the last
	* instance of the `source` anchor before this node.
	*/
	resolve(doc, ctx) {
		let nodes;
		if (ctx?.aliasResolveCache) nodes = ctx.aliasResolveCache;
		else {
			nodes = [];
			visit$1(doc, { Node: (_key, node) => {
				if (isAlias(node) || hasAnchor(node)) nodes.push(node);
			} });
			if (ctx) ctx.aliasResolveCache = nodes;
		}
		let found = void 0;
		for (const node of nodes) {
			if (node === this) break;
			if (node.anchor === this.source) found = node;
		}
		return found;
	}
	toJSON(_arg, ctx) {
		if (!ctx) return { source: this.source };
		const { anchors, doc, maxAliasCount } = ctx;
		const source = this.resolve(doc, ctx);
		if (!source) {
			const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
			throw new ReferenceError(msg);
		}
		let data = anchors.get(source);
		if (!data) {
			toJS(source, null, ctx);
			data = anchors.get(source);
		}
		/* istanbul ignore if */
		if (data?.res === void 0) throw new ReferenceError("This should not happen: Alias anchor was not resolved?");
		if (maxAliasCount >= 0) {
			data.count += 1;
			if (data.aliasCount === 0) data.aliasCount = getAliasCount(doc, source, anchors);
			if (data.count * data.aliasCount > maxAliasCount) throw new ReferenceError("Excessive alias count indicates a resource exhaustion attack");
		}
		return data.res;
	}
	toString(ctx, _onComment, _onChompKeep) {
		const src = `*${this.source}`;
		if (ctx) {
			anchorIsValid(this.source);
			if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
				const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
				throw new Error(msg);
			}
			if (ctx.implicitKey) return `${src} `;
		}
		return src;
	}
};
function getAliasCount(doc, node, anchors) {
	if (isAlias(node)) {
		const source = node.resolve(doc);
		const anchor = anchors && source && anchors.get(source);
		return anchor ? anchor.count * anchor.aliasCount : 0;
	} else if (isCollection$1(node)) {
		let count = 0;
		for (const item of node.items) {
			const c = getAliasCount(doc, item, anchors);
			if (c > count) count = c;
		}
		return count;
	} else if (isPair(node)) {
		const kc = getAliasCount(doc, node.key, anchors);
		const vc = getAliasCount(doc, node.value, anchors);
		return Math.max(kc, vc);
	}
	return 1;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/nodes/Scalar.js
var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
var Scalar = class extends NodeBase {
	constructor(value) {
		super(SCALAR$1);
		this.value = value;
	}
	toJSON(arg, ctx) {
		return ctx?.keep ? this.value : toJS(this.value, arg, ctx);
	}
	toString() {
		return String(this.value);
	}
};
Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
Scalar.PLAIN = "PLAIN";
Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/doc/createNode.js
var defaultTagPrefix = "tag:yaml.org,2002:";
function findTagObject(value, tagName, tags) {
	if (tagName) {
		const match = tags.filter((t) => t.tag === tagName);
		const tagObj = match.find((t) => !t.format) ?? match[0];
		if (!tagObj) throw new Error(`Tag ${tagName} not found`);
		return tagObj;
	}
	return tags.find((t) => t.identify?.(value) && !t.format);
}
function createNode(value, tagName, ctx) {
	if (isDocument(value)) value = value.contents;
	if (isNode(value)) return value;
	if (isPair(value)) {
		const map = ctx.schema[MAP].createNode?.(ctx.schema, null, ctx);
		map.items.push(value);
		return map;
	}
	if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) value = value.valueOf();
	const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
	let ref = void 0;
	if (aliasDuplicateObjects && value && typeof value === "object") {
		ref = sourceObjects.get(value);
		if (ref) {
			ref.anchor ?? (ref.anchor = onAnchor(value));
			return new Alias(ref.anchor);
		} else {
			ref = {
				anchor: null,
				node: null
			};
			sourceObjects.set(value, ref);
		}
	}
	if (tagName?.startsWith("!!")) tagName = defaultTagPrefix + tagName.slice(2);
	let tagObj = findTagObject(value, tagName, schema.tags);
	if (!tagObj) {
		if (value && typeof value.toJSON === "function") value = value.toJSON();
		if (!value || typeof value !== "object") {
			const node = new Scalar(value);
			if (ref) ref.node = node;
			return node;
		}
		tagObj = value instanceof Map ? schema[MAP] : Symbol.iterator in Object(value) ? schema[SEQ] : schema[MAP];
	}
	if (onTagObj) {
		onTagObj(tagObj);
		delete ctx.onTagObj;
	}
	const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar(value);
	if (tagName) node.tag = tagName;
	else if (!tagObj.default) node.tag = tagObj.tag;
	if (ref) ref.node = node;
	return node;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/nodes/Collection.js
function collectionFromPath(schema, path, value) {
	let v = value;
	for (let i = path.length - 1; i >= 0; --i) {
		const k = path[i];
		if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
			const a = [];
			a[k] = v;
			v = a;
		} else v = new Map([[k, v]]);
	}
	return createNode(v, void 0, {
		aliasDuplicateObjects: false,
		keepUndefined: false,
		onAnchor: () => {
			throw new Error("This should not happen, please report a bug.");
		},
		schema,
		sourceObjects: /* @__PURE__ */ new Map()
	});
}
var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
var Collection = class extends NodeBase {
	constructor(type, schema) {
		super(type);
		Object.defineProperty(this, "schema", {
			value: schema,
			configurable: true,
			enumerable: false,
			writable: true
		});
	}
	/**
	* Create a copy of this collection.
	*
	* @param schema - If defined, overwrites the original's schema
	*/
	clone(schema) {
		const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
		if (schema) copy.schema = schema;
		copy.items = copy.items.map((it) => isNode(it) || isPair(it) ? it.clone(schema) : it);
		if (this.range) copy.range = this.range.slice();
		return copy;
	}
	/**
	* Adds a value to the collection. For `!!map` and `!!omap` the value must
	* be a Pair instance or a `{ key, value }` object, which may not have a key
	* that already exists in the map.
	*/
	addIn(path, value) {
		if (isEmptyPath(path)) this.add(value);
		else {
			const [key, ...rest] = path;
			const node = this.get(key, true);
			if (isCollection$1(node)) node.addIn(rest, value);
			else if (node === void 0 && this.schema) this.set(key, collectionFromPath(this.schema, rest, value));
			else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
		}
	}
	/**
	* Removes a value from the collection.
	* @returns `true` if the item was found and removed.
	*/
	deleteIn(path) {
		const [key, ...rest] = path;
		if (rest.length === 0) return this.delete(key);
		const node = this.get(key, true);
		if (isCollection$1(node)) return node.deleteIn(rest);
		else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
	}
	/**
	* Returns item at `key`, or `undefined` if not found. By default unwraps
	* scalar values from their surrounding node; to disable set `keepScalar` to
	* `true` (collections are always returned intact).
	*/
	getIn(path, keepScalar) {
		const [key, ...rest] = path;
		const node = this.get(key, true);
		if (rest.length === 0) return !keepScalar && isScalar$1(node) ? node.value : node;
		else return isCollection$1(node) ? node.getIn(rest, keepScalar) : void 0;
	}
	hasAllNullValues(allowScalar) {
		return this.items.every((node) => {
			if (!isPair(node)) return false;
			const n = node.value;
			return n == null || allowScalar && isScalar$1(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
		});
	}
	/**
	* Checks if the collection includes a value with the key `key`.
	*/
	hasIn(path) {
		const [key, ...rest] = path;
		if (rest.length === 0) return this.has(key);
		const node = this.get(key, true);
		return isCollection$1(node) ? node.hasIn(rest) : false;
	}
	/**
	* Sets a value in this collection. For `!!set`, `value` needs to be a
	* boolean to add/remove the item from the set.
	*/
	setIn(path, value) {
		const [key, ...rest] = path;
		if (rest.length === 0) this.set(key, value);
		else {
			const node = this.get(key, true);
			if (isCollection$1(node)) node.setIn(rest, value);
			else if (node === void 0 && this.schema) this.set(key, collectionFromPath(this.schema, rest, value));
			else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/stringify/stringifyComment.js
/**
* Stringifies a comment.
*
* Empty comment lines are left empty,
* lines consisting of a single space are replaced by `#`,
* and all other lines are prefixed with a `#`.
*/
var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
function indentComment(comment, indent) {
	if (/^\n+$/.test(comment)) return comment.substring(1);
	return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
}
var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/stringify/foldFlowLines.js
var FOLD_FLOW = "flow";
var FOLD_BLOCK = "block";
var FOLD_QUOTED = "quoted";
/**
* Tries to keep input at up to `lineWidth` characters, splitting only on spaces
* not followed by newlines or spaces unless `mode` is `'quoted'`. Lines are
* terminated with `\n` and started with `indent`.
*/
function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
	if (!lineWidth || lineWidth < 0) return text;
	if (lineWidth < minContentWidth) minContentWidth = 0;
	const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
	if (text.length <= endStep) return text;
	const folds = [];
	const escapedFolds = {};
	let end = lineWidth - indent.length;
	if (typeof indentAtStart === "number") if (indentAtStart > lineWidth - Math.max(2, minContentWidth)) folds.push(0);
	else end = lineWidth - indentAtStart;
	let split = void 0;
	let prev = void 0;
	let overflow = false;
	let i = -1;
	let escStart = -1;
	let escEnd = -1;
	if (mode === "block") {
		i = consumeMoreIndentedLines(text, i, indent.length);
		if (i !== -1) end = i + endStep;
	}
	for (let ch; ch = text[i += 1];) {
		if (mode === "quoted" && ch === "\\") {
			escStart = i;
			switch (text[i + 1]) {
				case "x":
					i += 3;
					break;
				case "u":
					i += 5;
					break;
				case "U":
					i += 9;
					break;
				default: i += 1;
			}
			escEnd = i;
		}
		if (ch === "\n") {
			if (mode === "block") i = consumeMoreIndentedLines(text, i, indent.length);
			end = i + indent.length + endStep;
			split = void 0;
		} else {
			if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
				const next = text[i + 1];
				if (next && next !== " " && next !== "\n" && next !== "	") split = i;
			}
			if (i >= end) if (split) {
				folds.push(split);
				end = split + endStep;
				split = void 0;
			} else if (mode === "quoted") {
				while (prev === " " || prev === "	") {
					prev = ch;
					ch = text[i += 1];
					overflow = true;
				}
				const j = i > escEnd + 1 ? i - 2 : escStart - 1;
				if (escapedFolds[j]) return text;
				folds.push(j);
				escapedFolds[j] = true;
				end = j + endStep;
				split = void 0;
			} else overflow = true;
		}
		prev = ch;
	}
	if (overflow && onOverflow) onOverflow();
	if (folds.length === 0) return text;
	if (onFold) onFold();
	let res = text.slice(0, folds[0]);
	for (let i = 0; i < folds.length; ++i) {
		const fold = folds[i];
		const end = folds[i + 1] || text.length;
		if (fold === 0) res = `\n${indent}${text.slice(0, end)}`;
		else {
			if (mode === "quoted" && escapedFolds[fold]) res += `${text[fold]}\\`;
			res += `\n${indent}${text.slice(fold + 1, end)}`;
		}
	}
	return res;
}
/**
* Presumes `i + 1` is at the start of a line
* @returns index of last newline in more-indented block
*/
function consumeMoreIndentedLines(text, i, indent) {
	let end = i;
	let start = i + 1;
	let ch = text[start];
	while (ch === " " || ch === "	") if (i < start + indent) ch = text[++i];
	else {
		do
			ch = text[++i];
		while (ch && ch !== "\n");
		end = i;
		start = i + 1;
		ch = text[start];
	}
	return end;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/stringify/stringifyString.js
var getFoldOptions = (ctx, isBlock) => ({
	indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
	lineWidth: ctx.options.lineWidth,
	minContentWidth: ctx.options.minContentWidth
});
var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
function lineLengthOverLimit(str, lineWidth, indentLength) {
	if (!lineWidth || lineWidth < 0) return false;
	const limit = lineWidth - indentLength;
	const strLen = str.length;
	if (strLen <= limit) return false;
	for (let i = 0, start = 0; i < strLen; ++i) if (str[i] === "\n") {
		if (i - start > limit) return true;
		start = i + 1;
		if (strLen - start <= limit) return false;
	}
	return true;
}
function doubleQuotedString(value, ctx) {
	const json = JSON.stringify(value);
	if (ctx.options.doubleQuotedAsJSON) return json;
	const { implicitKey } = ctx;
	const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
	const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
	let str = "";
	let start = 0;
	for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
		if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
			str += json.slice(start, i) + "\\ ";
			i += 1;
			start = i;
			ch = "\\";
		}
		if (ch === "\\") switch (json[i + 1]) {
			case "u":
				{
					str += json.slice(start, i);
					const code = json.substr(i + 2, 4);
					switch (code) {
						case "0000":
							str += "\\0";
							break;
						case "0007":
							str += "\\a";
							break;
						case "000b":
							str += "\\v";
							break;
						case "001b":
							str += "\\e";
							break;
						case "0085":
							str += "\\N";
							break;
						case "00a0":
							str += "\\_";
							break;
						case "2028":
							str += "\\L";
							break;
						case "2029":
							str += "\\P";
							break;
						default: if (code.substr(0, 2) === "00") str += "\\x" + code.substr(2);
						else str += json.substr(i, 6);
					}
					i += 5;
					start = i + 1;
				}
				break;
			case "n":
				if (implicitKey || json[i + 2] === "\"" || json.length < minMultiLineLength) i += 1;
				else {
					str += json.slice(start, i) + "\n\n";
					while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== "\"") {
						str += "\n";
						i += 2;
					}
					str += indent;
					if (json[i + 2] === " ") str += "\\";
					i += 1;
					start = i + 1;
				}
				break;
			default: i += 1;
		}
	}
	str = start ? str + json.slice(start) : json;
	return implicitKey ? str : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx, false));
}
function singleQuotedString(value, ctx) {
	if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value)) return doubleQuotedString(value, ctx);
	const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
	const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`) + "'";
	return ctx.implicitKey ? res : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function quotedString(value, ctx) {
	const { singleQuote } = ctx.options;
	let qs;
	if (singleQuote === false) qs = doubleQuotedString;
	else {
		const hasDouble = value.includes("\"");
		const hasSingle = value.includes("'");
		if (hasDouble && !hasSingle) qs = singleQuotedString;
		else if (hasSingle && !hasDouble) qs = doubleQuotedString;
		else qs = singleQuote ? singleQuotedString : doubleQuotedString;
	}
	return qs(value, ctx);
}
var blockEndNewlines;
try {
	blockEndNewlines = /* @__PURE__ */ new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
} catch {
	blockEndNewlines = /\n+(?!\n|$)/g;
}
function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
	const { blockQuote, commentString, lineWidth } = ctx.options;
	if (!blockQuote || /\n[\t ]+$/.test(value)) return quotedString(value, ctx);
	const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
	const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.BLOCK_FOLDED ? false : type === Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
	if (!value) return literal ? "|\n" : ">\n";
	let chomp;
	let endStart;
	for (endStart = value.length; endStart > 0; --endStart) {
		const ch = value[endStart - 1];
		if (ch !== "\n" && ch !== "	" && ch !== " ") break;
	}
	let end = value.substring(endStart);
	const endNlPos = end.indexOf("\n");
	if (endNlPos === -1) chomp = "-";
	else if (value === end || endNlPos !== end.length - 1) {
		chomp = "+";
		if (onChompKeep) onChompKeep();
	} else chomp = "";
	if (end) {
		value = value.slice(0, -end.length);
		if (end[end.length - 1] === "\n") end = end.slice(0, -1);
		end = end.replace(blockEndNewlines, `$&${indent}`);
	}
	let startWithSpace = false;
	let startEnd;
	let startNlPos = -1;
	for (startEnd = 0; startEnd < value.length; ++startEnd) {
		const ch = value[startEnd];
		if (ch === " ") startWithSpace = true;
		else if (ch === "\n") startNlPos = startEnd;
		else break;
	}
	let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
	if (start) {
		value = value.substring(start.length);
		start = start.replace(/\n+/g, `$&${indent}`);
	}
	let header = (startWithSpace ? indent ? "2" : "1" : "") + chomp;
	if (comment) {
		header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
		if (onComment) onComment();
	}
	if (!literal) {
		const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
		let literalFallback = false;
		const foldOptions = getFoldOptions(ctx, true);
		if (blockQuote !== "folded" && type !== Scalar.BLOCK_FOLDED) foldOptions.onOverflow = () => {
			literalFallback = true;
		};
		const body = foldFlowLines(`${start}${foldedValue}${end}`, indent, FOLD_BLOCK, foldOptions);
		if (!literalFallback) return `>${header}\n${indent}${body}`;
	}
	value = value.replace(/\n+/g, `$&${indent}`);
	return `|${header}\n${indent}${start}${value}${end}`;
}
function plainString(item, ctx, onComment, onChompKeep) {
	const { type, value } = item;
	const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
	if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) return quotedString(value, ctx);
	if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
	if (!implicitKey && !inFlow && type !== Scalar.PLAIN && value.includes("\n")) return blockString(item, ctx, onComment, onChompKeep);
	if (containsDocumentMarker(value)) {
		if (indent === "") {
			ctx.forceBlockIndent = true;
			return blockString(item, ctx, onComment, onChompKeep);
		} else if (implicitKey && indent === indentStep) return quotedString(value, ctx);
	}
	const str = value.replace(/\n+/g, `$&\n${indent}`);
	if (actualString) {
		const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
		const { compat, tags } = ctx.doc.schema;
		if (tags.some(test) || compat?.some(test)) return quotedString(value, ctx);
	}
	return implicitKey ? str : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function stringifyString(item, ctx, onComment, onChompKeep) {
	const { implicitKey, inFlow } = ctx;
	const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
	let { type } = item;
	if (type !== Scalar.QUOTE_DOUBLE) {
		if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value)) type = Scalar.QUOTE_DOUBLE;
	}
	const _stringify = (_type) => {
		switch (_type) {
			case Scalar.BLOCK_FOLDED:
			case Scalar.BLOCK_LITERAL: return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
			case Scalar.QUOTE_DOUBLE: return doubleQuotedString(ss.value, ctx);
			case Scalar.QUOTE_SINGLE: return singleQuotedString(ss.value, ctx);
			case Scalar.PLAIN: return plainString(ss, ctx, onComment, onChompKeep);
			default: return null;
		}
	};
	let res = _stringify(type);
	if (res === null) {
		const { defaultKeyType, defaultStringType } = ctx.options;
		const t = implicitKey && defaultKeyType || defaultStringType;
		res = _stringify(t);
		if (res === null) throw new Error(`Unsupported default string type ${t}`);
	}
	return res;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/stringify/stringify.js
function createStringifyContext(doc, options) {
	const opt = Object.assign({
		blockQuote: true,
		commentString: stringifyComment,
		defaultKeyType: null,
		defaultStringType: "PLAIN",
		directives: null,
		doubleQuotedAsJSON: false,
		doubleQuotedMinMultiLineLength: 40,
		falseStr: "false",
		flowCollectionPadding: true,
		indentSeq: true,
		lineWidth: 80,
		minContentWidth: 20,
		nullStr: "null",
		simpleKeys: false,
		singleQuote: null,
		trailingComma: false,
		trueStr: "true",
		verifyAliasOrder: true
	}, doc.schema.toStringOptions, options);
	let inFlow;
	switch (opt.collectionStyle) {
		case "block":
			inFlow = false;
			break;
		case "flow":
			inFlow = true;
			break;
		default: inFlow = null;
	}
	return {
		anchors: /* @__PURE__ */ new Set(),
		doc,
		flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
		indent: "",
		indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
		inFlow,
		options: opt
	};
}
function getTagObject(tags, item) {
	if (item.tag) {
		const match = tags.filter((t) => t.tag === item.tag);
		if (match.length > 0) return match.find((t) => t.format === item.format) ?? match[0];
	}
	let tagObj = void 0;
	let obj;
	if (isScalar$1(item)) {
		obj = item.value;
		let match = tags.filter((t) => t.identify?.(obj));
		if (match.length > 1) {
			const testMatch = match.filter((t) => t.test);
			if (testMatch.length > 0) match = testMatch;
		}
		tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
	} else {
		obj = item;
		tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
	}
	if (!tagObj) {
		const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
		throw new Error(`Tag not resolved for ${name} value`);
	}
	return tagObj;
}
function stringifyProps(node, tagObj, { anchors, doc }) {
	if (!doc.directives) return "";
	const props = [];
	const anchor = (isScalar$1(node) || isCollection$1(node)) && node.anchor;
	if (anchor && anchorIsValid(anchor)) {
		anchors.add(anchor);
		props.push(`&${anchor}`);
	}
	const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
	if (tag) props.push(doc.directives.tagString(tag));
	return props.join(" ");
}
function stringify$2(item, ctx, onComment, onChompKeep) {
	if (isPair(item)) return item.toString(ctx, onComment, onChompKeep);
	if (isAlias(item)) {
		if (ctx.doc.directives) return item.toString(ctx);
		if (ctx.resolvedAliases?.has(item)) throw new TypeError(`Cannot stringify circular structure without alias nodes`);
		else {
			if (ctx.resolvedAliases) ctx.resolvedAliases.add(item);
			else ctx.resolvedAliases = new Set([item]);
			item = item.resolve(ctx.doc);
		}
	}
	let tagObj = void 0;
	const node = isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
	tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
	const props = stringifyProps(node, tagObj, ctx);
	if (props.length > 0) ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
	const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : isScalar$1(node) ? stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
	if (!props) return str;
	return isScalar$1(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}\n${ctx.indent}${str}`;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/stringify/stringifyPair.js
function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
	const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
	let keyComment = isNode(key) && key.comment || null;
	if (simpleKeys) {
		if (keyComment) throw new Error("With simple keys, key nodes cannot have comments");
		if (isCollection$1(key) || !isNode(key) && typeof key === "object") throw new Error("With simple keys, collection cannot be used as a key value");
	}
	let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || isCollection$1(key) || (isScalar$1(key) ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL : typeof key === "object"));
	ctx = Object.assign({}, ctx, {
		allNullValues: false,
		implicitKey: !explicitKey && (simpleKeys || !allNullValues),
		indent: indent + indentStep
	});
	let keyCommentDone = false;
	let chompKeep = false;
	let str = stringify$2(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
	if (!explicitKey && !ctx.inFlow && str.length > 1024) {
		if (simpleKeys) throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
		explicitKey = true;
	}
	if (ctx.inFlow) {
		if (allNullValues || value == null) {
			if (keyCommentDone && onComment) onComment();
			return str === "" ? "?" : explicitKey ? `? ${str}` : str;
		}
	} else if (allNullValues && !simpleKeys || value == null && explicitKey) {
		str = `? ${str}`;
		if (keyComment && !keyCommentDone) str += lineComment(str, ctx.indent, commentString(keyComment));
		else if (chompKeep && onChompKeep) onChompKeep();
		return str;
	}
	if (keyCommentDone) keyComment = null;
	if (explicitKey) {
		if (keyComment) str += lineComment(str, ctx.indent, commentString(keyComment));
		str = `? ${str}\n${indent}:`;
	} else {
		str = `${str}:`;
		if (keyComment) str += lineComment(str, ctx.indent, commentString(keyComment));
	}
	let vsb, vcb, valueComment;
	if (isNode(value)) {
		vsb = !!value.spaceBefore;
		vcb = value.commentBefore;
		valueComment = value.comment;
	} else {
		vsb = false;
		vcb = null;
		valueComment = null;
		if (value && typeof value === "object") value = doc.createNode(value);
	}
	ctx.implicitKey = false;
	if (!explicitKey && !keyComment && isScalar$1(value)) ctx.indentAtStart = str.length + 1;
	chompKeep = false;
	if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && isSeq(value) && !value.flow && !value.tag && !value.anchor) ctx.indent = ctx.indent.substring(2);
	let valueCommentDone = false;
	const valueStr = stringify$2(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
	let ws = " ";
	if (keyComment || vsb || vcb) {
		ws = vsb ? "\n" : "";
		if (vcb) {
			const cs = commentString(vcb);
			ws += `\n${indentComment(cs, ctx.indent)}`;
		}
		if (valueStr === "" && !ctx.inFlow) {
			if (ws === "\n" && valueComment) ws = "\n\n";
		} else ws += `\n${ctx.indent}`;
	} else if (!explicitKey && isCollection$1(value)) {
		const vs0 = valueStr[0];
		const nl0 = valueStr.indexOf("\n");
		const hasNewline = nl0 !== -1;
		const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
		if (hasNewline || !flow) {
			let hasPropsLine = false;
			if (hasNewline && (vs0 === "&" || vs0 === "!")) {
				let sp0 = valueStr.indexOf(" ");
				if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") sp0 = valueStr.indexOf(" ", sp0 + 1);
				if (sp0 === -1 || nl0 < sp0) hasPropsLine = true;
			}
			if (!hasPropsLine) ws = `\n${ctx.indent}`;
		}
	} else if (valueStr === "" || valueStr[0] === "\n") ws = "";
	str += ws + valueStr;
	if (ctx.inFlow) {
		if (valueCommentDone && onComment) onComment();
	} else if (valueComment && !valueCommentDone) str += lineComment(str, ctx.indent, commentString(valueComment));
	else if (chompKeep && onChompKeep) onChompKeep();
	return str;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/log.js
function warn(logLevel, warning) {
	if (logLevel === "debug" || logLevel === "warn") console.warn(warning);
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/yaml-1.1/merge.js
var MERGE_KEY = "<<";
var merge$1 = {
	identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
	default: "key",
	tag: "tag:yaml.org,2002:merge",
	test: /^<<$/,
	resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), { addToJSMap: addMergeToJSMap }),
	stringify: () => MERGE_KEY
};
var isMergeKey = (ctx, key) => (merge$1.identify(key) || isScalar$1(key) && (!key.type || key.type === Scalar.PLAIN) && merge$1.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge$1.tag && tag.default);
function addMergeToJSMap(ctx, map, value) {
	value = ctx && isAlias(value) ? value.resolve(ctx.doc) : value;
	if (isSeq(value)) for (const it of value.items) mergeValue(ctx, map, it);
	else if (Array.isArray(value)) for (const it of value) mergeValue(ctx, map, it);
	else mergeValue(ctx, map, value);
}
function mergeValue(ctx, map, value) {
	const source = ctx && isAlias(value) ? value.resolve(ctx.doc) : value;
	if (!isMap(source)) throw new Error("Merge sources must be maps or map aliases");
	const srcMap = source.toJSON(null, ctx, Map);
	for (const [key, value] of srcMap) if (map instanceof Map) {
		if (!map.has(key)) map.set(key, value);
	} else if (map instanceof Set) map.add(key);
	else if (!Object.prototype.hasOwnProperty.call(map, key)) Object.defineProperty(map, key, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
	return map;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/nodes/addPairToJSMap.js
function addPairToJSMap(ctx, map, { key, value }) {
	if (isNode(key) && key.addToJSMap) key.addToJSMap(ctx, map, value);
	else if (isMergeKey(ctx, key)) addMergeToJSMap(ctx, map, value);
	else {
		const jsKey = toJS(key, "", ctx);
		if (map instanceof Map) map.set(jsKey, toJS(value, jsKey, ctx));
		else if (map instanceof Set) map.add(jsKey);
		else {
			const stringKey = stringifyKey(key, jsKey, ctx);
			const jsValue = toJS(value, stringKey, ctx);
			if (stringKey in map) Object.defineProperty(map, stringKey, {
				value: jsValue,
				writable: true,
				enumerable: true,
				configurable: true
			});
			else map[stringKey] = jsValue;
		}
	}
	return map;
}
function stringifyKey(key, jsKey, ctx) {
	if (jsKey === null) return "";
	if (typeof jsKey !== "object") return String(jsKey);
	if (isNode(key) && ctx?.doc) {
		const strCtx = createStringifyContext(ctx.doc, {});
		strCtx.anchors = /* @__PURE__ */ new Set();
		for (const node of ctx.anchors.keys()) strCtx.anchors.add(node.anchor);
		strCtx.inFlow = true;
		strCtx.inStringifyKey = true;
		const strKey = key.toString(strCtx);
		if (!ctx.mapKeyWarned) {
			let jsonStr = JSON.stringify(strKey);
			if (jsonStr.length > 40) jsonStr = jsonStr.substring(0, 36) + "...\"";
			warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
			ctx.mapKeyWarned = true;
		}
		return strKey;
	}
	return JSON.stringify(jsKey);
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/nodes/Pair.js
function createPair(key, value, ctx) {
	return new Pair(createNode(key, void 0, ctx), createNode(value, void 0, ctx));
}
var Pair = class Pair {
	constructor(key, value = null) {
		Object.defineProperty(this, NODE_TYPE, { value: PAIR });
		this.key = key;
		this.value = value;
	}
	clone(schema) {
		let { key, value } = this;
		if (isNode(key)) key = key.clone(schema);
		if (isNode(value)) value = value.clone(schema);
		return new Pair(key, value);
	}
	toJSON(_, ctx) {
		return addPairToJSMap(ctx, ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {}, this);
	}
	toString(ctx, onComment, onChompKeep) {
		return ctx?.doc ? stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/stringify/stringifyCollection.js
function stringifyCollection(collection, ctx, options) {
	return (ctx.inFlow ?? collection.flow ? stringifyFlowCollection : stringifyBlockCollection)(collection, ctx, options);
}
function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
	const { indent, options: { commentString } } = ctx;
	const itemCtx = Object.assign({}, ctx, {
		indent: itemIndent,
		type: null
	});
	let chompKeep = false;
	const lines = [];
	for (let i = 0; i < items.length; ++i) {
		const item = items[i];
		let comment = null;
		if (isNode(item)) {
			if (!chompKeep && item.spaceBefore) lines.push("");
			addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
			if (item.comment) comment = item.comment;
		} else if (isPair(item)) {
			const ik = isNode(item.key) ? item.key : null;
			if (ik) {
				if (!chompKeep && ik.spaceBefore) lines.push("");
				addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
			}
		}
		chompKeep = false;
		let str = stringify$2(item, itemCtx, () => comment = null, () => chompKeep = true);
		if (comment) str += lineComment(str, itemIndent, commentString(comment));
		if (chompKeep && comment) chompKeep = false;
		lines.push(blockItemPrefix + str);
	}
	let str;
	if (lines.length === 0) str = flowChars.start + flowChars.end;
	else {
		str = lines[0];
		for (let i = 1; i < lines.length; ++i) {
			const line = lines[i];
			str += line ? `\n${indent}${line}` : "\n";
		}
	}
	if (comment) {
		str += "\n" + indentComment(commentString(comment), indent);
		if (onComment) onComment();
	} else if (chompKeep && onChompKeep) onChompKeep();
	return str;
}
function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
	const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
	itemIndent += indentStep;
	const itemCtx = Object.assign({}, ctx, {
		indent: itemIndent,
		inFlow: true,
		type: null
	});
	let reqNewline = false;
	let linesAtValue = 0;
	const lines = [];
	for (let i = 0; i < items.length; ++i) {
		const item = items[i];
		let comment = null;
		if (isNode(item)) {
			if (item.spaceBefore) lines.push("");
			addCommentBefore(ctx, lines, item.commentBefore, false);
			if (item.comment) comment = item.comment;
		} else if (isPair(item)) {
			const ik = isNode(item.key) ? item.key : null;
			if (ik) {
				if (ik.spaceBefore) lines.push("");
				addCommentBefore(ctx, lines, ik.commentBefore, false);
				if (ik.comment) reqNewline = true;
			}
			const iv = isNode(item.value) ? item.value : null;
			if (iv) {
				if (iv.comment) comment = iv.comment;
				if (iv.commentBefore) reqNewline = true;
			} else if (item.value == null && ik?.comment) comment = ik.comment;
		}
		if (comment) reqNewline = true;
		let str = stringify$2(item, itemCtx, () => comment = null);
		reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
		if (i < items.length - 1) str += ",";
		else if (ctx.options.trailingComma) {
			if (ctx.options.lineWidth > 0) reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
			if (reqNewline) str += ",";
		}
		if (comment) str += lineComment(str, itemIndent, commentString(comment));
		lines.push(str);
		linesAtValue = lines.length;
	}
	const { start, end } = flowChars;
	if (lines.length === 0) return start + end;
	else {
		if (!reqNewline) {
			const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
			reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
		}
		if (reqNewline) {
			let str = start;
			for (const line of lines) str += line ? `\n${indentStep}${indent}${line}` : "\n";
			return `${str}\n${indent}${end}`;
		} else return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
	}
}
function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
	if (comment && chompKeep) comment = comment.replace(/^\n+/, "");
	if (comment) {
		const ic = indentComment(commentString(comment), indent);
		lines.push(ic.trimStart());
	}
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/nodes/YAMLMap.js
function findPair(items, key) {
	const k = isScalar$1(key) ? key.value : key;
	for (const it of items) if (isPair(it)) {
		if (it.key === key || it.key === k) return it;
		if (isScalar$1(it.key) && it.key.value === k) return it;
	}
}
var YAMLMap = class extends Collection {
	static get tagName() {
		return "tag:yaml.org,2002:map";
	}
	constructor(schema) {
		super(MAP, schema);
		this.items = [];
	}
	/**
	* A generic collection parsing method that can be extended
	* to other node classes that inherit from YAMLMap
	*/
	static from(schema, obj, ctx) {
		const { keepUndefined, replacer } = ctx;
		const map = new this(schema);
		const add = (key, value) => {
			if (typeof replacer === "function") value = replacer.call(obj, key, value);
			else if (Array.isArray(replacer) && !replacer.includes(key)) return;
			if (value !== void 0 || keepUndefined) map.items.push(createPair(key, value, ctx));
		};
		if (obj instanceof Map) for (const [key, value] of obj) add(key, value);
		else if (obj && typeof obj === "object") for (const key of Object.keys(obj)) add(key, obj[key]);
		if (typeof schema.sortMapEntries === "function") map.items.sort(schema.sortMapEntries);
		return map;
	}
	/**
	* Adds a value to the collection.
	*
	* @param overwrite - If not set `true`, using a key that is already in the
	*   collection will throw. Otherwise, overwrites the previous value.
	*/
	add(pair, overwrite) {
		let _pair;
		if (isPair(pair)) _pair = pair;
		else if (!pair || typeof pair !== "object" || !("key" in pair)) _pair = new Pair(pair, pair?.value);
		else _pair = new Pair(pair.key, pair.value);
		const prev = findPair(this.items, _pair.key);
		const sortEntries = this.schema?.sortMapEntries;
		if (prev) {
			if (!overwrite) throw new Error(`Key ${_pair.key} already set`);
			if (isScalar$1(prev.value) && isScalarValue(_pair.value)) prev.value.value = _pair.value;
			else prev.value = _pair.value;
		} else if (sortEntries) {
			const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
			if (i === -1) this.items.push(_pair);
			else this.items.splice(i, 0, _pair);
		} else this.items.push(_pair);
	}
	delete(key) {
		const it = findPair(this.items, key);
		if (!it) return false;
		return this.items.splice(this.items.indexOf(it), 1).length > 0;
	}
	get(key, keepScalar) {
		const node = findPair(this.items, key)?.value;
		return (!keepScalar && isScalar$1(node) ? node.value : node) ?? void 0;
	}
	has(key) {
		return !!findPair(this.items, key);
	}
	set(key, value) {
		this.add(new Pair(key, value), true);
	}
	/**
	* @param ctx - Conversion context, originally set in Document#toJS()
	* @param {Class} Type - If set, forces the returned collection type
	* @returns Instance of Type, Map, or Object
	*/
	toJSON(_, ctx, Type) {
		const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
		if (ctx?.onCreate) ctx.onCreate(map);
		for (const item of this.items) addPairToJSMap(ctx, map, item);
		return map;
	}
	toString(ctx, onComment, onChompKeep) {
		if (!ctx) return JSON.stringify(this);
		for (const item of this.items) if (!isPair(item)) throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
		if (!ctx.allNullValues && this.hasAllNullValues(false)) ctx = Object.assign({}, ctx, { allNullValues: true });
		return stringifyCollection(this, ctx, {
			blockItemPrefix: "",
			flowChars: {
				start: "{",
				end: "}"
			},
			itemIndent: ctx.indent || "",
			onChompKeep,
			onComment
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/common/map.js
var map = {
	collection: "map",
	default: true,
	nodeClass: YAMLMap,
	tag: "tag:yaml.org,2002:map",
	resolve(map, onError) {
		if (!isMap(map)) onError("Expected a mapping for this tag");
		return map;
	},
	createNode: (schema, obj, ctx) => YAMLMap.from(schema, obj, ctx)
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/nodes/YAMLSeq.js
var YAMLSeq = class extends Collection {
	static get tagName() {
		return "tag:yaml.org,2002:seq";
	}
	constructor(schema) {
		super(SEQ, schema);
		this.items = [];
	}
	add(value) {
		this.items.push(value);
	}
	/**
	* Removes a value from the collection.
	*
	* `key` must contain a representation of an integer for this to succeed.
	* It may be wrapped in a `Scalar`.
	*
	* @returns `true` if the item was found and removed.
	*/
	delete(key) {
		const idx = asItemIndex(key);
		if (typeof idx !== "number") return false;
		return this.items.splice(idx, 1).length > 0;
	}
	get(key, keepScalar) {
		const idx = asItemIndex(key);
		if (typeof idx !== "number") return void 0;
		const it = this.items[idx];
		return !keepScalar && isScalar$1(it) ? it.value : it;
	}
	/**
	* Checks if the collection includes a value with the key `key`.
	*
	* `key` must contain a representation of an integer for this to succeed.
	* It may be wrapped in a `Scalar`.
	*/
	has(key) {
		const idx = asItemIndex(key);
		return typeof idx === "number" && idx < this.items.length;
	}
	/**
	* Sets a value in this collection. For `!!set`, `value` needs to be a
	* boolean to add/remove the item from the set.
	*
	* If `key` does not contain a representation of an integer, this will throw.
	* It may be wrapped in a `Scalar`.
	*/
	set(key, value) {
		const idx = asItemIndex(key);
		if (typeof idx !== "number") throw new Error(`Expected a valid index, not ${key}.`);
		const prev = this.items[idx];
		if (isScalar$1(prev) && isScalarValue(value)) prev.value = value;
		else this.items[idx] = value;
	}
	toJSON(_, ctx) {
		const seq = [];
		if (ctx?.onCreate) ctx.onCreate(seq);
		let i = 0;
		for (const item of this.items) seq.push(toJS(item, String(i++), ctx));
		return seq;
	}
	toString(ctx, onComment, onChompKeep) {
		if (!ctx) return JSON.stringify(this);
		return stringifyCollection(this, ctx, {
			blockItemPrefix: "- ",
			flowChars: {
				start: "[",
				end: "]"
			},
			itemIndent: (ctx.indent || "") + "  ",
			onChompKeep,
			onComment
		});
	}
	static from(schema, obj, ctx) {
		const { replacer } = ctx;
		const seq = new this(schema);
		if (obj && Symbol.iterator in Object(obj)) {
			let i = 0;
			for (let it of obj) {
				if (typeof replacer === "function") {
					const key = obj instanceof Set ? it : String(i++);
					it = replacer.call(obj, key, it);
				}
				seq.items.push(createNode(it, void 0, ctx));
			}
		}
		return seq;
	}
};
function asItemIndex(key) {
	let idx = isScalar$1(key) ? key.value : key;
	if (idx && typeof idx === "string") idx = Number(idx);
	return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/common/seq.js
var seq = {
	collection: "seq",
	default: true,
	nodeClass: YAMLSeq,
	tag: "tag:yaml.org,2002:seq",
	resolve(seq, onError) {
		if (!isSeq(seq)) onError("Expected a sequence for this tag");
		return seq;
	},
	createNode: (schema, obj, ctx) => YAMLSeq.from(schema, obj, ctx)
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/common/string.js
var string$2 = {
	identify: (value) => typeof value === "string",
	default: true,
	tag: "tag:yaml.org,2002:str",
	resolve: (str) => str,
	stringify(item, ctx, onComment, onChompKeep) {
		ctx = Object.assign({ actualString: true }, ctx);
		return stringifyString(item, ctx, onComment, onChompKeep);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/common/null.js
var nullTag = {
	identify: (value) => value == null,
	createNode: () => new Scalar(null),
	default: true,
	tag: "tag:yaml.org,2002:null",
	test: /^(?:~|[Nn]ull|NULL)?$/,
	resolve: () => new Scalar(null),
	stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/core/bool.js
var boolTag = {
	identify: (value) => typeof value === "boolean",
	default: true,
	tag: "tag:yaml.org,2002:bool",
	test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
	resolve: (str) => new Scalar(str[0] === "t" || str[0] === "T"),
	stringify({ source, value }, ctx) {
		if (source && boolTag.test.test(source)) {
			if (value === (source[0] === "t" || source[0] === "T")) return source;
		}
		return value ? ctx.options.trueStr : ctx.options.falseStr;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/stringify/stringifyNumber.js
function stringifyNumber({ format, minFractionDigits, tag, value }) {
	if (typeof value === "bigint") return String(value);
	const num = typeof value === "number" ? value : Number(value);
	if (!isFinite(num)) return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
	let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
	if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^\d/.test(n)) {
		let i = n.indexOf(".");
		if (i < 0) {
			i = n.length;
			n += ".";
		}
		let d = minFractionDigits - (n.length - i - 1);
		while (d-- > 0) n += "0";
	}
	return n;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/core/float.js
var floatNaN$1 = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
	resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
	stringify: stringifyNumber
};
var floatExp$1 = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	format: "EXP",
	test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
	resolve: (str) => parseFloat(str),
	stringify(node) {
		const num = Number(node.value);
		return isFinite(num) ? num.toExponential() : stringifyNumber(node);
	}
};
var float$1 = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
	resolve(str) {
		const node = new Scalar(parseFloat(str));
		const dot = str.indexOf(".");
		if (dot !== -1 && str[str.length - 1] === "0") node.minFractionDigits = str.length - dot - 1;
		return node;
	},
	stringify: stringifyNumber
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/core/int.js
var intIdentify$2 = (value) => typeof value === "bigint" || Number.isInteger(value);
var intResolve$1 = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
function intStringify$1(node, radix, prefix) {
	const { value } = node;
	if (intIdentify$2(value) && value >= 0) return prefix + value.toString(radix);
	return stringifyNumber(node);
}
var intOct$1 = {
	identify: (value) => intIdentify$2(value) && value >= 0,
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "OCT",
	test: /^0o[0-7]+$/,
	resolve: (str, _onError, opt) => intResolve$1(str, 2, 8, opt),
	stringify: (node) => intStringify$1(node, 8, "0o")
};
var int$2 = {
	identify: intIdentify$2,
	default: true,
	tag: "tag:yaml.org,2002:int",
	test: /^[-+]?[0-9]+$/,
	resolve: (str, _onError, opt) => intResolve$1(str, 0, 10, opt),
	stringify: stringifyNumber
};
var intHex$1 = {
	identify: (value) => intIdentify$2(value) && value >= 0,
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "HEX",
	test: /^0x[0-9a-fA-F]+$/,
	resolve: (str, _onError, opt) => intResolve$1(str, 2, 16, opt),
	stringify: (node) => intStringify$1(node, 16, "0x")
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/core/schema.js
var schema$2 = [
	map,
	seq,
	string$2,
	nullTag,
	boolTag,
	intOct$1,
	int$2,
	intHex$1,
	floatNaN$1,
	floatExp$1,
	float$1
];
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/json/schema.js
function intIdentify$1(value) {
	return typeof value === "bigint" || Number.isInteger(value);
}
var stringifyJSON = ({ value }) => JSON.stringify(value);
var jsonScalars = [
	{
		identify: (value) => typeof value === "string",
		default: true,
		tag: "tag:yaml.org,2002:str",
		resolve: (str) => str,
		stringify: stringifyJSON
	},
	{
		identify: (value) => value == null,
		createNode: () => new Scalar(null),
		default: true,
		tag: "tag:yaml.org,2002:null",
		test: /^null$/,
		resolve: () => null,
		stringify: stringifyJSON
	},
	{
		identify: (value) => typeof value === "boolean",
		default: true,
		tag: "tag:yaml.org,2002:bool",
		test: /^true$|^false$/,
		resolve: (str) => str === "true",
		stringify: stringifyJSON
	},
	{
		identify: intIdentify$1,
		default: true,
		tag: "tag:yaml.org,2002:int",
		test: /^-?(?:0|[1-9][0-9]*)$/,
		resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
		stringify: ({ value }) => intIdentify$1(value) ? value.toString() : JSON.stringify(value)
	},
	{
		identify: (value) => typeof value === "number",
		default: true,
		tag: "tag:yaml.org,2002:float",
		test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
		resolve: (str) => parseFloat(str),
		stringify: stringifyJSON
	}
];
var schema$1 = [map, seq].concat(jsonScalars, {
	default: true,
	tag: "",
	test: /^/,
	resolve(str, onError) {
		onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
		return str;
	}
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/yaml-1.1/binary.js
var binary = {
	identify: (value) => value instanceof Uint8Array,
	default: false,
	tag: "tag:yaml.org,2002:binary",
	resolve(src, onError) {
		if (typeof atob === "function") {
			const str = atob(src.replace(/[\n\r]/g, ""));
			const buffer = new Uint8Array(str.length);
			for (let i = 0; i < str.length; ++i) buffer[i] = str.charCodeAt(i);
			return buffer;
		} else {
			onError("This environment does not support reading binary tags; either Buffer or atob is required");
			return src;
		}
	},
	stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
		if (!value) return "";
		const buf = value;
		let str;
		if (typeof btoa === "function") {
			let s = "";
			for (let i = 0; i < buf.length; ++i) s += String.fromCharCode(buf[i]);
			str = btoa(s);
		} else throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
		type ?? (type = Scalar.BLOCK_LITERAL);
		if (type !== Scalar.QUOTE_DOUBLE) {
			const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
			const n = Math.ceil(str.length / lineWidth);
			const lines = new Array(n);
			for (let i = 0, o = 0; i < n; ++i, o += lineWidth) lines[i] = str.substr(o, lineWidth);
			str = lines.join(type === Scalar.BLOCK_LITERAL ? "\n" : " ");
		}
		return stringifyString({
			comment,
			type,
			value: str
		}, ctx, onComment, onChompKeep);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/yaml-1.1/pairs.js
function resolvePairs(seq, onError) {
	if (isSeq(seq)) for (let i = 0; i < seq.items.length; ++i) {
		let item = seq.items[i];
		if (isPair(item)) continue;
		else if (isMap(item)) {
			if (item.items.length > 1) onError("Each pair must have its own sequence indicator");
			const pair = item.items[0] || new Pair(new Scalar(null));
			if (item.commentBefore) pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}\n${pair.key.commentBefore}` : item.commentBefore;
			if (item.comment) {
				const cn = pair.value ?? pair.key;
				cn.comment = cn.comment ? `${item.comment}\n${cn.comment}` : item.comment;
			}
			item = pair;
		}
		seq.items[i] = isPair(item) ? item : new Pair(item);
	}
	else onError("Expected a sequence for this tag");
	return seq;
}
function createPairs(schema, iterable, ctx) {
	const { replacer } = ctx;
	const pairs = new YAMLSeq(schema);
	pairs.tag = "tag:yaml.org,2002:pairs";
	let i = 0;
	if (iterable && Symbol.iterator in Object(iterable)) for (let it of iterable) {
		if (typeof replacer === "function") it = replacer.call(iterable, String(i++), it);
		let key, value;
		if (Array.isArray(it)) if (it.length === 2) {
			key = it[0];
			value = it[1];
		} else throw new TypeError(`Expected [key, value] tuple: ${it}`);
		else if (it && it instanceof Object) {
			const keys = Object.keys(it);
			if (keys.length === 1) {
				key = keys[0];
				value = it[key];
			} else throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
		} else key = it;
		pairs.items.push(createPair(key, value, ctx));
	}
	return pairs;
}
var pairs = {
	collection: "seq",
	default: false,
	tag: "tag:yaml.org,2002:pairs",
	resolve: resolvePairs,
	createNode: createPairs
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/yaml-1.1/omap.js
var YAMLOMap = class YAMLOMap extends YAMLSeq {
	constructor() {
		super();
		this.add = YAMLMap.prototype.add.bind(this);
		this.delete = YAMLMap.prototype.delete.bind(this);
		this.get = YAMLMap.prototype.get.bind(this);
		this.has = YAMLMap.prototype.has.bind(this);
		this.set = YAMLMap.prototype.set.bind(this);
		this.tag = YAMLOMap.tag;
	}
	/**
	* If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
	* but TypeScript won't allow widening the signature of a child method.
	*/
	toJSON(_, ctx) {
		if (!ctx) return super.toJSON(_);
		const map = /* @__PURE__ */ new Map();
		if (ctx?.onCreate) ctx.onCreate(map);
		for (const pair of this.items) {
			let key, value;
			if (isPair(pair)) {
				key = toJS(pair.key, "", ctx);
				value = toJS(pair.value, key, ctx);
			} else key = toJS(pair, "", ctx);
			if (map.has(key)) throw new Error("Ordered maps must not include duplicate keys");
			map.set(key, value);
		}
		return map;
	}
	static from(schema, iterable, ctx) {
		const pairs = createPairs(schema, iterable, ctx);
		const omap = new this();
		omap.items = pairs.items;
		return omap;
	}
};
YAMLOMap.tag = "tag:yaml.org,2002:omap";
var omap = {
	collection: "seq",
	identify: (value) => value instanceof Map,
	nodeClass: YAMLOMap,
	default: false,
	tag: "tag:yaml.org,2002:omap",
	resolve(seq, onError) {
		const pairs = resolvePairs(seq, onError);
		const seenKeys = [];
		for (const { key } of pairs.items) if (isScalar$1(key)) if (seenKeys.includes(key.value)) onError(`Ordered maps must not include duplicate keys: ${key.value}`);
		else seenKeys.push(key.value);
		return Object.assign(new YAMLOMap(), pairs);
	},
	createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/yaml-1.1/bool.js
function boolStringify({ value, source }, ctx) {
	if (source && (value ? trueTag : falseTag).test.test(source)) return source;
	return value ? ctx.options.trueStr : ctx.options.falseStr;
}
var trueTag = {
	identify: (value) => value === true,
	default: true,
	tag: "tag:yaml.org,2002:bool",
	test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
	resolve: () => new Scalar(true),
	stringify: boolStringify
};
var falseTag = {
	identify: (value) => value === false,
	default: true,
	tag: "tag:yaml.org,2002:bool",
	test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
	resolve: () => new Scalar(false),
	stringify: boolStringify
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/yaml-1.1/float.js
var floatNaN = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
	resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
	stringify: stringifyNumber
};
var floatExp = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	format: "EXP",
	test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
	resolve: (str) => parseFloat(str.replace(/_/g, "")),
	stringify(node) {
		const num = Number(node.value);
		return isFinite(num) ? num.toExponential() : stringifyNumber(node);
	}
};
var float = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
	resolve(str) {
		const node = new Scalar(parseFloat(str.replace(/_/g, "")));
		const dot = str.indexOf(".");
		if (dot !== -1) {
			const f = str.substring(dot + 1).replace(/_/g, "");
			if (f[f.length - 1] === "0") node.minFractionDigits = f.length;
		}
		return node;
	},
	stringify: stringifyNumber
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/yaml-1.1/int.js
var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
function intResolve(str, offset, radix, { intAsBigInt }) {
	const sign = str[0];
	if (sign === "-" || sign === "+") offset += 1;
	str = str.substring(offset).replace(/_/g, "");
	if (intAsBigInt) {
		switch (radix) {
			case 2:
				str = `0b${str}`;
				break;
			case 8:
				str = `0o${str}`;
				break;
			case 16:
				str = `0x${str}`;
				break;
		}
		const n = BigInt(str);
		return sign === "-" ? BigInt(-1) * n : n;
	}
	const n = parseInt(str, radix);
	return sign === "-" ? -1 * n : n;
}
function intStringify(node, radix, prefix) {
	const { value } = node;
	if (intIdentify(value)) {
		const str = value.toString(radix);
		return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
	}
	return stringifyNumber(node);
}
var intBin = {
	identify: intIdentify,
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "BIN",
	test: /^[-+]?0b[0-1_]+$/,
	resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
	stringify: (node) => intStringify(node, 2, "0b")
};
var intOct = {
	identify: intIdentify,
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "OCT",
	test: /^[-+]?0[0-7_]+$/,
	resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
	stringify: (node) => intStringify(node, 8, "0")
};
var int$1 = {
	identify: intIdentify,
	default: true,
	tag: "tag:yaml.org,2002:int",
	test: /^[-+]?[0-9][0-9_]*$/,
	resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
	stringify: stringifyNumber
};
var intHex = {
	identify: intIdentify,
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "HEX",
	test: /^[-+]?0x[0-9a-fA-F_]+$/,
	resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
	stringify: (node) => intStringify(node, 16, "0x")
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/yaml-1.1/set.js
var YAMLSet = class YAMLSet extends YAMLMap {
	constructor(schema) {
		super(schema);
		this.tag = YAMLSet.tag;
	}
	add(key) {
		let pair;
		if (isPair(key)) pair = key;
		else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null) pair = new Pair(key.key, null);
		else pair = new Pair(key, null);
		if (!findPair(this.items, pair.key)) this.items.push(pair);
	}
	/**
	* If `keepPair` is `true`, returns the Pair matching `key`.
	* Otherwise, returns the value of that Pair's key.
	*/
	get(key, keepPair) {
		const pair = findPair(this.items, key);
		return !keepPair && isPair(pair) ? isScalar$1(pair.key) ? pair.key.value : pair.key : pair;
	}
	set(key, value) {
		if (typeof value !== "boolean") throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
		const prev = findPair(this.items, key);
		if (prev && !value) this.items.splice(this.items.indexOf(prev), 1);
		else if (!prev && value) this.items.push(new Pair(key));
	}
	toJSON(_, ctx) {
		return super.toJSON(_, ctx, Set);
	}
	toString(ctx, onComment, onChompKeep) {
		if (!ctx) return JSON.stringify(this);
		if (this.hasAllNullValues(true)) return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
		else throw new Error("Set items must all have null values");
	}
	static from(schema, iterable, ctx) {
		const { replacer } = ctx;
		const set = new this(schema);
		if (iterable && Symbol.iterator in Object(iterable)) for (let value of iterable) {
			if (typeof replacer === "function") value = replacer.call(iterable, value, value);
			set.items.push(createPair(value, null, ctx));
		}
		return set;
	}
};
YAMLSet.tag = "tag:yaml.org,2002:set";
var set = {
	collection: "map",
	identify: (value) => value instanceof Set,
	nodeClass: YAMLSet,
	default: false,
	tag: "tag:yaml.org,2002:set",
	createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
	resolve(map, onError) {
		if (isMap(map)) if (map.hasAllNullValues(true)) return Object.assign(new YAMLSet(), map);
		else onError("Set items must all have null values");
		else onError("Expected a mapping for this tag");
		return map;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/yaml-1.1/timestamp.js
/** Internal types handle bigint as number, because TS can't figure it out. */
function parseSexagesimal(str, asBigInt) {
	const sign = str[0];
	const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
	const num = (n) => asBigInt ? BigInt(n) : Number(n);
	const res = parts.replace(/_/g, "").split(":").reduce((res, p) => res * num(60) + num(p), num(0));
	return sign === "-" ? num(-1) * res : res;
}
/**
* hhhh:mm:ss.sss
*
* Internal types handle bigint as number, because TS can't figure it out.
*/
function stringifySexagesimal(node) {
	let { value } = node;
	let num = (n) => n;
	if (typeof value === "bigint") num = (n) => BigInt(n);
	else if (isNaN(value) || !isFinite(value)) return stringifyNumber(node);
	let sign = "";
	if (value < 0) {
		sign = "-";
		value *= num(-1);
	}
	const _60 = num(60);
	const parts = [value % _60];
	if (value < 60) parts.unshift(0);
	else {
		value = (value - parts[0]) / _60;
		parts.unshift(value % _60);
		if (value >= 60) {
			value = (value - parts[0]) / _60;
			parts.unshift(value);
		}
	}
	return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
}
var intTime = {
	identify: (value) => typeof value === "bigint" || Number.isInteger(value),
	default: true,
	tag: "tag:yaml.org,2002:int",
	format: "TIME",
	test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
	resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
	stringify: stringifySexagesimal
};
var floatTime = {
	identify: (value) => typeof value === "number",
	default: true,
	tag: "tag:yaml.org,2002:float",
	format: "TIME",
	test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
	resolve: (str) => parseSexagesimal(str, false),
	stringify: stringifySexagesimal
};
var timestamp = {
	identify: (value) => value instanceof Date,
	default: true,
	tag: "tag:yaml.org,2002:timestamp",
	test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
	resolve(str) {
		const match = str.match(timestamp.test);
		if (!match) throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
		const [, year, month, day, hour, minute, second] = match.map(Number);
		const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
		let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
		const tz = match[8];
		if (tz && tz !== "Z") {
			let d = parseSexagesimal(tz, false);
			if (Math.abs(d) < 30) d *= 60;
			date -= 6e4 * d;
		}
		return new Date(date);
	},
	stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/yaml-1.1/schema.js
var schema = [
	map,
	seq,
	string$2,
	nullTag,
	trueTag,
	falseTag,
	intBin,
	intOct,
	int$1,
	intHex,
	floatNaN,
	floatExp,
	float,
	binary,
	merge$1,
	omap,
	pairs,
	set,
	intTime,
	floatTime,
	timestamp
];
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/tags.js
var schemas = new Map([
	["core", schema$2],
	["failsafe", [
		map,
		seq,
		string$2
	]],
	["json", schema$1],
	["yaml11", schema],
	["yaml-1.1", schema]
]);
var tagsByName = {
	binary,
	bool: boolTag,
	float: float$1,
	floatExp: floatExp$1,
	floatNaN: floatNaN$1,
	floatTime,
	int: int$2,
	intHex: intHex$1,
	intOct: intOct$1,
	intTime,
	map,
	merge: merge$1,
	null: nullTag,
	omap,
	pairs,
	seq,
	set,
	timestamp
};
var coreKnownTags = {
	"tag:yaml.org,2002:binary": binary,
	"tag:yaml.org,2002:merge": merge$1,
	"tag:yaml.org,2002:omap": omap,
	"tag:yaml.org,2002:pairs": pairs,
	"tag:yaml.org,2002:set": set,
	"tag:yaml.org,2002:timestamp": timestamp
};
function getTags(customTags, schemaName, addMergeTag) {
	const schemaTags = schemas.get(schemaName);
	if (schemaTags && !customTags) return addMergeTag && !schemaTags.includes(merge$1) ? schemaTags.concat(merge$1) : schemaTags.slice();
	let tags = schemaTags;
	if (!tags) if (Array.isArray(customTags)) tags = [];
	else {
		const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
		throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
	}
	if (Array.isArray(customTags)) for (const tag of customTags) tags = tags.concat(tag);
	else if (typeof customTags === "function") tags = customTags(tags.slice());
	if (addMergeTag) tags = tags.concat(merge$1);
	return tags.reduce((tags, tag) => {
		const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
		if (!tagObj) {
			const tagName = JSON.stringify(tag);
			const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
			throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
		}
		if (!tags.includes(tagObj)) tags.push(tagObj);
		return tags;
	}, []);
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/schema/Schema.js
var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
var Schema = class Schema {
	constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
		this.compat = Array.isArray(compat) ? getTags(compat, "compat") : compat ? getTags(null, compat) : null;
		this.name = typeof schema === "string" && schema || "core";
		this.knownTags = resolveKnownTags ? coreKnownTags : {};
		this.tags = getTags(customTags, this.name, merge);
		this.toStringOptions = toStringDefaults ?? null;
		Object.defineProperty(this, MAP, { value: map });
		Object.defineProperty(this, SCALAR$1, { value: string$2 });
		Object.defineProperty(this, SEQ, { value: seq });
		this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
	}
	clone() {
		const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
		copy.tags = this.tags.slice();
		return copy;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/stringify/stringifyDocument.js
function stringifyDocument(doc, options) {
	const lines = [];
	let hasDirectives = options.directives === true;
	if (options.directives !== false && doc.directives) {
		const dir = doc.directives.toString(doc);
		if (dir) {
			lines.push(dir);
			hasDirectives = true;
		} else if (doc.directives.docStart) hasDirectives = true;
	}
	if (hasDirectives) lines.push("---");
	const ctx = createStringifyContext(doc, options);
	const { commentString } = ctx.options;
	if (doc.commentBefore) {
		if (lines.length !== 1) lines.unshift("");
		const cs = commentString(doc.commentBefore);
		lines.unshift(indentComment(cs, ""));
	}
	let chompKeep = false;
	let contentComment = null;
	if (doc.contents) {
		if (isNode(doc.contents)) {
			if (doc.contents.spaceBefore && hasDirectives) lines.push("");
			if (doc.contents.commentBefore) {
				const cs = commentString(doc.contents.commentBefore);
				lines.push(indentComment(cs, ""));
			}
			ctx.forceBlockIndent = !!doc.comment;
			contentComment = doc.contents.comment;
		}
		const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
		let body = stringify$2(doc.contents, ctx, () => contentComment = null, onChompKeep);
		if (contentComment) body += lineComment(body, "", commentString(contentComment));
		if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") lines[lines.length - 1] = `--- ${body}`;
		else lines.push(body);
	} else lines.push(stringify$2(doc.contents, ctx));
	if (doc.directives?.docEnd) if (doc.comment) {
		const cs = commentString(doc.comment);
		if (cs.includes("\n")) {
			lines.push("...");
			lines.push(indentComment(cs, ""));
		} else lines.push(`... ${cs}`);
	} else lines.push("...");
	else {
		let dc = doc.comment;
		if (dc && chompKeep) dc = dc.replace(/^\n+/, "");
		if (dc) {
			if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "") lines.push("");
			lines.push(indentComment(commentString(dc), ""));
		}
	}
	return lines.join("\n") + "\n";
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/doc/Document.js
var Document = class Document {
	constructor(value, replacer, options) {
		/** A comment before this Document */
		this.commentBefore = null;
		/** A comment immediately after this Document */
		this.comment = null;
		/** Errors encountered during parsing. */
		this.errors = [];
		/** Warnings encountered during parsing. */
		this.warnings = [];
		Object.defineProperty(this, NODE_TYPE, { value: DOC });
		let _replacer = null;
		if (typeof replacer === "function" || Array.isArray(replacer)) _replacer = replacer;
		else if (options === void 0 && replacer) {
			options = replacer;
			replacer = void 0;
		}
		const opt = Object.assign({
			intAsBigInt: false,
			keepSourceTokens: false,
			logLevel: "warn",
			prettyErrors: true,
			strict: true,
			stringKeys: false,
			uniqueKeys: true,
			version: "1.2"
		}, options);
		this.options = opt;
		let { version } = opt;
		if (options?._directives) {
			this.directives = options._directives.atDocument();
			if (this.directives.yaml.explicit) version = this.directives.yaml.version;
		} else this.directives = new Directives({ version });
		this.setSchema(version, options);
		this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
	}
	/**
	* Create a deep copy of this Document and its contents.
	*
	* Custom Node values that inherit from `Object` still refer to their original instances.
	*/
	clone() {
		const copy = Object.create(Document.prototype, { [NODE_TYPE]: { value: DOC } });
		copy.commentBefore = this.commentBefore;
		copy.comment = this.comment;
		copy.errors = this.errors.slice();
		copy.warnings = this.warnings.slice();
		copy.options = Object.assign({}, this.options);
		if (this.directives) copy.directives = this.directives.clone();
		copy.schema = this.schema.clone();
		copy.contents = isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
		if (this.range) copy.range = this.range.slice();
		return copy;
	}
	/** Adds a value to the document. */
	add(value) {
		if (assertCollection(this.contents)) this.contents.add(value);
	}
	/** Adds a value to the document. */
	addIn(path, value) {
		if (assertCollection(this.contents)) this.contents.addIn(path, value);
	}
	/**
	* Create a new `Alias` node, ensuring that the target `node` has the required anchor.
	*
	* If `node` already has an anchor, `name` is ignored.
	* Otherwise, the `node.anchor` value will be set to `name`,
	* or if an anchor with that name is already present in the document,
	* `name` will be used as a prefix for a new unique anchor.
	* If `name` is undefined, the generated anchor will use 'a' as a prefix.
	*/
	createAlias(node, name) {
		if (!node.anchor) {
			const prev = anchorNames(this);
			node.anchor = !name || prev.has(name) ? findNewAnchor(name || "a", prev) : name;
		}
		return new Alias(node.anchor);
	}
	createNode(value, replacer, options) {
		let _replacer = void 0;
		if (typeof replacer === "function") {
			value = replacer.call({ "": value }, "", value);
			_replacer = replacer;
		} else if (Array.isArray(replacer)) {
			const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
			const asStr = replacer.filter(keyToStr).map(String);
			if (asStr.length > 0) replacer = replacer.concat(asStr);
			_replacer = replacer;
		} else if (options === void 0 && replacer) {
			options = replacer;
			replacer = void 0;
		}
		const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
		const { onAnchor, setAnchors, sourceObjects } = createNodeAnchors(this, anchorPrefix || "a");
		const ctx = {
			aliasDuplicateObjects: aliasDuplicateObjects ?? true,
			keepUndefined: keepUndefined ?? false,
			onAnchor,
			onTagObj,
			replacer: _replacer,
			schema: this.schema,
			sourceObjects
		};
		const node = createNode(value, tag, ctx);
		if (flow && isCollection$1(node)) node.flow = true;
		setAnchors();
		return node;
	}
	/**
	* Convert a key and a value into a `Pair` using the current schema,
	* recursively wrapping all values as `Scalar` or `Collection` nodes.
	*/
	createPair(key, value, options = {}) {
		return new Pair(this.createNode(key, null, options), this.createNode(value, null, options));
	}
	/**
	* Removes a value from the document.
	* @returns `true` if the item was found and removed.
	*/
	delete(key) {
		return assertCollection(this.contents) ? this.contents.delete(key) : false;
	}
	/**
	* Removes a value from the document.
	* @returns `true` if the item was found and removed.
	*/
	deleteIn(path) {
		if (isEmptyPath(path)) {
			if (this.contents == null) return false;
			this.contents = null;
			return true;
		}
		return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
	}
	/**
	* Returns item at `key`, or `undefined` if not found. By default unwraps
	* scalar values from their surrounding node; to disable set `keepScalar` to
	* `true` (collections are always returned intact).
	*/
	get(key, keepScalar) {
		return isCollection$1(this.contents) ? this.contents.get(key, keepScalar) : void 0;
	}
	/**
	* Returns item at `path`, or `undefined` if not found. By default unwraps
	* scalar values from their surrounding node; to disable set `keepScalar` to
	* `true` (collections are always returned intact).
	*/
	getIn(path, keepScalar) {
		if (isEmptyPath(path)) return !keepScalar && isScalar$1(this.contents) ? this.contents.value : this.contents;
		return isCollection$1(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
	}
	/**
	* Checks if the document includes a value with the key `key`.
	*/
	has(key) {
		return isCollection$1(this.contents) ? this.contents.has(key) : false;
	}
	/**
	* Checks if the document includes a value at `path`.
	*/
	hasIn(path) {
		if (isEmptyPath(path)) return this.contents !== void 0;
		return isCollection$1(this.contents) ? this.contents.hasIn(path) : false;
	}
	/**
	* Sets a value in this document. For `!!set`, `value` needs to be a
	* boolean to add/remove the item from the set.
	*/
	set(key, value) {
		if (this.contents == null) this.contents = collectionFromPath(this.schema, [key], value);
		else if (assertCollection(this.contents)) this.contents.set(key, value);
	}
	/**
	* Sets a value in this document. For `!!set`, `value` needs to be a
	* boolean to add/remove the item from the set.
	*/
	setIn(path, value) {
		if (isEmptyPath(path)) this.contents = value;
		else if (this.contents == null) this.contents = collectionFromPath(this.schema, Array.from(path), value);
		else if (assertCollection(this.contents)) this.contents.setIn(path, value);
	}
	/**
	* Change the YAML version and schema used by the document.
	* A `null` version disables support for directives, explicit tags, anchors, and aliases.
	* It also requires the `schema` option to be given as a `Schema` instance value.
	*
	* Overrides all previously set schema options.
	*/
	setSchema(version, options = {}) {
		if (typeof version === "number") version = String(version);
		let opt;
		switch (version) {
			case "1.1":
				if (this.directives) this.directives.yaml.version = "1.1";
				else this.directives = new Directives({ version: "1.1" });
				opt = {
					resolveKnownTags: false,
					schema: "yaml-1.1"
				};
				break;
			case "1.2":
			case "next":
				if (this.directives) this.directives.yaml.version = version;
				else this.directives = new Directives({ version });
				opt = {
					resolveKnownTags: true,
					schema: "core"
				};
				break;
			case null:
				if (this.directives) delete this.directives;
				opt = null;
				break;
			default: {
				const sv = JSON.stringify(version);
				throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
			}
		}
		if (options.schema instanceof Object) this.schema = options.schema;
		else if (opt) this.schema = new Schema(Object.assign(opt, options));
		else throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
	}
	toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
		const ctx = {
			anchors: /* @__PURE__ */ new Map(),
			doc: this,
			keep: !json,
			mapAsMap: mapAsMap === true,
			mapKeyWarned: false,
			maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
		};
		const res = toJS(this.contents, jsonArg ?? "", ctx);
		if (typeof onAnchor === "function") for (const { count, res } of ctx.anchors.values()) onAnchor(res, count);
		return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
	}
	/**
	* A JSON representation of the document `contents`.
	*
	* @param jsonArg Used by `JSON.stringify` to indicate the array index or
	*   property name.
	*/
	toJSON(jsonArg, onAnchor) {
		return this.toJS({
			json: true,
			jsonArg,
			mapAsMap: false,
			onAnchor
		});
	}
	/** A YAML representation of the document. */
	toString(options = {}) {
		if (this.errors.length > 0) throw new Error("Document with errors cannot be stringified");
		if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
			const s = JSON.stringify(options.indent);
			throw new Error(`"indent" option must be a positive integer, not ${s}`);
		}
		return stringifyDocument(this, options);
	}
};
function assertCollection(contents) {
	if (isCollection$1(contents)) return true;
	throw new Error("Expected a YAML collection as document contents");
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/errors.js
var YAMLError = class extends Error {
	constructor(name, pos, code, message) {
		super();
		this.name = name;
		this.code = code;
		this.message = message;
		this.pos = pos;
	}
};
var YAMLParseError = class extends YAMLError {
	constructor(pos, code, message) {
		super("YAMLParseError", pos, code, message);
	}
};
var YAMLWarning = class extends YAMLError {
	constructor(pos, code, message) {
		super("YAMLWarning", pos, code, message);
	}
};
var prettifyError = (src, lc) => (error) => {
	if (error.pos[0] === -1) return;
	error.linePos = error.pos.map((pos) => lc.linePos(pos));
	const { line, col } = error.linePos[0];
	error.message += ` at line ${line}, column ${col}`;
	let ci = col - 1;
	let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
	if (ci >= 60 && lineStr.length > 80) {
		const trimStart = Math.min(ci - 39, lineStr.length - 79);
		lineStr = "…" + lineStr.substring(trimStart);
		ci -= trimStart - 1;
	}
	if (lineStr.length > 80) lineStr = lineStr.substring(0, 79) + "…";
	if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
		let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
		if (prev.length > 80) prev = prev.substring(0, 79) + "…\n";
		lineStr = prev + lineStr;
	}
	if (/[^ ]/.test(lineStr)) {
		let count = 1;
		const end = error.linePos[1];
		if (end?.line === line && end.col > col) count = Math.max(1, Math.min(end.col - col, 80 - ci));
		const pointer = " ".repeat(ci) + "^".repeat(count);
		error.message += `:\n\n${lineStr}\n${pointer}\n`;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/resolve-props.js
function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
	let spaceBefore = false;
	let atNewline = startOnNewline;
	let hasSpace = startOnNewline;
	let comment = "";
	let commentSep = "";
	let hasNewline = false;
	let reqSpace = false;
	let tab = null;
	let anchor = null;
	let tag = null;
	let newlineAfterProp = null;
	let comma = null;
	let found = null;
	let start = null;
	for (const token of tokens) {
		if (reqSpace) {
			if (token.type !== "space" && token.type !== "newline" && token.type !== "comma") onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
			reqSpace = false;
		}
		if (tab) {
			if (atNewline && token.type !== "comment" && token.type !== "newline") onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
			tab = null;
		}
		switch (token.type) {
			case "space":
				if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) tab = token;
				hasSpace = true;
				break;
			case "comment": {
				if (!hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
				const cb = token.source.substring(1) || " ";
				if (!comment) comment = cb;
				else comment += commentSep + cb;
				commentSep = "";
				atNewline = false;
				break;
			}
			case "newline":
				if (atNewline) {
					if (comment) comment += token.source;
					else if (!found || indicator !== "seq-item-ind") spaceBefore = true;
				} else commentSep += token.source;
				atNewline = true;
				hasNewline = true;
				if (anchor || tag) newlineAfterProp = token;
				hasSpace = true;
				break;
			case "anchor":
				if (anchor) onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
				if (token.source.endsWith(":")) onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
				anchor = token;
				start ?? (start = token.offset);
				atNewline = false;
				hasSpace = false;
				reqSpace = true;
				break;
			case "tag":
				if (tag) onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
				tag = token;
				start ?? (start = token.offset);
				atNewline = false;
				hasSpace = false;
				reqSpace = true;
				break;
			case indicator:
				if (anchor || tag) onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
				if (found) onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
				found = token;
				atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
				hasSpace = false;
				break;
			case "comma": if (flow) {
				if (comma) onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
				comma = token;
				atNewline = false;
				hasSpace = false;
				break;
			}
			default:
				onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
				atNewline = false;
				hasSpace = false;
		}
	}
	const last = tokens[tokens.length - 1];
	const end = last ? last.offset + last.source.length : offset;
	if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
	if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq")) onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
	return {
		comma,
		found,
		spaceBefore,
		comment,
		hasNewline,
		anchor,
		tag,
		newlineAfterProp,
		end,
		start: start ?? end
	};
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/util-contains-newline.js
function containsNewline(key) {
	if (!key) return null;
	switch (key.type) {
		case "alias":
		case "scalar":
		case "double-quoted-scalar":
		case "single-quoted-scalar":
			if (key.source.includes("\n")) return true;
			if (key.end) {
				for (const st of key.end) if (st.type === "newline") return true;
			}
			return false;
		case "flow-collection":
			for (const it of key.items) {
				for (const st of it.start) if (st.type === "newline") return true;
				if (it.sep) {
					for (const st of it.sep) if (st.type === "newline") return true;
				}
				if (containsNewline(it.key) || containsNewline(it.value)) return true;
			}
			return false;
		default: return true;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/util-flow-indent-check.js
function flowIndentCheck(indent, fc, onError) {
	if (fc?.type === "flow-collection") {
		const end = fc.end[0];
		if (end.indent === indent && (end.source === "]" || end.source === "}") && containsNewline(fc)) onError(end, "BAD_INDENT", "Flow end indicator should be more indented than parent", true);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/util-map-includes.js
function mapIncludes(ctx, items, search) {
	const { uniqueKeys } = ctx.options;
	if (uniqueKeys === false) return false;
	const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || isScalar$1(a) && isScalar$1(b) && a.value === b.value;
	return items.some((pair) => isEqual(pair.key, search));
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/resolve-block-map.js
var startColMsg = "All mapping items must start at the same column";
function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
	const map = new (tag?.nodeClass ?? YAMLMap)(ctx.schema);
	if (ctx.atRoot) ctx.atRoot = false;
	let offset = bm.offset;
	let commentEnd = null;
	for (const collItem of bm.items) {
		const { start, key, sep, value } = collItem;
		const keyProps = resolveProps(start, {
			indicator: "explicit-key-ind",
			next: key ?? sep?.[0],
			offset,
			onError,
			parentIndent: bm.indent,
			startOnNewline: true
		});
		const implicitKey = !keyProps.found;
		if (implicitKey) {
			if (key) {
				if (key.type === "block-seq") onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
				else if ("indent" in key && key.indent !== bm.indent) onError(offset, "BAD_INDENT", startColMsg);
			}
			if (!keyProps.anchor && !keyProps.tag && !sep) {
				commentEnd = keyProps.end;
				if (keyProps.comment) if (map.comment) map.comment += "\n" + keyProps.comment;
				else map.comment = keyProps.comment;
				continue;
			}
			if (keyProps.newlineAfterProp || containsNewline(key)) onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
		} else if (keyProps.found?.indent !== bm.indent) onError(offset, "BAD_INDENT", startColMsg);
		ctx.atKey = true;
		const keyStart = keyProps.end;
		const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
		if (ctx.schema.compat) flowIndentCheck(bm.indent, key, onError);
		ctx.atKey = false;
		if (mapIncludes(ctx, map.items, keyNode)) onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
		const valueProps = resolveProps(sep ?? [], {
			indicator: "map-value-ind",
			next: value,
			offset: keyNode.range[2],
			onError,
			parentIndent: bm.indent,
			startOnNewline: !key || key.type === "block-scalar"
		});
		offset = valueProps.end;
		if (valueProps.found) {
			if (implicitKey) {
				if (value?.type === "block-map" && !valueProps.hasNewline) onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
				if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024) onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
			}
			const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
			if (ctx.schema.compat) flowIndentCheck(bm.indent, value, onError);
			offset = valueNode.range[2];
			const pair = new Pair(keyNode, valueNode);
			if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
			map.items.push(pair);
		} else {
			if (implicitKey) onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
			if (valueProps.comment) if (keyNode.comment) keyNode.comment += "\n" + valueProps.comment;
			else keyNode.comment = valueProps.comment;
			const pair = new Pair(keyNode);
			if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
			map.items.push(pair);
		}
	}
	if (commentEnd && commentEnd < offset) onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
	map.range = [
		bm.offset,
		offset,
		commentEnd ?? offset
	];
	return map;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/resolve-block-seq.js
function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
	const seq = new (tag?.nodeClass ?? YAMLSeq)(ctx.schema);
	if (ctx.atRoot) ctx.atRoot = false;
	if (ctx.atKey) ctx.atKey = false;
	let offset = bs.offset;
	let commentEnd = null;
	for (const { start, value } of bs.items) {
		const props = resolveProps(start, {
			indicator: "seq-item-ind",
			next: value,
			offset,
			onError,
			parentIndent: bs.indent,
			startOnNewline: true
		});
		if (!props.found) if (props.anchor || props.tag || value) if (value?.type === "block-seq") onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
		else onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
		else {
			commentEnd = props.end;
			if (props.comment) seq.comment = props.comment;
			continue;
		}
		const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
		if (ctx.schema.compat) flowIndentCheck(bs.indent, value, onError);
		offset = node.range[2];
		seq.items.push(node);
	}
	seq.range = [
		bs.offset,
		offset,
		commentEnd ?? offset
	];
	return seq;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/resolve-end.js
function resolveEnd(end, offset, reqSpace, onError) {
	let comment = "";
	if (end) {
		let hasSpace = false;
		let sep = "";
		for (const token of end) {
			const { source, type } = token;
			switch (type) {
				case "space":
					hasSpace = true;
					break;
				case "comment": {
					if (reqSpace && !hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
					const cb = source.substring(1) || " ";
					if (!comment) comment = cb;
					else comment += sep + cb;
					sep = "";
					break;
				}
				case "newline":
					if (comment) sep += source;
					hasSpace = true;
					break;
				default: onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
			}
			offset += source.length;
		}
	}
	return {
		comment,
		offset
	};
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/resolve-flow-collection.js
var blockMsg = "Block collections are not allowed within flow collections";
var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
	const isMap = fc.start.source === "{";
	const fcName = isMap ? "flow map" : "flow sequence";
	const coll = new (tag?.nodeClass ?? (isMap ? YAMLMap : YAMLSeq))(ctx.schema);
	coll.flow = true;
	const atRoot = ctx.atRoot;
	if (atRoot) ctx.atRoot = false;
	if (ctx.atKey) ctx.atKey = false;
	let offset = fc.offset + fc.start.source.length;
	for (let i = 0; i < fc.items.length; ++i) {
		const collItem = fc.items[i];
		const { start, key, sep, value } = collItem;
		const props = resolveProps(start, {
			flow: fcName,
			indicator: "explicit-key-ind",
			next: key ?? sep?.[0],
			offset,
			onError,
			parentIndent: fc.indent,
			startOnNewline: false
		});
		if (!props.found) {
			if (!props.anchor && !props.tag && !sep && !value) {
				if (i === 0 && props.comma) onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
				else if (i < fc.items.length - 1) onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
				if (props.comment) if (coll.comment) coll.comment += "\n" + props.comment;
				else coll.comment = props.comment;
				offset = props.end;
				continue;
			}
			if (!isMap && ctx.options.strict && containsNewline(key)) onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
		}
		if (i === 0) {
			if (props.comma) onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
		} else {
			if (!props.comma) onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
			if (props.comment) {
				let prevItemComment = "";
				loop: for (const st of start) switch (st.type) {
					case "comma":
					case "space": break;
					case "comment":
						prevItemComment = st.source.substring(1);
						break loop;
					default: break loop;
				}
				if (prevItemComment) {
					let prev = coll.items[coll.items.length - 1];
					if (isPair(prev)) prev = prev.value ?? prev.key;
					if (prev.comment) prev.comment += "\n" + prevItemComment;
					else prev.comment = prevItemComment;
					props.comment = props.comment.substring(prevItemComment.length + 1);
				}
			}
		}
		if (!isMap && !sep && !props.found) {
			const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
			coll.items.push(valueNode);
			offset = valueNode.range[2];
			if (isBlock(value)) onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
		} else {
			ctx.atKey = true;
			const keyStart = props.end;
			const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
			if (isBlock(key)) onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
			ctx.atKey = false;
			const valueProps = resolveProps(sep ?? [], {
				flow: fcName,
				indicator: "map-value-ind",
				next: value,
				offset: keyNode.range[2],
				onError,
				parentIndent: fc.indent,
				startOnNewline: false
			});
			if (valueProps.found) {
				if (!isMap && !props.found && ctx.options.strict) {
					if (sep) for (const st of sep) {
						if (st === valueProps.found) break;
						if (st.type === "newline") {
							onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
							break;
						}
					}
					if (props.start < valueProps.found.offset - 1024) onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
				}
			} else if (value) if ("source" in value && value.source?.[0] === ":") onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
			else onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
			const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
			if (valueNode) {
				if (isBlock(value)) onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
			} else if (valueProps.comment) if (keyNode.comment) keyNode.comment += "\n" + valueProps.comment;
			else keyNode.comment = valueProps.comment;
			const pair = new Pair(keyNode, valueNode);
			if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
			if (isMap) {
				const map = coll;
				if (mapIncludes(ctx, map.items, keyNode)) onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
				map.items.push(pair);
			} else {
				const map = new YAMLMap(ctx.schema);
				map.flow = true;
				map.items.push(pair);
				const endRange = (valueNode ?? keyNode).range;
				map.range = [
					keyNode.range[0],
					endRange[1],
					endRange[2]
				];
				coll.items.push(map);
			}
			offset = valueNode ? valueNode.range[2] : valueProps.end;
		}
	}
	const expectedEnd = isMap ? "}" : "]";
	const [ce, ...ee] = fc.end;
	let cePos = offset;
	if (ce?.source === expectedEnd) cePos = ce.offset + ce.source.length;
	else {
		const name = fcName[0].toUpperCase() + fcName.substring(1);
		const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
		onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
		if (ce && ce.source.length !== 1) ee.unshift(ce);
	}
	if (ee.length > 0) {
		const end = resolveEnd(ee, cePos, ctx.options.strict, onError);
		if (end.comment) if (coll.comment) coll.comment += "\n" + end.comment;
		else coll.comment = end.comment;
		coll.range = [
			fc.offset,
			cePos,
			end.offset
		];
	} else coll.range = [
		fc.offset,
		cePos,
		cePos
	];
	return coll;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/compose-collection.js
function resolveCollection(CN, ctx, token, onError, tagName, tag) {
	const coll = token.type === "block-map" ? resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection(CN, ctx, token, onError, tag);
	const Coll = coll.constructor;
	if (tagName === "!" || tagName === Coll.tagName) {
		coll.tag = Coll.tagName;
		return coll;
	}
	if (tagName) coll.tag = tagName;
	return coll;
}
function composeCollection(CN, ctx, token, props, onError) {
	const tagToken = props.tag;
	const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
	if (token.type === "block-seq") {
		const { anchor, newlineAfterProp: nl } = props;
		const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
		if (lastProp && (!nl || nl.offset < lastProp.offset)) onError(lastProp, "MISSING_CHAR", "Missing newline after block sequence props");
	}
	const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
	if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.tagName && expType === "seq") return resolveCollection(CN, ctx, token, onError, tagName);
	let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
	if (!tag) {
		const kt = ctx.schema.knownTags[tagName];
		if (kt?.collection === expType) {
			ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
			tag = kt;
		} else {
			if (kt) onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
			else onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
			return resolveCollection(CN, ctx, token, onError, tagName);
		}
	}
	const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
	const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
	const node = isNode(res) ? res : new Scalar(res);
	node.range = coll.range;
	node.tag = tagName;
	if (tag?.format) node.format = tag.format;
	return node;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/resolve-block-scalar.js
function resolveBlockScalar(ctx, scalar, onError) {
	const start = scalar.offset;
	const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
	if (!header) return {
		value: "",
		type: null,
		comment: "",
		range: [
			start,
			start,
			start
		]
	};
	const type = header.mode === ">" ? Scalar.BLOCK_FOLDED : Scalar.BLOCK_LITERAL;
	const lines = scalar.source ? splitLines$1(scalar.source) : [];
	let chompStart = lines.length;
	for (let i = lines.length - 1; i >= 0; --i) {
		const content = lines[i][1];
		if (content === "" || content === "\r") chompStart = i;
		else break;
	}
	if (chompStart === 0) {
		const value = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
		let end = start + header.length;
		if (scalar.source) end += scalar.source.length;
		return {
			value,
			type,
			comment: header.comment,
			range: [
				start,
				end,
				end
			]
		};
	}
	let trimIndent = scalar.indent + header.indent;
	let offset = scalar.offset + header.length;
	let contentStart = 0;
	for (let i = 0; i < chompStart; ++i) {
		const [indent, content] = lines[i];
		if (content === "" || content === "\r") {
			if (header.indent === 0 && indent.length > trimIndent) trimIndent = indent.length;
		} else {
			if (indent.length < trimIndent) onError(offset + indent.length, "MISSING_CHAR", "Block scalars with more-indented leading empty lines must use an explicit indentation indicator");
			if (header.indent === 0) trimIndent = indent.length;
			contentStart = i;
			if (trimIndent === 0 && !ctx.atRoot) onError(offset, "BAD_INDENT", "Block scalar values in collections must be indented");
			break;
		}
		offset += indent.length + content.length + 1;
	}
	for (let i = lines.length - 1; i >= chompStart; --i) if (lines[i][0].length > trimIndent) chompStart = i + 1;
	let value = "";
	let sep = "";
	let prevMoreIndented = false;
	for (let i = 0; i < contentStart; ++i) value += lines[i][0].slice(trimIndent) + "\n";
	for (let i = contentStart; i < chompStart; ++i) {
		let [indent, content] = lines[i];
		offset += indent.length + content.length + 1;
		const crlf = content[content.length - 1] === "\r";
		if (crlf) content = content.slice(0, -1);
		/* istanbul ignore if already caught in lexer */
		if (content && indent.length < trimIndent) {
			const message = `Block scalar lines must not be less indented than their ${header.indent ? "explicit indentation indicator" : "first line"}`;
			onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
			indent = "";
		}
		if (type === Scalar.BLOCK_LITERAL) {
			value += sep + indent.slice(trimIndent) + content;
			sep = "\n";
		} else if (indent.length > trimIndent || content[0] === "	") {
			if (sep === " ") sep = "\n";
			else if (!prevMoreIndented && sep === "\n") sep = "\n\n";
			value += sep + indent.slice(trimIndent) + content;
			sep = "\n";
			prevMoreIndented = true;
		} else if (content === "") if (sep === "\n") value += "\n";
		else sep = "\n";
		else {
			value += sep + content;
			sep = " ";
			prevMoreIndented = false;
		}
	}
	switch (header.chomp) {
		case "-": break;
		case "+":
			for (let i = chompStart; i < lines.length; ++i) value += "\n" + lines[i][0].slice(trimIndent);
			if (value[value.length - 1] !== "\n") value += "\n";
			break;
		default: value += "\n";
	}
	const end = start + header.length + scalar.source.length;
	return {
		value,
		type,
		comment: header.comment,
		range: [
			start,
			end,
			end
		]
	};
}
function parseBlockScalarHeader({ offset, props }, strict, onError) {
	/* istanbul ignore if should not happen */
	if (props[0].type !== "block-scalar-header") {
		onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
		return null;
	}
	const { source } = props[0];
	const mode = source[0];
	let indent = 0;
	let chomp = "";
	let error = -1;
	for (let i = 1; i < source.length; ++i) {
		const ch = source[i];
		if (!chomp && (ch === "-" || ch === "+")) chomp = ch;
		else {
			const n = Number(ch);
			if (!indent && n) indent = n;
			else if (error === -1) error = offset + i;
		}
	}
	if (error !== -1) onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
	let hasSpace = false;
	let comment = "";
	let length = source.length;
	for (let i = 1; i < props.length; ++i) {
		const token = props[i];
		switch (token.type) {
			case "space": hasSpace = true;
			case "newline":
				length += token.source.length;
				break;
			case "comment":
				if (strict && !hasSpace) onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
				length += token.source.length;
				comment = token.source.substring(1);
				break;
			case "error":
				onError(token, "UNEXPECTED_TOKEN", token.message);
				length += token.source.length;
				break;
			default: {
				onError(token, "UNEXPECTED_TOKEN", `Unexpected token in block scalar header: ${token.type}`);
				const ts = token.source;
				if (ts && typeof ts === "string") length += ts.length;
			}
		}
	}
	return {
		mode,
		indent,
		chomp,
		comment,
		length
	};
}
/** @returns Array of lines split up as `[indent, content]` */
function splitLines$1(source) {
	const split = source.split(/\n( *)/);
	const first = split[0];
	const m = first.match(/^( *)/);
	const lines = [m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first]];
	for (let i = 1; i < split.length; i += 2) lines.push([split[i], split[i + 1]]);
	return lines;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/resolve-flow-scalar.js
function resolveFlowScalar(scalar, strict, onError) {
	const { offset, type, source, end } = scalar;
	let _type;
	let value;
	const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
	switch (type) {
		case "scalar":
			_type = Scalar.PLAIN;
			value = plainValue(source, _onError);
			break;
		case "single-quoted-scalar":
			_type = Scalar.QUOTE_SINGLE;
			value = singleQuotedValue(source, _onError);
			break;
		case "double-quoted-scalar":
			_type = Scalar.QUOTE_DOUBLE;
			value = doubleQuotedValue(source, _onError);
			break;
		default:
			onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
			return {
				value: "",
				type: null,
				comment: "",
				range: [
					offset,
					offset + source.length,
					offset + source.length
				]
			};
	}
	const valueEnd = offset + source.length;
	const re = resolveEnd(end, valueEnd, strict, onError);
	return {
		value,
		type: _type,
		comment: re.comment,
		range: [
			offset,
			valueEnd,
			re.offset
		]
	};
}
function plainValue(source, onError) {
	let badChar = "";
	switch (source[0]) {
		case "	":
			badChar = "a tab character";
			break;
		case ",":
			badChar = "flow indicator character ,";
			break;
		case "%":
			badChar = "directive indicator character %";
			break;
		case "|":
		case ">":
			badChar = `block scalar indicator ${source[0]}`;
			break;
		case "@":
		case "`":
			badChar = `reserved character ${source[0]}`;
			break;
	}
	if (badChar) onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
	return foldLines(source);
}
function singleQuotedValue(source, onError) {
	if (source[source.length - 1] !== "'" || source.length === 1) onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
	return foldLines(source.slice(1, -1)).replace(/''/g, "'");
}
function foldLines(source) {
	/**
	* The negative lookbehind here and in the `re` RegExp is to
	* prevent causing a polynomial search time in certain cases.
	*
	* The try-catch is for Safari, which doesn't support this yet:
	* https://caniuse.com/js-regexp-lookbehind
	*/
	let first, line;
	try {
		first = /* @__PURE__ */ new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
		line = /* @__PURE__ */ new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
	} catch {
		first = /(.*?)[ \t]*\r?\n/sy;
		line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
	}
	let match = first.exec(source);
	if (!match) return source;
	let res = match[1];
	let sep = " ";
	let pos = first.lastIndex;
	line.lastIndex = pos;
	while (match = line.exec(source)) {
		if (match[1] === "") if (sep === "\n") res += sep;
		else sep = "\n";
		else {
			res += sep + match[1];
			sep = " ";
		}
		pos = line.lastIndex;
	}
	const last = /[ \t]*(.*)/sy;
	last.lastIndex = pos;
	match = last.exec(source);
	return res + sep + (match?.[1] ?? "");
}
function doubleQuotedValue(source, onError) {
	let res = "";
	for (let i = 1; i < source.length - 1; ++i) {
		const ch = source[i];
		if (ch === "\r" && source[i + 1] === "\n") continue;
		if (ch === "\n") {
			const { fold, offset } = foldNewline(source, i);
			res += fold;
			i = offset;
		} else if (ch === "\\") {
			let next = source[++i];
			const cc = escapeCodes[next];
			if (cc) res += cc;
			else if (next === "\n") {
				next = source[i + 1];
				while (next === " " || next === "	") next = source[++i + 1];
			} else if (next === "\r" && source[i + 1] === "\n") {
				next = source[++i + 1];
				while (next === " " || next === "	") next = source[++i + 1];
			} else if (next === "x" || next === "u" || next === "U") {
				const length = {
					x: 2,
					u: 4,
					U: 8
				}[next];
				res += parseCharCode(source, i + 1, length, onError);
				i += length;
			} else {
				const raw = source.substr(i - 1, 2);
				onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
				res += raw;
			}
		} else if (ch === " " || ch === "	") {
			const wsStart = i;
			let next = source[i + 1];
			while (next === " " || next === "	") next = source[++i + 1];
			if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n")) res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
		} else res += ch;
	}
	if (source[source.length - 1] !== "\"" || source.length === 1) onError(source.length, "MISSING_CHAR", "Missing closing \"quote");
	return res;
}
/**
* Fold a single newline into a space, multiple newlines to N - 1 newlines.
* Presumes `source[offset] === '\n'`
*/
function foldNewline(source, offset) {
	let fold = "";
	let ch = source[offset + 1];
	while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
		if (ch === "\r" && source[offset + 2] !== "\n") break;
		if (ch === "\n") fold += "\n";
		offset += 1;
		ch = source[offset + 1];
	}
	if (!fold) fold = " ";
	return {
		fold,
		offset
	};
}
var escapeCodes = {
	"0": "\0",
	a: "\x07",
	b: "\b",
	e: "\x1B",
	f: "\f",
	n: "\n",
	r: "\r",
	t: "	",
	v: "\v",
	N: "",
	_: "\xA0",
	L: "\u2028",
	P: "\u2029",
	" ": " ",
	"\"": "\"",
	"/": "/",
	"\\": "\\",
	"	": "	"
};
function parseCharCode(source, offset, length, onError) {
	const cc = source.substr(offset, length);
	const code = cc.length === length && /^[0-9a-fA-F]+$/.test(cc) ? parseInt(cc, 16) : NaN;
	if (isNaN(code)) {
		const raw = source.substr(offset - 2, length + 2);
		onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
		return raw;
	}
	return String.fromCodePoint(code);
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/compose-scalar.js
function composeScalar(ctx, token, tagToken, onError) {
	const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar(ctx, token, onError) : resolveFlowScalar(token, ctx.options.strict, onError);
	const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
	let tag;
	if (ctx.options.stringKeys && ctx.atKey) tag = ctx.schema[SCALAR$1];
	else if (tagName) tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
	else if (token.type === "scalar") tag = findScalarTagByTest(ctx, value, token, onError);
	else tag = ctx.schema[SCALAR$1];
	let scalar;
	try {
		const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
		scalar = isScalar$1(res) ? res : new Scalar(res);
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
		scalar = new Scalar(value);
	}
	scalar.range = range;
	scalar.source = value;
	if (type) scalar.type = type;
	if (tagName) scalar.tag = tagName;
	if (tag.format) scalar.format = tag.format;
	if (comment) scalar.comment = comment;
	return scalar;
}
function findScalarTagByName(schema, value, tagName, tagToken, onError) {
	if (tagName === "!") return schema[SCALAR$1];
	const matchWithTest = [];
	for (const tag of schema.tags) if (!tag.collection && tag.tag === tagName) if (tag.default && tag.test) matchWithTest.push(tag);
	else return tag;
	for (const tag of matchWithTest) if (tag.test?.test(value)) return tag;
	const kt = schema.knownTags[tagName];
	if (kt && !kt.collection) {
		schema.tags.push(Object.assign({}, kt, {
			default: false,
			test: void 0
		}));
		return kt;
	}
	onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
	return schema[SCALAR$1];
}
function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
	const tag = schema.tags.find((tag) => (tag.default === true || atKey && tag.default === "key") && tag.test?.test(value)) || schema[SCALAR$1];
	if (schema.compat) {
		const compat = schema.compat.find((tag) => tag.default && tag.test?.test(value)) ?? schema[SCALAR$1];
		if (tag.tag !== compat.tag) onError(token, "TAG_RESOLVE_FAILED", `Value may be parsed as either ${directives.tagString(tag.tag)} or ${directives.tagString(compat.tag)}`, true);
	}
	return tag;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/util-empty-scalar-position.js
function emptyScalarPosition(offset, before, pos) {
	if (before) {
		pos ?? (pos = before.length);
		for (let i = pos - 1; i >= 0; --i) {
			let st = before[i];
			switch (st.type) {
				case "space":
				case "comment":
				case "newline":
					offset -= st.source.length;
					continue;
			}
			st = before[++i];
			while (st?.type === "space") {
				offset += st.source.length;
				st = before[++i];
			}
			break;
		}
	}
	return offset;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/compose-node.js
var CN = {
	composeNode,
	composeEmptyNode
};
function composeNode(ctx, token, props, onError) {
	const atKey = ctx.atKey;
	const { spaceBefore, comment, anchor, tag } = props;
	let node;
	let isSrcToken = true;
	switch (token.type) {
		case "alias":
			node = composeAlias(ctx, token, onError);
			if (anchor || tag) onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
			break;
		case "scalar":
		case "single-quoted-scalar":
		case "double-quoted-scalar":
		case "block-scalar":
			node = composeScalar(ctx, token, tag, onError);
			if (anchor) node.anchor = anchor.source.substring(1);
			break;
		case "block-map":
		case "block-seq":
		case "flow-collection":
			try {
				node = composeCollection(CN, ctx, token, props, onError);
				if (anchor) node.anchor = anchor.source.substring(1);
			} catch (error) {
				onError(token, "RESOURCE_EXHAUSTION", error instanceof Error ? error.message : String(error));
			}
			break;
		default:
			onError(token, "UNEXPECTED_TOKEN", token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`);
			isSrcToken = false;
	}
	node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
	if (anchor && node.anchor === "") onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
	if (atKey && ctx.options.stringKeys && (!isScalar$1(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) onError(tag ?? token, "NON_STRING_KEY", "With stringKeys, all keys must be strings");
	if (spaceBefore) node.spaceBefore = true;
	if (comment) if (token.type === "scalar" && token.source === "") node.comment = comment;
	else node.commentBefore = comment;
	if (ctx.options.keepSourceTokens && isSrcToken) node.srcToken = token;
	return node;
}
function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
	const node = composeScalar(ctx, {
		type: "scalar",
		offset: emptyScalarPosition(offset, before, pos),
		indent: -1,
		source: ""
	}, tag, onError);
	if (anchor) {
		node.anchor = anchor.source.substring(1);
		if (node.anchor === "") onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
	}
	if (spaceBefore) node.spaceBefore = true;
	if (comment) {
		node.comment = comment;
		node.range[2] = end;
	}
	return node;
}
function composeAlias({ options }, { offset, source, end }, onError) {
	const alias = new Alias(source.substring(1));
	if (alias.source === "") onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
	if (alias.source.endsWith(":")) onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
	const valueEnd = offset + source.length;
	const re = resolveEnd(end, valueEnd, options.strict, onError);
	alias.range = [
		offset,
		valueEnd,
		re.offset
	];
	if (re.comment) alias.comment = re.comment;
	return alias;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/compose-doc.js
function composeDoc(options, directives, { offset, start, value, end }, onError) {
	const doc = new Document(void 0, Object.assign({ _directives: directives }, options));
	const ctx = {
		atKey: false,
		atRoot: true,
		directives: doc.directives,
		options: doc.options,
		schema: doc.schema
	};
	const props = resolveProps(start, {
		indicator: "doc-start",
		next: value ?? end?.[0],
		offset,
		onError,
		parentIndent: 0,
		startOnNewline: true
	});
	if (props.found) {
		doc.directives.docStart = true;
		if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline) onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
	}
	doc.contents = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
	const contentEnd = doc.contents.range[2];
	const re = resolveEnd(end, contentEnd, false, onError);
	if (re.comment) doc.comment = re.comment;
	doc.range = [
		offset,
		contentEnd,
		re.offset
	];
	return doc;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/compose/composer.js
function getErrorPos(src) {
	if (typeof src === "number") return [src, src + 1];
	if (Array.isArray(src)) return src.length === 2 ? src : [src[0], src[1]];
	const { offset, source } = src;
	return [offset, offset + (typeof source === "string" ? source.length : 1)];
}
function parsePrelude(prelude) {
	let comment = "";
	let atComment = false;
	let afterEmptyLine = false;
	for (let i = 0; i < prelude.length; ++i) {
		const source = prelude[i];
		switch (source[0]) {
			case "#":
				comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
				atComment = true;
				afterEmptyLine = false;
				break;
			case "%":
				if (prelude[i + 1]?.[0] !== "#") i += 1;
				atComment = false;
				break;
			default:
				if (!atComment) afterEmptyLine = true;
				atComment = false;
		}
	}
	return {
		comment,
		afterEmptyLine
	};
}
/**
* Compose a stream of CST nodes into a stream of YAML Documents.
*
* ```ts
* import { Composer, Parser } from 'yaml'
*
* const src: string = ...
* const tokens = new Parser().parse(src)
* const docs = new Composer().compose(tokens)
* ```
*/
var Composer = class {
	constructor(options = {}) {
		this.doc = null;
		this.atDirectives = false;
		this.prelude = [];
		this.errors = [];
		this.warnings = [];
		this.onError = (source, code, message, warning) => {
			const pos = getErrorPos(source);
			if (warning) this.warnings.push(new YAMLWarning(pos, code, message));
			else this.errors.push(new YAMLParseError(pos, code, message));
		};
		this.directives = new Directives({ version: options.version || "1.2" });
		this.options = options;
	}
	decorate(doc, afterDoc) {
		const { comment, afterEmptyLine } = parsePrelude(this.prelude);
		if (comment) {
			const dc = doc.contents;
			if (afterDoc) doc.comment = doc.comment ? `${doc.comment}\n${comment}` : comment;
			else if (afterEmptyLine || doc.directives.docStart || !dc) doc.commentBefore = comment;
			else if (isCollection$1(dc) && !dc.flow && dc.items.length > 0) {
				let it = dc.items[0];
				if (isPair(it)) it = it.key;
				const cb = it.commentBefore;
				it.commentBefore = cb ? `${comment}\n${cb}` : comment;
			} else {
				const cb = dc.commentBefore;
				dc.commentBefore = cb ? `${comment}\n${cb}` : comment;
			}
		}
		if (afterDoc) {
			Array.prototype.push.apply(doc.errors, this.errors);
			Array.prototype.push.apply(doc.warnings, this.warnings);
		} else {
			doc.errors = this.errors;
			doc.warnings = this.warnings;
		}
		this.prelude = [];
		this.errors = [];
		this.warnings = [];
	}
	/**
	* Current stream status information.
	*
	* Mostly useful at the end of input for an empty stream.
	*/
	streamInfo() {
		return {
			comment: parsePrelude(this.prelude).comment,
			directives: this.directives,
			errors: this.errors,
			warnings: this.warnings
		};
	}
	/**
	* Compose tokens into documents.
	*
	* @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
	* @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
	*/
	*compose(tokens, forceDoc = false, endOffset = -1) {
		for (const token of tokens) yield* this.next(token);
		yield* this.end(forceDoc, endOffset);
	}
	/** Advance the composer by one CST token. */
	*next(token) {
		switch (token.type) {
			case "directive":
				this.directives.add(token.source, (offset, message, warning) => {
					const pos = getErrorPos(token);
					pos[0] += offset;
					this.onError(pos, "BAD_DIRECTIVE", message, warning);
				});
				this.prelude.push(token.source);
				this.atDirectives = true;
				break;
			case "document": {
				const doc = composeDoc(this.options, this.directives, token, this.onError);
				if (this.atDirectives && !doc.directives.docStart) this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
				this.decorate(doc, false);
				if (this.doc) yield this.doc;
				this.doc = doc;
				this.atDirectives = false;
				break;
			}
			case "byte-order-mark":
			case "space": break;
			case "comment":
			case "newline":
				this.prelude.push(token.source);
				break;
			case "error": {
				const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
				const error = new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
				if (this.atDirectives || !this.doc) this.errors.push(error);
				else this.doc.errors.push(error);
				break;
			}
			case "doc-end": {
				if (!this.doc) {
					this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", "Unexpected doc-end without preceding document"));
					break;
				}
				this.doc.directives.docEnd = true;
				const end = resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
				this.decorate(this.doc, true);
				if (end.comment) {
					const dc = this.doc.comment;
					this.doc.comment = dc ? `${dc}\n${end.comment}` : end.comment;
				}
				this.doc.range[2] = end.offset;
				break;
			}
			default: this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
		}
	}
	/**
	* Call at end of input to yield any remaining document.
	*
	* @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
	* @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
	*/
	*end(forceDoc = false, endOffset = -1) {
		if (this.doc) {
			this.decorate(this.doc, true);
			yield this.doc;
			this.doc = null;
		} else if (forceDoc) {
			const doc = new Document(void 0, Object.assign({ _directives: this.directives }, this.options));
			if (this.atDirectives) this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
			doc.range = [
				0,
				endOffset,
				endOffset
			];
			this.decorate(doc, false);
			yield doc;
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/parse/cst-scalar.js
function resolveAsScalar(token, strict = true, onError) {
	if (token) {
		const _onError = (pos, code, message) => {
			const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
			if (onError) onError(offset, code, message);
			else throw new YAMLParseError([offset, offset + 1], code, message);
		};
		switch (token.type) {
			case "scalar":
			case "single-quoted-scalar":
			case "double-quoted-scalar": return resolveFlowScalar(token, strict, _onError);
			case "block-scalar": return resolveBlockScalar({ options: { strict } }, token, _onError);
		}
	}
	return null;
}
/**
* Create a new scalar token with `value`
*
* Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
* as this function does not support any schema operations and won't check for such conflicts.
*
* @param value The string representation of the value, which will have its content properly indented.
* @param context.end Comments and whitespace after the end of the value, or after the block scalar header. If undefined, a newline will be added.
* @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
* @param context.indent The indent level of the token.
* @param context.inFlow Is this scalar within a flow collection? This may affect the resolved type of the token's value.
* @param context.offset The offset position of the token.
* @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
*/
function createScalarToken(value, context) {
	const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
	const source = stringifyString({
		type,
		value
	}, {
		implicitKey,
		indent: indent > 0 ? " ".repeat(indent) : "",
		inFlow,
		options: {
			blockQuote: true,
			lineWidth: -1
		}
	});
	const end = context.end ?? [{
		type: "newline",
		offset: -1,
		indent,
		source: "\n"
	}];
	switch (source[0]) {
		case "|":
		case ">": {
			const he = source.indexOf("\n");
			const head = source.substring(0, he);
			const body = source.substring(he + 1) + "\n";
			const props = [{
				type: "block-scalar-header",
				offset,
				indent,
				source: head
			}];
			if (!addEndtoBlockProps(props, end)) props.push({
				type: "newline",
				offset: -1,
				indent,
				source: "\n"
			});
			return {
				type: "block-scalar",
				offset,
				indent,
				props,
				source: body
			};
		}
		case "\"": return {
			type: "double-quoted-scalar",
			offset,
			indent,
			source,
			end
		};
		case "'": return {
			type: "single-quoted-scalar",
			offset,
			indent,
			source,
			end
		};
		default: return {
			type: "scalar",
			offset,
			indent,
			source,
			end
		};
	}
}
/**
* Set the value of `token` to the given string `value`, overwriting any previous contents and type that it may have.
*
* Best efforts are made to retain any comments previously associated with the `token`,
* though all contents within a collection's `items` will be overwritten.
*
* Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
* as this function does not support any schema operations and won't check for such conflicts.
*
* @param token Any token. If it does not include an `indent` value, the value will be stringified as if it were an implicit key.
* @param value The string representation of the value, which will have its content properly indented.
* @param context.afterKey In most cases, values after a key should have an additional level of indentation.
* @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
* @param context.inFlow Being within a flow collection may affect the resolved type of the token's value.
* @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
*/
function setScalarValue(token, value, context = {}) {
	let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
	let indent = "indent" in token ? token.indent : null;
	if (afterKey && typeof indent === "number") indent += 2;
	if (!type) switch (token.type) {
		case "single-quoted-scalar":
			type = "QUOTE_SINGLE";
			break;
		case "double-quoted-scalar":
			type = "QUOTE_DOUBLE";
			break;
		case "block-scalar": {
			const header = token.props[0];
			if (header.type !== "block-scalar-header") throw new Error("Invalid block scalar header");
			type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
			break;
		}
		default: type = "PLAIN";
	}
	const source = stringifyString({
		type,
		value
	}, {
		implicitKey: implicitKey || indent === null,
		indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
		inFlow,
		options: {
			blockQuote: true,
			lineWidth: -1
		}
	});
	switch (source[0]) {
		case "|":
		case ">":
			setBlockScalarValue(token, source);
			break;
		case "\"":
			setFlowScalarValue(token, source, "double-quoted-scalar");
			break;
		case "'":
			setFlowScalarValue(token, source, "single-quoted-scalar");
			break;
		default: setFlowScalarValue(token, source, "scalar");
	}
}
function setBlockScalarValue(token, source) {
	const he = source.indexOf("\n");
	const head = source.substring(0, he);
	const body = source.substring(he + 1) + "\n";
	if (token.type === "block-scalar") {
		const header = token.props[0];
		if (header.type !== "block-scalar-header") throw new Error("Invalid block scalar header");
		header.source = head;
		token.source = body;
	} else {
		const { offset } = token;
		const indent = "indent" in token ? token.indent : -1;
		const props = [{
			type: "block-scalar-header",
			offset,
			indent,
			source: head
		}];
		if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0)) props.push({
			type: "newline",
			offset: -1,
			indent,
			source: "\n"
		});
		for (const key of Object.keys(token)) if (key !== "type" && key !== "offset") delete token[key];
		Object.assign(token, {
			type: "block-scalar",
			indent,
			props,
			source: body
		});
	}
}
/** @returns `true` if last token is a newline */
function addEndtoBlockProps(props, end) {
	if (end) for (const st of end) switch (st.type) {
		case "space":
		case "comment":
			props.push(st);
			break;
		case "newline":
			props.push(st);
			return true;
	}
	return false;
}
function setFlowScalarValue(token, source, type) {
	switch (token.type) {
		case "scalar":
		case "double-quoted-scalar":
		case "single-quoted-scalar":
			token.type = type;
			token.source = source;
			break;
		case "block-scalar": {
			const end = token.props.slice(1);
			let oa = source.length;
			if (token.props[0].type === "block-scalar-header") oa -= token.props[0].source.length;
			for (const tok of end) tok.offset += oa;
			delete token.props;
			Object.assign(token, {
				type,
				source,
				end
			});
			break;
		}
		case "block-map":
		case "block-seq": {
			const nl = {
				type: "newline",
				offset: token.offset + source.length,
				indent: token.indent,
				source: "\n"
			};
			delete token.items;
			Object.assign(token, {
				type,
				source,
				end: [nl]
			});
			break;
		}
		default: {
			const indent = "indent" in token ? token.indent : -1;
			const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
			for (const key of Object.keys(token)) if (key !== "type" && key !== "offset") delete token[key];
			Object.assign(token, {
				type,
				indent,
				source,
				end
			});
		}
	}
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/parse/cst-stringify.js
/**
* Stringify a CST document, token, or collection item
*
* Fair warning: This applies no validation whatsoever, and
* simply concatenates the sources in their logical order.
*/
var stringify$1 = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
function stringifyToken(token) {
	switch (token.type) {
		case "block-scalar": {
			let res = "";
			for (const tok of token.props) res += stringifyToken(tok);
			return res + token.source;
		}
		case "block-map":
		case "block-seq": {
			let res = "";
			for (const item of token.items) res += stringifyItem(item);
			return res;
		}
		case "flow-collection": {
			let res = token.start.source;
			for (const item of token.items) res += stringifyItem(item);
			for (const st of token.end) res += st.source;
			return res;
		}
		case "document": {
			let res = stringifyItem(token);
			if (token.end) for (const st of token.end) res += st.source;
			return res;
		}
		default: {
			let res = token.source;
			if ("end" in token && token.end) for (const st of token.end) res += st.source;
			return res;
		}
	}
}
function stringifyItem({ start, key, sep, value }) {
	let res = "";
	for (const st of start) res += st.source;
	if (key) res += stringifyToken(key);
	if (sep) for (const st of sep) res += st.source;
	if (value) res += stringifyToken(value);
	return res;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/parse/cst-visit.js
var BREAK = Symbol("break visit");
var SKIP = Symbol("skip children");
var REMOVE = Symbol("remove item");
/**
* Apply a visitor to a CST document or item.
*
* Walks through the tree (depth-first) starting from the root, calling a
* `visitor` function with two arguments when entering each item:
*   - `item`: The current item, which included the following members:
*     - `start: SourceToken[]` – Source tokens before the key or value,
*       possibly including its anchor or tag.
*     - `key?: Token | null` – Set for pair values. May then be `null`, if
*       the key before the `:` separator is empty.
*     - `sep?: SourceToken[]` – Source tokens between the key and the value,
*       which should include the `:` map value indicator if `value` is set.
*     - `value?: Token` – The value of a sequence item, or of a map pair.
*   - `path`: The steps from the root to the current node, as an array of
*     `['key' | 'value', number]` tuples.
*
* The return value of the visitor may be used to control the traversal:
*   - `undefined` (default): Do nothing and continue
*   - `visit.SKIP`: Do not visit the children of this token, continue with
*      next sibling
*   - `visit.BREAK`: Terminate traversal completely
*   - `visit.REMOVE`: Remove the current item, then continue with the next one
*   - `number`: Set the index of the next step. This is useful especially if
*     the index of the current token has changed.
*   - `function`: Define the next visitor for this item. After the original
*     visitor is called on item entry, next visitors are called after handling
*     a non-empty `key` and when exiting the item.
*/
function visit(cst, visitor) {
	if ("type" in cst && cst.type === "document") cst = {
		start: cst.start,
		value: cst.value
	};
	_visit(Object.freeze([]), cst, visitor);
}
/** Terminate visit traversal completely */
visit.BREAK = BREAK;
/** Do not visit the children of the current item */
visit.SKIP = SKIP;
/** Remove the current item */
visit.REMOVE = REMOVE;
/** Find the item at `path` from `cst` as the root */
visit.itemAtPath = (cst, path) => {
	let item = cst;
	for (const [field, index] of path) {
		const tok = item?.[field];
		if (tok && "items" in tok) item = tok.items[index];
		else return void 0;
	}
	return item;
};
/**
* Get the immediate parent collection of the item at `path` from `cst` as the root.
*
* Throws an error if the collection is not found, which should never happen if the item itself exists.
*/
visit.parentCollection = (cst, path) => {
	const parent = visit.itemAtPath(cst, path.slice(0, -1));
	const field = path[path.length - 1][0];
	const coll = parent?.[field];
	if (coll && "items" in coll) return coll;
	throw new Error("Parent collection not found");
};
function _visit(path, item, visitor) {
	let ctrl = visitor(item, path);
	if (typeof ctrl === "symbol") return ctrl;
	for (const field of ["key", "value"]) {
		const token = item[field];
		if (token && "items" in token) {
			for (let i = 0; i < token.items.length; ++i) {
				const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
				if (typeof ci === "number") i = ci - 1;
				else if (ci === BREAK) return BREAK;
				else if (ci === REMOVE) {
					token.items.splice(i, 1);
					i -= 1;
				}
			}
			if (typeof ctrl === "function" && field === "key") ctrl = ctrl(item, path);
		}
	}
	return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/parse/cst.js
var cst_exports = /* @__PURE__ */ __exportAll({
	BOM: () => "﻿",
	DOCUMENT: () => "",
	FLOW_END: () => "",
	SCALAR: () => "",
	createScalarToken: () => createScalarToken,
	isCollection: () => isCollection,
	isScalar: () => isScalar,
	prettyToken: () => prettyToken,
	resolveAsScalar: () => resolveAsScalar,
	setScalarValue: () => setScalarValue,
	stringify: () => stringify$1,
	tokenType: () => tokenType,
	visit: () => visit
});
/** @returns `true` if `token` is a flow or block collection */
var isCollection = (token) => !!token && "items" in token;
/** @returns `true` if `token` is a flow or block scalar; not an alias */
var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
/* istanbul ignore next */
/** Get a printable representation of a lexer token */
function prettyToken(token) {
	switch (token) {
		case "﻿": return "<BOM>";
		case "": return "<DOC>";
		case "": return "<FLOW_END>";
		case "": return "<SCALAR>";
		default: return JSON.stringify(token);
	}
}
/** Identify the type of a lexer token. May return `null` for unknown tokens. */
function tokenType(source) {
	switch (source) {
		case "﻿": return "byte-order-mark";
		case "": return "doc-mode";
		case "": return "flow-error-end";
		case "": return "scalar";
		case "---": return "doc-start";
		case "...": return "doc-end";
		case "":
		case "\n":
		case "\r\n": return "newline";
		case "-": return "seq-item-ind";
		case "?": return "explicit-key-ind";
		case ":": return "map-value-ind";
		case "{": return "flow-map-start";
		case "}": return "flow-map-end";
		case "[": return "flow-seq-start";
		case "]": return "flow-seq-end";
		case ",": return "comma";
	}
	switch (source[0]) {
		case " ":
		case "	": return "space";
		case "#": return "comment";
		case "%": return "directive-line";
		case "*": return "alias";
		case "&": return "anchor";
		case "!": return "tag";
		case "'": return "single-quoted-scalar";
		case "\"": return "double-quoted-scalar";
		case "|":
		case ">": return "block-scalar-header";
	}
	return null;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/parse/lexer.js
function isEmpty(ch) {
	switch (ch) {
		case void 0:
		case " ":
		case "\n":
		case "\r":
		case "	": return true;
		default: return false;
	}
}
var hexDigits = /* @__PURE__ */ new Set("0123456789ABCDEFabcdef");
var tagChars = /* @__PURE__ */ new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
var flowIndicatorChars = /* @__PURE__ */ new Set(",[]{}");
var invalidAnchorChars = /* @__PURE__ */ new Set(" ,[]{}\n\r	");
var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
/**
* Splits an input string into lexical tokens, i.e. smaller strings that are
* easily identifiable by `tokens.tokenType()`.
*
* Lexing starts always in a "stream" context. Incomplete input may be buffered
* until a complete token can be emitted.
*
* In addition to slices of the original input, the following control characters
* may also be emitted:
*
* - `\x02` (Start of Text): A document starts with the next token
* - `\x18` (Cancel): Unexpected end of flow-mode (indicates an error)
* - `\x1f` (Unit Separator): Next token is a scalar value
* - `\u{FEFF}` (Byte order mark): Emitted separately outside documents
*/
var Lexer = class {
	constructor() {
		/**
		* Flag indicating whether the end of the current buffer marks the end of
		* all input
		*/
		this.atEnd = false;
		/**
		* Explicit indent set in block scalar header, as an offset from the current
		* minimum indent, so e.g. set to 1 from a header `|2+`. Set to -1 if not
		* explicitly set.
		*/
		this.blockScalarIndent = -1;
		/**
		* Block scalars that include a + (keep) chomping indicator in their header
		* include trailing empty lines, which are otherwise excluded from the
		* scalar's contents.
		*/
		this.blockScalarKeep = false;
		/** Current input */
		this.buffer = "";
		/**
		* Flag noting whether the map value indicator : can immediately follow this
		* node within a flow context.
		*/
		this.flowKey = false;
		/** Count of surrounding flow collection levels. */
		this.flowLevel = 0;
		/**
		* Minimum level of indentation required for next lines to be parsed as a
		* part of the current scalar value.
		*/
		this.indentNext = 0;
		/** Indentation level of the current line. */
		this.indentValue = 0;
		/** Position of the next \n character. */
		this.lineEndPos = null;
		/** Stores the state of the lexer if reaching the end of incpomplete input */
		this.next = null;
		/** A pointer to `buffer`; the current position of the lexer. */
		this.pos = 0;
	}
	/**
	* Generate YAML tokens from the `source` string. If `incomplete`,
	* a part of the last line may be left as a buffer for the next call.
	*
	* @returns A generator of lexical tokens
	*/
	*lex(source, incomplete = false) {
		if (source) {
			if (typeof source !== "string") throw TypeError("source is not a string");
			this.buffer = this.buffer ? this.buffer + source : source;
			this.lineEndPos = null;
		}
		this.atEnd = !incomplete;
		let next = this.next ?? "stream";
		while (next && (incomplete || this.hasChars(1))) next = yield* this.parseNext(next);
	}
	atLineEnd() {
		let i = this.pos;
		let ch = this.buffer[i];
		while (ch === " " || ch === "	") ch = this.buffer[++i];
		if (!ch || ch === "#" || ch === "\n") return true;
		if (ch === "\r") return this.buffer[i + 1] === "\n";
		return false;
	}
	charAt(n) {
		return this.buffer[this.pos + n];
	}
	continueScalar(offset) {
		let ch = this.buffer[offset];
		if (this.indentNext > 0) {
			let indent = 0;
			while (ch === " ") ch = this.buffer[++indent + offset];
			if (ch === "\r") {
				const next = this.buffer[indent + offset + 1];
				if (next === "\n" || !next && !this.atEnd) return offset + indent + 1;
			}
			return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
		}
		if (ch === "-" || ch === ".") {
			const dt = this.buffer.substr(offset, 3);
			if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3])) return -1;
		}
		return offset;
	}
	getLine() {
		let end = this.lineEndPos;
		if (typeof end !== "number" || end !== -1 && end < this.pos) {
			end = this.buffer.indexOf("\n", this.pos);
			this.lineEndPos = end;
		}
		if (end === -1) return this.atEnd ? this.buffer.substring(this.pos) : null;
		if (this.buffer[end - 1] === "\r") end -= 1;
		return this.buffer.substring(this.pos, end);
	}
	hasChars(n) {
		return this.pos + n <= this.buffer.length;
	}
	setNext(state) {
		this.buffer = this.buffer.substring(this.pos);
		this.pos = 0;
		this.lineEndPos = null;
		this.next = state;
		return null;
	}
	peek(n) {
		return this.buffer.substr(this.pos, n);
	}
	*parseNext(next) {
		switch (next) {
			case "stream": return yield* this.parseStream();
			case "line-start": return yield* this.parseLineStart();
			case "block-start": return yield* this.parseBlockStart();
			case "doc": return yield* this.parseDocument();
			case "flow": return yield* this.parseFlowCollection();
			case "quoted-scalar": return yield* this.parseQuotedScalar();
			case "block-scalar": return yield* this.parseBlockScalar();
			case "plain-scalar": return yield* this.parsePlainScalar();
		}
	}
	*parseStream() {
		let line = this.getLine();
		if (line === null) return this.setNext("stream");
		if (line[0] === "﻿") {
			yield* this.pushCount(1);
			line = line.substring(1);
		}
		if (line[0] === "%") {
			let dirEnd = line.length;
			let cs = line.indexOf("#");
			while (cs !== -1) {
				const ch = line[cs - 1];
				if (ch === " " || ch === "	") {
					dirEnd = cs - 1;
					break;
				} else cs = line.indexOf("#", cs + 1);
			}
			while (true) {
				const ch = line[dirEnd - 1];
				if (ch === " " || ch === "	") dirEnd -= 1;
				else break;
			}
			const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
			yield* this.pushCount(line.length - n);
			this.pushNewline();
			return "stream";
		}
		if (this.atLineEnd()) {
			const sp = yield* this.pushSpaces(true);
			yield* this.pushCount(line.length - sp);
			yield* this.pushNewline();
			return "stream";
		}
		yield "";
		return yield* this.parseLineStart();
	}
	*parseLineStart() {
		const ch = this.charAt(0);
		if (!ch && !this.atEnd) return this.setNext("line-start");
		if (ch === "-" || ch === ".") {
			if (!this.atEnd && !this.hasChars(4)) return this.setNext("line-start");
			const s = this.peek(3);
			if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
				yield* this.pushCount(3);
				this.indentValue = 0;
				this.indentNext = 0;
				return s === "---" ? "doc" : "stream";
			}
		}
		this.indentValue = yield* this.pushSpaces(false);
		if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1))) this.indentNext = this.indentValue;
		return yield* this.parseBlockStart();
	}
	*parseBlockStart() {
		const [ch0, ch1] = this.peek(2);
		if (!ch1 && !this.atEnd) return this.setNext("block-start");
		if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
			const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
			this.indentNext = this.indentValue + 1;
			this.indentValue += n;
			return yield* this.parseBlockStart();
		}
		return "doc";
	}
	*parseDocument() {
		yield* this.pushSpaces(true);
		const line = this.getLine();
		if (line === null) return this.setNext("doc");
		let n = yield* this.pushIndicators();
		switch (line[n]) {
			case "#": yield* this.pushCount(line.length - n);
			case void 0:
				yield* this.pushNewline();
				return yield* this.parseLineStart();
			case "{":
			case "[":
				yield* this.pushCount(1);
				this.flowKey = false;
				this.flowLevel = 1;
				return "flow";
			case "}":
			case "]":
				yield* this.pushCount(1);
				return "doc";
			case "*":
				yield* this.pushUntil(isNotAnchorChar);
				return "doc";
			case "\"":
			case "'": return yield* this.parseQuotedScalar();
			case "|":
			case ">":
				n += yield* this.parseBlockScalarHeader();
				n += yield* this.pushSpaces(true);
				yield* this.pushCount(line.length - n);
				yield* this.pushNewline();
				return yield* this.parseBlockScalar();
			default: return yield* this.parsePlainScalar();
		}
	}
	*parseFlowCollection() {
		let nl, sp;
		let indent = -1;
		do {
			nl = yield* this.pushNewline();
			if (nl > 0) {
				sp = yield* this.pushSpaces(false);
				this.indentValue = indent = sp;
			} else sp = 0;
			sp += yield* this.pushSpaces(true);
		} while (nl + sp > 0);
		const line = this.getLine();
		if (line === null) return this.setNext("flow");
		if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
			if (!(indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}"))) {
				this.flowLevel = 0;
				yield "";
				return yield* this.parseLineStart();
			}
		}
		let n = 0;
		while (line[n] === ",") {
			n += yield* this.pushCount(1);
			n += yield* this.pushSpaces(true);
			this.flowKey = false;
		}
		n += yield* this.pushIndicators();
		switch (line[n]) {
			case void 0: return "flow";
			case "#":
				yield* this.pushCount(line.length - n);
				return "flow";
			case "{":
			case "[":
				yield* this.pushCount(1);
				this.flowKey = false;
				this.flowLevel += 1;
				return "flow";
			case "}":
			case "]":
				yield* this.pushCount(1);
				this.flowKey = true;
				this.flowLevel -= 1;
				return this.flowLevel ? "flow" : "doc";
			case "*":
				yield* this.pushUntil(isNotAnchorChar);
				return "flow";
			case "\"":
			case "'":
				this.flowKey = true;
				return yield* this.parseQuotedScalar();
			case ":": {
				const next = this.charAt(1);
				if (this.flowKey || isEmpty(next) || next === ",") {
					this.flowKey = false;
					yield* this.pushCount(1);
					yield* this.pushSpaces(true);
					return "flow";
				}
			}
			default:
				this.flowKey = false;
				return yield* this.parsePlainScalar();
		}
	}
	*parseQuotedScalar() {
		const quote = this.charAt(0);
		let end = this.buffer.indexOf(quote, this.pos + 1);
		if (quote === "'") while (end !== -1 && this.buffer[end + 1] === "'") end = this.buffer.indexOf("'", end + 2);
		else while (end !== -1) {
			let n = 0;
			while (this.buffer[end - 1 - n] === "\\") n += 1;
			if (n % 2 === 0) break;
			end = this.buffer.indexOf("\"", end + 1);
		}
		const qb = this.buffer.substring(0, end);
		let nl = qb.indexOf("\n", this.pos);
		if (nl !== -1) {
			while (nl !== -1) {
				const cs = this.continueScalar(nl + 1);
				if (cs === -1) break;
				nl = qb.indexOf("\n", cs);
			}
			if (nl !== -1) end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
		}
		if (end === -1) {
			if (!this.atEnd) return this.setNext("quoted-scalar");
			end = this.buffer.length;
		}
		yield* this.pushToIndex(end + 1, false);
		return this.flowLevel ? "flow" : "doc";
	}
	*parseBlockScalarHeader() {
		this.blockScalarIndent = -1;
		this.blockScalarKeep = false;
		let i = this.pos;
		while (true) {
			const ch = this.buffer[++i];
			if (ch === "+") this.blockScalarKeep = true;
			else if (ch > "0" && ch <= "9") this.blockScalarIndent = Number(ch) - 1;
			else if (ch !== "-") break;
		}
		return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
	}
	*parseBlockScalar() {
		let nl = this.pos - 1;
		let indent = 0;
		let ch;
		loop: for (let i = this.pos; ch = this.buffer[i]; ++i) switch (ch) {
			case " ":
				indent += 1;
				break;
			case "\n":
				nl = i;
				indent = 0;
				break;
			case "\r": {
				const next = this.buffer[i + 1];
				if (!next && !this.atEnd) return this.setNext("block-scalar");
				if (next === "\n") break;
			}
			default: break loop;
		}
		if (!ch && !this.atEnd) return this.setNext("block-scalar");
		if (indent >= this.indentNext) {
			if (this.blockScalarIndent === -1) this.indentNext = indent;
			else this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
			do {
				const cs = this.continueScalar(nl + 1);
				if (cs === -1) break;
				nl = this.buffer.indexOf("\n", cs);
			} while (nl !== -1);
			if (nl === -1) {
				if (!this.atEnd) return this.setNext("block-scalar");
				nl = this.buffer.length;
			}
		}
		let i = nl + 1;
		ch = this.buffer[i];
		while (ch === " ") ch = this.buffer[++i];
		if (ch === "	") {
			while (ch === "	" || ch === " " || ch === "\r" || ch === "\n") ch = this.buffer[++i];
			nl = i - 1;
		} else if (!this.blockScalarKeep) do {
			let i = nl - 1;
			let ch = this.buffer[i];
			if (ch === "\r") ch = this.buffer[--i];
			const lastChar = i;
			while (ch === " ") ch = this.buffer[--i];
			if (ch === "\n" && i >= this.pos && i + 1 + indent > lastChar) nl = i;
			else break;
		} while (true);
		yield "";
		yield* this.pushToIndex(nl + 1, true);
		return yield* this.parseLineStart();
	}
	*parsePlainScalar() {
		const inFlow = this.flowLevel > 0;
		let end = this.pos - 1;
		let i = this.pos - 1;
		let ch;
		while (ch = this.buffer[++i]) if (ch === ":") {
			const next = this.buffer[i + 1];
			if (isEmpty(next) || inFlow && flowIndicatorChars.has(next)) break;
			end = i;
		} else if (isEmpty(ch)) {
			let next = this.buffer[i + 1];
			if (ch === "\r") if (next === "\n") {
				i += 1;
				ch = "\n";
				next = this.buffer[i + 1];
			} else end = i;
			if (next === "#" || inFlow && flowIndicatorChars.has(next)) break;
			if (ch === "\n") {
				const cs = this.continueScalar(i + 1);
				if (cs === -1) break;
				i = Math.max(i, cs - 2);
			}
		} else {
			if (inFlow && flowIndicatorChars.has(ch)) break;
			end = i;
		}
		if (!ch && !this.atEnd) return this.setNext("plain-scalar");
		yield "";
		yield* this.pushToIndex(end + 1, true);
		return inFlow ? "flow" : "doc";
	}
	*pushCount(n) {
		if (n > 0) {
			yield this.buffer.substr(this.pos, n);
			this.pos += n;
			return n;
		}
		return 0;
	}
	*pushToIndex(i, allowEmpty) {
		const s = this.buffer.slice(this.pos, i);
		if (s) {
			yield s;
			this.pos += s.length;
			return s.length;
		} else if (allowEmpty) yield "";
		return 0;
	}
	*pushIndicators() {
		switch (this.charAt(0)) {
			case "!": return (yield* this.pushTag()) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
			case "&": return (yield* this.pushUntil(isNotAnchorChar)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
			case "-":
			case "?":
			case ":": {
				const inFlow = this.flowLevel > 0;
				const ch1 = this.charAt(1);
				if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
					if (!inFlow) this.indentNext = this.indentValue + 1;
					else if (this.flowKey) this.flowKey = false;
					return (yield* this.pushCount(1)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
				}
			}
		}
		return 0;
	}
	*pushTag() {
		if (this.charAt(1) === "<") {
			let i = this.pos + 2;
			let ch = this.buffer[i];
			while (!isEmpty(ch) && ch !== ">") ch = this.buffer[++i];
			return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
		} else {
			let i = this.pos + 1;
			let ch = this.buffer[i];
			while (ch) if (tagChars.has(ch)) ch = this.buffer[++i];
			else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) ch = this.buffer[i += 3];
			else break;
			return yield* this.pushToIndex(i, false);
		}
	}
	*pushNewline() {
		const ch = this.buffer[this.pos];
		if (ch === "\n") return yield* this.pushCount(1);
		else if (ch === "\r" && this.charAt(1) === "\n") return yield* this.pushCount(2);
		else return 0;
	}
	*pushSpaces(allowTabs) {
		let i = this.pos - 1;
		let ch;
		do
			ch = this.buffer[++i];
		while (ch === " " || allowTabs && ch === "	");
		const n = i - this.pos;
		if (n > 0) {
			yield this.buffer.substr(this.pos, n);
			this.pos = i;
		}
		return n;
	}
	*pushUntil(test) {
		let i = this.pos;
		let ch = this.buffer[i];
		while (!test(ch)) ch = this.buffer[++i];
		return yield* this.pushToIndex(i, false);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/parse/line-counter.js
/**
* Tracks newlines during parsing in order to provide an efficient API for
* determining the one-indexed `{ line, col }` position for any offset
* within the input.
*/
var LineCounter = class {
	constructor() {
		this.lineStarts = [];
		/**
		* Should be called in ascending order. Otherwise, call
		* `lineCounter.lineStarts.sort()` before calling `linePos()`.
		*/
		this.addNewLine = (offset) => this.lineStarts.push(offset);
		/**
		* Performs a binary search and returns the 1-indexed { line, col }
		* position of `offset`. If `line === 0`, `addNewLine` has never been
		* called or `offset` is before the first known newline.
		*/
		this.linePos = (offset) => {
			let low = 0;
			let high = this.lineStarts.length;
			while (low < high) {
				const mid = low + high >> 1;
				if (this.lineStarts[mid] < offset) low = mid + 1;
				else high = mid;
			}
			if (this.lineStarts[low] === offset) return {
				line: low + 1,
				col: 1
			};
			if (low === 0) return {
				line: 0,
				col: offset
			};
			const start = this.lineStarts[low - 1];
			return {
				line: low,
				col: offset - start + 1
			};
		};
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/parse/parser.js
function includesToken(list, type) {
	for (let i = 0; i < list.length; ++i) if (list[i].type === type) return true;
	return false;
}
function findNonEmptyIndex(list) {
	for (let i = 0; i < list.length; ++i) switch (list[i].type) {
		case "space":
		case "comment":
		case "newline": break;
		default: return i;
	}
	return -1;
}
function isFlowToken(token) {
	switch (token?.type) {
		case "alias":
		case "scalar":
		case "single-quoted-scalar":
		case "double-quoted-scalar":
		case "flow-collection": return true;
		default: return false;
	}
}
function getPrevProps(parent) {
	switch (parent.type) {
		case "document": return parent.start;
		case "block-map": {
			const it = parent.items[parent.items.length - 1];
			return it.sep ?? it.start;
		}
		case "block-seq": return parent.items[parent.items.length - 1].start;
		default: return [];
	}
}
/** Note: May modify input array */
function getFirstKeyStartProps(prev) {
	if (prev.length === 0) return [];
	let i = prev.length;
	loop: while (--i >= 0) switch (prev[i].type) {
		case "doc-start":
		case "explicit-key-ind":
		case "map-value-ind":
		case "seq-item-ind":
		case "newline": break loop;
	}
	while (prev[++i]?.type === "space");
	return prev.splice(i, prev.length);
}
function fixFlowSeqItems(fc) {
	if (fc.start.type === "flow-seq-start") {
		for (const it of fc.items) if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
			if (it.key) it.value = it.key;
			delete it.key;
			if (isFlowToken(it.value)) if (it.value.end) Array.prototype.push.apply(it.value.end, it.sep);
			else it.value.end = it.sep;
			else Array.prototype.push.apply(it.start, it.sep);
			delete it.sep;
		}
	}
}
/**
* A YAML concrete syntax tree (CST) parser
*
* ```ts
* const src: string = ...
* for (const token of new Parser().parse(src)) {
*   // token: Token
* }
* ```
*
* To use the parser with a user-provided lexer:
*
* ```ts
* function* parse(source: string, lexer: Lexer) {
*   const parser = new Parser()
*   for (const lexeme of lexer.lex(source))
*     yield* parser.next(lexeme)
*   yield* parser.end()
* }
*
* const src: string = ...
* const lexer = new Lexer()
* for (const token of parse(src, lexer)) {
*   // token: Token
* }
* ```
*/
var Parser = class {
	/**
	* @param onNewLine - If defined, called separately with the start position of
	*   each new line (in `parse()`, including the start of input).
	*/
	constructor(onNewLine) {
		/** If true, space and sequence indicators count as indentation */
		this.atNewLine = true;
		/** If true, next token is a scalar value */
		this.atScalar = false;
		/** Current indentation level */
		this.indent = 0;
		/** Current offset since the start of parsing */
		this.offset = 0;
		/** On the same line with a block map key */
		this.onKeyLine = false;
		/** Top indicates the node that's currently being built */
		this.stack = [];
		/** The source of the current token, set in parse() */
		this.source = "";
		/** The type of the current token, set in parse() */
		this.type = "";
		this.lexer = new Lexer();
		this.onNewLine = onNewLine;
	}
	/**
	* Parse `source` as a YAML stream.
	* If `incomplete`, a part of the last line may be left as a buffer for the next call.
	*
	* Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
	*
	* @returns A generator of tokens representing each directive, document, and other structure.
	*/
	*parse(source, incomplete = false) {
		if (this.onNewLine && this.offset === 0) this.onNewLine(0);
		for (const lexeme of this.lexer.lex(source, incomplete)) yield* this.next(lexeme);
		if (!incomplete) yield* this.end();
	}
	/**
	* Advance the parser by the `source` of one lexical token.
	*/
	*next(source) {
		this.source = source;
		if (this.atScalar) {
			this.atScalar = false;
			yield* this.step();
			this.offset += source.length;
			return;
		}
		const type = tokenType(source);
		if (!type) {
			const message = `Not a YAML token: ${source}`;
			yield* this.pop({
				type: "error",
				offset: this.offset,
				message,
				source
			});
			this.offset += source.length;
		} else if (type === "scalar") {
			this.atNewLine = false;
			this.atScalar = true;
			this.type = "scalar";
		} else {
			this.type = type;
			yield* this.step();
			switch (type) {
				case "newline":
					this.atNewLine = true;
					this.indent = 0;
					if (this.onNewLine) this.onNewLine(this.offset + source.length);
					break;
				case "space":
					if (this.atNewLine && source[0] === " ") this.indent += source.length;
					break;
				case "explicit-key-ind":
				case "map-value-ind":
				case "seq-item-ind":
					if (this.atNewLine) this.indent += source.length;
					break;
				case "doc-mode":
				case "flow-error-end": return;
				default: this.atNewLine = false;
			}
			this.offset += source.length;
		}
	}
	/** Call at end of input to push out any remaining constructions */
	*end() {
		while (this.stack.length > 0) yield* this.pop();
	}
	get sourceToken() {
		return {
			type: this.type,
			offset: this.offset,
			indent: this.indent,
			source: this.source
		};
	}
	*step() {
		const top = this.peek(1);
		if (this.type === "doc-end" && top?.type !== "doc-end") {
			while (this.stack.length > 0) yield* this.pop();
			this.stack.push({
				type: "doc-end",
				offset: this.offset,
				source: this.source
			});
			return;
		}
		if (!top) return yield* this.stream();
		switch (top.type) {
			case "document": return yield* this.document(top);
			case "alias":
			case "scalar":
			case "single-quoted-scalar":
			case "double-quoted-scalar": return yield* this.scalar(top);
			case "block-scalar": return yield* this.blockScalar(top);
			case "block-map": return yield* this.blockMap(top);
			case "block-seq": return yield* this.blockSequence(top);
			case "flow-collection": return yield* this.flowCollection(top);
			case "doc-end": return yield* this.documentEnd(top);
		}
		/* istanbul ignore next should not happen */
		yield* this.pop();
	}
	peek(n) {
		return this.stack[this.stack.length - n];
	}
	*pop(error) {
		const token = error ?? this.stack.pop();
		/* istanbul ignore if should not happen */
		if (!token) yield {
			type: "error",
			offset: this.offset,
			source: "",
			message: "Tried to pop an empty stack"
		};
		else if (this.stack.length === 0) yield token;
		else {
			const top = this.peek(1);
			if (token.type === "block-scalar") token.indent = "indent" in top ? top.indent : 0;
			else if (token.type === "flow-collection" && top.type === "document") token.indent = 0;
			if (token.type === "flow-collection") fixFlowSeqItems(token);
			switch (top.type) {
				case "document":
					top.value = token;
					break;
				case "block-scalar":
					top.props.push(token);
					break;
				case "block-map": {
					const it = top.items[top.items.length - 1];
					if (it.value) {
						top.items.push({
							start: [],
							key: token,
							sep: []
						});
						this.onKeyLine = true;
						return;
					} else if (it.sep) it.value = token;
					else {
						Object.assign(it, {
							key: token,
							sep: []
						});
						this.onKeyLine = !it.explicitKey;
						return;
					}
					break;
				}
				case "block-seq": {
					const it = top.items[top.items.length - 1];
					if (it.value) top.items.push({
						start: [],
						value: token
					});
					else it.value = token;
					break;
				}
				case "flow-collection": {
					const it = top.items[top.items.length - 1];
					if (!it || it.value) top.items.push({
						start: [],
						key: token,
						sep: []
					});
					else if (it.sep) it.value = token;
					else Object.assign(it, {
						key: token,
						sep: []
					});
					return;
				}
				default:
					yield* this.pop();
					yield* this.pop(token);
			}
			if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
				const last = token.items[token.items.length - 1];
				if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
					if (top.type === "document") top.end = last.start;
					else top.items.push({ start: last.start });
					token.items.splice(-1, 1);
				}
			}
		}
	}
	*stream() {
		switch (this.type) {
			case "directive-line":
				yield {
					type: "directive",
					offset: this.offset,
					source: this.source
				};
				return;
			case "byte-order-mark":
			case "space":
			case "comment":
			case "newline":
				yield this.sourceToken;
				return;
			case "doc-mode":
			case "doc-start": {
				const doc = {
					type: "document",
					offset: this.offset,
					start: []
				};
				if (this.type === "doc-start") doc.start.push(this.sourceToken);
				this.stack.push(doc);
				return;
			}
		}
		yield {
			type: "error",
			offset: this.offset,
			message: `Unexpected ${this.type} token in YAML stream`,
			source: this.source
		};
	}
	*document(doc) {
		if (doc.value) return yield* this.lineEnd(doc);
		switch (this.type) {
			case "doc-start":
				if (findNonEmptyIndex(doc.start) !== -1) {
					yield* this.pop();
					yield* this.step();
				} else doc.start.push(this.sourceToken);
				return;
			case "anchor":
			case "tag":
			case "space":
			case "comment":
			case "newline":
				doc.start.push(this.sourceToken);
				return;
		}
		const bv = this.startBlockValue(doc);
		if (bv) this.stack.push(bv);
		else yield {
			type: "error",
			offset: this.offset,
			message: `Unexpected ${this.type} token in YAML document`,
			source: this.source
		};
	}
	*scalar(scalar) {
		if (this.type === "map-value-ind") {
			const start = getFirstKeyStartProps(getPrevProps(this.peek(2)));
			let sep;
			if (scalar.end) {
				sep = scalar.end;
				sep.push(this.sourceToken);
				delete scalar.end;
			} else sep = [this.sourceToken];
			const map = {
				type: "block-map",
				offset: scalar.offset,
				indent: scalar.indent,
				items: [{
					start,
					key: scalar,
					sep
				}]
			};
			this.onKeyLine = true;
			this.stack[this.stack.length - 1] = map;
		} else yield* this.lineEnd(scalar);
	}
	*blockScalar(scalar) {
		switch (this.type) {
			case "space":
			case "comment":
			case "newline":
				scalar.props.push(this.sourceToken);
				return;
			case "scalar":
				scalar.source = this.source;
				this.atNewLine = true;
				this.indent = 0;
				if (this.onNewLine) {
					let nl = this.source.indexOf("\n") + 1;
					while (nl !== 0) {
						this.onNewLine(this.offset + nl);
						nl = this.source.indexOf("\n", nl) + 1;
					}
				}
				yield* this.pop();
				break;
			default:
				yield* this.pop();
				yield* this.step();
		}
	}
	*blockMap(map) {
		const it = map.items[map.items.length - 1];
		switch (this.type) {
			case "newline":
				this.onKeyLine = false;
				if (it.value) {
					const end = "end" in it.value ? it.value.end : void 0;
					if ((Array.isArray(end) ? end[end.length - 1] : void 0)?.type === "comment") end?.push(this.sourceToken);
					else map.items.push({ start: [this.sourceToken] });
				} else if (it.sep) it.sep.push(this.sourceToken);
				else it.start.push(this.sourceToken);
				return;
			case "space":
			case "comment":
				if (it.value) map.items.push({ start: [this.sourceToken] });
				else if (it.sep) it.sep.push(this.sourceToken);
				else {
					if (this.atIndentedComment(it.start, map.indent)) {
						const end = map.items[map.items.length - 2]?.value?.end;
						if (Array.isArray(end)) {
							Array.prototype.push.apply(end, it.start);
							end.push(this.sourceToken);
							map.items.pop();
							return;
						}
					}
					it.start.push(this.sourceToken);
				}
				return;
		}
		if (this.indent >= map.indent) {
			const atMapIndent = !this.onKeyLine && this.indent === map.indent;
			const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
			let start = [];
			if (atNextItem && it.sep && !it.value) {
				const nl = [];
				for (let i = 0; i < it.sep.length; ++i) {
					const st = it.sep[i];
					switch (st.type) {
						case "newline":
							nl.push(i);
							break;
						case "space": break;
						case "comment":
							if (st.indent > map.indent) nl.length = 0;
							break;
						default: nl.length = 0;
					}
				}
				if (nl.length >= 2) start = it.sep.splice(nl[1]);
			}
			switch (this.type) {
				case "anchor":
				case "tag":
					if (atNextItem || it.value) {
						start.push(this.sourceToken);
						map.items.push({ start });
						this.onKeyLine = true;
					} else if (it.sep) it.sep.push(this.sourceToken);
					else it.start.push(this.sourceToken);
					return;
				case "explicit-key-ind":
					if (!it.sep && !it.explicitKey) {
						it.start.push(this.sourceToken);
						it.explicitKey = true;
					} else if (atNextItem || it.value) {
						start.push(this.sourceToken);
						map.items.push({
							start,
							explicitKey: true
						});
					} else this.stack.push({
						type: "block-map",
						offset: this.offset,
						indent: this.indent,
						items: [{
							start: [this.sourceToken],
							explicitKey: true
						}]
					});
					this.onKeyLine = true;
					return;
				case "map-value-ind":
					if (it.explicitKey) if (!it.sep) if (includesToken(it.start, "newline")) Object.assign(it, {
						key: null,
						sep: [this.sourceToken]
					});
					else {
						const start = getFirstKeyStartProps(it.start);
						this.stack.push({
							type: "block-map",
							offset: this.offset,
							indent: this.indent,
							items: [{
								start,
								key: null,
								sep: [this.sourceToken]
							}]
						});
					}
					else if (it.value) map.items.push({
						start: [],
						key: null,
						sep: [this.sourceToken]
					});
					else if (includesToken(it.sep, "map-value-ind")) this.stack.push({
						type: "block-map",
						offset: this.offset,
						indent: this.indent,
						items: [{
							start,
							key: null,
							sep: [this.sourceToken]
						}]
					});
					else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
						const start = getFirstKeyStartProps(it.start);
						const key = it.key;
						const sep = it.sep;
						sep.push(this.sourceToken);
						delete it.key;
						delete it.sep;
						this.stack.push({
							type: "block-map",
							offset: this.offset,
							indent: this.indent,
							items: [{
								start,
								key,
								sep
							}]
						});
					} else if (start.length > 0) it.sep = it.sep.concat(start, this.sourceToken);
					else it.sep.push(this.sourceToken);
					else if (!it.sep) Object.assign(it, {
						key: null,
						sep: [this.sourceToken]
					});
					else if (it.value || atNextItem) map.items.push({
						start,
						key: null,
						sep: [this.sourceToken]
					});
					else if (includesToken(it.sep, "map-value-ind")) this.stack.push({
						type: "block-map",
						offset: this.offset,
						indent: this.indent,
						items: [{
							start: [],
							key: null,
							sep: [this.sourceToken]
						}]
					});
					else it.sep.push(this.sourceToken);
					this.onKeyLine = true;
					return;
				case "alias":
				case "scalar":
				case "single-quoted-scalar":
				case "double-quoted-scalar": {
					const fs = this.flowScalar(this.type);
					if (atNextItem || it.value) {
						map.items.push({
							start,
							key: fs,
							sep: []
						});
						this.onKeyLine = true;
					} else if (it.sep) this.stack.push(fs);
					else {
						Object.assign(it, {
							key: fs,
							sep: []
						});
						this.onKeyLine = true;
					}
					return;
				}
				default: {
					const bv = this.startBlockValue(map);
					if (bv) {
						if (bv.type === "block-seq") {
							if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
								yield* this.pop({
									type: "error",
									offset: this.offset,
									message: "Unexpected block-seq-ind on same line with key",
									source: this.source
								});
								return;
							}
						} else if (atMapIndent) map.items.push({ start });
						this.stack.push(bv);
						return;
					}
				}
			}
		}
		yield* this.pop();
		yield* this.step();
	}
	*blockSequence(seq) {
		const it = seq.items[seq.items.length - 1];
		switch (this.type) {
			case "newline":
				if (it.value) {
					const end = "end" in it.value ? it.value.end : void 0;
					if ((Array.isArray(end) ? end[end.length - 1] : void 0)?.type === "comment") end?.push(this.sourceToken);
					else seq.items.push({ start: [this.sourceToken] });
				} else it.start.push(this.sourceToken);
				return;
			case "space":
			case "comment":
				if (it.value) seq.items.push({ start: [this.sourceToken] });
				else {
					if (this.atIndentedComment(it.start, seq.indent)) {
						const end = seq.items[seq.items.length - 2]?.value?.end;
						if (Array.isArray(end)) {
							Array.prototype.push.apply(end, it.start);
							end.push(this.sourceToken);
							seq.items.pop();
							return;
						}
					}
					it.start.push(this.sourceToken);
				}
				return;
			case "anchor":
			case "tag":
				if (it.value || this.indent <= seq.indent) break;
				it.start.push(this.sourceToken);
				return;
			case "seq-item-ind":
				if (this.indent !== seq.indent) break;
				if (it.value || includesToken(it.start, "seq-item-ind")) seq.items.push({ start: [this.sourceToken] });
				else it.start.push(this.sourceToken);
				return;
		}
		if (this.indent > seq.indent) {
			const bv = this.startBlockValue(seq);
			if (bv) {
				this.stack.push(bv);
				return;
			}
		}
		yield* this.pop();
		yield* this.step();
	}
	*flowCollection(fc) {
		const it = fc.items[fc.items.length - 1];
		if (this.type === "flow-error-end") {
			let top;
			do {
				yield* this.pop();
				top = this.peek(1);
			} while (top?.type === "flow-collection");
		} else if (fc.end.length === 0) {
			switch (this.type) {
				case "comma":
				case "explicit-key-ind":
					if (!it || it.sep) fc.items.push({ start: [this.sourceToken] });
					else it.start.push(this.sourceToken);
					return;
				case "map-value-ind":
					if (!it || it.value) fc.items.push({
						start: [],
						key: null,
						sep: [this.sourceToken]
					});
					else if (it.sep) it.sep.push(this.sourceToken);
					else Object.assign(it, {
						key: null,
						sep: [this.sourceToken]
					});
					return;
				case "space":
				case "comment":
				case "newline":
				case "anchor":
				case "tag":
					if (!it || it.value) fc.items.push({ start: [this.sourceToken] });
					else if (it.sep) it.sep.push(this.sourceToken);
					else it.start.push(this.sourceToken);
					return;
				case "alias":
				case "scalar":
				case "single-quoted-scalar":
				case "double-quoted-scalar": {
					const fs = this.flowScalar(this.type);
					if (!it || it.value) fc.items.push({
						start: [],
						key: fs,
						sep: []
					});
					else if (it.sep) this.stack.push(fs);
					else Object.assign(it, {
						key: fs,
						sep: []
					});
					return;
				}
				case "flow-map-end":
				case "flow-seq-end":
					fc.end.push(this.sourceToken);
					return;
			}
			const bv = this.startBlockValue(fc);
			/* istanbul ignore else should not happen */
			if (bv) this.stack.push(bv);
			else {
				yield* this.pop();
				yield* this.step();
			}
		} else {
			const parent = this.peek(2);
			if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
				yield* this.pop();
				yield* this.step();
			} else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
				const start = getFirstKeyStartProps(getPrevProps(parent));
				fixFlowSeqItems(fc);
				const sep = fc.end.splice(1, fc.end.length);
				sep.push(this.sourceToken);
				const map = {
					type: "block-map",
					offset: fc.offset,
					indent: fc.indent,
					items: [{
						start,
						key: fc,
						sep
					}]
				};
				this.onKeyLine = true;
				this.stack[this.stack.length - 1] = map;
			} else yield* this.lineEnd(fc);
		}
	}
	flowScalar(type) {
		if (this.onNewLine) {
			let nl = this.source.indexOf("\n") + 1;
			while (nl !== 0) {
				this.onNewLine(this.offset + nl);
				nl = this.source.indexOf("\n", nl) + 1;
			}
		}
		return {
			type,
			offset: this.offset,
			indent: this.indent,
			source: this.source
		};
	}
	startBlockValue(parent) {
		switch (this.type) {
			case "alias":
			case "scalar":
			case "single-quoted-scalar":
			case "double-quoted-scalar": return this.flowScalar(this.type);
			case "block-scalar-header": return {
				type: "block-scalar",
				offset: this.offset,
				indent: this.indent,
				props: [this.sourceToken],
				source: ""
			};
			case "flow-map-start":
			case "flow-seq-start": return {
				type: "flow-collection",
				offset: this.offset,
				indent: this.indent,
				start: this.sourceToken,
				items: [],
				end: []
			};
			case "seq-item-ind": return {
				type: "block-seq",
				offset: this.offset,
				indent: this.indent,
				items: [{ start: [this.sourceToken] }]
			};
			case "explicit-key-ind": {
				this.onKeyLine = true;
				const start = getFirstKeyStartProps(getPrevProps(parent));
				start.push(this.sourceToken);
				return {
					type: "block-map",
					offset: this.offset,
					indent: this.indent,
					items: [{
						start,
						explicitKey: true
					}]
				};
			}
			case "map-value-ind": {
				this.onKeyLine = true;
				const start = getFirstKeyStartProps(getPrevProps(parent));
				return {
					type: "block-map",
					offset: this.offset,
					indent: this.indent,
					items: [{
						start,
						key: null,
						sep: [this.sourceToken]
					}]
				};
			}
		}
		return null;
	}
	atIndentedComment(start, indent) {
		if (this.type !== "comment") return false;
		if (this.indent <= indent) return false;
		return start.every((st) => st.type === "newline" || st.type === "space");
	}
	*documentEnd(docEnd) {
		if (this.type !== "doc-mode") {
			if (docEnd.end) docEnd.end.push(this.sourceToken);
			else docEnd.end = [this.sourceToken];
			if (this.type === "newline") yield* this.pop();
		}
	}
	*lineEnd(token) {
		switch (this.type) {
			case "comma":
			case "doc-start":
			case "doc-end":
			case "flow-seq-end":
			case "flow-map-end":
			case "map-value-ind":
				yield* this.pop();
				yield* this.step();
				break;
			case "newline": this.onKeyLine = false;
			default:
				if (token.end) token.end.push(this.sourceToken);
				else token.end = [this.sourceToken];
				if (this.type === "newline") yield* this.pop();
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/public-api.js
function parseOptions(options) {
	const prettyErrors = options.prettyErrors !== false;
	return {
		lineCounter: options.lineCounter || prettyErrors && new LineCounter() || null,
		prettyErrors
	};
}
/**
* Parse the input as a stream of YAML documents.
*
* Documents should be separated from each other by `...` or `---` marker lines.
*
* @returns If an empty `docs` array is returned, it will be of type
*   EmptyStream and contain additional stream information. In
*   TypeScript, you should use `'empty' in docs` as a type guard for it.
*/
function parseAllDocuments(source, options = {}) {
	const { lineCounter, prettyErrors } = parseOptions(options);
	const parser = new Parser(lineCounter?.addNewLine);
	const composer = new Composer(options);
	const docs = Array.from(composer.compose(parser.parse(source)));
	if (prettyErrors && lineCounter) for (const doc of docs) {
		doc.errors.forEach(prettifyError(source, lineCounter));
		doc.warnings.forEach(prettifyError(source, lineCounter));
	}
	if (docs.length > 0) return docs;
	return Object.assign([], { empty: true }, composer.streamInfo());
}
/** Parse an input string into a single YAML.Document */
function parseDocument(source, options = {}) {
	const { lineCounter, prettyErrors } = parseOptions(options);
	const parser = new Parser(lineCounter?.addNewLine);
	const composer = new Composer(options);
	let doc = null;
	for (const _doc of composer.compose(parser.parse(source), true, source.length)) if (!doc) doc = _doc;
	else if (doc.options.logLevel !== "silent") {
		doc.errors.push(new YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
		break;
	}
	if (prettyErrors && lineCounter) {
		doc.errors.forEach(prettifyError(source, lineCounter));
		doc.warnings.forEach(prettifyError(source, lineCounter));
	}
	return doc;
}
function parse$2(src, reviver, options) {
	let _reviver = void 0;
	if (typeof reviver === "function") _reviver = reviver;
	else if (options === void 0 && reviver && typeof reviver === "object") options = reviver;
	const doc = parseDocument(src, options);
	if (!doc) return null;
	doc.warnings.forEach((warning) => warn(doc.options.logLevel, warning));
	if (doc.errors.length > 0) if (doc.options.logLevel !== "silent") throw doc.errors[0];
	else doc.errors = [];
	return doc.toJS(Object.assign({ reviver: _reviver }, options));
}
function stringify(value, replacer, options) {
	let _replacer = null;
	if (typeof replacer === "function" || Array.isArray(replacer)) _replacer = replacer;
	else if (options === void 0 && replacer) options = replacer;
	if (typeof options === "string") options = options.length;
	if (typeof options === "number") {
		const indent = Math.round(options);
		options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
	}
	if (value === void 0) {
		const { keepUndefined } = options ?? replacer ?? {};
		if (!keepUndefined) return void 0;
	}
	if (isDocument(value) && !_replacer) return value.toString(options);
	return new Document(value, _replacer, options).toString(options);
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/index.js
var browser_default = /* @__PURE__ */ __exportAll({
	Alias: () => Alias,
	CST: () => cst_exports,
	Composer: () => Composer,
	Document: () => Document,
	Lexer: () => Lexer,
	LineCounter: () => LineCounter,
	Pair: () => Pair,
	Parser: () => Parser,
	Scalar: () => Scalar,
	Schema: () => Schema,
	YAMLError: () => YAMLError,
	YAMLMap: () => YAMLMap,
	YAMLParseError: () => YAMLParseError,
	YAMLSeq: () => YAMLSeq,
	YAMLWarning: () => YAMLWarning,
	isAlias: () => isAlias,
	isCollection: () => isCollection$1,
	isDocument: () => isDocument,
	isMap: () => isMap,
	isNode: () => isNode,
	isPair: () => isPair,
	isScalar: () => isScalar$1,
	isSeq: () => isSeq,
	parse: () => parse$2,
	parseAllDocuments: () => parseAllDocuments,
	parseDocument: () => parseDocument,
	stringify: () => stringify,
	visit: () => visit$1,
	visitAsync: () => visitAsync
});
//#endregion
//#region src/vendor/dossier-engineer/lib/frontmatter.ts
function countIndent(line) {
	let index = 0;
	while (index < line.length && line[index] === " ") index += 1;
	return index;
}
function stripQuotes(value) {
	const text = String(value).trim();
	if (text.startsWith("\"") && text.endsWith("\"") || text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1);
	return text;
}
function splitInlineCollection(inner) {
	const parts = [];
	let current = "";
	let quote = null;
	for (let index = 0; index < inner.length; index += 1) {
		const char = inner[index];
		if (quote) {
			current += char;
			if (char === quote && inner[index - 1] !== "\\") quote = null;
			continue;
		}
		if (char === "\"" || char === "'") {
			quote = char;
			current += char;
			continue;
		}
		if (char === ",") {
			parts.push(current.trim());
			current = "";
			continue;
		}
		current += char;
	}
	if (current.trim()) parts.push(current.trim());
	return parts;
}
function parseScalar(raw) {
	const text = String(raw ?? "").trim();
	if (text === "") return "";
	if (text === "null" || text === "~") return null;
	if (text === "true") return true;
	if (text === "false") return false;
	if (/^-?\d+$/.test(text)) return Number(text);
	if (/^-?\d+\.\d+$/.test(text)) return Number(text);
	if (text.startsWith("[") && text.endsWith("]")) {
		const inner = text.slice(1, -1).trim();
		if (!inner) return [];
		return splitInlineCollection(inner).map((part) => parseScalar(part)).filter((value) => value !== "");
	}
	if (text.startsWith("{") && text.endsWith("}")) {
		const inner = text.slice(1, -1).trim();
		if (!inner) return {};
		const out = {};
		for (const part of splitInlineCollection(inner)) {
			const separatorIndex = part.indexOf(":");
			if (separatorIndex === -1) continue;
			const key = stripQuotes(part.slice(0, separatorIndex));
			out[key] = parseScalar(part.slice(separatorIndex + 1));
		}
		return out;
	}
	return stripQuotes(text);
}
function nextSignificantLineIndex(lines, startIndex) {
	for (let index = startIndex; index < lines.length; index += 1) {
		const trimmed = lines[index]?.trim() ?? "";
		if (!trimmed || trimmed.startsWith("#")) continue;
		return index;
	}
	return -1;
}
function parseBlock(lines, startIndex, indent, mode) {
	if (mode === "array") {
		const container = [];
		let index = startIndex;
		while (index < lines.length) {
			const rawLine = lines[index] ?? "";
			const trimmed = rawLine.trim();
			if (!trimmed || trimmed.startsWith("#")) {
				index += 1;
				continue;
			}
			const currentIndent = countIndent(rawLine);
			if (currentIndent < indent) break;
			if (currentIndent > indent) throw new Error(`Unexpected indentation near frontmatter line: ${rawLine}`);
			if (!trimmed.startsWith("- ")) break;
			const valuePart = trimmed.slice(2).trim();
			if (valuePart === "") {
				const nextIndex = nextSignificantLineIndex(lines, index + 1);
				if (nextIndex === -1 || countIndent(lines[nextIndex] ?? "") <= currentIndent) {
					container.push("");
					index += 1;
					continue;
				}
				const child = parseBlock(lines, nextIndex, countIndent(lines[nextIndex] ?? ""), (lines[nextIndex] ?? "").trim().startsWith("- ") ? "array" : "object");
				container.push(child.value);
				index = child.nextIndex;
				continue;
			}
			const mappingMatch = valuePart.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
			if (mappingMatch) {
				const key = mappingMatch[1];
				const item = {};
				if (key) item[key] = parseScalar(mappingMatch[2]);
				container.push(item);
			} else container.push(parseScalar(valuePart));
			index += 1;
		}
		return {
			value: container,
			nextIndex: index
		};
	}
	const container = {};
	let index = startIndex;
	while (index < lines.length) {
		const rawLine = lines[index] ?? "";
		const trimmed = rawLine.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			index += 1;
			continue;
		}
		const currentIndent = countIndent(rawLine);
		if (currentIndent < indent) break;
		if (currentIndent > indent) throw new Error(`Unexpected indentation near frontmatter line: ${rawLine}`);
		const keyValueMatch = trimmed.match(/^([A-Za-z0-9_-]+):(?:\s+(.*)|\s*)$/);
		if (!keyValueMatch) throw new Error(`Invalid frontmatter line: ${rawLine}`);
		const [, key, inlineValue = ""] = keyValueMatch;
		if (!key) throw new Error(`Invalid frontmatter line: ${rawLine}`);
		if (inlineValue !== "") {
			container[key] = parseScalar(inlineValue);
			index += 1;
			continue;
		}
		const nextIndex = nextSignificantLineIndex(lines, index + 1);
		if (nextIndex === -1 || countIndent(lines[nextIndex] ?? "") <= currentIndent) {
			container[key] = "";
			index += 1;
			continue;
		}
		const child = parseBlock(lines, nextIndex, countIndent(lines[nextIndex] ?? ""), (lines[nextIndex] ?? "").trim().startsWith("- ") ? "array" : "object");
		container[key] = child.value;
		index = child.nextIndex;
	}
	return {
		value: container,
		nextIndex: index
	};
}
function parseWithFallback(raw) {
	return parseBlock(String(raw).replace(/^\uFEFF/, "").split(/\r?\n/), 0, 0, "object").value;
}
function extractFrontmatter(markdown) {
	const source = String(markdown ?? "");
	if (!source.startsWith("---")) return null;
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!match) return null;
	return {
		raw: match[1] ?? "",
		body: source.slice(match[0].length)
	};
}
function parseFrontmatter(markdown) {
	const extracted = extractFrontmatter(markdown);
	if (!extracted) return null;
	try {
		const parsed = parse$2(extracted.raw);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
	} catch {}
	return parseWithFallback(extracted.raw);
}
//#endregion
//#region src/vendor/dossier-engineer/lib/fs-utils.ts
async function readText(filePath) {
	return promises.readFile(filePath, "utf8");
}
async function writeTextAtomic(filePath, text) {
	const dir = path.dirname(filePath);
	await promises.mkdir(dir, { recursive: true });
	const tempFile = `${filePath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	await promises.writeFile(tempFile, text, "utf8");
	await promises.rename(tempFile, filePath);
}
async function writeJsonAtomic(filePath, value) {
	await writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
async function fileExists(filePath) {
	try {
		await promises.access(filePath);
		return true;
	} catch {
		return false;
	}
}
function isIgnoredDir(name, { isRepoTopLevel = false } = {}) {
	return new Set([
		".git",
		"node_modules",
		"dist",
		"build",
		"coverage",
		".next",
		".turbo",
		".cache"
	]).has(name) || isRepoTopLevel && new Set([
		"workspace",
		"models",
		"data"
	]).has(name);
}
async function walk(dir, files = [], { includeFile, rootDir = dir } = {}) {
	const resolvedRootDir = path.resolve(rootDir);
	const entries = await promises.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const absPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			const isRepoTopLevel = path.dirname(absPath) === resolvedRootDir;
			if (isIgnoredDir(entry.name, { isRepoTopLevel })) continue;
			await walk(absPath, files, includeFile ? {
				includeFile,
				rootDir: resolvedRootDir
			} : { rootDir: resolvedRootDir });
			continue;
		}
		if (entry.isFile()) {
			if (!includeFile || includeFile(absPath)) files.push(absPath);
		}
	}
	return files;
}
//#endregion
//#region src/vendor/dossier-engineer/lib/dossier-utils.ts
var DEFAULT_DOSSIERS_DIR = "docs/ssot/features";
var DOSSIER_STATUSES = new Set([
	"proposed",
	"shaped",
	"planned",
	"in_progress",
	"done",
	"parked"
]);
var COVERAGE_GATES = new Set(["deferred", "strict"]);
var DEFAULT_STRICT_COVERAGE_STATUSES = new Set(["in_progress", "done"]);
function isDossierFile(fileName) {
	return /^F-\d{4}-.+\.md$/i.test(fileName) || /^F-\d{4}\.md$/i.test(fileName);
}
async function listDossierFiles(dir) {
	return (await promises.readdir(dir, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name).filter(isDossierFile).sort();
}
function extractAcIds(markdown) {
	const ids = /* @__PURE__ */ new Set();
	const regex = /\bAC-F(\d{4})-(\d{1,2})\b/g;
	for (;;) {
		const match = regex.exec(String(markdown));
		if (!match) break;
		ids.add(`AC-F${match[1]}-${match[2]?.padStart(2, "0")}`);
	}
	return [...ids].sort();
}
function extractCoverageAcIds(markdown) {
	const ids = /* @__PURE__ */ new Set();
	const regex = /^\|\s*(AC-F\d{4}-\d{1,2})\s*\|/gm;
	for (;;) {
		const match = regex.exec(String(markdown));
		if (!match) break;
		ids.add((match[1] ?? "").replace(/-(\d{1,2})$/, (_, number) => `-${number.padStart(2, "0")}`));
	}
	return [...ids].sort();
}
function extractFeatureNumericId(featureId) {
	const match = String(featureId).match(/^F-(\d{4})$/);
	return match ? match[1] ?? null : null;
}
function extractFeatureIdFromAc(acId) {
	const match = String(acId).match(/^AC-F(\d{4})-\d{2}$/);
	return match ? `F-${match[1]}` : null;
}
function matchesFeatureFile(featureId, filePath) {
	const baseName = path.basename(filePath);
	return baseName === `${featureId}.md` || baseName.startsWith(`${featureId}-`);
}
function resolveCoverageGate(frontmatter = {}, options = {}) {
	const configuredGate = frontmatter.coverage_gate;
	if (typeof configuredGate === "string" && COVERAGE_GATES.has(configuredGate)) return configuredGate;
	return (options.strictStatuses ?? DEFAULT_STRICT_COVERAGE_STATUSES).has(String(frontmatter.status)) ? "strict" : "deferred";
}
async function readDossierRecord(absPath, options = {}) {
	const markdown = await readText(absPath);
	const frontmatter = parseFrontmatter(markdown) ?? {};
	const coverageGate = resolveCoverageGate(frontmatter, options);
	return {
		absPath,
		relPath: options.root ? path.relative(options.root, absPath).split(path.sep).join("/") : absPath,
		markdown,
		frontmatter,
		coverageGate,
		acIds: extractAcIds(markdown),
		coverageIds: extractCoverageAcIds(markdown)
	};
}
async function readAllDossiers(root, dossiersDir, options = {}) {
	const absDossiersDir = path.resolve(root, dossiersDir);
	const files = await listDossierFiles(absDossiersDir);
	const dossiers = [];
	for (const file of files) dossiers.push(await readDossierRecord(path.join(absDossiersDir, file), {
		...options,
		root
	}));
	dossiers.sort((left, right) => String(left.frontmatter.id).localeCompare(String(right.frontmatter.id)));
	return dossiers;
}
function hasChangeLogEntry(markdown) {
	return /##\s+.*Change log|##\s+Change log/i.test(String(markdown));
}
//#endregion
//#region src/vendor/dossier-engineer/lib/git-utils.ts
function normalizeGitPath(filePath) {
	return String(filePath).split("/").join(path.sep);
}
function splitLines(text) {
	return String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}
function runGit(root, args, { allowFailure = false } = {}) {
	try {
		return execFileSync("git", [
			"-C",
			root,
			...args
		], {
			encoding: "utf8",
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		}).trim();
	} catch (error) {
		if (allowFailure) return null;
		const stderr = error instanceof Error && "stderr" in error ? String(error.stderr?.toString?.() ?? "").trim() : "";
		throw new Error(stderr || (error instanceof Error ? error.message : `git ${args.join(" ")} failed`), { cause: error });
	}
}
function inGitRepo(root) {
	return Boolean(runGit(root, ["rev-parse", "--show-toplevel"], { allowFailure: true }));
}
function getHeadRef(root) {
	return runGit(root, [
		"rev-parse",
		"--verify",
		"HEAD"
	], { allowFailure: true });
}
function resolveBaseRef(root, explicitBase) {
	if (explicitBase) return explicitBase;
	const envBase = {}.GITHUB_BASE_REF || {}.CI_MERGE_REQUEST_TARGET_BRANCH_NAME || {}.CHANGE_TARGET;
	if (envBase) {
		for (const candidate of [envBase, `origin/${envBase}`]) if (runGit(root, [
			"rev-parse",
			"--verify",
			candidate
		], { allowFailure: true })) return candidate;
	}
	const originHead = runGit(root, [
		"symbolic-ref",
		"--quiet",
		"--short",
		"refs/remotes/origin/HEAD"
	], { allowFailure: true });
	if (originHead && runGit(root, [
		"rev-parse",
		"--verify",
		originHead
	], { allowFailure: true })) return originHead;
	return null;
}
function getMergeBase(root, baseRef) {
	if (!baseRef) return null;
	return runGit(root, [
		"merge-base",
		"HEAD",
		baseRef
	], { allowFailure: true });
}
function getChangedFiles(root, baseRef) {
	const files = /* @__PURE__ */ new Set();
	const addLines = (text) => {
		for (const file of splitLines(text)) files.add(normalizeGitPath(file));
	};
	const headExists = Boolean(getHeadRef(root));
	if (baseRef) {
		const mergeBase = getMergeBase(root, baseRef);
		if (!mergeBase) throw new Error(`Could not resolve merge base for HEAD and "${baseRef}".`);
		addLines(runGit(root, [
			"diff",
			"--name-only",
			"--diff-filter=ACMR",
			mergeBase,
			"HEAD"
		], { allowFailure: true }));
	} else if (headExists) addLines(runGit(root, [
		"diff",
		"--name-only",
		"--diff-filter=ACMR",
		"HEAD"
	], { allowFailure: true }));
	addLines(runGit(root, [
		"diff",
		"--name-only",
		"--diff-filter=ACMR"
	], { allowFailure: true }));
	addLines(runGit(root, [
		"diff",
		"--cached",
		"--name-only",
		"--diff-filter=ACMR"
	], { allowFailure: true }));
	addLines(runGit(root, [
		"ls-files",
		"--others",
		"--exclude-standard"
	], { allowFailure: true }));
	return [...files].sort();
}
function getCurrentCommit(root) {
	return runGit(root, [
		"rev-parse",
		"--verify",
		"HEAD"
	], { allowFailure: true });
}
function getDirtyPaths(root) {
	return splitLines(runGit(root, ["status", "--short"], { allowFailure: true }) || "").map((line) => line.slice(3).trim()).filter(Boolean).map((filePath) => normalizeGitPath(filePath));
}
function hasDirtyWorktree(root) {
	return getDirtyPaths(root).length > 0;
}
function normalizeRepoPath(root, filePath) {
	return path.resolve(root, normalizeGitPath(filePath));
}
function toRepoRelativePath(root, filePath) {
	return path.relative(root, filePath).split(path.sep).join("/");
}
//#endregion
//#region src/shared/path-guards.ts
function pathEscapes(base, target) {
	const relative = path.relative(base, target);
	return relative.startsWith("..") || path.isAbsolute(relative);
}
function assertPathInside(baseDir, targetPath, label) {
	const absBase = path.resolve(baseDir);
	if (pathEscapes(absBase, path.resolve(targetPath))) throw new Error(`${label} must stay inside ${absBase}.`);
}
async function assertNoSymlinkAncestors(rootDir, targetPath, label) {
	const absRoot = path.resolve(rootDir);
	const absTarget = path.resolve(targetPath);
	assertPathInside(absRoot, absTarget, label);
	let current = absTarget;
	while (true) {
		try {
			if ((await promises.lstat(current)).isSymbolicLink()) throw new Error(`${label} cannot use symlinked path components: ${current}`);
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
		if (current === absRoot) return;
		const parent = path.dirname(current);
		if (parent === current) return;
		current = parent;
	}
}
async function assertManagedWritePath(rootDir, managedDir, targetPath, label) {
	const absManagedDir = path.resolve(managedDir);
	const absTarget = path.resolve(targetPath);
	assertPathInside(absManagedDir, absTarget, label);
	await assertNoSymlinkAncestors(rootDir, absTarget, label);
}
async function assertManagedReadPath(rootDir, managedDir, targetPath, label) {
	const absManagedDir = path.resolve(managedDir);
	const absTarget = path.resolve(targetPath);
	assertPathInside(absManagedDir, absTarget, label);
	await assertNoSymlinkAncestors(rootDir, absTarget, label);
}
function resolveManagedPath(rootDir, inputPath, managedDir, label) {
	const absRoot = path.resolve(rootDir);
	const absTarget = path.resolve(absRoot, inputPath);
	assertPathInside(path.resolve(managedDir), absTarget, label);
	return absTarget;
}
async function resolveManagedReadPath(rootDir, inputPath, managedDir, label) {
	const absTarget = resolveManagedPath(rootDir, inputPath, managedDir, label);
	await assertManagedReadPath(rootDir, managedDir, absTarget, label);
	return absTarget;
}
//#endregion
//#region src/shared/process-root.ts
var PROCESS_MANIFEST_RELATIVE_PATH = ".dossier/manifest.json";
var BACKLOG_MANIFEST_RELATIVE_PATH = ".dossier/backlog/manifest.json";
var BACKLOG_DIR_RELATIVE_PATH = ".dossier/backlog";
var FEATURE_DOSSIERS_DIR_RELATIVE_PATH = "docs/ssot/features";
var INDEX_FILE_RELATIVE_PATH = "docs/ssot/index.md";
function processManifestPath(root) {
	return path.join(root, PROCESS_MANIFEST_RELATIVE_PATH);
}
function backlogManifestPath(root) {
	return path.join(root, BACKLOG_MANIFEST_RELATIVE_PATH);
}
function backlogDirPath(root) {
	return path.join(root, BACKLOG_DIR_RELATIVE_PATH);
}
function featureDossiersDirPath(root) {
	return path.join(root, FEATURE_DOSSIERS_DIR_RELATIVE_PATH);
}
function indexFilePath(root) {
	return path.join(root, INDEX_FILE_RELATIVE_PATH);
}
async function findProcessRoot(startPath) {
	let cursor = path.resolve(startPath);
	while (true) {
		if (await fileExists(processManifestPath(cursor))) return cursor;
		const parent = path.dirname(cursor);
		if (parent === cursor) return;
		cursor = parent;
	}
}
async function resolveProcessRoot(cwd, explicitRoot) {
	if (explicitRoot) return path.resolve(cwd, explicitRoot);
	const discovered = await findProcessRoot(cwd);
	if (!discovered) throw new Error("Process root not found. Run `dossier-engineer init --path <path>` or execute the command from a managed repository.");
	return discovered;
}
async function initializeProcessRoot(root) {
	const createdAt = (/* @__PURE__ */ new Date()).toISOString();
	const processManifest = {
		schema_version: 1,
		tool_name: "@kostysh/unified-dossier-engineer",
		created_at: createdAt,
		layout_version: 1
	};
	const backlogManifest = {
		schema_version: 1,
		tool_name: "@kostysh/unified-dossier-engineer",
		created_at: createdAt,
		layout_version: 1
	};
	const backlogState = {
		schema_version: 1,
		created_at: createdAt,
		updated_at: createdAt,
		last_refresh_at: null,
		context: {
			glossary: [],
			key_strategy: {},
			target_system: [],
			as_built: [],
			claims: [],
			contracts: [],
			data_domains: [],
			quality_attributes: [],
			policy_decisions: []
		},
		items: [],
		todos: []
	};
	const sourceRegistry = {
		schema_version: 1,
		created_at: createdAt,
		updated_at: createdAt,
		sources: []
	};
	const appliedRegistry = {
		schema_version: 1,
		created_at: createdAt,
		updated_at: createdAt,
		next_apply_index: 1,
		packets: [],
		patches: []
	};
	const processManifestAbsPath = processManifestPath(root);
	if (await fileExists(processManifestAbsPath)) throw new Error(`Process root already exists: ${PROCESS_MANIFEST_RELATIVE_PATH}`);
	const directories = [
		path.join(root, ".dossier"),
		backlogDirPath(root),
		path.join(root, ".dossier/backlog/source-review"),
		path.join(root, ".dossier/backlog/packets"),
		path.join(root, ".dossier/backlog/patches"),
		path.join(root, ".dossier/backlog/reports"),
		path.join(root, ".dossier/logs/feature-intake"),
		path.join(root, ".dossier/logs/spec-compact"),
		path.join(root, ".dossier/logs/plan-slice"),
		path.join(root, ".dossier/logs/implementation"),
		path.join(root, ".dossier/logs/change-proposal"),
		path.join(root, ".dossier/reviews"),
		path.join(root, ".dossier/verification"),
		path.join(root, ".dossier/steps"),
		path.join(root, ".dossier/metrics"),
		path.join(root, ".dossier/retro"),
		path.join(root, ".dossier/ops/locks"),
		path.join(root, ".dossier/drift"),
		path.join(root, "docs/ssot"),
		featureDossiersDirPath(root)
	];
	for (const directory of directories) await promises.mkdir(directory, { recursive: true });
	await writeJsonAtomic(processManifestAbsPath, processManifest);
	await writeJsonAtomic(backlogManifestPath(root), backlogManifest);
	await writeJsonAtomic(path.join(root, ".dossier/backlog/state.json"), backlogState);
	await writeJsonAtomic(path.join(root, ".dossier/backlog/sources.json"), sourceRegistry);
	await writeJsonAtomic(path.join(root, ".dossier/backlog/applied.json"), appliedRegistry);
	await writeTextAtomic(path.join(root, ".dossier/backlog/.gitignore"), [
		"reports/*.md",
		"reports/*.mmd",
		"mutation.lock",
		"source-review/*.tmp-*",
		""
	].join("\n"));
	await writeTextAtomic(path.join(root, ".dossier/backlog/AGENTS.md"), [
		"# Unified Backlog Accounting Surface",
		"",
		"This directory contains utility-owned backlog artifacts for the merged dossier-engineer runtime.",
		"Do not hand-edit generated machine artifacts unless the workflow explicitly requires it.",
		""
	].join("\n"));
	if (!await fileExists(indexFilePath(root))) await writeTextAtomic(indexFilePath(root), [
		"# SSOT Index",
		"",
		"## Feature dossiers",
		"",
		"| Feature | Title | Status | Coverage gate | Area |",
		"| --- | --- | --- | --- | --- |",
		""
	].join("\n"));
	if (!await fileExists(path.join(root, "docs/ssot/features/.gitkeep"))) await writeTextAtomic(path.join(root, "docs/ssot/features/.gitkeep"), "");
	return {
		processManifestPath: processManifestAbsPath,
		backlogManifestPath: backlogManifestPath(root),
		indexFilePath: indexFilePath(root),
		dossiersDirPath: featureDossiersDirPath(root)
	};
}
//#endregion
//#region src/shared/feature-identity.ts
var FEATURE_ID_PATTERN = /^F-\d{4}$/;
var SAFE_SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
function sanitizeFeatureId(value, label = "feature id") {
	const normalized = value.trim();
	if (!FEATURE_ID_PATTERN.test(normalized)) throw new Error(`${label} must match F-XXXX.`);
	return normalized;
}
function sanitizeFilesystemSegment(value, label) {
	const normalized = value.trim();
	if (!normalized || normalized === "." || normalized === ".." || normalized.includes("/") || normalized.includes("\\") || !SAFE_SEGMENT_PATTERN.test(normalized)) throw new Error(`${label} must be a safe single filesystem segment.`);
	return normalized;
}
function extractFeatureIdFromDossierPath(filePath) {
	return path.basename(filePath).match(/^(F-\d{4})(?:-|\.md$)/)?.[1] ?? null;
}
async function resolveManagedDossierIdentity(payload) {
	const absPath = await resolveManagedReadPath(payload.root, payload.dossierPath, featureDossiersDirPath(payload.root), "dossier path");
	const dossier = await readDossierRecord(absPath, { root: payload.root });
	const discoveredFeatureId = sanitizeFeatureId(typeof dossier.frontmatter.id === "string" && dossier.frontmatter.id.trim() ? dossier.frontmatter.id : extractFeatureIdFromDossierPath(absPath) ?? "", "dossier feature id");
	if (!matchesFeatureFile(discoveredFeatureId, absPath)) throw new Error(`Dossier path ${path.relative(payload.root, absPath)} does not match feature id ${discoveredFeatureId}.`);
	if (payload.expectedFeatureId) {
		const expectedFeatureId = sanitizeFeatureId(payload.expectedFeatureId, "--feature-id");
		if (expectedFeatureId !== discoveredFeatureId) throw new Error(`--feature-id ${expectedFeatureId} does not match dossier feature id ${discoveredFeatureId}.`);
	}
	return {
		absPath,
		dossier,
		featureId: discoveredFeatureId
	};
}
//#endregion
//#region src/vendor/dossier-engineer/lib/lifecycle-telemetry.ts
var LIFECYCLE_STAGES = [
	"feature-intake",
	"spec-compact",
	"plan-slice",
	"implementation",
	"change-proposal"
];
function toNullableString$1(value) {
	return typeof value === "string" && value.trim() ? value : null;
}
function toEventRecords(value) {
	return Array.isArray(value) ? value.filter((item) => item !== null && typeof item === "object") : [];
}
function toStringArray$2(values) {
	return [...new Set([...values].filter((value) => Boolean(value)).map(String))].sort();
}
function parseTimestamp(value) {
	if (!value) return null;
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? null : parsed;
}
function diffMillis(start, end) {
	const startMs = parseTimestamp(start);
	const endMs = parseTimestamp(end);
	return startMs === null || endMs === null ? null : Math.max(0, endMs - startMs);
}
function earliestTimestamp(values) {
	const valid = values.filter((value) => parseTimestamp(value ?? null) !== null);
	if (valid.length === 0) return null;
	valid.sort((left, right) => (parseTimestamp(left) ?? 0) - (parseTimestamp(right) ?? 0));
	return valid[0] ?? null;
}
function latestTimestamp(values) {
	const valid = values.filter((value) => parseTimestamp(value ?? null) !== null);
	if (valid.length === 0) return null;
	valid.sort((left, right) => (parseTimestamp(left) ?? 0) - (parseTimestamp(right) ?? 0));
	return valid.at(-1) ?? null;
}
function compareByTimestamp(left, right) {
	return (parseTimestamp(left.startTs) ?? 0) - (parseTimestamp(right.startTs) ?? 0);
}
function stableString(value) {
	return typeof value === "string" ? value : JSON.stringify(value);
}
async function readLifecycleLog(root, absPath) {
	const metadata = parseFrontmatter(await readText(absPath));
	if (!metadata) return null;
	const featureId = toNullableString$1(metadata.feature_id);
	const featureCycleId = toNullableString$1(metadata.feature_cycle_id);
	const stage = toNullableString$1(metadata.command) === "feature-intake" ? "feature-intake" : toNullableString$1(metadata.stage);
	if (!featureId || !featureCycleId || !stage || !LIFECYCLE_STAGES.includes(stage)) return null;
	return {
		path: absPath,
		pathRel: path.relative(root, absPath).split(path.sep).join("/"),
		metadata,
		featureId,
		featureCycleId,
		stage,
		cycleId: toNullableString$1(metadata.cycle_id),
		backlogItemKey: toNullableString$1(metadata.backlog_item_key),
		sessionId: toNullableString$1(metadata.session_id),
		traceRuntime: toNullableString$1(metadata.trace_runtime) ?? "codex",
		traceLocatorKind: toNullableString$1(metadata.trace_locator_kind) ?? "session_id",
		startTs: toNullableString$1(metadata.start_ts),
		intakeProcessCompleteTs: toNullableString$1(metadata.intake_process_complete_ts),
		localGatesGreenTs: toNullableString$1(metadata.local_gates_green_ts),
		processCompleteTs: toNullableString$1(metadata.process_complete_ts),
		stepCloseTs: toNullableString$1(metadata.step_close_ts),
		stepArtifact: toNullableString$1(metadata.step_artifact),
		firstReviewAgentStartedTs: toNullableString$1(metadata.first_review_agent_started_ts),
		finalPassTs: toNullableString$1(metadata.final_pass_ts)
	};
}
async function loadLifecycleLogs(root, featureId) {
	const logsRoot = path.join(root, ".dossier", "logs");
	if (!await fileExists(logsRoot)) return [];
	const files = await walk(logsRoot, [], {
		includeFile: (filePath) => filePath.endsWith(".md"),
		rootDir: logsRoot
	});
	const logs = [];
	for (const filePath of files.sort()) {
		const parsed = await readLifecycleLog(root, filePath);
		if (parsed?.featureId === featureId) logs.push(parsed);
	}
	return logs;
}
function chooseFeatureCycleId(logs, requested) {
	if (requested) return requested;
	const ids = [...new Set(logs.map((log) => log.featureCycleId))].sort();
	if (ids.length === 1 && ids[0]) return ids[0];
	throw new Error(ids.length === 0 ? "No lifecycle logs with feature_cycle_id were found for the requested feature." : `Multiple feature_cycle_id values exist for this feature (${ids.join(", ")}). Pass --feature-cycle-id explicitly.`);
}
function aggregateStage(logs) {
	const sorted = [...logs].sort(compareByTimestamp);
	return {
		cycleIds: toStringArray$2(sorted.map((log) => log.cycleId)),
		logPaths: sorted.map((log) => log.pathRel),
		sessionIds: toStringArray$2(sorted.map((log) => log.sessionId)),
		stepArtifacts: toStringArray$2(sorted.map((log) => log.stepArtifact)),
		startTs: sorted.find((log) => log.startTs)?.startTs ?? null,
		intakeProcessCompleteTs: [...sorted].reverse().find((log) => log.intakeProcessCompleteTs)?.intakeProcessCompleteTs ?? null,
		localGatesGreenTs: [...sorted].reverse().find((log) => log.localGatesGreenTs)?.localGatesGreenTs ?? null,
		processCompleteTs: [...sorted].reverse().find((log) => log.processCompleteTs)?.processCompleteTs ?? null,
		stepCloseTs: [...sorted].reverse().find((log) => log.stepCloseTs)?.stepCloseTs ?? null,
		firstReviewAgentStartedTs: sorted.find((log) => log.firstReviewAgentStartedTs)?.firstReviewAgentStartedTs ?? null,
		finalPassTs: [...sorted].reverse().find((log) => log.finalPassTs)?.finalPassTs ?? null,
		reviewEvents: sorted.flatMap((log) => toEventRecords(log.metadata.review_events)),
		verificationEvents: sorted.flatMap((log) => toEventRecords(log.metadata.verification_events)),
		backlogEvents: sorted.flatMap((log) => toEventRecords(log.metadata.backlog_events)),
		operatorInterventions: sorted.flatMap((log) => toEventRecords(log.metadata.operator_interventions)),
		processMissEvents: sorted.flatMap((log) => toEventRecords(log.metadata.process_miss_events)),
		hardIncidentEvents: sorted.flatMap((log) => toEventRecords(log.metadata.hard_incident_events))
	};
}
async function validateImplementationLogEnd(root, featureId, log) {
	if (!log.processCompleteTs || !log.stepArtifact) return null;
	const absPath = await resolveManagedReadPath(root, log.stepArtifact, path.join(root, ".dossier", "steps", featureId), "implementation step artifact");
	if (!await fileExists(absPath)) throw new Error(`Implementation step artifact is missing: ${path.relative(root, absPath).split(path.sep).join("/")}`);
	const parsed = JSON.parse(await readText(absPath));
	return parsed?.process_complete === true && parsed.feature_id === featureId && parsed.step === "implementation" ? log.processCompleteTs : null;
}
async function validateImplementationClosure(root, featureId, logs) {
	for (const log of [...logs].sort(compareByTimestamp).reverse()) {
		const validated = await validateImplementationLogEnd(root, featureId, log);
		if (validated) return validated;
	}
	return null;
}
function countVerificationFailures(aggregate) {
	return aggregate.verificationEvents.filter((event) => String(event.status) === "fail").length;
}
function countBacklogFailures(aggregate) {
	return aggregate.backlogEvents.filter((event) => {
		const status = stableString(event.status ?? event.result ?? event.outcome ?? "");
		return [
			"blocked",
			"failed",
			"incomplete"
		].includes(status);
	}).length;
}
function countOperatorInterventions(aggregate) {
	return aggregate.operatorInterventions.length;
}
function countRerounds(aggregate) {
	const validEvents = aggregate.reviewEvents.filter((event) => event.invalidated !== true && event.allowed_by_policy !== false);
	return Math.max(validEvents.length - 1, 0);
}
async function endTimestampForLog(root, featureId, log) {
	if (log.stage === "feature-intake") return log.intakeProcessCompleteTs;
	if (log.stage === "implementation") return validateImplementationLogEnd(root, featureId, log);
	return log.processCompleteTs ?? log.stepCloseTs ?? log.finalPassTs;
}
async function buildSessionIndexRecords(root, logs, featureCycleId) {
	const records = [];
	for (const log of logs) records.push({
		version: 1,
		feature_cycle_id: featureCycleId,
		feature_id: log.featureId,
		backlog_item_key: log.backlogItemKey,
		stage: log.stage,
		session_id: log.sessionId,
		trace_runtime: log.traceRuntime,
		trace_locator_kind: log.traceLocatorKind,
		stage_log_path: log.pathRel,
		start_ts: log.startTs,
		end_ts: await endTimestampForLog(root, log.featureId, log)
	});
	return records;
}
async function writeSessionIndex(root, records) {
	const outputPath = path.join(root, ".dossier", "retro", "session-index.jsonl");
	const existingRecords = (await fileExists(outputPath) ? await readText(outputPath) : "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => JSON.parse(line));
	const replacementKeys = new Set(records.map((record) => `${record.feature_cycle_id}::${record.stage}::${record.stage_log_path}`));
	const merged = [...existingRecords.filter((record) => {
		const key = `${record.feature_cycle_id}::${record.stage}::${record.stage_log_path}`;
		return !replacementKeys.has(key);
	}), ...records].sort((left, right) => {
		const leftKey = `${left.feature_id}:${left.feature_cycle_id}:${left.stage}:${left.stage_log_path}`;
		const rightKey = `${right.feature_id}:${right.feature_cycle_id}:${right.stage}:${right.stage_log_path}`;
		return leftKey.localeCompare(rightKey);
	});
	await assertManagedWritePath(root, path.join(root, ".dossier", "retro"), outputPath, "lifecycle session index");
	await writeTextAtomic(outputPath, `${merged.map((record) => JSON.stringify(record)).join("\n")}${merged.length > 0 ? "\n" : ""}`);
	return outputPath;
}
async function refreshLifecycleArtifacts(options) {
	const root = path.resolve(options.root);
	const featureId = sanitizeFeatureId(options.featureId, "feature id");
	const logs = await loadLifecycleLogs(root, featureId);
	const featureCycleId = chooseFeatureCycleId(logs, options.featureCycleId ?? null);
	const cycleLogs = logs.filter((log) => log.featureCycleId === featureCycleId);
	if (cycleLogs.length === 0) throw new Error(`No lifecycle logs were found for feature ${featureId} and feature_cycle_id ${featureCycleId}.`);
	const grouped = /* @__PURE__ */ new Map();
	for (const stage of LIFECYCLE_STAGES) grouped.set(stage, cycleLogs.filter((log) => log.stage === stage).sort(compareByTimestamp));
	const intake = aggregateStage(grouped.get("feature-intake") ?? []);
	const specCompact = aggregateStage(grouped.get("spec-compact") ?? []);
	const planSlice = aggregateStage(grouped.get("plan-slice") ?? []);
	const implementation = aggregateStage(grouped.get("implementation") ?? []);
	const changeProposal = aggregateStage(grouped.get("change-proposal") ?? []);
	implementation.processCompleteTs = await validateImplementationClosure(root, featureId, grouped.get("implementation") ?? []);
	const backlogItemKey = cycleLogs.find((log) => log.backlogItemKey)?.backlogItemKey ?? null;
	const sessionIndexRecords = await buildSessionIndexRecords(root, cycleLogs, featureCycleId);
	const snapshot = {
		version: 1,
		generated_at: (/* @__PURE__ */ new Date()).toISOString(),
		feature_id: featureId,
		feature_cycle_id: featureCycleId,
		identity: {
			feature_id: featureId,
			feature_cycle_id: featureCycleId,
			backlog_item_key: backlogItemKey
		},
		lifecycle: {
			feature_cycle_time_ms: diffMillis(intake.startTs, implementation.processCompleteTs),
			intake: {
				cycle_ids: intake.cycleIds,
				log_paths: intake.logPaths,
				session_ids: intake.sessionIds,
				start_ts: intake.startTs,
				intake_process_complete_ts: intake.intakeProcessCompleteTs
			},
			stages: {
				"spec-compact": {
					cycle_ids: specCompact.cycleIds,
					log_paths: specCompact.logPaths,
					session_ids: specCompact.sessionIds,
					start_ts: specCompact.startTs,
					local_gates_green_ts: specCompact.localGatesGreenTs,
					process_complete_ts: specCompact.processCompleteTs,
					step_close_ts: specCompact.stepCloseTs,
					step_artifacts: specCompact.stepArtifacts,
					first_review_agent_started_ts: specCompact.firstReviewAgentStartedTs,
					final_pass_ts: specCompact.finalPassTs
				},
				"plan-slice": {
					cycle_ids: planSlice.cycleIds,
					log_paths: planSlice.logPaths,
					session_ids: planSlice.sessionIds,
					start_ts: planSlice.startTs,
					local_gates_green_ts: planSlice.localGatesGreenTs,
					process_complete_ts: planSlice.processCompleteTs,
					step_close_ts: planSlice.stepCloseTs,
					step_artifacts: planSlice.stepArtifacts,
					first_review_agent_started_ts: planSlice.firstReviewAgentStartedTs,
					final_pass_ts: planSlice.finalPassTs
				},
				implementation: {
					cycle_ids: implementation.cycleIds,
					log_paths: implementation.logPaths,
					session_ids: implementation.sessionIds,
					start_ts: implementation.startTs,
					local_gates_green_ts: implementation.localGatesGreenTs,
					process_complete_ts: implementation.processCompleteTs,
					step_close_ts: implementation.stepCloseTs,
					step_artifacts: implementation.stepArtifacts,
					first_review_agent_started_ts: implementation.firstReviewAgentStartedTs,
					final_pass_ts: implementation.finalPassTs
				},
				"change-proposal": {
					cycle_ids: changeProposal.cycleIds,
					log_paths: changeProposal.logPaths,
					session_ids: changeProposal.sessionIds,
					start_ts: changeProposal.startTs,
					local_gates_green_ts: changeProposal.localGatesGreenTs,
					process_complete_ts: changeProposal.processCompleteTs,
					step_close_ts: changeProposal.stepCloseTs,
					step_artifacts: changeProposal.stepArtifacts,
					first_review_agent_started_ts: changeProposal.firstReviewAgentStartedTs,
					final_pass_ts: changeProposal.finalPassTs
				}
			}
		},
		metrics: {
			phase_cycle_time_ms: {
				"feature-intake": diffMillis(intake.startTs, intake.intakeProcessCompleteTs),
				"spec-compact": diffMillis(specCompact.startTs, specCompact.processCompleteTs),
				"plan-slice": diffMillis(planSlice.startTs, planSlice.processCompleteTs),
				implementation: diffMillis(implementation.startTs, implementation.processCompleteTs),
				"change-proposal": diffMillis(changeProposal.startTs, changeProposal.processCompleteTs)
			},
			review_loop_time_ms: diffMillis(earliestTimestamp([
				specCompact.firstReviewAgentStartedTs,
				planSlice.firstReviewAgentStartedTs,
				implementation.firstReviewAgentStartedTs,
				changeProposal.firstReviewAgentStartedTs
			]), latestTimestamp([
				specCompact.finalPassTs,
				planSlice.finalPassTs,
				implementation.finalPassTs,
				changeProposal.finalPassTs
			])),
			rerounds_per_feature: countRerounds(specCompact) + countRerounds(planSlice) + countRerounds(implementation) + countRerounds(changeProposal),
			first_pass_close: implementation.processCompleteTs === null ? null : countRerounds(specCompact) + countRerounds(planSlice) + countRerounds(implementation) + countRerounds(changeProposal) === 0,
			closure_latency_ms: diffMillis(implementation.localGatesGreenTs, implementation.stepCloseTs),
			verification_failures_total: countVerificationFailures(specCompact) + countVerificationFailures(planSlice) + countVerificationFailures(implementation) + countVerificationFailures(changeProposal),
			backlog_actualization_failures_total: countBacklogFailures(specCompact) + countBacklogFailures(planSlice) + countBacklogFailures(implementation) + countBacklogFailures(changeProposal) + countBacklogFailures(intake),
			operator_interventions_total: countOperatorInterventions(specCompact) + countOperatorInterventions(planSlice) + countOperatorInterventions(implementation) + countOperatorInterventions(changeProposal) + countOperatorInterventions(intake)
		},
		session_index_records: sessionIndexRecords
	};
	const metricsPath = path.join(root, ".dossier", "metrics", featureId, `${featureCycleId}.json`);
	await assertManagedWritePath(root, path.join(root, ".dossier", "metrics", featureId), metricsPath, "lifecycle metrics snapshot");
	await writeJsonAtomic(metricsPath, snapshot);
	return {
		featureId,
		featureCycleId,
		snapshot,
		metricsPath,
		sessionIndexPath: await writeSessionIndex(root, sessionIndexRecords)
	};
}
//#endregion
//#region src/vendor/dossier-engineer/core/markdown.ts
var EXECUTABLE_SECTION_PATTERNS = [
	/scope/i,
	/requirements/i,
	/acceptance criteria/i,
	/non-functional/i,
	/^nfr$/i,
	/design/i,
	/definition of done/i,
	/verification/i,
	/test plan/i,
	/coverage map/i,
	/rollout/i,
	/activation/i,
	/edge cases/i,
	/failure modes/i,
	/slicing plan/i
];
var DOD_HEADING_PATTERN = /^#{2,6}\s+.*definition of done.*$/im;
var VERIFICATION_HEADING_PATTERN = /^#{2,6}\s+.*(verification|test plan|coverage map).*$/im;
var ROLLOUT_HEADING_PATTERN = /^#{2,6}\s+.*(rollout|activation|cutover|rollback).*$/im;
var BOUNDARY_TRIGGER_PATTERN = /`?(GET|POST|PUT|PATCH|DELETE)\s+\/|^\s*-\s*(body|response|payload|dto|event|webhook)\b/im;
var CONTRACT_CUE_PATTERN = /\b(contract|schema|openapi|json schema|error model|retry|idempotent|idempotency|backward-compat|compatibility)\b/i;
var MEASURABLE_NFR_CUE_PATTERN = /\b(metric|metrics|budget|threshold|signal|signals|p\d{2}|latency|availability|throughput|counter|gauge|histogram|log|logs|trace|traces|event|events|ms|seconds?|minutes?|hours?)\b/i;
var OPEN_QUESTION_READY_CUE_PATTERN = /\bneeded[_ ]by\b/i;
var BEFORE_PLANNED_CUE_PATTERN = /\bneeded[_ ]by\b[^\n]*\bbefore[_ -]planned\b/i;
var DEPENDENCY_NOTE_PATTERN = /^\s*(?:[-*]\s*)?depends on:\s*/im;
var OWNER_CUE_PATTERN = /@\w+|\bowner\b/i;
var UNBLOCK_CUE_PATTERN = /\bunblock\b/i;
var ROLLOUT_TRIGGER_PATTERN = /\b(feature flag|backfill|cutover|activation|rollback|rollout|dual[- ]write|migrat(?:e|ion)|irreversible)\b/i;
var REPLANNING_REASON_TAG_PATTERN = /\[(clarification|scope realignment|dependency realignment|risk discovery|contract drift)\]/i;
var COMPOUND_AC_PATTERN = /\b(and\/or|and|or)\b/i;
var RAW_TBD_PATTERN = /\bTBD\b/i;
var VAGUE_EXECUTABLE_PATTERNS = [
	{
		label: "etc.",
		pattern: /\betc\./i
	},
	{
		label: "usually",
		pattern: /\busually\b/i
	},
	{
		label: "as appropriate",
		pattern: /\bas appropriate\b/i
	},
	{
		label: "fast",
		pattern: /\bfast\b/i
	},
	{
		label: "user-friendly",
		pattern: /\buser-friendly\b/i
	}
];
function parseTopLevelSections(markdown) {
	const lines = String(markdown ?? "").split(/\r?\n/);
	const sections = /* @__PURE__ */ new Map();
	let currentHeading = "__preamble__";
	let buffer = [];
	const flush = () => {
		sections.set(currentHeading, buffer.join("\n").trim());
	};
	for (const line of lines) {
		const headingMatch = line.match(/^##\s+(.+)$/);
		if (headingMatch) {
			flush();
			currentHeading = headingMatch[1]?.trim() ?? "__preamble__";
			buffer = [];
			continue;
		}
		buffer.push(line);
	}
	flush();
	return sections;
}
function normalizeSectionText(text) {
	return String(text ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trim();
}
function getSectionText(markdown, headingPattern) {
	return [...parseTopLevelSections(markdown).entries()].filter(([heading]) => heading !== "__preamble__" && headingPattern.test(heading)).map(([, body]) => body).join("\n").trim();
}
function hasHeading(markdown, headingPattern) {
	return headingPattern.test(String(markdown));
}
function collectExecutableSectionLines(markdown) {
	const sections = parseTopLevelSections(markdown);
	const lines = [];
	for (const [heading, body] of sections) {
		if (heading === "__preamble__") continue;
		if (!EXECUTABLE_SECTION_PATTERNS.some((pattern) => pattern.test(heading))) continue;
		lines.push(...String(body).split(/\r?\n/));
	}
	return lines.map((line) => line.trim()).filter(Boolean);
}
function extractAcStatementLines(markdown) {
	const lines = String(markdown).split(/\r?\n/);
	const acStatements = [];
	for (const line of lines) {
		const match = line.match(/\b(AC-F\d{4}-\d{1,2})\b/);
		if (!match) continue;
		const acId = (match[1] ?? "").replace(/-(\d{1,2})$/, (_, number) => `-${number.padStart(2, "0")}`);
		acStatements.push({
			acId,
			line: line.trim()
		});
	}
	return acStatements;
}
function isShapedOrLaterStatus(status) {
	return [
		"shaped",
		"planned",
		"in_progress",
		"done"
	].includes(String(status));
}
function isPlannedOrLaterStatus(status) {
	return [
		"planned",
		"in_progress",
		"done"
	].includes(String(status));
}
function sectionLooksExplicitlyNone(text) {
	return /\bnone\b|\bno open questions\b/i.test(String(text));
}
function countBulletEntries(text) {
	return String(text).split(/\r?\n/).filter((line) => /^\s*-\s+/.test(line)).length;
}
function hasExecutableSectionChange(beforeSections, afterSections) {
	const changedSections = [];
	const allHeadings = new Set([...beforeSections.keys(), ...afterSections.keys()]);
	for (const heading of allHeadings) {
		if (heading === "__preamble__") continue;
		if (normalizeSectionText(beforeSections.get(heading)) === normalizeSectionText(afterSections.get(heading))) continue;
		if (EXECUTABLE_SECTION_PATTERNS.some((pattern) => pattern.test(heading))) changedSections.push(heading);
	}
	return changedSections;
}
//#endregion
//#region src/vendor/dossier-engineer/core/lint-dossiers.ts
function toStringArray$1(value) {
	return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
function stringOrFallback$1(value, fallback = "") {
	return typeof value === "string" ? value : fallback;
}
function frontmatterString$1(frontmatter, key, fallback = "") {
	return stringOrFallback$1(frontmatter[key], fallback);
}
function describeValue(value) {
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null || value === void 0) return String(value);
	try {
		return JSON.stringify(value) ?? "[unserializable]";
	} catch {
		return "[unserializable]";
	}
}
function analyzeDossiers(dossiers) {
	const findings = [];
	const featureIds = /* @__PURE__ */ new Set();
	for (const dossier of dossiers) {
		const frontmatter = dossier.frontmatter ?? {};
		const feature = frontmatterString$1(frontmatter, "id", dossier.relPath);
		const required = [
			["id", frontmatter.id],
			["title", frontmatter.title],
			["status", frontmatter.status],
			["area", frontmatter.area],
			["owners", frontmatter.owners],
			["depends_on", frontmatter.depends_on],
			["impacts", frontmatter.impacts],
			["created", frontmatter.created],
			["updated", frontmatter.updated]
		];
		for (const [key, value] of required) if (value === void 0 || value === null || typeof value === "string" && value.trim() === "") findings.push({
			level: "error",
			feature,
			message: `Missing required frontmatter key: ${key}`
		});
		if (typeof frontmatter.id !== "string" || !/^F-\d{4}$/.test(frontmatter.id)) findings.push({
			level: "error",
			feature,
			message: `Invalid feature id "${describeValue(frontmatter.id)}" (expected F-0001).`
		});
		else {
			if (featureIds.has(frontmatter.id)) findings.push({
				level: "error",
				feature: frontmatter.id,
				message: `Duplicate feature id across dossiers: ${frontmatter.id}`
			});
			featureIds.add(frontmatter.id);
		}
		if (typeof frontmatter.status !== "string" || !DOSSIER_STATUSES.has(frontmatter.status)) findings.push({
			level: "error",
			feature,
			message: `Invalid status "${describeValue(frontmatter.status)}" (allowed: ${[...DOSSIER_STATUSES].join(", ")}).`
		});
		if (!Array.isArray(frontmatter.owners) || frontmatter.owners.length === 0) findings.push({
			level: "error",
			feature,
			message: "owners must be a non-empty array (for example: owners: [\"@you\"])."
		});
		for (const [key, value] of [["created", frontmatter.created], ["updated", frontmatter.updated]]) if (typeof value === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) findings.push({
			level: "warn",
			feature,
			message: `${key} should be YYYY-MM-DD (got "${value}").`
		});
		if (frontmatter.coverage_gate !== void 0 && (typeof frontmatter.coverage_gate !== "string" || !COVERAGE_GATES.has(frontmatter.coverage_gate))) findings.push({
			level: "error",
			feature,
			message: `Invalid coverage_gate "${describeValue(frontmatter.coverage_gate)}" (allowed: ${[...COVERAGE_GATES].join(", ")}).`
		});
		if (frontmatter.coverage_gate === void 0 && [
			"planned",
			"in_progress",
			"done"
		].includes(String(frontmatter.status))) findings.push({
			level: "warn",
			feature,
			message: "coverage_gate is not explicit. Add `coverage_gate: deferred|strict` so workflow state and coverage enforcement stay separate."
		});
		if (dossier.acIds.length === 0) findings.push({
			level: frontmatter.status === "proposed" ? "warn" : "error",
			feature,
			message: frontmatter.status === "proposed" ? "No acceptance criteria IDs found yet. Add at least one AC-F....-.. entry before leaving the proposed intake state." : "No acceptance criteria IDs found. Add at least one AC-F....-.. entry."
		});
		const featureNum = extractFeatureNumericId(typeof frontmatter.id === "string" ? frontmatter.id : null);
		if (featureNum) {
			for (const acId of dossier.acIds) if (!acId.startsWith(`AC-F${featureNum}-`)) findings.push({
				level: "error",
				feature: String(frontmatter.id),
				message: `AC ID "${acId}" does not match feature numeric id ${featureNum}.`
			});
		}
		if (dossier.coverageGate === "strict") if (dossier.coverageIds.length === 0) findings.push({
			level: "error",
			feature,
			message: "Missing Coverage map rows for a strict coverage gate (expected rows like \"| AC-F....-.. |\")."
		});
		else {
			const missingCoverageRows = dossier.acIds.filter((acId) => !dossier.coverageIds.includes(acId));
			if (missingCoverageRows.length > 0) findings.push({
				level: "error",
				feature,
				message: `Coverage map is missing AC rows: ${missingCoverageRows.join(", ")}`
			});
		}
		else if (dossier.coverageIds.length === 0) findings.push({
			level: "warn",
			feature,
			message: "Coverage map rows are recommended even when coverage is deferred."
		});
		if (!hasChangeLogEntry(dossier.markdown)) findings.push({
			level: "warn",
			feature,
			message: "Missing Change log section. Add at least an initial entry for traceability."
		});
		const status = frontmatter.status;
		if (isShapedOrLaterStatus(status) && !hasHeading(dossier.markdown, DOD_HEADING_PATTERN)) findings.push({
			level: "warn",
			feature,
			message: "Missing Definition of Done section for a shaped/planned+ dossier. Add a compact closure target before implementation."
		});
		if (isShapedOrLaterStatus(status) && !hasHeading(dossier.markdown, VERIFICATION_HEADING_PATTERN) && dossier.coverageIds.length === 0) findings.push({
			level: "warn",
			feature,
			message: "Missing verification cue for a shaped/planned+ dossier. Add a verification section or an initial coverage plan."
		});
		const designText = getSectionText(dossier.markdown, /design/i);
		const openQuestionsText = getSectionText(dossier.markdown, /open questions/i);
		const slicingText = getSectionText(dossier.markdown, /slicing plan/i);
		const changeLogText = getSectionText(dossier.markdown, /change log/i);
		if (isShapedOrLaterStatus(status) && designText && BOUNDARY_TRIGGER_PATTERN.test(designText) && !CONTRACT_CUE_PATTERN.test(designText)) findings.push({
			level: "warn",
			feature,
			message: "Boundary I/O appears in the compact design, but no contract/schema/error-model cue was found. Add a compact contract sketch or link to the canonical contract."
		});
		const nfrText = getSectionText(dossier.markdown, /\bnon-functional\b|\bnfr\b/i);
		if (isShapedOrLaterStatus(status) && nfrText && !MEASURABLE_NFR_CUE_PATTERN.test(nfrText)) findings.push({
			level: "warn",
			feature,
			message: "NFR section looks aspirational. Add a metric, budget/threshold, or observable signal for any normative NFR."
		});
		if (isShapedOrLaterStatus(status) && openQuestionsText && !sectionLooksExplicitlyNone(openQuestionsText) && !OPEN_QUESTION_READY_CUE_PATTERN.test(openQuestionsText)) findings.push({
			level: "warn",
			feature,
			message: "Open questions are present without a planning-readiness cue. Add owner/date plus `needed_by: before_planned|before_implementation|before_done` and a next decision path."
		});
		if (isPlannedOrLaterStatus(status) && openQuestionsText && BEFORE_PLANNED_CUE_PATTERN.test(openQuestionsText)) findings.push({
			level: "warn",
			feature,
			message: "A planned/in-progress dossier still contains an open question marked `needed_by: before_planned`. Resolve it or reclassify the readiness gate before keeping the dossier planned+."
		});
		const dependsOn = toStringArray$1(frontmatter.depends_on);
		if (isPlannedOrLaterStatus(status) && dependsOn.length > 0 && (!slicingText || !DEPENDENCY_NOTE_PATTERN.test(slicingText) || !OWNER_CUE_PATTERN.test(slicingText) || !UNBLOCK_CUE_PATTERN.test(slicingText))) findings.push({
			level: "warn",
			feature,
			message: "Planned+ dossier has dependencies, but the slicing plan does not show clear `Depends on:` visibility with owner and unblock condition. Add the dependency note where it affects delivery order."
		});
		if (isPlannedOrLaterStatus(status) && `${designText}\n${slicingText}`.trim() && ROLLOUT_TRIGGER_PATTERN.test(`${designText}\n${slicingText}`) && !hasHeading(dossier.markdown, ROLLOUT_HEADING_PATTERN)) findings.push({
			level: "warn",
			feature,
			message: "Planning/design text suggests rollout order matters, but no rollout / activation note was found. Add a compact activation order and rollback-limits note."
		});
		if (isPlannedOrLaterStatus(status) && countBulletEntries(changeLogText) > 1 && !REPLANNING_REASON_TAG_PATTERN.test(changeLogText)) findings.push({
			level: "warn",
			feature,
			message: "Change log shows mature replanning, but no short reason tags were found. Prefer tags like `[clarification]`, `[scope realignment]`, `[dependency realignment]`, `[risk discovery]`, or `[contract drift]`."
		});
		const compoundAcIds = extractAcStatementLines(dossier.markdown).filter(({ line }) => COMPOUND_AC_PATTERN.test(line)).map(({ acId }) => acId);
		if (compoundAcIds.length > 0) findings.push({
			level: "warn",
			feature,
			message: `Potential compound ACs detected: ${compoundAcIds.join(", ")}. Prefer one obligation per AC.`
		});
		const executableLines = collectExecutableSectionLines(dossier.markdown);
		if (executableLines.some((line) => RAW_TBD_PATTERN.test(line))) findings.push({
			level: "warn",
			feature,
			message: "Raw TBD found in executable sections. Convert it into an Open question with an owner/date or explicit next decision path."
		});
		const vagueMatches = executableLines.flatMap((line) => VAGUE_EXECUTABLE_PATTERNS.filter(({ pattern }) => pattern.test(line)).map(({ label }) => ({
			label,
			line
		})));
		if (vagueMatches.length > 0) {
			const samples = vagueMatches.slice(0, 2).map(({ label, line }) => `"${label}" in "${line}"`).join("; ");
			findings.push({
				level: "warn",
				feature,
				message: `Vague wording in executable sections: ${samples}. Rewrite the statement more concretely.`
			});
		}
		for (const dependency of toStringArray$1(frontmatter.depends_on)) if (!/^F-\d{4}$/.test(dependency)) findings.push({
			level: "error",
			feature,
			message: `Invalid depends_on entry "${dependency}" (expected F-0002).`
		});
	}
	for (const dossier of dossiers) {
		const frontmatter = dossier.frontmatter ?? {};
		const feature = frontmatterString$1(frontmatter, "id", dossier.relPath);
		for (const dependency of toStringArray$1(frontmatter.depends_on)) if (/^F-\d{4}$/.test(dependency) && !featureIds.has(dependency)) findings.push({
			level: "error",
			feature,
			message: `depends_on references missing dossier: ${dependency}`
		});
	}
	return findings;
}
function renderLintSummary(findings, dossierCount) {
	const errors = findings.filter((finding) => finding.level === "error");
	const warnings = findings.filter((finding) => finding.level === "warn");
	const byFeature = /* @__PURE__ */ new Map();
	for (const finding of findings) {
		const key = finding.feature ?? "global";
		if (!byFeature.has(key)) byFeature.set(key, []);
		byFeature.get(key)?.push(finding);
	}
	const lines = [`Found ${errors.length} error(s), ${warnings.length} warning(s) across ${dossierCount} dossier(s).`];
	for (const [feature, items] of [...byFeature.entries()].sort((left, right) => String(left[0]).localeCompare(String(right[0])))) for (const item of items) lines.push(`- [${item.level.toUpperCase()}] ${feature}: ${item.message}`);
	return lines.join("\n");
}
function buildRedFlagsBlock(findings) {
	return findings.length > 0 ? findings.map((finding) => `- **${finding.level.toUpperCase()}** ${finding.feature ?? "global"} — ${finding.message}`).join("\n") : "- ✅ No red flags detected.";
}
//#endregion
//#region src/vendor/dossier-engineer/core/workflow.ts
var WORKFLOW_STAGES = new Set([
	"spec-compact",
	"plan-slice",
	"implementation",
	"change-proposal"
]);
function normalizeWorkflowStage(value) {
	return typeof value === "string" && WORKFLOW_STAGES.has(value) ? value : null;
}
function statusToNextStep(status) {
	switch (status) {
		case "proposed": return "spec-compact";
		case "shaped": return "plan-slice";
		case "planned":
		case "in_progress": return "implementation";
		default: return null;
	}
}
function defaultNextStep(status, step) {
	if (step === "feature-intake") return "spec-compact";
	if (step === "spec-compact") return "plan-slice";
	if (step === "plan-slice") return "implementation";
	return statusToNextStep(status);
}
//#endregion
//#region src/vendor/dossier-engineer/commands.ts
var CLI_DISPLAY_NAME = "dossier-engineer";
var DEFAULT_INDEX_FILE = "docs/ssot/index.md";
var BACKLOG_DELIVERY_STATES = [
	"defined",
	"specified",
	"planned",
	"implemented"
];
var UsageError = class extends Error {
	helpText;
	constructor(message, helpText) {
		super(message);
		this.name = "UsageError";
		this.helpText = helpText;
	}
};
function writeLine$1(stream, line = "") {
	stream.write(`${line}\n`);
}
function hasOption(argv, ...names) {
	return names.some((name) => argv.includes(name));
}
function takeOption$3(argv, name, fallback = null) {
	const exact = argv.indexOf(name);
	if (exact !== -1) {
		const value = argv[exact + 1];
		if (!value || value.startsWith("--")) return fallback;
		return value;
	}
	const prefix = `${name}=`;
	const inline = argv.find((arg) => arg.startsWith(prefix));
	return inline ? inline.slice(prefix.length) : fallback;
}
function takeManyOptions$1(argv, name) {
	const values = [];
	const prefix = `${name}=`;
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === name) {
			const value = argv[index + 1];
			if (value && !value.startsWith("--")) values.push(value);
			continue;
		}
		if (arg?.startsWith(prefix)) values.push(arg.slice(prefix.length));
	}
	return values;
}
function ensureRequired$1(value, message, helpText) {
	if (!value) throw new UsageError(message, helpText);
	return value;
}
function ensureNonEmpty(values, message, helpText) {
	if (values.length === 0) throw new UsageError(message, helpText);
	return values;
}
function ensureEnumValue(value, allowedValues, optionName, helpText) {
	if (allowedValues.includes(value)) return value;
	throw new UsageError(`${optionName} must be one of: ${allowedValues.map((item) => `"${item}"`).join(", ")}.`, helpText);
}
function toStringArray(value) {
	return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
function stringOrFallback(value, fallback = "") {
	return typeof value === "string" ? value : fallback;
}
function frontmatterString(frontmatter, key, fallback = "") {
	return stringOrFallback(frontmatter[key], fallback);
}
function relativeToRoot(root, targetPath) {
	return path.relative(root, targetPath).split(path.sep).join("/");
}
function quoteArg(value) {
	return /^[A-Za-z0-9_./:=,@+-]+$/.test(value) ? value : JSON.stringify(value);
}
function formatCli(parts) {
	return parts.map((part) => quoteArg(part)).join(" ");
}
function canonicalCli(commandName, args = []) {
	return formatCli([
		"dossier-engineer",
		commandName,
		...args
	]);
}
function slugify$1(value) {
	return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "feature";
}
function yamlFlowStringArray(values) {
	return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
}
function nextFeatureId(dossiers) {
	const maxNumeric = dossiers.reduce((current, dossier) => {
		const match = String(dossier.frontmatter.id).match(/^F-(\d{4})$/);
		return match ? Math.max(current, Number.parseInt(match[1] ?? "0", 10)) : current;
	}, 0);
	return `F-${String(maxNumeric + 1).padStart(4, "0")}`;
}
function renderInitialDossier(params) {
	const { area, backlogBlockers, backlogDeliveryState, backlogDependencies, backlogItemKey, backlogSources, created, dependsOn, featureId, impacts, owners, title } = params;
	const formatNestedList = (values) => values.length > 0 ? values.map((value) => `    - ${value}`).join("\n") : "    - none recorded";
	return `---
id: ${featureId}
title: ${title}
status: proposed
coverage_gate: deferred
backlog_item_key: ${backlogItemKey}
owners: ${yamlFlowStringArray(owners)}
area: ${area}
depends_on: ${yamlFlowStringArray(dependsOn)}
impacts: ${yamlFlowStringArray(impacts)}
created: ${created}
updated: ${created}
links:
  issue: ""
  pr: []
  docs: []
---

## 1. Context & Goal

- **Backlog handoff:**
  - Backlog item key: ${backlogItemKey}
  - Backlog delivery state at intake: ${backlogDeliveryState}
  - Source traceability:
${formatNestedList(backlogSources)}
  - Known blockers at intake:
${formatNestedList(backlogBlockers)}
  - Known dependencies at intake:
${formatNestedList(backlogDependencies)}
- User problem:
- Goal:
- Non-goals:
- Current substrate / baseline:

## 2. Scope

### In scope

### Out of scope

### Constraints

### Assumptions (optional)

### Open questions (optional)

## 3. Requirements & Acceptance Criteria (SSoT)

## 4. Non-functional requirements (NFR)

## 5. Design (compact)

### 5.1 API surface

### 5.2 Runtime / deployment surface

### 5.3 Data model changes

### 5.4 Edge cases and failure modes

### 5.5 Verification surface / initial verification plan

### 5.6 Representation upgrades (triggered only when needed)

### 5.7 Definition of Done

### 5.8 Rollout / activation note (triggered only when needed)

## 6. Slicing plan (2–6 increments)

## 7. Task list (implementation units)

## 8. Test plan & Coverage map

| AC ID | Test reference | Status |
|---|---|---|

## 9. Decision log (ADR blocks)

## 10. Progress & links

- Backlog item key: ${backlogItemKey}
- Status progression: \`proposed -> shaped -> planned -> in_progress -> done\`
- Issue:
- PRs:

## 11. Change log

- ${created}: Initial dossier created from backlog item \`${backlogItemKey}\` at backlog delivery state \`${backlogDeliveryState}\`.
`;
}
function replaceBlock(content, beginMarker, endMarker, block) {
	const begin = content.indexOf(beginMarker);
	const end = content.indexOf(endMarker);
	if (begin === -1 || end === -1 || end < begin) return `${content.trim()}\n\n${beginMarker}\n${block}\n${endMarker}\n`;
	return `${content.slice(0, begin + beginMarker.length)}\n${block}\n${content.slice(end)}`;
}
function escapePipe(value) {
	return String(value).replace(/\|/g, "\\|");
}
function escapeQuotes(value) {
	return String(value).replace(/"/g, "\\\"");
}
function buildMermaidGraph(dossiers) {
	const nodes = dossiers.map((dossier) => {
		const frontmatter = dossier.frontmatter ?? {};
		const featureId = frontmatterString(frontmatter, "id", dossier.relPath);
		const title = frontmatterString(frontmatter, "title");
		return `  ${featureId.replace(/-/g, "")}["${escapeQuotes(`${featureId} ${title}`.trim())}"]`;
	});
	const edges = [];
	for (const dossier of dossiers) {
		const frontmatter = dossier.frontmatter ?? {};
		const from = frontmatterString(frontmatter, "id", dossier.relPath).replace(/-/g, "");
		for (const dependency of toStringArray(frontmatter.depends_on)) edges.push(`  ${from} --> ${String(dependency).replace(/-/g, "")}`);
	}
	return [
		"```mermaid",
		"graph TD",
		...nodes,
		...edges,
		"```"
	].join("\n");
}
function featureRow(dossier, indexDir) {
	const frontmatter = dossier.frontmatter ?? {};
	const dependsOn = toStringArray(frontmatter.depends_on);
	const impacts = toStringArray(frontmatter.impacts);
	const relPath = path.relative(indexDir, dossier.absPath).split(path.sep).join("/");
	return `| ${frontmatterString(frontmatter, "id", "—")} | ${escapePipe(frontmatterString(frontmatter, "title"))} | ${frontmatterString(frontmatter, "status")} | ${dossier.coverageGate} | ${frontmatterString(frontmatter, "area")} | ${dependsOn.length > 0 ? dependsOn.join(", ") : "—"} | ${impacts.length > 0 ? impacts.join(",") : "—"} | \`${relPath}\` |`;
}
function ensureIndexSkeleton() {
	return `# SSOT Index

> Single-file navigation source of truth.
> **Do not duplicate requirements here.** Link to Feature Dossiers instead.

_Last sync: ${(/* @__PURE__ */ new Date()).toISOString()}_

## Features

<!-- BEGIN GENERATED FEATURES -->
<!-- END GENERATED FEATURES -->

## Dependency graph

<!-- BEGIN GENERATED DEP_GRAPH -->
<!-- END GENERATED DEP_GRAPH -->

## Red flags

<!-- BEGIN GENERATED RED_FLAGS -->
<!-- END GENERATED RED_FLAGS -->
`;
}
function getBaselineFromGit(root, relPath, baseRef) {
	if (!getHeadRef(root)) return null;
	if ((runGit(root, [
		"diff",
		"--name-only",
		"HEAD",
		"--",
		relPath
	], { allowFailure: true }) || "").trim()) return {
		label: "HEAD",
		text: runGit(root, ["show", `HEAD:${relPath}`], { allowFailure: true })
	};
	const mergeBase = baseRef ? getMergeBase(root, baseRef) : null;
	if (mergeBase) return {
		label: mergeBase,
		text: runGit(root, ["show", `${mergeBase}:${relPath}`], { allowFailure: true })
	};
	const previousCommit = runGit(root, [
		"rev-parse",
		"--verify",
		"HEAD~1"
	], { allowFailure: true });
	if (previousCommit) return {
		label: previousCommit,
		text: runGit(root, ["show", `${previousCommit}:${relPath}`], { allowFailure: true })
	};
	return null;
}
function isTestFile(filePath) {
	return /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath) || filePath.split(path.sep).includes("test") || filePath.split(path.sep).includes("tests");
}
async function selectChangedDossiers({ absRoot, baseRef, dossiersDir }) {
	if (!inGitRepo(absRoot)) throw new UsageError("--changed-only requires a git repository.", coverageAuditHelp());
	const absDossiersDir = path.resolve(absRoot, dossiersDir);
	const dossierAbsPaths = (await listDossierFiles(absDossiersDir)).map((fileName) => path.join(absDossiersDir, fileName));
	const selected = /* @__PURE__ */ new Set();
	const changedAbsPaths = getChangedFiles(absRoot, baseRef).map((fileName) => normalizeRepoPath(absRoot, fileName));
	for (const absPath of changedAbsPaths) if (dossierAbsPaths.includes(absPath)) selected.add(absPath);
	for (const absPath of changedAbsPaths) {
		if (!isTestFile(absPath)) continue;
		let content;
		try {
			content = await readText(absPath);
		} catch {
			continue;
		}
		for (const acId of extractAcIds(content)) {
			const featureId = extractFeatureIdFromAc(acId);
			if (!featureId) continue;
			for (const dossierPath of dossierAbsPaths) if (matchesFeatureFile(featureId, dossierPath)) selected.add(dossierPath);
		}
	}
	return [...selected].sort();
}
function resolveOrphanScope({ changedOnly, dossier, orphansScope }) {
	if (orphansScope !== "auto") return orphansScope;
	if (dossier || changedOnly) return "dossier";
	return "repo";
}
var DEFAULT_SCAN_ROOTS = [
	"src",
	"apps",
	"packages",
	"infra",
	"scripts",
	"test",
	"docs",
	".github",
	"AGENTS.md",
	"README.md",
	"package.json",
	"pnpm-workspace.yaml",
	"tsconfig.json",
	"tsconfig.base.json",
	"tsconfig.typecheck.json",
	"tsconfig.eslint.json",
	"biome.json",
	"eslint.config.js"
];
var MARKER_PATTERN = /\b(TODO|FIXME|HACK|XXX)\b/;
var MARKDOWN_MARKER_PATTERN = /^\s*(?:>\s*)?(?:[-*+]|\d+\.)?\s*(TODO|FIXME|HACK|XXX)\b/;
var COMMENT_MARKER_PATTERN = /(?:^|\s)(?:\/\/|#|\/\*|\*|<!--|;|--\s).*\b(TODO|FIXME|HACK|XXX)\b/;
function isMarkdownLike(filePath) {
	return /\.(md|mdx|txt)$/i.test(filePath);
}
function shouldFlagLine(filePath, line) {
	if (!MARKER_PATTERN.test(line)) return false;
	if (COMMENT_MARKER_PATTERN.test(line)) return true;
	return isMarkdownLike(filePath) && MARKDOWN_MARKER_PATTERN.test(line);
}
async function collectExplicitPaths(root, relPaths) {
	const files = [];
	for (const relPath of relPaths) {
		const absPath = path.resolve(root, relPath);
		const stat = await promises.stat(absPath);
		if (stat.isDirectory()) {
			await walk(absPath, files, { rootDir: root });
			continue;
		}
		if (stat.isFile()) files.push(absPath);
	}
	return [...new Set(files)].sort();
}
async function collectDefaultFiles(root) {
	const files = [];
	for (const relPath of DEFAULT_SCAN_ROOTS) {
		const absPath = path.resolve(root, relPath);
		try {
			const stat = await promises.stat(absPath);
			if (stat.isDirectory()) await walk(absPath, files, { rootDir: root });
			else if (stat.isFile()) files.push(absPath);
		} catch {}
	}
	return [...new Set(files)].sort();
}
async function readJsonArtifact$1(root, artifactPath) {
	const absPath = path.resolve(root, artifactPath);
	return JSON.parse(await readText(absPath));
}
async function readLatestJsonFile(dirPath) {
	if (!await fileExists(dirPath)) return null;
	const entries = await promises.readdir(dirPath, { withFileTypes: true });
	const files = await Promise.all(entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map(async (entry) => {
		const absPath = path.join(dirPath, entry.name);
		return {
			absPath,
			mtimeMs: (await promises.stat(absPath)).mtimeMs
		};
	}));
	files.sort((left, right) => right.mtimeMs - left.mtimeMs);
	const latest = files[0];
	if (!latest) return null;
	return JSON.parse(await promises.readFile(latest.absPath, "utf8"));
}
function createBufferedIo() {
	const stdoutParts = [];
	const stderrParts = [];
	return {
		io: {
			stdout: { write(chunk) {
				stdoutParts.push(String(chunk));
				return true;
			} },
			stderr: { write(chunk) {
				stderrParts.push(String(chunk));
				return true;
			} }
		},
		readStdout: () => stdoutParts.join(""),
		readStderr: () => stderrParts.join("")
	};
}
async function executeCommand(command, argv, io, invocationName = command.name) {
	try {
		return await command.run(argv, io);
	} catch (error) {
		if (error instanceof UsageError) {
			writeLine$1(io.stderr, error.message);
			if (error.helpText) writeLine$1(io.stderr, error.helpText);
			return 2;
		}
		const message = error instanceof Error ? error.stack ?? error.message : String(error);
		writeLine$1(io.stderr, `[${invocationName}] FATAL: ${message}`);
		return 1;
	}
}
function findCommand(name) {
	return COMMANDS$1.find((command) => command.name === name || command.aliases.includes(name));
}
async function invokeCommandByName(name, argv, io) {
	const command = findCommand(name);
	if (!command) throw new Error(`Unknown command: ${name}`);
	return executeCommand(command, argv, io, name);
}
async function captureCommandResult({ args, commandName, displayArgs = args, name }) {
	const startedAt = Date.now();
	const buffer = createBufferedIo();
	const exitCode = await invokeCommandByName(commandName, args, buffer.io);
	return {
		name,
		command: canonicalCli(commandName, displayArgs),
		exit_code: exitCode,
		stdout: buffer.readStdout(),
		stderr: buffer.readStderr(),
		duration_ms: Date.now() - startedAt,
		status: exitCode === 0 ? "pass" : "fail"
	};
}
function runExternalCommand({ args = [], command, cwd, displayCommand, name, shell = false }) {
	const startedAt = Date.now();
	const result = shell ? spawnSync(command, {
		cwd,
		encoding: "utf8",
		shell: true
	}) : spawnSync(command, args, {
		cwd,
		encoding: "utf8"
	});
	return {
		name,
		command: displayCommand ?? (shell ? command : formatCli([command, ...args])),
		exit_code: typeof result.status === "number" ? result.status : 1,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
		duration_ms: Date.now() - startedAt,
		status: result.status === 0 ? "pass" : "fail"
	};
}
function featureIntakeHelp() {
	return [
		"Create a new Feature Dossier for already selected backlog work.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} feature-intake --title <text> --backlog-item-key <key> --backlog-delivery-state <state> --backlog-source <source> --area <name> --owner <owner> --impact <impact> [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		"  --title <text>               Dossier title. Required.",
		"  --backlog-item-key <key>     Selected backlog item key from the unified backlog truth layer. Required.",
		"  --backlog-delivery-state <state>  Backlog delivery state at intake. Required.",
		"                               Allowed: defined, specified, planned, implemented.",
		"  --backlog-source <source>    Repeatable backlog source traceability entry. At least one required.",
		"  --backlog-dependency <key>   Repeatable backlog dependency visible at intake.",
		"  --backlog-blocker <text>     Repeatable backlog blocker visible at intake.",
		"  --area <name>                Area label for frontmatter. Required.",
		"  --owner <name>               Repeatable owner value. At least one required.",
		"  --impact <name>              Repeatable impact value. At least one required.",
		"  --depends-on <id>            Repeatable delivered prerequisite.",
		"  --slug <slug>                Optional dossier slug. Defaults to slugified title.",
		"  --output <path>              Optional dossier output path directly inside docs/ssot/features.",
		"  --json                       Emit JSON output.",
		"  -h, --help                   Show help.",
		"",
		"Notes:",
		"  - feature-intake runs index-refresh after creating the dossier.",
		"  - JSON partial_success=true means the dossier was created but index-refresh failed; fix the reported refresh issues before continuing.",
		"  - workflow_stage_next values name workflow stages, not shipped CLI subcommands."
	].join("\n");
}
async function runFeatureIntakeCommand(argv, io) {
	const helpText = featureIntakeHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	if (argv.includes("--selected-work") || argv.some((arg) => arg.startsWith("--selected-work="))) throw new UsageError("--selected-work is no longer supported. Use --backlog-item-key, --backlog-delivery-state, and at least one --backlog-source.", helpText);
	const title = ensureRequired$1(takeOption$3(argv, "--title", null), "--title is required.", helpText);
	const backlogItemKey = ensureRequired$1(takeOption$3(argv, "--backlog-item-key", null), "--backlog-item-key is required.", helpText);
	const backlogDeliveryState = ensureEnumValue(ensureRequired$1(takeOption$3(argv, "--backlog-delivery-state", null), "--backlog-delivery-state is required.", helpText), BACKLOG_DELIVERY_STATES, "--backlog-delivery-state", helpText);
	const backlogSources = ensureNonEmpty(takeManyOptions$1(argv, "--backlog-source"), "At least one --backlog-source is required.", helpText);
	const backlogDependencies = takeManyOptions$1(argv, "--backlog-dependency");
	const backlogBlockers = takeManyOptions$1(argv, "--backlog-blocker");
	const area = ensureRequired$1(takeOption$3(argv, "--area", null), "--area is required.", helpText);
	const owners = takeManyOptions$1(argv, "--owner");
	const impacts = takeManyOptions$1(argv, "--impact");
	const dependsOn = takeManyOptions$1(argv, "--depends-on");
	const output = takeOption$3(argv, "--output", null);
	const json = hasOption(argv, "--json");
	const slug = takeOption$3(argv, "--slug", slugify$1(title)) ?? slugify$1(title);
	if (owners.length === 0) throw new UsageError("At least one --owner is required.", helpText);
	if (impacts.length === 0) throw new UsageError("At least one --impact is required.", helpText);
	const absRoot = path.resolve(root);
	const absDossiersDir = path.resolve(absRoot, DEFAULT_DOSSIERS_DIR);
	const featureId = nextFeatureId(await fileExists(absDossiersDir) ? await readAllDossiers(absRoot, DEFAULT_DOSSIERS_DIR, { strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES }) : []);
	const defaultRelPath = path.join(DEFAULT_DOSSIERS_DIR, `${featureId}-${slug}.md`);
	const outputPath = output ? path.resolve(absRoot, output) : path.resolve(absRoot, defaultRelPath);
	const outputBaseName = path.basename(outputPath);
	const outputDir = path.dirname(outputPath);
	if (!isDossierFile(outputBaseName) || !matchesFeatureFile(featureId, outputBaseName)) throw new UsageError("--output must point to a dossier file named like docs/ssot/features/F-XXXX-slug.md for the allocated feature id.", helpText);
	if (outputDir !== absDossiersDir) throw new UsageError("--output must point to a dossier file directly inside docs/ssot/features for the current repository root.", helpText);
	await promises.mkdir(absDossiersDir, { recursive: true });
	const realRoot = await promises.realpath(absRoot);
	if (await promises.realpath(absDossiersDir) !== path.join(realRoot, "docs/ssot/features")) throw new UsageError("docs/ssot/features must be a real directory inside the repository root and must not be a symlinked path.", helpText);
	if (await fileExists(outputPath)) throw new UsageError(`Refusing to overwrite existing dossier ${relativeToRoot(absRoot, outputPath)}.`, helpText);
	await writeTextAtomic(outputPath, renderInitialDossier({
		area,
		backlogBlockers,
		backlogDeliveryState,
		backlogDependencies,
		backlogItemKey,
		backlogSources,
		created: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
		dependsOn,
		featureId,
		impacts,
		owners,
		title
	}));
	const summary = {
		dossier: relativeToRoot(absRoot, outputPath),
		feature_id: featureId,
		backlog_item_key: backlogItemKey,
		backlog_delivery_state: backlogDeliveryState,
		backlog_source_traceability: backlogSources,
		backlog_dependencies: backlogDependencies,
		backlog_blockers: backlogBlockers,
		partial_success: false,
		workflow_stage_next: "spec-compact"
	};
	const refreshIo = createBufferedIo();
	const refreshExit = await runIndexRefreshCommand(["--root", absRoot], refreshIo.io);
	if (refreshExit !== 0) {
		const refreshStdout = refreshIo.readStdout();
		const refreshStderr = refreshIo.readStderr();
		if (json) {
			writeLine$1(io.stdout, JSON.stringify({
				...summary,
				partial_success: true,
				refresh_exit_code: refreshExit,
				refresh_stdout: refreshStdout.trim() || null,
				refresh_stderr: refreshStderr.trim() || null
			}, null, 2));
			return refreshExit;
		}
		if (refreshStdout) io.stdout.write(refreshStdout);
		if (refreshStderr) io.stderr.write(refreshStderr);
		writeLine$1(io.stderr, "[feature-intake] Dossier was created, but index-refresh failed. Resolve the reported issues before continuing.");
		return refreshExit;
	}
	if (json) {
		writeLine$1(io.stdout, JSON.stringify(summary, null, 2));
		return 0;
	}
	writeLine$1(io.stdout, `[feature-intake] Created ${summary.dossier}`);
	writeLine$1(io.stdout, `[feature-intake] feature=${featureId}`);
	writeLine$1(io.stdout, `[feature-intake] backlog_item_key=${backlogItemKey}`);
	writeLine$1(io.stdout, `[feature-intake] backlog_delivery_state=${backlogDeliveryState}`);
	writeLine$1(io.stdout, "[feature-intake] next_workflow_stage=spec-compact (workflow stage, not CLI command)");
	return 0;
}
function syncIndexHelp() {
	return [
		"Regenerate only the generated dossier table and dependency graph blocks in docs/ssot/index.md.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} sync-index [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		`  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
		`  --index-file <path>          Index file. Defaults to ${DEFAULT_INDEX_FILE}.`,
		"  -h, --help                   Show help.",
		"",
		"Notes:",
		"  - sync-index does not refresh the generated Red flags block.",
		"  - Use index-refresh for the canonical full refresh path after mutating dossier work."
	].join("\n");
}
async function runSyncIndexCommand(argv, io) {
	const helpText = syncIndexHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const dossiersDir = takeOption$3(argv, "--dossiers-dir", "docs/ssot/features") ?? "docs/ssot/features";
	const indexFile = takeOption$3(argv, "--index-file", DEFAULT_INDEX_FILE) ?? DEFAULT_INDEX_FILE;
	const absRoot = path.resolve(root);
	const absIndex = path.resolve(absRoot, indexFile);
	const indexDir = path.dirname(absIndex);
	const dossiers = await readAllDossiers(absRoot, dossiersDir, { strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES });
	const featuresBlock = [
		"| ID | Title | Status | Coverage | Area | Depends on | Impacts | Dossier |",
		"|---|---|---|---|---|---|---|---|",
		...dossiers.length > 0 ? dossiers.map((dossier) => featureRow(dossier, indexDir)) : ["| — | — | — | — | — | — | — | — |"]
	].join("\n");
	const graphBlock = buildMermaidGraph(dossiers);
	let content;
	try {
		content = await readText(absIndex);
	} catch {
		content = ensureIndexSkeleton();
	}
	const refreshedBlocks = replaceBlock(replaceBlock(content, "<!-- BEGIN GENERATED FEATURES -->", "<!-- END GENERATED FEATURES -->", featuresBlock), "<!-- BEGIN GENERATED DEP_GRAPH -->", "<!-- END GENERATED DEP_GRAPH -->", graphBlock);
	if (refreshedBlocks === content) {
		writeLine$1(io.stdout, `[sync-index] ${indexFile} already up to date (${dossiers.length} dossier(s)).`);
		return 0;
	}
	await writeTextAtomic(absIndex, refreshedBlocks.replace(/_Last sync: .*?_\n/, `_Last sync: ${(/* @__PURE__ */ new Date()).toISOString()}_\n`));
	writeLine$1(io.stdout, `[sync-index] Updated ${indexFile} from ${dossiers.length} dossier(s).`);
	return 0;
}
function indexRefreshHelp() {
	return [
		"Run sync-index first, then lint-dossiers with --update-index.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} index-refresh [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		`  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
		`  --index-file <path>          Index file. Defaults to ${DEFAULT_INDEX_FILE}.`,
		"  -h, --help                   Show help."
	].join("\n");
}
async function runIndexRefreshCommand(argv, io) {
	const helpText = indexRefreshHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const syncExit = await invokeCommandByName("sync-index", argv, io);
	if (syncExit !== 0) return syncExit;
	return invokeCommandByName("lint-dossiers", argv.includes("--update-index") ? argv : [...argv, "--update-index"], io);
}
function lintDossiersHelp() {
	return [
		"Validate Feature Dossiers and optionally refresh the generated Red flags block.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} lint-dossiers [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		`  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
		`  --index-file <path>          Index file. Defaults to ${DEFAULT_INDEX_FILE}.`,
		"  --update-index               Refresh the generated Red flags block.",
		"  -h, --help                   Show help."
	].join("\n");
}
async function runLintDossiersCommand(argv, io) {
	const helpText = lintDossiersHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const dossiersDir = takeOption$3(argv, "--dossiers-dir", "docs/ssot/features") ?? "docs/ssot/features";
	const indexFile = takeOption$3(argv, "--index-file", DEFAULT_INDEX_FILE) ?? DEFAULT_INDEX_FILE;
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const updateIndex = hasOption(argv, "--update-index");
	const absRoot = path.resolve(root);
	const absIndex = path.resolve(absRoot, indexFile);
	let dossiers = [];
	try {
		dossiers = await readAllDossiers(absRoot, dossiersDir, { strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES });
	} catch (error) {
		writeLine$1(io.stderr, `[lint-dossiers] ERROR: cannot read dossiers directory: ${path.resolve(absRoot, dossiersDir)}`);
		const message = error instanceof Error ? error.stack ?? error.message : String(error);
		writeLine$1(io.stderr, message);
		return 1;
	}
	const findings = analyzeDossiers(dossiers);
	const errors = findings.filter((finding) => finding.level === "error");
	writeLine$1(io.stdout, renderLintSummary(findings, dossiers.length));
	if (updateIndex) try {
		const indexText = await readText(absIndex);
		const updatedIndex = replaceBlock(indexText, "<!-- BEGIN GENERATED RED_FLAGS -->", "<!-- END GENERATED RED_FLAGS -->", buildRedFlagsBlock(findings));
		if (updatedIndex === indexText) writeLine$1(io.stdout, `[lint-dossiers] Red flags block already up to date in ${indexFile}.`);
		else {
			await writeTextAtomic(absIndex, updatedIndex);
			writeLine$1(io.stdout, `[lint-dossiers] Updated Red flags block in ${indexFile}.`);
		}
	} catch {
		writeLine$1(io.stderr, `[lint-dossiers] WARN: Could not update index red flags block (${indexFile}).`);
	}
	return errors.length > 0 ? 2 : 0;
}
function dependencyGraphHelp() {
	return [
		"Output a Mermaid dependency graph from dossier frontmatter.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} dependency-graph [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		`  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
		"  -h, --help                   Show help."
	].join("\n");
}
async function runDependencyGraphCommand(argv, io) {
	const helpText = dependencyGraphHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const dossiersDir = takeOption$3(argv, "--dossiers-dir", "docs/ssot/features") ?? "docs/ssot/features";
	const dossiers = await readAllDossiers(path.resolve(root), dossiersDir, { strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES });
	writeLine$1(io.stdout, buildMermaidGraph(dossiers));
	return 0;
}
function coverageAuditHelp() {
	return [
		"Check that each acceptance criterion ID is referenced in tests.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} coverage-audit [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		"  --dossier <path>             Audit a single dossier.",
		`  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
		"  --changed-only               Audit dossiers touched by the current change set.",
		"  --base <ref>                 Git base ref for --changed-only.",
		"  --strict-statuses <list>     Comma-separated statuses treated as strict by default.",
		"  --orphans-scope <scope>      auto | dossier | repo | none. Defaults to auto.",
		"  -h, --help                   Show help."
	].join("\n");
}
async function runCoverageAuditCommand(argv, io) {
	const helpText = coverageAuditHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = takeOption$3(argv, "--dossier", null);
	const dossiersDir = takeOption$3(argv, "--dossiers-dir", "docs/ssot/features") ?? "docs/ssot/features";
	const changedOnly = hasOption(argv, "--changed-only");
	const base = takeOption$3(argv, "--base", null);
	const strictStatusesRaw = takeOption$3(argv, "--strict-statuses", null);
	const strictStatuses = strictStatusesRaw ? new Set(strictStatusesRaw.split(",").map((value) => value.trim()).filter(Boolean)) : DEFAULT_STRICT_COVERAGE_STATUSES;
	const orphansScope = takeOption$3(argv, "--orphans-scope", "auto") ?? "auto";
	const absRoot = path.resolve(root);
	if (dossier && changedOnly) throw new UsageError("--dossier and --changed-only cannot be used together.", helpText);
	const selectedDossiers = [];
	if (dossier) selectedDossiers.push(path.resolve(absRoot, dossier));
	else if (changedOnly) {
		const selected = await selectChangedDossiers({
			absRoot,
			dossiersDir,
			baseRef: resolveBaseRef(absRoot, base)
		});
		if (selected.length === 0) {
			writeLine$1(io.stdout, "Coverage audit: 0 dossier(s) selected by --changed-only.");
			writeLine$1(io.stdout, "Nothing to audit.");
			return 0;
		}
		selectedDossiers.push(...selected);
	} else {
		const absDossiersDir = path.resolve(absRoot, dossiersDir);
		for (const fileName of await listDossierFiles(absDossiersDir)) selectedDossiers.push(path.join(absDossiersDir, fileName));
	}
	const testFiles = await walk(absRoot, [], {
		includeFile: isTestFile,
		rootDir: absRoot
	});
	const testContents = /* @__PURE__ */ new Map();
	for (const testFile of testFiles) try {
		testContents.set(testFile, await readText(testFile));
	} catch {}
	const results = [];
	const selectedFeatureIds = /* @__PURE__ */ new Set();
	for (const dossierPath of selectedDossiers) {
		const record = await readDossierRecord(dossierPath, {
			root: absRoot,
			strictStatuses
		});
		const frontmatter = record.frontmatter ?? {};
		const featureId = typeof frontmatter.id === "string" ? frontmatter.id : path.basename(dossierPath, ".md");
		selectedFeatureIds.add(featureId);
		const found = /* @__PURE__ */ new Map();
		const missing = [];
		for (const acId of record.acIds) {
			const hits = [];
			for (const [testFile, content] of testContents.entries()) if (content.includes(acId)) hits.push(toRepoRelativePath(absRoot, testFile));
			if (hits.length === 0) missing.push(acId);
			else found.set(acId, hits);
		}
		results.push({
			dossier: record.relPath,
			featureId,
			title: frontmatterString(frontmatter, "title"),
			status: typeof frontmatter.status === "string" ? frontmatter.status : null,
			coverageGate: record.coverageGate,
			acCount: record.acIds.length,
			found,
			missing
		});
	}
	const orphanMode = resolveOrphanScope({
		changedOnly,
		dossier,
		orphansScope
	});
	const allAuditedAcs = new Set(results.flatMap((result) => [...result.found.keys(), ...result.missing]));
	const orphan = /* @__PURE__ */ new Map();
	const regex = /\bAC-F(\d{4})-(\d{1,2})\b/g;
	for (const [testFile, content] of testContents.entries()) for (;;) {
		const match = regex.exec(content);
		if (!match) break;
		const acId = `AC-F${match[1]}-${(match[2] ?? "").padStart(2, "0")}`;
		if (allAuditedAcs.has(acId)) continue;
		if (orphanMode === "none") continue;
		const featureId = extractFeatureIdFromAc(acId);
		if (!(orphanMode === "repo" || orphanMode === "dossier" && featureId && selectedFeatureIds.has(featureId))) continue;
		const relPath = toRepoRelativePath(absRoot, testFile);
		if (!orphan.has(acId)) orphan.set(acId, /* @__PURE__ */ new Set());
		orphan.get(acId)?.add(relPath);
	}
	const blockingMissing = results.reduce((total, result) => total + (result.coverageGate === "strict" ? result.missing.length : 0), 0);
	const informationalMissing = results.reduce((total, result) => total + (result.coverageGate !== "strict" ? result.missing.length : 0), 0);
	writeLine$1(io.stdout, `Coverage audit: ${results.length} dossier(s), ${testFiles.length} test file(s) scanned. Blocking missing: ${blockingMissing}. Informational missing: ${informationalMissing}. Orphans: ${orphan.size} (scope: ${orphanMode}).`);
	for (const result of results) {
		writeLine$1(io.stdout, "");
		writeLine$1(io.stdout, `== ${result.dossier} ==`);
		writeLine$1(io.stdout, `Status: ${result.status ?? "unknown"} | coverage gate: ${result.coverageGate} | AC count: ${result.acCount}`);
		if (result.missing.length === 0) writeLine$1(io.stdout, "All audited AC IDs are referenced in tests.");
		else {
			const label = result.coverageGate === "strict" ? "Blocking" : "Informational";
			writeLine$1(io.stdout, `${label} missing AC reference(s):`);
			for (const acId of result.missing) writeLine$1(io.stdout, `- ${acId}`);
		}
	}
	if (orphan.size > 0) {
		writeLine$1(io.stdout, "");
		writeLine$1(io.stdout, `== Orphan AC references (${orphanMode} scope) ==`);
		for (const [acId, files] of [...orphan.entries()].sort((left, right) => left[0].localeCompare(right[0]))) writeLine$1(io.stdout, `- ${acId}: ${[...files].sort().join(", ")}`);
	}
	return blockingMissing > 0 ? 3 : 0;
}
function debtAuditHelp() {
	return [
		"Check for explicit unresolved debt markers.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} debt-audit [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		"  --changed-only               Scan only changed files.",
		"  --base <ref>                 Git base ref for --changed-only.",
		"  --paths <csv>                Comma-separated paths to scan.",
		"  -h, --help                   Show help."
	].join("\n");
}
async function runDebtAuditCommand(argv, io) {
	const helpText = debtAuditHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const changedOnly = hasOption(argv, "--changed-only");
	const base = takeOption$3(argv, "--base", null);
	const paths = (takeOption$3(argv, "--paths", "") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
	const absRoot = path.resolve(root);
	let filesToScan;
	if (paths.length > 0) filesToScan = await collectExplicitPaths(absRoot, paths);
	else if (changedOnly) {
		if (!inGitRepo(absRoot)) throw new UsageError("--changed-only requires a git repository.", helpText);
		filesToScan = getChangedFiles(absRoot, resolveBaseRef(absRoot, base)).map((filePath) => normalizeRepoPath(absRoot, filePath));
	} else filesToScan = await collectDefaultFiles(absRoot);
	const findings = [];
	for (const filePath of filesToScan) {
		let content;
		try {
			content = await promises.readFile(filePath, "utf8");
		} catch {
			continue;
		}
		const relPath = relativeToRoot(absRoot, filePath) || path.basename(filePath);
		const lines = content.split(/\r?\n/);
		for (const [index, line] of lines.entries()) {
			if (!shouldFlagLine(filePath, line)) continue;
			const markerMatch = line.match(MARKER_PATTERN);
			findings.push({
				file: relPath,
				line: index + 1,
				marker: markerMatch?.[1] ?? "MARKER",
				text: line.trim()
			});
		}
	}
	writeLine$1(io.stdout, `Debt audit: ${filesToScan.length} file(s) scanned.`);
	writeLine$1(io.stdout, "Scope: explicit debt markers only; manual debt review is still required.");
	if (findings.length === 0) {
		writeLine$1(io.stdout, "No unresolved debt markers found.");
		return 0;
	}
	writeLine$1(io.stderr, `Found ${findings.length} unresolved debt marker(s):`);
	for (const finding of findings) writeLine$1(io.stderr, `- ${finding.file}:${finding.line} [${finding.marker}] ${finding.text}`);
	return 2;
}
function contractDriftAuditHelp() {
	return [
		"Detect executable contract changes without matching implementation follow-up.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} contract-drift-audit --dossier <path> [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		"  --dossier <path>             Dossier to audit.",
		"  --base <ref>                 Git base ref for baseline resolution.",
		"  --before-file <path>         Explicit baseline markdown file.",
		"  --output <path>              Artifact output path.",
		"  -h, --help                   Show help."
	].join("\n");
}
async function runContractDriftAuditCommand(argv, io) {
	const helpText = contractDriftAuditHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = ensureRequired$1(takeOption$3(argv, "--dossier", null), "--dossier is required.", helpText);
	const base = takeOption$3(argv, "--base", null);
	const beforeFile = takeOption$3(argv, "--before-file", null);
	const output = takeOption$3(argv, "--output", null);
	const absRoot = path.resolve(root);
	const absDossier = path.resolve(absRoot, dossier);
	const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
	const relDossier = dossierRecord.relPath;
	const featureId = frontmatterString(dossierRecord.frontmatter, "id", path.basename(absDossier, ".md"));
	let beforeText = null;
	let baselineLabel = null;
	if (beforeFile) {
		const absBefore = path.resolve(absRoot, beforeFile);
		beforeText = await promises.readFile(absBefore, "utf8");
		baselineLabel = relativeToRoot(absRoot, absBefore);
	} else if (inGitRepo(absRoot)) {
		const baseline = getBaselineFromGit(absRoot, relDossier, resolveBaseRef(absRoot, base));
		beforeText = baseline?.text ?? null;
		baselineLabel = baseline?.label ?? null;
	}
	if (beforeText === null) throw new UsageError("Could not resolve a baseline dossier snapshot. Use --before-file or run inside a git repository.", helpText);
	const beforeSections = parseTopLevelSections(beforeText);
	const afterSections = parseTopLevelSections(dossierRecord.markdown);
	const beforeAcIds = new Set(extractAcIds(beforeText));
	const afterAcIds = new Set(dossierRecord.acIds);
	const addedAcIds = [...afterAcIds].filter((acId) => !beforeAcIds.has(acId)).sort();
	const removedAcIds = [...beforeAcIds].filter((acId) => !afterAcIds.has(acId)).sort();
	const changedExecutableSections = hasExecutableSectionChange(beforeSections, afterSections);
	const beforeStatusMatch = String(beforeText).match(/^---\r?\n([\s\S]*?)\r?\n---/);
	const beforeFrontmatter = beforeStatusMatch ? beforeStatusMatch[1] ?? "" : "";
	const afterFrontmatter = String(dossierRecord.markdown).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
	const frontmatterChanged = [
		"depends_on",
		"impacts",
		"coverage_gate"
	].filter((key) => new RegExp(`^\\s*${key}:.*$`, "m").test(beforeFrontmatter) || new RegExp(`^\\s*${key}:.*$`, "m").test(afterFrontmatter)).filter((key) => {
		const beforeLine = beforeFrontmatter.match(new RegExp(`^\\s*${key}:.*$`, "m"))?.[0] ?? "";
		const afterLine = afterFrontmatter.match(new RegExp(`^\\s*${key}:.*$`, "m"))?.[0] ?? "";
		return beforeLine.trim() !== afterLine.trim();
	});
	const executableContractChanged = addedAcIds.length > 0 || removedAcIds.length > 0 || changedExecutableSections.length > 0 || frontmatterChanged.length > 0;
	const maturityRequiresAudit = [
		"planned",
		"in_progress",
		"done"
	].includes(String(dossierRecord.frontmatter.status));
	const changedFiles = inGitRepo(absRoot) ? getChangedFiles(absRoot, resolveBaseRef(absRoot, base)) : [];
	const codeFollowUpFiles = changedFiles.filter((filePath) => !filePath.startsWith("docs/") && !filePath.startsWith(".dossier/") && filePath !== "AGENTS.md");
	const architectureFollowUpFiles = changedFiles.filter((filePath) => filePath === "docs/architecture/system.md" || filePath.startsWith("docs/adr/"));
	const requiresFollowUp = executableContractChanged && maturityRequiresAudit && codeFollowUpFiles.length === 0;
	const artifact = {
		version: 1,
		created_at: (/* @__PURE__ */ new Date()).toISOString(),
		feature_id: featureId,
		dossier: relDossier,
		event_commit: inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null,
		baseline: baselineLabel,
		executable_contract_changed: executableContractChanged,
		maturity_requires_audit: maturityRequiresAudit,
		added_ac_ids: addedAcIds,
		removed_ac_ids: removedAcIds,
		changed_executable_sections: changedExecutableSections,
		frontmatter_changes: frontmatterChanged,
		changed_files: changedFiles,
		code_follow_up_files: codeFollowUpFiles,
		architecture_follow_up_files: architectureFollowUpFiles,
		requires_follow_up: requiresFollowUp
	};
	const outputPath = output ? path.resolve(absRoot, output) : path.join(absRoot, ".dossier", "drift", featureId, `${Date.now()}.json`);
	await writeJsonAtomic(outputPath, artifact);
	writeLine$1(io.stdout, `[contract-drift-audit] feature=${featureId} baseline=${baselineLabel}`);
	writeLine$1(io.stdout, `[contract-drift-audit] executable_contract_changed=${executableContractChanged ? "yes" : "no"} maturity_requires_audit=${maturityRequiresAudit ? "yes" : "no"} requires_follow_up=${requiresFollowUp ? "yes" : "no"}`);
	if (addedAcIds.length > 0) writeLine$1(io.stdout, `Added AC IDs: ${addedAcIds.join(", ")}`);
	if (removedAcIds.length > 0) writeLine$1(io.stdout, `Removed AC IDs: ${removedAcIds.join(", ")}`);
	if (changedExecutableSections.length > 0) writeLine$1(io.stdout, `Changed executable sections: ${changedExecutableSections.join(" | ")}`);
	if (frontmatterChanged.length > 0) writeLine$1(io.stdout, `Changed frontmatter keys: ${frontmatterChanged.join(", ")}`);
	writeLine$1(io.stdout, `Artifact: ${relativeToRoot(absRoot, outputPath)}`);
	if (requiresFollowUp) {
		writeLine$1(io.stderr, "[contract-drift-audit] Executable contract changed without matching code/test/runtime follow-up in the same change set.");
		return 2;
	}
	return 0;
}
function reviewArtifactHelp() {
	return [
		"Persist an already obtained independent review result as a durable artifact.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} review-artifact --dossier <path> --step <name> --verdict PASS|FAIL [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		"  --dossier <path>             Dossier under review.",
		"  --step <name>                Workflow step under review.",
		"  --verdict <PASS|FAIL>        Review verdict.",
		"  --reviewer <name>            Reviewer identifier. Required.",
		"  --event-commit <sha>         Trace commit SHA for event provenance. Defaults to current HEAD when available.",
		"  --notes <text>               Free-form reviewer notes.",
		"  --output <path>              Artifact output path.",
		"  --must-fix <text>            Repeatable must-fix finding.",
		"  --should-fix <text>          Repeatable should-fix finding.",
		"  --evidence <text>            Repeatable evidence pointer.",
		"  -h, --help                   Show help.",
		"",
		"Notes:",
		"  - review-artifact does not perform the review itself; it records a verdict produced elsewhere.",
		"  - --reviewer should name the separate reviewer agent or review skill that produced the verdict."
	].join("\n");
}
async function runReviewArtifactCommand(argv, io) {
	const helpText = reviewArtifactHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = ensureRequired$1(takeOption$3(argv, "--dossier", null), "--dossier is required.", helpText);
	const step = ensureRequired$1(takeOption$3(argv, "--step", null), "--step is required.", helpText);
	const verdict = ensureRequired$1(takeOption$3(argv, "--verdict", null), "--verdict is required.", helpText).toUpperCase();
	const reviewer = ensureRequired$1(takeOption$3(argv, "--reviewer", null), "--reviewer is required.", helpText);
	const eventCommit = takeOption$3(argv, "--event-commit", null);
	const notes = takeOption$3(argv, "--notes", "") ?? "";
	const output = takeOption$3(argv, "--output", null);
	const mustFix = takeManyOptions$1(argv, "--must-fix");
	const shouldFix = takeManyOptions$1(argv, "--should-fix");
	const evidence = takeManyOptions$1(argv, "--evidence");
	const absRoot = path.resolve(root);
	const absDossier = path.resolve(absRoot, dossier);
	if (!["PASS", "FAIL"].includes(verdict)) throw new UsageError("--verdict must be PASS or FAIL.", helpText);
	if (verdict === "PASS" && mustFix.length > 0) throw new UsageError("PASS review artifacts cannot contain --must-fix findings.", helpText);
	const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
	const featureId = frontmatterString(dossierRecord.frontmatter, "id", path.basename(absDossier, ".md"));
	const commit = eventCommit || (inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null);
	const artifact = {
		version: 1,
		created_at: (/* @__PURE__ */ new Date()).toISOString(),
		reviewer,
		step,
		dossier: dossierRecord.relPath,
		feature_id: featureId,
		event_commit: commit,
		verdict,
		findings: {
			must_fix: mustFix,
			should_fix: shouldFix,
			evidence
		},
		notes
	};
	const defaultOutput = path.join(absRoot, ".dossier", "reviews", featureId, `${step}-${commit ? commit.slice(0, 12) : Date.now()}.json`);
	const outputPath = output ? path.resolve(absRoot, output) : defaultOutput;
	await writeJsonAtomic(outputPath, artifact);
	writeLine$1(io.stdout, `[review-artifact] Wrote ${relativeToRoot(absRoot, outputPath)}`);
	writeLine$1(io.stdout, `[review-artifact] verdict=${verdict} step=${step} feature=${featureId} event_commit=${commit ?? "none"}`);
	return 0;
}
function dossierStepCloseHelp() {
	return [
		"Machine-checkable closure gate for a mutating dossier step.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} dossier-step-close --dossier <path> --step <name> --verify-artifact <path> --review-artifact <path> [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		"  --dossier <path>             Dossier being closed.",
		"  --step <name>                Workflow step being closed.",
		"  --verify-artifact <path>     Verification artifact path.",
		"  --review-artifact <path>     Review artifact path.",
		"  --next-step <name>           Override computed next step.",
		"  --output <path>              Step artifact output path.",
		"  --allow-dirty                Skip clean-worktree enforcement.",
		"  -h, --help                   Show help."
	].join("\n");
}
async function runDossierStepCloseCommand(argv, io) {
	const helpText = dossierStepCloseHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = ensureRequired$1(takeOption$3(argv, "--dossier", null), "--dossier is required.", helpText);
	const step = ensureRequired$1(takeOption$3(argv, "--step", null), "--step is required.", helpText);
	const verifyArtifact = ensureRequired$1(takeOption$3(argv, "--verify-artifact", null), "--verify-artifact is required.", helpText);
	const reviewArtifact = ensureRequired$1(takeOption$3(argv, "--review-artifact", null), "--review-artifact is required.", helpText);
	const nextStep = takeOption$3(argv, "--next-step", null);
	const output = takeOption$3(argv, "--output", null);
	const allowDirty = hasOption(argv, "--allow-dirty");
	const absRoot = path.resolve(root);
	const absDossier = path.resolve(absRoot, dossier);
	const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
	const featureId = frontmatterString(dossierRecord.frontmatter, "id", path.basename(absDossier, ".md"));
	const blockers = [];
	let verify = null;
	try {
		verify = await readJsonArtifact$1(absRoot, verifyArtifact);
	} catch (error) {
		blockers.push(`Could not read verification artifact ${relativeToRoot(absRoot, path.resolve(absRoot, verifyArtifact))} (${error instanceof Error ? error.message : String(error)}).`);
	}
	let review = null;
	try {
		review = await readJsonArtifact$1(absRoot, reviewArtifact);
	} catch (error) {
		blockers.push(`Could not read review artifact ${relativeToRoot(absRoot, path.resolve(absRoot, reviewArtifact))} (${error instanceof Error ? error.message : String(error)}).`);
	}
	const eventCommit = inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null;
	if (verify && verify.status !== "pass") blockers.push(`Verification artifact does not report status=pass (got ${String(verify.status)}).`);
	if (verify && verify.step !== step) blockers.push(`Verification artifact step mismatch: expected ${step}, got ${String(verify.step)}.`);
	if (verify?.feature_id && verify.feature_id !== featureId) blockers.push(`Verification artifact feature mismatch: expected ${featureId}, got ${verify.feature_id}.`);
	if (review && review.verdict !== "PASS") blockers.push(`Review artifact verdict is ${String(review.verdict)}, expected PASS.`);
	if (review && (!review.reviewer || !String(review.reviewer).trim())) blockers.push("Review artifact is missing reviewer provenance.");
	if (review && review.step !== step) blockers.push(`Review artifact step mismatch: expected ${step}, got ${String(review.step)}.`);
	if (review?.feature_id && review.feature_id !== featureId) blockers.push(`Review artifact feature mismatch: expected ${featureId}, got ${review.feature_id}.`);
	if (Array.isArray(review?.findings?.must_fix) && review.findings.must_fix.length > 0) blockers.push("Review artifact still contains must-fix findings.");
	if (inGitRepo(absRoot) && !allowDirty) {
		const dirtyPaths = getDirtyPaths(absRoot).filter((filePath) => !filePath.startsWith(".dossier/"));
		if (dirtyPaths.length > 0) blockers.push(`Worktree is dirty outside .dossier/: ${dirtyPaths.join(", ")}`);
	}
	const processComplete = blockers.length === 0;
	const artifact = {
		version: 1,
		created_at: (/* @__PURE__ */ new Date()).toISOString(),
		feature_id: featureId,
		dossier: dossierRecord.relPath,
		step,
		dossier_status: dossierRecord.frontmatter.status ?? null,
		event_commit: eventCommit,
		review_trace_commit: review?.event_commit ?? null,
		verification_trace_commit: verify?.event_commit ?? null,
		verification_artifact: relativeToRoot(absRoot, path.resolve(absRoot, verifyArtifact)),
		review_artifact: relativeToRoot(absRoot, path.resolve(absRoot, reviewArtifact)),
		review_freshness: review?.verdict === "PASS" ? "pass" : review?.verdict === "FAIL" ? "fail" : "unknown",
		process_complete: processComplete,
		blockers,
		next_step: nextStep || defaultNextStep(dossierRecord.frontmatter.status, step) || void 0
	};
	const defaultOutput = path.join(absRoot, ".dossier", "steps", featureId, `${step}.json`);
	const outputPath = output ? path.resolve(absRoot, output) : defaultOutput;
	await writeJsonAtomic(outputPath, artifact);
	writeLine$1(io.stdout, `[dossier-step-close] Wrote ${relativeToRoot(absRoot, outputPath)}`);
	writeLine$1(io.stdout, `[dossier-step-close] process_complete=${processComplete ? "yes" : "no"} step=${step} feature=${featureId}`);
	if (blockers.length > 0) {
		writeLine$1(io.stderr, "[dossier-step-close] blockers:");
		for (const blocker of blockers) writeLine$1(io.stderr, `- ${blocker}`);
		return 2;
	}
	return 0;
}
function dossierVerifyHelp() {
	return [
		"Run the canonical verification bundle and persist its JSON artifact.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} dossier-verify [options]`,
		"",
		"Options:",
		"  --root <path>                     Repository root. Defaults to cwd.",
		"  --step <name>                     Workflow step. Defaults to implementation.",
		"  --dossier <path>                  Limit verification to one dossier.",
		"  --changed-only                    Verify changed dossiers only.",
		"  --base <ref>                      Git base ref for --changed-only.",
		"  --output <path>                   Artifact output path.",
		"  --skip-index-refresh              Skip index-refresh in the verification bundle.",
		"  --skip-diff-check                 Skip git diff --check.",
		"  --coverage-orphans-scope <scope>  Scope for coverage orphan detection.",
		"  --extra <command>                 Repeatable extra shell command.",
		"  -h, --help                        Show help.",
		"",
		"Notes:",
		"  - Use --dossier for the canonical one-dossier close-out path.",
		"  - Use --changed-only only for repo-scope verification of the current change set.",
		"  - Without --dossier or --changed-only, dossier-verify runs repo-wide and writes a global artifact that is not a dossier-step-close input."
	].join("\n");
}
async function runDossierVerifyCommand(argv, io) {
	const helpText = dossierVerifyHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const step = takeOption$3(argv, "--step", "implementation") ?? "implementation";
	const dossier = takeOption$3(argv, "--dossier", null);
	const changedOnly = hasOption(argv, "--changed-only");
	const base = takeOption$3(argv, "--base", null);
	const output = takeOption$3(argv, "--output", null);
	const skipIndexRefresh = hasOption(argv, "--skip-index-refresh");
	const skipDiffCheck = hasOption(argv, "--skip-diff-check");
	const coverageOrphansScope = takeOption$3(argv, "--coverage-orphans-scope", "auto") ?? "auto";
	const extra = takeManyOptions$1(argv, "--extra");
	const absRoot = path.resolve(root);
	if (dossier && changedOnly) throw new UsageError("--dossier and --changed-only cannot be used together.", helpText);
	let featureId = "global";
	let dossierRelPath = null;
	if (dossier) {
		const dossierRecord = await readDossierRecord(path.resolve(absRoot, dossier), { root: absRoot });
		featureId = frontmatterString(dossierRecord.frontmatter, "id", path.basename(dossierRecord.absPath, ".md"));
		dossierRelPath = dossierRecord.relPath;
	}
	const checks = [];
	if (!skipIndexRefresh) checks.push(await captureCommandResult({
		name: "index-refresh",
		commandName: "index-refresh",
		args: ["--root", absRoot],
		displayArgs: ["--root", "."]
	}));
	checks.push(await captureCommandResult({
		name: "lint-dossiers",
		commandName: "lint-dossiers",
		args: ["--root", absRoot],
		displayArgs: ["--root", "."]
	}));
	const coverageArgs = [
		"--root",
		absRoot,
		"--orphans-scope",
		coverageOrphansScope
	];
	const coverageDisplayArgs = [
		"--root",
		".",
		"--orphans-scope",
		coverageOrphansScope
	];
	if (dossierRelPath) {
		coverageArgs.push("--dossier", dossierRelPath);
		coverageDisplayArgs.push("--dossier", dossierRelPath);
	} else if (changedOnly) {
		coverageArgs.push("--changed-only");
		coverageDisplayArgs.push("--changed-only");
		if (base) {
			coverageArgs.push("--base", base);
			coverageDisplayArgs.push("--base", base);
		}
	}
	checks.push(await captureCommandResult({
		name: "coverage-audit",
		commandName: "coverage-audit",
		args: coverageArgs,
		displayArgs: coverageDisplayArgs
	}));
	const debtArgs = ["--root", absRoot];
	const debtDisplayArgs = ["--root", "."];
	if (inGitRepo(absRoot) && (dossierRelPath || changedOnly)) {
		debtArgs.push("--changed-only");
		debtDisplayArgs.push("--changed-only");
		if (base) {
			debtArgs.push("--base", base);
			debtDisplayArgs.push("--base", base);
		}
	} else if (dossierRelPath) {
		debtArgs.push("--paths", dossierRelPath);
		debtDisplayArgs.push("--paths", dossierRelPath);
	}
	checks.push(await captureCommandResult({
		name: "debt-audit",
		commandName: "debt-audit",
		args: debtArgs,
		displayArgs: debtDisplayArgs
	}));
	if (inGitRepo(absRoot) && !skipDiffCheck) checks.push(runExternalCommand({
		name: "git-diff-check",
		command: "git",
		args: ["diff", "--check"],
		cwd: absRoot,
		displayCommand: "git diff --check"
	}));
	for (const extraCommand of extra) checks.push(runExternalCommand({
		name: `extra:${extraCommand}`,
		command: extraCommand,
		cwd: absRoot,
		shell: true,
		displayCommand: extraCommand
	}));
	const overallStatus = checks.every((check) => check.status === "pass") ? "pass" : "fail";
	const eventCommit = inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null;
	const artifact = {
		version: 1,
		created_at: (/* @__PURE__ */ new Date()).toISOString(),
		step,
		feature_id: featureId,
		dossier: dossierRelPath,
		event_commit: eventCommit,
		status: overallStatus,
		checks
	};
	const defaultOutput = path.join(absRoot, ".dossier", "verification", featureId, `${step}-${eventCommit ? eventCommit.slice(0, 12) : "workspace"}.json`);
	const outputPath = output ? path.resolve(absRoot, output) : defaultOutput;
	await writeJsonAtomic(outputPath, artifact);
	writeLine$1(io.stdout, `[dossier-verify] status=${overallStatus} step=${step} feature=${featureId}`);
	writeLine$1(io.stdout, `[dossier-verify] artifact=${relativeToRoot(absRoot, outputPath)}`);
	for (const check of checks) writeLine$1(io.stdout, `- ${check.name}: ${check.status} (exit ${check.exit_code}, ${check.duration_ms} ms)`);
	return overallStatus === "pass" ? 0 : 2;
}
function nextStepHelp() {
	return [
		"Return the next dossier-local workflow stage for already selected work.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} next-step [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		"  --dossier <path>             Resolve next step for one dossier. Required whenever more than one dossier exists in the repo.",
		"  --json                       Emit JSON output.",
		"  -h, --help                   Show help.",
		"",
		"Notes:",
		"  - workflow_stage_next is a real workflow stage name or null; it never uses shipped CLI command names.",
		"  - next-step stays dossier-local; use dossier-engineer backlog commands for selection, readiness, or lifecycle actualization."
	].join("\n");
}
async function runNextStepCommand(argv, io) {
	const helpText = nextStepHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = takeOption$3(argv, "--dossier", null);
	const json = hasOption(argv, "--json");
	const absRoot = path.resolve(root);
	const dossiers = await fileExists(path.resolve(absRoot, "docs/ssot/features")) ? await readAllDossiers(absRoot, DEFAULT_DOSSIERS_DIR, { strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES }) : [];
	if (!dossier && dossiers.length > 1) throw new UsageError("When more than one dossier exists, --dossier is required for next-step.", helpText);
	const target = dossier ? await readDossierRecord(path.resolve(absRoot, dossier), { root: absRoot }) : dossiers[0] ?? null;
	let latestStepArtifact = null;
	let latestReviewArtifact = null;
	let eventCommit = null;
	let dirtyWorktree = false;
	if (inGitRepo(absRoot)) {
		eventCommit = getCurrentCommit(absRoot);
		dirtyWorktree = hasDirtyWorktree(absRoot);
	}
	if (target) {
		const featureId = frontmatterString(target.frontmatter, "id", path.basename(target.absPath, ".md"));
		latestStepArtifact = await readLatestJsonFile(path.join(absRoot, ".dossier", "steps", featureId));
		latestReviewArtifact = await readLatestJsonFile(path.join(absRoot, ".dossier", "reviews", featureId));
	}
	const workflowNext = latestStepArtifact?.process_complete === false ? normalizeWorkflowStage(latestStepArtifact.next_step ?? null) : target ? normalizeWorkflowStage(statusToNextStep(target.frontmatter.status)) : null;
	const blockers = latestStepArtifact?.process_complete === false && Array.isArray(latestStepArtifact.blockers) ? latestStepArtifact.blockers.filter((value) => typeof value === "string") : target ? [] : ["No active dossier found. Select backlog work with dossier-engineer backlog commands and create a dossier via feature-intake before using next-step."];
	const reviewFreshness = latestReviewArtifact ? latestReviewArtifact.verdict === "PASS" ? "pass" : latestReviewArtifact.verdict === "FAIL" ? "fail" : "unknown" : "missing";
	const summary = {
		target_dossier: target ? target.relPath : null,
		dossier_status: typeof target?.frontmatter.status === "string" ? target.frontmatter.status : null,
		workflow_stage_next: workflowNext,
		blocking_gate: blockers,
		uncommitted_work: dirtyWorktree,
		review_freshness: reviewFreshness,
		event_commit: eventCommit,
		review_trace_commit: latestReviewArtifact?.event_commit ?? null,
		process_complete: latestStepArtifact ? Boolean(latestStepArtifact.process_complete) : null
	};
	if (json) {
		writeLine$1(io.stdout, JSON.stringify(summary, null, 2));
		return 0;
	}
	writeLine$1(io.stdout, `Workflow stage next (workflow stage, not CLI command): ${summary.workflow_stage_next ?? "none"}`);
	writeLine$1(io.stdout, `Target dossier: ${summary.target_dossier ?? "none selected"}`);
	writeLine$1(io.stdout, `Dossier status: ${summary.dossier_status ?? "n/a"}`);
	writeLine$1(io.stdout, `Blocking gate: ${summary.blocking_gate.length > 0 ? summary.blocking_gate.join(" | ") : "none recorded"}`);
	writeLine$1(io.stdout, `Uncommitted work: ${summary.uncommitted_work ? "yes" : "no"}`);
	writeLine$1(io.stdout, `Review freshness: ${summary.review_freshness}`);
	writeLine$1(io.stdout, `Event commit: ${summary.event_commit ?? "none"}`);
	writeLine$1(io.stdout, `Review trace commit: ${summary.review_trace_commit ?? "none"}`);
	writeLine$1(io.stdout, `Process-complete: ${summary.process_complete === null ? "unknown" : summary.process_complete ? "yes" : "no"}`);
	return 0;
}
function lifecycleRefreshHelp() {
	return [
		"Rebuild lifecycle metrics and repo-local session anchors from structured lifecycle telemetry.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} lifecycle-refresh --feature-id <id> [options]`,
		"",
		"Options:",
		"  --root <path>                Repository root. Defaults to cwd.",
		"  --feature-id <id>            Feature id such as F-0001. Required unless --dossier is provided.",
		"  --dossier <path>             Dossier path used to resolve feature id.",
		"  --feature-cycle-id <id>      Lifecycle cycle id such as fc01. Required when more than one cycle exists for the feature.",
		"  --json                       Emit JSON output.",
		"  -h, --help                   Show help.",
		"",
		"Notes:",
		"  - lifecycle-refresh reads structured lifecycle logs and JSON artifacts only.",
		"  - It does not interpret prose and does not infer missing telemetry from narrative text.",
		"  - It refreshes .dossier/metrics/<feature-id>/<feature_cycle_id>.json and .dossier/retro/session-index.jsonl."
	].join("\n");
}
async function runLifecycleRefreshCommand(argv, io) {
	const helpText = lifecycleRefreshHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption$3(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = takeOption$3(argv, "--dossier", null);
	let featureId = takeOption$3(argv, "--feature-id", null);
	const featureCycleId = takeOption$3(argv, "--feature-cycle-id", null);
	const json = hasOption(argv, "--json");
	const absRoot = path.resolve(root);
	if (dossier) {
		const dossierRecord = await readDossierRecord(path.resolve(absRoot, dossier), { root: absRoot });
		featureId = featureId ?? frontmatterString(dossierRecord.frontmatter, "id", path.basename(dossierRecord.absPath, ".md"));
	}
	featureId = ensureRequired$1(featureId, "--feature-id is required unless --dossier is provided.", helpText);
	const result = await refreshLifecycleArtifacts({
		root: absRoot,
		featureId,
		featureCycleId
	});
	const metricsPath = relativeToRoot(absRoot, result.metricsPath);
	const sessionIndexPath = relativeToRoot(absRoot, result.sessionIndexPath);
	if (json) {
		writeLine$1(io.stdout, JSON.stringify({
			feature_id: result.featureId,
			feature_cycle_id: result.featureCycleId,
			metrics_path: metricsPath,
			session_index_path: sessionIndexPath,
			snapshot: result.snapshot
		}, null, 2));
		return 0;
	}
	writeLine$1(io.stdout, `[lifecycle-refresh] feature=${result.featureId} feature_cycle_id=${result.featureCycleId}`);
	writeLine$1(io.stdout, `[lifecycle-refresh] metrics=${metricsPath}`);
	writeLine$1(io.stdout, `[lifecycle-refresh] session_index=${sessionIndexPath}`);
	return 0;
}
var COMMANDS$1 = [
	{
		name: "feature-intake",
		aliases: [],
		description: "Create a new dossier for already selected backlog work.",
		helpText: featureIntakeHelp,
		run: runFeatureIntakeCommand
	},
	{
		name: "sync-index",
		aliases: [],
		description: "Refresh generated dossier table/graph blocks only; use index-refresh for a full refresh.",
		helpText: syncIndexHelp,
		run: runSyncIndexCommand
	},
	{
		name: "index-refresh",
		aliases: [],
		description: "Run sync-index and refresh the generated Red flags block.",
		helpText: indexRefreshHelp,
		run: runIndexRefreshCommand
	},
	{
		name: "lint-dossiers",
		aliases: [],
		description: "Validate Feature Dossiers and optionally update Red flags.",
		helpText: lintDossiersHelp,
		run: runLintDossiersCommand
	},
	{
		name: "dependency-graph",
		aliases: [],
		description: "Print the dossier dependency graph as Mermaid.",
		helpText: dependencyGraphHelp,
		run: runDependencyGraphCommand
	},
	{
		name: "coverage-audit",
		aliases: [],
		description: "Check AC references in tests and report orphans.",
		helpText: coverageAuditHelp,
		run: runCoverageAuditCommand
	},
	{
		name: "debt-audit",
		aliases: [],
		description: "Scan for explicit TODO/FIXME/HACK/XXX debt markers.",
		helpText: debtAuditHelp,
		run: runDebtAuditCommand
	},
	{
		name: "contract-drift-audit",
		aliases: [],
		description: "Detect executable contract drift without follow-up changes.",
		helpText: contractDriftAuditHelp,
		run: runContractDriftAuditCommand
	},
	{
		name: "review-artifact",
		aliases: [],
		description: "Persist an already obtained independent review artifact.",
		helpText: reviewArtifactHelp,
		run: runReviewArtifactCommand
	},
	{
		name: "dossier-step-close",
		aliases: [],
		description: "Write the machine-checkable step-closure artifact.",
		helpText: dossierStepCloseHelp,
		run: runDossierStepCloseCommand
	},
	{
		name: "dossier-verify",
		aliases: [],
		description: "Run the canonical verification bundle and persist its artifact.",
		helpText: dossierVerifyHelp,
		run: runDossierVerifyCommand
	},
	{
		name: "next-step",
		aliases: [],
		description: "Resolve the next dossier-local workflow stage from structured state.",
		helpText: nextStepHelp,
		run: runNextStepCommand
	},
	{
		name: "lifecycle-refresh",
		aliases: [],
		description: "Rebuild lifecycle metrics and session anchors from structured telemetry.",
		helpText: lifecycleRefreshHelp,
		run: runLifecycleRefreshCommand
	}
];
Object.freeze({ status: "aborted" });
function $constructor(name, initializer, params) {
	function init(inst, def) {
		if (!inst._zod) Object.defineProperty(inst, "_zod", {
			value: {
				def,
				constr: _,
				traits: /* @__PURE__ */ new Set()
			},
			enumerable: false
		});
		if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		const proto = _.prototype;
		const keys = Object.keys(proto);
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i];
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		var _a;
		const inst = params?.Parent ? new Definition() : this;
		init(inst, def);
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		for (const fn of inst._zod.deferred) fn();
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
var globalConfig = {};
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
function cached(getter) {
	return { get value() {
		{
			const value = getter();
			Object.defineProperty(this, "value", { value });
			return value;
		}
		throw new Error("cached value already set");
	} };
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const valDecCount = (val.toString().split(".")[1] || "").length;
	const stepString = step.toString();
	let stepDecCount = (stepString.split(".")[1] || "").length;
	if (stepDecCount === 0 && /\d?e-\d?/.test(stepString)) {
		const match = stepString.match(/\d?e-(\d?)/);
		if (match?.[1]) stepDecCount = Number.parseInt(match[1]);
	}
	const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
	return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
}
var EVALUATING = Symbol("evaluating");
function defineLazy(object, key, getter) {
	let value = void 0;
	Object.defineProperty(object, key, {
		get() {
			if (value === EVALUATING) return;
			if (value === void 0) {
				value = EVALUATING;
				value = getter();
			}
			return value;
		},
		set(v) {
			Object.defineProperty(object, key, { value: v });
		},
		configurable: true
	});
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) Object.assign(mergedDescriptors, Object.getOwnPropertyDescriptors(def));
	return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = cached(() => {
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	return o;
}
var propertyKeyTypes = new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
	});
}
var NUMBER_FORMAT_RANGES = {
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = {};
			for (const key in mask) {
				if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				newShape[key] = currDef.shape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = { ...schema._zod.def.shape };
			for (const key in mask) {
				if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				delete newShape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = schema._zod.def.shape;
		for (const key in shape) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function merge(a, b) {
	return clone(a, mergeDefs(a._zod.def, {
		get shape() {
			const _shape = {
				...a._zod.def.shape,
				...b._zod.def.shape
			};
			assignProp(this, "shape", _shape);
			return _shape;
		},
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: []
	}));
}
function partial(Class, schema, mask) {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(".partial() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const oldShape = schema._zod.def.shape;
			const shape = { ...oldShape };
			if (mask) for (const key in mask) {
				if (!(key in oldShape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				shape[key] = Class ? new Class({
					type: "optional",
					innerType: oldShape[key]
				}) : oldShape[key];
			}
			else for (const key in oldShape) shape[key] = Class ? new Class({
				type: "optional",
				innerType: oldShape[key]
			}) : oldShape[key];
			assignProp(this, "shape", shape);
			return shape;
		},
		checks: []
	}));
}
function required(Class, schema, mask) {
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const oldShape = schema._zod.def.shape;
		const shape = { ...oldShape };
		if (mask) for (const key in mask) {
			if (!(key in shape)) throw new Error(`Unrecognized key: "${key}"`);
			if (!mask[key]) continue;
			shape[key] = new Class({
				type: "nonoptional",
				innerType: oldShape[key]
			});
		}
		else for (const key in oldShape) shape[key] = new Class({
			type: "nonoptional",
			innerType: oldShape[key]
		});
		assignProp(this, "shape", shape);
		return shape;
	} }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
	const full = {
		...iss,
		path: iss.path ?? []
	};
	if (!iss.message) full.message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	delete full.inst;
	delete full.continue;
	if (!ctx?.reportInput) delete full.input;
	return full;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/errors.js
var initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	Object.defineProperty(inst, "_zod", {
		value: inst._zod,
		enumerable: false
	});
	Object.defineProperty(inst, "issues", {
		value: def,
		enumerable: false
	});
	inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
	Object.defineProperty(inst, "toString", {
		value: () => inst.message,
		enumerable: false
	});
};
var $ZodError = $constructor("$ZodError", initializer$1);
var $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) {
		fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
		fieldErrors[sub.path[0]].push(mapper(sub));
	} else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue) => issue.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues });
		else if (issue.code === "invalid_element") processError({ issues: issue.issues });
		else if (issue.path.length === 0) fieldErrors._errors.push(mapper(issue));
		else {
			let curr = fieldErrors;
			let i = 0;
			while (i < issue.path.length) {
				const el = issue.path[i];
				if (!(i === issue.path.length - 1)) curr[el] = curr[el] || { _errors: [] };
				else {
					curr[el] = curr[el] || { _errors: [] };
					curr[el]._errors.push(mapper(issue));
				}
				curr = curr[el];
				i++;
			}
		}
	};
	processError(error);
	return fieldErrors;
}
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	if (result.issues.length) {
		const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, _params?.callee);
		throw e;
	}
	return result.value;
};
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	if (result.issues.length) {
		const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, params?.callee);
		throw e;
	}
	return result.value;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? {
		success: false,
		error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
var safeParse$1 = /* @__PURE__ */ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? {
		success: false,
		error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
var safeParseAsync$1 = /* @__PURE__ */ _safeParseAsync($ZodRealError);
var _encode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _parse(_Err)(schema, value, ctx);
};
var _decode = (_Err) => (schema, value, _ctx) => {
	return _parse(_Err)(schema, value, _ctx);
};
var _encodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _parseAsync(_Err)(schema, value, ctx);
};
var _decodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _parseAsync(_Err)(schema, value, _ctx);
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][^\s-]{8,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
var duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
*
* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
var uuid = (version) => {
	if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
/** Practical email validation */
var email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^[A-Za-z0-9_-]*$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date$1 = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time$1(args) {
	return new RegExp(`^${timeSource(args)}$`);
}
function datetime$1(args) {
	const time = timeSource({ precision: args.precision });
	const opts = ["Z"];
	if (args.local) opts.push("");
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const timeRegex = `${time}(?:${opts.join("|")})`;
	return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var string$1 = (params) => {
	const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
	return new RegExp(`^${regex}$`);
};
var integer = /^-?\d+$/;
var number$1 = /^-?\d+(?:\.\d+)?$/;
var boolean$1 = /^(?:true|false)$/i;
var _null$2 = /^null$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
var numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
		if (def.value < curr) if (def.inclusive) bag.maximum = def.value;
		else bag.exclusiveMaximum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
		if (def.value > curr) if (def.inclusive) bag.minimum = def.value;
		else bag.exclusiveMinimum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst) => {
		var _a;
		(_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
	});
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = def.format;
		bag.minimum = minimum;
		bag.maximum = maximum;
		if (isInt) bag.pattern = integer;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
		if (def.maximum < curr) inst._zod.bag.maximum = def.maximum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.length <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
		if (def.minimum > curr) inst._zod.bag.minimum = def.minimum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.length >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.minimum = def.length;
		bag.maximum = def.length;
		bag.length = def.length;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		const length = input.length;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a, _b;
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = def.format;
		if (def.pattern) {
			bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
			bag.patterns.add(def.pattern);
		}
	});
	if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
	def.pattern = pattern;
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/doc.js
var Doc = class {
	constructor(args = []) {
		this.content = [];
		this.indent = 0;
		if (this) this.args = args;
	}
	indented(fn) {
		this.indent += 1;
		fn(this);
		this.indent -= 1;
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const args = this?.args;
		const lines = [...(this?.content ?? [``]).map((x) => `  ${x}`)];
		return new F(...args, lines.join("\n"));
	}
};
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/versions.js
var version = {
	major: 4,
	minor: 3,
	patch: 6
};
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const checks = [...inst._zod.def.checks ?? []];
	if (inst._zod.traits.has("$ZodCheck")) checks.unshift(inst);
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary) => {
					return handleCanaryResult(canary, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
	defineLazy(inst, "~standard", () => ({
		validate: (value) => {
			try {
				const r = safeParse$1(inst, value);
				return r.success ? { value: r.data } : { issues: r.error?.issues };
			} catch (_) {
				return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
			}
		},
		vendor: "zod",
		version: 1
	}));
});
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email);
	$ZodStringFormat.init(inst, def);
});
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			const url = new URL(trimmed);
			if (def.hostname) {
				def.hostname.lastIndex = 0;
				if (!def.hostname.test(url.hostname)) payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid hostname",
					pattern: def.hostname.source,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			}
			if (def.protocol) {
				def.protocol.lastIndex = 0;
				if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid protocol",
					pattern: def.protocol.source,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			}
			if (def.normalize) payload.value = url.href;
			else payload.value = trimmed;
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
	def.pattern ?? (def.pattern = nanoid);
	$ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime$1(def));
	$ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date$1);
	$ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time$1(def));
	$ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration$1);
	$ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `ipv4`;
});
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `ipv6`;
	inst._zod.check = (payload) => {
		try {
			new URL(`http://[${payload.value}]`);
		} catch {
			payload.issues.push({
				code: "invalid_format",
				format: "ipv6",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		const parts = payload.value.split("/");
		try {
			if (parts.length !== 2) throw new Error();
			const [address, prefix] = parts;
			if (!prefix) throw new Error();
			const prefixNum = Number(prefix);
			if (`${prefixNum}` !== prefix) throw new Error();
			if (prefixNum < 0 || prefixNum > 128) throw new Error();
			new URL(`http://[${address}]`);
		} catch {
			payload.issues.push({
				code: "invalid_format",
				format: "cidrv6",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.contentEncoding = "base64";
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64URL(data) {
	if (!base64url.test(data)) return false;
	const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64url);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.contentEncoding = "base64url";
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = _null$2;
	inst._zod.values = new Set([null]);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (input === null) return payload;
		payload.issues.push({
			expected: "null",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = Array(input.length);
		const proms = [];
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else handleArrayResult(result, payload, i);
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handlePropertyResult(result, final, key, input, isOptionalOut) {
	if (result.issues.length) {
		if (isOptionalOut && !(key in input)) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (result.value === void 0) {
		if (key in input) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	for (const k of keys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		keys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const isOptionalOut = _catchall.optout === "optional";
	for (const key in input) {
		if (keySet.has(key)) continue;
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalOut)));
		else handlePropertyResult(r, payload, key, input, isOptionalOut);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	if (!Object.getOwnPropertyDescriptor(def, "shape")?.get) {
		const sh = def.shape;
		Object.defineProperty(def, "shape", { get: () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			return newSh;
		} });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazy(inst._zod, "propValues", () => {
		const shape = def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
			}
		}
		return propValues;
	});
	const isObject$2 = isObject;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$2(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = {};
		const proms = [];
		const shape = value.shape;
		for (const key of value.keys) {
			const el = shape[key];
			const isOptionalOut = el._zod.optout === "optional";
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalOut)));
			else handlePropertyResult(r, payload, key, input, isOptionalOut);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
	};
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const generateFastpass = (shape) => {
		const doc = new Doc([
			"shape",
			"payload",
			"ctx"
		]);
		const normalized = _normalized.value;
		const parseStr = (key) => {
			const k = esc(key);
			return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		};
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.keys) ids[key] = `key_${counter++}`;
		doc.write(`const newResult = {};`);
		for (const key of normalized.keys) {
			const id = ids[key];
			const k = esc(key);
			const isOptionalOut = shape[key]?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(key)};`);
			if (isOptionalOut) doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }

        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }

      `);
			else doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }

        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }

      `);
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		const fn = doc.compile();
		return (payload, ctx) => fn(shape, payload, ctx);
	};
	let fastpass;
	const isObject$1 = isObject;
	const jit = !globalConfig.jitless;
	const fastEnabled = jit && allowsEval.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
	defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazy(inst._zod, "values", () => {
		if (def.options.every((o) => o._zod.values)) return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazy(inst._zod, "pattern", () => {
		if (def.options.every((o) => o._zod.pattern)) {
			const patterns = def.options.map((o) => o._zod.pattern);
			return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const single = def.options.length === 1;
	const first = def.options[0]._zod.run;
	inst._zod.parse = (payload, ctx) => {
		if (single) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleUnionResults(results, payload, inst, ctx);
		});
	};
});
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
	def.inclusive = false;
	$ZodUnion.init(inst, def);
	const _super = inst._zod.parse;
	defineLazy(inst._zod, "propValues", () => {
		const propValues = {};
		for (const option of def.options) {
			const pv = option._zod.propValues;
			if (!pv || Object.keys(pv).length === 0) throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
			for (const [k, v] of Object.entries(pv)) {
				if (!propValues[k]) propValues[k] = /* @__PURE__ */ new Set();
				for (const val of v) propValues[k].add(val);
			}
		}
		return propValues;
	});
	const disc = cached(() => {
		const opts = def.options;
		const map = /* @__PURE__ */ new Map();
		for (const o of opts) {
			const values = o._zod.propValues?.[def.discriminator];
			if (!values || values.size === 0) throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(o)}"`);
			for (const v of values) {
				if (map.has(v)) throw new Error(`Duplicate discriminator value "${String(v)}"`);
				map.set(v, o);
			}
		}
		return map;
	});
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isObject(input)) {
			payload.issues.push({
				code: "invalid_type",
				expected: "object",
				input,
				inst
			});
			return payload;
		}
		const opt = disc.value.get(input?.[def.discriminator]);
		if (opt) return opt._zod.run(payload, ctx);
		if (def.unionFallback) return _super(payload, ctx);
		payload.issues.push({
			code: "invalid_union",
			errors: [],
			note: "No matching discriminator",
			discriminator: def.discriminator,
			input,
			path: [def.discriminator],
			inst
		});
		return payload;
	};
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
			return handleIntersectionResults(payload, left, right);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		for (const key of sharedKeys) {
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	for (const iss of left.issues) if (iss.code === "unrecognized_keys") {
		unrecIssue ?? (unrecIssue = iss);
		for (const k of iss.keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k).l = true;
		}
	} else result.issues.push(iss);
	for (const iss of right.issues) if (iss.code === "unrecognized_keys") for (const k of iss.keys) {
		if (!unrecKeys.has(k)) unrecKeys.set(k, {});
		unrecKeys.get(k).r = true;
	}
	else result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length && unrecIssue) result.issues.push({
		...unrecIssue,
		keys: bothKeys
	});
	if (aborted(result)) return result;
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	result.value = merged.data;
	return result;
}
var $ZodTuple = /* @__PURE__ */ $constructor("$ZodTuple", (inst, def) => {
	$ZodType.init(inst, def);
	const items = def.items;
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				input,
				inst,
				expected: "tuple",
				code: "invalid_type"
			});
			return payload;
		}
		payload.value = [];
		const proms = [];
		const reversedIndex = [...items].reverse().findIndex((item) => item._zod.optin !== "optional");
		const optStart = reversedIndex === -1 ? 0 : items.length - reversedIndex;
		if (!def.rest) {
			const tooBig = input.length > items.length;
			const tooSmall = input.length < optStart - 1;
			if (tooBig || tooSmall) {
				payload.issues.push({
					...tooBig ? {
						code: "too_big",
						maximum: items.length,
						inclusive: true
					} : {
						code: "too_small",
						minimum: items.length
					},
					input,
					inst,
					origin: "array"
				});
				return payload;
			}
		}
		let i = -1;
		for (const item of items) {
			i++;
			if (i >= input.length) {
				if (i >= optStart) continue;
			}
			const result = item._zod.run({
				value: input[i],
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleTupleResult(result, payload, i)));
			else handleTupleResult(result, payload, i);
		}
		if (def.rest) {
			const rest = input.slice(items.length);
			for (const el of rest) {
				i++;
				const result = def.rest._zod.run({
					value: el,
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => handleTupleResult(result, payload, i)));
				else handleTupleResult(result, payload, i);
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handleTupleResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isPlainObject(input)) {
			payload.issues.push({
				expected: "record",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		const proms = [];
		const values = def.keyType._zod.values;
		if (values) {
			payload.value = {};
			const recordKeys = /* @__PURE__ */ new Set();
			for (const key of values) if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
				recordKeys.add(typeof key === "number" ? key.toString() : key);
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[key] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[key] = result.value;
				}
			}
			let unrecognized;
			for (const key in input) if (!recordKeys.has(key)) {
				unrecognized = unrecognized ?? [];
				unrecognized.push(key);
			}
			if (unrecognized && unrecognized.length > 0) payload.issues.push({
				code: "unrecognized_keys",
				input,
				inst,
				keys: unrecognized
			});
		} else {
			payload.value = {};
			for (const key of Reflect.ownKeys(input)) {
				if (key === "__proto__") continue;
				let keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (typeof key === "string" && number$1.test(key) && keyResult.issues.length) {
					const retryResult = def.keyType._zod.run({
						value: Number(key),
						issues: []
					}, ctx);
					if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
					if (retryResult.issues.length === 0) keyResult = retryResult;
				}
				if (keyResult.issues.length) {
					if (def.mode === "loose") payload.value[key] = input[key];
					else payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[keyResult.value] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[keyResult.value] = result.value;
				}
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	if (def.values.length === 0) throw new Error("Cannot create literal schema with no valid values");
	const values = new Set(def.values);
	inst._zod.values = values;
	inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values: def.values,
			input,
			inst
		});
		return payload;
	};
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
function handleOptionalResult(result, input) {
	if (result.issues.length && input === void 0) return {
		issues: [],
		value: void 0
	};
	return result;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	inst._zod.optout = "optional";
	defineLazy(inst._zod, "values", () => {
		return def.innerType._zod.values ? new Set([...def.innerType._zod.values, void 0]) : void 0;
	});
	defineLazy(inst._zod, "pattern", () => {
		const pattern = def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (def.innerType._zod.optin === "optional") {
			const result = def.innerType._zod.run(payload, ctx);
			if (result instanceof Promise) return result.then((r) => handleOptionalResult(r, payload.value));
			return handleOptionalResult(result, payload.value);
		}
		if (payload.value === void 0) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	defineLazy(inst._zod, "pattern", () => {
		const pattern = def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazy(inst._zod, "values", () => {
		return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			/**
			* $ZodDefault returns the default value immediately in forward direction.
			* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => {
		const v = def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => {
			payload.value = result.value;
			if (result.issues.length) {
				payload.value = def.catchValue({
					...payload,
					error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
					input: payload.value
				});
				payload.issues = [];
			}
			return payload;
		});
		payload.value = result.value;
		if (result.issues.length) {
			payload.value = def.catchValue({
				...payload,
				error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
				input: payload.value
			});
			payload.issues = [];
		}
		return payload;
	};
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => def.in._zod.values);
	defineLazy(inst._zod, "optin", () => def.in._zod.optin);
	defineLazy(inst._zod, "optout", () => def.out._zod.optout);
	defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.length) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
	defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	payload.value = Object.freeze(payload.value);
	return payload;
}
var $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "innerType", () => def.getter());
	defineLazy(inst._zod, "pattern", () => inst._zod.innerType?._zod?.pattern);
	defineLazy(inst._zod, "propValues", () => inst._zod.innerType?._zod?.propValues);
	defineLazy(inst._zod, "optin", () => inst._zod.innerType?._zod?.optin ?? void 0);
	defineLazy(inst._zod, "optout", () => inst._zod.innerType?._zod?.optout ?? void 0);
	inst._zod.parse = (payload, ctx) => {
		return inst._zod.innerType._zod.run(payload, ctx);
	};
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/registries.js
var _a;
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta = _meta[0];
		this._map.set(schema, meta);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta = this._map.get(schema);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/api.js
/* @__NO_SIDE_EFFECTS__ */
function _string(Class, params) {
	return new Class({
		type: "string",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _number(Class, params) {
	return new Class({
		type: "number",
		checks: [],
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _null$1(Class, params) {
	return new Class({
		type: "null",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
/* @__NO_SIDE_EFFECTS__ */
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
/* @__NO_SIDE_EFFECTS__ */
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
/* @__NO_SIDE_EFFECTS__ */
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
/* @__NO_SIDE_EFFECTS__ */
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
/* @__NO_SIDE_EFFECTS__ */
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
/* @__NO_SIDE_EFFECTS__ */
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _superRefine(fn) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$2) => {
			if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
			else {
				const _issue = issue$2;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				_issue.input ?? (_issue.input = payload.value);
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	});
	return ch;
}
/* @__NO_SIDE_EFFECTS__ */
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		external: params?.external ?? void 0
	};
}
function process$1(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			process$1(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta = ctx.metadataRegistry.get(schema);
	if (meta) Object.assign(result.schema, meta);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && result.schema._prefault) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id) => id);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}`
			};
		}
		if (entry[1] === root) return { ref: "#" };
		const defUriPrefix = `#/${defsSegment}/`;
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + defId
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema = seen.schema;
		for (const key in schema) delete schema[key];
		schema.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") {
				extractToDef(entry);
				continue;
			}
		}
	}
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema) => {
		const seen = ctx.seen.get(zodSchema);
		if (seen.ref === null) return;
		const schema = seen.def ?? seen.schema;
		const _cached = { ...schema };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema.allOf = schema.allOf ?? [];
				schema.allOf.push(refSchema);
			} else Object.assign(schema, refSchema);
			Object.assign(schema, _cached);
			if (zodSchema._zod.parent === ref) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
			}
		}
		const parent = zodSchema._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
				}
			}
		}
		ctx.override({
			zodSchema,
			jsonSchema: schema,
			path: seen.path ?? []
		});
	};
	for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	Object.assign(result, root.def ?? root.schema);
	const defs = ctx.external?.defs ?? {};
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) defs[seen.defId] = seen.def;
	}
	if (ctx.external) {} else if (Object.keys(defs).length > 0) if (ctx.target === "draft-2020-12") result.$defs = defs;
	else result.definitions = defs;
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
/**
* Creates a toJSONSchema method for a schema instance.
* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
*/
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	process$1(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	process$1(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/json-schema-processors.js
var formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
var stringProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	json.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
	if (typeof minimum === "number") json.minLength = minimum;
	if (typeof maximum === "number") json.maxLength = maximum;
	if (format) {
		json.format = formatMap[format] ?? format;
		if (json.format === "") delete json.format;
		if (format === "time") delete json.format;
	}
	if (contentEncoding) json.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const regexes = [...patterns];
		if (regexes.length === 1) json.pattern = regexes[0].source;
		else if (regexes.length > 1) json.allOf = [...regexes.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
var numberProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
	if (typeof format === "string" && format.includes("int")) json.type = "integer";
	else json.type = "number";
	if (typeof exclusiveMinimum === "number") if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
		json.minimum = exclusiveMinimum;
		json.exclusiveMinimum = true;
	} else json.exclusiveMinimum = exclusiveMinimum;
	if (typeof minimum === "number") {
		json.minimum = minimum;
		if (typeof exclusiveMinimum === "number" && ctx.target !== "draft-04") if (exclusiveMinimum >= minimum) delete json.minimum;
		else delete json.exclusiveMinimum;
	}
	if (typeof exclusiveMaximum === "number") if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
		json.maximum = exclusiveMaximum;
		json.exclusiveMaximum = true;
	} else json.exclusiveMaximum = exclusiveMaximum;
	if (typeof maximum === "number") {
		json.maximum = maximum;
		if (typeof exclusiveMaximum === "number" && ctx.target !== "draft-04") if (exclusiveMaximum <= maximum) delete json.maximum;
		else delete json.exclusiveMaximum;
	}
	if (typeof multipleOf === "number") json.multipleOf = multipleOf;
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
	json.type = "boolean";
};
var nullProcessor = (_schema, ctx, json, _params) => {
	if (ctx.target === "openapi-3.0") {
		json.type = "string";
		json.nullable = true;
		json.enum = [null];
	} else json.type = "null";
};
var neverProcessor = (_schema, _ctx, json, _params) => {
	json.not = {};
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {};
var enumProcessor = (schema, _ctx, json, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.every((v) => typeof v === "number")) json.type = "number";
	if (values.every((v) => typeof v === "string")) json.type = "string";
	json.enum = values;
};
var literalProcessor = (schema, ctx, json, _params) => {
	const def = schema._zod.def;
	const vals = [];
	for (const val of def.values) if (val === void 0) {
		if (ctx.unrepresentable === "throw") throw new Error("Literal `undefined` cannot be represented in JSON Schema");
	} else if (typeof val === "bigint") if (ctx.unrepresentable === "throw") throw new Error("BigInt literals cannot be represented in JSON Schema");
	else vals.push(Number(val));
	else vals.push(val);
	if (vals.length === 0) {} else if (vals.length === 1) {
		const val = vals[0];
		json.type = val === null ? "null" : typeof val;
		if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
		else json.const = val;
	} else {
		if (vals.every((v) => typeof v === "number")) json.type = "number";
		if (vals.every((v) => typeof v === "string")) json.type = "string";
		if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
		if (vals.every((v) => v === null)) json.type = "null";
		json.enum = vals;
	}
};
var customProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Custom types cannot be represented in JSON Schema");
};
var transformProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Transforms cannot be represented in JSON Schema");
};
var arrayProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = schema._zod.bag;
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
	json.type = "array";
	json.items = process$1(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
var objectProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "object";
	json.properties = {};
	const shape = def.shape;
	for (const key in shape) json.properties[key] = process$1(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	});
	const allKeys = new Set(Object.keys(shape));
	const requiredKeys = new Set([...allKeys].filter((key) => {
		const v = def.shape[key]._zod;
		if (ctx.io === "input") return v.optin === void 0;
		else return v.optout === void 0;
	}));
	if (requiredKeys.size > 0) json.required = Array.from(requiredKeys);
	if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json.additionalProperties = false;
	} else if (def.catchall) json.additionalProperties = process$1(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
var unionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => process$1(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json.oneOf = options;
	else json.anyOf = options;
};
var intersectionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const a = process$1(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = process$1(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	json.allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
};
var tupleProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "array";
	const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
	const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
	const prefixItems = def.items.map((x, i) => process$1(x, ctx, {
		...params,
		path: [
			...params.path,
			prefixPath,
			i
		]
	}));
	const rest = def.rest ? process$1(def.rest, ctx, {
		...params,
		path: [
			...params.path,
			restPath,
			...ctx.target === "openapi-3.0" ? [def.items.length] : []
		]
	}) : null;
	if (ctx.target === "draft-2020-12") {
		json.prefixItems = prefixItems;
		if (rest) json.items = rest;
	} else if (ctx.target === "openapi-3.0") {
		json.items = { anyOf: prefixItems };
		if (rest) json.items.anyOf.push(rest);
		json.minItems = prefixItems.length;
		if (!rest) json.maxItems = prefixItems.length;
	} else {
		json.items = prefixItems;
		if (rest) json.additionalItems = rest;
	}
	const { minimum, maximum } = schema._zod.bag;
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
};
var recordProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "object";
	const keyType = def.keyType;
	const patterns = keyType._zod.bag?.patterns;
	if (def.mode === "loose" && patterns && patterns.size > 0) {
		const valueSchema = process$1(def.valueType, ctx, {
			...params,
			path: [
				...params.path,
				"patternProperties",
				"*"
			]
		});
		json.patternProperties = {};
		for (const pattern of patterns) json.patternProperties[pattern.source] = valueSchema;
	} else {
		if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") json.propertyNames = process$1(def.keyType, ctx, {
			...params,
			path: [...params.path, "propertyNames"]
		});
		json.additionalProperties = process$1(def.valueType, ctx, {
			...params,
			path: [...params.path, "additionalProperties"]
		});
	}
	const keyValues = keyType._zod.values;
	if (keyValues) {
		const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
		if (validKeyValues.length > 0) json.required = validKeyValues;
	}
};
var nullableProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const inner = process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json.nullable = true;
	} else json.anyOf = [inner, { type: "null" }];
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
var defaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
var prefaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io === "input") json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
var catchProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		throw new Error("Dynamic catch values are not supported in JSON Schema");
	}
	json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const innerType = ctx.io === "input" ? def.in._zod.def.type === "transform" ? def.out : def.in : def.out;
	process$1(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.readOnly = true;
};
var optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
var lazyProcessor = (schema, ctx, _json, params) => {
	const innerType = schema._zod.innerType;
	process$1(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/iso.js
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function datetime(params) {
	return /* @__PURE__ */ _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function date(params) {
	return /* @__PURE__ */ _isoDate(ZodISODate, params);
}
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function time(params) {
	return /* @__PURE__ */ _isoTime(ZodISOTime, params);
}
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function duration(params) {
	return /* @__PURE__ */ _isoDuration(ZodISODuration, params);
}
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/errors.js
var initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	Object.defineProperties(inst, {
		format: { value: (mapper) => formatError(inst, mapper) },
		flatten: { value: (mapper) => flattenError(inst, mapper) },
		addIssue: { value: (issue) => {
			inst.issues.push(issue);
			inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
		} },
		addIssues: { value: (issues) => {
			inst.issues.push(...issues);
			inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
		} },
		isEmpty: { get() {
			return inst.issues.length === 0;
		} }
	});
};
var ZodError = $constructor("ZodError", initializer);
var ZodRealError = $constructor("ZodError", initializer, { Parent: Error });
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/parse.js
var parse = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/schemas.js
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
	$ZodType.init(inst, def);
	Object.assign(inst["~standard"], { jsonSchema: {
		input: createStandardJSONSchemaMethod(inst, "input"),
		output: createStandardJSONSchemaMethod(inst, "output")
	} });
	inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
	inst.def = def;
	inst.type = def.type;
	Object.defineProperty(inst, "_def", { value: def });
	inst.check = (...checks) => {
		return inst.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...checks.map((ch) => typeof ch === "function" ? { _zod: {
			check: ch,
			def: { check: "custom" },
			onattach: []
		} } : ch)] }), { parent: true });
	};
	inst.with = inst.check;
	inst.clone = (def, params) => clone(inst, def, params);
	inst.brand = () => inst;
	inst.register = ((reg, meta) => {
		reg.add(inst, meta);
		return inst;
	});
	inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
	inst.safeParse = (data, params) => safeParse(inst, data, params);
	inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
	inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
	inst.spa = inst.safeParseAsync;
	inst.encode = (data, params) => encode(inst, data, params);
	inst.decode = (data, params) => decode(inst, data, params);
	inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
	inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
	inst.safeEncode = (data, params) => safeEncode(inst, data, params);
	inst.safeDecode = (data, params) => safeDecode(inst, data, params);
	inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
	inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
	inst.refine = (check, params) => inst.check(refine(check, params));
	inst.superRefine = (refinement) => inst.check(superRefine(refinement));
	inst.overwrite = (fn) => inst.check(/* @__PURE__ */ _overwrite(fn));
	inst.optional = () => optional(inst);
	inst.exactOptional = () => exactOptional(inst);
	inst.nullable = () => nullable(inst);
	inst.nullish = () => optional(nullable(inst));
	inst.nonoptional = (params) => nonoptional(inst, params);
	inst.array = () => array(inst);
	inst.or = (arg) => union([inst, arg]);
	inst.and = (arg) => intersection(inst, arg);
	inst.transform = (tx) => pipe(inst, transform(tx));
	inst.default = (def) => _default(inst, def);
	inst.prefault = (def) => prefault(inst, def);
	inst.catch = (params) => _catch(inst, params);
	inst.pipe = (target) => pipe(inst, target);
	inst.readonly = () => readonly(inst);
	inst.describe = (description) => {
		const cl = inst.clone();
		globalRegistry.add(cl, { description });
		return cl;
	};
	Object.defineProperty(inst, "description", {
		get() {
			return globalRegistry.get(inst)?.description;
		},
		configurable: true
	});
	inst.meta = (...args) => {
		if (args.length === 0) return globalRegistry.get(inst);
		const cl = inst.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	};
	inst.isOptional = () => inst.safeParse(void 0).success;
	inst.isNullable = () => inst.safeParse(null).success;
	inst.apply = (fn) => fn(inst);
	return inst;
});
/** @internal */
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
	const bag = inst._zod.bag;
	inst.format = bag.format ?? null;
	inst.minLength = bag.minimum ?? null;
	inst.maxLength = bag.maximum ?? null;
	inst.regex = (...args) => inst.check(/* @__PURE__ */ _regex(...args));
	inst.includes = (...args) => inst.check(/* @__PURE__ */ _includes(...args));
	inst.startsWith = (...args) => inst.check(/* @__PURE__ */ _startsWith(...args));
	inst.endsWith = (...args) => inst.check(/* @__PURE__ */ _endsWith(...args));
	inst.min = (...args) => inst.check(/* @__PURE__ */ _minLength(...args));
	inst.max = (...args) => inst.check(/* @__PURE__ */ _maxLength(...args));
	inst.length = (...args) => inst.check(/* @__PURE__ */ _length(...args));
	inst.nonempty = (...args) => inst.check(/* @__PURE__ */ _minLength(1, ...args));
	inst.lowercase = (params) => inst.check(/* @__PURE__ */ _lowercase(params));
	inst.uppercase = (params) => inst.check(/* @__PURE__ */ _uppercase(params));
	inst.trim = () => inst.check(/* @__PURE__ */ _trim());
	inst.normalize = (...args) => inst.check(/* @__PURE__ */ _normalize(...args));
	inst.toLowerCase = () => inst.check(/* @__PURE__ */ _toLowerCase());
	inst.toUpperCase = () => inst.check(/* @__PURE__ */ _toUpperCase());
	inst.slugify = () => inst.check(/* @__PURE__ */ _slugify());
});
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
	inst.email = (params) => inst.check(/* @__PURE__ */ _email(ZodEmail, params));
	inst.url = (params) => inst.check(/* @__PURE__ */ _url(ZodURL, params));
	inst.jwt = (params) => inst.check(/* @__PURE__ */ _jwt(ZodJWT, params));
	inst.emoji = (params) => inst.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
	inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
	inst.uuid = (params) => inst.check(/* @__PURE__ */ _uuid(ZodUUID, params));
	inst.uuidv4 = (params) => inst.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
	inst.uuidv6 = (params) => inst.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
	inst.uuidv7 = (params) => inst.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
	inst.nanoid = (params) => inst.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
	inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
	inst.cuid = (params) => inst.check(/* @__PURE__ */ _cuid(ZodCUID, params));
	inst.cuid2 = (params) => inst.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
	inst.ulid = (params) => inst.check(/* @__PURE__ */ _ulid(ZodULID, params));
	inst.base64 = (params) => inst.check(/* @__PURE__ */ _base64(ZodBase64, params));
	inst.base64url = (params) => inst.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
	inst.xid = (params) => inst.check(/* @__PURE__ */ _xid(ZodXID, params));
	inst.ksuid = (params) => inst.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
	inst.ipv4 = (params) => inst.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
	inst.ipv6 = (params) => inst.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
	inst.cidrv4 = (params) => inst.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
	inst.cidrv6 = (params) => inst.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
	inst.e164 = (params) => inst.check(/* @__PURE__ */ _e164(ZodE164, params));
	inst.datetime = (params) => inst.check(datetime(params));
	inst.date = (params) => inst.check(date(params));
	inst.time = (params) => inst.check(time(params));
	inst.duration = (params) => inst.check(duration(params));
});
function string(params) {
	return /* @__PURE__ */ _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
	inst.gt = (value, params) => inst.check(/* @__PURE__ */ _gt(value, params));
	inst.gte = (value, params) => inst.check(/* @__PURE__ */ _gte(value, params));
	inst.min = (value, params) => inst.check(/* @__PURE__ */ _gte(value, params));
	inst.lt = (value, params) => inst.check(/* @__PURE__ */ _lt(value, params));
	inst.lte = (value, params) => inst.check(/* @__PURE__ */ _lte(value, params));
	inst.max = (value, params) => inst.check(/* @__PURE__ */ _lte(value, params));
	inst.int = (params) => inst.check(int(params));
	inst.safe = (params) => inst.check(int(params));
	inst.positive = (params) => inst.check(/* @__PURE__ */ _gt(0, params));
	inst.nonnegative = (params) => inst.check(/* @__PURE__ */ _gte(0, params));
	inst.negative = (params) => inst.check(/* @__PURE__ */ _lt(0, params));
	inst.nonpositive = (params) => inst.check(/* @__PURE__ */ _lte(0, params));
	inst.multipleOf = (value, params) => inst.check(/* @__PURE__ */ _multipleOf(value, params));
	inst.step = (value, params) => inst.check(/* @__PURE__ */ _multipleOf(value, params));
	inst.finite = () => inst;
	const bag = inst._zod.bag;
	inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
	inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
	inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? .5);
	inst.isFinite = true;
	inst.format = bag.format ?? null;
});
function number(params) {
	return /* @__PURE__ */ _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean(params) {
	return /* @__PURE__ */ _boolean(ZodBoolean, params);
}
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
	$ZodNull.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullProcessor(inst, ctx, json, params);
});
function _null(params) {
	return /* @__PURE__ */ _null$1(ZodNull, params);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
	return /* @__PURE__ */ _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
	return /* @__PURE__ */ _never(ZodNever, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
	inst.element = def.element;
	inst.min = (minLength, params) => inst.check(/* @__PURE__ */ _minLength(minLength, params));
	inst.nonempty = (params) => inst.check(/* @__PURE__ */ _minLength(1, params));
	inst.max = (maxLength, params) => inst.check(/* @__PURE__ */ _maxLength(maxLength, params));
	inst.length = (len, params) => inst.check(/* @__PURE__ */ _length(len, params));
	inst.unwrap = () => inst.element;
});
function array(element, params) {
	return /* @__PURE__ */ _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
	$ZodObjectJIT.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
	defineLazy(inst, "shape", () => {
		return def.shape;
	});
	inst.keyof = () => _enum(Object.keys(inst._zod.def.shape));
	inst.catchall = (catchall) => inst.clone({
		...inst._zod.def,
		catchall
	});
	inst.passthrough = () => inst.clone({
		...inst._zod.def,
		catchall: unknown()
	});
	inst.loose = () => inst.clone({
		...inst._zod.def,
		catchall: unknown()
	});
	inst.strict = () => inst.clone({
		...inst._zod.def,
		catchall: never()
	});
	inst.strip = () => inst.clone({
		...inst._zod.def,
		catchall: void 0
	});
	inst.extend = (incoming) => {
		return extend(inst, incoming);
	};
	inst.safeExtend = (incoming) => {
		return safeExtend(inst, incoming);
	};
	inst.merge = (other) => merge(inst, other);
	inst.pick = (mask) => pick(inst, mask);
	inst.omit = (mask) => omit(inst, mask);
	inst.partial = (...args) => partial(ZodOptional, inst, args[0]);
	inst.required = (...args) => required(ZodNonOptional, inst, args[0]);
});
function strictObject(shape, params) {
	return new ZodObject({
		type: "object",
		shape,
		catchall: never(),
		...normalizeParams(params)
	});
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
	ZodUnion.init(inst, def);
	$ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
	return new ZodDiscriminatedUnion({
		type: "union",
		options,
		discriminator,
		...normalizeParams(params)
	});
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
var ZodTuple = /* @__PURE__ */ $constructor("ZodTuple", (inst, def) => {
	$ZodTuple.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => tupleProcessor(inst, ctx, json, params);
	inst.rest = (rest) => inst.clone({
		...inst._zod.def,
		rest
	});
});
function tuple(items, _paramsOrRest, _params) {
	const hasRest = _paramsOrRest instanceof $ZodType;
	return new ZodTuple({
		type: "tuple",
		items,
		rest: hasRest ? _paramsOrRest : null,
		...normalizeParams(hasRest ? _params : _paramsOrRest)
	});
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
	$ZodRecord.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
	inst.keyType = def.keyType;
	inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
	return new ZodRecord({
		type: "record",
		keyType,
		valueType,
		...normalizeParams(params)
	});
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
	inst.enum = def.entries;
	inst.options = Object.values(def.entries);
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	return new ZodEnum({
		type: "enum",
		entries: Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values,
		...normalizeParams(params)
	});
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
	$ZodLiteral.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
	inst.values = new Set(def.values);
	Object.defineProperty(inst, "value", { get() {
		if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return def.values[0];
	} });
});
function literal(value, params) {
	return new ZodLiteral({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				_issue.input ?? (_issue.input = payload.value);
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output) => {
			payload.value = output;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
	});
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
var ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
	$ZodLazy.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => lazyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
	return new ZodLazy({
		type: "lazy",
		getter
	});
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
	return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn) {
	return /* @__PURE__ */ _superRefine(fn);
}
//#endregion
//#region ../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/compat.js
/** @deprecated Use the raw string literal codes instead, e.g. "invalid_type". */
var ZodIssueCode = {
	invalid_type: "invalid_type",
	too_big: "too_big",
	too_small: "too_small",
	invalid_format: "invalid_format",
	not_multiple_of: "not_multiple_of",
	unrecognized_keys: "unrecognized_keys",
	invalid_union: "invalid_union",
	invalid_key: "invalid_key",
	invalid_element: "invalid_element",
	invalid_value: "invalid_value",
	custom: "custom"
};
/** @deprecated Do not use. Stub definition, only included for zod-to-json-schema compatibility. */
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind) {})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
//#endregion
//#region src/vendor/backlog-engineer/schemas/scalars.ts
function uniqueArraySchema(itemSchema, getKey, issueMessage) {
	return array(itemSchema).superRefine((items, ctx) => {
		const seen = /* @__PURE__ */ new Map();
		for (const [index, item] of items.entries()) {
			const key = getKey(item);
			if (seen.get(key) !== void 0) {
				ctx.addIssue({
					code: ZodIssueCode.custom,
					message: issueMessage,
					path: [index]
				});
				continue;
			}
			seen.set(key, index);
		}
	});
}
function nonEmptyObjectSchema(shape) {
	return strictObject(shape).partial().superRefine((value, ctx) => {
		if (Object.keys(value).length === 0) ctx.addIssue({
			code: ZodIssueCode.custom,
			message: "Object must contain at least one field."
		});
	});
}
var NonEmptyStringSchema = string().trim().min(1);
var ItemKeySchema = NonEmptyStringSchema;
var ClaimKeySchema = NonEmptyStringSchema;
var ContractKeySchema = NonEmptyStringSchema;
var DataDomainKeySchema = NonEmptyStringSchema;
var QualityAttributeKeySchema = NonEmptyStringSchema;
var PolicyDecisionKeySchema = NonEmptyStringSchema;
var SourceIdSchema = string().uuid();
var TodoIdSchema = string().uuid();
var PacketIdSchema = string().uuid();
var PatchIdSchema = NonEmptyStringSchema;
var SourceLabelSchema = NonEmptyStringSchema;
var CliPathInputSchema = NonEmptyStringSchema.superRefine((value, ctx) => {
	if (value.includes("\0")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Path input must not contain NUL bytes."
	});
});
var NormalizedFsPathSchema = NonEmptyStringSchema.superRefine((value, ctx) => {
	if (value.includes("\0")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Filesystem path must not contain NUL bytes."
	});
	if (!path.isAbsolute(value)) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Normalized filesystem path must be absolute."
	});
	if (path.normalize(value) !== value) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Filesystem path must already be normalized."
	});
});
function validateRelativePosixPath(value, ctx, options) {
	if (value.includes("\0")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: `${options.label} must not contain NUL bytes.`
	});
	if (value.startsWith("/")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: `${options.label} must not be absolute.`
	});
	if (value.includes("\\")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: `${options.label} must use POSIX separators.`
	});
	if (/^[A-Za-z]:(?:$|\/)/.test(value)) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: `${options.label} must not use Windows drive-prefixed forms.`
	});
	const segments = value.split("/");
	if (segments.some((segment) => segment.length === 0)) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: `${options.label} must not contain empty segments.`
	});
	if (segments.some((segment) => segment === ".")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: `${options.label} must not contain dot segments.`
	});
	if (!options.allowParentSegments && segments.some((segment) => segment === "..")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: `${options.label} must not contain parent segments.`
	});
	if (path.posix.normalize(value) !== value) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: `${options.label} must already be normalized.`
	});
}
var BacklogRelativePosixPathSchema = NonEmptyStringSchema.superRefine((value, ctx) => {
	validateRelativePosixPath(value, ctx, {
		label: "Backlog-relative path",
		allowParentSegments: false
	});
});
var SourceRelativePosixPathSchema = NonEmptyStringSchema.superRefine((value, ctx) => {
	validateRelativePosixPath(value, ctx, {
		label: "Source path",
		allowParentSegments: true
	});
});
var Sha256HexSchema = string().regex(/^[a-f0-9]{64}$/);
var IsoUtcTimestampSchema = string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/);
var SchemaVersionSchema = number().int().min(0);
var LayoutVersionSchema = number().int().min(0);
var PositiveIntSchema = number().int().positive();
var NonNegativeIntSchema = number().int().min(0);
var ApplyIndexSchema = PositiveIntSchema;
var SequenceSchema = PositiveIntSchema;
var DeliveryStateSchema = _enum([
	"defined",
	"specified",
	"planned",
	"implemented"
]);
var AttentionReasonCodeSchema = _enum([
	"source_changed",
	"dependency_changed",
	"context_changed",
	"gaps"
]);
var TodoTypeSchema = _enum([
	"review_source_change",
	"review_dependency_change",
	"review_context_change"
]);
var TodoManagedBySchema = _enum(["refresh", "mutation"]);
var PatchKindSchema = _enum([
	"patch-item",
	"remove-item",
	"source-maintenance"
]);
_enum([
	"replace_fields",
	"append_unique",
	"remove_values",
	"remove_todo",
	"remove_item",
	"remove_source_references"
]);
var ControlledStringSchema = NonEmptyStringSchema;
var KeyStrategySchema = record(NonEmptyStringSchema, NonEmptyStringSchema);
var StructuredSummaryPrimitiveSchema = union([
	string(),
	number(),
	boolean(),
	_null()
]);
var StructuredSummaryEntrySchema = record(NonEmptyStringSchema, union([StructuredSummaryPrimitiveSchema, array(StructuredSummaryPrimitiveSchema)]));
var SourceSummarySchema = strictObject({
	source_id: SourceIdSchema,
	source_label: SourceLabelSchema
});
//#endregion
//#region src/vendor/backlog-engineer/schemas/packet.ts
var GlossaryEntrySchema = strictObject({
	term: NonEmptyStringSchema,
	definition: NonEmptyStringSchema,
	aliases: uniqueArraySchema(NonEmptyStringSchema, (value) => value, "Glossary aliases must be unique.")
});
var ClaimSchema = strictObject({
	claim_key: ClaimKeySchema,
	title: NonEmptyStringSchema,
	claim_class: ControlledStringSchema,
	commitment: ControlledStringSchema,
	source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique.")
});
var ContractSchema = strictObject({
	contract_key: ContractKeySchema,
	title: NonEmptyStringSchema,
	owner: NonEmptyStringSchema,
	versioning_strategy: NonEmptyStringSchema,
	reconciliation_strategy: NonEmptyStringSchema,
	deprecation_window: NonEmptyStringSchema,
	retirement_condition: NonEmptyStringSchema
});
var DataDomainSchema = strictObject({
	data_domain_key: DataDomainKeySchema,
	title: NonEmptyStringSchema,
	data_class: ControlledStringSchema,
	owners: uniqueArraySchema(NonEmptyStringSchema, (value) => value, "Data domain owners must be unique.")
});
var QualityAttributeSchema = strictObject({
	quality_attribute_key: QualityAttributeKeySchema,
	title: NonEmptyStringSchema,
	quality_class: ControlledStringSchema,
	target: NonEmptyStringSchema,
	applies_to_item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Quality attribute item keys must be unique."),
	owner_keys: uniqueArraySchema(NonEmptyStringSchema, (value) => value, "Quality attribute owner keys must be unique."),
	source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique.")
});
var PolicyDecisionSchema = strictObject({
	policy_decision_key: PolicyDecisionKeySchema,
	title: NonEmptyStringSchema,
	policy_surface: ControlledStringSchema,
	decision_state: ControlledStringSchema,
	owner: NonEmptyStringSchema,
	source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	related_item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Related item keys must be unique.")
});
var PacketContextSchema = strictObject({
	glossary: uniqueArraySchema(GlossaryEntrySchema, (value) => value.term, "Glossary terms must be unique."),
	key_strategy: KeyStrategySchema,
	target_system: array(StructuredSummaryEntrySchema).default([]),
	as_built: array(StructuredSummaryEntrySchema).default([]),
	claims: uniqueArraySchema(ClaimSchema, (value) => value.claim_key, "Claim keys must be unique."),
	contracts: uniqueArraySchema(ContractSchema, (value) => value.contract_key, "Contract keys must be unique."),
	data_domains: uniqueArraySchema(DataDomainSchema, (value) => value.data_domain_key, "Data domain keys must be unique."),
	quality_attributes: uniqueArraySchema(QualityAttributeSchema, (value) => value.quality_attribute_key, "Quality attribute keys must be unique."),
	policy_decisions: uniqueArraySchema(PolicyDecisionSchema, (value) => value.policy_decision_key, "Policy decision keys must be unique.")
});
var PacketItemSchema = strictObject({
	item_key: ItemKeySchema,
	title: NonEmptyStringSchema,
	type: ControlledStringSchema,
	delivery_state: DeliveryStateSchema,
	gaps: uniqueArraySchema(NonEmptyStringSchema, (value) => value, "Gaps must be unique."),
	depends_on_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Dependency item keys must be unique."),
	origin_source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	specification_source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	plan_source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	implementation_source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	test_source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	claim_keys: uniqueArraySchema(ClaimKeySchema, (value) => value, "Claim keys must be unique."),
	contract_keys: uniqueArraySchema(ContractKeySchema, (value) => value, "Contract keys must be unique."),
	data_domain_keys: uniqueArraySchema(DataDomainKeySchema, (value) => value, "Data domain keys must be unique."),
	quality_attribute_keys: uniqueArraySchema(QualityAttributeKeySchema, (value) => value, "Quality attribute keys must be unique."),
	policy_decision_keys: uniqueArraySchema(PolicyDecisionKeySchema, (value) => value, "Policy decision keys must be unique.")
}).superRefine((value, ctx) => {
	if (value.depends_on_keys.includes(value.item_key)) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Item must not depend on itself.",
		path: ["depends_on_keys"]
	});
});
var PacketFileSchema = strictObject({
	context: PacketContextSchema,
	items: array(PacketItemSchema)
}).superRefine((value, ctx) => {
	const seenItemKeys = /* @__PURE__ */ new Set();
	for (const [index, item] of value.items.entries()) {
		if (seenItemKeys.has(item.item_key)) {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: "Packet contains duplicate item_key values.",
				path: [
					"items",
					index,
					"item_key"
				]
			});
			continue;
		}
		seenItemKeys.add(item.item_key);
	}
});
//#endregion
//#region src/vendor/backlog-engineer/schemas/artifacts.ts
var RootMarkerFileSchema = strictObject({
	schema_version: SchemaVersionSchema,
	tool_name: NonEmptyStringSchema,
	created_at: IsoUtcTimestampSchema,
	layout_version: LayoutVersionSchema
});
var SourceRegistryFileSchema = strictObject({
	schema_version: SchemaVersionSchema,
	created_at: IsoUtcTimestampSchema,
	updated_at: IsoUtcTimestampSchema,
	sources: uniqueArraySchema(strictObject({
		source_id: SourceIdSchema,
		source_label: SourceLabelSchema,
		path: SourceRelativePosixPathSchema,
		kind: ControlledStringSchema,
		authority: ControlledStringSchema,
		note: NonEmptyStringSchema.optional(),
		hash: Sha256HexSchema,
		registered_at: IsoUtcTimestampSchema,
		last_checked_at: IsoUtcTimestampSchema
	}), (value) => value.source_id, "Source IDs must be unique.")
}).superRefine((value, ctx) => {
	const seenPaths = /* @__PURE__ */ new Set();
	for (const [index, source] of value.sources.entries()) {
		if (seenPaths.has(source.path)) {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: "Source paths must be unique.",
				path: [
					"sources",
					index,
					"path"
				]
			});
			continue;
		}
		seenPaths.add(source.path);
	}
});
var AppliedPacketEntrySchema = strictObject({
	packet_id: PacketIdSchema,
	apply_index: ApplyIndexSchema,
	canonical_path: BacklogRelativePosixPathSchema,
	content_hash: Sha256HexSchema,
	applied_at: IsoUtcTimestampSchema,
	item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique.")
});
var AppliedPatchEntrySchema = strictObject({
	patch_id: PatchIdSchema,
	apply_index: ApplyIndexSchema,
	canonical_path: BacklogRelativePosixPathSchema,
	content_hash: Sha256HexSchema,
	sequence: PositiveIntSchema,
	applied_at: IsoUtcTimestampSchema,
	kind: PatchKindSchema,
	target_item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Target item keys must be unique.")
});
var AppliedRegistryFileSchema = strictObject({
	schema_version: SchemaVersionSchema,
	created_at: IsoUtcTimestampSchema,
	updated_at: IsoUtcTimestampSchema,
	next_apply_index: PositiveIntSchema,
	packets: uniqueArraySchema(AppliedPacketEntrySchema, (value) => value.packet_id, "Packet IDs must be unique."),
	patches: uniqueArraySchema(AppliedPatchEntrySchema, (value) => value.patch_id, "Patch IDs must be unique.")
}).superRefine((value, ctx) => {
	const applyIndexes = /* @__PURE__ */ new Set();
	for (const [index, packet] of value.packets.entries()) {
		if (applyIndexes.has(packet.apply_index)) {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: "apply_index values must be globally unique.",
				path: [
					"packets",
					index,
					"apply_index"
				]
			});
			continue;
		}
		applyIndexes.add(packet.apply_index);
	}
	for (const [index, patch] of value.patches.entries()) {
		if (applyIndexes.has(patch.apply_index)) {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: "apply_index values must be globally unique.",
				path: [
					"patches",
					index,
					"apply_index"
				]
			});
			continue;
		}
		applyIndexes.add(patch.apply_index);
	}
});
var StateItemSchema = PacketItemSchema.extend({
	reverse_dependency_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Reverse dependency item keys must be unique."),
	open_todo_ids: uniqueArraySchema(TodoIdSchema, (value) => value, "Open todo IDs must be unique."),
	needs_attention: boolean(),
	attention_reason_codes: array(AttentionReasonCodeSchema),
	attention_reasons: array(NonEmptyStringSchema),
	ready_for_next_step: boolean()
}).superRefine((value, ctx) => {
	if (value.attention_reason_codes.length !== value.attention_reasons.length) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "attention_reason_codes and attention_reasons must have matching length.",
		path: ["attention_reasons"]
	});
});
var TodoSchema = strictObject({
	todo_id: TodoIdSchema,
	item_key: ItemKeySchema,
	type: TodoTypeSchema,
	managed_by: TodoManagedBySchema.default("mutation"),
	message: NonEmptyStringSchema,
	created_at: IsoUtcTimestampSchema,
	related_sources: uniqueArraySchema(SourceSummarySchema, (value) => value.source_id, "Related sources must be unique by source_id."),
	related_item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Related item keys must be unique.")
});
var StateFileSchema = strictObject({
	schema_version: SchemaVersionSchema,
	created_at: IsoUtcTimestampSchema,
	updated_at: IsoUtcTimestampSchema,
	last_refresh_at: nullable(IsoUtcTimestampSchema),
	context: PacketContextSchema,
	items: uniqueArraySchema(StateItemSchema, (value) => value.item_key, "Item keys must be unique."),
	todos: uniqueArraySchema(TodoSchema, (value) => value.todo_id, "Todo IDs must be unique.")
}).superRefine((value, ctx) => {
	const todoIds = new Map(value.todos.map((todo) => [todo.todo_id, todo.item_key]));
	for (const [itemIndex, item] of value.items.entries()) for (const [todoIndex, todoId] of item.open_todo_ids.entries()) {
		const ownerItemKey = todoIds.get(todoId);
		if (!ownerItemKey) {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: "open_todo_ids must reference existing todos.",
				path: [
					"items",
					itemIndex,
					"open_todo_ids",
					todoIndex
				]
			});
			continue;
		}
		if (ownerItemKey !== item.item_key) ctx.addIssue({
			code: ZodIssueCode.custom,
			message: "open_todo_ids must reference todos owned by the same item.",
			path: [
				"items",
				itemIndex,
				"open_todo_ids",
				todoIndex
			]
		});
	}
});
//#endregion
//#region src/vendor/backlog-engineer/schemas/commands.ts
var CommandSuggestionSchema = strictObject({
	command: _enum([
		"status",
		"report",
		"items",
		"search",
		"gaps",
		"queue",
		"attention",
		"refresh"
	]),
	args: array(string()),
	reason: NonEmptyStringSchema
});
var PacketMutationCountsSchema = strictObject({
	added: NonNegativeIntSchema,
	removed: NonNegativeIntSchema,
	todo_created: NonNegativeIntSchema,
	todo_updated: NonNegativeIntSchema
});
var PatchItemMutationCountsSchema = strictObject({
	updated: NonNegativeIntSchema,
	todo_created: NonNegativeIntSchema,
	todo_updated: NonNegativeIntSchema,
	todo_removed: NonNegativeIntSchema
});
var RemoveItemMutationCountsSchema = strictObject({
	removed: NonNegativeIntSchema,
	todo_created: NonNegativeIntSchema,
	todo_updated: NonNegativeIntSchema,
	todo_removed: NonNegativeIntSchema
});
var RefreshMutationCountsSchema = strictObject({
	changed_sources: NonNegativeIntSchema,
	todo_created: NonNegativeIntSchema,
	todo_updated: NonNegativeIntSchema,
	todo_removed: NonNegativeIntSchema
});
var ItemComputedStateSchema = strictObject({
	needs_attention: boolean(),
	attention_reason_codes: array(AttentionReasonCodeSchema),
	attention_reasons: array(NonEmptyStringSchema),
	ready_for_next_step: boolean()
}).superRefine((value, ctx) => {
	if (value.attention_reason_codes.length !== value.attention_reasons.length) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "attention_reason_codes and attention_reasons must have matching length."
	});
});
var ItemContextSummarySchema = strictObject({
	claim_keys: uniqueArraySchema(ClaimKeySchema, (value) => value, "Claim keys must be unique."),
	contract_keys: uniqueArraySchema(ContractKeySchema, (value) => value, "Contract keys must be unique."),
	data_domain_keys: uniqueArraySchema(DataDomainKeySchema, (value) => value, "Data domain keys must be unique."),
	quality_attribute_keys: uniqueArraySchema(QualityAttributeKeySchema, (value) => value, "Quality attribute keys must be unique."),
	policy_decision_keys: uniqueArraySchema(PolicyDecisionKeySchema, (value) => value, "Policy decision keys must be unique.")
});
var InitCommandInputSchema = strictObject({ path: CliPathInputSchema });
var InitCommandOutputSchema = strictObject({
	path: NormalizedFsPathSchema,
	root_marker_path: NormalizedFsPathSchema,
	agents_path: NormalizedFsPathSchema
});
var RegisterSourceCommandInputSchema = strictObject({
	path: CliPathInputSchema,
	kind: NonEmptyStringSchema,
	authority: NonEmptyStringSchema,
	note: NonEmptyStringSchema.optional()
});
var RegisteredSourceOutputSchema = strictObject({
	source_id: SourceIdSchema,
	source_label: SourceLabelSchema,
	path: NormalizedFsPathSchema,
	kind: NonEmptyStringSchema,
	authority: NonEmptyStringSchema,
	note: NonEmptyStringSchema.optional(),
	hash: string().regex(/^[a-f0-9]{64}$/)
});
var RegisterSourceCommandOutputSchema = RegisteredSourceOutputSchema;
var ListSourcesCommandInputSchema = strictObject({
	item_key: ItemKeySchema.optional(),
	path: CliPathInputSchema.optional()
});
var ListSourcesCommandOutputSchema = array(RegisteredSourceOutputSchema.extend({
	registered_at: IsoUtcTimestampSchema,
	last_checked_at: IsoUtcTimestampSchema
}));
var SourceSelectorInputSchema = discriminatedUnion("kind", [
	strictObject({
		kind: literal("source_id"),
		source_id: SourceIdSchema
	}),
	strictObject({
		kind: literal("source_label"),
		source_label: SourceLabelSchema
	}),
	strictObject({
		kind: literal("source_path"),
		source_path: CliPathInputSchema
	})
]);
var UpdateSourcePathMutationCountsSchema = strictObject({
	changed_sources: NonNegativeIntSchema,
	todo_created: NonNegativeIntSchema,
	todo_updated: NonNegativeIntSchema,
	todo_removed: NonNegativeIntSchema
});
var UpdateSourcePathCommandInputSchema = strictObject({
	selector: SourceSelectorInputSchema,
	new_path: CliPathInputSchema,
	dry_run: boolean().default(false)
});
var UpdateSourcePathCommandOutputSchema = RegisteredSourceOutputSchema.extend({
	dry_run: boolean(),
	previous_path: NormalizedFsPathSchema,
	hash_changed: boolean(),
	counts: UpdateSourcePathMutationCountsSchema,
	todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_removed: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	next_commands: array(CommandSuggestionSchema)
});
var RemoveSourceMutationCountsSchema = strictObject({
	updated: NonNegativeIntSchema,
	todo_created: NonNegativeIntSchema,
	todo_updated: NonNegativeIntSchema,
	todo_removed: NonNegativeIntSchema
});
var RemoveSourceCommandInputSchema = strictObject({
	selector: SourceSelectorInputSchema,
	dry_run: boolean().default(false)
});
var RemoveSourceCommandOutputSchema = RegisteredSourceOutputSchema.extend({
	dry_run: boolean(),
	canonical_patch_path: NormalizedFsPathSchema.optional(),
	canonical_patch_purpose: literal("immutable_replay_artifact").optional(),
	removed: boolean(),
	counts: RemoveSourceMutationCountsSchema,
	updated_item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Updated item keys must be unique."),
	todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_removed: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	next_commands: array(CommandSuggestionSchema)
});
var TemplateCommandInputSchema = discriminatedUnion("mode", [strictObject({
	mode: literal("packet"),
	out: CliPathInputSchema
}), strictObject({
	mode: literal("patch"),
	out: CliPathInputSchema,
	item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique.").min(1)
})]);
var TemplateCommandOutputSchema = strictObject({
	mode: _enum(["packet", "patch"]),
	output_path: NormalizedFsPathSchema
});
var PacketCommandInputSchema = strictObject({
	path: CliPathInputSchema,
	dry_run: boolean().default(false)
});
var PacketCommandOutputSchema = strictObject({
	dry_run: boolean(),
	authored_packet_path: NormalizedFsPathSchema,
	canonical_packet_path: NormalizedFsPathSchema.optional(),
	canonical_packet_purpose: literal("immutable_import_copy").optional(),
	counts: PacketMutationCountsSchema,
	added: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	removed: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	next_commands: array(CommandSuggestionSchema)
});
var PatchItemCommandInputSchema = strictObject({
	patch: CliPathInputSchema,
	dry_run: boolean().default(false)
});
var PatchItemCommandOutputSchema = strictObject({
	dry_run: boolean(),
	authored_patch_path: NormalizedFsPathSchema.optional(),
	canonical_patch_path: NormalizedFsPathSchema.optional(),
	canonical_patch_purpose: literal("immutable_replay_artifact").optional(),
	counts: PatchItemMutationCountsSchema,
	updated: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_removed: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	next_commands: array(CommandSuggestionSchema)
});
var RemoveItemCommandInputSchema = strictObject({
	patch: CliPathInputSchema,
	dry_run: boolean().default(false)
});
var RemoveItemCommandOutputSchema = strictObject({
	dry_run: boolean(),
	authored_patch_path: NormalizedFsPathSchema.optional(),
	canonical_patch_path: NormalizedFsPathSchema.optional(),
	canonical_patch_purpose: literal("immutable_replay_artifact").optional(),
	counts: RemoveItemMutationCountsSchema,
	removed: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_removed: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	next_commands: array(CommandSuggestionSchema)
});
var RefreshCommandInputSchema = discriminatedUnion("kind", [
	strictObject({ kind: literal("all") }),
	strictObject({
		kind: literal("item"),
		item_key: ItemKeySchema
	}),
	strictObject({
		kind: literal("source_id"),
		source_id: SourceIdSchema
	}),
	strictObject({
		kind: literal("source_label"),
		source_label: SourceLabelSchema
	}),
	strictObject({
		kind: literal("source_path"),
		source_path: CliPathInputSchema
	})
]);
var RefreshCommandOutputSchema = strictObject({
	counts: RefreshMutationCountsSchema,
	changed_sources: array(SourceSummarySchema),
	todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	todo_removed: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique."),
	next_commands: array(CommandSuggestionSchema)
});
var StatusCommandInputSchema = strictObject({ refresh: boolean().default(false) });
var CanonicalArtifactIntegrityMissingPathSchema = strictObject({
	artifact_kind: _enum(["packet", "patch"]),
	canonical_path: NormalizedFsPathSchema,
	packet_id: NonEmptyStringSchema.optional(),
	patch_id: NonEmptyStringSchema.optional(),
	apply_index: NonNegativeIntSchema,
	sequence: NonNegativeIntSchema.optional()
});
var CanonicalArtifactIntegritySchema = strictObject({
	applied_canonical_paths_exist: boolean(),
	missing_canonical_paths: array(CanonicalArtifactIntegrityMissingPathSchema)
});
var StatusCommandOutputSchema = strictObject({
	total_items: NonNegativeIntSchema,
	last_refresh_at: nullable(IsoUtcTimestampSchema),
	defined_count: NonNegativeIntSchema,
	specified_count: NonNegativeIntSchema,
	planned_count: NonNegativeIntSchema,
	implemented_count: NonNegativeIntSchema,
	gaps_count: NonNegativeIntSchema,
	needs_attention_count: NonNegativeIntSchema,
	ready_for_next_step_count: NonNegativeIntSchema,
	open_todo_count: NonNegativeIntSchema,
	artifact_integrity: CanonicalArtifactIntegritySchema
});
var ReportCommandInputSchema = strictObject({});
var ReportCommandOutputSchema = strictObject({
	report_path: NormalizedFsPathSchema,
	generated_at: IsoUtcTimestampSchema,
	item_count: NonNegativeIntSchema
});
var ItemsCommandInputSchema = strictObject({ item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Item keys must be unique.").min(1) });
var ItemsCommandOutputSchema = array(strictObject({
	item: PacketItemSchema,
	reverse_dependency_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Reverse dependency keys must be unique."),
	source_summaries: uniqueArraySchema(SourceSummarySchema, (value) => value.source_id, "Source summaries must be unique by source_id."),
	context: ItemContextSummarySchema,
	computed_state: ItemComputedStateSchema,
	todo: array(TodoSchema)
}));
var SearchCommandInputSchema = strictObject({
	source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique.").optional(),
	delivery_state: DeliveryStateSchema.optional(),
	needs_attention: boolean().optional(),
	ready_for_next_step: boolean().optional(),
	claim_keys: uniqueArraySchema(ClaimKeySchema, (value) => value, "Claim keys must be unique.").optional(),
	contract_keys: uniqueArraySchema(ContractKeySchema, (value) => value, "Contract keys must be unique.").optional(),
	data_domain_keys: uniqueArraySchema(DataDomainKeySchema, (value) => value, "Data domain keys must be unique.").optional(),
	quality_attribute_keys: uniqueArraySchema(QualityAttributeKeySchema, (value) => value, "Quality attribute keys must be unique.").optional(),
	policy_decision_keys: uniqueArraySchema(PolicyDecisionKeySchema, (value) => value, "Policy decision keys must be unique.").optional()
});
var SearchCommandOutputSchema = array(strictObject({
	item_key: ItemKeySchema,
	title: NonEmptyStringSchema,
	type: NonEmptyStringSchema,
	delivery_state: DeliveryStateSchema,
	needs_attention: boolean(),
	ready_for_next_step: boolean(),
	attention_reason_codes: array(AttentionReasonCodeSchema),
	attention_reasons: array(NonEmptyStringSchema),
	source_summaries: uniqueArraySchema(SourceSummarySchema, (value) => value.source_id, "Source summaries must be unique by source_id."),
	match_reasons: uniqueArraySchema(NonEmptyStringSchema, (value) => value, "Match reasons must be unique.")
}).superRefine((value, ctx) => {
	if (value.attention_reason_codes.length !== value.attention_reasons.length) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "attention_reason_codes and attention_reasons must have matching length."
	});
}));
var GapsCommandInputSchema = strictObject({ item_key: ItemKeySchema.optional() });
var GapsCommandOutputSchema = array(strictObject({
	item_key: ItemKeySchema,
	title: NonEmptyStringSchema,
	gaps: uniqueArraySchema(NonEmptyStringSchema, (value) => value, "Gaps must be unique.")
}));
var QueueCommandInputSchema = strictObject({});
var QueueCommandOutputSchema = array(strictObject({
	root_item_key: ItemKeySchema,
	items: uniqueArraySchema(ItemKeySchema, (value) => value, "Queue item keys must be unique.").min(1),
	ordering_rule: tuple([
		literal("depth"),
		literal("downstream_dependency_count"),
		literal("item_key")
	])
}));
var AttentionCommandInputSchema = strictObject({});
var AttentionCommandOutputSchema = array(strictObject({
	item_key: ItemKeySchema,
	title: NonEmptyStringSchema,
	attention_reason_codes: array(AttentionReasonCodeSchema),
	attention_reasons: array(NonEmptyStringSchema),
	source_summaries: uniqueArraySchema(SourceSummarySchema, (value) => value.source_id, "Source summaries must be unique by source_id.")
}).superRefine((value, ctx) => {
	if (value.attention_reason_codes.length !== value.attention_reasons.length) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "attention_reason_codes and attention_reasons must have matching length."
	});
}));
var DeleteBacklogCommandInputSchema = strictObject({ confirm: literal(true) });
var DeleteBacklogCommandOutputSchema = strictObject({
	deleted_path: NormalizedFsPathSchema,
	deleted: literal(true)
});
//#endregion
//#region src/vendor/backlog-engineer/errors/error-codes.ts
var ERROR_CODES = [
	"BE_USAGE_INVALID",
	"BE_ROOT_NOT_FOUND",
	"BE_ROOT_ALREADY_EXISTS",
	"BE_ROOT_NOT_EMPTY",
	"BE_INVALID_JSON",
	"BE_SCHEMA_INVALID",
	"BE_INPUT_FILE_NOT_FOUND",
	"BE_SOURCE_NOT_FOUND",
	"BE_SOURCE_FILE_MISSING",
	"BE_SOURCE_READ_FAILED",
	"BE_SOURCE_PATH_CONFLICT",
	"BE_SOURCE_REMOVE_UNSUPPORTED",
	"BE_SOURCE_KIND_INVALID",
	"BE_SOURCE_AUTHORITY_INVALID",
	"BE_PACKET_ITEM_ALREADY_EXISTS",
	"BE_PACKET_DUPLICATE_ITEM_KEYS",
	"BE_CONTEXT_CONFLICT_GLOSSARY",
	"BE_CONTEXT_CONFLICT_ENTITY",
	"BE_DEPENDENCY_NOT_FOUND",
	"BE_PATCH_TARGET_NOT_FOUND",
	"BE_PATCH_ID_CONFLICT",
	"BE_PATCH_SEQUENCE_CONFLICT",
	"BE_PATCH_OPERATION_INVALID",
	"BE_TODO_REFRESH_MANAGED",
	"BE_TODO_NOT_FOUND",
	"BE_ITEM_NOT_FOUND",
	"BE_CANONICAL_WRITE_FAILED",
	"BE_CANONICAL_ARTIFACT_MISSING",
	"BE_REPORT_WRITE_FAILED",
	"BE_TEMPLATE_OUTPUT_INVALID",
	"BE_DELETE_CONFIRM_REQUIRED",
	"BE_MUTATION_LOCKED",
	"BE_PLATFORM_UNSUPPORTED",
	"BE_REBUILD_REPLAY_FAILED",
	"BE_INTERNAL_STATE_CORRUPT"
];
var ERROR_EXIT_CODES = {
	BE_USAGE_INVALID: 2,
	BE_ROOT_NOT_FOUND: 5,
	BE_ROOT_ALREADY_EXISTS: 4,
	BE_ROOT_NOT_EMPTY: 4,
	BE_INVALID_JSON: 3,
	BE_SCHEMA_INVALID: 3,
	BE_INPUT_FILE_NOT_FOUND: 5,
	BE_SOURCE_NOT_FOUND: 5,
	BE_SOURCE_FILE_MISSING: 5,
	BE_SOURCE_READ_FAILED: 5,
	BE_SOURCE_PATH_CONFLICT: 4,
	BE_SOURCE_REMOVE_UNSUPPORTED: 4,
	BE_SOURCE_KIND_INVALID: 2,
	BE_SOURCE_AUTHORITY_INVALID: 2,
	BE_PACKET_ITEM_ALREADY_EXISTS: 4,
	BE_PACKET_DUPLICATE_ITEM_KEYS: 4,
	BE_CONTEXT_CONFLICT_GLOSSARY: 4,
	BE_CONTEXT_CONFLICT_ENTITY: 4,
	BE_DEPENDENCY_NOT_FOUND: 4,
	BE_PATCH_TARGET_NOT_FOUND: 5,
	BE_PATCH_ID_CONFLICT: 4,
	BE_PATCH_SEQUENCE_CONFLICT: 4,
	BE_PATCH_OPERATION_INVALID: 4,
	BE_TODO_REFRESH_MANAGED: 4,
	BE_TODO_NOT_FOUND: 5,
	BE_ITEM_NOT_FOUND: 5,
	BE_CANONICAL_WRITE_FAILED: 1,
	BE_CANONICAL_ARTIFACT_MISSING: 1,
	BE_REPORT_WRITE_FAILED: 1,
	BE_TEMPLATE_OUTPUT_INVALID: 2,
	BE_DELETE_CONFIRM_REQUIRED: 6,
	BE_MUTATION_LOCKED: 7,
	BE_PLATFORM_UNSUPPORTED: 1,
	BE_REBUILD_REPLAY_FAILED: 1,
	BE_INTERNAL_STATE_CORRUPT: 1
};
var ERROR_DEFAULT_MESSAGES = {
	BE_USAGE_INVALID: "Command arguments are invalid.",
	BE_ROOT_NOT_FOUND: "Backlog root was not found.",
	BE_ROOT_ALREADY_EXISTS: "Backlog root already exists.",
	BE_ROOT_NOT_EMPTY: "Cannot initialize backlog because the target directory contains entries that conflict with backlog-managed artifacts.",
	BE_INVALID_JSON: "Input JSON is invalid.",
	BE_SCHEMA_INVALID: "Input does not match the required schema.",
	BE_INPUT_FILE_NOT_FOUND: "Input file was not found.",
	BE_SOURCE_NOT_FOUND: "Source was not found.",
	BE_SOURCE_FILE_MISSING: "Registered source file is missing on disk.",
	BE_SOURCE_READ_FAILED: "Registered source file could not be read safely.",
	BE_SOURCE_PATH_CONFLICT: "Another source is already registered at the requested path.",
	BE_SOURCE_REMOVE_UNSUPPORTED: "Source removal cannot be safely materialized under the current maintenance model.",
	BE_SOURCE_KIND_INVALID: "Source kind is invalid.",
	BE_SOURCE_AUTHORITY_INVALID: "Source authority is invalid.",
	BE_PACKET_ITEM_ALREADY_EXISTS: "Packet contains item_key that already exists in the backlog.",
	BE_PACKET_DUPLICATE_ITEM_KEYS: "Packet contains duplicate item_key values.",
	BE_CONTEXT_CONFLICT_GLOSSARY: "Packet glossary conflicts with existing backlog glossary.",
	BE_CONTEXT_CONFLICT_ENTITY: "Packet context entity conflicts with existing immutable context.",
	BE_DEPENDENCY_NOT_FOUND: "Dependency item_key was not found.",
	BE_PATCH_TARGET_NOT_FOUND: "Patch target item was not found.",
	BE_PATCH_ID_CONFLICT: "Patch ID already exists in applied registry.",
	BE_PATCH_SEQUENCE_CONFLICT: "Patch sequence is not monotonic.",
	BE_PATCH_OPERATION_INVALID: "Patch operation is invalid for this command.",
	BE_TODO_REFRESH_MANAGED: "Refresh-managed review todo cannot be removed through patch-item.",
	BE_TODO_NOT_FOUND: "Todo was not found.",
	BE_ITEM_NOT_FOUND: "Item was not found.",
	BE_CANONICAL_WRITE_FAILED: "Failed to write canonical artifact.",
	BE_CANONICAL_ARTIFACT_MISSING: "Canonical artifact referenced by applied registry is missing.",
	BE_REPORT_WRITE_FAILED: "Failed to write report artifact.",
	BE_TEMPLATE_OUTPUT_INVALID: "Template output path is invalid.",
	BE_DELETE_CONFIRM_REQUIRED: "Destructive command requires explicit confirmation.",
	BE_MUTATION_LOCKED: "Another mutating command is already running for this backlog root.",
	BE_PLATFORM_UNSUPPORTED: "This operation requires anchored directory handling that is unsupported on the current platform.",
	BE_REBUILD_REPLAY_FAILED: "Backlog rebuild failed while replaying canonical artifacts.",
	BE_INTERNAL_STATE_CORRUPT: "Internal runtime state is corrupt."
};
//#endregion
//#region src/vendor/backlog-engineer/schemas/errors.ts
var ErrorCodeSchema = _enum(ERROR_CODES);
var JsonPrimitiveSchema = union([
	string(),
	number().finite(),
	boolean(),
	_null()
]);
var JsonValueSchema = lazy(() => union([
	JsonPrimitiveSchema,
	JsonArraySchema,
	JsonObjectSchema
]));
var JsonArraySchema = lazy(() => array(JsonValueSchema));
var JsonObjectSchema = lazy(() => record(NonEmptyStringSchema, JsonValueSchema));
var ErrorPayloadSchema = strictObject({ error: strictObject({
	code: ErrorCodeSchema,
	message: NonEmptyStringSchema,
	details: JsonObjectSchema.optional(),
	hint: NonEmptyStringSchema.optional()
}) });
//#endregion
//#region src/vendor/backlog-engineer/schemas/patch.ts
var ReplaceableStringArrayFieldSchema = _enum([
	"gaps",
	"depends_on_keys",
	"claim_keys",
	"contract_keys",
	"data_domain_keys",
	"quality_attribute_keys",
	"policy_decision_keys"
]);
var ReplaceableSourceArrayFieldSchema = _enum([
	"origin_source_ids",
	"specification_source_ids",
	"plan_source_ids",
	"implementation_source_ids",
	"test_source_ids"
]);
var PatchMetadataSchema = strictObject({
	patch_id: PatchIdSchema,
	created_at: IsoUtcTimestampSchema,
	sequence: SequenceSchema,
	target_item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Patch target item keys must be unique.").min(1)
});
var ReplaceFieldsSchema = nonEmptyObjectSchema({
	title: NonEmptyStringSchema,
	type: NonEmptyStringSchema,
	delivery_state: DeliveryStateSchema,
	gaps: uniqueArraySchema(NonEmptyStringSchema, (value) => value, "Gaps must be unique."),
	depends_on_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Dependency item keys must be unique."),
	origin_source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	specification_source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	plan_source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	implementation_source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	test_source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, "Source IDs must be unique."),
	claim_keys: uniqueArraySchema(ClaimKeySchema, (value) => value, "Claim keys must be unique."),
	contract_keys: uniqueArraySchema(ContractKeySchema, (value) => value, "Contract keys must be unique."),
	data_domain_keys: uniqueArraySchema(DataDomainKeySchema, (value) => value, "Data domain keys must be unique."),
	quality_attribute_keys: uniqueArraySchema(QualityAttributeKeySchema, (value) => value, "Quality attribute keys must be unique."),
	policy_decision_keys: uniqueArraySchema(PolicyDecisionKeySchema, (value) => value, "Policy decision keys must be unique.")
});
var PatchFileSchema = strictObject({
	metadata: PatchMetadataSchema,
	operations: array(union([
		strictObject({
			item_key: ItemKeySchema,
			action: literal("replace_fields"),
			fields: ReplaceFieldsSchema
		}),
		union([strictObject({
			item_key: ItemKeySchema,
			action: literal("append_unique"),
			field: ReplaceableStringArrayFieldSchema,
			values: uniqueArraySchema(NonEmptyStringSchema, (value) => value, "Values must be unique.").min(1)
		}), strictObject({
			item_key: ItemKeySchema,
			action: literal("append_unique"),
			field: ReplaceableSourceArrayFieldSchema,
			values: uniqueArraySchema(SourceIdSchema, (value) => value, "Values must be unique.").min(1)
		})]),
		union([strictObject({
			item_key: ItemKeySchema,
			action: literal("remove_values"),
			field: ReplaceableStringArrayFieldSchema,
			values: uniqueArraySchema(NonEmptyStringSchema, (value) => value, "Values must be unique.").min(1)
		}), strictObject({
			item_key: ItemKeySchema,
			action: literal("remove_values"),
			field: ReplaceableSourceArrayFieldSchema,
			values: uniqueArraySchema(SourceIdSchema, (value) => value, "Values must be unique.").min(1)
		})]),
		strictObject({
			item_key: ItemKeySchema,
			action: literal("remove_todo"),
			todo_ids: uniqueArraySchema(TodoIdSchema, (value) => value, "Todo IDs must be unique.").min(1)
		}),
		strictObject({
			item_key: ItemKeySchema,
			action: literal("remove_item")
		}),
		strictObject({
			action: literal("remove_source_references"),
			source_id: SourceIdSchema,
			affected_item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, "Affected item keys must be unique.")
		})
	])).min(1)
}).superRefine((value, ctx) => {
	const targetKeys = new Set(value.metadata.target_item_keys);
	for (const [index, operation] of value.operations.entries()) if ("item_key" in operation && !targetKeys.has(operation.item_key)) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Patch operation item_key must belong to metadata.target_item_keys.",
		path: [
			"operations",
			index,
			"item_key"
		]
	});
});
var PatchItemFileSchema = PatchFileSchema.superRefine((value, ctx) => {
	for (const [index, operation] of value.operations.entries()) if (operation.action === "remove_item" || operation.action === "remove_source_references") ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "patch-item must not contain remove_item or source maintenance operations.",
		path: [
			"operations",
			index,
			"action"
		]
	});
});
var RemoveItemPatchFileSchema = PatchFileSchema.superRefine((value, ctx) => {
	const removedKeys = /* @__PURE__ */ new Set();
	for (const [index, operation] of value.operations.entries()) {
		if (operation.action !== "remove_item") {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: "remove-item patch may contain only remove_item operations.",
				path: [
					"operations",
					index,
					"action"
				]
			});
			continue;
		}
		removedKeys.add(operation.item_key);
	}
	for (const [index, itemKey] of value.metadata.target_item_keys.entries()) if (!removedKeys.has(itemKey)) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "remove-item patch must cover every metadata.target_item_keys entry.",
		path: [
			"metadata",
			"target_item_keys",
			index
		]
	});
});
//#endregion
//#region src/vendor/backlog-engineer/schemas/cli.ts
var CommandCatalogEntrySchema = strictObject({
	name: NonEmptyStringSchema,
	summary: NonEmptyStringSchema
});
var CommandHelpOptionSchema = strictObject({
	flags: array(NonEmptyStringSchema).min(1),
	value_name: NonEmptyStringSchema.optional(),
	description: NonEmptyStringSchema,
	required: boolean().optional(),
	repeatable: boolean().optional()
});
var CommandHelpValidationSchema = strictObject({
	target: NonEmptyStringSchema,
	allowed_values: array(NonEmptyStringSchema).min(1)
});
strictObject({
	cli_name: NonEmptyStringSchema,
	version: NonEmptyStringSchema,
	usage: array(NonEmptyStringSchema).min(1),
	commands: array(CommandCatalogEntrySchema).min(1),
	notes: array(NonEmptyStringSchema)
});
strictObject({
	cli_name: NonEmptyStringSchema,
	version: NonEmptyStringSchema,
	command: NonEmptyStringSchema,
	summary: NonEmptyStringSchema,
	usage: array(NonEmptyStringSchema).min(1),
	options: array(CommandHelpOptionSchema),
	validations: array(CommandHelpValidationSchema),
	notes: array(NonEmptyStringSchema)
});
strictObject({
	cli_name: NonEmptyStringSchema,
	version: NonEmptyStringSchema
});
//#endregion
//#region src/vendor/backlog-engineer/schemas/index.ts
var commandInputSchemas = {
	init: InitCommandInputSchema,
	"register-source": RegisterSourceCommandInputSchema,
	"list-sources": ListSourcesCommandInputSchema,
	"update-source-path": UpdateSourcePathCommandInputSchema,
	"remove-source": RemoveSourceCommandInputSchema,
	template: TemplateCommandInputSchema,
	packet: PacketCommandInputSchema,
	"patch-item": PatchItemCommandInputSchema,
	"remove-item": RemoveItemCommandInputSchema,
	refresh: RefreshCommandInputSchema,
	status: StatusCommandInputSchema,
	report: ReportCommandInputSchema,
	items: ItemsCommandInputSchema,
	search: SearchCommandInputSchema,
	gaps: GapsCommandInputSchema,
	queue: QueueCommandInputSchema,
	attention: AttentionCommandInputSchema,
	"delete-backlog": DeleteBacklogCommandInputSchema
};
var commandOutputSchemas = {
	init: InitCommandOutputSchema,
	"register-source": RegisterSourceCommandOutputSchema,
	"list-sources": ListSourcesCommandOutputSchema,
	"update-source-path": UpdateSourcePathCommandOutputSchema,
	"remove-source": RemoveSourceCommandOutputSchema,
	template: TemplateCommandOutputSchema,
	packet: PacketCommandOutputSchema,
	"patch-item": PatchItemCommandOutputSchema,
	"remove-item": RemoveItemCommandOutputSchema,
	refresh: RefreshCommandOutputSchema,
	status: StatusCommandOutputSchema,
	report: ReportCommandOutputSchema,
	items: ItemsCommandOutputSchema,
	search: SearchCommandOutputSchema,
	gaps: GapsCommandOutputSchema,
	queue: QueueCommandOutputSchema,
	attention: AttentionCommandOutputSchema,
	"delete-backlog": DeleteBacklogCommandOutputSchema
};
function createSchemaModule() {
	return {
		parseRootMarker(raw) {
			return RootMarkerFileSchema.parse(raw);
		},
		parseSourceRegistry(raw) {
			return SourceRegistryFileSchema.parse(raw);
		},
		parseAppliedRegistry(raw) {
			return AppliedRegistryFileSchema.parse(raw);
		},
		parseStateFile(raw) {
			return StateFileSchema.parse(raw);
		},
		parsePacketFile(raw) {
			return PacketFileSchema.parse(raw);
		},
		parsePatchFile(raw) {
			return PatchFileSchema.parse(raw);
		},
		parseCommandInput(name, raw) {
			return commandInputSchemas[name].parse(raw);
		},
		parseCommandOutput(name, raw) {
			return commandOutputSchemas[name].parse(raw);
		},
		parseErrorPayload(raw) {
			return ErrorPayloadSchema.parse(raw);
		}
	};
}
//#endregion
//#region src/vendor/backlog-engineer/errors/backlog-error.ts
function isJsonObjectCandidate(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function sanitizeJsonValue(value, seen) {
	if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "number") return String(value);
	if (typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") return String(value);
	if (value === void 0) return null;
	if (Array.isArray(value)) {
		const result = [];
		for (const entry of value) result.push(sanitizeJsonValue(entry, seen));
		return result;
	}
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
	if (value instanceof Error) return {
		name: value.name,
		message: value.message
	};
	if (isJsonObjectCandidate(value)) {
		if (seen.has(value)) return "[Circular]";
		seen.add(value);
		const result = {};
		for (const [entryKey, entryValue] of Object.entries(value)) result[entryKey] = sanitizeJsonValue(entryValue, seen);
		seen.delete(value);
		return result;
	}
	return "[Unsupported value]";
}
function sanitizeJsonObject(details) {
	if (!details) return;
	if (!isJsonObjectCandidate(details)) return;
	const sanitized = sanitizeJsonValue(details, /* @__PURE__ */ new WeakSet());
	if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) return;
	return sanitized;
}
var BacklogError = class extends Error {
	code;
	exitCode;
	details;
	hint;
	constructor(options) {
		super(options.message ?? ERROR_DEFAULT_MESSAGES[options.code], { cause: options.cause });
		this.name = "BacklogError";
		this.code = options.code;
		this.exitCode = ERROR_EXIT_CODES[options.code];
		const sanitizedDetails = sanitizeJsonObject(options.details);
		if (sanitizedDetails) this.details = sanitizedDetails;
		if (options.hint) this.hint = options.hint;
	}
	toPayload() {
		return { error: {
			code: this.code,
			message: this.message,
			...this.details ? { details: this.details } : {},
			...this.hint ? { hint: this.hint } : {}
		} };
	}
};
function isBacklogError(value) {
	return value instanceof BacklogError;
}
//#endregion
//#region src/vendor/backlog-engineer/errors/factories.ts
function createBacklogError(options) {
	return new BacklogError(options);
}
function createInvalidJsonError(details, cause) {
	return createBacklogError({
		code: "BE_INVALID_JSON",
		hint: "Fix the JSON syntax and retry the command.",
		...details ? { details } : {},
		...cause ? { cause } : {}
	});
}
function createUsageError(details, hint, cause) {
	return createBacklogError({
		code: "BE_USAGE_INVALID",
		...hint ? { hint } : {},
		...details ? { details } : {},
		...cause ? { cause } : {}
	});
}
function createSchemaInvalidError(details, cause) {
	return createBacklogError({
		code: "BE_SCHEMA_INVALID",
		hint: "Fix the input shape so it matches the documented schema.",
		...details ? { details } : {},
		...cause ? { cause } : {}
	});
}
function fromZodError(error, details) {
	return createSchemaInvalidError({
		issues: JSON.parse(JSON.stringify(error.issues)),
		...details ?? {}
	}, error);
}
function normalizeError(error) {
	if (isBacklogError(error)) return error;
	if (error instanceof ZodError) return fromZodError(error);
	return createBacklogError({
		code: "BE_INTERNAL_STATE_CORRUPT",
		...error instanceof Error ? { details: { cause_name: error.name } } : {},
		...error ? { cause: error } : {}
	});
}
//#endregion
//#region src/vendor/backlog-engineer/errors/index.ts
function createErrorModule() {
	return {
		create(code, message, options) {
			return createBacklogError({
				code,
				...message ? { message } : {},
				...options?.details ? { details: options.details } : {},
				...options?.hint ? { hint: options.hint } : {},
				...options?.cause ? { cause: options.cause } : {}
			});
		},
		isBacklogError,
		toPayload(error) {
			return normalizeError(error).toPayload();
		},
		toExitCode(error) {
			return normalizeError(error).exitCode;
		}
	};
}
//#endregion
//#region src/vendor/backlog-engineer/commands/arg-parsers.ts
function helpHint(commandName) {
	return `Run \`dossier-engineer help ${commandName}\` to inspect the command contract.`;
}
function serializeSchemaIssues(error) {
	return JSON.parse(JSON.stringify(error.issues));
}
function parseCommandArgs(commandName, args, config) {
	try {
		return parseArgs({
			args,
			options: config.options,
			allowPositionals: config.allowPositionals ?? false,
			strict: true
		});
	} catch (error) {
		throw createUsageError({
			command: commandName,
			argv: args,
			parser_message: error instanceof Error ? error.message : "Unknown argv parsing failure."
		}, helpHint(commandName), error);
	}
}
function assertNoPositionals(commandName, positionals) {
	if (positionals.length === 0) return;
	throw createUsageError({
		command: commandName,
		unexpected_positionals: positionals
	}, helpHint(commandName));
}
function requireStringOption(commandName, flagName, value) {
	if (typeof value === "string") return value;
	throw createUsageError({
		command: commandName,
		missing_option: flagName
	}, helpHint(commandName));
}
function getStringOption(value) {
	return typeof value === "string" ? value : void 0;
}
function splitCsvFlag(value) {
	if (typeof value !== "string") return;
	return value.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}
function parseBooleanValue(commandName, flagName, value) {
	if (value === void 0) return;
	if (value === "true") return true;
	if (value === "false") return false;
	throw createUsageError({
		command: commandName,
		invalid_boolean_flag: flagName,
		received: value
	}, `Use \`${flagName} true\` or \`${flagName} false\`. ${helpHint(commandName)}`);
}
function parseUsageInput(commandName, schema, candidate) {
	const parsed = schema.safeParse(candidate);
	if (parsed.success) return parsed.data;
	throw createUsageError({
		command: commandName,
		issues: serializeSchemaIssues(parsed.error)
	}, helpHint(commandName), parsed.error);
}
//#endregion
//#region src/vendor/backlog-engineer/commands/help-notes.ts
var BACKLOG_QUERY_SCOPE_NOTE = "This command is backlog-scoped: run it from a backlog root or one of its child directories discovered through `.backlog.json`.";
var BACKLOG_MUTATION_SCOPE_NOTE = "This mutating command is backlog-scoped: run it from a backlog root or one of its child directories discovered through `.backlog.json`.";
var SERIAL_MUTATION_NOTE = "For one backlog root, run mutating commands strictly one at a time.";
var ABSOLUTE_OUTPUT_NOTE = "Machine-facing filesystem paths in command output are absolute.";
//#endregion
//#region src/vendor/backlog-engineer/commands/query-helpers.ts
function assertBacklogRoot(context) {
	const backlogRoot = context.backlogRoot;
	if (!backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND");
	return backlogRoot;
}
async function loadQueryState(context) {
	const { state } = await context.ensureQueryState();
	return state;
}
async function loadQueryStateWithRegistry(context) {
	const backlogRoot = assertBacklogRoot(context);
	const [{ state }, registry] = await Promise.all([context.ensureQueryState(), context.artifacts.readSourceRegistry(backlogRoot)]);
	return {
		state,
		registry
	};
}
var ATTENTION_COMMAND = {
	name: "attention",
	summary: "Return tasks that require review or re-checking.",
	usage: ["backlog-engineer attention"],
	options: [],
	notes: [
		BACKLOG_QUERY_SCOPE_NOTE,
		"`attention` returns review and re-check items, not every blocked task in the backlog.",
		"Entries are ordered by severity first, then by item key."
	],
	inputSchema: AttentionCommandInputSchema,
	outputSchema: AttentionCommandOutputSchema,
	parseArgs(args) {
		assertNoPositionals("attention", parseCommandArgs("attention", args, {}).positionals);
		return parseUsageInput("attention", AttentionCommandInputSchema, {});
	},
	async execute(_input, context) {
		const { state, registry } = await loadQueryStateWithRegistry(context);
		return context.core.attention.buildAttentionList({
			state,
			registry
		});
	}
};
//#endregion
//#region src/vendor/backlog-engineer/runtime/tool-metadata.ts
var TOOL_NAME = "@kostysh/backlog-engineer-cli";
var GAPS_COMMAND = {
	name: "gaps",
	summary: "List explicit blockers and unresolved gaps.",
	usage: ["backlog-engineer gaps", "backlog-engineer gaps --item-key <item_key>"],
	options: [{
		flags: ["--item-key"],
		value_name: "<item_key>",
		description: "Restrict output to a single task key."
	}],
	notes: [
		BACKLOG_QUERY_SCOPE_NOTE,
		"`--item-key` narrows the result to one task.",
		"Empty output means there are no explicit blockers in the selected scope."
	],
	inputSchema: GapsCommandInputSchema,
	outputSchema: GapsCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("gaps", args, { options: { "item-key": { type: "string" } } });
		assertNoPositionals("gaps", parsed.positionals);
		return parseUsageInput("gaps", GapsCommandInputSchema, { ...typeof parsed.values["item-key"] === "string" ? { item_key: parsed.values["item-key"] } : {} });
	},
	async execute(input, context) {
		const state = await loadQueryState(context);
		return context.core.mutation.getGaps({
			state,
			filters: input
		});
	}
};
var ITEMS_COMMAND = {
	name: "items",
	summary: "Show one or more full task cards by item key.",
	usage: ["backlog-engineer items --item-keys <item_key_1>,<item_key_2>"],
	options: [{
		flags: ["--item-keys"],
		value_name: "<item_key_1>,<item_key_2>",
		description: "Comma-separated item keys to load as full task cards.",
		required: true
	}],
	inputSchema: ItemsCommandInputSchema,
	outputSchema: ItemsCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("items", args, { options: { "item-keys": { type: "string" } } });
		assertNoPositionals("items", parsed.positionals);
		return parseUsageInput("items", ItemsCommandInputSchema, { item_keys: splitCsvFlag(requireStringOption("items", "--item-keys", getStringOption(parsed.values["item-keys"]))) });
	},
	async execute(input, context) {
		const { state, registry } = await loadQueryStateWithRegistry(context);
		return context.core.items.getItems({
			state,
			itemKeys: input.item_keys,
			registry
		});
	}
};
//#endregion
//#region src/vendor/backlog-engineer/commands/list-sources.ts
function collectItemSourceIds$8(item) {
	return new Set([
		...item.origin_source_ids,
		...item.specification_source_ids,
		...item.plan_source_ids,
		...item.implementation_source_ids,
		...item.test_source_ids
	]);
}
var LIST_SOURCES_COMMAND = {
	name: "list-sources",
	summary: "List registered sources and source metadata.",
	usage: [
		"backlog-engineer list-sources",
		"backlog-engineer list-sources --item-key <item_key>",
		"backlog-engineer list-sources --path <path>"
	],
	options: [{
		flags: ["--item-key"],
		value_name: "<item_key>",
		description: "Limit the result to sources linked to a single task."
	}, {
		flags: ["--path"],
		value_name: "<path>",
		description: "Filter sources by the provided source path."
	}],
	notes: [
		BACKLOG_QUERY_SCOPE_NOTE,
		"`--path` resolves from the current working directory before it is normalized relative to backlog root for matching.",
		ABSOLUTE_OUTPUT_NOTE
	],
	inputSchema: ListSourcesCommandInputSchema,
	outputSchema: ListSourcesCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("list-sources", args, { options: {
			"item-key": { type: "string" },
			path: { type: "string" }
		} });
		assertNoPositionals("list-sources", parsed.positionals);
		return parseUsageInput("list-sources", ListSourcesCommandInputSchema, {
			...typeof parsed.values["item-key"] === "string" ? { item_key: parsed.values["item-key"] } : {},
			...typeof parsed.values.path === "string" ? { path: parsed.values.path } : {}
		});
	},
	async execute(input, context) {
		if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND");
		const backlogRoot = context.backlogRoot;
		let sources = [...(await context.artifacts.readSourceRegistry(backlogRoot)).sources];
		if (input.item_key) {
			const { state } = await context.ensureQueryState();
			const item = state.items.find((candidate) => candidate.item_key === input.item_key);
			if (!item) throw context.errors.create("BE_ITEM_NOT_FOUND", void 0, { details: { item_key: input.item_key } });
			const itemSourceIds = collectItemSourceIds$8(item);
			sources = sources.filter((source) => itemSourceIds.has(source.source_id));
		}
		if (input.path) {
			const normalizedSource = await context.sources.resolveCliSourcePath({
				backlogRoot,
				inputPath: context.host.resolveCliPath(input.path)
			});
			sources = sources.filter((source) => source.path === normalizedSource.relative_path);
		}
		return context.schemas.parseCommandOutput("list-sources", [...sources.sort((left, right) => {
			const labelCompare = left.source_label.localeCompare(right.source_label);
			if (labelCompare !== 0) return labelCompare;
			return left.source_id.localeCompare(right.source_id);
		}).map((source) => ({
			source_id: source.source_id,
			source_label: source.source_label,
			path: path.resolve(backlogRoot, source.path),
			kind: source.kind,
			authority: source.authority,
			...source.note ? { note: source.note } : {},
			hash: source.hash,
			registered_at: source.registered_at,
			last_checked_at: source.last_checked_at
		}))]);
	}
};
//#endregion
//#region src/vendor/backlog-engineer/commands/mutation-helpers.ts
async function readAuthoredJsonFile(payload) {
	const { absolutePath, canonicalBasename, rawContent } = await payload.context.host.readCliTextFile(payload.inputPath);
	let rawJson;
	try {
		rawJson = JSON.parse(rawContent);
	} catch (error) {
		throw createInvalidJsonError({
			command: payload.commandName,
			path: absolutePath
		}, error);
	}
	try {
		return {
			absolutePath,
			canonicalBasename,
			rawContent,
			value: payload.parse(rawJson)
		};
	} catch (error) {
		if (error instanceof ZodError) throw fromZodError(error, {
			command: payload.commandName,
			path: absolutePath
		});
		throw error;
	}
}
function appendAppliedPacketEntry(payload) {
	const nextApplyIndex = payload.registry.next_apply_index;
	return payload.schemas.parseAppliedRegistry({
		...payload.registry,
		updated_at: payload.appliedAt,
		next_apply_index: nextApplyIndex + 1,
		packets: [...payload.registry.packets, {
			packet_id: payload.packetId,
			apply_index: nextApplyIndex,
			canonical_path: payload.canonicalPath,
			content_hash: payload.contentHash,
			applied_at: payload.appliedAt,
			item_keys: payload.itemKeys
		}]
	});
}
function appendAppliedPatchEntry(payload) {
	const nextApplyIndex = payload.registry.next_apply_index;
	return payload.schemas.parseAppliedRegistry({
		...payload.registry,
		updated_at: payload.appliedAt,
		next_apply_index: nextApplyIndex + 1,
		patches: [...payload.registry.patches, {
			patch_id: payload.patch.metadata.patch_id,
			apply_index: nextApplyIndex,
			canonical_path: payload.canonicalPath,
			content_hash: payload.contentHash,
			sequence: payload.patch.metadata.sequence,
			applied_at: payload.appliedAt,
			kind: payload.kind,
			target_item_keys: payload.patch.metadata.target_item_keys
		}]
	});
}
function assertPatchRegistryConstraints(payload) {
	if (payload.registry.patches.some((entry) => entry.patch_id === payload.patch.metadata.patch_id)) throw payload.context.errors.create("BE_PATCH_ID_CONFLICT", void 0, { details: { patch_id: payload.patch.metadata.patch_id } });
	const maxSequence = payload.registry.patches.reduce((maxValue, entry) => {
		return Math.max(maxValue, entry.sequence);
	}, 0);
	if (payload.patch.metadata.sequence <= maxSequence) throw payload.context.errors.create("BE_PATCH_SEQUENCE_CONFLICT", void 0, { details: {
		patch_id: payload.patch.metadata.patch_id,
		sequence: payload.patch.metadata.sequence,
		max_existing_sequence: maxSequence
	} });
}
async function assertCanonicalReplayMatchesState(payload) {
	const rebuiltState = await payload.context.ensureMutationState();
	if (JSON.stringify(rebuiltState) === JSON.stringify(payload.state)) return;
	throw payload.context.errors.create("BE_REBUILD_REPLAY_FAILED", "Backlog mutation produced state that does not match canonical artifact replay.", {
		details: {
			command: payload.commandName,
			artifact_kind: payload.artifactKind,
			canonical_path: payload.canonicalPath,
			reason: "post_mutation_replay_mismatch"
		},
		hint: "The command did not return success because canonical artifacts are not replay-equivalent to the produced state."
	});
}
var PACKET_COMMAND = {
	name: "packet",
	summary: "Apply a packet that adds new backlog tasks.",
	usage: ["backlog-engineer packet --path <path> [--dry-run]"],
	options: [{
		flags: ["--path"],
		value_name: "<path>",
		description: "Path to the authored packet file.",
		required: true
	}, {
		flags: ["--dry-run"],
		description: "Validate and simulate packet application without writing to disk."
	}],
	notes: [
		BACKLOG_MUTATION_SCOPE_NOTE,
		"`--path` resolves from the current working directory.",
		"`--dry-run` validates and simulates packet apply without writing canonical imports or backlog state.",
		"On real apply, output distinguishes the authored draft from the immutable canonical import copy.",
		SERIAL_MUTATION_NOTE,
		ABSOLUTE_OUTPUT_NOTE
	],
	inputSchema: PacketCommandInputSchema,
	outputSchema: PacketCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("packet", args, { options: {
			path: { type: "string" },
			"dry-run": { type: "boolean" }
		} });
		assertNoPositionals("packet", parsed.positionals);
		return parseUsageInput("packet", PacketCommandInputSchema, {
			path: requireStringOption("packet", "--path", getStringOption(parsed.values.path)),
			dry_run: parsed.values["dry-run"] === true
		});
	},
	async execute(input, context) {
		if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND", void 0, { details: { command: "packet" } });
		const [state, sourceRegistry, appliedRegistry, packetInput] = await Promise.all([
			context.ensureMutationState(),
			context.artifacts.readSourceRegistry(context.backlogRoot),
			context.artifacts.readAppliedRegistry(context.backlogRoot),
			readAuthoredJsonFile({
				context,
				commandName: "packet",
				inputPath: input.path,
				parse: (raw) => context.schemas.parsePacketFile(raw)
			})
		]);
		const packetId = context.host.createUuid();
		const { state: nextState, ...summaryOutput } = await context.core.mutation.applyPacket({
			state,
			packet: packetInput.value,
			sourceRegistry,
			packetId,
			dryRun: input.dry_run
		});
		const outputBase = {
			...summaryOutput,
			authored_packet_path: packetInput.absolutePath
		};
		if (input.dry_run) return outputBase;
		const appliedAt = context.host.nowIsoUtc();
		const canonicalImport = await context.artifacts.importPacketFile({
			root: context.backlogRoot,
			packetId,
			sourcePath: packetInput.absolutePath,
			canonicalBasename: packetInput.canonicalBasename,
			rawContent: packetInput.rawContent
		});
		const nextAppliedRegistry = appendAppliedPacketEntry({
			schemas: context.schemas,
			registry: appliedRegistry,
			packetId,
			canonicalPath: canonicalImport.canonicalPath,
			contentHash: canonicalImport.sha256,
			appliedAt,
			itemKeys: packetInput.value.items.map((item) => item.item_key)
		});
		await context.artifacts.writeAppliedRegistry(context.backlogRoot, nextAppliedRegistry);
		await context.artifacts.writeState(context.backlogRoot, nextState);
		await assertCanonicalReplayMatchesState({
			artifactKind: "packet",
			canonicalPath: canonicalImport.canonicalPath,
			commandName: "packet",
			context,
			state: nextState
		});
		const output = {
			...outputBase,
			canonical_packet_path: path.resolve(context.backlogRoot, canonicalImport.canonicalPath),
			canonical_packet_purpose: "immutable_import_copy"
		};
		await context.hooks.afterPacketApplied?.({
			summary: output,
			state: nextState,
			backlogRoot: context.backlogRoot
		});
		return output;
	}
};
var PATCH_ITEM_COMMAND = {
	name: "patch-item",
	summary: "Apply a patch that updates existing tasks.",
	usage: ["backlog-engineer patch-item --patch <path> [--dry-run]"],
	options: [{
		flags: ["--patch"],
		value_name: "<path>",
		description: "Path to the authored patch-item file.",
		required: true
	}, {
		flags: ["--dry-run"],
		description: "Validate and simulate patch application without writing to disk."
	}],
	inputSchema: PatchItemCommandInputSchema,
	outputSchema: PatchItemCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("patch-item", args, { options: {
			patch: { type: "string" },
			"dry-run": { type: "boolean" }
		} });
		assertNoPositionals("patch-item", parsed.positionals);
		return parseUsageInput("patch-item", PatchItemCommandInputSchema, {
			patch: requireStringOption("patch-item", "--patch", getStringOption(parsed.values.patch)),
			dry_run: parsed.values["dry-run"] === true
		});
	},
	async execute(input, context) {
		if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND", void 0, { details: { command: "patch-item" } });
		const [state, sourceRegistry, appliedRegistry, patchInput] = await Promise.all([
			context.ensureMutationState(),
			context.artifacts.readSourceRegistry(context.backlogRoot),
			context.artifacts.readAppliedRegistry(context.backlogRoot),
			readAuthoredJsonFile({
				context,
				commandName: "patch-item",
				inputPath: input.patch,
				parse: (raw) => PatchItemFileSchema.parse(raw)
			})
		]);
		assertPatchRegistryConstraints({
			context,
			registry: appliedRegistry,
			patch: patchInput.value
		});
		const summary = await context.core.mutation.applyPatch({
			state,
			patch: patchInput.value,
			sourceRegistry,
			dryRun: input.dry_run
		});
		if (!("updated" in summary)) throw context.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, {
			details: {
				command: "patch-item",
				patch_id: patchInput.value.metadata.patch_id
			},
			hint: "patch-item must receive a patch summary with updated item keys."
		});
		const { state: nextState, ...summaryOutput } = summary;
		const outputBase = {
			...summaryOutput,
			authored_patch_path: patchInput.absolutePath
		};
		if (input.dry_run) return outputBase;
		const appliedAt = context.host.nowIsoUtc();
		const canonicalImport = await context.artifacts.importPatchFile({
			root: context.backlogRoot,
			patchId: patchInput.value.metadata.patch_id,
			sourcePath: patchInput.absolutePath,
			canonicalBasename: patchInput.canonicalBasename,
			rawContent: patchInput.rawContent
		});
		const nextAppliedRegistry = appendAppliedPatchEntry({
			schemas: context.schemas,
			registry: appliedRegistry,
			patch: patchInput.value,
			kind: "patch-item",
			canonicalPath: canonicalImport.canonicalPath,
			contentHash: canonicalImport.sha256,
			appliedAt
		});
		await context.artifacts.writeAppliedRegistry(context.backlogRoot, nextAppliedRegistry);
		await context.artifacts.writeState(context.backlogRoot, nextState);
		await assertCanonicalReplayMatchesState({
			artifactKind: "patch",
			canonicalPath: canonicalImport.canonicalPath,
			commandName: "patch-item",
			context,
			state: nextState
		});
		const output = {
			...outputBase,
			canonical_patch_path: path.resolve(context.backlogRoot, canonicalImport.canonicalPath),
			canonical_patch_purpose: "immutable_replay_artifact"
		};
		await context.hooks.afterPatchApplied?.({
			summary: output,
			state: nextState,
			backlogRoot: context.backlogRoot
		});
		return output;
	}
};
var QUEUE_COMMAND = {
	name: "queue",
	summary: "Return ordered chains of tasks that can be taken next.",
	usage: ["backlog-engineer queue"],
	options: [],
	notes: [
		BACKLOG_QUERY_SCOPE_NOTE,
		"`queue` returns ordered ready chains, not a flat list of every ready item.",
		"If `queue` is empty, inspect `gaps` and `attention` before assuming backlog creation failed."
	],
	inputSchema: QueueCommandInputSchema,
	outputSchema: QueueCommandOutputSchema,
	parseArgs(args) {
		assertNoPositionals("queue", parseCommandArgs("queue", args, {}).positionals);
		return parseUsageInput("queue", QueueCommandInputSchema, {});
	},
	async execute(_input, context) {
		const state = await loadQueryState(context);
		return context.core.queue.buildQueueChains({ state });
	}
};
//#endregion
//#region src/vendor/backlog-engineer/commands/refresh-helpers.ts
function collectItemSourceIds$7(item) {
	return new Set([
		...item.origin_source_ids,
		...item.specification_source_ids,
		...item.plan_source_ids,
		...item.implementation_source_ids,
		...item.test_source_ids
	]);
}
function collectSourceIdsForItemKeys(payload) {
	const itemKeySet = new Set(payload.itemKeys);
	const sourceIds = /* @__PURE__ */ new Set();
	for (const item of payload.state.items) {
		if (!itemKeySet.has(item.item_key)) continue;
		for (const sourceId of collectItemSourceIds$7(item)) sourceIds.add(sourceId);
	}
	return [...sourceIds].sort((left, right) => left.localeCompare(right));
}
function resolveRefreshSourceIds(payload) {
	const { input, context, state, registry, backlogRoot } = payload;
	if (input.kind === "all") return {
		selectedSourceIds: [...registry.sources].map((source) => source.source_id).sort((left, right) => left.localeCompare(right)),
		mutationScope: input
	};
	if (input.kind === "item") {
		if (!state.items.find((item) => item.item_key === input.item_key)) throw context.errors.create("BE_ITEM_NOT_FOUND", void 0, { details: { item_key: input.item_key } });
		return {
			selectedSourceIds: collectSourceIdsForItemKeys({
				state,
				itemKeys: context.core.graph.resolveItemSubgraph({
					state,
					rootItemKeys: [input.item_key]
				})
			}),
			mutationScope: input
		};
	}
	const scope = context.sources.resolveSourceScope({
		backlogRoot,
		state,
		registry,
		selector: input.kind === "source_path" ? {
			kind: "source_path",
			source_path: context.host.resolveCliPath(input.source_path)
		} : input
	});
	const [selectedSourceId] = scope.sourceIds;
	if (!selectedSourceId) throw context.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: input.kind === "source_label" ? { source_label: input.source_label } : input.kind === "source_path" ? { source_path: input.source_path } : {} });
	return {
		selectedSourceIds: [...new Set([...scope.sourceIds, ...collectSourceIdsForItemKeys({
			state,
			itemKeys: scope.subgraphItemKeys
		})])].sort((left, right) => left.localeCompare(right)),
		mutationScope: {
			kind: "source_id",
			source_id: selectedSourceId
		}
	};
}
async function executeRefreshFlow(payload) {
	const { input, context } = payload;
	const backlogRoot = context.backlogRoot;
	if (!backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND");
	const [state, registry] = await Promise.all([context.ensureMutationState(), context.artifacts.readSourceRegistry(backlogRoot)]);
	const { selectedSourceIds, mutationScope } = resolveRefreshSourceIds({
		input,
		context,
		state,
		registry,
		backlogRoot
	});
	const refreshedSources = await context.sources.refreshSourceHashes({
		backlogRoot,
		registry,
		selectedSourceIds
	});
	const { state: nextState, registry: nextRegistry, ...summary } = await context.core.mutation.refresh({
		state,
		sourceRegistry: refreshedSources.registry,
		changedSourceIds: refreshedSources.changedSourceIds,
		scope: mutationScope
	});
	await context.artifacts.writeState(backlogRoot, nextState);
	try {
		await context.artifacts.writeSourceRegistry(backlogRoot, nextRegistry);
	} catch (error) {
		try {
			await context.artifacts.writeState(backlogRoot, state);
		} catch (rollbackError) {
			throw context.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, {
				details: {
					command: "refresh",
					phase: "write_source_registry",
					rollback: "write_state"
				},
				hint: "Refresh failed after persisting state and state rollback also failed.",
				cause: rollbackError
			});
		}
		throw error;
	}
	await context.hooks.afterRefresh?.({
		summary,
		state: nextState,
		backlogRoot
	});
	return {
		summary,
		state: nextState,
		registry: nextRegistry
	};
}
function buildStatusSummary(payload) {
	const { context, state } = payload;
	const counts = {
		defined_count: 0,
		specified_count: 0,
		planned_count: 0,
		implemented_count: 0,
		gaps_count: 0,
		needs_attention_count: 0,
		ready_for_next_step_count: 0,
		open_todo_count: state.todos.length,
		artifact_integrity: {
			applied_canonical_paths_exist: true,
			missing_canonical_paths: []
		}
	};
	for (const item of state.items) {
		if (item.delivery_state === "defined") counts.defined_count += 1;
		if (item.delivery_state === "specified") counts.specified_count += 1;
		if (item.delivery_state === "planned") counts.planned_count += 1;
		if (item.delivery_state === "implemented") counts.implemented_count += 1;
		if (item.gaps.length > 0) counts.gaps_count += 1;
		if (item.needs_attention) counts.needs_attention_count += 1;
		if (item.ready_for_next_step) counts.ready_for_next_step_count += 1;
	}
	return context.schemas.parseCommandOutput("status", {
		total_items: state.items.length,
		last_refresh_at: state.last_refresh_at,
		...counts
	});
}
//#endregion
//#region src/vendor/backlog-engineer/sources/path-normalizer.ts
function toPosixRelativePath(relativePath) {
	return relativePath.replaceAll("\\", "/");
}
function createSourceLabel(relativePath) {
	return relativePath;
}
function normalizeSourcePath(payload) {
	const absolutePath = payload.path.resolve(payload.inputPath);
	const relativePath = toPosixRelativePath(payload.path.relative(payload.backlogRoot, absolutePath));
	const parsedRelativePath = SourceRelativePosixPathSchema.safeParse(relativePath);
	if (!parsedRelativePath.success) throw fromZodError(parsedRelativePath.error, {
		path: absolutePath,
		relative_path: relativePath
	});
	return {
		absolute_path: absolutePath,
		relative_path: parsedRelativePath.data,
		source_label: createSourceLabel(parsedRelativePath.data)
	};
}
function sortSourceLabels(values) {
	return [...values].sort((left, right) => {
		const labelCompare = left.source_label.localeCompare(right.source_label);
		if (labelCompare !== 0) return labelCompare;
		return (left.source_id ?? "").localeCompare(right.source_id ?? "");
	});
}
//#endregion
//#region src/vendor/backlog-engineer/runtime/path-safety.ts
function isWindowsDriveRootEscape(relativePath) {
	return /^[A-Za-z]:\\/.test(relativePath);
}
function isUncRootEscape(relativePath) {
	return relativePath.startsWith("\\\\");
}
function resolvePathRelativeToRoot(payload) {
	const resolvedRoot = payload.path.resolve(payload.root);
	const resolvedTarget = payload.path.resolve(payload.target);
	const platformRelativePath = payload.path.relative(resolvedRoot, resolvedTarget);
	if (platformRelativePath.length === 0) return {
		platformRelativePath,
		posixRelativePath: ""
	};
	if (isWindowsDriveRootEscape(platformRelativePath) || isUncRootEscape(platformRelativePath)) return null;
	const posixRelativePath = platformRelativePath.replaceAll("\\", "/");
	if (posixRelativePath === ".." || posixRelativePath.startsWith("../")) return null;
	return {
		platformRelativePath,
		posixRelativePath
	};
}
function isPathInsideRoot(payload) {
	return resolvePathRelativeToRoot(payload) !== null;
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/store-helpers.ts
function createJsonIssueDetails(error) {
	return { issues: error.issues.map((issue) => ({
		path: issue.path.join("."),
		message: issue.message,
		code: issue.code
	})) };
}
function isMissingFileError$1(error) {
	return error instanceof Error && "code" in error && error.code === "ENOENT";
}
function isUnsupportedPlatformError(error) {
	return error instanceof Error && "code" in error && error.code === "ENOTSUP";
}
function createTempSiblingPath$1(path, targetPath, seedHash) {
	return path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.tmp-${seedHash.slice(0, 12)}`);
}
function createTempSiblingBasename(path, targetPath, seedHash) {
	return `.${path.basename(targetPath)}.tmp-${seedHash.slice(0, 12)}`;
}
function listPathChain(path, target) {
	const normalizedTarget = path.resolve(target);
	const chain = [normalizedTarget];
	let cursor = path.dirname(normalizedTarget);
	while (cursor !== chain[chain.length - 1]) {
		chain.push(cursor);
		cursor = path.dirname(cursor);
	}
	return chain.reverse();
}
async function ensureDirectoryChainIsSafe(payload) {
	const { fs, path, errors, root, leafDirectory, errorCode, detailPath } = payload;
	const normalizedRoot = path.resolve(root);
	const normalizedLeaf = path.resolve(leafDirectory);
	if (!isPathInsideRoot({
		path,
		root: normalizedRoot,
		target: normalizedLeaf
	})) throw errors.create(errorCode, void 0, { details: { path: detailPath } });
	for (const candidate of listPathChain(path, normalizedLeaf)) {
		if (!await fs.exists(candidate)) continue;
		const entry = await fs.lstat(candidate);
		if (entry.isSymbolicLink || !entry.isDirectory) throw errors.create(errorCode, void 0, { details: { path: detailPath } });
	}
}
async function ensureManagedDirectoryPathSafe(payload) {
	const { fs, path, errors, root, directoryPath, errorCode } = payload;
	const targetDirectory = path.resolve(directoryPath);
	await ensureDirectoryChainIsSafe({
		fs,
		path,
		errors,
		root,
		leafDirectory: targetDirectory,
		errorCode,
		detailPath: targetDirectory
	});
	if (!await fs.exists(targetDirectory)) return;
	const entry = await fs.lstat(targetDirectory);
	if (entry.isSymbolicLink || !entry.isDirectory) throw errors.create(errorCode, void 0, { details: { path: targetDirectory } });
}
async function ensureManagedFilePathSafe(payload) {
	const { fs, path, errors, root, filePath, errorCode } = payload;
	const targetFile = path.resolve(filePath);
	await ensureDirectoryChainIsSafe({
		fs,
		path,
		errors,
		root,
		leafDirectory: path.dirname(targetFile),
		errorCode,
		detailPath: targetFile
	});
	if (!await fs.exists(targetFile)) return;
	const entry = await fs.lstat(targetFile);
	if (entry.isSymbolicLink || entry.isDirectory) throw errors.create(errorCode, void 0, { details: { path: targetFile } });
}
async function openManagedParentDirectory(payload) {
	const { fs, path, errors, root, filePath, errorCode } = payload;
	const targetFile = path.resolve(filePath);
	await ensureManagedFilePathSafe({
		fs,
		path,
		errors,
		root,
		filePath: targetFile,
		errorCode
	});
	try {
		return await fs.openDirectory(path.dirname(targetFile));
	} catch (error) {
		if (isUnsupportedPlatformError(error)) throw errors.create("BE_PLATFORM_UNSUPPORTED", void 0, {
			details: { path: targetFile },
			cause: error
		});
		throw error;
	}
}
async function openManagedDirectory(payload) {
	const { fs, path, errors, root, directoryPath, errorCode } = payload;
	const targetDirectory = path.resolve(directoryPath);
	await ensureManagedDirectoryPathSafe({
		fs,
		path,
		errors,
		root,
		directoryPath: targetDirectory,
		errorCode
	});
	try {
		return await fs.openDirectory(targetDirectory);
	} catch (error) {
		if (isUnsupportedPlatformError(error)) throw errors.create("BE_PLATFORM_UNSUPPORTED", void 0, {
			details: { path: targetDirectory },
			cause: error
		});
		throw error;
	}
}
async function ensureNoSymlinkAncestors(payload) {
	const { fs, path, errors, targetPath, errorCode } = payload;
	const normalizedTarget = path.resolve(targetPath);
	for (const candidate of listPathChain(path, normalizedTarget)) {
		if (!await fs.exists(candidate)) continue;
		if ((await fs.lstat(candidate)).isSymbolicLink) throw errors.create(errorCode, void 0, { details: { path: normalizedTarget } });
	}
}
async function readJsonArtifact(payload) {
	const { fs, path, errors, filePath, parse, root, readErrorCode = "BE_INTERNAL_STATE_CORRUPT", missingCode = "BE_INTERNAL_STATE_CORRUPT", corruptCode = "BE_INTERNAL_STATE_CORRUPT" } = payload;
	let rawText;
	if (root && path) {
		let parentDirectory;
		try {
			parentDirectory = await openManagedParentDirectory({
				fs,
				path,
				errors,
				root,
				filePath,
				errorCode: readErrorCode
			});
			rawText = await fs.readTextNoFollow(parentDirectory.resolveEntry(path.basename(filePath)));
		} catch (error) {
			await parentDirectory?.close().catch(() => void 0);
			if (errors.isBacklogError(error)) throw error;
			if (isMissingFileError$1(error)) throw errors.create(missingCode, void 0, {
				details: { path: filePath },
				cause: error
			});
			throw errors.create(corruptCode, void 0, {
				details: { path: filePath },
				cause: error
			});
		}
		await parentDirectory.close();
	} else try {
		rawText = await fs.readText(filePath);
	} catch (error) {
		if (isMissingFileError$1(error)) throw errors.create(missingCode, void 0, {
			details: { path: filePath },
			cause: error
		});
		throw errors.create(corruptCode, void 0, {
			details: { path: filePath },
			cause: error
		});
	}
	let rawJson;
	try {
		rawJson = JSON.parse(rawText);
	} catch (error) {
		throw errors.create(corruptCode, void 0, {
			details: { path: filePath },
			cause: error
		});
	}
	try {
		return parse(rawJson);
	} catch (error) {
		if (error instanceof ZodError) throw errors.create(corruptCode, void 0, {
			details: {
				path: filePath,
				...createJsonIssueDetails(error)
			},
			cause: error
		});
		throw errors.create(corruptCode, void 0, {
			details: { path: filePath },
			cause: error
		});
	}
}
async function writeTextAtomically(payload) {
	const { fs, path, hash, errors, root, targetPath, content, writeErrorCode } = payload;
	const seedHash = await hash.sha256Text(`${targetPath}\n${content}`);
	const tempBasename = createTempSiblingBasename(path, targetPath, seedHash);
	let parentDirectory;
	try {
		if (root) {
			await ensureManagedDirectoryPathSafe({
				fs,
				path,
				errors,
				root,
				directoryPath: path.dirname(targetPath),
				errorCode: writeErrorCode
			});
			await fs.mkdir(path.dirname(targetPath), { recursive: true });
			parentDirectory = await openManagedParentDirectory({
				fs,
				path,
				errors,
				root,
				filePath: targetPath,
				errorCode: writeErrorCode
			});
			const stableTargetPath = parentDirectory.resolveEntry(path.basename(targetPath));
			const tempPath = parentDirectory.resolveEntry(tempBasename);
			await fs.rm(tempPath, { force: true });
			await fs.writeTextExclusive(tempPath, content);
			await fs.rename(tempPath, stableTargetPath);
		} else {
			const tempPath = createTempSiblingPath$1(path, targetPath, seedHash);
			await fs.mkdir(path.dirname(targetPath), { recursive: true });
			await fs.rm(tempPath, { force: true });
			await fs.writeTextExclusive(tempPath, content);
			await fs.rename(tempPath, targetPath);
		}
	} catch (error) {
		const cleanupPath = parentDirectory === void 0 ? createTempSiblingPath$1(path, targetPath, seedHash) : parentDirectory.resolveEntry(tempBasename);
		try {
			await fs.rm(cleanupPath, { force: true });
		} catch {}
		if (errors.isBacklogError(error)) throw error;
		throw errors.create(writeErrorCode, void 0, {
			details: { path: targetPath },
			cause: error
		});
	} finally {
		await parentDirectory?.close();
	}
}
async function writeJsonArtifact(payload) {
	const { fs, path, hash, errors, root, filePath, value, validate, writeErrorCode } = payload;
	let validatedValue;
	try {
		validatedValue = validate(value);
	} catch (error) {
		if (error instanceof ZodError) throw errors.create("BE_SCHEMA_INVALID", void 0, {
			details: {
				path: filePath,
				...createJsonIssueDetails(error)
			},
			cause: error
		});
		throw errors.create(writeErrorCode, void 0, {
			details: { path: filePath },
			cause: error
		});
	}
	await writeTextAtomically({
		fs,
		path,
		hash,
		errors,
		root,
		targetPath: filePath,
		content: `${JSON.stringify(validatedValue, null, 2)}\n`,
		writeErrorCode
	});
}
//#endregion
//#region src/vendor/backlog-engineer/sources/source-hash-service.ts
var MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024;
function isErrnoException$2(error) {
	return error instanceof Error && "code" in error;
}
function isMissingFileError(error) {
	return isErrnoException$2(error) && error.code === "ENOENT";
}
async function hashSourceFile(payload) {
	try {
		await ensureNoSymlinkAncestors({
			fs: payload.fs,
			path: payload.path,
			errors: payload.errors,
			targetPath: payload.filePath,
			errorCode: "BE_SOURCE_READ_FAILED"
		});
	} catch (error) {
		if (isMissingFileError(error)) throw payload.errors.create("BE_SOURCE_FILE_MISSING", void 0, {
			details: { path: payload.filePath },
			cause: error
		});
		throw error;
	}
	let entry;
	try {
		entry = await payload.fs.lstat(payload.filePath);
	} catch (error) {
		if (isMissingFileError(error)) throw payload.errors.create("BE_SOURCE_FILE_MISSING", void 0, {
			details: { path: payload.filePath },
			cause: error
		});
		throw payload.errors.create("BE_SOURCE_READ_FAILED", void 0, {
			details: {
				path: payload.filePath,
				reason: "lstat_failed"
			},
			cause: error
		});
	}
	if (entry.isSymbolicLink) throw payload.errors.create("BE_SOURCE_READ_FAILED", void 0, { details: {
		path: payload.filePath,
		reason: "symbolic_link"
	} });
	if (!entry.isFile) throw payload.errors.create("BE_SOURCE_READ_FAILED", void 0, { details: {
		path: payload.filePath,
		reason: "not_regular_file"
	} });
	if (entry.size > MAX_SOURCE_FILE_BYTES) throw payload.errors.create("BE_SOURCE_READ_FAILED", void 0, { details: {
		path: payload.filePath,
		reason: "file_too_large",
		max_bytes: MAX_SOURCE_FILE_BYTES,
		actual_bytes: entry.size
	} });
	let content;
	try {
		content = await payload.fs.readText(payload.filePath);
	} catch (error) {
		if (isMissingFileError(error)) throw payload.errors.create("BE_SOURCE_FILE_MISSING", void 0, {
			details: { path: payload.filePath },
			cause: error
		});
		throw payload.errors.create("BE_SOURCE_READ_FAILED", void 0, {
			details: {
				path: payload.filePath,
				reason: "read_failed"
			},
			cause: error
		});
	}
	try {
		return await payload.hash.sha256Text(content);
	} catch (error) {
		throw payload.errors.create("BE_SOURCE_READ_FAILED", void 0, {
			details: {
				path: payload.filePath,
				reason: "hash_failed"
			},
			cause: error
		});
	}
}
//#endregion
//#region src/vendor/backlog-engineer/sources/source-registry-service.ts
var SOURCE_KIND_VALUES = [
	"architecture",
	"module",
	"adr",
	"technical-decision",
	"integration",
	"operations",
	"planning",
	"specification"
];
var SOURCE_AUTHORITY_VALUES = [
	"authoritative",
	"supporting",
	"derived"
];
var SOURCE_KIND_SET = new Set(SOURCE_KIND_VALUES);
var SOURCE_AUTHORITY_SET = new Set(SOURCE_AUTHORITY_VALUES);
function validateSourceKind(kind, errors) {
	if (SOURCE_KIND_SET.has(kind)) return;
	throw errors.create("BE_SOURCE_KIND_INVALID", void 0, { details: {
		kind,
		allowed_values: [...SOURCE_KIND_VALUES]
	} });
}
function validateSourceAuthority(authority, errors) {
	if (SOURCE_AUTHORITY_SET.has(authority)) return;
	throw errors.create("BE_SOURCE_AUTHORITY_INVALID", void 0, { details: {
		authority,
		allowed_values: [...SOURCE_AUTHORITY_VALUES]
	} });
}
function buildSourceRecord(payload) {
	validateSourceKind(payload.kind, payload.errors);
	validateSourceAuthority(payload.authority, payload.errors);
	const [record] = payload.schemas.parseSourceRegistry({
		schema_version: 1,
		created_at: payload.registeredAt,
		updated_at: payload.registeredAt,
		sources: [{
			source_id: payload.sourceId,
			source_label: payload.relativePath,
			path: payload.relativePath,
			kind: payload.kind,
			authority: payload.authority,
			...payload.note ? { note: payload.note } : {},
			hash: payload.sourceHash,
			registered_at: payload.registeredAt,
			last_checked_at: payload.lastCheckedAt
		}]
	}).sources;
	if (!record) throw payload.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, { details: { reason: "source_registry_parse_returned_empty_sources" } });
	return record;
}
function registerSourceRecord(payload) {
	const existingSource = payload.registry.sources.find((source) => source.path === payload.source.path);
	if (existingSource) return {
		registry: payload.registry,
		source: existingSource,
		created: false
	};
	return {
		registry: payload.schemas.parseSourceRegistry({
			...payload.registry,
			updated_at: payload.source.registered_at,
			sources: sortSourceLabels([...payload.registry.sources, payload.source])
		}),
		source: payload.source,
		created: true
	};
}
function createSourceSummary(source) {
	return {
		source_id: source.source_id,
		source_label: source.source_label
	};
}
function resolveSourceAbsolutePath(payload) {
	return payload.path.resolve(payload.backlogRoot, payload.sourcePath);
}
//#endregion
//#region src/vendor/backlog-engineer/sources/source-scope-service.ts
function collectItemSourceIds$6(item) {
	return new Set([
		...item.origin_source_ids,
		...item.specification_source_ids,
		...item.plan_source_ids,
		...item.implementation_source_ids,
		...item.test_source_ids
	]);
}
function sortStringKeys(values) {
	return [...values].sort((left, right) => left.localeCompare(right));
}
function resolveSourceBySelector(payload) {
	const { selector } = payload;
	if (selector.kind === "source_id") {
		const source = payload.registry.sources.find((record) => record.source_id === selector.source_id);
		if (!source) throw payload.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: { source_id: selector.source_id } });
		return [source];
	}
	if (selector.kind === "source_label") {
		const source = payload.registry.sources.find((record) => record.source_label === selector.source_label);
		if (!source) throw payload.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: { source_label: selector.source_label } });
		return [source];
	}
	const normalized = normalizeSourcePath({
		path: payload.path,
		backlogRoot: payload.backlogRoot,
		inputPath: selector.source_path
	});
	const source = payload.registry.sources.find((record) => record.path === normalized.relative_path);
	if (!source) throw payload.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: { path: normalized.relative_path } });
	return [source];
}
function collectTopLevelItemKeys(payload) {
	const itemsByKey = new Map(payload.state.items.map((item) => [item.item_key, item]));
	const topLevelItemKeys = /* @__PURE__ */ new Set();
	for (const linkedItemKey of payload.linkedItemKeys) {
		const stack = [linkedItemKey];
		const seen = /* @__PURE__ */ new Set();
		while (stack.length > 0) {
			const itemKey = stack.pop();
			if (!itemKey) break;
			if (seen.has(itemKey)) continue;
			seen.add(itemKey);
			const item = itemsByKey.get(itemKey);
			if (!item || item.depends_on_keys.length === 0) {
				topLevelItemKeys.add(itemKey);
				continue;
			}
			for (const dependencyKey of item.depends_on_keys) stack.push(dependencyKey);
		}
	}
	return topLevelItemKeys;
}
function collectSubgraphItemKeys(payload) {
	const itemsByKey = new Map(payload.state.items.map((item) => [item.item_key, item]));
	const subgraphItemKeys = /* @__PURE__ */ new Set();
	const stack = [...payload.topLevelItemKeys];
	while (stack.length > 0) {
		const itemKey = stack.pop();
		if (!itemKey) break;
		if (subgraphItemKeys.has(itemKey)) continue;
		subgraphItemKeys.add(itemKey);
		const item = itemsByKey.get(itemKey);
		if (!item) continue;
		for (const reverseDependencyKey of item.reverse_dependency_keys) stack.push(reverseDependencyKey);
	}
	return subgraphItemKeys;
}
async function refreshSourceHashes(payload) {
	const selectedIds = new Set(payload.selectedSourceIds);
	const refreshedAt = payload.clock.nowIsoUtc();
	const changedSourceIds = [];
	const changedSources = [];
	const nextSources = await Promise.all(payload.registry.sources.map(async (source) => {
		if (!selectedIds.has(source.source_id)) return source;
		const nextHash = await hashSourceFile({
			fs: payload.fs,
			path: payload.path,
			hash: payload.hash,
			errors: payload.errors,
			filePath: resolveSourceAbsolutePath({
				path: payload.path,
				backlogRoot: payload.backlogRoot,
				sourcePath: source.path
			})
		});
		const nextSource = {
			...source,
			hash: nextHash,
			last_checked_at: refreshedAt
		};
		if (nextHash !== source.hash) {
			changedSourceIds.push(source.source_id);
			changedSources.push(createSourceSummary(source));
		}
		return nextSource;
	}));
	return {
		registry: selectedIds.size === 0 ? payload.registry : payload.schemas.parseSourceRegistry({
			...payload.registry,
			updated_at: refreshedAt,
			sources: sortSourceLabels(nextSources)
		}),
		changedSourceIds: sortStringKeys(changedSourceIds),
		changedSources: sortSourceLabels(changedSources)
	};
}
function resolveSourceScope(payload) {
	const selectedSources = resolveSourceBySelector(payload);
	const selectedSourceIds = new Set(selectedSources.map((source) => source.source_id));
	const linkedItemKeys = /* @__PURE__ */ new Set();
	for (const item of payload.state.items) {
		const sourceIds = collectItemSourceIds$6(item);
		if ([...selectedSourceIds].some((sourceId) => sourceIds.has(sourceId))) linkedItemKeys.add(item.item_key);
	}
	const topLevelItemKeys = collectTopLevelItemKeys({
		state: payload.state,
		linkedItemKeys
	});
	const subgraphItemKeys = collectSubgraphItemKeys({
		state: payload.state,
		topLevelItemKeys
	});
	return {
		sourceIds: sortStringKeys(selectedSourceIds),
		topLevelItemKeys: sortStringKeys(topLevelItemKeys),
		subgraphItemKeys: sortStringKeys(subgraphItemKeys)
	};
}
//#endregion
//#region src/vendor/backlog-engineer/sources/index.ts
function createSourcesModule(dependencies) {
	return {
		resolveCliSourcePath(payload) {
			return Promise.resolve(normalizeSourcePath({
				path: dependencies.path,
				backlogRoot: payload.backlogRoot,
				inputPath: payload.inputPath
			}));
		},
		buildSourceRecord(payload) {
			return buildSourceRecord({
				schemas: dependencies.schemas,
				errors: dependencies.errors,
				sourceId: payload.sourceId,
				relativePath: payload.relativePath,
				kind: payload.kind,
				authority: payload.authority,
				registeredAt: payload.registeredAt,
				lastCheckedAt: payload.lastCheckedAt,
				sourceHash: payload.sourceHash,
				...payload.note ? { note: payload.note } : {}
			});
		},
		hashSourceFile(path) {
			return hashSourceFile({
				fs: dependencies.fs,
				path: dependencies.path,
				hash: dependencies.hash,
				errors: dependencies.errors,
				filePath: path
			});
		},
		registerSource(payload) {
			return registerSourceRecord({
				schemas: dependencies.schemas,
				registry: payload.registry,
				source: payload.source
			});
		},
		refreshSourceHashes(payload) {
			return refreshSourceHashes({
				fs: dependencies.fs,
				path: dependencies.path,
				hash: dependencies.hash,
				clock: dependencies.clock,
				schemas: dependencies.schemas,
				errors: dependencies.errors,
				backlogRoot: payload.backlogRoot,
				registry: payload.registry,
				selectedSourceIds: payload.selectedSourceIds
			});
		},
		resolveSourceScope(payload) {
			return resolveSourceScope({
				path: dependencies.path,
				errors: dependencies.errors,
				backlogRoot: payload.backlogRoot,
				state: payload.state,
				registry: payload.registry,
				selector: payload.selector
			});
		}
	};
}
var REGISTER_SOURCE_COMMAND = {
	name: "register-source",
	summary: "Register a source document and obtain a source ID.",
	usage: ["backlog-engineer register-source --path <path> --kind <kind> --authority <authority> [--note <note>]"],
	options: [
		{
			flags: ["--path"],
			value_name: "<path>",
			description: "Path to the source document to register.",
			required: true
		},
		{
			flags: ["--kind"],
			value_name: "<kind>",
			description: "Source kind defined by the skill contract.",
			required: true
		},
		{
			flags: ["--authority"],
			value_name: "<authority>",
			description: "Source authority defined by the skill contract.",
			required: true
		},
		{
			flags: ["--note"],
			value_name: "<note>",
			description: "Readable operator note attached to the source registration."
		}
	],
	validations: [{
		target: "--kind",
		allowed_values: [...SOURCE_KIND_VALUES]
	}, {
		target: "--authority",
		allowed_values: [...SOURCE_AUTHORITY_VALUES]
	}],
	notes: [
		BACKLOG_MUTATION_SCOPE_NOTE,
		"`--path` resolves from the current working directory, then the registered path is normalized relative to backlog root and may contain `..` for external sources.",
		SERIAL_MUTATION_NOTE,
		ABSOLUTE_OUTPUT_NOTE
	],
	inputSchema: RegisterSourceCommandInputSchema,
	outputSchema: RegisterSourceCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("register-source", args, { options: {
			path: { type: "string" },
			kind: { type: "string" },
			authority: { type: "string" },
			note: { type: "string" }
		} });
		assertNoPositionals("register-source", parsed.positionals);
		return parseUsageInput("register-source", RegisterSourceCommandInputSchema, {
			path: requireStringOption("register-source", "--path", getStringOption(parsed.values.path)),
			kind: requireStringOption("register-source", "--kind", getStringOption(parsed.values.kind)),
			authority: requireStringOption("register-source", "--authority", getStringOption(parsed.values.authority)),
			...getStringOption(parsed.values.note) ? { note: getStringOption(parsed.values.note) } : {}
		});
	},
	async execute(input, context) {
		if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND");
		const backlogRoot = context.backlogRoot;
		validateSourceKind(input.kind, context.errors);
		validateSourceAuthority(input.authority, context.errors);
		const normalizedSource = await context.sources.resolveCliSourcePath({
			backlogRoot,
			inputPath: context.host.resolveCliPath(input.path)
		});
		const existingRegistry = await context.artifacts.readSourceRegistry(backlogRoot);
		const existingSource = existingRegistry.sources.find((source) => source.path === normalizedSource.relative_path);
		if (existingSource) return context.schemas.parseCommandOutput("register-source", {
			source_id: existingSource.source_id,
			source_label: existingSource.source_label,
			path: path.resolve(backlogRoot, existingSource.path),
			kind: existingSource.kind,
			authority: existingSource.authority,
			...existingSource.note ? { note: existingSource.note } : {},
			hash: existingSource.hash
		});
		const now = context.host.nowIsoUtc();
		const sourceHash = await context.sources.hashSourceFile(normalizedSource.absolute_path);
		const source = context.sources.buildSourceRecord({
			sourceId: context.host.createUuid(),
			relativePath: normalizedSource.relative_path,
			kind: input.kind,
			authority: input.authority,
			...input.note ? { note: input.note } : {},
			registeredAt: now,
			lastCheckedAt: now,
			sourceHash
		});
		const { registry, created } = context.sources.registerSource({
			registry: existingRegistry,
			source
		});
		if (created) {
			await context.artifacts.writeSourceRegistry(context.backlogRoot, registry);
			await context.hooks.afterSourceRegistered?.({
				source,
				backlogRoot
			});
		}
		return context.schemas.parseCommandOutput("register-source", {
			source_id: source.source_id,
			source_label: source.source_label,
			path: path.resolve(backlogRoot, source.path),
			kind: source.kind,
			authority: source.authority,
			...source.note ? { note: source.note } : {},
			hash: source.hash
		});
	}
};
var REMOVE_ITEM_COMMAND = {
	name: "remove-item",
	summary: "Apply a patch that removes obsolete tasks.",
	usage: ["backlog-engineer remove-item --patch <path> [--dry-run]"],
	options: [{
		flags: ["--patch"],
		value_name: "<path>",
		description: "Path to the authored remove-item patch file.",
		required: true
	}, {
		flags: ["--dry-run"],
		description: "Validate and simulate item removal without writing to disk."
	}],
	inputSchema: RemoveItemCommandInputSchema,
	outputSchema: RemoveItemCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("remove-item", args, { options: {
			patch: { type: "string" },
			"dry-run": { type: "boolean" }
		} });
		assertNoPositionals("remove-item", parsed.positionals);
		return parseUsageInput("remove-item", RemoveItemCommandInputSchema, {
			patch: requireStringOption("remove-item", "--patch", getStringOption(parsed.values.patch)),
			dry_run: parsed.values["dry-run"] === true
		});
	},
	async execute(input, context) {
		if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND", void 0, { details: { command: "remove-item" } });
		const [state, sourceRegistry, appliedRegistry, patchInput] = await Promise.all([
			context.ensureMutationState(),
			context.artifacts.readSourceRegistry(context.backlogRoot),
			context.artifacts.readAppliedRegistry(context.backlogRoot),
			readAuthoredJsonFile({
				context,
				commandName: "remove-item",
				inputPath: input.patch,
				parse: (raw) => RemoveItemPatchFileSchema.parse(raw)
			})
		]);
		assertPatchRegistryConstraints({
			context,
			registry: appliedRegistry,
			patch: patchInput.value
		});
		const summary = await context.core.mutation.applyPatch({
			state,
			patch: patchInput.value,
			sourceRegistry,
			dryRun: input.dry_run
		});
		if (!("removed" in summary)) throw context.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, {
			details: {
				command: "remove-item",
				patch_id: patchInput.value.metadata.patch_id
			},
			hint: "remove-item must receive a patch summary with removed item keys."
		});
		const { state: nextState, ...summaryOutput } = summary;
		const outputBase = {
			...summaryOutput,
			authored_patch_path: patchInput.absolutePath
		};
		if (input.dry_run) return outputBase;
		const appliedAt = context.host.nowIsoUtc();
		const canonicalImport = await context.artifacts.importPatchFile({
			root: context.backlogRoot,
			patchId: patchInput.value.metadata.patch_id,
			sourcePath: patchInput.absolutePath,
			canonicalBasename: patchInput.canonicalBasename,
			rawContent: patchInput.rawContent
		});
		const nextAppliedRegistry = appendAppliedPatchEntry({
			schemas: context.schemas,
			registry: appliedRegistry,
			patch: patchInput.value,
			kind: "remove-item",
			canonicalPath: canonicalImport.canonicalPath,
			contentHash: canonicalImport.sha256,
			appliedAt
		});
		await context.artifacts.writeAppliedRegistry(context.backlogRoot, nextAppliedRegistry);
		await context.artifacts.writeState(context.backlogRoot, nextState);
		await assertCanonicalReplayMatchesState({
			artifactKind: "patch",
			canonicalPath: canonicalImport.canonicalPath,
			commandName: "remove-item",
			context,
			state: nextState
		});
		const output = {
			...outputBase,
			canonical_patch_path: path.resolve(context.backlogRoot, canonicalImport.canonicalPath),
			canonical_patch_purpose: "immutable_replay_artifact"
		};
		await context.hooks.afterPatchApplied?.({
			summary: output,
			state: nextState,
			backlogRoot: context.backlogRoot
		});
		return output;
	}
};
//#endregion
//#region src/vendor/backlog-engineer/commands/source-selector.ts
function buildSourceSelectorFromFlags(payload) {
	const selectors = [
		payload.sourceId ? "source_id" : null,
		payload.sourceLabel ? "source_label" : null,
		payload.sourcePath ? "source_path" : null
	].filter((value) => value !== null);
	if (selectors.length !== 1) throw createUsageError({
		command: payload.commandName,
		selectors
	}, `Use exactly one source selector: --source-id, --source-label, or --source-path. Run \`dossier-engineer help ${payload.commandName}\` to inspect the command contract.`);
	if (payload.sourceId) return {
		kind: "source_id",
		source_id: payload.sourceId
	};
	if (payload.sourceLabel) return {
		kind: "source_label",
		source_label: payload.sourceLabel
	};
	return {
		kind: "source_path",
		source_path: payload.sourcePath ?? ""
	};
}
async function resolveSourceRecord(payload) {
	const { context, registry, selector } = payload;
	if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND");
	if (selector.kind === "source_id") {
		const source = registry.sources.find((candidate) => candidate.source_id === selector.source_id);
		if (!source) throw context.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: { source_id: selector.source_id } });
		return source;
	}
	if (selector.kind === "source_label") {
		const source = registry.sources.find((candidate) => candidate.source_label === selector.source_label);
		if (!source) throw context.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: { source_label: selector.source_label } });
		return source;
	}
	const normalized = await context.sources.resolveCliSourcePath({
		backlogRoot: context.backlogRoot,
		inputPath: context.host.resolveCliPath(selector.source_path)
	});
	const source = registry.sources.find((candidate) => candidate.path === normalized.relative_path);
	if (!source) throw context.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: {
		source_path: selector.source_path,
		normalized_path: normalized.relative_path
	} });
	return source;
}
//#endregion
//#region src/vendor/backlog-engineer/commands/source-maintenance-helpers.ts
function sortKeys$1(values) {
	return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
function toSourceOutput(payload) {
	return {
		source_id: payload.source.source_id,
		source_label: payload.source.source_label,
		path: path.resolve(payload.backlogRoot, payload.source.path),
		kind: payload.source.kind,
		authority: payload.source.authority,
		...payload.source.note ? { note: payload.source.note } : {},
		hash: payload.source.hash
	};
}
function sortSourceSummaries$1(values) {
	const deduped = /* @__PURE__ */ new Map();
	for (const value of values) deduped.set(value.source_id, value);
	return [...deduped.values()].sort((left, right) => {
		const labelCompare = left.source_label.localeCompare(right.source_label);
		if (labelCompare !== 0) return labelCompare;
		return left.source_id.localeCompare(right.source_id);
	});
}
function createSourceChangeMessage$1(relatedSources) {
	const labels = sortSourceSummaries$1(relatedSources).map((source) => source.source_label);
	if (labels.length === 0) return "Review the linked source change.";
	return `Review source change: ${labels.join(", ")}.`;
}
function createSourceRemovalMessage$1(relatedSources) {
	const labels = sortSourceSummaries$1(relatedSources).map((source) => source.source_label);
	if (labels.length === 0) return "Source was removed. Review whether this task needs replacement source coverage.";
	return `Source was removed: ${labels.join(", ")}. Review whether this task needs replacement source coverage.`;
}
function syncUtilityOwnedSourceMessage(payload) {
	if (payload.todo.type !== "review_source_change") return payload.todo.message;
	const previousChangeMessage = createSourceChangeMessage$1(payload.previousRelatedSources);
	const currentChangeMessage = createSourceChangeMessage$1(payload.currentRelatedSources);
	if (payload.todo.message === previousChangeMessage || payload.todo.message === currentChangeMessage) return createSourceChangeMessage$1(payload.nextRelatedSources);
	const previousRemovalMessage = createSourceRemovalMessage$1(payload.previousRelatedSources);
	const currentRemovalMessage = createSourceRemovalMessage$1(payload.currentRelatedSources);
	if (payload.todo.message === previousRemovalMessage || payload.todo.message === currentRemovalMessage) return createSourceRemovalMessage$1(payload.nextRelatedSources);
	return payload.todo.message;
}
function relatedSourcesChanged(payload) {
	if (payload.before.length !== payload.after.length) return true;
	return payload.before.some((source, index) => {
		const afterSource = payload.after[index];
		return afterSource === void 0 || source.source_id !== afterSource.source_id || source.source_label !== afterSource.source_label;
	});
}
function syncTodoSourceLabels(payload) {
	const labelsById = new Map(payload.registry.sources.map((source) => [source.source_id, source.source_label]));
	const previousLabelsById = new Map((payload.previousRegistry?.sources ?? []).map((source) => [source.source_id, source.source_label]));
	const todoUpdated = /* @__PURE__ */ new Set();
	const todos = payload.state.todos.map((todo) => {
		const previousRelatedSources = todo.related_sources.map((source) => ({
			...source,
			source_label: previousLabelsById.get(source.source_id) ?? source.source_label
		}));
		const currentRelatedSources = todo.related_sources;
		const relatedSources = todo.related_sources.map((source) => {
			const nextLabel = labelsById.get(source.source_id) ?? source.source_label;
			return {
				...source,
				source_label: nextLabel
			};
		});
		const message = syncUtilityOwnedSourceMessage({
			todo,
			previousRelatedSources,
			currentRelatedSources,
			nextRelatedSources: relatedSources
		});
		if (message !== todo.message || relatedSourcesChanged({
			before: todo.related_sources,
			after: relatedSources
		})) todoUpdated.add(todo.item_key);
		return {
			...todo,
			message,
			related_sources: relatedSources
		};
	});
	return {
		state: payload.schemas.parseStateFile({
			...payload.state,
			todos
		}),
		todoUpdated: sortKeys$1(todoUpdated)
	};
}
//#endregion
//#region src/vendor/backlog-engineer/commands/remove-source.ts
var OPTIONS$5 = [
	{
		flags: ["--source-id"],
		value_name: "<source_id>",
		description: "Registered source ID to remove."
	},
	{
		flags: ["--source-label"],
		value_name: "<source_label>",
		description: "Registered source label to remove."
	},
	{
		flags: ["--source-path"],
		value_name: "<path>",
		description: "Registered source path to remove."
	},
	{
		flags: ["--dry-run"],
		description: "Validate and simulate source removal without writing to disk."
	}
];
function collectItemSourceIds$5(item) {
	return new Set([
		...item.origin_source_ids,
		...item.specification_source_ids,
		...item.plan_source_ids,
		...item.implementation_source_ids,
		...item.test_source_ids
	]);
}
function collectSourceRemovalScope(payload) {
	const rootItemKeys = /* @__PURE__ */ new Set();
	const directItemKeys = /* @__PURE__ */ new Set();
	const referencingContextKeys = /* @__PURE__ */ new Set();
	for (const item of payload.state.items) {
		if (!collectItemSourceIds$5(item).has(payload.sourceId)) continue;
		rootItemKeys.add(item.item_key);
		directItemKeys.add(item.item_key);
	}
	const itemsByClaimKey = /* @__PURE__ */ new Map();
	const itemsByQualityAttributeKey = /* @__PURE__ */ new Map();
	const itemsByPolicyDecisionKey = /* @__PURE__ */ new Map();
	for (const item of payload.state.items) {
		for (const claimKey of item.claim_keys) itemsByClaimKey.set(claimKey, [...itemsByClaimKey.get(claimKey) ?? [], item.item_key]);
		for (const qualityAttributeKey of item.quality_attribute_keys) itemsByQualityAttributeKey.set(qualityAttributeKey, [...itemsByQualityAttributeKey.get(qualityAttributeKey) ?? [], item.item_key]);
		for (const policyDecisionKey of item.policy_decision_keys) itemsByPolicyDecisionKey.set(policyDecisionKey, [...itemsByPolicyDecisionKey.get(policyDecisionKey) ?? [], item.item_key]);
	}
	for (const claim of payload.state.context.claims) {
		if (!claim.source_ids.includes(payload.sourceId)) continue;
		referencingContextKeys.add(`claim:${claim.claim_key}`);
		for (const itemKey of itemsByClaimKey.get(claim.claim_key) ?? []) rootItemKeys.add(itemKey);
	}
	for (const qualityAttribute of payload.state.context.quality_attributes) {
		if (!qualityAttribute.source_ids.includes(payload.sourceId)) continue;
		referencingContextKeys.add(`quality_attribute:${qualityAttribute.quality_attribute_key}`);
		for (const itemKey of qualityAttribute.applies_to_item_keys) rootItemKeys.add(itemKey);
		for (const itemKey of itemsByQualityAttributeKey.get(qualityAttribute.quality_attribute_key) ?? []) rootItemKeys.add(itemKey);
	}
	for (const policyDecision of payload.state.context.policy_decisions) {
		if (!policyDecision.source_ids.includes(payload.sourceId)) continue;
		referencingContextKeys.add(`policy_decision:${policyDecision.policy_decision_key}`);
		for (const itemKey of policyDecision.related_item_keys) rootItemKeys.add(itemKey);
		for (const itemKey of itemsByPolicyDecisionKey.get(policyDecision.policy_decision_key) ?? []) rootItemKeys.add(itemKey);
	}
	return {
		rootItemKeys: sortKeys$1(rootItemKeys),
		directItemKeys: sortKeys$1(directItemKeys),
		referencingContextKeys: sortKeys$1(referencingContextKeys)
	};
}
function removeSourceFromRegistry(payload) {
	return {
		...payload.registry,
		updated_at: payload.updatedAt,
		sources: payload.registry.sources.filter((candidate) => candidate.source_id !== payload.source.source_id)
	};
}
function createMaintenancePatch(payload) {
	return payload.context.schemas.parsePatchFile({
		metadata: {
			patch_id: `source-maintenance-${payload.context.host.createUuid()}`,
			created_at: payload.context.host.nowIsoUtc(),
			sequence: payload.sequence,
			target_item_keys: payload.affectedItemKeys
		},
		operations: [{
			action: "remove_source_references",
			source_id: payload.sourceId,
			affected_item_keys: payload.affectedItemKeys
		}]
	});
}
var REMOVE_SOURCE_COMMAND = {
	name: "remove-source",
	summary: "Remove a source after durable cleanup of backlog references.",
	usage: [
		"backlog-engineer remove-source --source-id <source_id> [--dry-run]",
		"backlog-engineer remove-source --source-label <source_label> [--dry-run]",
		"backlog-engineer remove-source --source-path <path> [--dry-run]"
	],
	options: OPTIONS$5,
	notes: [
		BACKLOG_MUTATION_SCOPE_NOTE,
		"The command removes source references from durable backlog truth before deleting the source registry record.",
		"Affected items receive mutation-managed review todo that explicitly says the source was removed.",
		SERIAL_MUTATION_NOTE,
		ABSOLUTE_OUTPUT_NOTE
	],
	inputSchema: RemoveSourceCommandInputSchema,
	outputSchema: RemoveSourceCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("remove-source", args, { options: {
			"source-id": { type: "string" },
			"source-label": { type: "string" },
			"source-path": { type: "string" },
			"dry-run": { type: "boolean" }
		} });
		assertNoPositionals("remove-source", parsed.positionals);
		return parseUsageInput("remove-source", RemoveSourceCommandInputSchema, {
			selector: buildSourceSelectorFromFlags({
				commandName: "remove-source",
				sourceId: getStringOption(parsed.values["source-id"]),
				sourceLabel: getStringOption(parsed.values["source-label"]),
				sourcePath: getStringOption(parsed.values["source-path"])
			}),
			dry_run: parsed.values["dry-run"] === true
		});
	},
	async execute(input, context) {
		if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND");
		const backlogRoot = context.backlogRoot;
		const [state, registry, appliedRegistry] = await Promise.all([
			context.ensureMutationState(),
			context.artifacts.readSourceRegistry(backlogRoot),
			context.artifacts.readAppliedRegistry(backlogRoot)
		]);
		const source = await resolveSourceRecord({
			context,
			registry,
			selector: input.selector
		});
		const sourceOutput = toSourceOutput({
			backlogRoot,
			source
		});
		const removalScope = collectSourceRemovalScope({
			state,
			sourceId: source.source_id
		});
		if (removalScope.rootItemKeys.length === 0 && removalScope.referencingContextKeys.length > 0) throw context.errors.create("BE_SOURCE_REMOVE_UNSUPPORTED", void 0, {
			details: {
				source_id: source.source_id,
				source_label: source.source_label,
				path: source.path,
				referencing_item_keys: removalScope.directItemKeys,
				referencing_context_keys: removalScope.referencingContextKeys
			},
			hint: "The source is referenced only by context entities with no affected item scope, so this utility version cannot attach a review-visible cleanup mutation."
		});
		const affectedItemKeys = removalScope.rootItemKeys.length === 0 ? [] : context.core.graph.resolveItemSubgraph({
			state,
			rootItemKeys: removalScope.rootItemKeys
		});
		const sequence = Math.max(0, ...appliedRegistry.patches.map((entry) => entry.sequence)) + 1;
		const maintenancePatch = affectedItemKeys.length === 0 ? void 0 : createMaintenancePatch({
			context,
			sourceId: source.source_id,
			affectedItemKeys,
			sequence
		});
		let nextState = state;
		let summary = {
			counts: {
				updated: 0,
				todo_created: 0,
				todo_updated: 0,
				todo_removed: 0
			},
			updated_item_keys: [],
			todo_created: [],
			todo_updated: [],
			todo_removed: [],
			next_commands: []
		};
		if (maintenancePatch) {
			assertPatchRegistryConstraints({
				context,
				registry: appliedRegistry,
				patch: maintenancePatch
			});
			const maintenanceSummary = await context.core.mutation.removeSourceReferences({
				state,
				patch: maintenancePatch,
				sourceRegistry: registry,
				sourceId: source.source_id,
				affectedItemKeys,
				updatedItemKeys: removalScope.directItemKeys
			});
			nextState = maintenanceSummary.state;
			summary = {
				counts: maintenanceSummary.counts,
				updated_item_keys: maintenanceSummary.updated_item_keys,
				todo_created: maintenanceSummary.todo_created,
				todo_updated: maintenanceSummary.todo_updated,
				todo_removed: maintenanceSummary.todo_removed,
				next_commands: maintenanceSummary.next_commands
			};
		}
		const outputBase = {
			dry_run: input.dry_run,
			...sourceOutput,
			removed: true,
			...summary
		};
		const output = context.schemas.parseCommandOutput("remove-source", outputBase);
		if (input.dry_run) return output;
		const nextRegistry = context.schemas.parseSourceRegistry({
			...removeSourceFromRegistry({
				registry,
				source,
				updatedAt: context.host.nowIsoUtc()
			}),
			schema_version: 1
		});
		if (maintenancePatch) {
			const rawContent = `${JSON.stringify(maintenancePatch, null, 2)}\n`;
			let canonicalPath;
			try {
				const canonicalImport = await context.artifacts.importPatchFile({
					root: backlogRoot,
					patchId: maintenancePatch.metadata.patch_id,
					sourcePath: backlogRoot,
					canonicalBasename: `${maintenancePatch.metadata.patch_id}.json`,
					rawContent
				});
				canonicalPath = canonicalImport.canonicalPath;
				const nextAppliedRegistry = appendAppliedPatchEntry({
					schemas: context.schemas,
					registry: appliedRegistry,
					patch: maintenancePatch,
					kind: "source-maintenance",
					canonicalPath,
					contentHash: canonicalImport.sha256,
					appliedAt: context.host.nowIsoUtc()
				});
				await context.artifacts.writeAppliedRegistry(backlogRoot, nextAppliedRegistry);
				await context.artifacts.writeState(backlogRoot, nextState);
				await context.artifacts.writeSourceRegistry(backlogRoot, nextRegistry);
				await assertCanonicalReplayMatchesState({
					artifactKind: "patch",
					canonicalPath,
					commandName: "remove-source",
					context,
					state: nextState
				});
				return context.schemas.parseCommandOutput("remove-source", {
					...outputBase,
					canonical_patch_path: path.resolve(backlogRoot, canonicalPath),
					canonical_patch_purpose: "immutable_replay_artifact"
				});
			} catch (error) {
				const rollbackErrors = [];
				try {
					await context.artifacts.writeSourceRegistry(backlogRoot, registry);
				} catch (rollbackError) {
					rollbackErrors.push(rollbackError);
				}
				try {
					await context.artifacts.writeState(backlogRoot, state);
				} catch (rollbackError) {
					rollbackErrors.push(rollbackError);
				}
				try {
					await context.artifacts.writeAppliedRegistry(backlogRoot, appliedRegistry);
				} catch (rollbackError) {
					rollbackErrors.push(rollbackError);
				}
				if (canonicalPath) try {
					await context.artifacts.removeCanonicalPatchFile({
						root: backlogRoot,
						canonicalPath
					});
				} catch (rollbackError) {
					rollbackErrors.push(rollbackError);
				}
				if (rollbackErrors.length > 0) throw context.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, {
					details: {
						command: "remove-source",
						phase: "source_maintenance_write",
						rollback: "failed",
						rollback_error_count: rollbackErrors.length
					},
					hint: "Source removal failed after partial writes and rollback also failed; inspect backlog artifacts before retrying.",
					cause: error
				});
				throw error;
			}
		}
		await context.artifacts.writeSourceRegistry(backlogRoot, nextRegistry);
		return output;
	}
};
var REPORT_COMMAND = {
	name: "report",
	summary: "Generate a human-readable backlog report on disk.",
	usage: ["backlog-engineer report"],
	options: [],
	notes: [
		BACKLOG_MUTATION_SCOPE_NOTE,
		"Report files are always written into the standard reports directory inside the backlog root.",
		SERIAL_MUTATION_NOTE,
		ABSOLUTE_OUTPUT_NOTE
	],
	inputSchema: ReportCommandInputSchema,
	outputSchema: ReportCommandOutputSchema,
	parseArgs(args) {
		assertNoPositionals("report", parseCommandArgs("report", args, {}).positionals);
		return parseUsageInput("report", ReportCommandInputSchema, {});
	},
	async execute(_input, context) {
		const backlogRoot = assertBacklogRoot(context);
		const { state, registry } = await loadQueryStateWithRegistry(context);
		const model = await context.reports.buildReportModel({
			state,
			registry
		});
		const baseSections = context.reports.buildSections(model);
		const sections = await context.hooks.decorateReportSections?.({ sections: baseSections }) ?? baseSections;
		const markdown = context.reports.renderMarkdown(sections);
		const mermaid = context.reports.renderMermaid(model);
		const { reportPath } = await context.artifacts.writeReportFiles({
			root: backlogRoot,
			markdown,
			mermaid
		});
		return context.schemas.parseCommandOutput("report", {
			report_path: path.resolve(backlogRoot, reportPath),
			generated_at: context.host.nowIsoUtc(),
			item_count: model.metrics.totalItems
		});
	}
};
var SEARCH_COMMAND = {
	name: "search",
	summary: "Search tasks when keys are not yet known.",
	usage: ["backlog-engineer search [--source-ids <source_id_1>,<source_id_2>] [--delivery-state <state>] [--needs-attention true|false] [--ready-for-next-step true|false] [--claim-keys <claim_key_1>,<claim_key_2>] [--contract-keys <contract_key_1>,<contract_key_2>] [--data-domain-keys <data_domain_key_1>,<data_domain_key_2>] [--quality-attribute-keys <quality_attribute_key_1>,<quality_attribute_key_2>] [--policy-decision-keys <policy_decision_key_1>,<policy_decision_key_2>]"],
	options: [
		{
			flags: ["--source-ids"],
			value_name: "<source_id_1>,<source_id_2>",
			description: "Filter by one or more registered source IDs."
		},
		{
			flags: ["--delivery-state"],
			value_name: "<state>",
			description: "Filter by delivery state."
		},
		{
			flags: ["--needs-attention"],
			value_name: "true|false",
			description: "Filter by computed needs_attention state."
		},
		{
			flags: ["--ready-for-next-step"],
			value_name: "true|false",
			description: "Filter by computed ready_for_next_step state."
		},
		{
			flags: ["--claim-keys"],
			value_name: "<claim_key_1>,<claim_key_2>",
			description: "Filter by claim links."
		},
		{
			flags: ["--contract-keys"],
			value_name: "<contract_key_1>,<contract_key_2>",
			description: "Filter by contract links."
		},
		{
			flags: ["--data-domain-keys"],
			value_name: "<data_domain_key_1>,<data_domain_key_2>",
			description: "Filter by data domain links."
		},
		{
			flags: ["--quality-attribute-keys"],
			value_name: "<quality_attribute_key_1>,<quality_attribute_key_2>",
			description: "Filter by quality attribute links."
		},
		{
			flags: ["--policy-decision-keys"],
			value_name: "<policy_decision_key_1>,<policy_decision_key_2>",
			description: "Filter by policy decision links."
		}
	],
	inputSchema: SearchCommandInputSchema,
	outputSchema: SearchCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("search", args, { options: {
			"source-ids": { type: "string" },
			"delivery-state": { type: "string" },
			"needs-attention": { type: "string" },
			"ready-for-next-step": { type: "string" },
			"claim-keys": { type: "string" },
			"contract-keys": { type: "string" },
			"data-domain-keys": { type: "string" },
			"quality-attribute-keys": { type: "string" },
			"policy-decision-keys": { type: "string" }
		} });
		assertNoPositionals("search", parsed.positionals);
		return parseUsageInput("search", SearchCommandInputSchema, {
			...getStringOption(parsed.values["source-ids"]) ? { source_ids: splitCsvFlag(getStringOption(parsed.values["source-ids"])) } : {},
			...getStringOption(parsed.values["delivery-state"]) ? { delivery_state: getStringOption(parsed.values["delivery-state"]) } : {},
			...getStringOption(parsed.values["needs-attention"]) ? { needs_attention: parseBooleanValue("search", "--needs-attention", getStringOption(parsed.values["needs-attention"])) } : {},
			...getStringOption(parsed.values["ready-for-next-step"]) ? { ready_for_next_step: parseBooleanValue("search", "--ready-for-next-step", getStringOption(parsed.values["ready-for-next-step"])) } : {},
			...getStringOption(parsed.values["claim-keys"]) ? { claim_keys: splitCsvFlag(getStringOption(parsed.values["claim-keys"])) } : {},
			...getStringOption(parsed.values["contract-keys"]) ? { contract_keys: splitCsvFlag(getStringOption(parsed.values["contract-keys"])) } : {},
			...getStringOption(parsed.values["data-domain-keys"]) ? { data_domain_keys: splitCsvFlag(getStringOption(parsed.values["data-domain-keys"])) } : {},
			...getStringOption(parsed.values["quality-attribute-keys"]) ? { quality_attribute_keys: splitCsvFlag(getStringOption(parsed.values["quality-attribute-keys"])) } : {},
			...getStringOption(parsed.values["policy-decision-keys"]) ? { policy_decision_keys: splitCsvFlag(getStringOption(parsed.values["policy-decision-keys"])) } : {}
		});
	},
	async execute(input, context) {
		const { state, registry } = await loadQueryStateWithRegistry(context);
		return context.core.search.search({
			state,
			filters: input,
			registry
		});
	}
};
var STATUS_COMMAND = {
	name: "status",
	summary: "Show short backlog status summary.",
	usage: ["backlog-engineer status [--refresh]"],
	options: [{
		flags: ["--refresh"],
		description: "Run refresh before returning the status summary."
	}],
	notes: [
		BACKLOG_QUERY_SCOPE_NOTE,
		"`status` returns a short summary of the current backlog state.",
		"`status --refresh` first runs refresh, so treat it as a mutating composite command.",
		SERIAL_MUTATION_NOTE
	],
	inputSchema: StatusCommandInputSchema,
	outputSchema: StatusCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("status", args, { options: { refresh: { type: "boolean" } } });
		assertNoPositionals("status", parsed.positionals);
		return parseUsageInput("status", StatusCommandInputSchema, { refresh: parsed.values.refresh === true });
	},
	async execute(input, context) {
		if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND");
		if (input.refresh) return buildStatusSummary({
			context,
			state: (await executeRefreshFlow({
				input: { kind: "all" },
				context
			})).state
		});
		const { state } = await context.ensureQueryState();
		return buildStatusSummary({
			context,
			state
		});
	}
};
//#endregion
//#region src/vendor/backlog-engineer/commands/template.ts
var OPTIONS$1 = [{
	flags: ["--out"],
	value_name: "<path>",
	description: "Output path for the generated template file.",
	required: true
}, {
	flags: ["--item-keys"],
	value_name: "<item_key_1>,<item_key_2>",
	description: "Required for patch templates; comma-separated target item keys."
}];
function formatPatchSequence(sequence) {
	return String(sequence).padStart(3, "0");
}
function createPatchTemplateId(createdAt, sequence, suffix) {
	return `${createdAt.slice(0, 10)}-${formatPatchSequence(sequence)}-patch-template-${suffix}`;
}
function createDraftSuffix(uuid) {
	return uuid.replaceAll("-", "").slice(0, 8).toLowerCase();
}
var TEMPLATE_COMMAND = {
	name: "template",
	summary: "Generate packet or patch templates.",
	usage: ["backlog-engineer template packet --out <path>", "backlog-engineer template patch --item-keys <item_key_1>,<item_key_2> --out <path>"],
	options: OPTIONS$1,
	notes: [
		"`template packet` writes a richer starter draft with placeholders and does not require an existing backlog root.",
		"Before running `packet`, replace placeholders and remove starter entries that do not apply.",
		"`template patch` is backlog-scoped: run it from a backlog root or one of its child directories discovered through `.backlog.json`.",
		"`--out` resolves from the current working directory.",
		ABSOLUTE_OUTPUT_NOTE
	],
	inputSchema: TemplateCommandInputSchema,
	outputSchema: TemplateCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("template", args, {
			allowPositionals: true,
			options: {
				out: { type: "string" },
				"item-keys": { type: "string" }
			}
		});
		if (parsed.positionals.length !== 1) throw createUsageError({
			command: "template",
			expected_positionals: ["packet|patch"],
			received_positionals: parsed.positionals
		}, "Run `backlog-engineer help template` to inspect the command contract.");
		const [mode] = parsed.positionals;
		if (mode === "packet") return parseUsageInput("template", TemplateCommandInputSchema, {
			mode,
			out: requireStringOption("template", "--out", getStringOption(parsed.values.out))
		});
		if (mode === "patch") return parseUsageInput("template", TemplateCommandInputSchema, {
			mode,
			out: requireStringOption("template", "--out", getStringOption(parsed.values.out)),
			item_keys: splitCsvFlag(getStringOption(parsed.values["item-keys"]))
		});
		throw createUsageError({
			command: "template",
			invalid_mode: mode ?? null
		}, "Use `template packet` or `template patch`.");
	},
	async execute(input, context) {
		const cwd = context.host.resolveCliPath(".");
		if (input.mode === "packet") {
			const outputPath = await context.artifacts.writeTemplateOutput({
				cwd,
				out: input.out,
				defaultBasename: "packet.template.json",
				content: context.templates.renderPacketTemplate()
			});
			return context.schemas.parseCommandOutput("template", {
				mode: "packet",
				output_path: outputPath
			});
		}
		if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND");
		const [appliedRegistry, queryState] = await Promise.all([context.artifacts.readAppliedRegistry(context.backlogRoot), context.ensureQueryState()]);
		const { state } = queryState;
		const missingItemKeys = input.item_keys.filter((itemKey) => !state.items.some((candidate) => candidate.item_key === itemKey));
		if (missingItemKeys.length > 0) throw context.errors.create("BE_ITEM_NOT_FOUND", void 0, { details: { item_keys: missingItemKeys } });
		const nextSequence = appliedRegistry.patches.reduce((maxSequence, patch) => {
			return Math.max(maxSequence, patch.sequence);
		}, 0) + 1;
		const createdAt = context.host.nowIsoUtc();
		const draftSuffix = createDraftSuffix(context.host.createUuid());
		const outputPath = await context.artifacts.writeTemplateOutput({
			cwd,
			out: input.out,
			defaultBasename: `${formatPatchSequence(nextSequence)}-patch.template.json`,
			collisionBasename: `${formatPatchSequence(nextSequence)}-${draftSuffix}-patch.template.json`,
			content: context.templates.renderPatchTemplate({
				targetItemKeys: input.item_keys,
				kind: "patch-item",
				patchId: createPatchTemplateId(createdAt, nextSequence, draftSuffix),
				createdAt,
				sequence: nextSequence
			})
		});
		return context.schemas.parseCommandOutput("template", {
			mode: "patch",
			output_path: outputPath
		});
	}
};
//#endregion
//#region src/vendor/backlog-engineer/commands/update-source-path.ts
var OPTIONS = [
	{
		flags: ["--source-id"],
		value_name: "<source_id>",
		description: "Registered source ID to update."
	},
	{
		flags: ["--source-label"],
		value_name: "<source_label>",
		description: "Registered source label to update."
	},
	{
		flags: ["--source-path"],
		value_name: "<path>",
		description: "Registered source path to update."
	},
	{
		flags: ["--new-path"],
		value_name: "<path>",
		description: "New filesystem path for the same logical source.",
		required: true
	},
	{
		flags: ["--dry-run"],
		description: "Validate and simulate path update without writing to disk."
	}
];
function sortSources(values) {
	return [...values].sort((left, right) => {
		const labelCompare = left.source_label.localeCompare(right.source_label);
		if (labelCompare !== 0) return labelCompare;
		return left.source_id.localeCompare(right.source_id);
	});
}
function updateRegistrySource(payload) {
	return {
		...payload.registry,
		updated_at: payload.updatedAt,
		sources: sortSources(payload.registry.sources.map((candidate) => candidate.source_id === payload.source.source_id ? payload.updatedSource : candidate))
	};
}
var UPDATE_SOURCE_PATH_COMMAND = {
	name: "update-source-path",
	summary: "Update the registered path of an existing source.",
	usage: [
		"backlog-engineer update-source-path --source-id <source_id> --new-path <path> [--dry-run]",
		"backlog-engineer update-source-path --source-label <source_label> --new-path <path> [--dry-run]",
		"backlog-engineer update-source-path --source-path <path> --new-path <path> [--dry-run]"
	],
	options: OPTIONS,
	notes: [
		BACKLOG_MUTATION_SCOPE_NOTE,
		"The source keeps the same source_id; only its path, label, hash, and last_checked_at can change.",
		"If the new file hash changed, the command applies scoped refresh semantics for the same source_id.",
		SERIAL_MUTATION_NOTE,
		ABSOLUTE_OUTPUT_NOTE
	],
	inputSchema: UpdateSourcePathCommandInputSchema,
	outputSchema: UpdateSourcePathCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("update-source-path", args, { options: {
			"source-id": { type: "string" },
			"source-label": { type: "string" },
			"source-path": { type: "string" },
			"new-path": { type: "string" },
			"dry-run": { type: "boolean" }
		} });
		assertNoPositionals("update-source-path", parsed.positionals);
		return parseUsageInput("update-source-path", UpdateSourcePathCommandInputSchema, {
			selector: buildSourceSelectorFromFlags({
				commandName: "update-source-path",
				sourceId: getStringOption(parsed.values["source-id"]),
				sourceLabel: getStringOption(parsed.values["source-label"]),
				sourcePath: getStringOption(parsed.values["source-path"])
			}),
			new_path: requireStringOption("update-source-path", "--new-path", getStringOption(parsed.values["new-path"])),
			dry_run: parsed.values["dry-run"] === true
		});
	},
	async execute(input, context) {
		if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND");
		const backlogRoot = context.backlogRoot;
		const [state, registry] = await Promise.all([context.ensureMutationState(), context.artifacts.readSourceRegistry(backlogRoot)]);
		const source = await resolveSourceRecord({
			context,
			registry,
			selector: input.selector
		});
		const normalizedNewPath = await context.sources.resolveCliSourcePath({
			backlogRoot,
			inputPath: context.host.resolveCliPath(input.new_path)
		});
		if (normalizedNewPath.relative_path === source.path) {
			await context.sources.hashSourceFile(normalizedNewPath.absolute_path);
			return context.schemas.parseCommandOutput("update-source-path", {
				dry_run: input.dry_run,
				...toSourceOutput({
					backlogRoot,
					source
				}),
				previous_path: toSourceOutput({
					backlogRoot,
					source
				}).path,
				hash_changed: false,
				counts: {
					changed_sources: 0,
					todo_created: 0,
					todo_updated: 0,
					todo_removed: 0
				},
				todo_created: [],
				todo_updated: [],
				todo_removed: [],
				next_commands: []
			});
		}
		const conflictingSource = registry.sources.find((candidate) => candidate.path === normalizedNewPath.relative_path && candidate.source_id !== source.source_id);
		if (conflictingSource) throw context.errors.create("BE_SOURCE_PATH_CONFLICT", void 0, {
			details: {
				source_id: source.source_id,
				source_label: source.source_label,
				new_path: normalizedNewPath.relative_path,
				conflicting_source_id: conflictingSource.source_id,
				conflicting_source_label: conflictingSource.source_label
			},
			hint: "Use a path not already registered by another source, or remove/update the conflicting source first."
		});
		const newHash = await context.sources.hashSourceFile(normalizedNewPath.absolute_path);
		const now = context.host.nowIsoUtc();
		const updatedSource = context.schemas.parseSourceRegistry({
			...registry,
			sources: [{
				...source,
				source_label: normalizedNewPath.source_label,
				path: normalizedNewPath.relative_path,
				hash: newHash,
				last_checked_at: now
			}]
		}).sources[0];
		if (!updatedSource) throw context.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, { details: {
			command: "update-source-path",
			reason: "updated_source_parse_failed"
		} });
		const nextRegistry = context.schemas.parseSourceRegistry(updateRegistrySource({
			registry,
			source,
			updatedSource,
			updatedAt: now
		}));
		const hashChanged = newHash !== source.hash;
		const previousPath = toSourceOutput({
			backlogRoot,
			source
		}).path;
		if (!hashChanged) {
			const syncResult = syncTodoSourceLabels({
				schemas: context.schemas,
				state,
				registry: nextRegistry,
				previousRegistry: registry
			});
			const syncedState = context.schemas.parseStateFile({
				...syncResult.state,
				updated_at: now
			});
			const output = context.schemas.parseCommandOutput("update-source-path", {
				dry_run: input.dry_run,
				...toSourceOutput({
					backlogRoot,
					source: updatedSource
				}),
				previous_path: previousPath,
				hash_changed: false,
				counts: {
					changed_sources: 1,
					todo_created: 0,
					todo_updated: syncResult.todoUpdated.length,
					todo_removed: 0
				},
				todo_created: [],
				todo_updated: syncResult.todoUpdated,
				todo_removed: [],
				next_commands: []
			});
			if (!input.dry_run) {
				await context.artifacts.writeState(backlogRoot, syncedState);
				try {
					await context.artifacts.writeSourceRegistry(backlogRoot, nextRegistry);
				} catch (error) {
					try {
						await context.artifacts.writeState(backlogRoot, state);
					} catch (rollbackError) {
						throw context.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, {
							details: {
								command: "update-source-path",
								phase: "write_source_registry",
								rollback: "write_state"
							},
							hint: "Source path update failed after persisting state and state rollback also failed.",
							cause: rollbackError
						});
					}
					throw error;
				}
			}
			return output;
		}
		const { state: refreshedState, registry: refreshedRegistry, ...refreshSummary } = await context.core.mutation.refresh({
			state,
			sourceRegistry: nextRegistry,
			changedSourceIds: [source.source_id],
			scope: {
				kind: "source_id",
				source_id: source.source_id
			}
		});
		const syncResult = syncTodoSourceLabels({
			schemas: context.schemas,
			state: refreshedState,
			registry: refreshedRegistry,
			previousRegistry: registry
		});
		const nextState = syncResult.state;
		const todoUpdated = sortKeys$1([...refreshSummary.todo_updated, ...syncResult.todoUpdated]);
		const output = context.schemas.parseCommandOutput("update-source-path", {
			dry_run: input.dry_run,
			...toSourceOutput({
				backlogRoot,
				source: updatedSource
			}),
			previous_path: previousPath,
			hash_changed: true,
			counts: {
				...refreshSummary.counts,
				todo_updated: todoUpdated.length
			},
			todo_created: sortKeys$1(refreshSummary.todo_created),
			todo_updated: todoUpdated,
			todo_removed: sortKeys$1(refreshSummary.todo_removed),
			next_commands: refreshSummary.next_commands
		});
		if (!input.dry_run) {
			await context.artifacts.writeState(backlogRoot, nextState);
			try {
				await context.artifacts.writeSourceRegistry(backlogRoot, refreshedRegistry);
			} catch (error) {
				try {
					await context.artifacts.writeState(backlogRoot, state);
				} catch (rollbackError) {
					throw context.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, {
						details: {
							command: "update-source-path",
							phase: "write_source_registry",
							rollback: "write_state"
						},
						hint: "Source path update failed after persisting state and state rollback also failed.",
						cause: rollbackError
					});
				}
				throw error;
			}
			await context.hooks.afterRefresh?.({
				summary: refreshSummary,
				state: nextState,
				backlogRoot
			});
		}
		return output;
	}
};
//#endregion
//#region src/vendor/backlog-engineer/artifacts/backlog-layout.ts
var ROOT_MARKER_BASENAME = ".dossier/manifest.json";
var GITIGNORE_BASENAME = ".dossier/backlog/.gitignore";
var BACKLOG_INTERNAL_DIRNAME = ".dossier/backlog";
var MUTATION_LOCK_BASENAME = "mutation.lock";
var PACKETS_DIRNAME = ".dossier/backlog/packets";
var PATCHES_DIRNAME = ".dossier/backlog/patches";
var REPORTS_DIRNAME = ".dossier/backlog/reports";
var AGENTS_BASENAME = ".dossier/backlog/AGENTS.md";
var SOURCES_REGISTRY_BASENAME = "sources.json";
var APPLIED_REGISTRY_BASENAME = "applied.json";
var STATE_BASENAME = "state.json";
var REPORT_MARKDOWN_BASENAME = "backlog-report.md";
var REPORT_GRAPH_BASENAME = "backlog-graph.mmd";
function getLayoutDirectories(path, root) {
	return {
		internalDir: path.join(root, BACKLOG_INTERNAL_DIRNAME),
		packetsDir: path.join(root, PACKETS_DIRNAME),
		patchesDir: path.join(root, PATCHES_DIRNAME),
		reportsDir: path.join(root, REPORTS_DIRNAME)
	};
}
function getManagedBacklogPaths(path, root) {
	return {
		...getLayoutDirectories(path, root),
		rootMarkerPath: getRootMarkerPath(path, root),
		agentsPath: getAgentsPath(path, root),
		gitignorePath: getGitignorePath(path, root),
		mutationLockPath: getMutationLockPath(path, root)
	};
}
async function createBacklogDirectories(fs, path, errors, root) {
	const { internalDir, packetsDir, patchesDir, reportsDir } = getLayoutDirectories(path, root);
	for (const directoryPath of [
		root,
		internalDir,
		packetsDir,
		patchesDir,
		reportsDir
	]) await ensureManagedDirectoryPathSafe({
		fs,
		path,
		errors,
		root,
		directoryPath,
		errorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
	await fs.mkdir(root, { recursive: true });
	await fs.mkdir(internalDir, { recursive: true });
	await fs.mkdir(packetsDir, { recursive: true });
	await fs.mkdir(patchesDir, { recursive: true });
	await fs.mkdir(reportsDir, { recursive: true });
}
function getRootMarkerPath(path, root) {
	return path.join(root, ROOT_MARKER_BASENAME);
}
function getAgentsPath(path, root) {
	return path.join(root, AGENTS_BASENAME);
}
function getGitignorePath(path, root) {
	return path.join(root, GITIGNORE_BASENAME);
}
function getSourceRegistryPath(path, root) {
	return path.join(root, BACKLOG_INTERNAL_DIRNAME, SOURCES_REGISTRY_BASENAME);
}
function getAppliedRegistryPath(path, root) {
	return path.join(root, BACKLOG_INTERNAL_DIRNAME, APPLIED_REGISTRY_BASENAME);
}
function getStatePath(path, root) {
	return path.join(root, BACKLOG_INTERNAL_DIRNAME, STATE_BASENAME);
}
function getMutationLockPath(path, root) {
	return path.join(root, BACKLOG_INTERNAL_DIRNAME, MUTATION_LOCK_BASENAME);
}
function getReportMarkdownPath(path, root) {
	return path.join(root, REPORTS_DIRNAME, REPORT_MARKDOWN_BASENAME);
}
function getReportGraphPath(path, root) {
	return path.join(root, REPORTS_DIRNAME, REPORT_GRAPH_BASENAME);
}
function toBacklogRelativePosixPath(path, root, target) {
	return path.relative(root, target).replaceAll("\\", "/");
}
function createCanonicalImportFilename(sha256, canonicalBasename, errors) {
	const trimmedBasename = canonicalBasename.trim();
	if (trimmedBasename.length === 0 || trimmedBasename.includes("/") || trimmedBasename.includes("\\") || trimmedBasename === "." || trimmedBasename === "..") throw errors.create("BE_CANONICAL_WRITE_FAILED", void 0, {
		details: { canonical_basename: canonicalBasename },
		hint: "Canonical import basenames must be plain filenames without path separators."
	});
	return `${sha256.slice(0, 12)}--${trimmedBasename}`;
}
async function resolveTemplateOutputPath(payload) {
	const { fs, path, errors, cwd, out, defaultBasename, collisionBasename } = payload;
	const absoluteTarget = path.resolve(cwd, out);
	const explicitDirectory = out.endsWith("/") || out.endsWith("\\");
	async function resolveDirectoryTarget(directoryPath) {
		const primaryTarget = path.join(directoryPath, defaultBasename);
		if (!await fs.exists(primaryTarget)) return primaryTarget;
		if (collisionBasename) return path.join(directoryPath, collisionBasename);
		return primaryTarget;
	}
	await ensureNoSymlinkAncestors({
		fs,
		path,
		errors,
		targetPath: absoluteTarget,
		errorCode: "BE_TEMPLATE_OUTPUT_INVALID"
	});
	if (await fs.exists(absoluteTarget)) {
		const stat = await fs.lstat(absoluteTarget);
		if (stat.isSymbolicLink) throw errors.create("BE_TEMPLATE_OUTPUT_INVALID", void 0, { details: { out } });
		if (stat.isDirectory) return resolveDirectoryTarget(absoluteTarget);
		if (stat.isFile) {
			if (explicitDirectory) throw errors.create("BE_TEMPLATE_OUTPUT_INVALID", void 0, {
				details: { out },
				hint: "A trailing slash requires an existing directory or a creatable directory path."
			});
			return absoluteTarget;
		}
	}
	if (explicitDirectory) {
		try {
			await fs.mkdir(absoluteTarget, { recursive: true });
		} catch (error) {
			throw errors.create("BE_TEMPLATE_OUTPUT_INVALID", void 0, {
				details: { out },
				cause: error
			});
		}
		return resolveDirectoryTarget(absoluteTarget);
	}
	if (path.basename(absoluteTarget).trim().length === 0) throw errors.create("BE_TEMPLATE_OUTPUT_INVALID", void 0, { details: { out } });
	return absoluteTarget;
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/canonical-import-store.ts
async function importCanonicalArtifact(payload) {
	const { dependencies, root, sourcePath, rawContent, canonicalBasename, directoryName } = payload;
	const sha256 = await dependencies.hash.sha256Text(rawContent);
	const filename = createCanonicalImportFilename(sha256, canonicalBasename, dependencies.errors);
	const directories = getLayoutDirectories(dependencies.path, root);
	const targetDir = directoryName === ".dossier/backlog/packets" ? directories.packetsDir : directories.patchesDir;
	const targetPath = dependencies.path.join(targetDir, filename);
	const normalizedSourcePath = dependencies.path.resolve(sourcePath);
	await ensureManagedFilePathSafe({
		fs: dependencies.fs,
		path: dependencies.path,
		errors: dependencies.errors,
		root,
		filePath: targetPath,
		errorCode: "BE_CANONICAL_WRITE_FAILED"
	});
	if (normalizedSourcePath === targetPath) return {
		canonicalPath: toBacklogRelativePosixPath(dependencies.path, root, targetPath),
		sha256
	};
	if (await dependencies.fs.exists(targetPath)) {
		if ((await dependencies.fs.stat(targetPath)).isFile) {
			if (await dependencies.fs.readText(targetPath) === rawContent) return {
				canonicalPath: toBacklogRelativePosixPath(dependencies.path, root, targetPath),
				sha256
			};
		}
	}
	await writeTextAtomically({
		fs: dependencies.fs,
		path: dependencies.path,
		hash: dependencies.hash,
		errors: dependencies.errors,
		root,
		targetPath,
		content: rawContent,
		writeErrorCode: "BE_CANONICAL_WRITE_FAILED"
	});
	return {
		canonicalPath: toBacklogRelativePosixPath(dependencies.path, root, targetPath),
		sha256
	};
}
async function importPacketFile(dependencies, payload) {
	payload.packetId;
	payload.sourcePath;
	return importCanonicalArtifact({
		dependencies,
		root: payload.root,
		sourcePath: payload.sourcePath,
		rawContent: payload.rawContent,
		canonicalBasename: payload.canonicalBasename,
		directoryName: PACKETS_DIRNAME
	});
}
async function importPatchFile(dependencies, payload) {
	payload.patchId;
	payload.sourcePath;
	return importCanonicalArtifact({
		dependencies,
		root: payload.root,
		sourcePath: payload.sourcePath,
		rawContent: payload.rawContent,
		canonicalBasename: payload.canonicalBasename,
		directoryName: PATCHES_DIRNAME
	});
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/gitignore-store.ts
var MANAGED_SECTION_START = "# backlog-engineer managed start";
var MANAGED_SECTION_END = "# backlog-engineer managed end";
var MANAGED_SECTION_LINES = ["/.backlog/mutation.lock"];
function normalizeTrailingNewline(content) {
	return content.endsWith("\n") ? content : `${content}\n`;
}
function renderManagedSection() {
	return `${MANAGED_SECTION_START}\n${MANAGED_SECTION_LINES.join("\n")}\n${MANAGED_SECTION_END}\n`;
}
function stripManagedSections(content) {
	const normalized = normalizeTrailingNewline(content);
	let result = "";
	let cursor = 0;
	let removedBlockCount = 0;
	while (cursor < normalized.length) {
		const startIndex = normalized.indexOf(MANAGED_SECTION_START, cursor);
		if (startIndex === -1) {
			result += normalized.slice(cursor);
			break;
		}
		const endIndex = normalized.indexOf(MANAGED_SECTION_END, startIndex + 32);
		if (endIndex === -1) {
			result += normalized.slice(cursor);
			break;
		}
		result += normalized.slice(cursor, startIndex);
		cursor = endIndex + 30;
		if (normalized.charAt(cursor) === "\n") cursor += 1;
		removedBlockCount += 1;
	}
	return {
		content: normalizeTrailingNewline(result),
		removedBlockCount
	};
}
function renderManagedGitignoreContent(content) {
	const managedSection = renderManagedSection();
	const trimmed = stripManagedSections(content).content.trimEnd();
	return [
		...trimmed.length > 0 ? [trimmed] : [],
		managedSection.trimEnd(),
		""
	].join("\n");
}
function stripManagedGitignoreSection(content) {
	const stripped = stripManagedSections(content);
	return {
		content: stripped.content.trim().length > 0 ? `${stripped.content.trimEnd()}\n` : "",
		hadManagedSection: stripped.removedBlockCount > 0
	};
}
async function writeManagedGitignore(dependencies, payload) {
	const gitignorePath = getGitignorePath(dependencies.path, payload.root);
	const content = renderManagedGitignoreContent(payload.existingContent ?? "");
	await writeTextAtomically({
		fs: dependencies.fs,
		path: dependencies.path,
		hash: dependencies.hash,
		errors: dependencies.errors,
		root: payload.root,
		targetPath: gitignorePath,
		content,
		writeErrorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/delete-backlog.ts
async function deleteBacklog(dependencies, root) {
	if (!await dependencies.fs.exists(root)) return;
	const rootStat = await dependencies.fs.lstat(root);
	if (!rootStat.isDirectory || rootStat.isSymbolicLink) throw dependencies.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, { details: { path: root } });
	const rootDirectory = await openManagedDirectory({
		fs: dependencies.fs,
		path: dependencies.path,
		errors: dependencies.errors,
		root,
		directoryPath: root,
		errorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
	let rootParentDirectory;
	try {
		const remainingEntries = await dependencies.fs.readdir(rootDirectory.resolveEntry("."));
		const allowedEntries = new Set([
			ROOT_MARKER_BASENAME,
			GITIGNORE_BASENAME,
			AGENTS_BASENAME,
			BACKLOG_INTERNAL_DIRNAME,
			PACKETS_DIRNAME,
			PATCHES_DIRNAME,
			REPORTS_DIRNAME
		]);
		const unexpectedEntries = remainingEntries.filter((entry) => !allowedEntries.has(entry));
		if (unexpectedEntries.length > 0) throw dependencies.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, { details: {
			path: root,
			unexpected_entries: unexpectedEntries
		} });
		const managedPaths = getManagedBacklogPaths(dependencies.path, root);
		await ensureManagedDirectoryPathSafe({
			fs: dependencies.fs,
			path: dependencies.path,
			errors: dependencies.errors,
			root,
			directoryPath: managedPaths.internalDir,
			errorCode: "BE_INTERNAL_STATE_CORRUPT"
		});
		await ensureManagedDirectoryPathSafe({
			fs: dependencies.fs,
			path: dependencies.path,
			errors: dependencies.errors,
			root,
			directoryPath: managedPaths.packetsDir,
			errorCode: "BE_INTERNAL_STATE_CORRUPT"
		});
		await ensureManagedDirectoryPathSafe({
			fs: dependencies.fs,
			path: dependencies.path,
			errors: dependencies.errors,
			root,
			directoryPath: managedPaths.patchesDir,
			errorCode: "BE_INTERNAL_STATE_CORRUPT"
		});
		await ensureManagedDirectoryPathSafe({
			fs: dependencies.fs,
			path: dependencies.path,
			errors: dependencies.errors,
			root,
			directoryPath: managedPaths.reportsDir,
			errorCode: "BE_INTERNAL_STATE_CORRUPT"
		});
		await ensureManagedFilePathSafe({
			fs: dependencies.fs,
			path: dependencies.path,
			errors: dependencies.errors,
			root,
			filePath: managedPaths.rootMarkerPath,
			errorCode: "BE_INTERNAL_STATE_CORRUPT"
		});
		await ensureManagedFilePathSafe({
			fs: dependencies.fs,
			path: dependencies.path,
			errors: dependencies.errors,
			root,
			filePath: managedPaths.gitignorePath,
			errorCode: "BE_INTERNAL_STATE_CORRUPT"
		});
		await ensureManagedFilePathSafe({
			fs: dependencies.fs,
			path: dependencies.path,
			errors: dependencies.errors,
			root,
			filePath: managedPaths.agentsPath,
			errorCode: "BE_INTERNAL_STATE_CORRUPT"
		});
		await ensureNoSymlinkAncestors({
			fs: dependencies.fs,
			path: dependencies.path,
			errors: dependencies.errors,
			targetPath: dependencies.path.dirname(root),
			errorCode: "BE_INTERNAL_STATE_CORRUPT"
		});
		rootParentDirectory = await dependencies.fs.openDirectory(dependencies.path.dirname(root));
		const stableRootMarkerPath = rootDirectory.resolveEntry(ROOT_MARKER_BASENAME);
		const stableGitignorePath = rootDirectory.resolveEntry(GITIGNORE_BASENAME);
		const stableAgentsPath = rootDirectory.resolveEntry(AGENTS_BASENAME);
		const stableInternalDir = rootDirectory.resolveEntry(BACKLOG_INTERNAL_DIRNAME);
		const stablePacketsDir = rootDirectory.resolveEntry(PACKETS_DIRNAME);
		const stablePatchesDir = rootDirectory.resolveEntry(PATCHES_DIRNAME);
		const stableReportsDir = rootDirectory.resolveEntry(REPORTS_DIRNAME);
		if (await dependencies.fs.exists(stableGitignorePath)) {
			const strippedGitignore = stripManagedGitignoreSection(await dependencies.fs.readTextNoFollow(stableGitignorePath));
			if (strippedGitignore.content.length === 0) await dependencies.fs.rm(stableGitignorePath, { force: true });
			else await writeTextAtomically({
				fs: dependencies.fs,
				path: dependencies.path,
				hash: dependencies.hash,
				errors: dependencies.errors,
				root,
				targetPath: managedPaths.gitignorePath,
				content: strippedGitignore.content,
				writeErrorCode: "BE_INTERNAL_STATE_CORRUPT"
			});
		}
		await dependencies.fs.rm(stableAgentsPath, { force: true });
		await dependencies.fs.rm(stableInternalDir, {
			recursive: true,
			force: true
		});
		await dependencies.fs.rm(stablePacketsDir, {
			recursive: true,
			force: true
		});
		await dependencies.fs.rm(stablePatchesDir, {
			recursive: true,
			force: true
		});
		await dependencies.fs.rm(stableReportsDir, {
			recursive: true,
			force: true
		});
		await dependencies.fs.rm(stableRootMarkerPath, { force: true });
		if ((await dependencies.fs.readdir(rootDirectory.resolveEntry("."))).length === 0) await dependencies.fs.rm(rootParentDirectory.resolveEntry(dependencies.path.basename(root)), {
			recursive: true,
			force: true
		});
	} finally {
		await rootParentDirectory?.close().catch(() => void 0);
		await rootDirectory.close().catch(() => void 0);
	}
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/initialize-backlog.ts
function createInitialRootMarker(createdAt) {
	return {
		schema_version: 1,
		tool_name: TOOL_NAME,
		created_at: createdAt,
		layout_version: 1
	};
}
function createInitialSourceRegistry(createdAt) {
	return {
		schema_version: 1,
		created_at: createdAt,
		updated_at: createdAt,
		sources: []
	};
}
function createInitialAppliedRegistry(createdAt) {
	return {
		schema_version: 1,
		created_at: createdAt,
		updated_at: createdAt,
		next_apply_index: 1,
		packets: [],
		patches: []
	};
}
function createInitialState(createdAt) {
	return {
		schema_version: 1,
		created_at: createdAt,
		updated_at: createdAt,
		last_refresh_at: null,
		context: {
			glossary: [],
			key_strategy: {},
			target_system: [],
			as_built: [],
			claims: [],
			contracts: [],
			data_domains: [],
			quality_attributes: [],
			policy_decisions: []
		},
		items: [],
		todos: []
	};
}
var RESERVED_INIT_ENTRY_NAMES = [
	ROOT_MARKER_BASENAME,
	AGENTS_BASENAME,
	BACKLOG_INTERNAL_DIRNAME,
	PACKETS_DIRNAME,
	PATCHES_DIRNAME,
	REPORTS_DIRNAME
];
function createInitConflictError(dependencies, payload) {
	const conflictingEntries = payload.conflictingEntries ?? [];
	return dependencies.errors.create("BE_ROOT_NOT_EMPTY", payload.message, {
		details: {
			path: payload.root,
			...conflictingEntries.length > 0 ? {
				conflicting_entries: conflictingEntries,
				conflicting_paths: conflictingEntries.map((entry) => dependencies.path.join(payload.root, entry))
			} : {}
		},
		hint: "Use a different directory or remove/rename only the conflicting backlog-managed artifact paths. Unrelated existing files and subdirectories are allowed."
	});
}
async function assertInitTargetAvailable(dependencies, root) {
	const markerPath = getRootMarkerPath(dependencies.path, root);
	if (await dependencies.fs.exists(markerPath)) {
		const markerStat = await dependencies.fs.lstat(markerPath);
		if (markerStat.isFile && !markerStat.isSymbolicLink) throw dependencies.errors.create("BE_ROOT_ALREADY_EXISTS", void 0, { details: {
			path: root,
			root_marker_path: markerPath
		} });
	}
	if (!await dependencies.fs.exists(root)) return {};
	const rootStat = await dependencies.fs.lstat(root);
	if (rootStat.isSymbolicLink || !rootStat.isDirectory) throw createInitConflictError(dependencies, {
		root,
		message: "Cannot initialize backlog because the target path is not a regular directory."
	});
	const entries = await dependencies.fs.readdir(root);
	if (entries.length === 0) return {};
	let existingGitignoreContent;
	if (entries.includes(".dossier/backlog/.gitignore")) {
		const gitignorePath = getGitignorePath(dependencies.path, root);
		const gitignoreStat = await dependencies.fs.lstat(gitignorePath);
		if (!gitignoreStat.isFile || gitignoreStat.isSymbolicLink) throw createInitConflictError(dependencies, {
			root,
			conflictingEntries: [GITIGNORE_BASENAME]
		});
		existingGitignoreContent = await dependencies.fs.readText(gitignorePath);
	}
	const conflictingEntries = entries.filter((entry) => {
		if (entry === ".dossier/backlog/.gitignore") return false;
		return RESERVED_INIT_ENTRY_NAMES.includes(entry);
	});
	if (conflictingEntries.length > 0) throw createInitConflictError(dependencies, {
		root,
		conflictingEntries
	});
	return existingGitignoreContent !== void 0 ? { existingGitignoreContent } : {};
}
async function initializeBacklogRoot(dependencies, payload) {
	const initTarget = await assertInitTargetAvailable(dependencies, payload.root);
	const marker = dependencies.schemas.parseRootMarker(createInitialRootMarker(payload.createdAt));
	const sourceRegistry = dependencies.schemas.parseSourceRegistry(createInitialSourceRegistry(payload.createdAt));
	const appliedRegistry = dependencies.schemas.parseAppliedRegistry(createInitialAppliedRegistry(payload.createdAt));
	const state = dependencies.schemas.parseStateFile(createInitialState(payload.createdAt));
	await dependencies.artifacts.writeInitialArtifacts({
		root: payload.root,
		marker,
		agentsContent: payload.agentsContent,
		...initTarget.existingGitignoreContent !== void 0 ? { existingGitignoreContent: initTarget.existingGitignoreContent } : {},
		sourceRegistry,
		appliedRegistry,
		state
	});
	return dependencies.schemas.parseCommandOutput("init", {
		path: dependencies.path.resolve(payload.root),
		root_marker_path: getRootMarkerPath(dependencies.path, payload.root),
		agents_path: getAgentsPath(dependencies.path, payload.root)
	});
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/report-store.ts
async function writeReportFiles(dependencies, payload) {
	const reportPath = getReportMarkdownPath(dependencies.path, payload.root);
	const graphPath = getReportGraphPath(dependencies.path, payload.root);
	await writeTextAtomically({
		fs: dependencies.fs,
		path: dependencies.path,
		hash: dependencies.hash,
		errors: dependencies.errors,
		root: payload.root,
		targetPath: reportPath,
		content: payload.markdown,
		writeErrorCode: "BE_REPORT_WRITE_FAILED"
	});
	await writeTextAtomically({
		fs: dependencies.fs,
		path: dependencies.path,
		hash: dependencies.hash,
		errors: dependencies.errors,
		root: payload.root,
		targetPath: graphPath,
		content: payload.mermaid,
		writeErrorCode: "BE_REPORT_WRITE_FAILED"
	});
	return {
		reportPath: toBacklogRelativePosixPath(dependencies.path, payload.root, reportPath),
		graphPath: toBacklogRelativePosixPath(dependencies.path, payload.root, graphPath)
	};
}
async function writeTemplateOutput(dependencies, payload) {
	const targetPath = await resolveTemplateOutputPath({
		fs: dependencies.fs,
		path: dependencies.path,
		errors: dependencies.errors,
		cwd: payload.cwd,
		out: payload.out,
		defaultBasename: payload.defaultBasename,
		...payload.collisionBasename ? { collisionBasename: payload.collisionBasename } : {}
	});
	await writeTextAtomically({
		fs: dependencies.fs,
		path: dependencies.path,
		hash: dependencies.hash,
		errors: dependencies.errors,
		targetPath,
		content: payload.content,
		writeErrorCode: "BE_TEMPLATE_OUTPUT_INVALID"
	});
	return targetPath;
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/root-marker-store.ts
async function readRootMarker(dependencies, root) {
	return readJsonArtifact({
		fs: dependencies.fs,
		path: dependencies.path,
		errors: dependencies.errors,
		root,
		filePath: getRootMarkerPath(dependencies.path, root),
		parse: (raw) => dependencies.schemas.parseRootMarker(raw),
		readErrorCode: "BE_ROOT_NOT_FOUND",
		missingCode: "BE_ROOT_NOT_FOUND",
		corruptCode: "BE_ROOT_NOT_FOUND"
	});
}
async function writeRootMarker(dependencies, root, marker) {
	await writeJsonArtifact({
		fs: dependencies.fs,
		path: dependencies.path,
		hash: dependencies.hash,
		errors: dependencies.errors,
		root,
		filePath: getRootMarkerPath(dependencies.path, root),
		value: marker,
		validate: (raw) => dependencies.schemas.parseRootMarker(raw),
		writeErrorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/source-registry-store.ts
async function readSourceRegistry(dependencies, root) {
	return readJsonArtifact({
		fs: dependencies.fs,
		path: dependencies.path,
		errors: dependencies.errors,
		root,
		filePath: getSourceRegistryPath(dependencies.path, root),
		parse: (raw) => dependencies.schemas.parseSourceRegistry(raw),
		readErrorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
}
async function writeSourceRegistry(dependencies, root, value) {
	await writeJsonArtifact({
		fs: dependencies.fs,
		path: dependencies.path,
		hash: dependencies.hash,
		errors: dependencies.errors,
		root,
		filePath: getSourceRegistryPath(dependencies.path, root),
		value,
		validate: (raw) => dependencies.schemas.parseSourceRegistry(raw),
		writeErrorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/applied-registry-store.ts
function assertAppliedRegistrySemanticInvariants(value, dependencies) {
	const seenSequences = /* @__PURE__ */ new Set();
	for (const patch of value.patches) {
		if (seenSequences.has(patch.sequence)) throw dependencies.errors.create("BE_PATCH_SEQUENCE_CONFLICT", void 0, { details: {
			patch_id: patch.patch_id,
			sequence: patch.sequence
		} });
		seenSequences.add(patch.sequence);
	}
}
async function readAppliedRegistry(dependencies, root) {
	const registry = await readJsonArtifact({
		fs: dependencies.fs,
		path: dependencies.path,
		errors: dependencies.errors,
		root,
		filePath: getAppliedRegistryPath(dependencies.path, root),
		parse: (raw) => dependencies.schemas.parseAppliedRegistry(raw),
		readErrorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
	assertAppliedRegistrySemanticInvariants(registry, dependencies);
	return registry;
}
async function writeAppliedRegistry(dependencies, root, value) {
	assertAppliedRegistrySemanticInvariants(value, dependencies);
	await writeJsonArtifact({
		fs: dependencies.fs,
		path: dependencies.path,
		hash: dependencies.hash,
		errors: dependencies.errors,
		root,
		filePath: getAppliedRegistryPath(dependencies.path, root),
		value,
		validate: (raw) => dependencies.schemas.parseAppliedRegistry(raw),
		writeErrorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/state-store.ts
async function readState(dependencies, root) {
	return readJsonArtifact({
		fs: dependencies.fs,
		path: dependencies.path,
		errors: dependencies.errors,
		root,
		filePath: getStatePath(dependencies.path, root),
		parse: (raw) => dependencies.schemas.parseStateFile(raw),
		readErrorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
}
async function writeState(dependencies, root, value) {
	await writeJsonArtifact({
		fs: dependencies.fs,
		path: dependencies.path,
		hash: dependencies.hash,
		errors: dependencies.errors,
		root,
		filePath: getStatePath(dependencies.path, root),
		value,
		validate: (raw) => dependencies.schemas.parseStateFile(raw),
		writeErrorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
}
async function stateExists(dependencies, root) {
	const statePath = getStatePath(dependencies.path, root);
	await ensureManagedFilePathSafe({
		fs: dependencies.fs,
		path: dependencies.path,
		errors: dependencies.errors,
		root,
		filePath: statePath,
		errorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
	if (!await dependencies.fs.exists(statePath)) return false;
	return (await dependencies.fs.lstat(statePath)).isFile;
}
//#endregion
//#region src/vendor/backlog-engineer/artifacts/index.ts
async function createTempSiblingPath(payload) {
	const seedHash = await payload.hash.sha256Text(`${payload.targetPath}\n${payload.content}`);
	return payload.path.join(payload.path.dirname(payload.targetPath), `.${payload.path.basename(payload.targetPath)}.tmp-${seedHash.slice(0, 12)}`);
}
async function pruneEmptyRoot(payload) {
	if (!await payload.fs.exists(payload.root)) return;
	const rootStat = await payload.fs.lstat(payload.root);
	if (!rootStat.isDirectory || rootStat.isSymbolicLink) return;
	if ((await payload.fs.readdir(payload.root)).length === 0) await payload.fs.rm(payload.root, {
		recursive: true,
		force: true
	});
}
function createArtifactsModule(dependencies) {
	return {
		createBacklogDirectories(root) {
			return createBacklogDirectories(dependencies.fs, dependencies.path, dependencies.errors, root);
		},
		readRootMarker(root) {
			return readRootMarker(dependencies, root);
		},
		writeRootMarker(root, marker) {
			return writeRootMarker(dependencies, root, marker);
		},
		async writeAgentsFile(root, content) {
			await writeTextAtomically({
				fs: dependencies.fs,
				path: dependencies.path,
				hash: dependencies.hash,
				errors: dependencies.errors,
				root,
				targetPath: getAgentsPath(dependencies.path, root),
				content,
				writeErrorCode: "BE_INTERNAL_STATE_CORRUPT"
			});
		},
		writeManagedGitignore(payload) {
			return writeManagedGitignore(dependencies, payload);
		},
		initializeBacklogRoot(payload) {
			return initializeBacklogRoot({
				...dependencies,
				artifacts: this
			}, payload);
		},
		async writeInitialArtifacts(payload) {
			const rootMarkerPath = getRootMarkerPath(dependencies.path, payload.root);
			const statePath = getStatePath(dependencies.path, payload.root);
			const sourceRegistryPath = getSourceRegistryPath(dependencies.path, payload.root);
			const appliedRegistryPath = getAppliedRegistryPath(dependencies.path, payload.root);
			const agentsPath = getAgentsPath(dependencies.path, payload.root);
			const gitignorePath = getGitignorePath(dependencies.path, payload.root);
			const layoutDirectories = getLayoutDirectories(dependencies.path, payload.root);
			const rootMarkerContent = `${JSON.stringify(payload.marker, null, 2)}\n`;
			const stateContent = `${JSON.stringify(payload.state, null, 2)}\n`;
			const sourceRegistryContent = `${JSON.stringify(payload.sourceRegistry, null, 2)}\n`;
			const appliedRegistryContent = `${JSON.stringify(payload.appliedRegistry, null, 2)}\n`;
			const tempPaths = await Promise.all([
				createTempSiblingPath({
					path: dependencies.path,
					hash: dependencies.hash,
					targetPath: rootMarkerPath,
					content: rootMarkerContent
				}),
				createTempSiblingPath({
					path: dependencies.path,
					hash: dependencies.hash,
					targetPath: statePath,
					content: stateContent
				}),
				createTempSiblingPath({
					path: dependencies.path,
					hash: dependencies.hash,
					targetPath: sourceRegistryPath,
					content: sourceRegistryContent
				}),
				createTempSiblingPath({
					path: dependencies.path,
					hash: dependencies.hash,
					targetPath: appliedRegistryPath,
					content: appliedRegistryContent
				}),
				createTempSiblingPath({
					path: dependencies.path,
					hash: dependencies.hash,
					targetPath: agentsPath,
					content: payload.agentsContent
				}),
				createTempSiblingPath({
					path: dependencies.path,
					hash: dependencies.hash,
					targetPath: gitignorePath,
					content: renderManagedGitignoreContent(payload.existingGitignoreContent ?? "")
				})
			]);
			await createBacklogDirectories(dependencies.fs, dependencies.path, dependencies.errors, payload.root);
			try {
				await writeRootMarker(dependencies, payload.root, payload.marker);
				await writeState(dependencies, payload.root, payload.state);
				await writeSourceRegistry(dependencies, payload.root, payload.sourceRegistry);
				await writeAppliedRegistry(dependencies, payload.root, payload.appliedRegistry);
				await writeTextAtomically({
					fs: dependencies.fs,
					path: dependencies.path,
					hash: dependencies.hash,
					errors: dependencies.errors,
					root: payload.root,
					targetPath: agentsPath,
					content: payload.agentsContent,
					writeErrorCode: "BE_INTERNAL_STATE_CORRUPT"
				});
				await writeManagedGitignore(dependencies, {
					root: payload.root,
					...payload.existingGitignoreContent !== void 0 ? { existingContent: payload.existingGitignoreContent } : {}
				});
			} catch (error) {
				const cleanupTargets = [
					...tempPaths,
					agentsPath,
					appliedRegistryPath,
					sourceRegistryPath,
					statePath,
					rootMarkerPath,
					layoutDirectories.internalDir,
					layoutDirectories.packetsDir,
					layoutDirectories.patchesDir,
					layoutDirectories.reportsDir
				];
				if (payload.existingGitignoreContent === void 0) cleanupTargets.unshift(gitignorePath);
				for (const targetPath of cleanupTargets) try {
					await dependencies.fs.rm(targetPath, {
						recursive: true,
						force: true
					});
				} catch {}
				try {
					await pruneEmptyRoot({
						fs: dependencies.fs,
						root: payload.root
					});
				} catch {}
				throw error;
			}
		},
		readSourceRegistry(root) {
			return readSourceRegistry(dependencies, root);
		},
		writeSourceRegistry(root, value) {
			return writeSourceRegistry(dependencies, root, value);
		},
		readAppliedRegistry(root) {
			return readAppliedRegistry(dependencies, root);
		},
		writeAppliedRegistry(root, value) {
			return writeAppliedRegistry(dependencies, root, value);
		},
		readState(root) {
			return readState(dependencies, root);
		},
		writeState(root, value) {
			return writeState(dependencies, root, value);
		},
		stateExists(root) {
			return stateExists(dependencies, root);
		},
		importPacketFile(payload) {
			return importPacketFile(dependencies, payload);
		},
		importPatchFile(payload) {
			return importPatchFile(dependencies, payload);
		},
		async removeCanonicalPatchFile(payload) {
			const targetPath = dependencies.path.join(payload.root, payload.canonicalPath);
			await ensureManagedFilePathSafe({
				fs: dependencies.fs,
				path: dependencies.path,
				errors: dependencies.errors,
				root: payload.root,
				filePath: targetPath,
				errorCode: "BE_CANONICAL_WRITE_FAILED"
			});
			await dependencies.fs.rm(targetPath, { force: true });
		},
		writeReportFiles(payload) {
			return writeReportFiles(dependencies, payload);
		},
		writeTemplateOutput(payload) {
			return writeTemplateOutput(dependencies, payload);
		},
		deleteBacklog(root) {
			return deleteBacklog(dependencies, root);
		}
	};
}
//#endregion
//#region src/vendor/backlog-engineer/core/read-model-helpers.ts
var ATTENTION_REASON_ORDER = [
	"source_changed",
	"dependency_changed",
	"context_changed",
	"gaps"
];
function collectItemSourceIds$4(item) {
	return new Set([
		...item.origin_source_ids,
		...item.specification_source_ids,
		...item.plan_source_ids,
		...item.implementation_source_ids,
		...item.test_source_ids
	]);
}
function createSourceSummaryLookup(registry) {
	return new Map(registry.sources.map((source) => [source.source_id, {
		source_id: source.source_id,
		source_label: source.source_label
	}]));
}
function collectSourceSummariesForItem(payload) {
	return [...collectItemSourceIds$4(payload.item)].map((sourceId) => {
		const summary = payload.sourceSummariesById.get(sourceId);
		if (!summary) throw payload.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: {
			source_id: sourceId,
			item_key: payload.item.item_key
		} });
		return summary;
	}).sort((left, right) => {
		const byLabel = left.source_label.localeCompare(right.source_label);
		if (byLabel !== 0) return byLabel;
		return left.source_id.localeCompare(right.source_id);
	});
}
function toPacketItem(item) {
	return {
		item_key: item.item_key,
		title: item.title,
		type: item.type,
		delivery_state: item.delivery_state,
		gaps: [...item.gaps],
		depends_on_keys: [...item.depends_on_keys],
		origin_source_ids: [...item.origin_source_ids],
		specification_source_ids: [...item.specification_source_ids],
		plan_source_ids: [...item.plan_source_ids],
		implementation_source_ids: [...item.implementation_source_ids],
		test_source_ids: [...item.test_source_ids],
		claim_keys: [...item.claim_keys],
		contract_keys: [...item.contract_keys],
		data_domain_keys: [...item.data_domain_keys],
		quality_attribute_keys: [...item.quality_attribute_keys],
		policy_decision_keys: [...item.policy_decision_keys]
	};
}
function buildItemContextSummary(item) {
	return {
		claim_keys: [...item.claim_keys],
		contract_keys: [...item.contract_keys],
		data_domain_keys: [...item.data_domain_keys],
		quality_attribute_keys: [...item.quality_attribute_keys],
		policy_decision_keys: [...item.policy_decision_keys]
	};
}
function collectItemTodos(payload) {
	const openTodoIds = new Set(payload.state.items.find((item) => item.item_key === payload.itemKey)?.open_todo_ids ?? []);
	return payload.state.todos.filter((todo) => todo.item_key === payload.itemKey && openTodoIds.has(todo.todo_id)).sort((left, right) => left.todo_id.localeCompare(right.todo_id));
}
function compareAttentionReasonCodes(left, right) {
	const rank = new Map(ATTENTION_REASON_ORDER.map((code, index) => [code, index]));
	const maxLength = Math.max(left.length, right.length);
	for (let index = 0; index < maxLength; index += 1) {
		const leftCode = left[index];
		const rightCode = right[index];
		if (leftCode === rightCode) continue;
		if (leftCode === void 0) return -1;
		if (rightCode === void 0) return 1;
		return (rank.get(leftCode) ?? Number.MAX_SAFE_INTEGER) - (rank.get(rightCode) ?? Number.MAX_SAFE_INTEGER);
	}
	return 0;
}
function buildReadyQueueRoots(items) {
	const readyItemKeys = new Set(items.map((item) => item.item_key));
	return items.filter((item) => item.depends_on_keys.every((itemKey) => !readyItemKeys.has(itemKey))).map((item) => item.item_key).sort((left, right) => left.localeCompare(right));
}
function countReadyDescendants(payload) {
	const visited = /* @__PURE__ */ new Set();
	const stack = [...payload.reverseDependencies.get(payload.rootItemKey) ?? []];
	while (stack.length > 0) {
		const itemKey = stack.pop();
		if (!itemKey || visited.has(itemKey) || !payload.readyItemKeys.has(itemKey)) continue;
		visited.add(itemKey);
		for (const dependentKey of payload.reverseDependencies.get(itemKey) ?? []) stack.push(dependentKey);
	}
	return visited.size;
}
//#endregion
//#region src/vendor/backlog-engineer/core/attention-service.ts
function createAttentionService(payload) {
	return { buildAttentionList({ state, registry }) {
		const sourceSummariesById = createSourceSummaryLookup(registry);
		const entries = state.items.filter((item) => item.needs_attention).map((item) => ({
			item_key: item.item_key,
			title: item.title,
			attention_reason_codes: [...item.attention_reason_codes],
			attention_reasons: [...item.attention_reasons],
			source_summaries: collectSourceSummariesForItem({
				item,
				sourceSummariesById,
				errors: payload.errors
			})
		})).sort((left, right) => {
			const byReasons = compareAttentionReasonCodes(left.attention_reason_codes, right.attention_reason_codes);
			if (byReasons !== 0) return byReasons;
			return left.item_key.localeCompare(right.item_key);
		});
		return payload.schemas.parseCommandOutput("attention", entries);
	} };
}
//#endregion
//#region src/vendor/backlog-engineer/core/replay-pipeline.ts
var DERIVED_TODO_TYPES = {
	review_source_change: "source_changed",
	review_dependency_change: "dependency_changed",
	review_context_change: "context_changed"
};
function dedupeStable(values, getKey) {
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const value of values) {
		const key = getKey(value);
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(value);
	}
	return result;
}
function deepEqual$2(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}
function cloneState$2(value) {
	return structuredClone(value);
}
function mergeGlossary(payload) {
	const result = [...payload.current];
	const byTerm = new Map(result.map((entry, index) => [entry.term, index]));
	for (const entry of payload.incoming) {
		const index = byTerm.get(entry.term);
		if (index === void 0) {
			byTerm.set(entry.term, result.length);
			result.push(entry);
			continue;
		}
		const existing = result[index];
		if (!existing) continue;
		if (existing.definition !== entry.definition) throw payload.errors.create("BE_CONTEXT_CONFLICT_GLOSSARY", void 0, { details: { term: entry.term } });
		result[index] = {
			...existing,
			aliases: dedupeStable([...existing.aliases, ...entry.aliases], (value) => value)
		};
	}
	return result;
}
function mergeUniqueByKey(payload) {
	const result = [...payload.current];
	const byKey = /* @__PURE__ */ new Map();
	for (const [index, entry] of result.entries()) byKey.set(String(entry[payload.key]), index);
	for (const entry of payload.incoming) {
		const keyValue = String(entry[payload.key]);
		const existingIndex = byKey.get(keyValue);
		if (existingIndex === void 0) {
			byKey.set(keyValue, result.length);
			result.push(entry);
			continue;
		}
		const existing = result[existingIndex];
		if (!deepEqual$2(existing, entry)) throw payload.errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: {
			key: keyValue,
			key_field: String(payload.key)
		} });
	}
	return result;
}
function mergeAppendUnique(current, incoming) {
	const result = [...current];
	for (const entry of incoming) {
		if (result.some((candidate) => deepEqual$2(candidate, entry))) continue;
		result.push(entry);
	}
	return result;
}
function mergePacketContextOnly(payload) {
	const next = cloneState$2(payload.state);
	const current = next.context;
	const incoming = payload.packet.context;
	const keyStrategy = Object.keys(current.key_strategy).length === 0 ? incoming.key_strategy : deepEqual$2(current.key_strategy, incoming.key_strategy) ? current.key_strategy : (() => {
		throw payload.errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: { key_field: "key_strategy" } });
	})();
	next.context = {
		glossary: mergeGlossary({
			current: current.glossary,
			incoming: incoming.glossary,
			errors: payload.errors
		}),
		key_strategy: keyStrategy,
		target_system: mergeAppendUnique(current.target_system, incoming.target_system),
		as_built: mergeAppendUnique(current.as_built, incoming.as_built),
		claims: mergeUniqueByKey({
			current: current.claims,
			incoming: incoming.claims,
			key: "claim_key",
			errors: payload.errors
		}),
		contracts: mergeUniqueByKey({
			current: current.contracts,
			incoming: incoming.contracts,
			key: "contract_key",
			errors: payload.errors
		}),
		data_domains: mergeUniqueByKey({
			current: current.data_domains,
			incoming: incoming.data_domains,
			key: "data_domain_key",
			errors: payload.errors
		}),
		quality_attributes: mergeUniqueByKey({
			current: current.quality_attributes,
			incoming: incoming.quality_attributes,
			key: "quality_attribute_key",
			errors: payload.errors
		}),
		policy_decisions: mergeUniqueByKey({
			current: current.policy_decisions,
			incoming: incoming.policy_decisions,
			key: "policy_decision_key",
			errors: payload.errors
		})
	};
	return next;
}
function toStateItem(item) {
	return {
		...item,
		reverse_dependency_keys: [],
		open_todo_ids: [],
		needs_attention: false,
		attention_reason_codes: [],
		attention_reasons: [],
		ready_for_next_step: false
	};
}
function validateReferentialIntegrity(payload) {
	const itemKeys = new Set(payload.state.items.map((item) => item.item_key));
	const claimKeys = new Set(payload.state.context.claims.map((claim) => claim.claim_key));
	const contractKeys = new Set(payload.state.context.contracts.map((contract) => contract.contract_key));
	const dataDomainKeys = new Set(payload.state.context.data_domains.map((dataDomain) => dataDomain.data_domain_key));
	const qualityAttributeKeys = new Set(payload.state.context.quality_attributes.map((qualityAttribute) => qualityAttribute.quality_attribute_key));
	const policyDecisionKeys = new Set(payload.state.context.policy_decisions.map((policyDecision) => policyDecision.policy_decision_key));
	for (const item of payload.state.items) {
		for (const dependencyKey of item.depends_on_keys) if (!itemKeys.has(dependencyKey) || dependencyKey === item.item_key) throw payload.errors.create("BE_DEPENDENCY_NOT_FOUND", void 0, { details: {
			item_key: item.item_key,
			dependency_key: dependencyKey
		} });
		for (const claimKey of item.claim_keys) if (!claimKeys.has(claimKey)) throw payload.errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: {
			item_key: item.item_key,
			claim_key: claimKey
		} });
		for (const contractKey of item.contract_keys) if (!contractKeys.has(contractKey)) throw payload.errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: {
			item_key: item.item_key,
			contract_key: contractKey
		} });
		for (const dataDomainKey of item.data_domain_keys) if (!dataDomainKeys.has(dataDomainKey)) throw payload.errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: {
			item_key: item.item_key,
			data_domain_key: dataDomainKey
		} });
		for (const qualityAttributeKey of item.quality_attribute_keys) if (!qualityAttributeKeys.has(qualityAttributeKey)) throw payload.errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: {
			item_key: item.item_key,
			quality_attribute_key: qualityAttributeKey
		} });
		for (const policyDecisionKey of item.policy_decision_keys) if (!policyDecisionKeys.has(policyDecisionKey)) throw payload.errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: {
			item_key: item.item_key,
			policy_decision_key: policyDecisionKey
		} });
	}
	for (const qualityAttribute of payload.state.context.quality_attributes) for (const itemKey of qualityAttribute.applies_to_item_keys) if (!itemKeys.has(itemKey)) throw payload.errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: {
		quality_attribute_key: qualityAttribute.quality_attribute_key,
		item_key: itemKey
	} });
	for (const policyDecision of payload.state.context.policy_decisions) for (const itemKey of policyDecision.related_item_keys) if (!itemKeys.has(itemKey)) throw payload.errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: {
		policy_decision_key: policyDecision.policy_decision_key,
		item_key: itemKey
	} });
}
function replaceFields(target, fields) {
	Object.assign(target, fields);
}
function appendUniqueValues(target, field, values) {
	const current = target[field];
	if (!Array.isArray(current)) return;
	target[field] = dedupeStable([...current, ...values], (value) => String(value));
}
function removeValues(target, field, values) {
	const current = target[field];
	if (!Array.isArray(current)) return;
	const valueSet = new Set(values);
	target[field] = current.filter((value) => !valueSet.has(String(value)));
}
function removeTodosFromState(payload) {
	const next = cloneState$2(payload.state);
	const todoIds = new Set(payload.todoIds);
	const ownedTodoIds = new Set(next.todos.filter((todo) => todo.item_key === payload.itemKey).map((todo) => todo.todo_id));
	const removableTodoIds = /* @__PURE__ */ new Set();
	for (const todoId of todoIds) {
		if (!ownedTodoIds.has(todoId)) {
			if (payload.missingTodoPolicy === "ignore") continue;
			throw payload.errors.create("BE_TODO_NOT_FOUND", void 0, { details: {
				item_key: payload.itemKey,
				todo_id: todoId
			} });
		}
		removableTodoIds.add(todoId);
	}
	next.todos = next.todos.filter((todo) => !removableTodoIds.has(todo.todo_id));
	return next;
}
function cleanupRemovedItemReferences$1(state, removedItemKeys) {
	const next = cloneState$2(state);
	next.items = next.items.filter((item) => !removedItemKeys.has(item.item_key)).map((item) => ({
		...item,
		depends_on_keys: item.depends_on_keys.filter((itemKey) => !removedItemKeys.has(itemKey))
	}));
	next.todos = next.todos.filter((todo) => !removedItemKeys.has(todo.item_key));
	next.context.quality_attributes = next.context.quality_attributes.map((qualityAttribute) => ({
		...qualityAttribute,
		applies_to_item_keys: qualityAttribute.applies_to_item_keys.filter((itemKey) => !removedItemKeys.has(itemKey))
	}));
	next.context.policy_decisions = next.context.policy_decisions.map((policyDecision) => ({
		...policyDecision,
		related_item_keys: policyDecision.related_item_keys.filter((itemKey) => !removedItemKeys.has(itemKey))
	}));
	return next;
}
function removeSourceIds(values, sourceId) {
	return values.filter((value) => value !== sourceId);
}
function removeSourceReferencesFromState(payload) {
	const next = cloneState$2(payload.state);
	const itemKeys = new Set(next.items.map((item) => item.item_key));
	const affectedItemKeys = new Set(payload.affectedItemKeys);
	for (const itemKey of affectedItemKeys) {
		if (itemKeys.has(itemKey)) continue;
		throw payload.errors.create("BE_PATCH_TARGET_NOT_FOUND", void 0, { details: {
			item_key: itemKey,
			source_id: payload.sourceId
		} });
	}
	next.items = next.items.map((item) => {
		if (!affectedItemKeys.has(item.item_key)) return item;
		return {
			...item,
			origin_source_ids: removeSourceIds(item.origin_source_ids, payload.sourceId),
			specification_source_ids: removeSourceIds(item.specification_source_ids, payload.sourceId),
			plan_source_ids: removeSourceIds(item.plan_source_ids, payload.sourceId),
			implementation_source_ids: removeSourceIds(item.implementation_source_ids, payload.sourceId),
			test_source_ids: removeSourceIds(item.test_source_ids, payload.sourceId)
		};
	});
	next.context.claims = next.context.claims.map((claim) => ({
		...claim,
		source_ids: removeSourceIds(claim.source_ids, payload.sourceId)
	}));
	next.context.quality_attributes = next.context.quality_attributes.map((qualityAttribute) => ({
		...qualityAttribute,
		source_ids: removeSourceIds(qualityAttribute.source_ids, payload.sourceId)
	}));
	next.context.policy_decisions = next.context.policy_decisions.map((policyDecision) => ({
		...policyDecision,
		source_ids: removeSourceIds(policyDecision.source_ids, payload.sourceId)
	}));
	return next;
}
function sortItems(items) {
	return [...items].sort((left, right) => left.item_key.localeCompare(right.item_key));
}
function sortTodos$1(todos) {
	return [...todos].sort((left, right) => left.todo_id.localeCompare(right.todo_id));
}
function createPatchReplayFailedError(payload) {
	return payload.errors.create("BE_REBUILD_REPLAY_FAILED", payload.operation ? "Backlog rebuild failed while replaying a canonical patch operation." : "Backlog rebuild failed after replaying a canonical patch.", {
		details: {
			artifact_kind: "patch",
			canonical_path: payload.replayContext.canonicalPath,
			patch_id: payload.patch.metadata.patch_id,
			patch_kind: payload.replayContext.kind,
			apply_index: payload.replayContext.applyIndex,
			sequence: payload.replayContext.sequence,
			...payload.operation ? {
				operation_index: payload.operationIndex ?? null,
				operation_action: payload.operation.action,
				..."item_key" in payload.operation ? { item_key: payload.operation.item_key } : {
					source_id: payload.operation.source_id,
					affected_item_keys: payload.operation.affected_item_keys
				}
			} : {},
			...payload.errors.isBacklogError(payload.error) ? {
				original_code: payload.error.code,
				original_message: payload.error.message
			} : payload.error instanceof Error ? { original_message: payload.error.message } : {}
		},
		hint: "Inspect the named canonical patch artifact. Do not repair replay failures by manually editing state.json or applied.json.",
		cause: payload.error
	});
}
function synchronizeOpenTodoIds(payload) {
	const next = cloneState$2(payload.state);
	const todoIdsByItem = /* @__PURE__ */ new Map();
	for (const todo of sortTodos$1(next.todos)) {
		const ownedTodoIds = todoIdsByItem.get(todo.item_key) ?? [];
		ownedTodoIds.push(todo.todo_id);
		todoIdsByItem.set(todo.item_key, ownedTodoIds);
	}
	next.items = next.items.map((item) => ({
		...item,
		open_todo_ids: [...todoIdsByItem.get(item.item_key) ?? []]
	}));
	return payload.schemas.parseStateFile(next);
}
function toAttentionReason(todo, code) {
	if (code === "dependency_changed") {
		const relatedItemKey = todo.related_item_keys[0];
		return relatedItemKey ? `Dependency changed: review ${relatedItemKey}.` : "Dependency changed: review the task.";
	}
	if (code === "source_changed") {
		const relatedSource = todo.related_sources[0];
		return relatedSource ? `Source changed: review ${relatedSource.source_label}.` : "Source changed: review the task.";
	}
	return "Context changed: review the task.";
}
function applyPacketReplay(payload) {
	const merged = mergePacketContextOnly(payload);
	const existingKeys = new Set(merged.items.map((item) => item.item_key));
	const nextItems = [...merged.items];
	for (const item of payload.packet.items) {
		if (existingKeys.has(item.item_key)) throw payload.errors.create("BE_PACKET_ITEM_ALREADY_EXISTS", void 0, { details: { item_key: item.item_key } });
		existingKeys.add(item.item_key);
		nextItems.push(toStateItem(item));
	}
	const next = {
		...merged,
		items: nextItems
	};
	validateReferentialIntegrity({
		state: next,
		errors: payload.errors
	});
	return next;
}
function applyPacketItemsOnly(payload) {
	const next = cloneState$2(payload.state);
	const existingKeys = new Set(next.items.map((item) => item.item_key));
	for (const item of payload.items) {
		if (existingKeys.has(item.item_key)) throw payload.errors.create("BE_PACKET_ITEM_ALREADY_EXISTS", void 0, { details: { item_key: item.item_key } });
		existingKeys.add(item.item_key);
		next.items.push(toStateItem(item));
	}
	validateReferentialIntegrity({
		state: next,
		errors: payload.errors
	});
	return next;
}
function applyPatchReplay(payload) {
	let next = cloneState$2(payload.state);
	const removedItemKeys = /* @__PURE__ */ new Set();
	for (const [operationIndex, operation] of payload.patch.operations.entries()) try {
		if (operation.action === "remove_source_references") {
			next = removeSourceReferencesFromState({
				state: next,
				sourceId: operation.source_id,
				affectedItemKeys: operation.affected_item_keys,
				errors: payload.errors
			});
			continue;
		}
		const targetItem = next.items.find((item) => item.item_key === operation.item_key);
		if (!targetItem) throw payload.errors.create("BE_PATCH_TARGET_NOT_FOUND", void 0, { details: { item_key: operation.item_key } });
		switch (operation.action) {
			case "replace_fields":
				replaceFields(targetItem, operation.fields);
				break;
			case "append_unique":
				appendUniqueValues(targetItem, operation.field, operation.values);
				break;
			case "remove_values":
				removeValues(targetItem, operation.field, operation.values);
				break;
			case "remove_todo":
				next = removeTodosFromState({
					state: next,
					itemKey: operation.item_key,
					todoIds: operation.todo_ids,
					errors: payload.errors,
					missingTodoPolicy: payload.missingTodoPolicy ?? "error"
				});
				break;
			case "remove_item":
				removedItemKeys.add(operation.item_key);
				break;
			default: {
				const exhaustiveCheck = operation;
				throw payload.errors.create("BE_PATCH_OPERATION_INVALID", void 0, { details: { operation: exhaustiveCheck } });
			}
		}
	} catch (error) {
		if (!payload.replayContext) throw error;
		throw createPatchReplayFailedError({
			errors: payload.errors,
			error,
			patch: payload.patch,
			operation,
			operationIndex,
			replayContext: payload.replayContext
		});
	}
	if (removedItemKeys.size > 0) next = cleanupRemovedItemReferences$1(next, removedItemKeys);
	try {
		validateReferentialIntegrity({
			state: next,
			errors: payload.errors
		});
	} catch (error) {
		if (!payload.replayContext) throw error;
		throw createPatchReplayFailedError({
			errors: payload.errors,
			error,
			patch: payload.patch,
			replayContext: payload.replayContext
		});
	}
	return next;
}
function validateSourceRegistryReferences(payload) {
	const ensureSourceExists = (sourceId, details) => {
		if (payload.availableSourceIds.has(sourceId)) return;
		throw payload.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, { details: {
			...details,
			source_id: sourceId,
			reason: "Canonical backlog references source_id that is missing from sources.json."
		} });
	};
	for (const item of payload.state.items) {
		for (const sourceId of item.origin_source_ids) ensureSourceExists(sourceId, {
			item_key: item.item_key,
			field: "origin_source_ids"
		});
		for (const sourceId of item.specification_source_ids) ensureSourceExists(sourceId, {
			item_key: item.item_key,
			field: "specification_source_ids"
		});
		for (const sourceId of item.plan_source_ids) ensureSourceExists(sourceId, {
			item_key: item.item_key,
			field: "plan_source_ids"
		});
		for (const sourceId of item.implementation_source_ids) ensureSourceExists(sourceId, {
			item_key: item.item_key,
			field: "implementation_source_ids"
		});
		for (const sourceId of item.test_source_ids) ensureSourceExists(sourceId, {
			item_key: item.item_key,
			field: "test_source_ids"
		});
	}
	for (const claim of payload.state.context.claims) for (const sourceId of claim.source_ids) ensureSourceExists(sourceId, {
		claim_key: claim.claim_key,
		field: "source_ids"
	});
	for (const qualityAttribute of payload.state.context.quality_attributes) for (const sourceId of qualityAttribute.source_ids) ensureSourceExists(sourceId, {
		quality_attribute_key: qualityAttribute.quality_attribute_key,
		field: "source_ids"
	});
	for (const policyDecision of payload.state.context.policy_decisions) for (const sourceId of policyDecision.source_ids) ensureSourceExists(sourceId, {
		policy_decision_key: policyDecision.policy_decision_key,
		field: "source_ids"
	});
}
function recomputeDerivedState(payload) {
	const next = cloneState$2(payload.state);
	const reverseDependencies = /* @__PURE__ */ new Map();
	for (const item of next.items) reverseDependencies.set(item.item_key, []);
	for (const item of next.items) for (const dependencyKey of item.depends_on_keys) {
		const dependents = reverseDependencies.get(dependencyKey);
		if (dependents) dependents.push(item.item_key);
	}
	const todoIdsByItem = /* @__PURE__ */ new Map();
	for (const todo of sortTodos$1(next.todos)) {
		const ownedTodoIds = todoIdsByItem.get(todo.item_key) ?? [];
		ownedTodoIds.push(todo.todo_id);
		todoIdsByItem.set(todo.item_key, ownedTodoIds);
	}
	const stageRank = {
		defined: 0,
		specified: 1,
		planned: 2,
		implemented: 3
	};
	next.items = sortItems(next.items).map((item) => {
		const itemTodos = next.todos.filter((todo) => todo.item_key === item.item_key);
		const attentionReasonCodes = [];
		const attentionReasons = [];
		for (const todoType of [
			"review_source_change",
			"review_dependency_change",
			"review_context_change"
		]) {
			const todo = itemTodos.find((candidate) => candidate.type === todoType);
			if (!todo) continue;
			const code = DERIVED_TODO_TYPES[todoType];
			attentionReasonCodes.push(code);
			attentionReasons.push(toAttentionReason(todo, code));
		}
		if (item.gaps.length > 0) {
			attentionReasonCodes.push("gaps");
			attentionReasons.push("Gap present: the task is blocked until missing input is clarified.");
		}
		const dependencyReady = item.depends_on_keys.every((dependencyKey) => {
			const dependency = next.items.find((candidate) => candidate.item_key === dependencyKey);
			if (!dependency) return false;
			return dependency.gaps.length === 0 && (todoIdsByItem.get(dependency.item_key)?.length ?? 0) === 0 && stageRank[dependency.delivery_state] >= stageRank[item.delivery_state];
		});
		return {
			...item,
			reverse_dependency_keys: [...reverseDependencies.get(item.item_key) ?? []].sort((left, right) => left.localeCompare(right)),
			open_todo_ids: [...todoIdsByItem.get(item.item_key) ?? []],
			needs_attention: attentionReasonCodes.length > 0,
			attention_reason_codes: attentionReasonCodes,
			attention_reasons: attentionReasons,
			ready_for_next_step: item.delivery_state !== "implemented" && item.gaps.length === 0 && (todoIdsByItem.get(item.item_key)?.length ?? 0) === 0 && dependencyReady
		};
	});
	next.todos = sortTodos$1(next.todos).filter((todo) => next.items.some((item) => item.item_key === todo.item_key));
	return payload.schemas.parseStateFile(next);
}
//#endregion
//#region src/vendor/backlog-engineer/core/context-service.ts
function deepEqual$1(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}
function compareByKey(current, incoming, keyField, errors) {
	const currentByKey = new Map(current.map((entry) => [String(entry[keyField]), entry]));
	for (const entry of incoming) {
		const key = String(entry[keyField]);
		const existing = currentByKey.get(key);
		if (!existing) continue;
		if (!deepEqual$1(existing, entry)) throw errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: {
			key,
			key_field: String(keyField)
		} });
	}
}
function diffContextKeys(before, after) {
	const changed = [];
	if (!deepEqual$1(before.glossary, after.glossary)) changed.push("glossary");
	if (!deepEqual$1(before.key_strategy, after.key_strategy)) changed.push("key_strategy");
	if (!deepEqual$1(before.target_system, after.target_system)) changed.push("target_system");
	if (!deepEqual$1(before.as_built, after.as_built)) changed.push("as_built");
	if (!deepEqual$1(before.claims, after.claims)) changed.push("claims");
	if (!deepEqual$1(before.contracts, after.contracts)) changed.push("contracts");
	if (!deepEqual$1(before.data_domains, after.data_domains)) changed.push("data_domains");
	if (!deepEqual$1(before.quality_attributes, after.quality_attributes)) changed.push("quality_attributes");
	if (!deepEqual$1(before.policy_decisions, after.policy_decisions)) changed.push("policy_decisions");
	return changed;
}
function createContextService(payload) {
	return {
		mergePacketContext({ state, packet }) {
			const nextState = mergePacketContextOnly({
				state,
				packet,
				errors: payload.errors
			});
			return {
				state: nextState,
				changedContextKeys: diffContextKeys(state.context, nextState.context)
			};
		},
		assertNoGlossaryConflicts({ state, packet }) {
			const glossaryByTerm = new Map(state.context.glossary.map((entry) => [entry.term, entry.definition]));
			for (const entry of packet.context.glossary) {
				const existingDefinition = glossaryByTerm.get(entry.term);
				if (existingDefinition === void 0 || existingDefinition === entry.definition) continue;
				throw payload.errors.create("BE_CONTEXT_CONFLICT_GLOSSARY", void 0, { details: { term: entry.term } });
			}
		},
		assertImmutableContextEntities({ state, packet }) {
			if (Object.keys(state.context.key_strategy).length > 0 && !deepEqual$1(state.context.key_strategy, packet.context.key_strategy)) throw payload.errors.create("BE_CONTEXT_CONFLICT_ENTITY", void 0, { details: { key_field: "key_strategy" } });
			compareByKey(state.context.claims, packet.context.claims, "claim_key", payload.errors);
			compareByKey(state.context.contracts, packet.context.contracts, "contract_key", payload.errors);
			compareByKey(state.context.data_domains, packet.context.data_domains, "data_domain_key", payload.errors);
			compareByKey(state.context.quality_attributes, packet.context.quality_attributes, "quality_attribute_key", payload.errors);
			compareByKey(state.context.policy_decisions, packet.context.policy_decisions, "policy_decision_key", payload.errors);
		}
	};
}
//#endregion
//#region src/vendor/backlog-engineer/core/derived-state-service.ts
function createDerivedStateService(payload) {
	return {
		recomputeAll(state) {
			return recomputeDerivedState({
				schemas: payload.schemas,
				state
			});
		},
		recomputeItems({ state }) {
			return recomputeDerivedState({
				schemas: payload.schemas,
				state
			});
		},
		computeItemState({ state, itemKey }) {
			const item = recomputeDerivedState({
				schemas: payload.schemas,
				state
			}).items.find((candidate) => candidate.item_key === itemKey);
			if (!item) throw payload.errors.create("BE_ITEM_NOT_FOUND", void 0, { details: { item_key: itemKey } });
			return {
				needs_attention: item.needs_attention,
				attention_reason_codes: item.attention_reason_codes,
				attention_reasons: item.attention_reasons,
				ready_for_next_step: item.ready_for_next_step
			};
		}
	};
}
//#endregion
//#region src/vendor/backlog-engineer/core/graph-service.ts
function uniqueSorted(values) {
	return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
function collectRemovedTodoIds(before, after) {
	const remainingTodoIds = new Set(after.todos.map((todo) => todo.todo_id));
	return uniqueSorted(before.todos.filter((todo) => !remainingTodoIds.has(todo.todo_id)).map((todo) => todo.todo_id));
}
function buildDependencyIndex(state) {
	return new Map(state.items.map((item) => [item.item_key, [...item.depends_on_keys].sort((a, b) => a.localeCompare(b))]));
}
function buildReverseDependencyIndex(state) {
	const reverse = /* @__PURE__ */ new Map();
	for (const item of state.items) reverse.set(item.item_key, /* @__PURE__ */ new Set());
	for (const item of state.items) for (const dependencyKey of item.depends_on_keys) {
		const dependents = reverse.get(dependencyKey);
		if (dependents) dependents.add(item.item_key);
	}
	return new Map([...reverse.entries()].map(([itemKey, dependents]) => [itemKey, [...dependents].sort((left, right) => left.localeCompare(right))]));
}
function resolveItemSubgraph(payload) {
	const reverse = buildReverseDependencyIndex(payload.state);
	const visited = /* @__PURE__ */ new Set();
	const stack = [...payload.rootItemKeys].sort((left, right) => right.localeCompare(left));
	while (stack.length > 0) {
		const itemKey = stack.pop();
		if (!itemKey || visited.has(itemKey)) continue;
		visited.add(itemKey);
		for (const dependentKey of reverse.get(itemKey) ?? []) stack.push(dependentKey);
	}
	return [...visited].sort((left, right) => left.localeCompare(right));
}
function cleanupRemovedItemReferences(payload) {
	if (payload.removedItemKeys.length === 0) return payload.state;
	const removedItemKeys = new Set(payload.removedItemKeys);
	const nextState = structuredClone(payload.state);
	nextState.items = nextState.items.filter((item) => !removedItemKeys.has(item.item_key)).map((item) => ({
		...item,
		depends_on_keys: item.depends_on_keys.filter((itemKey) => !removedItemKeys.has(itemKey))
	}));
	nextState.todos = nextState.todos.filter((todo) => !removedItemKeys.has(todo.item_key));
	nextState.context.quality_attributes = nextState.context.quality_attributes.map((qualityAttribute) => ({
		...qualityAttribute,
		applies_to_item_keys: qualityAttribute.applies_to_item_keys.filter((itemKey) => !removedItemKeys.has(itemKey))
	}));
	nextState.context.policy_decisions = nextState.context.policy_decisions.map((policyDecision) => ({
		...policyDecision,
		related_item_keys: policyDecision.related_item_keys.filter((itemKey) => !removedItemKeys.has(itemKey))
	}));
	return nextState;
}
function createGraphService(payload) {
	return {
		assertPacketAddsOnlyNewItems({ state, packet }) {
			const existingItemKeys = new Set(state.items.map((item) => item.item_key));
			for (const item of packet.items) {
				if (!existingItemKeys.has(item.item_key)) continue;
				throw payload.errors.create("BE_PACKET_ITEM_ALREADY_EXISTS", void 0, { details: { item_key: item.item_key } });
			}
		},
		applyPacketItems({ state, packet }) {
			const addedItemKeys = packet.items.map((item) => item.item_key);
			const nextState = applyPacketItemsOnly({
				state,
				items: packet.items,
				errors: payload.errors
			});
			return {
				state: synchronizeOpenTodoIds({
					schemas: payload.schemas,
					state: nextState
				}),
				addedItemKeys: uniqueSorted(addedItemKeys)
			};
		},
		applyPatchOperations({ state, patch }) {
			const removedItemKeys = uniqueSorted(patch.operations.filter((operation) => operation.action === "remove_item").map((operation) => operation.item_key));
			const updatedItemKeys = uniqueSorted(patch.operations.filter((operation) => operation.action !== "remove_item" && "item_key" in operation).map((operation) => operation.item_key));
			const nextState = applyPatchReplay({
				state,
				patch,
				errors: payload.errors
			});
			return {
				state: synchronizeOpenTodoIds({
					schemas: payload.schemas,
					state: nextState
				}),
				updatedItemKeys,
				removedItemKeys,
				removedTodoIds: collectRemovedTodoIds(state, nextState)
			};
		},
		buildDependencyIndex,
		buildReverseDependencyIndex,
		resolveItemSubgraph,
		cleanupRemovedItemReferences
	};
}
//#endregion
//#region src/vendor/backlog-engineer/core/items-service.ts
function createItemsService(payload) {
	return { getItems({ state, itemKeys, registry }) {
		const itemsByKey = new Map(state.items.map((item) => [item.item_key, item]));
		const sourceSummariesById = createSourceSummaryLookup(registry);
		const cards = itemKeys.map((itemKey) => {
			const item = itemsByKey.get(itemKey);
			if (!item) throw payload.errors.create("BE_ITEM_NOT_FOUND", void 0, { details: { item_key: itemKey } });
			return {
				item: toPacketItem(item),
				reverse_dependency_keys: [...item.reverse_dependency_keys],
				source_summaries: collectSourceSummariesForItem({
					item,
					sourceSummariesById,
					errors: payload.errors
				}),
				context: buildItemContextSummary(item),
				computed_state: {
					needs_attention: item.needs_attention,
					attention_reason_codes: [...item.attention_reason_codes],
					attention_reasons: [...item.attention_reasons],
					ready_for_next_step: item.ready_for_next_step
				},
				todo: collectItemTodos({
					state,
					itemKey
				})
			};
		});
		return payload.schemas.parseCommandOutput("items", cards);
	} };
}
//#endregion
//#region src/vendor/backlog-engineer/core/mutation-service.ts
function sortKeys(values) {
	return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
function cloneState$1(value) {
	return structuredClone(value);
}
function collectItemSourceIds$3(item) {
	return new Set([
		...item.origin_source_ids,
		...item.specification_source_ids,
		...item.plan_source_ids,
		...item.implementation_source_ids,
		...item.test_source_ids
	]);
}
function buildSourceSummaryLookup(registry) {
	return new Map(registry.sources.map((source) => [source.source_id, {
		source_id: source.source_id,
		source_label: source.source_label
	}]));
}
function resolveSourceIdsFromScope(payload) {
	const { scope } = payload;
	if (scope.kind === "all" || scope.kind === "item") return [];
	if (scope.kind === "source_id") {
		if (!payload.registry.sources.some((source) => source.source_id === scope.source_id)) throw payload.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: { source_id: scope.source_id } });
		return [scope.source_id];
	}
	if (scope.kind === "source_label") {
		const source = payload.registry.sources.find((candidate) => candidate.source_label === scope.source_label);
		if (!source) throw payload.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: { source_label: scope.source_label } });
		return [source.source_id];
	}
	const source = payload.registry.sources.find((candidate) => candidate.path === scope.source_path || candidate.source_label === scope.source_path);
	if (!source) throw payload.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: { source_path: scope.source_path } });
	return [source.source_id];
}
function collectLinkedItemKeysBySourceIds(payload) {
	const selectedSourceIds = new Set(payload.sourceIds);
	return sortKeys(payload.state.items.filter((item) => {
		const itemSourceIds = collectItemSourceIds$3(item);
		return [...selectedSourceIds].some((sourceId) => itemSourceIds.has(sourceId));
	}).map((item) => item.item_key));
}
function collectPacketContextAffectedExistingItems(payload) {
	const existingItemKeys = new Set(payload.beforeState.items.map((item) => item.item_key));
	const existingQualityAttributeKeys = new Set(payload.beforeState.context.quality_attributes.map((qualityAttribute) => qualityAttribute.quality_attribute_key));
	const existingPolicyDecisionKeys = new Set(payload.beforeState.context.policy_decisions.map((policyDecision) => policyDecision.policy_decision_key));
	const affected = /* @__PURE__ */ new Set();
	for (const qualityAttribute of payload.packet.context.quality_attributes) {
		if (existingQualityAttributeKeys.has(qualityAttribute.quality_attribute_key)) continue;
		for (const itemKey of qualityAttribute.applies_to_item_keys) if (existingItemKeys.has(itemKey)) affected.add(itemKey);
	}
	for (const policyDecision of payload.packet.context.policy_decisions) {
		if (existingPolicyDecisionKeys.has(policyDecision.policy_decision_key)) continue;
		for (const itemKey of policyDecision.related_item_keys) if (existingItemKeys.has(itemKey)) affected.add(itemKey);
	}
	return sortKeys(affected);
}
function collectDownstreamItemKeys(graph, state, rootItemKeys) {
	const rootSet = new Set(rootItemKeys);
	return graph.resolveItemSubgraph({
		state,
		rootItemKeys: [...rootSet]
	}).filter((itemKey) => !rootSet.has(itemKey));
}
function collectChangedSourceIdsForItems(payload) {
	const beforeByKey = new Map(payload.beforeState.items.map((item) => [item.item_key, item]));
	const afterByKey = new Map(payload.afterState.items.map((item) => [item.item_key, item]));
	const sourceIdsByItem = /* @__PURE__ */ new Map();
	for (const itemKey of sortKeys(payload.itemKeys)) {
		const beforeItem = beforeByKey.get(itemKey);
		const afterItem = afterByKey.get(itemKey);
		const sourceIds = sortKeys(new Set([...beforeItem ? [...collectItemSourceIds$3(beforeItem)] : [], ...afterItem ? [...collectItemSourceIds$3(afterItem)] : []]));
		sourceIdsByItem.set(itemKey, sourceIds);
	}
	return sourceIdsByItem;
}
function collectPatchFieldChanges(patch) {
	const changedItemKeys = /* @__PURE__ */ new Set();
	const sourceChangedItemKeys = /* @__PURE__ */ new Set();
	const contextChangedItemKeys = /* @__PURE__ */ new Set();
	const sourceFieldNames = new Set([
		"origin_source_ids",
		"specification_source_ids",
		"plan_source_ids",
		"implementation_source_ids",
		"test_source_ids"
	]);
	const contextFieldNames = new Set([
		"claim_keys",
		"contract_keys",
		"data_domain_keys",
		"quality_attribute_keys",
		"policy_decision_keys"
	]);
	for (const operation of patch.operations) {
		if (operation.action === "remove_todo" || operation.action === "remove_item" || operation.action === "remove_source_references") continue;
		changedItemKeys.add(operation.item_key);
		if (operation.action === "replace_fields") {
			for (const fieldName of Object.keys(operation.fields)) {
				if (sourceFieldNames.has(fieldName)) sourceChangedItemKeys.add(operation.item_key);
				if (contextFieldNames.has(fieldName)) contextChangedItemKeys.add(operation.item_key);
			}
			continue;
		}
		if (sourceFieldNames.has(operation.field)) sourceChangedItemKeys.add(operation.item_key);
		if (contextFieldNames.has(operation.field)) contextChangedItemKeys.add(operation.item_key);
	}
	return {
		changedItemKeys: sortKeys(changedItemKeys),
		sourceChangedItemKeys: sortKeys(sourceChangedItemKeys),
		contextChangedItemKeys: sortKeys(contextChangedItemKeys)
	};
}
function mapTodoIdsToItemKeys(payload) {
	if (payload.todoIds.length === 0) return [];
	const todoById = new Map(payload.state.todos.map((todo) => [todo.todo_id, todo.item_key]));
	return sortKeys(payload.todoIds.flatMap((todoId) => {
		const itemKey = todoById.get(todoId);
		return itemKey ? [itemKey] : [];
	}));
}
function assertPatchTodoOperationsAreMutationSafe(payload) {
	const todosById = new Map(payload.state.todos.map((todo) => [todo.todo_id, todo]));
	for (const operation of payload.patch.operations) {
		if (operation.action !== "remove_todo") continue;
		for (const todoId of operation.todo_ids) {
			const todo = todosById.get(todoId);
			if (!todo) continue;
			if ((todo.managed_by ?? "mutation") !== "refresh") continue;
			throw payload.errors.create("BE_TODO_REFRESH_MANAGED", void 0, {
				details: {
					item_key: operation.item_key,
					todo_id: todoId,
					todo_type: todo.type,
					managed_by: todo.managed_by ?? "refresh"
				},
				hint: "Refresh-managed review todo are cleared through scoped refresh, not patch-item. Re-run refresh after review; use patch-item only if the review changes backlog truth."
			});
		}
	}
}
function touchState(payload) {
	return payload.schemas.parseStateFile({
		...payload.state,
		updated_at: payload.updatedAt,
		...payload.refreshAt !== void 0 ? { last_refresh_at: payload.refreshAt } : {}
	});
}
function buildMutationNextCommands(payload) {
	const itemKeys = sortKeys([...payload.todoCreated, ...payload.todoUpdated]);
	if (itemKeys.length === 0) return [];
	return [{
		command: "attention",
		args: [],
		reason: payload.fallbackReason
	}, {
		command: "items",
		args: ["--item-keys", itemKeys.join(",")],
		reason: payload.itemsReason
	}];
}
function buildRefreshNextCommands(itemKeys) {
	const normalizedItemKeys = sortKeys(itemKeys);
	if (normalizedItemKeys.length === 0) return [];
	return [{
		command: "attention",
		args: [],
		reason: "Review tasks affected by refreshed source changes."
	}, {
		command: "items",
		args: ["--item-keys", normalizedItemKeys.join(",")],
		reason: "Inspect the full cards of tasks with refreshed review todo."
	}];
}
function sortChangedSources(changedSources) {
	return [...changedSources].sort((left, right) => {
		const labelCompare = left.source_label.localeCompare(right.source_label);
		if (labelCompare !== 0) return labelCompare;
		return left.source_id.localeCompare(right.source_id);
	});
}
function collectActiveSourceTodoItemKeys(payload) {
	const changedSourceIds = new Set(payload.changedSourceIds);
	return sortKeys(payload.state.items.filter((item) => {
		const itemSourceIds = collectItemSourceIds$3(item);
		return [...changedSourceIds].some((sourceId) => itemSourceIds.has(sourceId));
	}).map((item) => item.item_key));
}
function buildTodoSemanticKey(todo) {
	return [
		todo.item_key,
		todo.type,
		sortKeys(todo.related_sources.map((source) => source.source_id)).join(","),
		sortKeys(todo.related_item_keys).join(",")
	].join("|");
}
function removeTodosByType(payload) {
	const scopedItemKeys = new Set(payload.scopedItemKeys);
	const removedTodoIds = payload.state.todos.filter((todo) => {
		if (todo.type !== payload.todoType) return false;
		if (!scopedItemKeys.has(todo.item_key)) return false;
		if ((todo.managed_by ?? "mutation") !== "refresh") return false;
		if (!payload.isCleanupCandidate?.(todo)) return false;
		if (payload.allowedSemanticKeys?.has(buildTodoSemanticKey(todo))) return false;
		return true;
	}).map((todo) => todo.todo_id);
	if (removedTodoIds.length === 0) return {
		state: payload.state,
		removedTodoIds: []
	};
	const removalSet = new Set(removedTodoIds);
	const nextState = cloneState$1(payload.state);
	nextState.todos = nextState.todos.filter((todo) => !removalSet.has(todo.todo_id));
	return {
		state: synchronizeOpenTodoIds({
			schemas: payload.schemas,
			state: nextState
		}),
		removedTodoIds: sortKeys(removedTodoIds)
	};
}
function createMutationService(payload) {
	const assertKnownSourceReferences = (state, sourceRegistry) => {
		const sourceIds = new Set(sourceRegistry.sources.map((source) => source.source_id));
		const ensureKnownSource = (sourceId, details) => {
			if (sourceIds.has(sourceId)) return;
			throw payload.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: {
				...details,
				source_id: sourceId
			} });
		};
		for (const item of state.items) {
			for (const sourceId of item.origin_source_ids) ensureKnownSource(sourceId, {
				item_key: item.item_key,
				field: "origin_source_ids"
			});
			for (const sourceId of item.specification_source_ids) ensureKnownSource(sourceId, {
				item_key: item.item_key,
				field: "specification_source_ids"
			});
			for (const sourceId of item.plan_source_ids) ensureKnownSource(sourceId, {
				item_key: item.item_key,
				field: "plan_source_ids"
			});
			for (const sourceId of item.implementation_source_ids) ensureKnownSource(sourceId, {
				item_key: item.item_key,
				field: "implementation_source_ids"
			});
			for (const sourceId of item.test_source_ids) ensureKnownSource(sourceId, {
				item_key: item.item_key,
				field: "test_source_ids"
			});
		}
		for (const claim of state.context.claims) for (const sourceId of claim.source_ids) ensureKnownSource(sourceId, {
			claim_key: claim.claim_key,
			field: "source_ids"
		});
		for (const qualityAttribute of state.context.quality_attributes) for (const sourceId of qualityAttribute.source_ids) ensureKnownSource(sourceId, {
			quality_attribute_key: qualityAttribute.quality_attribute_key,
			field: "source_ids"
		});
		for (const policyDecision of state.context.policy_decisions) for (const sourceId of policyDecision.source_ids) ensureKnownSource(sourceId, {
			policy_decision_key: policyDecision.policy_decision_key,
			field: "source_ids"
		});
	};
	return {
		applyPacket({ state, packet, sourceRegistry, dryRun, packetId: _packetId }) {
			payload.context.assertNoGlossaryConflicts({
				state,
				packet
			});
			payload.context.assertImmutableContextEntities({
				state,
				packet
			});
			payload.graph.assertPacketAddsOnlyNewItems({
				state,
				packet
			});
			const existingAffectedItemKeys = collectPacketContextAffectedExistingItems({
				beforeState: state,
				packet
			});
			const mergedContext = payload.context.mergePacketContext({
				state,
				packet
			});
			const appliedItems = payload.graph.applyPacketItems({
				state: mergedContext.state,
				packet
			});
			assertKnownSourceReferences(appliedItems.state, sourceRegistry);
			let nextState = appliedItems.state;
			let createdTodoIds = [];
			let updatedTodoIds = [];
			if (existingAffectedItemKeys.length > 0) {
				const contextTodos = payload.todo.generateTodosForContextChange({
					state: nextState,
					changedItemKeys: existingAffectedItemKeys
				});
				const contextResult = payload.todo.createOrMergeTodos({
					state: nextState,
					todos: contextTodos
				});
				nextState = contextResult.state;
				createdTodoIds = [...createdTodoIds, ...contextResult.createdTodoIds];
				updatedTodoIds = [...updatedTodoIds, ...contextResult.updatedTodoIds];
				const downstreamItemKeys = collectDownstreamItemKeys(payload.graph, nextState, existingAffectedItemKeys);
				if (downstreamItemKeys.length > 0) {
					const dependencyTodos = payload.todo.generateTodosForDependencyChange({
						state: nextState,
						changedItemKeys: existingAffectedItemKeys,
						dependentItemKeys: downstreamItemKeys
					});
					const dependencyResult = payload.todo.createOrMergeTodos({
						state: nextState,
						todos: dependencyTodos
					});
					nextState = dependencyResult.state;
					createdTodoIds = [...createdTodoIds, ...dependencyResult.createdTodoIds];
					updatedTodoIds = [...updatedTodoIds, ...dependencyResult.updatedTodoIds];
				}
			}
			nextState = touchState({
				schemas: payload.schemas,
				state: payload.derivedState.recomputeAll(nextState),
				updatedAt: payload.clock.nowIsoUtc()
			});
			const todoCreated = mapTodoIdsToItemKeys({
				state: nextState,
				todoIds: createdTodoIds
			});
			const todoUpdated = mapTodoIdsToItemKeys({
				state: nextState,
				todoIds: updatedTodoIds
			});
			const summary = {
				state: nextState,
				dry_run: dryRun,
				counts: {
					added: appliedItems.addedItemKeys.length,
					removed: 0,
					todo_created: todoCreated.length,
					todo_updated: todoUpdated.length
				},
				added: appliedItems.addedItemKeys,
				removed: [],
				todo_created: todoCreated,
				todo_updated: todoUpdated,
				next_commands: buildMutationNextCommands({
					todoCreated,
					todoUpdated,
					fallbackReason: "Review existing tasks affected by newly introduced context.",
					itemsReason: "Inspect full cards of tasks that received review todo."
				})
			};
			return Promise.resolve(summary);
		},
		applyPatch({ state, patch, sourceRegistry, dryRun }) {
			const isRemoveItemPatch = patch.operations.every((operation) => operation.action === "remove_item");
			assertPatchTodoOperationsAreMutationSafe({
				state,
				patch,
				errors: payload.errors
			});
			const { changedItemKeys, sourceChangedItemKeys, contextChangedItemKeys } = collectPatchFieldChanges(patch);
			const graphResult = payload.graph.applyPatchOperations({
				state,
				patch
			});
			assertKnownSourceReferences(graphResult.state, sourceRegistry);
			let nextState = graphResult.state;
			let createdTodoIds = [];
			let updatedTodoIds = [];
			const removedTodoIds = [...graphResult.removedTodoIds];
			if (isRemoveItemPatch) {
				const downstreamItemKeys = collectDownstreamItemKeys(payload.graph, state, graphResult.removedItemKeys);
				if (downstreamItemKeys.length > 0) {
					const dependencyTodos = payload.todo.generateTodosForDependencyChange({
						state: nextState,
						changedItemKeys: graphResult.removedItemKeys,
						dependentItemKeys: downstreamItemKeys
					});
					const dependencyResult = payload.todo.createOrMergeTodos({
						state: nextState,
						todos: dependencyTodos
					});
					nextState = dependencyResult.state;
					createdTodoIds = [...createdTodoIds, ...dependencyResult.createdTodoIds];
					updatedTodoIds = [...updatedTodoIds, ...dependencyResult.updatedTodoIds];
				}
			} else {
				const downstreamItemKeys = changedItemKeys.length ? sortKeys(new Set([...collectDownstreamItemKeys(payload.graph, state, changedItemKeys), ...collectDownstreamItemKeys(payload.graph, nextState, changedItemKeys)])) : [];
				if (changedItemKeys.length > 0 && downstreamItemKeys.length > 0) {
					const dependencyTodos = payload.todo.generateTodosForDependencyChange({
						state: nextState,
						changedItemKeys,
						dependentItemKeys: downstreamItemKeys
					});
					const dependencyResult = payload.todo.createOrMergeTodos({
						state: nextState,
						todos: dependencyTodos
					});
					nextState = dependencyResult.state;
					createdTodoIds = [...createdTodoIds, ...dependencyResult.createdTodoIds];
					updatedTodoIds = [...updatedTodoIds, ...dependencyResult.updatedTodoIds];
				}
				if (contextChangedItemKeys.length > 0) {
					const contextTodos = payload.todo.generateTodosForContextChange({
						state: nextState,
						changedItemKeys: contextChangedItemKeys,
						affectedItemKeys: [...contextChangedItemKeys, ...downstreamItemKeys]
					});
					const contextResult = payload.todo.createOrMergeTodos({
						state: nextState,
						todos: contextTodos
					});
					nextState = contextResult.state;
					createdTodoIds = [...createdTodoIds, ...contextResult.createdTodoIds];
					updatedTodoIds = [...updatedTodoIds, ...contextResult.updatedTodoIds];
				}
				if (sourceChangedItemKeys.length > 0) {
					const sourceIdsByItem = collectChangedSourceIdsForItems({
						beforeState: state,
						afterState: nextState,
						itemKeys: sourceChangedItemKeys
					});
					for (const itemKey of sourceChangedItemKeys) {
						const sourceIds = sourceIdsByItem.get(itemKey) ?? [];
						if (sourceIds.length === 0) continue;
						const affectedItemKeys = sortKeys([
							itemKey,
							...collectDownstreamItemKeys(payload.graph, state, [itemKey]),
							...collectDownstreamItemKeys(payload.graph, nextState, [itemKey])
						]);
						const sourceTodos = payload.todo.generateTodosForSourceChange({
							state: nextState,
							registry: sourceRegistry,
							sourceIds,
							affectedItemKeys,
							requireDirectSourceLink: false
						});
						const sourceResult = payload.todo.createOrMergeTodos({
							state: nextState,
							todos: sourceTodos
						});
						nextState = sourceResult.state;
						createdTodoIds = [...createdTodoIds, ...sourceResult.createdTodoIds];
						updatedTodoIds = [...updatedTodoIds, ...sourceResult.updatedTodoIds];
					}
				}
			}
			nextState = touchState({
				schemas: payload.schemas,
				state: payload.derivedState.recomputeAll(nextState),
				updatedAt: payload.clock.nowIsoUtc()
			});
			const todoCreated = mapTodoIdsToItemKeys({
				state: nextState,
				todoIds: createdTodoIds
			});
			const todoUpdated = mapTodoIdsToItemKeys({
				state: nextState,
				todoIds: updatedTodoIds
			});
			const todoRemoved = sortKeys(new Set([...mapTodoIdsToItemKeys({
				state,
				todoIds: removedTodoIds
			}), ...graphResult.removedItemKeys]));
			if (isRemoveItemPatch) {
				const summary = {
					state: nextState,
					dry_run: dryRun,
					counts: {
						removed: graphResult.removedItemKeys.length,
						todo_created: todoCreated.length,
						todo_updated: todoUpdated.length,
						todo_removed: todoRemoved.length
					},
					removed: graphResult.removedItemKeys,
					todo_created: todoCreated,
					todo_updated: todoUpdated,
					todo_removed: todoRemoved,
					next_commands: buildMutationNextCommands({
						todoCreated,
						todoUpdated,
						fallbackReason: "Review tasks affected by the removal.",
						itemsReason: "Inspect full cards of tasks affected by item removal."
					})
				};
				return Promise.resolve({
					...payload.schemas.parseCommandOutput("remove-item", {
						dry_run: summary.dry_run,
						counts: summary.counts,
						removed: summary.removed,
						todo_created: summary.todo_created,
						todo_updated: summary.todo_updated,
						todo_removed: summary.todo_removed,
						next_commands: summary.next_commands
					}),
					state: nextState
				});
			}
			const updated = sortKeys(new Set(patch.metadata.target_item_keys));
			const summary = {
				state: nextState,
				dry_run: dryRun,
				counts: {
					updated: updated.length,
					todo_created: todoCreated.length,
					todo_updated: todoUpdated.length,
					todo_removed: todoRemoved.length
				},
				updated,
				todo_created: todoCreated,
				todo_updated: todoUpdated,
				todo_removed: todoRemoved,
				next_commands: buildMutationNextCommands({
					todoCreated,
					todoUpdated,
					fallbackReason: "Review tasks affected by the patch.",
					itemsReason: "Inspect full cards of directly changed tasks."
				})
			};
			return Promise.resolve({
				...payload.schemas.parseCommandOutput("patch-item", {
					dry_run: summary.dry_run,
					counts: summary.counts,
					updated: summary.updated,
					todo_created: summary.todo_created,
					todo_updated: summary.todo_updated,
					todo_removed: summary.todo_removed,
					next_commands: summary.next_commands
				}),
				state: nextState
			});
		},
		refresh({ state, sourceRegistry, changedSourceIds, scope }) {
			const scopeItemKeys = scope.kind === "all" ? sortKeys(state.items.map((item) => item.item_key)) : scope.kind === "item" ? (() => {
				if (!state.items.some((item) => item.item_key === scope.item_key)) throw payload.errors.create("BE_ITEM_NOT_FOUND", void 0, { details: { item_key: scope.item_key } });
				return payload.graph.resolveItemSubgraph({
					state,
					rootItemKeys: [scope.item_key]
				});
			})() : (() => {
				const linkedItemKeys = collectLinkedItemKeysBySourceIds({
					state,
					sourceIds: resolveSourceIdsFromScope({
						registry: sourceRegistry,
						scope,
						errors: payload.errors
					})
				});
				if (linkedItemKeys.length === 0) return [];
				const topLevelItemKeys = sortKeys(new Set(linkedItemKeys.flatMap((linkedItemKey) => {
					const topLevelKeys = /* @__PURE__ */ new Set();
					const stack = [linkedItemKey];
					const seen = /* @__PURE__ */ new Set();
					while (stack.length > 0) {
						const itemKey = stack.pop();
						if (!itemKey || seen.has(itemKey)) continue;
						seen.add(itemKey);
						const item = state.items.find((candidate) => candidate.item_key === itemKey);
						if (!item || item.depends_on_keys.length === 0) {
							topLevelKeys.add(itemKey);
							continue;
						}
						for (const dependencyKey of item.depends_on_keys) stack.push(dependencyKey);
					}
					return [...topLevelKeys];
				})));
				return payload.graph.resolveItemSubgraph({
					state,
					rootItemKeys: topLevelItemKeys
				});
			})();
			const scopeItemSet = new Set(scopeItemKeys);
			const observedSourceIds = scope.kind === "all" ? sortKeys(sourceRegistry.sources.map((source) => source.source_id)) : scope.kind === "item" ? sortKeys(new Set(scopeItemKeys.flatMap((itemKey) => {
				const item = state.items.find((candidate) => candidate.item_key === itemKey);
				return item ? [...collectItemSourceIds$3(item)] : [];
			}))) : resolveSourceIdsFromScope({
				registry: sourceRegistry,
				scope,
				errors: payload.errors
			});
			const observedSourceIdSet = new Set(observedSourceIds);
			const observedDirectSourceItemKeySet = new Set(collectLinkedItemKeysBySourceIds({
				state,
				sourceIds: observedSourceIds
			}).filter((itemKey) => scopeItemSet.has(itemKey)));
			const directSourceItemKeys = collectActiveSourceTodoItemKeys({
				state,
				changedSourceIds
			}).filter((itemKey) => scopeItemSet.has(itemKey));
			const downstreamItemKeys = collectDownstreamItemKeys(payload.graph, state, directSourceItemKeys).filter((itemKey) => scopeItemSet.has(itemKey));
			let nextState = state;
			let createdTodoIds = [];
			let updatedTodoIds = [];
			let removedTodoIds = [];
			const activeSourceTodoSemanticKeys = /* @__PURE__ */ new Set();
			const activeDependencyTodoSemanticKeys = /* @__PURE__ */ new Set();
			const sourceSummaryLookup = buildSourceSummaryLookup(sourceRegistry);
			const changedSourceSummaries = sortChangedSources(changedSourceIds.flatMap((sourceId) => {
				const source = sourceSummaryLookup.get(sourceId);
				return source ? [source] : [];
			}));
			if (directSourceItemKeys.length > 0) {
				const sourceTodos = payload.todo.generateTodosForSourceChange({
					state: nextState,
					registry: sourceRegistry,
					sourceIds: changedSourceIds,
					affectedItemKeys: directSourceItemKeys,
					managedBy: "refresh"
				});
				for (const todo of sourceTodos) activeSourceTodoSemanticKeys.add([
					todo.item_key,
					todo.type,
					sortKeys(todo.related_sources.map((source) => source.source_id)).join(","),
					sortKeys(todo.related_item_keys).join(",")
				].join("|"));
				const sourceResult = payload.todo.createOrMergeTodos({
					state: nextState,
					todos: sourceTodos
				});
				nextState = sourceResult.state;
				createdTodoIds = [...createdTodoIds, ...sourceResult.createdTodoIds];
				updatedTodoIds = [...updatedTodoIds, ...sourceResult.updatedTodoIds];
			}
			if (downstreamItemKeys.length > 0) {
				const dependencyTodos = payload.todo.generateTodosForDependencyChange({
					state: nextState,
					changedItemKeys: directSourceItemKeys,
					dependentItemKeys: downstreamItemKeys,
					managedBy: "refresh",
					relatedSources: changedSourceSummaries
				});
				for (const todo of dependencyTodos) activeDependencyTodoSemanticKeys.add([
					todo.item_key,
					todo.type,
					sortKeys(todo.related_sources.map((source) => source.source_id)).join(","),
					sortKeys(todo.related_item_keys).join(",")
				].join("|"));
				const dependencyResult = payload.todo.createOrMergeTodos({
					state: nextState,
					todos: dependencyTodos
				});
				nextState = dependencyResult.state;
				createdTodoIds = [...createdTodoIds, ...dependencyResult.createdTodoIds];
				updatedTodoIds = [...updatedTodoIds, ...dependencyResult.updatedTodoIds];
			}
			const sourceTodoCleanup = removeTodosByType({
				state: nextState,
				schemas: payload.schemas,
				todoType: "review_source_change",
				scopedItemKeys: scopeItemKeys,
				allowedSemanticKeys: activeSourceTodoSemanticKeys,
				isCleanupCandidate(todo) {
					return todo.related_sources.length > 0 && todo.related_sources.every((source) => observedSourceIdSet.has(source.source_id));
				}
			});
			nextState = sourceTodoCleanup.state;
			removedTodoIds = [...removedTodoIds, ...sourceTodoCleanup.removedTodoIds];
			const dependencyTodoCleanup = removeTodosByType({
				state: nextState,
				schemas: payload.schemas,
				todoType: "review_dependency_change",
				scopedItemKeys: scopeItemKeys,
				allowedSemanticKeys: activeDependencyTodoSemanticKeys,
				isCleanupCandidate(todo) {
					return todo.related_sources.length > 0 && todo.related_sources.every((source) => observedSourceIdSet.has(source.source_id)) && todo.related_item_keys.length > 0 && todo.related_item_keys.every((itemKey) => observedDirectSourceItemKeySet.has(itemKey));
				}
			});
			nextState = dependencyTodoCleanup.state;
			removedTodoIds = [...removedTodoIds, ...dependencyTodoCleanup.removedTodoIds];
			nextState = touchState({
				schemas: payload.schemas,
				state: payload.derivedState.recomputeAll(nextState),
				updatedAt: payload.clock.nowIsoUtc(),
				refreshAt: payload.clock.nowIsoUtc()
			});
			const changedSources = changedSourceSummaries;
			const todoCreated = mapTodoIdsToItemKeys({
				state: nextState,
				todoIds: createdTodoIds
			});
			const todoUpdated = mapTodoIdsToItemKeys({
				state: nextState,
				todoIds: updatedTodoIds
			});
			const todoRemoved = mapTodoIdsToItemKeys({
				state,
				todoIds: removedTodoIds
			});
			const summary = {
				state: nextState,
				registry: sourceRegistry,
				counts: {
					changed_sources: changedSources.length,
					todo_created: todoCreated.length,
					todo_updated: todoUpdated.length,
					todo_removed: todoRemoved.length
				},
				changed_sources: changedSources,
				todo_created: todoCreated,
				todo_updated: todoUpdated,
				todo_removed: todoRemoved,
				next_commands: buildRefreshNextCommands([...todoCreated, ...todoUpdated])
			};
			return Promise.resolve({
				...payload.schemas.parseCommandOutput("refresh", {
					counts: summary.counts,
					changed_sources: summary.changed_sources,
					todo_created: summary.todo_created,
					todo_updated: summary.todo_updated,
					todo_removed: summary.todo_removed,
					next_commands: summary.next_commands
				}),
				state: nextState,
				registry: sourceRegistry
			});
		},
		removeSourceReferences({ state, patch, sourceRegistry, sourceId, affectedItemKeys, updatedItemKeys }) {
			const graphResult = payload.graph.applyPatchOperations({
				state,
				patch
			});
			assertKnownSourceReferences(graphResult.state, sourceRegistry);
			const sourceRemovalTodos = payload.todo.generateTodosForSourceRemoval({
				state: graphResult.state,
				registry: sourceRegistry,
				sourceIds: [sourceId],
				affectedItemKeys,
				managedBy: "mutation"
			});
			const sourceRemovalResult = payload.todo.createOrMergeTodos({
				state: graphResult.state,
				todos: sourceRemovalTodos
			});
			const nextState = touchState({
				schemas: payload.schemas,
				state: payload.derivedState.recomputeAll(sourceRemovalResult.state),
				updatedAt: payload.clock.nowIsoUtc()
			});
			const todoCreated = mapTodoIdsToItemKeys({
				state: nextState,
				todoIds: sourceRemovalResult.createdTodoIds
			});
			const todoUpdated = mapTodoIdsToItemKeys({
				state: nextState,
				todoIds: sourceRemovalResult.updatedTodoIds
			});
			const todoRemoved = mapTodoIdsToItemKeys({
				state,
				todoIds: graphResult.removedTodoIds
			});
			const summary = {
				state: nextState,
				counts: {
					updated: updatedItemKeys.length,
					todo_created: todoCreated.length,
					todo_updated: todoUpdated.length,
					todo_removed: todoRemoved.length
				},
				updated_item_keys: sortKeys(updatedItemKeys),
				todo_created: todoCreated,
				todo_updated: todoUpdated,
				todo_removed: todoRemoved,
				next_commands: buildMutationNextCommands({
					todoCreated,
					todoUpdated,
					fallbackReason: "Review tasks affected by source removal.",
					itemsReason: "Inspect full cards of tasks affected by source removal."
				})
			};
			return Promise.resolve(summary);
		},
		getGaps({ state, filters }) {
			return (filters.item_key ? state.items.filter((item) => item.item_key === filters.item_key) : state.items).filter((item) => item.gaps.length > 0).map((item) => ({
				item_key: item.item_key,
				title: item.title,
				gaps: item.gaps
			}));
		}
	};
}
//#endregion
//#region src/vendor/backlog-engineer/core/queue-service.ts
function createReadySubset(items) {
	return items.filter((item) => item.ready_for_next_step && item.delivery_state !== "implemented" && item.gaps.length === 0);
}
function computeDepths(payload) {
	const depths = new Map([[payload.rootItemKey, 0]]);
	const queue = [payload.rootItemKey];
	while (queue.length > 0) {
		const itemKey = queue.shift();
		if (!itemKey) continue;
		const depth = depths.get(itemKey) ?? 0;
		for (const dependentKey of payload.reverseDependencies.get(itemKey) ?? []) {
			if (!payload.readyItemKeys.has(dependentKey) || depths.has(dependentKey)) continue;
			depths.set(dependentKey, depth + 1);
			queue.push(dependentKey);
		}
	}
	return depths;
}
function createQueueService(payload) {
	return { buildQueueChains({ state }) {
		const readyItems = createReadySubset(state.items);
		const readyItemKeys = new Set(readyItems.map((item) => item.item_key));
		const reverseDependencies = buildReverseDependencyIndex(state);
		const sortedChains = buildReadyQueueRoots(readyItems).map((rootItemKey) => {
			const depths = computeDepths({
				reverseDependencies,
				rootItemKey,
				readyItemKeys
			});
			return {
				root_item_key: rootItemKey,
				items: [...depths.keys()].sort((left, right) => {
					const byDepth = (depths.get(left) ?? Number.MAX_SAFE_INTEGER) - (depths.get(right) ?? Number.MAX_SAFE_INTEGER);
					if (byDepth !== 0) return byDepth;
					const byDownstream = countReadyDescendants({
						reverseDependencies,
						readyItemKeys,
						rootItemKey: right
					}) - countReadyDescendants({
						reverseDependencies,
						readyItemKeys,
						rootItemKey: left
					});
					if (byDownstream !== 0) return byDownstream;
					return left.localeCompare(right);
				}),
				ordering_rule: [
					"depth",
					"downstream_dependency_count",
					"item_key"
				]
			};
		}).sort((left, right) => {
			const byRoot = left.root_item_key.localeCompare(right.root_item_key);
			if (byRoot !== 0) return byRoot;
			const leftFirst = left.items[1] ?? left.items[0] ?? "";
			const rightFirst = right.items[1] ?? right.items[0] ?? "";
			const byFirst = leftFirst.localeCompare(rightFirst);
			if (byFirst !== 0) return byFirst;
			return left.items.length - right.items.length;
		});
		return payload.schemas.parseCommandOutput("queue", sortedChains);
	} };
}
//#endregion
//#region src/vendor/backlog-engineer/core/search-service.ts
function intersects(left, right) {
	const rightSet = new Set(right);
	return left.some((value) => rightSet.has(value));
}
function collectMatchReasons(payload) {
	const reasons = [];
	const context = buildItemContextSummary(payload.item);
	const sourceIds = [
		...payload.item.origin_source_ids,
		...payload.item.specification_source_ids,
		...payload.item.plan_source_ids,
		...payload.item.implementation_source_ids,
		...payload.item.test_source_ids
	];
	if (payload.filters.source_ids) reasons.push(`source_ids=${sourceIds.filter((sourceId) => payload.filters.source_ids?.includes(sourceId)).join(",")}`);
	if (payload.filters.delivery_state) reasons.push(`delivery_state=${payload.filters.delivery_state}`);
	if (payload.filters.needs_attention !== void 0) reasons.push(`needs_attention=${String(payload.filters.needs_attention)}`);
	if (payload.filters.ready_for_next_step !== void 0) reasons.push(`ready_for_next_step=${String(payload.filters.ready_for_next_step)}`);
	if (payload.filters.claim_keys) reasons.push(`claim_keys=${context.claim_keys.filter((key) => payload.filters.claim_keys?.includes(key)).join(",")}`);
	if (payload.filters.contract_keys) reasons.push(`contract_keys=${context.contract_keys.filter((key) => payload.filters.contract_keys?.includes(key)).join(",")}`);
	if (payload.filters.data_domain_keys) reasons.push(`data_domain_keys=${context.data_domain_keys.filter((key) => payload.filters.data_domain_keys?.includes(key)).join(",")}`);
	if (payload.filters.quality_attribute_keys) reasons.push(`quality_attribute_keys=${context.quality_attribute_keys.filter((key) => payload.filters.quality_attribute_keys?.includes(key)).join(",")}`);
	if (payload.filters.policy_decision_keys) reasons.push(`policy_decision_keys=${context.policy_decision_keys.filter((key) => payload.filters.policy_decision_keys?.includes(key)).join(",")}`);
	return reasons;
}
function matchesFilters(payload) {
	const { item, filters } = payload;
	const context = buildItemContextSummary(item);
	const sourceIds = [
		...item.origin_source_ids,
		...item.specification_source_ids,
		...item.plan_source_ids,
		...item.implementation_source_ids,
		...item.test_source_ids
	];
	if (filters.source_ids && !intersects(sourceIds, filters.source_ids)) return false;
	if (filters.delivery_state && item.delivery_state !== filters.delivery_state) return false;
	if (filters.needs_attention !== void 0 && item.needs_attention !== filters.needs_attention) return false;
	if (filters.ready_for_next_step !== void 0 && item.ready_for_next_step !== filters.ready_for_next_step) return false;
	if (filters.claim_keys && !intersects(context.claim_keys, filters.claim_keys)) return false;
	if (filters.contract_keys && !intersects(context.contract_keys, filters.contract_keys)) return false;
	if (filters.data_domain_keys && !intersects(context.data_domain_keys, filters.data_domain_keys)) return false;
	if (filters.quality_attribute_keys && !intersects(context.quality_attribute_keys, filters.quality_attribute_keys)) return false;
	if (filters.policy_decision_keys && !intersects(context.policy_decision_keys, filters.policy_decision_keys)) return false;
	return true;
}
function createSearchService(payload) {
	return { search({ state, filters, registry }) {
		const sourceSummariesById = createSourceSummaryLookup(registry);
		const results = [...state.items].filter((item) => matchesFilters({
			item,
			filters
		})).sort((left, right) => left.item_key.localeCompare(right.item_key)).map((item) => ({
			item_key: item.item_key,
			title: item.title,
			type: item.type,
			delivery_state: item.delivery_state,
			needs_attention: item.needs_attention,
			ready_for_next_step: item.ready_for_next_step,
			attention_reason_codes: [...item.attention_reason_codes],
			attention_reasons: [...item.attention_reasons],
			source_summaries: collectSourceSummariesForItem({
				item,
				sourceSummariesById,
				errors: payload.errors
			}),
			match_reasons: collectMatchReasons({
				filters,
				item
			})
		}));
		return payload.schemas.parseCommandOutput("search", results);
	} };
}
//#endregion
//#region src/vendor/backlog-engineer/core/todo-service.ts
function cloneState(value) {
	return structuredClone(value);
}
function sortItemKeys(values) {
	return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
function sortSourceSummaries(values) {
	const deduped = /* @__PURE__ */ new Map();
	for (const value of values) deduped.set(value.source_id, value);
	return [...deduped.values()].sort((left, right) => {
		const labelCompare = left.source_label.localeCompare(right.source_label);
		if (labelCompare !== 0) return labelCompare;
		return left.source_id.localeCompare(right.source_id);
	});
}
function sortTodos(values) {
	return [...values].sort((left, right) => left.todo_id.localeCompare(right.todo_id));
}
function resolveTodoManagedBy(todo) {
	return todo.managed_by ?? "mutation";
}
function buildSemanticKey(todo) {
	const sourceIds = sortSourceSummaries(todo.related_sources).map((source) => source.source_id);
	const relatedItemKeys = sortItemKeys(todo.related_item_keys);
	return [
		todo.item_key,
		todo.type,
		sourceIds.join(","),
		relatedItemKeys.join(",")
	].join("|");
}
function createSourceChangeMessage(relatedSources) {
	const labels = sortSourceSummaries(relatedSources).map((source) => source.source_label);
	if (labels.length === 0) return "Review the linked source change.";
	return `Review source change: ${labels.join(", ")}.`;
}
function createSourceRemovalMessage(relatedSources) {
	const labels = sortSourceSummaries(relatedSources).map((source) => source.source_label);
	if (labels.length === 0) return "Source was removed. Review whether this task needs replacement source coverage.";
	return `Source was removed: ${labels.join(", ")}. Review whether this task needs replacement source coverage.`;
}
function createDependencyChangeMessage(relatedItemKeys) {
	const keys = sortItemKeys(relatedItemKeys);
	if (keys.length === 0) return "Review dependency changes for this task.";
	return `Upstream task changed: ${keys.join(", ")}. Review whether this task needs updates.`;
}
function createContextChangeMessage(relatedItemKeys) {
	const keys = sortItemKeys(relatedItemKeys);
	if (keys.length === 0) return "Review task context changes.";
	return `Task context changed through: ${keys.join(", ")}. Review whether updates are needed.`;
}
function buildTodo(payload) {
	const relatedSources = sortSourceSummaries(payload.relatedSources ?? []);
	const relatedItemKeys = sortItemKeys(payload.relatedItemKeys ?? []);
	const message = payload.message ?? (payload.type === "review_source_change" ? createSourceChangeMessage(relatedSources) : payload.type === "review_dependency_change" ? createDependencyChangeMessage(relatedItemKeys) : createContextChangeMessage(relatedItemKeys));
	return {
		todo_id: payload.uuid.create(),
		item_key: payload.itemKey,
		type: payload.type,
		managed_by: payload.managedBy,
		message,
		created_at: payload.clock.nowIsoUtc(),
		related_sources: relatedSources,
		related_item_keys: relatedItemKeys
	};
}
function resolveSourceSummaries(payload) {
	const byId = new Map(payload.registry.sources.map((source) => [source.source_id, source]));
	const summaries = [];
	for (const sourceId of payload.sourceIds) {
		const source = byId.get(sourceId);
		if (!source) throw payload.errors.create("BE_SOURCE_NOT_FOUND", void 0, { details: { source_id: sourceId } });
		summaries.push({
			source_id: source.source_id,
			source_label: source.source_label
		});
	}
	return sortSourceSummaries(summaries);
}
function createTodoService(payload) {
	return {
		createOrMergeTodos({ state, todos }) {
			const nextState = cloneState(state);
			const bySemanticKey = new Map(nextState.todos.map((todo) => [buildSemanticKey(todo), todo]));
			const createdTodoIds = [];
			const updatedTodoIds = [];
			for (const incomingTodo of sortTodos(todos)) {
				const semanticKey = buildSemanticKey(incomingTodo);
				const existing = bySemanticKey.get(semanticKey);
				if (!existing) {
					nextState.todos.push(incomingTodo);
					bySemanticKey.set(semanticKey, incomingTodo);
					createdTodoIds.push(incomingTodo.todo_id);
					continue;
				}
				const normalizedIncoming = {
					...incomingTodo,
					todo_id: existing.todo_id,
					created_at: existing.created_at,
					managed_by: resolveTodoManagedBy(existing) === "mutation" || resolveTodoManagedBy(incomingTodo) === "mutation" ? "mutation" : "refresh"
				};
				if (JSON.stringify(existing) === JSON.stringify(normalizedIncoming)) continue;
				nextState.todos = nextState.todos.map((todo) => todo.todo_id === existing.todo_id ? normalizedIncoming : todo);
				bySemanticKey.set(semanticKey, normalizedIncoming);
				updatedTodoIds.push(existing.todo_id);
			}
			nextState.todos = sortTodos(nextState.todos);
			return {
				state: synchronizeOpenTodoIds({
					schemas: payload.schemas,
					state: nextState
				}),
				createdTodoIds: sortItemKeys(createdTodoIds),
				updatedTodoIds: sortItemKeys(updatedTodoIds)
			};
		},
		removeTodos({ state, todoIds }) {
			const nextState = cloneState(state);
			const requestedTodoIds = new Set(todoIds);
			const existingTodoIds = new Set(nextState.todos.map((todo) => todo.todo_id));
			for (const todoId of requestedTodoIds) {
				if (existingTodoIds.has(todoId)) continue;
				throw payload.errors.create("BE_TODO_NOT_FOUND", void 0, { details: { todo_id: todoId } });
			}
			nextState.todos = sortTodos(nextState.todos.filter((todo) => !requestedTodoIds.has(todo.todo_id)));
			return {
				state: synchronizeOpenTodoIds({
					schemas: payload.schemas,
					state: nextState
				}),
				removedTodoIds: sortItemKeys(requestedTodoIds)
			};
		},
		generateTodosForSourceChange({ state, registry, sourceIds, affectedItemKeys, requireDirectSourceLink = true, managedBy = "mutation" }) {
			const relatedSources = resolveSourceSummaries({
				registry,
				sourceIds,
				errors: payload.errors
			});
			const itemKeys = sortItemKeys(affectedItemKeys);
			const itemsByKey = new Map(state.items.map((item) => [item.item_key, item]));
			return itemKeys.flatMap((itemKey) => {
				const item = itemsByKey.get(itemKey);
				if (!item) return [];
				const itemSourceIds = new Set([
					...item.origin_source_ids,
					...item.specification_source_ids,
					...item.plan_source_ids,
					...item.implementation_source_ids,
					...item.test_source_ids
				]);
				const relevantSources = relatedSources.filter((source) => itemSourceIds.has(source.source_id));
				if (requireDirectSourceLink && relevantSources.length === 0) return [];
				return [buildTodo({
					uuid: payload.uuid,
					clock: payload.clock,
					itemKey,
					type: "review_source_change",
					managedBy,
					relatedSources: requireDirectSourceLink ? relevantSources : relatedSources
				})];
			});
		},
		generateTodosForSourceRemoval({ state, registry, sourceIds, affectedItemKeys, managedBy = "mutation" }) {
			const relatedSources = resolveSourceSummaries({
				registry,
				sourceIds,
				errors: payload.errors
			});
			const itemKeys = sortItemKeys(affectedItemKeys);
			const itemsByKey = new Map(state.items.map((item) => [item.item_key, item]));
			const message = createSourceRemovalMessage(relatedSources);
			return itemKeys.flatMap((itemKey) => {
				if (!itemsByKey.has(itemKey)) return [];
				return [buildTodo({
					uuid: payload.uuid,
					clock: payload.clock,
					itemKey,
					type: "review_source_change",
					managedBy,
					relatedSources,
					message
				})];
			});
		},
		generateTodosForDependencyChange({ dependentItemKeys, changedItemKeys, managedBy = "mutation", relatedSources = [] }) {
			const sortedChangedKeys = sortItemKeys(changedItemKeys);
			const sortedRelatedSources = sortSourceSummaries(relatedSources);
			return sortItemKeys(dependentItemKeys).map((itemKey) => buildTodo({
				uuid: payload.uuid,
				clock: payload.clock,
				itemKey,
				type: "review_dependency_change",
				managedBy,
				relatedSources: sortedRelatedSources,
				relatedItemKeys: sortedChangedKeys
			}));
		},
		generateTodosForContextChange({ changedItemKeys, affectedItemKeys, managedBy = "mutation" }) {
			const sortedChangedKeys = sortItemKeys(changedItemKeys);
			return sortItemKeys(affectedItemKeys ?? changedItemKeys).map((itemKey) => buildTodo({
				uuid: payload.uuid,
				clock: payload.clock,
				itemKey,
				type: "review_context_change",
				managedBy,
				relatedItemKeys: sortedChangedKeys
			}));
		}
	};
}
//#endregion
//#region src/vendor/backlog-engineer/core/create-core-module.ts
function createCoreModule(payload) {
	const graph = createGraphService({
		errors: payload.errors,
		schemas: payload.schemas
	});
	const context = createContextService({
		errors: payload.errors,
		schemas: payload.schemas
	});
	const todo = createTodoService({
		errors: payload.errors,
		schemas: payload.schemas,
		clock: payload.clock,
		uuid: payload.uuid
	});
	const derivedState = createDerivedStateService({
		errors: payload.errors,
		schemas: payload.schemas
	});
	return {
		graph,
		context,
		todo,
		derivedState,
		search: createSearchService({
			errors: payload.errors,
			schemas: payload.schemas
		}),
		items: createItemsService({
			errors: payload.errors,
			schemas: payload.schemas
		}),
		queue: createQueueService({
			errors: payload.errors,
			schemas: payload.schemas
		}),
		attention: createAttentionService({
			errors: payload.errors,
			schemas: payload.schemas
		}),
		mutation: createMutationService({
			errors: payload.errors,
			schemas: payload.schemas,
			clock: payload.clock,
			graph,
			context,
			todo,
			derivedState
		})
	};
}
//#endregion
//#region src/vendor/backlog-engineer/reports/render-mermaid-graph.ts
function escapeMermaidLabel(value) {
	return value.replaceAll("\"", "'").replaceAll("\n", " ");
}
function renderStateMermaidGraph(items) {
	const sortedItems = [...items].sort((left, right) => left.item_key.localeCompare(right.item_key));
	const lines = ["flowchart TD"];
	for (const item of sortedItems) lines.push(`  ${item.item_key}["${escapeMermaidLabel(`${item.item_key}: ${item.title}`)}"]`);
	const edges = sortedItems.flatMap((item) => [...item.depends_on_keys].sort((left, right) => left.localeCompare(right)).map((dependencyKey) => ({
		from: dependencyKey,
		to: item.item_key
	})));
	for (const edge of edges) lines.push(`  ${edge.from} --> ${edge.to}`);
	return `${lines.join("\n")}\n`;
}
//#endregion
//#region src/vendor/backlog-engineer/reports/build-report-model.ts
function collectItemSourceIds$2(item) {
	return [
		...item.origin_source_ids,
		...item.specification_source_ids,
		...item.plan_source_ids,
		...item.implementation_source_ids,
		...item.test_source_ids
	];
}
function formatSummaryValue(value) {
	if (Array.isArray(value)) return value.map((entry) => entry === null ? "null" : String(entry)).join(", ");
	return value === null ? "null" : String(value);
}
function formatStructuredSummaryBlock(payload) {
	return payload.entries.map((entry, index) => {
		const fields = Object.entries(entry).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}: ${formatSummaryValue(value)}`).join("; ");
		return `${payload.label} ${index + 1}: ${fields}`;
	});
}
function buildFallbackSystemSummary(payload) {
	const sourceLabelById = new Map(payload.registry.sources.map((source) => [source.source_id, source.source_label]));
	const sourceCoverage = /* @__PURE__ */ new Map();
	const typeCounts = /* @__PURE__ */ new Map();
	const deliveryCounts = /* @__PURE__ */ new Map();
	for (const item of payload.state.items) {
		typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1);
		deliveryCounts.set(item.delivery_state, (deliveryCounts.get(item.delivery_state) ?? 0) + 1);
		for (const sourceId of new Set(collectItemSourceIds$2(item))) sourceCoverage.set(sourceId, (sourceCoverage.get(sourceId) ?? 0) + 1);
	}
	const topSources = [...sourceCoverage.entries()].map(([sourceId, count]) => ({
		source_id: sourceId,
		source_label: sourceLabelById.get(sourceId) ?? sourceId,
		count
	})).sort((left, right) => {
		const byCount = right.count - left.count;
		if (byCount !== 0) return byCount;
		const byLabel = left.source_label.localeCompare(right.source_label);
		if (byLabel !== 0) return byLabel;
		return left.source_id.localeCompare(right.source_id);
	}).slice(0, 5).map((entry) => `${entry.source_label} (${entry.count})`);
	const typeSummary = [...typeCounts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([type, count]) => `${type}: ${count}`).join(", ");
	const deliverySummary = [...deliveryCounts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([deliveryState, count]) => `${deliveryState}: ${count}`).join(", ");
	return [
		`Registered sources: ${payload.registry.sources.length}`,
		`Top sources by task coverage: ${topSources.length > 0 ? topSources.join("; ") : "none"}`,
		`Items by type: ${typeSummary || "none"}`,
		`Items by delivery state: ${deliverySummary || "none"}`
	];
}
function buildSystemSummary(payload) {
	const baseLines = payload.state.context.target_system.length > 0 || payload.state.context.as_built.length > 0 ? [...formatStructuredSummaryBlock({
		label: "Target system",
		entries: payload.state.context.target_system
	}), ...formatStructuredSummaryBlock({
		label: "As built",
		entries: payload.state.context.as_built
	})] : buildFallbackSystemSummary({
		state: payload.state,
		registry: payload.registry
	});
	return [...new Set([...baseLines, ...payload.hookLines.map((line) => line.trim()).filter(Boolean)])];
}
function isLargeBacklog(state) {
	const edgeCount = state.items.reduce((sum, item) => sum + item.depends_on_keys.length, 0);
	return state.items.length > 75 || edgeCount > 120;
}
function buildUndirectedAdjacency(items) {
	const adjacency = /* @__PURE__ */ new Map();
	for (const item of items) {
		if (!adjacency.has(item.item_key)) adjacency.set(item.item_key, /* @__PURE__ */ new Set());
		for (const dependencyKey of item.depends_on_keys) {
			if (!adjacency.has(dependencyKey)) adjacency.set(dependencyKey, /* @__PURE__ */ new Set());
			adjacency.get(item.item_key)?.add(dependencyKey);
			adjacency.get(dependencyKey)?.add(item.item_key);
		}
	}
	return adjacency;
}
function buildConnectedComponents(items) {
	const itemByKey = new Map(items.map((item) => [item.item_key, item]));
	const adjacency = buildUndirectedAdjacency(items);
	const visited = /* @__PURE__ */ new Set();
	const components = [];
	for (const item of items.map((entry) => entry.item_key).sort((left, right) => left.localeCompare(right))) {
		if (visited.has(item)) continue;
		const component = [];
		const queue = [item];
		visited.add(item);
		while (queue.length > 0) {
			const current = queue.shift();
			if (!current || !itemByKey.has(current)) continue;
			component.push(current);
			for (const neighbor of adjacency.get(current) ?? []) {
				if (visited.has(neighbor) || !itemByKey.has(neighbor)) continue;
				visited.add(neighbor);
				queue.push(neighbor);
			}
		}
		component.sort((left, right) => left.localeCompare(right));
		components.push(component);
	}
	return components;
}
function chooseLocalGraphTitle(payload) {
	const sourceLabelById = new Map(payload.registry.sources.map((source) => [source.source_id, source.source_label]));
	const sourceCounts = /* @__PURE__ */ new Map();
	for (const item of payload.componentItems) for (const sourceId of new Set(item.origin_source_ids)) sourceCounts.set(sourceId, (sourceCounts.get(sourceId) ?? 0) + 1);
	if (sourceCounts.size === 0) return "Local graph — no origin source";
	const [winner] = [...sourceCounts.entries()].map(([sourceId, count]) => ({
		source_id: sourceId,
		source_label: sourceLabelById.get(sourceId) ?? sourceId,
		count
	})).sort((left, right) => {
		const byCount = right.count - left.count;
		if (byCount !== 0) return byCount;
		const byLabel = left.source_label.localeCompare(right.source_label);
		if (byLabel !== 0) return byLabel;
		return left.source_id.localeCompare(right.source_id);
	});
	return `Local graph — ${winner?.source_label ?? "no origin source"}`;
}
function buildLocalMermaidGraphs(payload) {
	if (!isLargeBacklog(payload.state)) return [];
	const itemByKey = new Map(payload.state.items.map((item) => [item.item_key, item]));
	return buildConnectedComponents(payload.state.items).map((itemKeys) => {
		const componentItems = itemKeys.map((itemKey) => itemByKey.get(itemKey)).filter((item) => item !== void 0);
		return {
			title: chooseLocalGraphTitle({
				componentItems,
				registry: payload.registry
			}),
			mermaid: renderStateMermaidGraph(componentItems),
			item_keys: [...itemKeys]
		};
	}).sort((left, right) => {
		const byTitle = left.title.localeCompare(right.title);
		if (byTitle !== 0) return byTitle;
		const byFirstItem = (left.item_keys[0] ?? "").localeCompare(right.item_keys[0] ?? "");
		if (byFirstItem !== 0) return byFirstItem;
		return left.item_keys.length - right.item_keys.length;
	});
}
async function buildReportModel(payload) {
	const sortedItemKeys = payload.state.items.map((item) => item.item_key).sort((left, right) => left.localeCompare(right));
	const [itemCatalog, attentionItems, queueChains, hookSummary] = await Promise.all([
		Promise.resolve(payload.services.items.getItems({
			state: payload.state,
			itemKeys: sortedItemKeys,
			registry: payload.registry
		})),
		Promise.resolve(payload.services.attention.buildAttentionList({
			state: payload.state,
			registry: payload.registry
		})),
		Promise.resolve(payload.services.queue.buildQueueChains({ state: payload.state })),
		payload.hooks.buildSystemSummary?.({
			context: payload.state.context,
			items: payload.state.items
		}) ?? Promise.resolve([])
	]);
	const metrics = {
		totalItems: payload.state.items.length,
		itemsNeedingAttention: payload.state.items.filter((item) => item.needs_attention).length,
		readyForNextStep: payload.state.items.filter((item) => item.ready_for_next_step).length,
		openGaps: payload.state.items.filter((item) => item.gaps.length > 0).length,
		openTodos: payload.state.todos.length
	};
	return {
		systemSummary: buildSystemSummary({
			state: payload.state,
			registry: payload.registry,
			hookLines: hookSummary
		}),
		metrics,
		globalMermaidGraph: renderStateMermaidGraph(payload.state.items),
		localMermaidGraphs: buildLocalMermaidGraphs({
			state: payload.state,
			registry: payload.registry
		}),
		attentionItems,
		queueChains,
		itemCatalog
	};
}
//#endregion
//#region src/vendor/backlog-engineer/reports/render-report-markdown.ts
function renderBulletLines(lines) {
	if (lines.length === 0) return "- none";
	return lines.map((line) => `- ${line}`).join("\n");
}
function renderMermaidBlock(mermaid) {
	return [
		"```mermaid",
		mermaid.trimEnd(),
		"```"
	].join("\n");
}
function countBy(values) {
	const counts = /* @__PURE__ */ new Map();
	for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
	return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
}
function renderItemKeyList(values) {
	return values.length > 0 ? values.join(", ") : "none";
}
function renderContextSummary(card) {
	return [
		`Claims: ${renderItemKeyList(card.context.claim_keys)}`,
		`Contracts: ${renderItemKeyList(card.context.contract_keys)}`,
		`Data domains: ${renderItemKeyList(card.context.data_domain_keys)}`,
		`Quality attributes: ${renderItemKeyList(card.context.quality_attribute_keys)}`,
		`Policy decisions: ${renderItemKeyList(card.context.policy_decision_keys)}`
	];
}
function countContextKeys(card) {
	return card.context.claim_keys.length + card.context.contract_keys.length + card.context.data_domain_keys.length + card.context.quality_attribute_keys.length + card.context.policy_decision_keys.length;
}
function renderItemSection(card) {
	const item = card.item;
	return [
		`### ${item.item_key} — ${item.title}`,
		"",
		`- Type: ${item.type}`,
		`- Delivery state: ${item.delivery_state}`,
		`- Needs attention: ${String(card.computed_state.needs_attention)}`,
		`- Ready for next step: ${String(card.computed_state.ready_for_next_step)}`,
		`- Gaps: ${item.gaps.length > 0 ? item.gaps.join("; ") : "none"}`,
		`- Depends on: ${renderItemKeyList(item.depends_on_keys)}`,
		`- Reverse dependencies: ${renderItemKeyList(card.reverse_dependency_keys)}`,
		`- Related sources: ${card.source_summaries.map((source) => source.source_label).join(", ") || "none"}`,
		`- Todo: ${card.todo.map((todo) => todo.message).join("; ") || "none"}`,
		`- Attention reasons: ${card.computed_state.attention_reasons.join("; ") || "none"}`,
		"",
		"Context:",
		renderBulletLines(renderContextSummary(card)),
		"",
		"Item metrics:",
		renderBulletLines([
			`Dependency count: ${item.depends_on_keys.length}`,
			`Reverse dependency count: ${card.reverse_dependency_keys.length}`,
			`Gap count: ${item.gaps.length}`,
			`Related source count: ${card.source_summaries.length}`,
			`Related context element count: ${countContextKeys(card)}`
		])
	].join("\n");
}
function buildReportSections(model) {
	const typeCounts = countBy(model.itemCatalog.map((card) => card.item.type));
	const deliveryStateCounts = countBy(model.itemCatalog.map((card) => card.item.delivery_state));
	const taskGraphSection = [
		"Global graph:",
		"",
		renderMermaidBlock(model.globalMermaidGraph),
		...model.localMermaidGraphs.length > 0 ? [
			"",
			"Local graphs:",
			"",
			...model.localMermaidGraphs.flatMap((graph) => [
				`### ${graph.title}`,
				"",
				`- Item keys: ${graph.item_keys.join(", ")}`,
				"",
				renderMermaidBlock(graph.mermaid),
				""
			])
		] : []
	].join("\n").trimEnd();
	const attentionSection = model.attentionItems.length === 0 ? "No items currently require attention." : model.attentionItems.map((entry) => [
		`### ${entry.item_key} — ${entry.title}`,
		"",
		renderBulletLines([
			`Reason codes: ${entry.attention_reason_codes.join(", ")}`,
			`Reasons: ${entry.attention_reasons.join("; ")}`,
			`Sources: ${entry.source_summaries.map((source) => source.source_label).join(", ") || "none"}`
		])
	].join("\n")).join("\n\n");
	const queueSection = model.queueChains.length === 0 ? "No tasks are ready for the next step." : model.queueChains.map((chain) => [
		`### Root: ${chain.root_item_key}`,
		"",
		renderBulletLines([`Ordering rule: ${chain.ordering_rule.join(" -> ")}`, `Items: ${chain.items.join(" -> ")}`])
	].join("\n")).join("\n\n");
	const allItemsSection = model.itemCatalog.length === 0 ? "No items are registered." : model.itemCatalog.map((card) => renderItemSection(card)).join("\n\n");
	return [
		{
			key: "system-summary",
			title: "System Summary",
			markdown: renderBulletLines(model.systemSummary)
		},
		{
			key: "backlog-metrics",
			title: "Backlog Metrics",
			markdown: renderBulletLines([
				`Total items: ${model.metrics.totalItems}`,
				`Items needing attention: ${model.metrics.itemsNeedingAttention}`,
				`Ready for next step: ${model.metrics.readyForNextStep}`,
				`Items with gaps: ${model.metrics.openGaps}`,
				`Open todo count: ${model.metrics.openTodos}`,
				`Items by type: ${typeCounts.map(([type, count]) => `${type}=${count}`).join(", ") || "none"}`,
				`Items by delivery state: ${deliveryStateCounts.map(([state, count]) => `${state}=${count}`).join(", ") || "none"}`
			])
		},
		{
			key: "task-graph",
			title: "Task Graph",
			markdown: taskGraphSection
		},
		{
			key: "needs-attention",
			title: "Needs Attention",
			markdown: attentionSection
		},
		{
			key: "ready-for-next-step",
			title: "Ready For Next Step",
			markdown: queueSection
		},
		{
			key: "all-items",
			title: "All Items",
			markdown: allItemsSection
		}
	];
}
function renderReportMarkdown(sections) {
	return `# Backlog Report\n\n${sections.map((section) => `## ${section.title}\n\n${section.markdown.trim()}`).join("\n\n")}\n`;
}
//#endregion
//#region src/vendor/backlog-engineer/reports/index.ts
function createReportsModule(payload) {
	return {
		buildReportModel({ state, registry }) {
			return buildReportModel({
				state,
				registry,
				services: {
					items: payload.items,
					attention: payload.attention,
					queue: payload.queue
				},
				hooks: payload.hooks
			});
		},
		buildSections(model) {
			return buildReportSections(model);
		},
		renderMarkdown(sections) {
			return renderReportMarkdown(sections);
		},
		renderMermaid(model) {
			return model.globalMermaidGraph;
		}
	};
}
//#endregion
//#region src/vendor/backlog-engineer/templates/render-agents-template.ts
var BACKLOG_AGENTS_TEMPLATE = `# AGENTS.md

This directory is the unified backlog subroot managed by \`dossier-engineer\`.

## Core rules

- Treat the utility as the source of truth for the current backlog state.
- Do not reconstruct current state by reading \`packets/\`, \`patches/\`, or managed files under \`.dossier/backlog/\` directly.
- Do not edit managed files under \`.dossier/backlog/\`, \`reports/\`, or canonical import copies manually.
- Canonical import copies are immutable after registration.
- Add new tasks only through \`packet\`.
- Change existing tasks only through patch-based commands.
- Remove existing tasks only through patch-based commands.
- Prefer scoped operations over global ones when the affected source or task is known.
- Use \`--dry-run\` for risky or large mutations before applying them for real.

## Command selection

- Use \`search\` when task keys are unknown or filtering is needed.
- Use \`items\` when task keys are already known and full task cards are needed.
- Use \`refresh\` when source documents may have changed.
- Use \`queue\` when you need to know what can be taken next.
- Use \`attention\` when you need tasks that require review or re-review.
- Use \`gaps\` when you need explicit blockers.
- Use \`status\` for a short summary in chat.
- Use \`report\` only when a report file on disk is explicitly needed.

## Source handling

- Read source documents first.
- Register sources through the utility before relying on them in packets.
- If multiple sources are needed for one unified process root, register them strictly one by one.
- Use utility lookups such as \`list-sources\` instead of rebuilding source mappings from packet files.

## Drafts vs canonical copies

- You may author draft packet and patch files in \`packets/\` and \`patches/\` before applying them.
- After apply, treat utility-owned canonical import copies as immutable.
- The existence of both a draft file and a canonical copy is intentional, not clutter.

## Mutation follow-up

- After \`packet\`, \`patch-item\`, \`remove-item\`, or \`refresh\`, trust the command result first.
- If the result reports new or updated \`todo\`, follow up only with \`attention\` or \`items\` for the returned task keys.
- If there are no \`todo\` changes and the operator asked only for the result, avoid extra reads.

## Working assumptions

- \`gaps\` means blocked.
- Open \`todo\` caused by source, dependency, or context change means review is needed.
- \`ready_for_next_step = true\` means the task can be taken further.
`;
function renderBacklogAgentsTemplate() {
	return BACKLOG_AGENTS_TEMPLATE;
}
//#endregion
//#region src/vendor/backlog-engineer/templates/render-packet-template.ts
var PACKET_TEMPLATE = `{
  "context": {
    "glossary": [
      {
        "term": "<term_if_needed>",
        "definition": "<definition_if_needed>",
        "aliases": ["<optional_alias>"]
      }
    ],
    "key_strategy": {
      "module_prefix": "<module_prefix>",
      "item_pattern": "<module>-<capability>-<result>"
    },
    "target_system": [
      {
        "area": "<system_area>",
        "summary": "<what_should_exist_or_how_it_should_work>",
        "services": ["<service_name>"]
      }
    ],
    "as_built": [
      {
        "area": "<system_area>",
        "implemented_services": ["<implemented_service_if_any>"],
        "missing_services": ["<missing_service_if_any>"]
      }
    ],
    "claims": [
      {
        "claim_key": "<module>-<claim>",
        "title": "<requirement_or_architectural_claim>",
        "claim_class": "behavior",
        "commitment": "required",
        "source_ids": ["<source_id_1>"]
      }
    ],
    "contracts": [
      {
        "contract_key": "<module>-<contract>",
        "title": "<contract_title>",
        "owner": "<owner_team>",
        "versioning_strategy": "<versioning_strategy>",
        "reconciliation_strategy": "<reconciliation_strategy>",
        "deprecation_window": "<deprecation_window_or_na>",
        "retirement_condition": "<retirement_condition_or_na>"
      }
    ],
    "data_domains": [
      {
        "data_domain_key": "<module>-<data_domain>",
        "title": "<data_domain_title>",
        "data_class": "<data_class>",
        "owners": ["<owner_team>"]
      }
    ],
    "quality_attributes": [
      {
        "quality_attribute_key": "<module>-<quality_attribute>",
        "title": "<quality_requirement>",
        "quality_class": "<quality_class>",
        "target": "<measurable_target>",
        "applies_to_item_keys": ["<module>-<capability>-<result>"],
        "owner_keys": ["<owner_team>"],
        "source_ids": ["<source_id_1>"]
      }
    ],
    "policy_decisions": []
  },
  "items": [
    {
      "item_key": "<module>-<capability>-<result>",
      "title": "<task_title>",
      "type": "feature",
      "delivery_state": "defined",
      "gaps": [],
      "depends_on_keys": [],
      "origin_source_ids": ["<source_id_1>"],
      "specification_source_ids": ["<source_id_1>"],
      "plan_source_ids": [],
      "implementation_source_ids": [],
      "test_source_ids": [],
      "claim_keys": ["<module>-<claim>"],
      "contract_keys": ["<module>-<contract>"],
      "data_domain_keys": ["<module>-<data_domain>"],
      "quality_attribute_keys": ["<module>-<quality_attribute>"],
      "policy_decision_keys": []
    }
  ]
}
`;
function renderPacketTemplate() {
	return PACKET_TEMPLATE;
}
//#endregion
//#region src/vendor/backlog-engineer/templates/render-patch-template.ts
function renderPatchTemplate(payload) {
	payload.kind;
	return `${JSON.stringify({
		metadata: {
			patch_id: payload.patchId,
			created_at: payload.createdAt,
			sequence: payload.sequence,
			target_item_keys: payload.targetItemKeys
		},
		operations: []
	}, null, 2)}\n`;
}
//#endregion
//#region src/vendor/backlog-engineer/templates/index.ts
function createTemplatesModule() {
	return {
		renderBacklogAgentsTemplate,
		renderPacketTemplate,
		renderPatchTemplate
	};
}
//#endregion
//#region src/vendor/backlog-engineer/hooks/no-op-hooks.ts
function createNoOpRegistry() {
	return {
		beforeCommand() {
			return Promise.resolve();
		},
		afterCommand() {
			return Promise.resolve();
		},
		afterSourceRegistered() {
			return Promise.resolve();
		},
		afterPacketApplied() {
			return Promise.resolve();
		},
		afterPatchApplied() {
			return Promise.resolve();
		},
		afterRefresh() {
			return Promise.resolve();
		},
		buildSystemSummary() {
			return Promise.resolve([]);
		},
		decorateReportSections({ sections }) {
			return Promise.resolve(sections);
		}
	};
}
//#endregion
//#region src/vendor/backlog-engineer/runtime/ports.ts
function createFsError(code, targetPath) {
	const error = /* @__PURE__ */ new Error(`${code}: ${targetPath}`);
	error.code = code;
	error.path = targetPath;
	return error;
}
function createNodeFileSystemPort() {
	return {
		async readText(filePath) {
			return fs.readFile(filePath, "utf8");
		},
		async readTextNoFollow(filePath) {
			const handle = await fs.open(filePath, constants.O_RDONLY | constants.O_NOFOLLOW);
			try {
				return await handle.readFile({ encoding: "utf8" });
			} finally {
				await handle.close();
			}
		},
		async writeText(filePath, content) {
			await fs.writeFile(filePath, content, "utf8");
		},
		async writeTextExclusive(filePath, content) {
			await fs.writeFile(filePath, content, {
				encoding: "utf8",
				flag: "wx"
			});
		},
		async rename(fromPath, toPath) {
			await fs.rename(fromPath, toPath);
		},
		async exists(filePath) {
			try {
				await fs.access(filePath);
				return true;
			} catch {
				return false;
			}
		},
		async mkdir(dirPath, options) {
			await fs.mkdir(dirPath, options);
		},
		async readdir(dirPath) {
			return (await fs.readdir(dirPath)).sort((left, right) => left.localeCompare(right));
		},
		async rm(targetPath, options) {
			await fs.rm(targetPath, options);
		},
		async stat(targetPath) {
			const stat = await fs.stat(targetPath);
			return {
				isFile: stat.isFile(),
				isDirectory: stat.isDirectory(),
				isSymbolicLink: false,
				size: stat.size,
				mtimeMs: stat.mtimeMs
			};
		},
		async lstat(targetPath) {
			const stat = await fs.lstat(targetPath);
			return {
				isFile: stat.isFile(),
				isDirectory: stat.isDirectory(),
				isSymbolicLink: stat.isSymbolicLink(),
				size: stat.size,
				mtimeMs: stat.mtimeMs
			};
		},
		async realpath(targetPath) {
			return fs.realpath(targetPath);
		},
		async openDirectory(targetPath) {
			if (process.platform !== "linux") throw createFsError("ENOTSUP", path.resolve(targetPath));
			const root = path.parse(targetPath).root;
			const segments = path.resolve(targetPath).slice(root.length).split(path.sep).filter((segment) => segment.length > 0);
			let handle = await fs.open(root, constants.O_RDONLY | constants.O_DIRECTORY);
			try {
				for (const segment of segments) {
					const nextPath = path.posix.join("/proc/self/fd", String(handle.fd), segment);
					const nextHandle = await fs.open(nextPath, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
					await handle.close();
					handle = nextHandle;
				}
			} catch (error) {
				await handle.close().catch(() => void 0);
				throw error;
			}
			return {
				resolveEntry(name) {
					return path.posix.join("/proc/self/fd", String(handle.fd), name);
				},
				close() {
					return handle.close();
				}
			};
		},
		cwd() {
			return path.resolve(process.cwd());
		},
		chdir(targetPath) {
			process.chdir(targetPath);
		}
	};
}
function createNodePathPort() {
	return {
		resolve(...parts) {
			return path.resolve(...parts);
		},
		dirname(pathValue) {
			return path.dirname(pathValue);
		},
		basename(pathValue) {
			return path.basename(pathValue);
		},
		relative(from, to) {
			return path.relative(from, to);
		},
		normalize(pathValue) {
			return path.normalize(pathValue);
		},
		join(...parts) {
			return path.join(...parts);
		}
	};
}
function createNodeClockPort() {
	return { nowIsoUtc() {
		return (/* @__PURE__ */ new Date()).toISOString();
	} };
}
function createNodeUuidPort() {
	return { create() {
		return crypto.randomUUID();
	} };
}
function createNodeHashPort() {
	return { sha256Text(text) {
		return Promise.resolve(crypto.createHash("sha256").update(text).digest("hex"));
	} };
}
function createNodeRuntimeDependencies(overrides = {}) {
	return {
		fs: overrides.fs ?? createNodeFileSystemPort(),
		path: overrides.path ?? createNodePathPort(),
		clock: overrides.clock ?? createNodeClockPort(),
		uuid: overrides.uuid ?? createNodeUuidPort(),
		hash: overrides.hash ?? createNodeHashPort(),
		hooks: overrides.hooks ?? createNoOpRegistry()
	};
}
//#endregion
//#region src/vendor/backlog-engineer/runtime/root-discovery.ts
function rootMarkerPath(pathPort, root) {
	return pathPort.join(root, ROOT_MARKER_BASENAME);
}
async function findBacklogRoot(fsPort, pathPort, startPath) {
	let cursor = pathPort.resolve(startPath);
	while (true) {
		const markerPath = rootMarkerPath(pathPort, cursor);
		if (await fsPort.exists(markerPath)) {
			const markerStat = await fsPort.lstat(markerPath);
			if (markerStat.isFile && !markerStat.isSymbolicLink) return cursor;
		}
		const parent = pathPort.dirname(cursor);
		if (parent === cursor) return;
		cursor = parent;
	}
}
async function resolveCommandBacklogRoot(payload) {
	return findBacklogRoot(payload.fs, payload.path, payload.cwd);
}
//#endregion
//#region src/vendor/backlog-engineer/runtime/rebuild-state.ts
function collectItemSourceIds$1(item) {
	return new Set([
		...item.origin_source_ids,
		...item.specification_source_ids,
		...item.plan_source_ids,
		...item.implementation_source_ids,
		...item.test_source_ids
	]);
}
function shouldRetainRuntimeTodo(payload) {
	const item = payload.rebuiltItemsByKey.get(payload.todo.item_key);
	if (!item) return false;
	if (payload.todo.managed_by !== "refresh") return true;
	if (!payload.todo.related_item_keys.every((itemKey) => payload.rebuiltItemsByKey.has(itemKey))) return false;
	if (!payload.todo.related_sources.every((source) => payload.sourceLabelsById.has(source.source_id))) return false;
	if (payload.todo.type === "review_source_change") {
		const itemSourceIds = collectItemSourceIds$1(item);
		return payload.todo.related_sources.every((source) => itemSourceIds.has(source.source_id));
	}
	if (payload.todo.type === "review_dependency_change") return payload.todo.related_item_keys.every((itemKey) => item.depends_on_keys.includes(itemKey));
	return true;
}
function deepEqual(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}
function createEmptyContext() {
	return {
		glossary: [],
		key_strategy: {},
		target_system: [],
		as_built: [],
		claims: [],
		contracts: [],
		data_domains: [],
		quality_attributes: [],
		policy_decisions: []
	};
}
function createEmptyState(payload) {
	return payload.schemas.parseStateFile({
		schema_version: 1,
		created_at: payload.createdAt,
		updated_at: payload.updatedAt,
		last_refresh_at: payload.lastRefreshAt,
		context: createEmptyContext(),
		items: [],
		todos: []
	});
}
function validatePatchKind(payload) {
	if (payload.patch.metadata.patch_id !== payload.entry.patch_id) throw payload.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, { details: {
		patch_id: payload.entry.patch_id,
		reason: "Patch metadata does not match applied registry entry."
	} });
	if (payload.patch.metadata.target_item_keys.length !== payload.entry.target_item_keys.length || payload.patch.metadata.target_item_keys.some((itemKey, index) => itemKey !== payload.entry.target_item_keys[index])) throw payload.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, { details: {
		patch_id: payload.entry.patch_id,
		reason: "Patch metadata target_item_keys do not match applied registry entry."
	} });
	if (payload.entry.kind === "patch-item") {
		if (payload.patch.operations.some((operation) => operation.action === "remove_item" || operation.action === "remove_source_references")) throw payload.errors.create("BE_PATCH_OPERATION_INVALID", void 0, { details: { patch_id: payload.entry.patch_id } });
		return;
	}
	if (payload.entry.kind === "source-maintenance") {
		if (payload.patch.operations.some((operation) => operation.action !== "remove_source_references")) throw payload.errors.create("BE_PATCH_OPERATION_INVALID", void 0, { details: { patch_id: payload.entry.patch_id } });
		const affectedKeys = new Set(payload.patch.operations.flatMap((operation) => operation.action === "remove_source_references" ? operation.affected_item_keys : []));
		if (affectedKeys.size !== payload.entry.target_item_keys.length || payload.entry.target_item_keys.some((itemKey) => !affectedKeys.has(itemKey))) throw payload.errors.create("BE_PATCH_OPERATION_INVALID", void 0, { details: {
			patch_id: payload.entry.patch_id,
			reason: "source-maintenance affected_item_keys must cover target_item_keys."
		} });
		return;
	}
	const removedKeys = new Set(payload.patch.operations.filter((operation) => operation.action === "remove_item").map((operation) => operation.item_key));
	if (payload.patch.operations.some((operation) => operation.action !== "remove_item") || payload.entry.target_item_keys.some((itemKey) => !removedKeys.has(itemKey))) throw payload.errors.create("BE_PATCH_OPERATION_INVALID", void 0, { details: { patch_id: payload.entry.patch_id } });
}
function createArtifactReplayFailedError(payload) {
	const isMissingCanonicalArtifact = payload.errors.isBacklogError(payload.error) && payload.error.code === "BE_CANONICAL_ARTIFACT_MISSING";
	return payload.errors.create(isMissingCanonicalArtifact ? "BE_CANONICAL_ARTIFACT_MISSING" : "BE_REBUILD_REPLAY_FAILED", isMissingCanonicalArtifact ? `Canonical ${payload.artifactKind} artifact referenced by applied registry is missing.` : payload.message, {
		details: {
			artifact_kind: payload.artifactKind,
			canonical_path: payload.canonicalPath,
			...payload.packetId ? { packet_id: payload.packetId } : {},
			...payload.patchId ? { patch_id: payload.patchId } : {},
			...payload.applyIndex !== void 0 ? { apply_index: payload.applyIndex } : {},
			...payload.sequence !== void 0 ? { sequence: payload.sequence } : {},
			...payload.errors.isBacklogError(payload.error) ? {
				original_code: payload.error.code,
				original_message: payload.error.message
			} : payload.error instanceof Error ? { original_message: payload.error.message } : {}
		},
		hint: isMissingCanonicalArtifact ? "Restore the referenced canonical artifact or undo the invalid registry reference through the documented backlog workflow; do not repair state.json or applied.json manually." : "Inspect the named canonical artifact. Do not repair rebuild failures by manually editing state.json or applied.json.",
		cause: payload.error
	});
}
async function readCanonicalPacket(payload) {
	const filePath = payload.dependencies.path.resolve(payload.backlogRoot, payload.canonicalPath);
	return readJsonArtifact({
		fs: payload.dependencies.fs,
		path: payload.dependencies.path,
		errors: payload.errors,
		root: payload.backlogRoot,
		filePath,
		parse: (raw) => payload.schemas.parsePacketFile(raw),
		readErrorCode: "BE_INTERNAL_STATE_CORRUPT",
		missingCode: "BE_CANONICAL_ARTIFACT_MISSING",
		corruptCode: "BE_INTERNAL_STATE_CORRUPT"
	});
}
async function readCanonicalPatch(payload) {
	const filePath = payload.dependencies.path.resolve(payload.backlogRoot, payload.canonicalPath);
	return readJsonArtifact({
		fs: payload.dependencies.fs,
		path: payload.dependencies.path,
		errors: payload.errors,
		root: payload.backlogRoot,
		filePath,
		parse: (raw) => payload.schemas.parsePatchFile(raw),
		readErrorCode: "BE_INTERNAL_STATE_CORRUPT",
		missingCode: "BE_CANONICAL_ARTIFACT_MISSING",
		corruptCode: "BE_INTERNAL_STATE_CORRUPT"
	});
}
async function loadRuntimeArtifacts(payload) {
	const [rootMarker, sourceRegistry, appliedRegistry] = await Promise.all([
		payload.artifacts.readRootMarker(payload.backlogRoot),
		payload.artifacts.readSourceRegistry(payload.backlogRoot),
		payload.artifacts.readAppliedRegistry(payload.backlogRoot)
	]);
	return {
		rootMarkerCreatedAt: rootMarker.created_at,
		sourceRegistry,
		appliedRegistry
	};
}
function preserveRuntimeMetadata(payload) {
	if (!payload.currentState) return payload.schemas.parseStateFile(payload.rebuiltState);
	const rebuiltItemsByKey = new Map(payload.rebuiltState.items.map((item) => [item.item_key, item]));
	const sourceLabelsById = new Map(payload.sourceRegistry.sources.map((source) => [source.source_id, source.source_label]));
	const retainedTodos = payload.currentState.todos.filter((todo) => shouldRetainRuntimeTodo({
		todo,
		rebuiltItemsByKey,
		sourceLabelsById
	})).map((todo) => ({
		...todo,
		related_sources: todo.related_sources.map((source) => ({
			source_id: source.source_id,
			source_label: sourceLabelsById.get(source.source_id) ?? source.source_label
		}))
	}));
	return recomputeDerivedState({
		schemas: payload.schemas,
		state: payload.schemas.parseStateFile({
			...payload.rebuiltState,
			created_at: payload.currentState.created_at,
			updated_at: payload.currentState.updated_at,
			last_refresh_at: payload.currentState.last_refresh_at,
			todos: retainedTodos
		})
	});
}
function stampUpdatedAt(payload) {
	return payload.schemas.parseStateFile({
		...payload.state,
		updated_at: payload.updatedAt
	});
}
async function rebuildStateFromCanonicalArtifacts(payload) {
	const runtimeArtifacts = await loadRuntimeArtifacts({
		backlogRoot: payload.backlogRoot,
		artifacts: payload.artifacts
	});
	const currentState = payload.currentState;
	let state = createEmptyState({
		schemas: payload.schemas,
		createdAt: currentState?.created_at ?? runtimeArtifacts.rootMarkerCreatedAt,
		updatedAt: currentState?.updated_at ?? payload.dependencies.clock.nowIsoUtc(),
		lastRefreshAt: currentState?.last_refresh_at ?? null
	});
	const packetEntries = [...runtimeArtifacts.appliedRegistry.packets].sort((left, right) => {
		const applyCompare = left.apply_index - right.apply_index;
		if (applyCompare !== 0) return applyCompare;
		return left.canonical_path.localeCompare(right.canonical_path);
	});
	for (const packetEntry of packetEntries) {
		let packet;
		try {
			packet = await readCanonicalPacket({
				backlogRoot: payload.backlogRoot,
				dependencies: payload.dependencies,
				schemas: payload.schemas,
				errors: payload.errors,
				canonicalPath: packetEntry.canonical_path
			});
		} catch (error) {
			throw createArtifactReplayFailedError({
				artifactKind: "packet",
				canonicalPath: packetEntry.canonical_path,
				errors: payload.errors,
				error,
				message: "Backlog rebuild failed while reading a canonical packet.",
				packetId: packetEntry.packet_id,
				applyIndex: packetEntry.apply_index
			});
		}
		if (JSON.stringify(packet.items.map((item) => item.item_key)) !== JSON.stringify(packetEntry.item_keys)) {
			const error = payload.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, { details: {
				packet_id: packetEntry.packet_id,
				reason: "Packet item_keys do not match applied registry entry."
			} });
			throw createArtifactReplayFailedError({
				artifactKind: "packet",
				canonicalPath: packetEntry.canonical_path,
				errors: payload.errors,
				error,
				message: "Backlog rebuild failed while validating a canonical packet.",
				packetId: packetEntry.packet_id,
				applyIndex: packetEntry.apply_index
			});
		}
		try {
			state = applyPacketReplay({
				state,
				packet,
				errors: payload.errors
			});
		} catch (error) {
			throw createArtifactReplayFailedError({
				artifactKind: "packet",
				canonicalPath: packetEntry.canonical_path,
				errors: payload.errors,
				error,
				message: "Backlog rebuild failed while replaying a canonical packet.",
				packetId: packetEntry.packet_id,
				applyIndex: packetEntry.apply_index
			});
		}
	}
	const patchEntries = [...runtimeArtifacts.appliedRegistry.patches].sort((left, right) => {
		const applyCompare = left.apply_index - right.apply_index;
		if (applyCompare !== 0) return applyCompare;
		const sequenceCompare = left.sequence - right.sequence;
		if (sequenceCompare !== 0) return sequenceCompare;
		return left.canonical_path.localeCompare(right.canonical_path);
	});
	for (const patchEntry of patchEntries) {
		let patch;
		try {
			patch = await readCanonicalPatch({
				backlogRoot: payload.backlogRoot,
				dependencies: payload.dependencies,
				schemas: payload.schemas,
				errors: payload.errors,
				canonicalPath: patchEntry.canonical_path
			});
		} catch (error) {
			throw createArtifactReplayFailedError({
				artifactKind: "patch",
				canonicalPath: patchEntry.canonical_path,
				errors: payload.errors,
				error,
				message: "Backlog rebuild failed while reading a canonical patch.",
				patchId: patchEntry.patch_id,
				applyIndex: patchEntry.apply_index,
				sequence: patchEntry.sequence
			});
		}
		try {
			validatePatchKind({
				entry: patchEntry,
				patch,
				errors: payload.errors
			});
		} catch (error) {
			throw createArtifactReplayFailedError({
				artifactKind: "patch",
				canonicalPath: patchEntry.canonical_path,
				errors: payload.errors,
				error,
				message: "Backlog rebuild failed while validating a canonical patch.",
				patchId: patchEntry.patch_id,
				applyIndex: patchEntry.apply_index,
				sequence: patchEntry.sequence
			});
		}
		state = applyPatchReplay({
			state,
			patch,
			errors: payload.errors,
			missingTodoPolicy: "ignore",
			replayContext: {
				applyIndex: patchEntry.apply_index,
				canonicalPath: patchEntry.canonical_path,
				kind: patchEntry.kind,
				sequence: patchEntry.sequence
			}
		});
	}
	validateSourceRegistryReferences({
		state,
		availableSourceIds: new Set(runtimeArtifacts.sourceRegistry.sources.map((source) => source.source_id)),
		errors: payload.errors
	});
	return preserveRuntimeMetadata({
		rebuiltState: recomputeDerivedState({
			schemas: payload.schemas,
			state
		}),
		currentState,
		schemas: payload.schemas,
		sourceRegistry: runtimeArtifacts.sourceRegistry
	});
}
function areStatesEquivalent(left, right) {
	return deepEqual(left, right);
}
function updateRebuiltStateTimestamp(payload) {
	return stampUpdatedAt(payload);
}
//#endregion
//#region src/vendor/backlog-engineer/runtime/state-recovery.ts
function createFileBackedStateCoordinator() {
	return {
		async ensureQueryState(payload) {
			let currentState;
			const updatedAt = payload.dependencies.clock.nowIsoUtc();
			try {
				currentState = await payload.modules.artifacts.readState(payload.backlogRoot);
			} catch (error) {
				if (!payload.modules.errors.isBacklogError(error) || error.code !== "BE_INTERNAL_STATE_CORRUPT") throw error;
			}
			const rebuiltState = await rebuildStateFromCanonicalArtifacts({
				backlogRoot: payload.backlogRoot,
				dependencies: payload.dependencies,
				artifacts: payload.modules.artifacts,
				schemas: payload.modules.schemas,
				errors: payload.modules.errors,
				...currentState ? { currentState } : {}
			});
			if (currentState && areStatesEquivalent(currentState, rebuiltState)) return {
				state: currentState,
				rebuilt: false
			};
			const stateToPersist = currentState ? updateRebuiltStateTimestamp({
				state: rebuiltState,
				schemas: payload.modules.schemas,
				updatedAt
			}) : rebuiltState;
			await payload.modules.artifacts.writeState(payload.backlogRoot, stateToPersist);
			return {
				state: stateToPersist,
				rebuilt: true
			};
		},
		async ensureMutationState(payload) {
			const currentState = await payload.modules.artifacts.readState(payload.backlogRoot);
			const rebuiltState = await rebuildStateFromCanonicalArtifacts({
				backlogRoot: payload.backlogRoot,
				dependencies: payload.dependencies,
				artifacts: payload.modules.artifacts,
				schemas: payload.modules.schemas,
				errors: payload.modules.errors,
				currentState
			});
			if (areStatesEquivalent(currentState, rebuiltState)) return currentState;
			return rebuiltState;
		},
		rebuildState(payload) {
			return rebuildStateFromCanonicalArtifacts({
				backlogRoot: payload.backlogRoot,
				dependencies: payload.dependencies,
				artifacts: payload.modules.artifacts,
				schemas: payload.modules.schemas,
				errors: payload.modules.errors
			});
		}
	};
}
//#endregion
//#region src/vendor/backlog-engineer/runtime/mutation-lock.ts
function isErrnoException$1(error) {
	return error instanceof Error && "code" in error;
}
async function acquireMutationLock(payload) {
	const lockPath = getMutationLockPath(payload.path, payload.backlogRoot);
	const parentDirectory = await openManagedParentDirectory({
		fs: payload.fs,
		path: payload.path,
		errors: payload.errors,
		root: payload.backlogRoot,
		filePath: lockPath,
		errorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
	const stableLockPath = parentDirectory.resolveEntry(payload.path.basename(lockPath));
	const content = `${JSON.stringify({
		command: payload.command,
		cwd: payload.cwd,
		acquired_at: payload.acquiredAt
	}, null, 2)}\n`;
	try {
		await payload.fs.writeTextExclusive(stableLockPath, content);
	} catch (error) {
		await parentDirectory.close().catch(() => void 0);
		if (isErrnoException$1(error) && error.code === "EEXIST") throw payload.errors.create("BE_MUTATION_LOCKED", void 0, {
			details: {
				backlog_root: payload.backlogRoot,
				lock_path: lockPath
			},
			cause: error
		});
		throw payload.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, {
			details: { path: stableLockPath },
			cause: error
		});
	}
	return async () => {
		try {
			await payload.fs.rm(stableLockPath, { force: true });
		} catch (error) {
			if (isErrnoException$1(error) && error.code === "ENOENT") {
				await parentDirectory.close().catch(() => void 0);
				return;
			}
			await parentDirectory.close().catch(() => void 0);
			throw payload.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, {
				details: { path: stableLockPath },
				cause: error
			});
		}
		await parentDirectory.close();
	};
}
//#endregion
//#region src/vendor/backlog-engineer/runtime/create-runtime.ts
function isErrnoException(error) {
	return error instanceof Error && "code" in error;
}
function buildRuntimeModules(dependencies, overrides = {}) {
	const errors = overrides?.errors ?? createErrorModule();
	const schemas = overrides?.schemas ?? createSchemaModule();
	const core = overrides?.core ?? createCoreModule({
		errors,
		schemas,
		clock: dependencies.clock,
		uuid: dependencies.uuid
	});
	return {
		artifacts: overrides?.artifacts ?? createArtifactsModule({
			fs: dependencies.fs,
			path: dependencies.path,
			hash: dependencies.hash,
			schemas,
			errors
		}),
		sources: overrides?.sources ?? createSourcesModule({
			fs: dependencies.fs,
			path: dependencies.path,
			hash: dependencies.hash,
			clock: dependencies.clock,
			schemas,
			errors
		}),
		templates: overrides?.templates ?? createTemplatesModule(),
		reports: overrides?.reports ?? createReportsModule({
			items: core.items,
			attention: core.attention,
			queue: core.queue,
			hooks: dependencies.hooks
		}),
		schemas,
		errors,
		hooks: dependencies.hooks,
		core
	};
}
function createRuntime(options = {}) {
	const dependencies = createNodeRuntimeDependencies(options.dependencies);
	const modules = buildRuntimeModules(dependencies, options.modules);
	const stateCoordinator = options.stateCoordinator ?? createFileBackedStateCoordinator();
	return {
		getProcessCwd() {
			return dependencies.fs.cwd();
		},
		async createContext(command, cwd) {
			const backlogRoot = await resolveCommandBacklogRoot({
				command,
				cwd,
				fs: dependencies.fs,
				path: dependencies.path
			});
			if (!backlogRoot && command !== "init") throw modules.errors.create("BE_ROOT_NOT_FOUND", void 0, {
				details: {
					command,
					cwd: dependencies.path.resolve(cwd),
					root_marker: ROOT_MARKER_BASENAME
				},
				hint: "Run `dossier-engineer init --path <path>` inside a new unified process root or execute the command from an existing managed directory."
			});
			const coordinatorPayload = backlogRoot === void 0 ? void 0 : {
				backlogRoot,
				dependencies,
				modules
			};
			return {
				host: {
					resolveCliPath(inputPath) {
						return dependencies.path.resolve(cwd, inputPath);
					},
					async readCliTextFile(inputPath) {
						const absolutePath = dependencies.path.resolve(cwd, inputPath);
						try {
							await ensureNoSymlinkAncestors({
								fs: dependencies.fs,
								path: dependencies.path,
								errors: modules.errors,
								targetPath: absolutePath,
								errorCode: "BE_INPUT_FILE_NOT_FOUND"
							});
						} catch (error) {
							if (modules.errors.isBacklogError(error)) throw error;
							throw modules.errors.create("BE_INPUT_FILE_NOT_FOUND", void 0, {
								details: { path: absolutePath },
								cause: error
							});
						}
						let entry;
						try {
							entry = await dependencies.fs.lstat(absolutePath);
						} catch (error) {
							if (isErrnoException(error) && error.code === "ENOENT") throw modules.errors.create("BE_INPUT_FILE_NOT_FOUND", void 0, {
								details: { path: absolutePath },
								cause: error
							});
							if (isErrnoException(error) && error.code === "ENOTSUP") throw modules.errors.create("BE_PLATFORM_UNSUPPORTED", void 0, {
								details: { path: absolutePath },
								cause: error
							});
							throw modules.errors.create("BE_INPUT_FILE_NOT_FOUND", void 0, {
								details: {
									path: absolutePath,
									reason: "lstat_failed"
								},
								cause: error
							});
						}
						if (entry.isSymbolicLink) throw modules.errors.create("BE_INPUT_FILE_NOT_FOUND", void 0, { details: {
							path: absolutePath,
							reason: "symbolic_link"
						} });
						if (!entry.isFile) throw modules.errors.create("BE_INPUT_FILE_NOT_FOUND", void 0, { details: {
							path: absolutePath,
							reason: "not_regular_file"
						} });
						try {
							const parentDirectory = await dependencies.fs.openDirectory(dependencies.path.dirname(absolutePath));
							try {
								return {
									absolutePath,
									canonicalBasename: dependencies.path.basename(absolutePath),
									rawContent: await dependencies.fs.readTextNoFollow(parentDirectory.resolveEntry(dependencies.path.basename(absolutePath)))
								};
							} finally {
								await parentDirectory.close();
							}
						} catch (error) {
							if (isErrnoException(error) && error.code === "ENOENT") throw modules.errors.create("BE_INPUT_FILE_NOT_FOUND", void 0, {
								details: { path: absolutePath },
								cause: error
							});
							if (isErrnoException(error) && error.code === "ENOTSUP") throw modules.errors.create("BE_PLATFORM_UNSUPPORTED", void 0, {
								details: { path: absolutePath },
								cause: error
							});
							throw modules.errors.create("BE_INPUT_FILE_NOT_FOUND", void 0, {
								details: {
									path: absolutePath,
									reason: "read_failed"
								},
								cause: error
							});
						}
					},
					getProcessCwd() {
						return dependencies.fs.cwd();
					},
					chdir(targetPath) {
						dependencies.fs.chdir(targetPath);
					},
					nowIsoUtc() {
						return dependencies.clock.nowIsoUtc();
					},
					createUuid() {
						return dependencies.uuid.create();
					}
				},
				...backlogRoot ? { backlogRoot } : {},
				artifacts: modules.artifacts,
				sources: modules.sources,
				templates: modules.templates,
				reports: modules.reports,
				schemas: modules.schemas,
				errors: modules.errors,
				hooks: modules.hooks,
				core: modules.core,
				async ensureQueryState() {
					if (!coordinatorPayload) throw modules.errors.create("BE_ROOT_NOT_FOUND", void 0, { details: { command } });
					return stateCoordinator.ensureQueryState(coordinatorPayload);
				},
				async ensureMutationState() {
					if (!coordinatorPayload) throw modules.errors.create("BE_ROOT_NOT_FOUND", void 0, { details: { command } });
					return stateCoordinator.ensureMutationState(coordinatorPayload);
				},
				async acquireMutationLock(lockCommand) {
					if (!backlogRoot) throw modules.errors.create("BE_ROOT_NOT_FOUND", void 0, { details: { command: lockCommand } });
					return acquireMutationLock({
						fs: dependencies.fs,
						path: dependencies.path,
						errors: modules.errors,
						backlogRoot,
						command: lockCommand,
						cwd,
						acquiredAt: dependencies.clock.nowIsoUtc()
					});
				}
			};
		},
		async rebuildState(root) {
			return stateCoordinator.rebuildState({
				backlogRoot: root,
				dependencies,
				modules
			});
		}
	};
}
//#endregion
//#region src/backlog/source-review.ts
function sourceReviewDir(root) {
	return path.join(root, ".dossier", "backlog", "source-review");
}
function sourceReviewPath(root, sourceReviewId) {
	return path.join(sourceReviewDir(root), `${sourceReviewId}.json`);
}
function createSourceReviewId(sourceId) {
	return `sr-${sourceId}`;
}
async function loadSourceReviews(root) {
	const dir = sourceReviewDir(root);
	if (!await fileExists(dir)) return [];
	const entries = await promises.readdir(dir, { withFileTypes: true });
	const reviews = [];
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
		const raw = JSON.parse(await promises.readFile(path.join(dir, entry.name), "utf8"));
		reviews.push(raw);
	}
	reviews.sort((left, right) => left.source_review_id.localeCompare(right.source_review_id));
	return reviews;
}
async function loadOpenSourceReviews(root) {
	return (await loadSourceReviews(root)).filter((review) => review.status === "open");
}
async function upsertOpenSourceReview(payload) {
	const sourceReviewId = createSourceReviewId(payload.sourceId);
	const targetPath = sourceReviewPath(payload.root, sourceReviewId);
	const existing = await fileExists(targetPath) ? JSON.parse(await promises.readFile(targetPath, "utf8")) : null;
	const normalizedLinkedItemKeys = [...new Set(payload.linkedItemKeys)].sort((left, right) => left.localeCompare(right));
	const nextRecord = existing ? {
		...existing,
		source_label: payload.sourceLabel,
		current_hash: payload.currentHash,
		linked_item_keys: normalizedLinkedItemKeys,
		linked_item_count: normalizedLinkedItemKeys.length,
		status: "open",
		closed_at: null,
		resolved_at: null,
		outcome: "pending",
		resolution_kind: null,
		resolution_ref: null
	} : {
		source_review_id: sourceReviewId,
		source_id: payload.sourceId,
		source_label: payload.sourceLabel,
		previous_hash: payload.previousHash,
		current_hash: payload.currentHash,
		status: "open",
		linked_item_keys: normalizedLinkedItemKeys,
		linked_item_count: normalizedLinkedItemKeys.length,
		opened_at: payload.now,
		closed_at: null,
		resolved_at: null,
		outcome: "pending",
		resolution_kind: null,
		resolution_ref: null
	};
	await assertManagedWritePath(payload.root, sourceReviewDir(payload.root), targetPath, "source-review artifact");
	await writeJsonAtomic(targetPath, nextRecord);
	return {
		record: nextRecord,
		created: existing === null,
		updated: existing !== null && JSON.stringify(existing) !== JSON.stringify(nextRecord)
	};
}
async function resolveSourceReview(payload) {
	const targetPath = sourceReviewPath(payload.root, payload.sourceReviewId);
	if (!await fileExists(targetPath)) throw new Error(`Source review not found: ${payload.sourceReviewId}`);
	const nextRecord = {
		...JSON.parse(await promises.readFile(targetPath, "utf8")),
		status: "closed",
		outcome: payload.outcome,
		resolution_kind: payload.resolutionKind,
		resolution_ref: payload.resolutionRef,
		resolved_at: payload.now,
		closed_at: payload.now
	};
	await assertManagedWritePath(payload.root, sourceReviewDir(payload.root), targetPath, "source-review artifact");
	await writeJsonAtomic(targetPath, nextRecord);
	return nextRecord;
}
function collectBlockedItemKeys(reviews) {
	const blocked = /* @__PURE__ */ new Set();
	for (const review of reviews) {
		if (review.status !== "open") continue;
		for (const itemKey of review.linked_item_keys) blocked.add(itemKey);
	}
	return blocked;
}
function collectSourceReviewIdsByItemKey(reviews) {
	const result = /* @__PURE__ */ new Map();
	for (const review of reviews) {
		if (review.status !== "open") continue;
		for (const itemKey of review.linked_item_keys) {
			const current = result.get(itemKey) ?? [];
			current.push(review.source_review_id);
			current.sort((left, right) => left.localeCompare(right));
			result.set(itemKey, current);
		}
	}
	return result;
}
//#endregion
//#region src/shared/cli-envelope.ts
function createCliEnvelope(payload) {
	return {
		command: payload.command,
		scope: payload.scope ?? {},
		result: payload.result ?? "ok",
		warnings: payload.warnings ?? [],
		next_commands: payload.nextCommands ?? [],
		data: payload.data
	};
}
function writeCliEnvelope(stream, payload) {
	stream.write(`${JSON.stringify(createCliEnvelope(payload))}\n`);
}
//#endregion
//#region src/backlog/commands.ts
function writeJson(stream, payload) {
	stream.write(`${JSON.stringify(payload)}\n`);
}
function buildScopeFromArgs(args, optionNames = [
	"--item-key",
	"--item-keys",
	"--source-id",
	"--source-label",
	"--source-path",
	"--path"
]) {
	const scope = {};
	for (const optionName of optionNames) {
		const value = takeOption$2(args, optionName);
		if (value !== null) scope[optionName.slice(2).replaceAll("-", "_")] = value;
	}
	return scope;
}
function shouldAcquireMutationLock(commandName, args) {
	if (commandName === "status") return args.includes("--refresh");
	return [
		"register-source",
		"update-source-path",
		"remove-source",
		"packet",
		"patch-item",
		"remove-item",
		"refresh",
		"report"
	].includes(commandName);
}
function adaptUsage(usage) {
	return usage.map((entry) => entry.replaceAll("backlog-engineer", "dossier-engineer"));
}
function adaptOptions(command) {
	return command.options.map((option) => {
		const suffix = option.value_name ? ` ${option.value_name}` : "";
		return `${option.flags.join(", ")}${suffix} — ${option.description}`;
	});
}
function writeBacklogError(io, error) {
	writeJson(io.stderr, error.toPayload());
	return error.exitCode;
}
async function runVendoredBacklogCommand(command, args, options = {}) {
	const input = command.parseArgs(args);
	const runtime = createRuntime();
	const commandName = command.name;
	const context = await runtime.createContext(commandName, runtime.getProcessCwd());
	const vendoredReleaseMutationLock = context.backlogRoot && shouldAcquireMutationLock(command.name, args) ? await context.acquireMutationLock(commandName) : void 0;
	let released = false;
	const releaseMutationLock = async () => {
		if (released) return;
		released = true;
		await vendoredReleaseMutationLock?.();
	};
	try {
		const output = command.outputSchema.parse(await command.execute(input, context));
		if (options.deferMutationUnlock) return {
			context,
			output,
			releaseMutationLock
		};
		await releaseMutationLock();
		return {
			context,
			output
		};
	} catch (error) {
		await releaseMutationLock();
		throw error;
	}
}
function collectItemSourceIds(item) {
	return new Set([
		...item.origin_source_ids,
		...item.specification_source_ids,
		...item.plan_source_ids,
		...item.implementation_source_ids,
		...item.test_source_ids
	]);
}
function resolveRefreshScope(payload) {
	const itemKey = takeOption$2(payload.args, "--item-key");
	const sourceId = takeOption$2(payload.args, "--source-id");
	const sourceLabel = takeOption$2(payload.args, "--source-label");
	const sourcePath = takeOption$2(payload.args, "--source-path");
	if ([
		itemKey,
		sourceId,
		sourceLabel,
		sourcePath
	].filter(Boolean).length > 1) throw new Error("Use only one selector for refresh.");
	if (!payload.context.backlogRoot) throw new Error("Backlog root not available.");
	if (itemKey) {
		const item = payload.state.items.find((entry) => entry.item_key === itemKey);
		if (!item) throw new Error(`Unknown item key: ${itemKey}`);
		return Promise.resolve({ selectedSourceIds: [...collectItemSourceIds(item)].sort((left, right) => left.localeCompare(right)) });
	}
	if (sourceId || sourceLabel || sourcePath) {
		const scope = payload.context.sources.resolveSourceScope({
			backlogRoot: payload.context.backlogRoot,
			state: payload.state,
			registry: payload.registry,
			selector: sourceId ? {
				kind: "source_id",
				source_id: sourceId
			} : sourceLabel ? {
				kind: "source_label",
				source_label: sourceLabel
			} : {
				kind: "source_path",
				source_path: payload.context.host.resolveCliPath(sourcePath ?? "")
			}
		});
		return Promise.resolve({ selectedSourceIds: scope.sourceIds });
	}
	return Promise.resolve({ selectedSourceIds: payload.registry.sources.map((source) => source.source_id) });
}
function relatedItemKeysForSource(state, sourceId) {
	return state.items.filter((item) => collectItemSourceIds(item).has(sourceId)).map((item) => item.item_key).sort((left, right) => left.localeCompare(right));
}
async function maybeResolveSourceReviewsFromItemKeys(payload) {
	const openReviews = await loadOpenSourceReviews(payload.root);
	const itemKeySet = new Set(payload.itemKeys);
	const resolved = [];
	for (const review of openReviews) {
		if (!review.linked_item_keys.some((itemKey) => itemKeySet.has(itemKey))) continue;
		if (!review.linked_item_keys.every((itemKey) => itemKeySet.has(itemKey))) continue;
		resolved.push(await resolveSourceReview({
			root: payload.root,
			sourceReviewId: review.source_review_id,
			outcome: payload.kind === "packet" ? "created_new_item" : "patched_existing_items",
			resolutionKind: payload.kind,
			resolutionRef: payload.resolutionRef,
			now: (/* @__PURE__ */ new Date()).toISOString()
		}));
	}
	return resolved;
}
async function maybeResolveSourceReviewsFromSourceId(payload) {
	const matching = (await loadOpenSourceReviews(payload.root)).filter((review) => review.source_id === payload.sourceId);
	const resolved = [];
	for (const review of matching) resolved.push(await resolveSourceReview({
		root: payload.root,
		sourceReviewId: review.source_review_id,
		outcome: "source_maintenance",
		resolutionKind: payload.kind,
		resolutionRef: payload.resolutionRef,
		now: (/* @__PURE__ */ new Date()).toISOString()
	}));
	return resolved;
}
function overlayItemsWithSourceReviewBlock(items, openReviews) {
	const blockedItemKeys = collectBlockedItemKeys(openReviews);
	const reviewIdsByItemKey = collectSourceReviewIdsByItemKey(openReviews);
	return items.map((card) => ({
		...card,
		computed_state: {
			...card.computed_state,
			ready_for_next_step: blockedItemKeys.has(card.item.item_key) ? false : card.computed_state.ready_for_next_step
		},
		source_review_blocked: blockedItemKeys.has(card.item.item_key),
		open_source_review_ids: reviewIdsByItemKey.get(card.item.item_key) ?? []
	}));
}
function overlayQueueWithSourceReviewBlock(queue, openReviews) {
	const blockedItemKeys = collectBlockedItemKeys(openReviews);
	return queue.map((chain) => ({
		...chain,
		items: chain.items.filter((itemKey) => !blockedItemKeys.has(itemKey))
	})).filter((chain) => chain.items.length > 0);
}
function overlaySearchWithSourceReviewBlock(results, openReviews) {
	const blockedItemKeys = collectBlockedItemKeys(openReviews);
	return results.map((entry) => ({
		...entry,
		ready_for_next_step: blockedItemKeys.has(entry.item_key) ? false : entry.ready_for_next_step,
		source_review_blocked: blockedItemKeys.has(entry.item_key)
	}));
}
function buildAttentionOutput(payload) {
	const sourceReviewEntries = payload.openReviews.map((review) => ({
		entry_kind: "source_review",
		source_review_id: review.source_review_id,
		source_id: review.source_id,
		source_label: review.source_label,
		linked_item_keys: review.linked_item_keys,
		linked_item_count: review.linked_item_count,
		status: review.status,
		next_commands: [
			"dossier-engineer attention",
			`dossier-engineer items --item-keys ${review.linked_item_keys.length > 0 ? review.linked_item_keys.join(",") : "<item-key>"}`,
			`dossier-engineer ack-source-review --source-review-id ${review.source_review_id}`
		]
	}));
	const itemEntries = payload.itemAttention.map((entry) => ({
		entry_kind: "item",
		...entry
	}));
	return [...sourceReviewEntries, ...itemEntries];
}
function buildStatusOutput(payload) {
	const blockedItemCount = collectBlockedItemKeys(payload.openReviews).size;
	return {
		...payload.baseStatus,
		ready_for_next_step_count: payload.adjustedReadyForNextStepCount,
		open_source_review_count: payload.openReviews.length,
		source_review_blocked_item_count: blockedItemCount
	};
}
function takeOption$2(args, name) {
	const exact = args.indexOf(name);
	if (exact !== -1) {
		const value = args[exact + 1];
		if (!value || value.startsWith("--")) return null;
		return value;
	}
	const prefix = `${name}=`;
	const inline = args.find((arg) => arg.startsWith(prefix));
	return inline ? inline.slice(prefix.length) : null;
}
async function runInitCommand(args, io) {
	if (args.includes("--help") || args.includes("-h")) {
		io.stdout.write("dossier-engineer init --path <path>\n");
		return 0;
	}
	const outputPath = takeOption$2(args, "--path");
	if (!outputPath) {
		writeJson(io.stderr, { error: {
			code: "UDE_USAGE",
			message: "--path is required."
		} });
		return 2;
	}
	try {
		const root = path.resolve(process.cwd(), outputPath);
		const result = await initializeProcessRoot(root);
		writeCliEnvelope(io.stdout, {
			command: "init",
			scope: { path: root },
			data: {
				path: root,
				process_manifest_path: result.processManifestPath,
				backlog_manifest_path: result.backlogManifestPath,
				index_path: result.indexFilePath,
				dossiers_dir: result.dossiersDirPath
			},
			nextCommands: ["dossier-engineer register-source --path <path> --kind spec --authority repo"]
		});
		return 0;
	} catch (error) {
		writeJson(io.stderr, { error: {
			code: "UDE_INIT_FAILED",
			message: error instanceof Error ? error.message : String(error)
		} });
		return 1;
	}
}
async function runRefreshCommand(args, io) {
	try {
		const runtime = createRuntime();
		const context = await runtime.createContext("refresh", runtime.getProcessCwd());
		if (!context.backlogRoot) throw new Error("Backlog root not found.");
		const releaseMutationLock = await context.acquireMutationLock("refresh");
		try {
			const [state, registry] = await Promise.all([context.ensureMutationState(), context.artifacts.readSourceRegistry(context.backlogRoot)]);
			const { selectedSourceIds } = await resolveRefreshScope({
				args,
				context,
				registry,
				state
			});
			const changedBefore = new Map(registry.sources.map((source) => [source.source_id, source.hash]));
			const refreshed = await context.sources.refreshSourceHashes({
				backlogRoot: context.backlogRoot,
				registry,
				selectedSourceIds
			});
			const refreshTs = (/* @__PURE__ */ new Date()).toISOString();
			await context.artifacts.writeSourceRegistry(context.backlogRoot, refreshed.registry);
			await context.artifacts.writeState(context.backlogRoot, {
				...state,
				last_refresh_at: refreshTs,
				updated_at: refreshTs
			});
			const createdIds = [];
			const updatedIds = [];
			const reviewRecords = [];
			for (const changed of refreshed.changedSources) {
				const currentSource = refreshed.registry.sources.find((source) => source.source_id === changed.source_id);
				if (!currentSource) continue;
				const result = await upsertOpenSourceReview({
					root: context.backlogRoot,
					sourceId: currentSource.source_id,
					sourceLabel: currentSource.source_label,
					previousHash: changedBefore.get(currentSource.source_id) ?? currentSource.hash,
					currentHash: currentSource.hash,
					linkedItemKeys: relatedItemKeysForSource(state, currentSource.source_id),
					now: refreshTs
				});
				if (result.created) createdIds.push(result.record.source_review_id);
				else if (result.updated) updatedIds.push(result.record.source_review_id);
				reviewRecords.push(result.record);
			}
			writeCliEnvelope(io.stdout, {
				command: "refresh",
				scope: buildScopeFromArgs(args, [
					"--item-key",
					"--source-id",
					"--source-label",
					"--source-path"
				]),
				data: {
					changed_sources: refreshed.changedSources,
					source_reviews_created: createdIds.length,
					source_reviews_updated: updatedIds.length,
					source_review_ids: [...createdIds, ...updatedIds].sort((left, right) => left.localeCompare(right))
				},
				nextCommands: ["dossier-engineer attention", ...reviewRecords.filter((review) => review.linked_item_keys.length > 0).map((review) => `dossier-engineer items --item-keys ${review.linked_item_keys.join(",")}`)]
			});
			return 0;
		} finally {
			await releaseMutationLock();
		}
	} catch (error) {
		writeJson(io.stderr, { error: {
			code: "UDE_REFRESH_FAILED",
			message: error instanceof Error ? error.message : String(error)
		} });
		return 1;
	}
}
async function runStatusCommand(args, io) {
	try {
		if (args.includes("--refresh")) {
			const refreshExit = await runRefreshCommand([], {
				stdout: { write() {
					return true;
				} },
				stderr: io.stderr
			});
			if (refreshExit !== 0) return refreshExit;
		}
		const status = (await runVendoredBacklogCommand(STATUS_COMMAND, args.filter((arg) => arg !== "--refresh"))).output;
		const runtime = createRuntime();
		const context = await runtime.createContext("status", runtime.getProcessCwd());
		if (!context.backlogRoot) throw new Error("Backlog root not found.");
		const openReviews = await loadOpenSourceReviews(context.backlogRoot);
		const { state } = await context.ensureQueryState();
		const blockedItemKeys = collectBlockedItemKeys(openReviews);
		const adjustedReadyForNextStepCount = state.items.filter((item) => item.ready_for_next_step && !blockedItemKeys.has(item.item_key)).length;
		writeCliEnvelope(io.stdout, {
			command: "status",
			data: buildStatusOutput({
				adjustedReadyForNextStepCount,
				baseStatus: status,
				openReviews
			})
		});
		return 0;
	} catch (error) {
		if (isBacklogCommandError(error)) return writeBacklogError(io, normalizeError(error));
		writeJson(io.stderr, { error: {
			code: "UDE_STATUS_FAILED",
			message: error instanceof Error ? error.message : String(error)
		} });
		return 1;
	}
}
async function runAttentionCommand(_args, io) {
	try {
		const result = await runVendoredBacklogCommand(ATTENTION_COMMAND, []);
		if (!result.context.backlogRoot) throw new Error("Backlog root not found.");
		const openReviews = await loadOpenSourceReviews(result.context.backlogRoot);
		writeCliEnvelope(io.stdout, {
			command: "attention",
			data: buildAttentionOutput({
				itemAttention: result.output,
				openReviews
			}),
			nextCommands: ["dossier-engineer items --item-keys <item_key>"]
		});
		return 0;
	} catch (error) {
		return writeBacklogError(io, normalizeError(error));
	}
}
async function runItemsCommand(args, io) {
	try {
		const result = await runVendoredBacklogCommand(ITEMS_COMMAND, args);
		if (!result.context.backlogRoot) throw new Error("Backlog root not found.");
		const openReviews = await loadOpenSourceReviews(result.context.backlogRoot);
		writeCliEnvelope(io.stdout, {
			command: "items",
			scope: buildScopeFromArgs(args, ["--item-keys"]),
			data: overlayItemsWithSourceReviewBlock(result.output, openReviews)
		});
		return 0;
	} catch (error) {
		return writeBacklogError(io, normalizeError(error));
	}
}
async function runQueueCommand(args, io) {
	try {
		const result = await runVendoredBacklogCommand(QUEUE_COMMAND, args);
		if (!result.context.backlogRoot) throw new Error("Backlog root not found.");
		const openReviews = await loadOpenSourceReviews(result.context.backlogRoot);
		writeCliEnvelope(io.stdout, {
			command: "queue",
			data: overlayQueueWithSourceReviewBlock(result.output, openReviews)
		});
		return 0;
	} catch (error) {
		return writeBacklogError(io, normalizeError(error));
	}
}
async function runSearchCommand(args, io) {
	try {
		const result = await runVendoredBacklogCommand(SEARCH_COMMAND, args);
		if (!result.context.backlogRoot) throw new Error("Backlog root not found.");
		const openReviews = await loadOpenSourceReviews(result.context.backlogRoot);
		writeCliEnvelope(io.stdout, {
			command: "search",
			data: overlaySearchWithSourceReviewBlock(result.output, openReviews)
		});
		return 0;
	} catch (error) {
		return writeBacklogError(io, normalizeError(error));
	}
}
async function runAckSourceReviewCommand(args, io) {
	const sourceReviewId = takeOption$2(args, "--source-review-id");
	const sourceId = takeOption$2(args, "--source-id");
	if (!sourceReviewId && !sourceId) {
		writeJson(io.stderr, { error: {
			code: "UDE_USAGE",
			message: "--source-review-id or --source-id is required."
		} });
		return 2;
	}
	try {
		const root = await resolveProcessRoot(process.cwd(), takeOption$2(args, "--root"));
		const context = await createRuntime().createContext("refresh", root);
		const releaseMutationLock = context.backlogRoot ? await context.acquireMutationLock("refresh") : void 0;
		const reviewId = sourceReviewId ?? createSourceReviewId(sourceId ?? "");
		try {
			const record = await resolveSourceReview({
				root,
				sourceReviewId: reviewId,
				outcome: "no_backlog_change",
				resolutionKind: "ack",
				resolutionRef: "ack-source-review",
				now: (/* @__PURE__ */ new Date()).toISOString()
			});
			writeCliEnvelope(io.stdout, {
				command: "ack-source-review",
				scope: {
					...sourceReviewId ? { source_review_id: sourceReviewId } : {},
					...sourceId ? { source_id: sourceId } : {}
				},
				data: record,
				nextCommands: ["dossier-engineer status"]
			});
			return 0;
		} finally {
			await releaseMutationLock?.();
		}
	} catch (error) {
		writeJson(io.stderr, { error: {
			code: "UDE_SOURCE_REVIEW_ACK_FAILED",
			message: error instanceof Error ? error.message : String(error)
		} });
		return 1;
	}
}
function isBacklogCommandError(error) {
	return error instanceof Error;
}
function createVendoredCommandWrapper(command, family, afterSuccess) {
	return {
		name: command.name,
		commandType: "backlog",
		family,
		summary: command.summary,
		usage: adaptUsage(command.usage),
		options: adaptOptions(command),
		async execute(args, io) {
			try {
				if (afterSuccess) {
					const root = await resolveProcessRoot(process.cwd(), takeOption$2(args, "--root"));
					await assertManagedWritePath(root, sourceReviewDir(root), path.join(sourceReviewDir(root), ".probe.json"), "source-review artifact");
				}
				const result = await runVendoredBacklogCommand(command, args, { deferMutationUnlock: Boolean(afterSuccess) });
				const warnings = [];
				let nextCommands = [];
				let envelopeResult = "ok";
				let data = result.output;
				try {
					if (afterSuccess) try {
						const effect = await afterSuccess({
							context: result.context,
							output: result.output
						});
						if (effect?.dataPatch && data && typeof data === "object" && !Array.isArray(data)) data = {
							...data,
							...effect.dataPatch
						};
						if (effect?.warnings) warnings.push(...effect.warnings);
						if (effect?.nextCommands) nextCommands = effect.nextCommands;
						if (effect?.result) envelopeResult = effect.result;
					} catch (error) {
						warnings.push(`Primary backlog mutation succeeded, but source-review cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
						envelopeResult = "partial_success";
					}
				} finally {
					await result.releaseMutationLock?.();
				}
				writeCliEnvelope(io.stdout, {
					command: command.name,
					scope: buildScopeFromArgs(args),
					data,
					nextCommands,
					result: envelopeResult,
					warnings
				});
				return 0;
			} catch (error) {
				if (error instanceof Error && /(symlinked path components|must stay inside|safe single filesystem segment)/i.test(error.message)) {
					writeJson(io.stderr, { error: {
						code: "UDE_BACKLOG_PRECHECK_FAILED",
						message: error.message
					} });
					return 1;
				}
				return writeBacklogError(io, normalizeError(error));
			}
		}
	};
}
var BACKLOG_COMMANDS = [
	{
		name: "init",
		commandType: "backlog",
		family: "bootstrap",
		summary: "Initialize the unified process root, backlog subroot, and SSOT skeleton.",
		usage: ["dossier-engineer init --path <path>"],
		options: ["--path <path> — Process root directory to initialize."],
		execute: runInitCommand
	},
	createVendoredCommandWrapper(REGISTER_SOURCE_COMMAND, "backlog-source"),
	createVendoredCommandWrapper(LIST_SOURCES_COMMAND, "backlog-source"),
	createVendoredCommandWrapper(UPDATE_SOURCE_PATH_COMMAND, "backlog-source", async ({ context, output }) => {
		if (!context.backlogRoot || !output.source_id) return;
		return { dataPatch: {
			resolved_source_review_ids: (await maybeResolveSourceReviewsFromSourceId({
				root: context.backlogRoot,
				sourceId: output.source_id,
				kind: "update-source-path",
				resolutionRef: `update-source-path:${String(output.path ?? "")}`
			})).map((review) => review.source_review_id),
			resolution_kind: "update-source-path"
		} };
	}),
	createVendoredCommandWrapper(REMOVE_SOURCE_COMMAND, "backlog-source", async ({ context, output }) => {
		if (!context.backlogRoot || !output.source_id) return;
		return { dataPatch: {
			resolved_source_review_ids: (await maybeResolveSourceReviewsFromSourceId({
				root: context.backlogRoot,
				sourceId: output.source_id,
				kind: "remove-source",
				resolutionRef: `remove-source:${String(output.source_id)}`
			})).map((review) => review.source_review_id),
			resolution_kind: "remove-source"
		} };
	}),
	{
		name: "refresh",
		commandType: "backlog",
		family: "backlog-source",
		summary: "Refresh source hashes and open/update source-review records.",
		usage: [
			"dossier-engineer refresh",
			"dossier-engineer refresh --item-key <item_key>",
			"dossier-engineer refresh --source-id <source_id>",
			"dossier-engineer refresh --source-label <source_label>",
			"dossier-engineer refresh --source-path <path>"
		],
		options: [
			"--item-key <item_key> — Refresh sources linked to one backlog item.",
			"--source-id <source_id> — Refresh one registered source by ID.",
			"--source-label <source_label> — Refresh one registered source by label.",
			"--source-path <path> — Refresh one registered source by path."
		],
		execute: runRefreshCommand
	},
	{
		name: "ack-source-review",
		commandType: "backlog",
		family: "backlog-source",
		summary: "Close an open source-review record as an explicit no-op.",
		usage: ["dossier-engineer ack-source-review --source-review-id <id>", "dossier-engineer ack-source-review --source-id <source_id>"],
		options: ["--source-review-id <id> — Source-review record to close.", "--source-id <source_id> — Resolve the record for one source ID."],
		execute: runAckSourceReviewCommand
	},
	createVendoredCommandWrapper(TEMPLATE_COMMAND, "backlog-authoring"),
	createVendoredCommandWrapper(PACKET_COMMAND, "backlog-authoring", async ({ context, output }) => {
		if (!context.backlogRoot) return;
		const itemKeys = [...output.added ?? [], ...output.removed ?? []];
		await maybeResolveSourceReviewsFromItemKeys({
			root: context.backlogRoot,
			itemKeys,
			kind: "packet",
			resolutionRef: String(output.authored_packet_path ?? output.canonical_packet_path ?? "packet")
		});
	}),
	createVendoredCommandWrapper(PATCH_ITEM_COMMAND, "backlog-authoring", async ({ context, output }) => {
		if (!context.backlogRoot) return;
		await maybeResolveSourceReviewsFromItemKeys({
			root: context.backlogRoot,
			itemKeys: output.updated ?? [],
			kind: "patch-item",
			resolutionRef: String(output.authored_patch_path ?? output.canonical_patch_path ?? "patch-item")
		});
	}),
	createVendoredCommandWrapper(REMOVE_ITEM_COMMAND, "backlog-authoring"),
	{
		name: "status",
		commandType: "backlog",
		family: "backlog-read",
		summary: "Show backlog status with source-review blocking signals.",
		usage: ["dossier-engineer status [--refresh]"],
		options: ["--refresh — Refresh source hashes before returning the status summary."],
		execute: runStatusCommand
	},
	createVendoredCommandWrapper(REPORT_COMMAND, "backlog-read"),
	{
		name: "items",
		commandType: "backlog",
		family: "backlog-read",
		summary: "Return backlog item cards with source-review readiness overlay.",
		usage: ["dossier-engineer items --item-keys <item_key_1>,<item_key_2>"],
		options: ["--item-keys <item_key_1>,<item_key_2> — Comma-separated backlog item keys."],
		execute: runItemsCommand
	},
	{
		name: "search",
		commandType: "backlog",
		family: "backlog-read",
		summary: "Search backlog items with source-review readiness overlay.",
		usage: ["dossier-engineer search [filters]"],
		options: ["See `dossier-engineer help search` in the split backlog runtime for full filter surface."],
		execute: runSearchCommand
	},
	createVendoredCommandWrapper(GAPS_COMMAND, "backlog-read"),
	{
		name: "queue",
		commandType: "backlog",
		family: "backlog-read",
		summary: "Return queue chains after excluding source-review blocked items.",
		usage: ["dossier-engineer queue"],
		execute: runQueueCommand
	},
	{
		name: "attention",
		commandType: "backlog",
		family: "backlog-read",
		summary: "Return open source-review records first, then generic item attention entries.",
		usage: ["dossier-engineer attention"],
		execute: runAttentionCommand
	}
];
//#endregion
//#region src/shared/delivery-lock.ts
async function acquireDeliveryMutationLock(payload) {
	const featureId = sanitizeFilesystemSegment(payload.featureId, "delivery lock feature id");
	const featureCycleId = sanitizeFilesystemSegment(payload.featureCycleId, "delivery lock feature cycle id");
	const locksDir = path.join(payload.root, ".dossier", "ops", "locks");
	const lockPath = path.join(locksDir, `${featureId}--${featureCycleId}.lock`);
	await assertManagedWritePath(payload.root, locksDir, lockPath, "delivery mutation lock");
	let handle = null;
	try {
		handle = await promises.open(lockPath, "wx");
		await handle.writeFile(`${JSON.stringify({
			command: payload.command,
			feature_cycle_id: featureCycleId,
			feature_id: featureId,
			pid: process.pid,
			started_at: (/* @__PURE__ */ new Date()).toISOString()
		})}\n`);
	} catch (error) {
		if (error.code === "EEXIST") throw new Error(`Delivery mutation lock is already held for ${featureId}/${featureCycleId}.`);
		throw error;
	}
	let released = false;
	return async () => {
		if (released) return;
		released = true;
		try {
			await handle?.close();
		} catch {}
		await promises.rm(lockPath, { force: true });
	};
}
//#endregion
//#region src/delivery/stage-control.ts
var STAGE_CONTROLLER_COMMANDS = [
	"feature-intake",
	"spec-compact",
	"plan-slice",
	"implementation",
	"change-proposal"
];
var DECISION_SUBSECTION_TITLES = [
	"Spec gap decisions",
	"Implementation freedom decisions",
	"Temporary assumptions"
];
var FEATURE_INTAKE_SECTION_TITLES = [
	"Scope",
	"Inputs actually used",
	"Backlog handoff decisions",
	"Intake findings",
	"Operator feedback",
	"Index refresh",
	"Backlog follow-up",
	"Process misses",
	"Transition events",
	"Close-out"
];
var PRIMARY_STAGE_SECTION_TITLES = [
	"Scope",
	"Inputs actually used",
	"Decisions / reclassifications",
	"Operator feedback",
	"Review events",
	"Backlog follow-up",
	"Process misses",
	"Transition events",
	"Close-out"
];
var NOTES_SECTION_TITLE = "Notes";
var TRANSITION_SECTION_TITLE = "Transition events";
function bodyAfterFrontmatter(content) {
	if (!content.startsWith("---\n")) return content;
	const end = content.indexOf("\n---\n", 4);
	if (end === -1) return content;
	return content.slice(end + 5);
}
function parseMarkdownSections(content, headingPrefix) {
	const lines = content.split(/\r?\n/u);
	const sections = [];
	let currentTitle = null;
	let currentBody = [];
	for (const line of lines) {
		if (line.startsWith(headingPrefix)) {
			if (currentTitle !== null) sections.push({
				title: currentTitle,
				body: currentBody.join("\n").trim()
			});
			currentTitle = line.slice(headingPrefix.length).trim();
			currentBody = [];
			continue;
		}
		if (currentTitle !== null) currentBody.push(line);
	}
	if (currentTitle !== null) sections.push({
		title: currentTitle,
		body: currentBody.join("\n").trim()
	});
	return sections;
}
function renderSection(title, body) {
	return [
		"## " + title,
		"",
		...normalizeSectionBody(body) ?? ["none"]
	];
}
function normalizeSectionBody(body) {
	const trimmed = body?.trim() ?? "";
	if (!trimmed) return null;
	return trimmed.split(/\r?\n/u);
}
function sectionMap(sections) {
	return new Map(sections.map((section) => [section.title, section.body]));
}
function extractBulletNotes(body) {
	return body.split(/\r?\n/u).map((line) => line.trim()).filter((line) => line.startsWith("- ")).map((line) => line.slice(2).trim()).filter(Boolean);
}
function mergeNotesBody(existingBody, newNotes) {
	const trimmed = existingBody?.trim() ?? "";
	const additionalNotes = newNotes.filter((note) => !extractBulletNotes(trimmed).includes(note));
	if (!trimmed) return additionalNotes.length > 0 ? additionalNotes.map((note) => `- ${note}`).join("\n") : null;
	if (additionalNotes.length === 0) return trimmed;
	return `${trimmed}\n\n${additionalNotes.map((note) => `- ${note}`).join("\n")}`;
}
function renderNotesSection(body) {
	if (!body?.trim()) return null;
	return [
		"## " + NOTES_SECTION_TITLE,
		"",
		...body.trim().split(/\r?\n/u)
	];
}
function renderDecisionsSection(existingBody) {
	const normalizedExisting = existingBody?.trim() ?? "";
	const subsections = parseMarkdownSections(normalizedExisting, "### ");
	const subsectionMap = sectionMap(subsections);
	const preface = subsections.length === 0 ? normalizedExisting : normalizedExisting.slice(0, normalizedExisting.indexOf("### ")).trim();
	const extraSubsections = subsections.filter((section) => !DECISION_SUBSECTION_TITLES.includes(section.title));
	const lines = ["## Decisions / reclassifications", ""];
	if (preface) lines.push(...preface.split(/\r?\n/u), "");
	for (const title of DECISION_SUBSECTION_TITLES) lines.push(`### ${title}`, "", ...normalizeSectionBody(subsectionMap.get(title)) ?? ["none"], "");
	for (const section of extraSubsections) lines.push(`### ${section.title}`, "", ...normalizeSectionBody(section.body) ?? ["none"], "");
	while (lines.at(-1) === "") lines.pop();
	return lines;
}
function renderTransitionEventsSection(transitionEvents) {
	return [
		"## " + TRANSITION_SECTION_TITLE,
		"",
		...transitionEvents.length > 0 ? transitionEvents.map((event) => `- ${String(event.at)}: ${String(event.kind)}`) : ["none"]
	];
}
function canonicalSectionTitles(metadata) {
	return toNullableString(metadata.stage) === "feature-intake" ? FEATURE_INTAKE_SECTION_TITLES : PRIMARY_STAGE_SECTION_TITLES;
}
function renderStageLog(metadata, options = {}) {
	const transitionEvents = Array.isArray(metadata.transition_events) ? metadata.transition_events : [];
	const existingSections = sectionMap(parseMarkdownSections(bodyAfterFrontmatter(options.existingContent ?? ""), "## "));
	const notesBody = mergeNotesBody(existingSections.get(NOTES_SECTION_TITLE), options.notes ?? []);
	const sectionLines = [];
	for (const title of canonicalSectionTitles(metadata)) {
		if (title === TRANSITION_SECTION_TITLE) {
			sectionLines.push(...renderTransitionEventsSection(transitionEvents), "");
			continue;
		}
		if (title === "Decisions / reclassifications") {
			sectionLines.push(...renderDecisionsSection(existingSections.get(title)), "");
			continue;
		}
		sectionLines.push(...renderSection(title, existingSections.get(title) ?? ""), "");
	}
	const notesSection = renderNotesSection(notesBody);
	if (notesSection) sectionLines.push(...notesSection, "");
	const extraSections = parseMarkdownSections(bodyAfterFrontmatter(options.existingContent ?? ""), "## ").filter((section) => !canonicalSectionTitles(metadata).includes(section.title) && section.title !== NOTES_SECTION_TITLE).map((section) => renderSection(section.title, section.body));
	for (const section of extraSections) sectionLines.push(...section, "");
	while (sectionLines.at(-1) === "") sectionLines.pop();
	return [
		"---",
		browser_default.stringify(metadata).trimEnd(),
		"---",
		"",
		...sectionLines,
		""
	].join("\n");
}
function toNullableString(value) {
	return typeof value === "string" && value.trim() ? value : null;
}
function takeOption$1(args, name) {
	const exact = args.indexOf(name);
	if (exact !== -1) {
		const value = args[exact + 1];
		if (!value || value.startsWith("--")) return null;
		return value;
	}
	const prefix = `${name}=`;
	const inline = args.find((arg) => arg.startsWith(prefix));
	return inline ? inline.slice(prefix.length) : null;
}
function takeManyOptions(args, name) {
	const values = [];
	const prefix = `${name}=`;
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === name) {
			const value = args[index + 1];
			if (value && !value.startsWith("--")) values.push(value);
			continue;
		}
		if (arg?.startsWith(prefix)) values.push(arg.slice(prefix.length));
	}
	return values;
}
function ensureRequired(value, message) {
	if (!value) throw new Error(message);
	return value;
}
function commandUsage(command) {
	return [`${command} --feature-id <id> [--root <path>] [--dossier <path>] [--cycle-id <id>] [--block | --ready-for-close]`, `${command} --feature-id <id> --backlog-followup-kind <kind> [--backlog-followup-required] [--backlog-followup-resolved]`].join("\n");
}
function nextCommandsForState(command, stageState) {
	if (stageState === "blocked") return [`dossier-engineer ${command} --feature-id <id>`];
	if (stageState === "ready_for_close") return [
		"dossier-engineer dossier-verify ...",
		"dossier-engineer review-artifact ...",
		"dossier-engineer dossier-step-close ..."
	];
	return [`dossier-engineer ${command} --feature-id <id> --ready-for-close`];
}
function parseBacklogItemKey(dossier) {
	const fromFrontmatter = dossier.frontmatter.backlog_item_key;
	if (typeof fromFrontmatter === "string" && fromFrontmatter.trim()) return fromFrontmatter.trim();
	return null;
}
async function findDossierPathByFeatureId(root, featureId) {
	const normalizedFeatureId = sanitizeFeatureId(featureId, "--feature-id");
	const dir = featureDossiersDirPath(root);
	const direct = (await listDossierFiles(dir)).find((file) => file === `${normalizedFeatureId}.md` || file.startsWith(`${normalizedFeatureId}-`));
	if (!direct) throw new Error(`Feature dossier for ${normalizedFeatureId} not found in ${path.relative(root, dir)}`);
	return path.join(dir, direct);
}
async function loadLatestStageLog(root, stage, featureId, requestedCycleId) {
	const logsDir = path.join(root, ".dossier", "logs", stage);
	if (!await fileExists(logsDir)) return null;
	const entries = await promises.readdir(logsDir, { withFileTypes: true });
	const matching = [];
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
		const absPath = path.join(logsDir, entry.name);
		const content = await promises.readFile(absPath, "utf8");
		const metadata = parseFrontmatter(content);
		if (!metadata) continue;
		if (toNullableString(metadata.feature_id) !== featureId) continue;
		if (requestedCycleId && toNullableString(metadata.cycle_id) !== requestedCycleId) continue;
		matching.push({
			absPath,
			content,
			metadata
		});
	}
	matching.sort((left, right) => {
		return (Date.parse(toNullableString(left.metadata.entered_ts) ?? "") || 0) - (Date.parse(toNullableString(right.metadata.entered_ts) ?? "") || 0);
	});
	return matching.at(-1) ?? null;
}
async function resolveStageLogContext(root, stage, featureId, requestedCycleId) {
	const log = await loadLatestStageLog(root, stage, sanitizeFeatureId(featureId, "feature id"), requestedCycleId);
	const featureCycleId = toNullableString(log?.metadata.feature_cycle_id);
	const cycleId = toNullableString(log?.metadata.cycle_id);
	if (!log || !featureCycleId || !cycleId) return null;
	return {
		absPath: log.absPath,
		cycleId,
		featureCycleId,
		relPath: path.relative(root, log.absPath).split(path.sep).join("/")
	};
}
async function resolveLatestFeatureCycleId(root, featureId, preferredStage) {
	const normalizedFeatureId = sanitizeFeatureId(featureId, "feature id");
	const orderedStages = [
		...preferredStage ? [preferredStage] : [],
		"change-proposal",
		"implementation",
		"plan-slice",
		"spec-compact",
		"feature-intake"
	];
	const dedupedStages = [...new Set(orderedStages)];
	return toNullableString((await Promise.all(dedupedStages.map((stage) => loadLatestStageLog(root, stage, normalizedFeatureId)))).filter((candidate) => candidate !== null).sort((left, right) => {
		return (Date.parse(toNullableString(left.metadata.entered_ts) ?? "") || 0) - (Date.parse(toNullableString(right.metadata.entered_ts) ?? "") || 0);
	}).at(-1)?.metadata.feature_cycle_id);
}
async function appendFeatureIntakeLog(payload) {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const cycleId = `intake-${crypto.randomUUID().slice(0, 8)}`;
	const relPath = path.join(".dossier", "logs", "feature-intake", `${payload.featureId}--${payload.featureCycleId}.md`);
	const absPath = path.join(payload.root, relPath);
	const transitionEvents = [{
		kind: "entered",
		at: now
	}, {
		kind: "ready_for_close",
		at: now
	}];
	const metadata = {
		version: 1,
		command: "feature-intake",
		stage: "feature-intake",
		feature_id: payload.featureId,
		feature_cycle_id: payload.featureCycleId,
		cycle_id: cycleId,
		backlog_item_key: payload.backlogItemKey,
		start_ts: now,
		entered_ts: now,
		ready_for_close_ts: now,
		stage_state: "ready_for_close",
		backlog_followup_required: false,
		backlog_followup_kind: null,
		backlog_followup_resolved: true,
		intake_process_complete_ts: now,
		transition_events: transitionEvents,
		session_id: {}.CODEX_SESSION_ID ?? null,
		trace_runtime: "codex",
		trace_locator_kind: "session_id"
	};
	await assertManagedWritePath(payload.root, path.join(payload.root, ".dossier", "logs", "feature-intake"), absPath, "feature-intake log");
	await writeTextAtomic(absPath, renderStageLog(metadata, { notes: ["Feature cycle opened by feature-intake."] }));
	return {
		cycleId,
		enteredTs: now,
		logPath: relPath.split(path.sep).join("/"),
		readyForCloseTs: now,
		transitionEvents
	};
}
async function runStageControllerCommand(command, args) {
	if (args.includes("--help") || args.includes("-h")) throw new Error(commandUsage(command));
	const root = await resolveProcessRoot(process.cwd(), takeOption$1(args, "--root"));
	const featureId = sanitizeFeatureId(ensureRequired(takeOption$1(args, "--feature-id"), "--feature-id is required."), "--feature-id");
	const backlogFollowupKind = takeOption$1(args, "--backlog-followup-kind");
	const backlogFollowupRequired = args.includes("--backlog-followup-required") || backlogFollowupKind !== null;
	const backlogFollowupResolved = args.includes("--backlog-followup-resolved");
	const requestedCycleId = takeOption$1(args, "--cycle-id");
	const noteValues = takeManyOptions(args, "--note");
	const requestedDossier = takeOption$1(args, "--dossier");
	const { dossier } = requestedDossier ? await resolveManagedDossierIdentity({
		root,
		dossierPath: requestedDossier,
		expectedFeatureId: featureId
	}) : { dossier: await readDossierRecord(await findDossierPathByFeatureId(root, featureId), { root }) };
	const backlogItemKey = parseBacklogItemKey(dossier);
	if (!backlogItemKey) throw new Error(`Dossier ${featureId} is missing canonical frontmatter backlog_item_key.`);
	const latestForStage = await loadLatestStageLog(root, command, featureId, requestedCycleId);
	const latestFeatureIntake = command === "feature-intake" ? null : await loadLatestStageLog(root, "feature-intake", featureId);
	const latestImplementation = command === "feature-intake" ? null : await loadLatestStageLog(root, "implementation", featureId);
	const featureCycleId = toNullableString((latestForStage ?? latestFeatureIntake ?? latestImplementation)?.metadata.feature_cycle_id) ?? `fc-${extractFeatureNumericId(featureId) ?? featureId}-${crypto.randomUUID().slice(0, 8)}`;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const action = args.includes("--block") ? "blocked" : args.includes("--ready-for-close") ? "ready_for_close" : latestForStage ? "resumed" : "entered";
	if (!latestForStage && action !== "entered") throw new Error(`No existing ${command} stage cycle found for ${featureId}. Start the stage before using ${action}.`);
	const cycleId = toNullableString(latestForStage?.metadata.cycle_id) ?? `${command}-${crypto.randomUUID().slice(0, 8)}`;
	const enteredTs = toNullableString(latestForStage?.metadata.entered_ts) ?? now;
	const readyForCloseTs = action === "ready_for_close" ? now : toNullableString(latestForStage?.metadata.ready_for_close_ts);
	const existingEvents = Array.isArray(latestForStage?.metadata.transition_events) ? [...latestForStage?.metadata.transition_events] : [];
	existingEvents.push({
		kind: action,
		at: now
	});
	const stageState = action === "blocked" ? "blocked" : action === "ready_for_close" ? "ready_for_close" : "in_progress";
	const metadata = {
		version: 1,
		stage: command,
		feature_id: featureId,
		feature_cycle_id: featureCycleId,
		cycle_id: cycleId,
		backlog_item_key: backlogItemKey,
		stage_state: stageState,
		start_ts: enteredTs,
		entered_ts: enteredTs,
		ready_for_close_ts: readyForCloseTs,
		transition_events: existingEvents,
		backlog_followup_required: backlogFollowupRequired,
		backlog_followup_kind: backlogFollowupKind,
		backlog_followup_resolved: backlogFollowupResolved,
		session_id: {}.CODEX_SESSION_ID ?? null,
		trace_runtime: "codex",
		trace_locator_kind: "session_id"
	};
	if (command === "implementation" && stageState === "ready_for_close") metadata.local_gates_green_ts = now;
	const relPath = path.join(".dossier", "logs", command, `${featureId}--${featureCycleId}--${cycleId}.md`);
	const absPath = path.join(root, relPath);
	const releaseLock = await acquireDeliveryMutationLock({
		root,
		featureId,
		featureCycleId,
		command
	});
	try {
		await assertManagedWritePath(root, path.join(root, ".dossier", "logs", command), absPath, `${command} stage log`);
		await writeTextAtomic(absPath, renderStageLog(metadata, {
			existingContent: latestForStage?.content ?? null,
			notes: noteValues
		}));
	} finally {
		await releaseLock();
	}
	return {
		stage: command,
		feature_id: featureId,
		feature_cycle_id: featureCycleId,
		cycle_id: cycleId,
		stage_state: stageState,
		entered_ts: enteredTs,
		ready_for_close_ts: readyForCloseTs,
		transition_events: existingEvents,
		backlog_followup_required: backlogFollowupRequired,
		backlog_followup_kind: backlogFollowupKind,
		backlog_followup_resolved: backlogFollowupResolved,
		log_path: relPath.split(path.sep).join("/"),
		next_commands: nextCommandsForState(command, stageState)
	};
}
async function recordStepCloseOnStageLog(payload) {
	const stageName = payload.step;
	if (!STAGE_CONTROLLER_COMMANDS.includes(stageName)) return;
	const latest = await loadLatestStageLog(payload.root, stageName, sanitizeFeatureId(payload.featureId, "feature id"));
	if (!latest) return;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const metadata = {
		...latest.metadata,
		step_close_ts: now,
		step_artifact: payload.stepArtifactPath,
		...payload.processComplete ? { process_complete_ts: now } : {}
	};
	await assertManagedWritePath(payload.root, path.join(payload.root, ".dossier", "logs", stageName), latest.absPath, `${stageName} stage log`);
	await writeTextAtomic(latest.absPath, renderStageLog(metadata, { existingContent: latest.content }));
}
//#endregion
//#region src/unified-cli.ts
var ALLOWED_DOSSIER_STEPS = new Set([
	"feature-intake",
	"spec-compact",
	"plan-slice",
	"implementation",
	"change-proposal"
]);
function writeLine(stream, line = "") {
	stream.write(`${line}\n`);
}
function takeOption(argv, name, fallback = null) {
	const exact = argv.indexOf(name);
	if (exact !== -1) {
		const value = argv[exact + 1];
		if (!value || value.startsWith("--")) return fallback;
		return value;
	}
	const prefix = `${name}=`;
	const inline = argv.find((arg) => arg.startsWith(prefix));
	return inline ? inline.slice(prefix.length) : fallback;
}
function replaceCliNames(value) {
	return value.replaceAll("backlog-engineer", "dossier-engineer").replaceAll("node scripts/dossier.mjs", "dossier-engineer");
}
function ensureAllowedStep(step, optionName) {
	if (!ALLOWED_DOSSIER_STEPS.has(step)) throw new Error(`${optionName} must be one of: ${[...ALLOWED_DOSSIER_STEPS].sort().join(", ")}.`);
	return step;
}
async function captureDossierCommandOutput(commandName, args, command) {
	const stderrBuffer = [];
	const stdoutBuffer = [];
	return {
		exitCode: await executeCommand(command, args, {
			stdout: { write(chunk) {
				stdoutBuffer.push(String(chunk));
				return true;
			} },
			stderr: { write(chunk) {
				stderrBuffer.push(String(chunk));
				return true;
			} }
		}, commandName),
		stderr: stderrBuffer.join(""),
		stdout: stdoutBuffer.join("")
	};
}
async function withDeliveryLock(payload) {
	const releaseLock = await acquireDeliveryMutationLock({
		root: payload.root,
		featureId: payload.featureId,
		featureCycleId: payload.featureCycleId,
		command: payload.command
	});
	try {
		return await payload.run();
	} finally {
		await releaseLock();
	}
}
function createDossierCommandWrapper(name, family) {
	const command = findCommand(name);
	if (!command) throw new Error(`Missing vendored dossier command: ${name}`);
	const baseHelpLines = replaceCliNames(command.helpText()).split("\n");
	const execute = async (args, io) => {
		return executeCommand(command, args, io, name);
	};
	if (name === "feature-intake") return {
		name,
		family: "delivery-stage",
		commandType: "stage",
		summary: command.description,
		usage: baseHelpLines.filter((line) => line.trim().startsWith("dossier-engineer feature-intake")),
		helpLines: () => baseHelpLines.map((line) => line.replace("workflow_stage_next values name workflow stages, not shipped CLI subcommands.", "workflow_stage_next values name canonical stage-controller commands; use spec-compact, plan-slice, implementation, or change-proposal as shipped subcommands.")),
		async execute(args, io) {
			try {
				const root = await resolveProcessRoot(process.cwd(), takeOption(args, "--root"));
				await assertManagedWritePath(root, path.join(root, ".dossier", "logs", "feature-intake"), path.join(root, ".dossier", "logs", "feature-intake", ".probe.md"), "feature-intake log");
				await assertManagedWritePath(root, path.join(root, "docs", "ssot"), path.join(root, "docs", "ssot", "index.md"), "feature-intake index file");
				const argsWithJson = args.includes("--json") ? args : [...args, "--json"];
				return await withDeliveryLock({
					root,
					featureId: "feature-intake",
					featureCycleId: "allocation",
					command: "feature-intake",
					run: async () => {
						const { exitCode, stderr, stdout } = await captureDossierCommandOutput(name, argsWithJson, command);
						const summary = stdout.trim() ? JSON.parse(stdout) : null;
						if (exitCode !== 0 && !summary) throw new Error(stderr.trim() || "feature-intake failed before creating a dossier.");
						if (!summary) throw new Error("feature-intake did not return a JSON summary.");
						const featureId = sanitizeFeatureId(summary.feature_id, "feature-intake feature id");
						const featureCycleId = `fc-${featureId}-${Date.now().toString(36)}`;
						const nextCommand = `dossier-engineer spec-compact --feature-id ${featureId}`;
						if (exitCode !== 0) {
							const warnings = [`feature-intake created ${summary.dossier}, but vendored closeout failed before merged telemetry append.`, ...summary.refresh_stderr ? [summary.refresh_stderr] : []];
							if (args.includes("--json")) {
								writeCliEnvelope(io.stdout, {
									command: "feature-intake",
									scope: { feature_id: featureId },
									data: {
										...summary,
										feature_cycle_id: null,
										log_path: null,
										stage: "feature-intake"
									},
									nextCommands: ["dossier-engineer index-refresh", nextCommand],
									result: "partial_success",
									warnings
								});
								return exitCode;
							}
							writeLine(io.stdout, `[feature-intake] Created ${summary.dossier}`);
							writeLine(io.stdout, `[feature-intake] feature=${featureId}`);
							for (const warning of warnings) writeLine(io.stderr, `[feature-intake] WARNING: ${warning}`);
							return exitCode;
						}
						try {
							const intakeLog = await appendFeatureIntakeLog({
								root,
								featureId,
								featureCycleId,
								backlogItemKey: summary.backlog_item_key
							});
							const stageData = {
								...summary,
								stage: "feature-intake",
								cycle_id: intakeLog.cycleId,
								feature_cycle_id: featureCycleId,
								stage_state: "ready_for_close",
								entered_ts: intakeLog.enteredTs,
								ready_for_close_ts: intakeLog.readyForCloseTs,
								transition_events: intakeLog.transitionEvents,
								backlog_followup_required: false,
								backlog_followup_kind: null,
								backlog_followup_resolved: true,
								log_path: intakeLog.logPath
							};
							if (args.includes("--json")) {
								writeCliEnvelope(io.stdout, {
									command: "feature-intake",
									scope: {
										feature_id: featureId,
										feature_cycle_id: featureCycleId
									},
									data: stageData,
									nextCommands: [nextCommand]
								});
								return 0;
							}
							writeLine(io.stdout, `[feature-intake] Created ${summary.dossier}`);
							writeLine(io.stdout, `[feature-intake] feature=${featureId}`);
							writeLine(io.stdout, `[feature-intake] backlog_item_key=${summary.backlog_item_key}`);
							writeLine(io.stdout, `[feature-intake] backlog_delivery_state=${summary.backlog_delivery_state}`);
							writeLine(io.stdout, `[feature-intake] feature_cycle_id=${featureCycleId}`);
							writeLine(io.stdout, `[feature-intake] cycle_id=${intakeLog.cycleId}`);
							writeLine(io.stdout, "[feature-intake] stage_state=ready_for_close");
							writeLine(io.stdout, `[feature-intake] log_path=${intakeLog.logPath}`);
							writeLine(io.stdout, "[feature-intake] next_stage_controller=spec-compact");
							writeLine(io.stdout, `[feature-intake] next_command=${nextCommand}`);
							return 0;
						} catch (error) {
							const warning = error instanceof Error ? error.message : String(error);
							if (args.includes("--json")) {
								writeCliEnvelope(io.stdout, {
									command: "feature-intake",
									scope: {
										feature_id: featureId,
										feature_cycle_id: featureCycleId
									},
									data: {
										...summary,
										feature_cycle_id: featureCycleId,
										log_path: null,
										stage: "feature-intake"
									},
									nextCommands: [nextCommand],
									result: "partial_success",
									warnings: [`Feature dossier was created, but feature-intake log append failed: ${warning}`]
								});
								return 0;
							}
							writeLine(io.stdout, `[feature-intake] Created ${summary.dossier}`);
							writeLine(io.stdout, `[feature-intake] feature=${featureId}`);
							writeLine(io.stderr, `[feature-intake] WARNING: feature-intake log append failed after dossier creation: ${warning}`);
							return 0;
						}
					}
				});
			} catch (error) {
				io.stderr.write(`${JSON.stringify({ error: {
					code: "UDE_FEATURE_INTAKE_FAILED",
					message: error instanceof Error ? error.message : String(error)
				} })}\n`);
				return 1;
			}
		}
	};
	if (name === "dossier-step-close") return {
		name,
		family,
		commandType: "dossier",
		summary: command.description,
		usage: baseHelpLines.filter((line) => line.trim().startsWith("dossier-engineer dossier-step-close")),
		helpLines: () => baseHelpLines,
		async execute(args, io) {
			try {
				const root = await resolveProcessRoot(process.cwd(), takeOption(args, "--root"));
				const dossierPath = takeOption(args, "--dossier");
				const step = takeOption(args, "--step");
				if (!dossierPath || !step) return executeCommand(command, args, io, name);
				const normalizedStep = ensureAllowedStep(step, "--step");
				const { featureId } = await resolveManagedDossierIdentity({
					root,
					dossierPath
				});
				const stageLog = await resolveStageLogContext(root, normalizedStep, featureId);
				if (!stageLog) throw new Error(`No ${normalizedStep} stage log found for ${featureId}.`);
				const verifyArtifactPath = takeOption(args, "--verify-artifact");
				const reviewArtifactPath = takeOption(args, "--review-artifact");
				const outputPath = takeOption(args, "--output");
				if (verifyArtifactPath) {
					const absVerifyArtifactPath = await resolveManagedReadPath(root, verifyArtifactPath, path.join(root, ".dossier", "verification", featureId), "verification artifact path");
					const verifyArtifact = JSON.parse(await promises.readFile(absVerifyArtifactPath, "utf8"));
					if (verifyArtifact.feature_id !== featureId || verifyArtifact.step !== normalizedStep) throw new Error(`Verification artifact must match feature ${featureId} and step ${normalizedStep}.`);
				}
				if (reviewArtifactPath) {
					const absReviewArtifactPath = await resolveManagedReadPath(root, reviewArtifactPath, path.join(root, ".dossier", "reviews", featureId), "review artifact path");
					const reviewArtifact = JSON.parse(await promises.readFile(absReviewArtifactPath, "utf8"));
					if (reviewArtifact.feature_id !== featureId || reviewArtifact.step !== normalizedStep) throw new Error(`Review artifact must match feature ${featureId} and step ${normalizedStep}.`);
				}
				if (outputPath) await assertManagedWritePath(root, path.join(root, ".dossier", "steps", featureId), path.resolve(root, outputPath), "step-close output path");
				await assertManagedWritePath(root, path.join(root, ".dossier", "logs", normalizedStep), stageLog.absPath, `${normalizedStep} stage log`);
				return await withDeliveryLock({
					root,
					featureId,
					featureCycleId: stageLog.featureCycleId,
					command: name,
					run: async () => {
						const { exitCode, stderr, stdout } = await captureDossierCommandOutput(name, args, command);
						const stepArtifactPath = path.join(".dossier", "steps", featureId, `${normalizedStep}.json`);
						const absStepArtifactPath = path.join(root, stepArtifactPath);
						if (stdout) io.stdout.write(stdout);
						try {
							await promises.access(absStepArtifactPath);
							const artifact = JSON.parse(await promises.readFile(absStepArtifactPath, "utf8"));
							await recordStepCloseOnStageLog({
								root,
								featureId,
								step: normalizedStep,
								stepArtifactPath,
								processComplete: artifact.process_complete === true
							});
							if (exitCode === 2) {
								io.stderr.write(`${JSON.stringify({ error: {
									blockers: artifact.blockers ?? [],
									code: "UDE_CLOSURE_BLOCKED",
									message: `dossier-step-close is blocked for ${featureId}/${normalizedStep}.`,
									step_artifact: stepArtifactPath
								} })}\n`);
								return 3;
							}
						} catch (error) {
							if (error?.code !== "ENOENT") writeLine(io.stderr, `[dossier-step-close] WARNING: step artifact was created, but stage log refresh failed: ${error instanceof Error ? error.message : String(error)}`);
						}
						if (stderr && exitCode !== 2) io.stderr.write(stderr);
						if (stderr && exitCode === 2) io.stderr.write(stderr);
						return exitCode;
					}
				});
			} catch (error) {
				io.stderr.write(`${JSON.stringify({ error: {
					code: "UDE_DOSSIER_STEP_CLOSE_FAILED",
					message: error instanceof Error ? error.message : String(error)
				} })}\n`);
				return 1;
			}
		}
	};
	if (name === "review-artifact") return {
		name,
		family,
		commandType: "dossier",
		summary: command.description,
		usage: baseHelpLines.filter((line) => line.trim().startsWith("dossier-engineer review-artifact")),
		helpLines: () => baseHelpLines,
		async execute(args, io) {
			try {
				const root = await resolveProcessRoot(process.cwd(), takeOption(args, "--root"));
				const dossierPath = takeOption(args, "--dossier");
				const step = takeOption(args, "--step");
				if (!dossierPath || !step) return executeCommand(command, args, io, name);
				const normalizedStep = ensureAllowedStep(step, "--step");
				const { featureId } = await resolveManagedDossierIdentity({
					root,
					dossierPath
				});
				const outputPath = takeOption(args, "--output");
				if (outputPath) await assertManagedWritePath(root, path.join(root, ".dossier", "reviews", featureId), path.resolve(root, outputPath), "review-artifact output path");
				const normalizedArgs = args.map((arg, index) => arg === step && args[index - 1] === "--step" ? normalizedStep : arg);
				const featureCycleId = await resolveLatestFeatureCycleId(root, featureId, normalizedStep);
				if (!featureCycleId) throw new Error(`No feature cycle found for ${featureId}.`);
				return await withDeliveryLock({
					root,
					featureId,
					featureCycleId,
					command: name,
					run: async () => executeCommand(command, normalizedArgs, io, name)
				});
			} catch (error) {
				io.stderr.write(`${JSON.stringify({ error: {
					code: "UDE_REVIEW_ARTIFACT_FAILED",
					message: error instanceof Error ? error.message : String(error)
				} })}\n`);
				return 1;
			}
		}
	};
	if (name === "contract-drift-audit") return {
		name,
		family,
		commandType: "dossier",
		summary: command.description,
		usage: baseHelpLines.filter((line) => line.trim().startsWith("dossier-engineer contract-drift-audit")),
		helpLines: () => baseHelpLines,
		async execute(args, io) {
			try {
				const root = await resolveProcessRoot(process.cwd(), takeOption(args, "--root"));
				const dossierPath = takeOption(args, "--dossier");
				if (dossierPath) {
					const { featureId } = await resolveManagedDossierIdentity({
						root,
						dossierPath
					});
					const outputPath = takeOption(args, "--output");
					if (outputPath) await assertManagedWritePath(root, path.join(root, ".dossier", "drift", featureId), path.resolve(root, outputPath), "contract-drift-audit output path");
					const featureCycleId = await resolveLatestFeatureCycleId(root, featureId);
					if (!featureCycleId) throw new Error(`No feature cycle found for ${featureId}.`);
					return await withDeliveryLock({
						root,
						featureId,
						featureCycleId,
						command: name,
						run: async () => executeCommand(command, args, io, name)
					});
				}
				return executeCommand(command, args, io, name);
			} catch (error) {
				io.stderr.write(`${JSON.stringify({ error: {
					code: "UDE_CONTRACT_DRIFT_AUDIT_FAILED",
					message: error instanceof Error ? error.message : String(error)
				} })}\n`);
				return 1;
			}
		}
	};
	if (name === "dossier-verify") return {
		name,
		family,
		commandType: "dossier",
		summary: command.description,
		usage: baseHelpLines.filter((line) => line.trim().startsWith("dossier-engineer dossier-verify")),
		helpLines: () => baseHelpLines,
		async execute(args, io) {
			try {
				const root = await resolveProcessRoot(process.cwd(), takeOption(args, "--root"));
				const dossierPath = takeOption(args, "--dossier");
				const step = takeOption(args, "--step");
				let featureId = null;
				if (dossierPath) {
					featureId = (await resolveManagedDossierIdentity({
						root,
						dossierPath
					})).featureId;
					const outputPath = takeOption(args, "--output");
					if (outputPath) await assertManagedWritePath(root, path.join(root, ".dossier", "verification", featureId), path.resolve(root, outputPath), "dossier-verify output path");
				}
				if (step) ensureAllowedStep(step, "--step");
				if (featureId) {
					const featureCycleId = await resolveLatestFeatureCycleId(root, featureId, step ? step : void 0);
					if (!featureCycleId) throw new Error(`No feature cycle found for ${featureId}.`);
					return await withDeliveryLock({
						root,
						featureId,
						featureCycleId,
						command: name,
						run: async () => executeCommand(command, args, io, name)
					});
				}
				return executeCommand(command, args, io, name);
			} catch (error) {
				io.stderr.write(`${JSON.stringify({ error: {
					code: "UDE_DOSSIER_VERIFY_FAILED",
					message: error instanceof Error ? error.message : String(error)
				} })}\n`);
				return 1;
			}
		}
	};
	if (name === "sync-index" || name === "lint-dossiers" || name === "index-refresh") return {
		name,
		family,
		commandType: "dossier",
		summary: command.description,
		usage: baseHelpLines.filter((line) => line.trim().startsWith(`dossier-engineer ${name}`)),
		helpLines: () => baseHelpLines,
		async execute(args, io) {
			try {
				const root = await resolveProcessRoot(process.cwd(), takeOption(args, "--root"));
				const indexFile = takeOption(args, "--index-file") ?? path.join("docs", "ssot", "index.md");
				await assertManagedWritePath(root, path.join(root, "docs", "ssot"), path.resolve(root, indexFile), `${name} index file`);
				if (name !== "lint-dossiers" || args.includes("--update-index")) return await withDeliveryLock({
					root,
					featureId: "index",
					featureCycleId: "global",
					command: name,
					run: async () => executeCommand(command, args, io, name)
				});
				return executeCommand(command, args, io, name);
			} catch (error) {
				io.stderr.write(`${JSON.stringify({ error: {
					code: "UDE_INDEX_HELPER_FAILED",
					message: error instanceof Error ? error.message : String(error)
				} })}\n`);
				return 1;
			}
		}
	};
	if (name === "lifecycle-refresh") return {
		name,
		family,
		commandType: "dossier",
		summary: command.description,
		usage: baseHelpLines.filter((line) => line.trim().startsWith("dossier-engineer lifecycle-refresh")),
		helpLines: () => baseHelpLines,
		async execute(args, io) {
			try {
				const root = await resolveProcessRoot(process.cwd(), takeOption(args, "--root"));
				const dossierPath = takeOption(args, "--dossier");
				let featureId = takeOption(args, "--feature-id");
				if (dossierPath) featureId = featureId ?? (await resolveManagedDossierIdentity({
					root,
					dossierPath
				})).featureId;
				if (featureId) {
					featureId = sanitizeFeatureId(featureId, "--feature-id");
					await assertManagedWritePath(root, path.join(root, ".dossier", "metrics", featureId), path.join(root, ".dossier", "metrics", featureId, ".probe.json"), "lifecycle metrics directory");
				}
				await assertManagedWritePath(root, path.join(root, ".dossier", "retro"), path.join(root, ".dossier", "retro", "session-index.jsonl"), "lifecycle session index path");
				const featureCycleId = takeOption(args, "--feature-cycle-id") ?? (featureId ? await resolveLatestFeatureCycleId(root, featureId) : null);
				if (!args.includes("--json")) {
					if (!featureId || !featureCycleId) return executeCommand(command, args, io, name);
					return await withDeliveryLock({
						root,
						featureId,
						featureCycleId,
						command: name,
						run: async () => executeCommand(command, args, io, name)
					});
				}
				const { exitCode, stderr, stdout } = featureId && featureCycleId ? await withDeliveryLock({
					root,
					featureId,
					featureCycleId,
					command: name,
					run: async () => captureDossierCommandOutput(name, args, command)
				}) : await captureDossierCommandOutput(name, args, command);
				if (exitCode !== 0) throw new Error(stderr.trim() || "lifecycle-refresh failed.");
				const summary = JSON.parse(stdout);
				writeCliEnvelope(io.stdout, {
					command: "lifecycle-refresh",
					scope: {
						feature_id: summary.feature_id,
						feature_cycle_id: summary.feature_cycle_id
					},
					data: summary
				});
				return 0;
			} catch (error) {
				io.stderr.write(`${JSON.stringify({ error: {
					code: "UDE_LIFECYCLE_REFRESH_FAILED",
					message: error instanceof Error ? error.message : String(error)
				} })}\n`);
				return 1;
			}
		}
	};
	return {
		name,
		family,
		commandType: "dossier",
		summary: command.description,
		usage: baseHelpLines.filter((line) => line.trim().startsWith("dossier-engineer ") || line.trim().startsWith("Usage:") === false).slice(0, 1),
		helpLines: () => baseHelpLines,
		execute
	};
}
function createStageControllerWrapper(command) {
	return {
		name: command,
		family: "delivery-stage",
		commandType: "stage",
		summary: `Mechanical controller for the ${command} delivery stage.`,
		usage: [
			`dossier-engineer ${command} --feature-id <id>`,
			`dossier-engineer ${command} --feature-id <id> --block`,
			`dossier-engineer ${command} --feature-id <id> --ready-for-close`
		],
		helpLines: () => [
			`Mechanical controller for the ${command} delivery stage.`,
			"",
			"Usage:",
			`  dossier-engineer ${command} --feature-id <id> [--root <path>] [--dossier <path>] [--cycle-id <id>] [--block | --ready-for-close]`,
			`  dossier-engineer ${command} --feature-id <id> --backlog-followup-kind <kind> [--backlog-followup-required] [--backlog-followup-resolved]`,
			"",
			"Rules:",
			"  - stage controllers stop at ready_for_close",
			"  - authoritative closure remains dossier-step-close + lifecycle-refresh",
			"  - backlog truth is not mutated directly by the stage controller"
		],
		async execute(args, io) {
			try {
				const result = await runStageControllerCommand(command, args);
				writeCliEnvelope(io.stdout, {
					command,
					scope: {
						feature_id: result.feature_id,
						feature_cycle_id: result.feature_cycle_id
					},
					data: result,
					nextCommands: result.next_commands
				});
				return 0;
			} catch (error) {
				io.stderr.write(`${JSON.stringify({ error: {
					code: "UDE_STAGE_CONTROL_FAILED",
					message: error instanceof Error ? error.message : String(error)
				} })}\n`);
				return 1;
			}
		}
	};
}
var DOSSIER_COMMANDS = [
	createDossierCommandWrapper("feature-intake", "delivery-stage"),
	createDossierCommandWrapper("contract-drift-audit", "delivery-helper"),
	createDossierCommandWrapper("coverage-audit", "delivery-helper"),
	createDossierCommandWrapper("debt-audit", "delivery-helper"),
	createDossierCommandWrapper("dependency-graph", "delivery-helper"),
	createDossierCommandWrapper("sync-index", "delivery-helper"),
	createDossierCommandWrapper("index-refresh", "delivery-helper"),
	createDossierCommandWrapper("lint-dossiers", "delivery-helper"),
	createDossierCommandWrapper("dossier-verify", "delivery-helper"),
	createDossierCommandWrapper("review-artifact", "delivery-helper"),
	createDossierCommandWrapper("dossier-step-close", "delivery-helper"),
	createDossierCommandWrapper("next-step", "delivery-helper"),
	createDossierCommandWrapper("lifecycle-refresh", "delivery-helper")
];
var STAGE_COMMANDS = [
	createStageControllerWrapper("spec-compact"),
	createStageControllerWrapper("plan-slice"),
	createStageControllerWrapper("implementation"),
	createStageControllerWrapper("change-proposal")
];
var COMMANDS = [
	...BACKLOG_COMMANDS,
	...DOSSIER_COMMANDS,
	...STAGE_COMMANDS
];
var FAMILY_TITLES = [
	["bootstrap", "Bootstrap / root-management"],
	["backlog-source", "Backlog truth / source registry"],
	["backlog-authoring", "Backlog truth / authoring and mutation"],
	["backlog-read", "Backlog truth / read models"],
	["delivery-stage", "Delivery stage controllers"],
	["delivery-helper", "Delivery helpers / integrity / closure"]
];
function findUnifiedCommand(name) {
	return COMMANDS.find((command) => command.name === name || command.aliases?.includes(name));
}
function renderGlobalHelp(version) {
	const lines = [
		`dossier-engineer ${version}`,
		"",
		"The only public utility for the merged dossier/backlog runtime.",
		"",
		"Usage:",
		"  dossier-engineer <command> [options]",
		"  dossier-engineer help [command]",
		"  dossier-engineer --help",
		"  dossier-engineer --version",
		""
	];
	for (const [family, title] of FAMILY_TITLES) {
		lines.push(`${title}:`);
		if (family === "bootstrap") lines.push("  help                   Show the shipped unified help surface or command-local help.");
		for (const command of COMMANDS.filter((entry) => entry.family === family)) {
			const aliasSuffix = command.aliases && command.aliases.length > 0 ? ` (aliases: ${command.aliases.join(", ")})` : "";
			lines.push(`  ${command.name.padEnd(22)} ${command.summary}${aliasSuffix}`);
		}
		lines.push("");
	}
	lines.push("Notes:", "  - Stage-controller commands are mechanical progress controllers only.", "  - Authoritative closure remains `dossier-step-close` followed by `lifecycle-refresh` when telemetry refresh is needed.", "  - This runtime only supports the canonical unified `.dossier` + `docs/ssot` layout.", "  - No split-skill migration, rollout, or compatibility launchers are shipped here.");
	return lines.join("\n");
}
async function runUnifiedCli(argv, io, options) {
	const [commandName, ...rest] = argv;
	if (!commandName || commandName === "--help" || commandName === "-h") {
		writeLine(io.stdout, renderGlobalHelp(options.version));
		return 0;
	}
	if (commandName === "--version") {
		writeLine(io.stdout, options.version);
		return 0;
	}
	if (commandName === "help") {
		const target = rest[0];
		if (!target) {
			writeLine(io.stdout, renderGlobalHelp(options.version));
			return 0;
		}
		const command = findUnifiedCommand(target);
		if (!command) {
			writeLine(io.stderr, `Unknown command: ${target}`);
			return 2;
		}
		const helpLines = command.helpLines?.() ?? [
			command.summary,
			"",
			"Usage:",
			...command.usage.map((line) => `  ${line}`)
		];
		writeLine(io.stdout, helpLines.join("\n"));
		return 0;
	}
	const command = findUnifiedCommand(commandName);
	if (!command) {
		writeLine(io.stderr, `Unknown command: ${commandName}`);
		writeLine(io.stderr, "Run `dossier-engineer --help` to list available commands.");
		return 2;
	}
	if (rest.includes("--help") || rest.includes("-h")) {
		const helpLines = command.helpLines?.() ?? [
			command.summary,
			"",
			"Usage:",
			...command.usage.map((line) => `  ${line}`)
		];
		writeLine(io.stdout, helpLines.join("\n"));
		return 0;
	}
	return command.execute(rest, io);
}
//#endregion
//#region src/entrypoints/dossier-engineer.ts
var io = {
	stdout: process.stdout,
	stderr: process.stderr
};
var exitCode = await runUnifiedCli(process.argv.slice(2), io, { version: package_default.version });
process.exitCode = exitCode;
//#endregion
