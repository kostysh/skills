#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
var name = "@kostysh/dossier-engineer-cli";
var version = "0.1.0";
var description = "CLI runtime for the dossier-engineer skill.";
var type = "module";
var bin = { "dossier-engineer": "scripts/dossier-engineer.mjs" };
var exports = { ".": "./scripts/dossier-engineer.mjs" };
var files = ["scripts"];
var engines = { "node": ">=22.22.0" };
var scripts = {
	"build": "vite build && chmod +x scripts/dossier-engineer.mjs",
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
var dependencies = { "yaml": "^2.8.1" };
var devDependencies = {
	"@biomejs/biome": "^2.3.8",
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
var merge = {
	identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
	default: "key",
	tag: "tag:yaml.org,2002:merge",
	test: /^<<$/,
	resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), { addToJSMap: addMergeToJSMap }),
	stringify: () => MERGE_KEY
};
var isMergeKey = (ctx, key) => (merge.identify(key) || isScalar$1(key) && (!key.type || key.type === Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
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
var string = {
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
var int$1 = {
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
	string,
	nullTag,
	boolTag,
	intOct$1,
	int$1,
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
var int = {
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
	string,
	nullTag,
	trueTag,
	falseTag,
	intBin,
	intOct,
	int,
	intHex,
	floatNaN,
	floatExp,
	float,
	binary,
	merge,
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
		string
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
	int: int$1,
	intHex: intHex$1,
	intOct: intOct$1,
	intTime,
	map,
	merge,
	null: nullTag,
	omap,
	pairs,
	seq,
	set,
	timestamp
};
var coreKnownTags = {
	"tag:yaml.org,2002:binary": binary,
	"tag:yaml.org,2002:merge": merge,
	"tag:yaml.org,2002:omap": omap,
	"tag:yaml.org,2002:pairs": pairs,
	"tag:yaml.org,2002:set": set,
	"tag:yaml.org,2002:timestamp": timestamp
};
function getTags(customTags, schemaName, addMergeTag) {
	const schemaTags = schemas.get(schemaName);
	if (schemaTags && !customTags) return addMergeTag && !schemaTags.includes(merge) ? schemaTags.concat(merge) : schemaTags.slice();
	let tags = schemaTags;
	if (!tags) if (Array.isArray(customTags)) tags = [];
	else {
		const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
		throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
	}
	if (Array.isArray(customTags)) for (const tag of customTags) tags = tags.concat(tag);
	else if (typeof customTags === "function") tags = customTags(tags.slice());
	if (addMergeTag) tags = tags.concat(merge);
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
		Object.defineProperty(this, SCALAR$1, { value: string });
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
	const lines = scalar.source ? splitLines(scalar.source) : [];
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
function splitLines(source) {
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
function parse$1(src, reviver, options) {
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
	parse: () => parse$1,
	parseAllDocuments: () => parseAllDocuments,
	parseDocument: () => parseDocument,
	stringify: () => stringify,
	visit: () => visit$1,
	visitAsync: () => visitAsync
});
//#endregion
//#region src/errors.ts
var DossierError = class extends Error {
	exitCode;
	code;
	constructor(message, exitCode, code) {
		super(message);
		this.name = "DossierError";
		this.exitCode = exitCode;
		this.code = code;
	}
};
var UsageError = class extends DossierError {
	constructor(message) {
		super(message, 1, "usage");
		this.name = "UsageError";
	}
};
var BlockedError = class extends DossierError {
	constructor(message) {
		super(message, 2, "blocked");
		this.name = "BlockedError";
	}
};
var RootNotFoundError = class extends DossierError {
	constructor(message) {
		super(message, 5, "root_not_found");
		this.name = "RootNotFoundError";
	}
};
//#endregion
//#region src/domain.ts
var DOSSIER_DIR = "docs/dossier";
var ARTIFACT_DIRS = [
	"sources",
	"capabilities",
	"baselines",
	"guardrails",
	"work-items",
	"source-reviews",
	"stages",
	"verification",
	"reviews",
	"hygiene",
	"changesets",
	"reports",
	"retro"
];
var SOURCE_KINDS = [
	"concept",
	"architecture",
	"specification",
	"policy",
	"contract",
	"decision-record",
	"test-plan",
	"external-reference",
	"code-reference",
	"other"
];
var AUTHORITIES = [
	"canonical",
	"supporting",
	"informational",
	"deprecated"
];
var CAPABILITY_STATUSES = [
	"intended",
	"existing",
	"partial",
	"unverified",
	"retired"
];
var BASELINE_MODES = [
	"existing-project",
	"release-snapshot",
	"regression-baseline",
	"manual"
];
var BASELINE_STATUSES = [
	"observed",
	"assumed",
	"unverified",
	"partial",
	"regressed"
];
var WORK_TYPES = [
	"feature",
	"fix",
	"refactor",
	"migration",
	"research",
	"test",
	"documentation",
	"operations",
	"security",
	"debt"
];
var DELIVERY_KINDS = [
	"capability",
	"support",
	"maintenance",
	"exploration"
];
var RELATIONS = [
	"introduces",
	"extends",
	"supports",
	"maintains",
	"verifies",
	"retires"
];
var ACCEPTANCE_KINDS = [
	"behavior",
	"contract",
	"unit",
	"integration",
	"security",
	"performance",
	"accessibility",
	"operational",
	"documentation",
	"support",
	"negative",
	"falsifier"
];
var STAGES = [
	"feature-intake",
	"spec-compact",
	"plan-slice",
	"implementation",
	"change-proposal"
];
var REVIEW_CLASSES = [
	"concept-conformance-reviewer",
	"spec-conformance-reviewer",
	"code-reviewer",
	"security-reviewer",
	"release-reviewer",
	"contract-reviewer"
];
var VERDICTS = [
	"pass",
	"fail",
	"blocked",
	"not_applicable"
];
var SOURCE_REVIEW_VERDICTS = [
	"no_backlog_change",
	"update_capabilities",
	"update_existing_items",
	"create_followups",
	"retire_items",
	"blocked_pending_decision"
];
var isOneOf = (value, values) => typeof value === "string" && values.includes(value);
var isoNow = (date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");
//#endregion
//#region src/infra.ts
var defaultContext = (cwd) => ({
	cwd,
	now: () => /* @__PURE__ */ new Date(),
	randomHex: (bytes) => randomBytes(bytes).toString("hex")
});
var DossierWriteLockConflictError = class extends Error {
	conflict;
	constructor(conflict) {
		super(`Dossier write lock is held: ${conflict.lockPath}`);
		this.name = "DossierWriteLockConflictError";
		this.conflict = conflict;
	}
};
var toPosix = (value) => value.split(path.sep).join("/");
var relativeToRoot = (root, absolutePath) => toPosix(path.relative(root, absolutePath));
var isUrlLike = (value) => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
var dossierPath = (root, ...parts) => path.join(root, DOSSIER_DIR, ...parts);
var runtimeDirPath = (root) => path.join(root, ".dossier-runtime");
var dossierWriteLockPath = (root) => path.join(runtimeDirPath(root), "write.lock");
var ensureRuntimeDirectoryIgnored = async (root) => {
	const gitignorePath = path.join(root, ".gitignore");
	const entry = ".dossier-runtime/";
	const note = "# Dossier-engineer ephemeral runtime locks";
	if (!existsSync(gitignorePath)) {
		await writeFile(gitignorePath, `${note}\n${entry}\n`, "utf8");
		return true;
	}
	const current = await readFile(gitignorePath, "utf8");
	const lines = current.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "" && !line.startsWith("#"));
	if (lines.includes(entry) || lines.includes("**/.dossier-runtime/")) return false;
	await writeFile(gitignorePath, `${current}${current.endsWith("\n") ? "\n" : "\n\n"}${note}\n${entry}\n`, "utf8");
	return true;
};
var readLockMetadata = async (lockPath) => {
	try {
		const raw = await readFile(path.join(lockPath, "holder.json"), "utf8");
		const parsed = JSON.parse(raw);
		if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
		const record = parsed;
		if (typeof record.pid !== "number" || typeof record.command !== "string" || typeof record.acquired_at !== "string") return null;
		return {
			pid: record.pid,
			command: record.command,
			acquired_at: record.acquired_at
		};
	} catch {
		return null;
	}
};
var acquireDossierWriteLock = async (root, command, now, options = {}) => {
	const runtimeDir = runtimeDirPath(root);
	const lockPath = dossierWriteLockPath(root);
	await mkdir(runtimeDir, { recursive: true });
	try {
		await mkdir(lockPath);
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
		const [holder, details] = await Promise.all([readLockMetadata(lockPath), stat(lockPath).catch(() => null)]);
		throw new DossierWriteLockConflictError({
			lockPath,
			holder,
			ageSeconds: details === null ? null : Math.max(0, Math.round((now.getTime() - details.mtimeMs) / 1e3))
		});
	}
	const metadata = {
		pid: process.pid,
		command,
		acquired_at: now.toISOString()
	};
	try {
		if (options.writeMetadata !== void 0) await options.writeMetadata(lockPath, metadata);
		else await writeFile(path.join(lockPath, "holder.json"), JSON.stringify(metadata, null, 2), "utf8");
	} catch (error) {
		await rm(lockPath, {
			recursive: true,
			force: true
		});
		throw error;
	}
	return async () => {
		await rm(lockPath, {
			recursive: true,
			force: true
		});
	};
};
var discoverRoot = (cwd, suppliedRoot, command) => {
	if (suppliedRoot !== void 0) {
		const resolved = path.resolve(cwd, suppliedRoot);
		if (!existsSync(resolved)) throw new RootNotFoundError(`Root does not exist: ${suppliedRoot}`);
		return resolved;
	}
	let current = cwd;
	while (true) {
		if (existsSync(dossierPath(current, "project.md"))) return current;
		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}
	if (command === "init") {
		current = cwd;
		while (true) {
			if (existsSync(path.join(current, ".git"))) return current;
			const parent = path.dirname(current);
			if (parent === current) break;
			current = parent;
		}
		return cwd;
	}
	throw new RootNotFoundError("Dossier root not found. Run `dossier-engineer init --root <path> --project-name \"<name>\"`.");
};
var ensureDossierDirs = async (root) => {
	await mkdir(dossierPath(root), { recursive: true });
	await Promise.all(ARTIFACT_DIRS.map((dir) => mkdir(dossierPath(root, dir), { recursive: true })));
};
var parseMarkdownArtifact = (content) => {
	if (!content.startsWith("---\n")) throw new Error("Missing YAML frontmatter.");
	const closeIndex = content.indexOf("\n---", 4);
	if (closeIndex === -1) throw new Error("Unclosed YAML frontmatter.");
	const rawYaml = content.slice(4, closeIndex);
	const bodyStart = content.indexOf("\n", closeIndex + 4);
	const body = bodyStart === -1 ? "" : content.slice(bodyStart + 1);
	const parsed = browser_default.parse(rawYaml);
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("YAML frontmatter must be a mapping.");
	return {
		frontmatter: parsed,
		body
	};
};
var stringifyMarkdownArtifact = (frontmatter, body) => `---\n${browser_default.stringify(frontmatter, { lineWidth: 0 })}---\n${body.startsWith("\n") ? body.slice(1) : body}`;
var readArtifactFile = async (root, relativePath) => {
	const parsed = parseMarkdownArtifact(await readFile(path.resolve(root, relativePath), "utf8"));
	return {
		path: toPosix(relativePath),
		frontmatter: parsed.frontmatter,
		body: parsed.body
	};
};
var writeArtifactFile = async (root, relativePath, frontmatter, body) => {
	const absolutePath = path.resolve(root, relativePath);
	const parentDir = path.dirname(absolutePath);
	await mkdir(parentDir, { recursive: true });
	const tempPath = path.join(parentDir, `.${path.basename(absolutePath)}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`);
	try {
		await writeFile(tempPath, stringifyMarkdownArtifact(frontmatter, body), "utf8");
		await rename(tempPath, absolutePath);
	} catch (error) {
		await rm(tempPath, { force: true });
		throw error;
	}
};
var listFilesRecursive = async (dir) => {
	if (!existsSync(dir)) return [];
	const entries = await readdir(dir, { withFileTypes: true });
	return (await Promise.all(entries.map(async (entry) => {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) return listFilesRecursive(entryPath);
		return [entryPath];
	}))).flat();
};
var artifactTypeFromRelativePath = (relativePath) => {
	if (relativePath === "docs/dossier/project.md") return "dossier_project";
	if (/^docs\/dossier\/sources\/SRC-.*\.md$/.test(relativePath)) return "source";
	if (/^docs\/dossier\/capabilities\/CAP-.*\.md$/.test(relativePath)) return "capability";
	if (/^docs\/dossier\/baselines\/BASE-.*\.md$/.test(relativePath)) return "baseline";
	if (/^docs\/dossier\/guardrails\/KILL-.*\.md$/.test(relativePath)) return "guardrail";
	if (/^docs\/dossier\/work-items\/WI-.*\.md$/.test(relativePath)) return "work_item";
	if (/^docs\/dossier\/source-reviews\/SR-.*\.md$/.test(relativePath)) return "source_review";
	if (/^docs\/dossier\/stages\/WI-.*\/STG-.*\.md$/.test(relativePath)) return "stage_event";
	if (/^docs\/dossier\/verification\/WI-.*\/VER-.*\.md$/.test(relativePath)) return "verification";
	if (/^docs\/dossier\/reviews\/WI-.*\/REV-.*\.md$/.test(relativePath)) return "review";
	if (/^docs\/dossier\/hygiene\/WI-.*\/HYG-.*\.md$/.test(relativePath)) return "hygiene";
	if (/^docs\/dossier\/changesets\/CS-.*\.md$/.test(relativePath)) return "changeset";
	if (/^docs\/dossier\/retro\/RETRO-.*\.md$/.test(relativePath)) return "retrospective_report";
	if (/^docs\/dossier\/reports\/.*\.md$/.test(relativePath)) return "report";
	return null;
};
var loadArtifacts = async (root) => {
	const files = await listFilesRecursive(dossierPath(root));
	const artifacts = [];
	const parseErrors = [];
	for (const file of files.filter((entry) => entry.endsWith(".md"))) {
		const relativePath = relativeToRoot(root, file);
		try {
			const artifact = await readArtifactFile(root, relativePath);
			artifacts.push(artifact);
		} catch (error) {
			parseErrors.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return {
		artifacts,
		parseErrors
	};
};
var findArtifactById = (artifacts, id) => artifacts.find((artifact) => artifact.frontmatter.id === id || artifact.frontmatter.project_id === id);
var findArtifactsByType = (artifacts, type) => artifacts.filter((artifact) => artifact.frontmatter.artifact_type === type);
var expectedArtifactType = (relativePath) => artifactTypeFromRelativePath(relativePath);
var hashFile = async (absolutePath) => {
	const content = await readFile(absolutePath);
	return createHash("sha256").update(content).digest("hex");
};
var hashObject = (value) => {
	const normalize = (input) => {
		if (Array.isArray(input)) return input.map(normalize);
		if (input !== null && typeof input === "object") return Object.fromEntries(Object.entries(input).filter(([key]) => ![
			"created_at",
			"updated_at",
			"registered_at",
			"changed_at"
		].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, normalize(nested)]));
		return input;
	};
	return createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
};
var slugify = (value) => {
	const normalized = value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "");
	return normalized.length > 0 ? normalized : "item";
};
var makeId = (root, prefix, title, randomHex, relativePathForId, now = /* @__PURE__ */ new Date()) => {
	const date = now.toISOString().slice(0, 10).replace(/-/g, "");
	const slug = slugify(title);
	for (let attempt = 0; attempt < 20; attempt += 1) {
		const id = `${prefix}-${date}-${slug}-${randomHex(3)}`;
		if (!existsSync(path.resolve(root, relativePathForId(id)))) return id;
	}
	throw new Error(`Unable to generate unique ${prefix} id.`);
};
var localPathExists = async (absolutePath) => {
	try {
		await stat(absolutePath);
		return true;
	} catch {
		return false;
	}
};
var newArtifactFrontmatter = (artifact_type, id, title, now) => ({
	artifact_type,
	schema_version: "2.2",
	id,
	title,
	created_at: now,
	updated_at: now
});
//#endregion
//#region src/app.ts
var artifactInfo = (artifact) => ({
	path: artifact.path,
	artifact_type: displayValue(artifact.frontmatter.artifact_type),
	id: artifactId(artifact)
});
var displayValue = (input, fallback = "") => {
	if (input === null || input === void 0) return fallback;
	if (typeof input === "string") return input;
	if (typeof input === "number" || typeof input === "boolean" || typeof input === "bigint") return String(input);
	return JSON.stringify(input) ?? fallback;
};
var artifactId = (artifact) => displayValue(artifact.frontmatter.id ?? artifact.frontmatter.project_id);
var value = (command, name) => {
	const raw = command.options[name];
	if (Array.isArray(raw)) return raw.at(-1);
	return typeof raw === "string" ? raw : void 0;
};
var values = (command, name) => {
	const raw = command.options[name];
	if (Array.isArray(raw)) return raw;
	return typeof raw === "string" ? [raw] : [];
};
var hasFlag = (command, name) => command.options[name] === true;
var requireValue = (command, name) => {
	const raw = value(command, name);
	if (raw === void 0 || raw.trim() === "") throw new UsageError(`Missing required option --${name}.`);
	return raw;
};
var requireEnum = (command, name, allowed) => {
	const raw = requireValue(command, name);
	if (!isOneOf(raw, allowed)) throw new UsageError(`Invalid --${name}: ${raw}. Expected one of: ${allowed.join(", ")}.`);
	return raw;
};
var body = (title, sections) => [
	`# ${title}`,
	"",
	...sections.flatMap((section) => [`## ${section}`, ""])
].join("\n");
var workItemBody = (title, deliveryKind) => {
	const sections = [
		"# " + title,
		"",
		"## Summary",
		"",
		"## Capability relation",
		"",
		"## Source interpretation",
		"",
		"## Scope",
		""
	];
	if (deliveryKind === "capability") sections.push("## Spec Compact", "", "### Behavior statement", "", "### Acceptance criteria matrix", "", "### Negative acceptance / falsifiers", "", "### Anti-claims and non-goals", "", "### Open questions and gaps", "", "## Plan Slice", "", "### Implementation target", "", "### Integration path", "", "- Actor entrypoint:", "- Runtime path:", "- Production components touched:", "- UI/API/agent path:", "- State/effect path:", "- Continuity path:", "- What would prove this is integrated:", "- What would prove this is only substrate:", "", "### Files, interfaces, and components", "", "### Sequence", "", "### AC to evidence matrix", "", "| AC | Observable behavior | Implementation surface | Evidence method | Falsifier |", "| --- | --- | --- | --- | --- |", "", "### Risks and fallback/change-proposal triggers", "");
	sections.push("## Acceptance criteria notes", "", "## Demonstration notes", "", "## Anti-claims notes", "", "## Pre-implementation challenge", "", "## Dependencies and blockers", "", "## Implementation notes", "", "## Verification notes", "", "## Review notes", "", "## Closure notes", "", "## Process notes", "");
	return sections.join("\n");
};
var next = (command, reason) => ({
	command,
	reason
});
var BODY_COMPLETION_ARTIFACT_TYPES = new Set([
	"source",
	"capability",
	"baseline",
	"guardrail",
	"work_item",
	"review",
	"verification",
	"changeset"
]);
var bodyCompletionNextAction = (createdArtifacts) => {
	const paths = createdArtifacts.filter((artifact) => BODY_COMPLETION_ARTIFACT_TYPES.has(artifact.artifact_type ?? "")).map((artifact) => artifact.path);
	if (paths.length === 0) return void 0;
	return next(`edit body sections in ${paths.length === 1 ? paths[0] : `${paths.length} created dossier artifacts`}`, "Complete the human-readable body before stage close, handoff, PR preparation, or final response.");
};
var withBodyCompletionReminder = (patch) => {
	const reminder = bodyCompletionNextAction(patch.created_artifacts ?? []);
	if (reminder === void 0) return patch;
	return {
		...patch,
		next_actions: [...patch.next_actions ?? [], reminder]
	};
};
var result = (command, patch) => ({
	command: command.raw,
	created_artifacts: [],
	changed_artifacts: [],
	warnings: [],
	blockers: [],
	next_actions: [],
	...withBodyCompletionReminder(patch)
});
var sourceRef = (sourceId, anchor) => ({
	source_id: sourceId,
	anchors: anchor ? [anchor] : []
});
var resolveSourcePart = (source) => {
	const [source_id, anchor] = source.split("#");
	if (source_id === void 0 || source_id.trim() === "") throw new UsageError("Source reference must be <source-id> or <source-id>#<anchor>.");
	return {
		source_id,
		anchor: anchor ?? null
	};
};
var artifactPath = (kind, id) => {
	switch (kind) {
		case "source": return `${DOSSIER_DIR}/sources/${id}.md`;
		case "capability": return `${DOSSIER_DIR}/capabilities/${id}.md`;
		case "baseline": return `${DOSSIER_DIR}/baselines/${id}.md`;
		case "guardrail": return `${DOSSIER_DIR}/guardrails/${id}.md`;
		case "work": return `${DOSSIER_DIR}/work-items/${id}.md`;
		case "source-review": return `${DOSSIER_DIR}/source-reviews/${id}.md`;
		case "changeset": return `${DOSSIER_DIR}/changesets/${id}.md`;
		case "retro": return `${DOSSIER_DIR}/retro/${id}.md`;
		default: throw new Error(`Unknown artifact path kind: ${kind}`);
	}
};
var evidencePathsExist = async (root, paths) => {
	const missing = [];
	for (const evidencePath of paths) if (!isUrlLike(evidencePath) && !await localPathExists(path.resolve(root, evidencePath))) missing.push(evidencePath);
	return missing;
};
var loadRootArtifacts = async (ctx, command) => {
	const root = discoverRoot(ctx.cwd, value(command, "root"), command.words.join(" "));
	return {
		root,
		...await loadArtifacts(root)
	};
};
var updateArtifact = async (root, artifact, frontmatter, now) => {
	const current = await readArtifactFile(root, artifact.path);
	if (current.body !== artifact.body || current.frontmatter.updated_at !== artifact.frontmatter.updated_at || hashObject(current.frontmatter) !== hashObject(artifact.frontmatter)) throw new BlockedError(`Stale dossier artifact write rejected for ${artifact.path}; re-run the command after reading current dossier state.`);
	const updated = {
		...frontmatter,
		updated_at: now
	};
	await writeArtifactFile(root, artifact.path, updated, artifact.body);
	return {
		...artifact,
		frontmatter: updated
	};
};
var normalizedMaterialSection = (bodyText, section, subsection) => {
	const sectionContent = markdownSection(bodyText, section, 2) ?? "";
	return materialText(subsection === void 0 ? sectionContent : markdownSection(sectionContent, subsection, 3) ?? "").replace(/\s+/g, " ").trim().toLowerCase();
};
var materialBodyScope = (bodyText) => ({
	spec_compact: {
		behavior_statement: normalizedMaterialSection(bodyText, "Spec Compact", "Behavior statement"),
		acceptance_criteria_matrix: normalizedMaterialSection(bodyText, "Spec Compact", "Acceptance criteria matrix"),
		negative_acceptance_falsifiers: normalizedMaterialSection(bodyText, "Spec Compact", "Negative acceptance / falsifiers"),
		anti_claims_non_goals: normalizedMaterialSection(bodyText, "Spec Compact", "Anti-claims and non-goals"),
		open_questions_gaps: normalizedMaterialSection(bodyText, "Spec Compact", "Open questions and gaps")
	},
	plan_slice: {
		implementation_target: normalizedMaterialSection(bodyText, "Plan Slice", "Implementation target"),
		integration_path: normalizedMaterialSection(bodyText, "Plan Slice", "Integration path"),
		files_interfaces_components: normalizedMaterialSection(bodyText, "Plan Slice", "Files, interfaces, and components"),
		sequence: normalizedMaterialSection(bodyText, "Plan Slice", "Sequence"),
		ac_evidence_matrix: normalizedMaterialSection(bodyText, "Plan Slice", "AC to evidence matrix"),
		risks_change_proposal: normalizedMaterialSection(bodyText, "Plan Slice", "Risks and fallback/change-proposal triggers")
	}
});
var materialWorkHash = (work, capabilities, sources) => {
	const capabilityRefs = (work.frontmatter.delivery?.capability_refs ?? []).map((entry) => entry.capability_id).filter((entry) => typeof entry === "string");
	const sourceRefs = (work.frontmatter.source_refs ?? []).map((entry) => entry.source_id).filter((entry) => typeof entry === "string");
	return hashObject({
		source_refs: work.frontmatter.source_refs,
		source_hashes: sources.filter((source) => sourceRefs.includes(String(source.frontmatter.id))).map((source) => ({
			id: source.frontmatter.id,
			content_hash: source.frontmatter.content_hash
		})),
		capability_refs: capabilityRefs,
		capabilities: capabilities.filter((capability) => capabilityRefs.includes(String(capability.frontmatter.id))).map((capability) => ({
			id: capability.frontmatter.id,
			claim: capability.frontmatter.claim,
			anti_claims: capability.frontmatter.anti_claims,
			source_refs: capability.frontmatter.source_refs
		})),
		delivery: work.frontmatter.delivery,
		acceptance: work.frontmatter.acceptance,
		demonstration: work.frontmatter.demonstration,
		anti_claims: work.frontmatter.anti_claims,
		challenge: work.frontmatter.challenge,
		dependencies: work.frontmatter.dependencies,
		risk: work.frontmatter.risk,
		material_body: materialBodyScope(work.body)
	});
};
var recomputeWorkHash = (work, all) => ({
	...work.frontmatter,
	material_scope_hash: materialWorkHash(work, findArtifactsByType(all, "capability"), findArtifactsByType(all, "source"))
});
var sourceReviewOpenForWork = (work, sourceReviews) => {
	const refs = (work.frontmatter.source_refs ?? []).map((entry) => entry.source_id).filter((entry) => typeof entry === "string");
	return sourceReviews.some((review) => review.frontmatter.status === "open" && refs.includes(String(review.frontmatter.source_id)));
};
var openBlockers = (work) => (work.frontmatter.blockers ?? []).filter((entry) => entry.blocking !== false && entry.resolved_at == null);
var workGateFindings = (work) => {
	const findings = [];
	const delivery = work.frontmatter.delivery;
	const kind = delivery?.kind;
	const criteria = work.frontmatter.acceptance?.criteria ?? [];
	const demonstration = work.frontmatter.demonstration;
	const antiClaims = work.frontmatter.anti_claims ?? [];
	const challenge = work.frontmatter.challenge;
	if (kind === "capability") {
		if (!criteria.some((entry) => entry.kind === "behavior")) findings.push(`${artifactId(work)}: capability work lacks behavior acceptance criterion.`);
		if (typeof demonstration?.scenario !== "string" || demonstration.scenario.trim() === "") findings.push(`${artifactId(work)}: capability work lacks demonstration scenario.`);
		if (antiClaims.length === 0) findings.push(`${artifactId(work)}: capability work lacks anti-claims.`);
		if (challenge?.recorded !== true) findings.push(`${artifactId(work)}: capability work lacks pre-implementation challenge.`);
	}
	if (kind === "support" && (typeof delivery?.support_reason !== "string" || delivery.support_reason.trim() === "")) findings.push(`${artifactId(work)}: support work lacks support reason.`);
	return findings;
};
var currentMaterialWorkHash = (work, all) => materialWorkHash(work, findArtifactsByType(all, "capability"), findArtifactsByType(all, "source"));
var currentMaterialReviewHash = (work, all) => {
	const evidenceKey = (entry) => JSON.stringify(entry);
	const liveAppEvidence = findArtifactsByType(all, "verification").filter((verification) => verification.frontmatter.work_item_id === work.frontmatter.id && verification.frontmatter.profile === "behavioral-demo" && verification.frontmatter.evidence_class === "live-app" && verification.frontmatter.verdict === "pass").map((verification) => ({
		entrypoint: verification.frontmatter.entrypoint,
		runtime_path: verification.frontmatter.runtime_path,
		evidence: verification.frontmatter.evidence
	})).sort((a, b) => evidenceKey(a).localeCompare(evidenceKey(b))).filter((entry, index, entries) => index === 0 || evidenceKey(entry) !== evidenceKey(entries[index - 1]));
	return hashObject({
		material_scope: currentMaterialWorkHash(work, all),
		live_app_evidence: liveAppEvidence
	});
};
var reviewFresh = (work, all, auditClass) => {
	const currentHash = currentMaterialReviewHash(work, all);
	return findArtifactsByType(all, "review").some((review) => review.frontmatter.work_item_id === work.frontmatter.id && review.frontmatter.audit_class === auditClass && review.frontmatter.verdict === "pass" && review.frontmatter.material_scope_hash === currentHash);
};
var reviewFreshForStage = (work, all, auditClass, stage) => {
	const currentHash = stage === "plan-slice" ? currentMaterialWorkHash(work, all) : currentMaterialReviewHash(work, all);
	return findArtifactsByType(all, "review").some((review) => review.frontmatter.work_item_id === work.frontmatter.id && review.frontmatter.stage === stage && review.frontmatter.audit_class === auditClass && review.frontmatter.verdict === "pass" && review.frontmatter.material_scope_hash === currentHash);
};
var verificationFresh = (work, all, profile) => {
	const currentHash = currentMaterialWorkHash(work, all);
	return findArtifactsByType(all, "verification").some((verification) => verification.frontmatter.work_item_id === work.frontmatter.id && verification.frontmatter.profile === profile && verification.frontmatter.verdict === "pass" && verification.frontmatter.material_scope_hash === currentHash);
};
var markdownLineValue = (input, label) => {
	const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = new RegExp(`^\\s*(?:[-*]\\s*)?${escaped}:\\s*(.+?)\\s*$`, "im").exec(input);
	return match?.[1]?.trim() === "" ? null : match?.[1]?.trim() ?? null;
};
var normalizedComparable = (input) => input.toLowerCase().replace(/\s+/g, " ").trim();
var planSliceSection = (work) => markdownSection(work.body, "Plan Slice", 2) ?? "";
var planIntegrationSection = (work) => markdownSection(planSliceSection(work), "Integration path", 3) ?? "";
var planRuntimePath = (work) => markdownLineValue(planIntegrationSection(work), "Runtime path");
var hasNonUserVisibleRationale = (work) => {
	const plan = planSliceSection(work);
	return /non[- ]user[- ]visible/i.test(plan) && hasMaterialSectionContent(plan);
};
var isUserVisibleCapabilityWork = (work) => {
	return work.frontmatter.delivery?.kind === "capability" && !hasNonUserVisibleRationale(work);
};
var liveAppVerificationFresh = (work, all, profile = "behavioral-demo") => {
	const currentHash = currentMaterialWorkHash(work, all);
	const requiredRuntimePath = planRuntimePath(work);
	const normalizedRequiredPath = requiredRuntimePath === null ? null : normalizedComparable(requiredRuntimePath);
	return findArtifactsByType(all, "verification").some((verification) => {
		if (verification.frontmatter.work_item_id !== work.frontmatter.id || verification.frontmatter.profile !== profile || verification.frontmatter.verdict !== "pass" || verification.frontmatter.evidence_class !== "live-app" || verification.frontmatter.material_scope_hash !== currentHash) return false;
		const entrypoint = verification.frontmatter.entrypoint;
		const runtimePath = verification.frontmatter.runtime_path;
		if (typeof entrypoint !== "string" || entrypoint.trim() === "" || typeof runtimePath !== "string" || runtimePath.trim() === "") return false;
		if (normalizedRequiredPath === null) return true;
		const normalizedEvidencePath = normalizedComparable(runtimePath);
		return normalizedEvidencePath.includes(normalizedRequiredPath) || normalizedRequiredPath.includes(normalizedEvidencePath);
	});
};
var postCloseHygieneClosed = (work, stage) => {
	const postCloseHygiene = work.frontmatter.post_close_hygiene;
	return postCloseHygiene?.[stage] === "closed" || postCloseHygiene?.[stage] === "pass";
};
var handoffComplete = (work) => postCloseHygieneClosed(work, "implementation") && (work.frontmatter.lifecycle === "closed" || work.frontmatter.lifecycle === "implemented");
var closureFindings = (work, all) => {
	const findings = workGateFindings(work);
	const delivery = work.frontmatter.delivery;
	if (work.frontmatter.stage_state?.implementation === "closed" || work.frontmatter.lifecycle === "implemented") {
		if (delivery?.kind === "capability" && !verificationFresh(work, all, "behavioral-demo")) findings.push(`${artifactId(work)}: implementation closed without fresh behavioral-demo verification.`);
		if (isUserVisibleCapabilityWork(work) && !liveAppVerificationFresh(work, all)) findings.push(`${artifactId(work)}: implementation closed without fresh live-app behavioral-demo verification for the named production path.`);
		for (const reviewClass of requiredReviewClasses(work, "implementation")) if (!reviewFresh(work, all, reviewClass)) findings.push(`${artifactId(work)}: implementation closed without fresh ${reviewClass} review.`);
	}
	return findings;
};
var commandMutationMode = (command) => {
	const [head, second, third] = command.words;
	if (head === "status" || head === "attention" || head === "queue" || head === "next" || head === "lint" || head === "source" && (second === "list" || second === "impact") || head === "capability" && second === "check" || head === "verify" && second === "required" || head === "review" && second === "required") return "read-only";
	if (head === "guardrail" && second === "check" && !hasFlag(command, "record")) return "read-only";
	if (head === "verify" && second === "run") return "verify-run-split";
	if (head === "init" || head === "repair" && second === "frontmatter" || head === "source" && (second === "add" || second === "refresh") || head === "source" && second === "review" && third === "resolve" || head === "capability" && (second === "create" || second === "claim" && third === "set" || second === "anti-claim" && third === "add" || second === "demo" && third === "record") || head === "baseline" && (second === "create" || second === "capability" && third === "add") || head === "guardrail" && (second === "add" || second === "check" || second === "resolve") || head === "work" && (second === "create" || second === "acceptance" && third === "add" || second === "demo" && third === "set" || second === "anti-claim" && third === "add" || second === "challenge" && third === "record" || second === "support" && third === "explain" || second === "dependency" && (third === "add" || third === "remove") || second === "blocker" && (third === "add" || third === "resolve") || second === "risk" && third === "set" || second === "retire" || second === "amend" || second === "split") || head === "stage" && [
		"start",
		"ready",
		"close",
		"reopen",
		"log"
	].includes(String(second)) || head === "verify" && second === "record" || head === "review" && second === "record" || head === "hygiene" && second === "run" || head === "changeset" && second === "create" || head === "report" && second === "create" || head === "retro" && second === "create") return "locked";
	return "read-only";
};
var lockConflictResult = (command, conflict) => {
	const holder = conflict.holder;
	const holderText = holder === null ? "holder metadata unavailable" : `pid=${holder.pid}, command=${holder.command}, acquired_at=${holder.acquired_at}`;
	const ageText = conflict.ageSeconds === null ? "unknown" : `${conflict.ageSeconds}s`;
	return result(command, {
		result: "blocked",
		blockers: [
			`Dossier write lock is held at ${conflict.lockPath}.`,
			`Holder: ${holderText}.`,
			`Lock age: ${ageText}.`
		],
		next_actions: [next("inspect the running dossier-engineer command or remove the lock only after confirming the holder is dead", "Default lock conflict behavior is fail-fast; the runtime does not wait implicitly."), next("re-run the blocked command after the lock is released", "Mutating commands re-read dossier artifacts after acquiring the lock.")],
		exitCode: 2
	});
};
var validateMutationResult = async (root, commandResult) => {
	const artifacts = [...commandResult.created_artifacts, ...commandResult.changed_artifacts];
	for (const artifact of artifacts) {
		const parsed = await readArtifactFile(root, artifact.path);
		const expectedType = expectedArtifactType(artifact.path);
		if (expectedType !== null && parsed.frontmatter.artifact_type !== expectedType) throw new BlockedError(`Post-write validation failed for ${artifact.path}: expected artifact_type ${expectedType}, got ${displayValue(parsed.frontmatter.artifact_type)}.`);
	}
};
var withMutationEnvelope = async (ctx, command, operation, rootOverride) => {
	const root = rootOverride ?? discoverRoot(ctx.cwd, value(command, "root"), command.words.join(" "));
	let release;
	try {
		release = await acquireDossierWriteLock(root, command.raw, ctx.now());
		const commandResult = await operation();
		await validateMutationResult(root, commandResult);
		return commandResult;
	} catch (error) {
		if (error instanceof DossierWriteLockConflictError) return lockConflictResult(command, error.conflict);
		throw error;
	} finally {
		if (release !== void 0) await release();
	}
};
var dispatchCommand = async (ctx, command) => {
	const [head, second, third] = command.words;
	if (head === "init") return init(ctx, command);
	if (head === "status") return status(ctx, command);
	if (head === "attention") return attention(ctx, command);
	if (head === "queue") return queue(ctx, command);
	if (head === "next") return nextForWork(ctx, command);
	if (head === "lint") return lint(ctx, command);
	if (head === "repair" && second === "frontmatter") return repairFrontmatter(ctx, command);
	if (head === "source" && second === "add") return sourceAdd(ctx, command);
	if (head === "source" && second === "list") return sourceList(ctx, command);
	if (head === "source" && second === "refresh") return sourceRefresh(ctx, command);
	if (head === "source" && second === "impact") return sourceImpact(ctx, command);
	if (head === "source" && second === "review" && third === "resolve") return sourceReviewResolve(ctx, command);
	if (head === "capability" && second === "create") return capabilityCreate(ctx, command);
	if (head === "capability" && second === "claim" && third === "set") return capabilityClaimSet(ctx, command);
	if (head === "capability" && second === "anti-claim" && third === "add") return capabilityAntiClaimAdd(ctx, command);
	if (head === "capability" && second === "demo" && third === "record") return capabilityDemoRecord(ctx, command);
	if (head === "capability" && second === "check") return capabilityCheck(ctx, command);
	if (head === "baseline" && second === "create") return baselineCreate(ctx, command);
	if (head === "baseline" && second === "capability" && third === "add") return baselineCapabilityAdd(ctx, command);
	if (head === "guardrail" && second === "add") return guardrailAdd(ctx, command);
	if (head === "guardrail" && second === "check") return guardrailCheck(ctx, command);
	if (head === "guardrail" && second === "resolve") return guardrailResolve(ctx, command);
	if (head === "work" && second === "create") return workCreate(ctx, command);
	if (head === "work" && second === "acceptance" && third === "add") return workAcceptanceAdd(ctx, command);
	if (head === "work" && second === "demo" && third === "set") return workDemoSet(ctx, command);
	if (head === "work" && second === "anti-claim" && third === "add") return workAntiClaimAdd(ctx, command);
	if (head === "work" && second === "challenge" && third === "record") return workChallengeRecord(ctx, command);
	if (head === "work" && second === "support" && third === "explain") return workSupportExplain(ctx, command);
	if (head === "work" && second === "dependency" && third === "add") return workDependencyAdd(ctx, command);
	if (head === "work" && second === "dependency" && third === "remove") return workDependencyRemove(ctx, command);
	if (head === "work" && second === "blocker" && third === "add") return workBlockerAdd(ctx, command);
	if (head === "work" && second === "blocker" && third === "resolve") return workBlockerResolve(ctx, command);
	if (head === "work" && second === "risk" && third === "set") return workRiskSet(ctx, command);
	if (head === "work" && second === "retire") return workRetire(ctx, command);
	if (head === "work" && second === "amend") return genericBlocked(command, "work amend requires structured change fields; this runtime does not infer semantic changes from summary only.");
	if (head === "work" && second === "split") return workSplit(ctx, command);
	if (head === "stage" && second === "start") return stageTransition(ctx, command, "start");
	if (head === "stage" && second === "ready") return stageTransition(ctx, command, "ready");
	if (head === "stage" && second === "close") return stageTransition(ctx, command, "close");
	if (head === "stage" && second === "reopen") return stageTransition(ctx, command, "reopen");
	if (head === "stage" && second === "log") return stageLog(ctx, command);
	if (head === "verify" && second === "required") return verifyRequired(ctx, command);
	if (head === "verify" && second === "run") return verifyRun(ctx, command);
	if (head === "verify" && second === "record") return verifyRecord(ctx, command);
	if (head === "review" && second === "required") return reviewRequired(ctx, command);
	if (head === "review" && second === "record") return reviewRecord(ctx, command);
	if (head === "hygiene" && second === "run") return hygieneRun(ctx, command);
	if (head === "changeset" && second === "create") return changesetCreate(ctx, command);
	if (head === "report" && second === "create") return reportCreate(ctx, command);
	if (head === "retro" && second === "create") return retroCreate(ctx, command);
	throw new UsageError(`Unknown command: ${command.words.join(" ")}`);
};
var runCommand = async (ctx, command) => {
	if (commandMutationMode(command) === "locked") return withMutationEnvelope(ctx, command, () => dispatchCommand(ctx, command));
	return dispatchCommand(ctx, command);
};
var genericBlocked = (command, blocker) => result(command, {
	result: "blocked",
	blockers: [blocker],
	next_actions: [next("dossier-engineer help", "Review supported runtime command grammar.")],
	exitCode: 2
});
var init = async (ctx, command) => {
	const root = discoverRoot(ctx.cwd, value(command, "root"), "init");
	const projectName = requireValue(command, "project-name");
	const reviewMode = value(command, "review-mode") ?? "risk_weighted";
	if (![
		"risk_weighted",
		"strict",
		"custom"
	].includes(reviewMode)) throw new UsageError("Invalid --review-mode. Expected risk_weighted, strict, or custom.");
	await ensureDossierDirs(root);
	const projectPath = `${DOSSIER_DIR}/project.md`;
	if (existsSync(path.join(root, projectPath)) && !hasFlag(command, "force")) throw new BlockedError("Dossier project already exists. Use --force only to intentionally rewrite project metadata.");
	const now = isoNow(ctx.now());
	const gitignoreChanged = await ensureRuntimeDirectoryIgnored(root);
	const projectId = makeId(root, "PRJ", projectName, ctx.randomHex, () => projectPath, ctx.now());
	await writeArtifactFile(root, projectPath, {
		artifact_type: "dossier_project",
		schema_version: "2.2",
		project_id: projectId,
		project_name: projectName,
		review_mode: reviewMode,
		capability_policy: {
			require_concept_for_capabilities: true,
			require_behavioral_demo_for_capability_closure: true,
			require_anti_claim_for_capability_spec: true,
			require_challenge_before_implementation: true
		},
		created_at: now,
		updated_at: now,
		verification_profiles: {
			default: { commands: [] },
			"behavioral-demo": { commands: [] }
		},
		review_policy: {
			capability_requires: ["concept-conformance-reviewer", "spec-conformance-reviewer"],
			code_requires: ["code-reviewer"],
			risk_requires: { security: ["security-reviewer"] }
		},
		guardrail_defaults: { max_closed_support_without_recent_demo: 5 }
	}, body(projectName, ["Purpose", "Dossier operating notes"]));
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: projectPath,
			artifact_type: "dossier_project",
			id: projectId
		}],
		warnings: gitignoreChanged ? ["Updated .gitignore to ignore .dossier-runtime/."] : [],
		next_actions: [next("dossier-engineer source add --path <path> --kind concept --authority canonical --title \"<product concept>\"", "Register the concept source before creating capabilities."), next("dossier-engineer baseline create --title \"Existing product baseline\" --mode existing-project --source <source-id>", "Use this when onboarding an already working project.")]
	});
};
var status = async (ctx, command) => {
	const { artifacts, parseErrors } = await loadRootArtifacts(ctx, command);
	const capabilities = findArtifactsByType(artifacts, "capability");
	const workItems = findArtifactsByType(artifacts, "work_item");
	const sourceReviews = findArtifactsByType(artifacts, "source_review");
	const guardrails = findArtifactsByType(artifacts, "guardrail");
	const capabilitySummary = /* @__PURE__ */ new Map();
	const lifecycleSummary = /* @__PURE__ */ new Map();
	for (const capability of capabilities) {
		const key = displayValue(capability.frontmatter.status, "unknown");
		capabilitySummary.set(key, (capabilitySummary.get(key) ?? 0) + 1);
	}
	for (const work of workItems) {
		const key = displayValue(work.frontmatter.lifecycle, "unknown");
		lifecycleSummary.set(key, (lifecycleSummary.get(key) ?? 0) + 1);
	}
	const closureViolations = workItems.flatMap((work) => closureFindings(work, artifacts));
	const summary = [
		`Artifacts: ${artifacts.length}`,
		`Capabilities: ${[...capabilitySummary.entries()].map(([key, count]) => `${key}=${count}`).join(", ") || "none"}`,
		`Work items: ${[...lifecycleSummary.entries()].map(([key, count]) => `${key}=${count}`).join(", ") || "none"}`,
		`Open source reviews: ${sourceReviews.filter((review) => review.frontmatter.status === "open").length}`,
		`Triggered guardrails: ${guardrails.filter((guardrail) => guardrail.frontmatter.status === "triggered").length}`,
		`Closure violations: ${closureViolations.length}`
	];
	return result(command, {
		result: parseErrors.length === 0 && closureViolations.length === 0 ? "success" : "blocked",
		summary,
		findings: [...parseErrors, ...closureViolations],
		blockers: parseErrors.length > 0 ? ["Invalid artifact frontmatter exists."] : [],
		next_actions: [next("dossier-engineer attention --root .", "Inspect prioritized blockers."), next("dossier-engineer queue --root .", "Inspect execution-ready work.")],
		exitCode: parseErrors.length === 0 && closureViolations.length === 0 ? 0 : 2
	});
};
var attention = async (ctx, command) => {
	const { artifacts, parseErrors } = await loadRootArtifacts(ctx, command);
	const findings = [
		...parseErrors.map((entry) => `invalid artifact: ${entry}`),
		...findArtifactsByType(artifacts, "guardrail").filter((artifact) => artifact.frontmatter.status === "triggered").map((artifact) => `triggered guardrail: ${artifactId(artifact)}`),
		...findArtifactsByType(artifacts, "source_review").filter((artifact) => artifact.frontmatter.status === "open").map((artifact) => `open source review: ${artifactId(artifact)} for ${displayValue(artifact.frontmatter.source_id)}`),
		...findArtifactsByType(artifacts, "capability").filter((artifact) => artifact.frontmatter.status === "existing" && (artifact.frontmatter.demo_evidence ?? []).length === 0).map((artifact) => `existing capability without demo evidence: ${artifactId(artifact)}`),
		...findArtifactsByType(artifacts, "work_item").flatMap((artifact) => closureFindings(artifact, artifacts))
	];
	return result(command, {
		result: findings.length === 0 ? "success" : "blocked",
		findings: findings.length === 0 ? ["No attention items."] : findings,
		next_actions: [findings.length === 0 ? next("dossier-engineer queue --root .", "Select the next ready work item.") : next("dossier-engineer lint --root .", "Validate structural issues before continuing.")],
		exitCode: findings.length === 0 ? 0 : 2
	});
};
var protocolActionForWork = (work) => {
	if (handoffComplete(work)) return {
		nextAction: "none",
		stage: "terminal",
		implementationReady: false
	};
	if (work.frontmatter.lifecycle === "implemented") return {
		nextAction: "run_hygiene",
		stage: "implementation",
		implementationReady: false
	};
	const state = work.frontmatter.stage_state;
	for (const stage of STAGES.filter((entry) => entry !== "change-proposal")) {
		if (state[stage] === "ready_for_close") return {
			nextAction: "close_stage",
			stage,
			implementationReady: stage === "implementation"
		};
		if (state[stage] === "in_progress") return {
			nextAction: "mark_stage_ready",
			stage,
			implementationReady: stage === "implementation"
		};
		if (state[stage] !== "closed") return {
			nextAction: "start_stage",
			stage,
			implementationReady: stage === "implementation"
		};
	}
	return {
		nextAction: "run_hygiene",
		stage: "implementation",
		implementationReady: false
	};
};
var queue = async (ctx, command) => {
	const { artifacts } = await loadRootArtifacts(ctx, command);
	const area = value(command, "area");
	const owner = value(command, "owner");
	const sourceReviews = findArtifactsByType(artifacts, "source_review");
	const guardrailTriggered = findArtifactsByType(artifacts, "guardrail").some((entry) => entry.frontmatter.status === "triggered");
	const closed = new Set(findArtifactsByType(artifacts, "work_item").filter((work) => handoffComplete(work)).map((work) => String(work.frontmatter.id)));
	const actionable = [];
	const blocked = [];
	for (const work of findArtifactsByType(artifacts, "work_item")) {
		if (handoffComplete(work) || work.frontmatter.lifecycle === "retired") continue;
		if (area !== void 0 && !(work.frontmatter.area ?? []).includes(area)) continue;
		if (owner !== void 0 && !(work.frontmatter.owners ?? []).includes(owner)) continue;
		const dependencies = work.frontmatter.dependencies ?? [];
		const blockers = [...openBlockers(work).map((entry) => `${artifactId(work)}: open blocker ${displayValue(entry.id)}`), ...dependencies.filter((dep) => !closed.has(String(dep))).map((dep) => `${artifactId(work)}: dependency not closed ${displayValue(dep)}`)];
		if (sourceReviewOpenForWork(work, sourceReviews)) blockers.push(`${artifactId(work)}: linked source review is open.`);
		if (guardrailTriggered) blockers.push(`${artifactId(work)}: triggered guardrail exists.`);
		if (blockers.length === 0) {
			const action = protocolActionForWork(work);
			if (action.nextAction !== "none") actionable.push(`${artifactId(work)} | next_action=${action.nextAction} | stage=${action.stage} | implementation_ready=${String(action.implementationReady)}`);
		} else blocked.push(...blockers);
	}
	return result(command, {
		result: "success",
		summary: [`Next actionable work: ${actionable.length}`, ...actionable.map((entry) => `- ${entry}`)],
		findings: blocked,
		next_actions: actionable.length > 0 ? [next(`dossier-engineer next --work ${actionable[0]?.split(" | ")[0]}`, "Inspect the next safe action before treating any queued item as implementation-ready.")] : [next("dossier-engineer attention --root .", "Resolve blockers before selecting work.")]
	});
};
var nextForWork = async (ctx, command) => {
	const workId = requireValue(command, "work");
	const { artifacts } = await loadRootArtifacts(ctx, command);
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	if (handoffComplete(work)) return result(command, {
		result: "success",
		summary: [`${workId}: terminal closed/handoff-complete.`],
		next_actions: [next("dossier-engineer changeset create --scope current-branch --summary \"<branch summary>\"", "Optional handoff evidence; no required work-item action remains.")]
	});
	const findings = closureFindings(work, artifacts);
	if (findings.length > 0) return result(command, {
		result: "blocked",
		findings,
		next_actions: [next(`dossier-engineer capability check --work ${workId}`, "Inspect missing capability gates.")],
		exitCode: 2
	});
	if (work.frontmatter.lifecycle === "implemented") return result(command, {
		result: "success",
		next_actions: [next(`dossier-engineer hygiene run --work ${workId} --stage implementation`, "Run post-close hygiene exactly once after implementation closure.")]
	});
	const state = work.frontmatter.stage_state;
	for (const stage of STAGES.filter((entry) => entry !== "change-proposal")) {
		if (state[stage] === "ready_for_close") return result(command, {
			result: "success",
			next_actions: [next(`dossier-engineer stage close --work ${workId} --stage ${stage}`, "Close the ready stage.")]
		});
		if (state[stage] === "in_progress") return result(command, {
			result: "success",
			next_actions: [next(`dossier-engineer stage ready --work ${workId} --stage ${stage} --summary "<result>"`, "Mark the active stage ready once evidence is recorded.")]
		});
		if (state[stage] !== "closed") return result(command, {
			result: "success",
			next_actions: [next(`dossier-engineer stage start --work ${workId} --stage ${stage} --session <session-id>`, "Start the next required stage.")]
		});
	}
	return result(command, {
		result: "success",
		next_actions: [next(`dossier-engineer hygiene run --work ${workId} --stage implementation`, "Run post-close hygiene after implementation closure.")]
	});
};
var lint = async (ctx, command) => {
	const root = discoverRoot(ctx.cwd, value(command, "root"), "lint");
	const parseErrors = [];
	const artifacts = [];
	const pathFilter = value(command, "path");
	if (pathFilter !== void 0) try {
		artifacts.push(await readArtifactFile(root, toPosix(pathFilter)));
	} catch (error) {
		parseErrors.push(`${pathFilter}: ${error instanceof Error ? error.message : String(error)}`);
	}
	else {
		const loaded = await loadArtifacts(root);
		parseErrors.push(...loaded.parseErrors);
		artifacts.push(...loaded.artifacts);
	}
	const findings = [...parseErrors];
	for (const forbidden of [
		".dossier/state.json",
		"docs/dossier/state.json",
		"docs/dossier/index.json"
	]) if (existsSync(path.resolve(root, forbidden))) findings.push(`Forbidden canonical state file exists: ${forbidden}`);
	const sourceIds = new Set(findArtifactsByType(artifacts, "source").map((entry) => String(entry.frontmatter.id)));
	const capabilityIds = new Set(findArtifactsByType(artifacts, "capability").map((entry) => String(entry.frontmatter.id)));
	const workIds = new Set(findArtifactsByType(artifacts, "work_item").map((entry) => String(entry.frontmatter.id)));
	for (const artifact of artifacts) {
		const expected = expectedArtifactType(artifact.path);
		if (expected !== null && artifact.frontmatter.artifact_type !== expected) findings.push(`${artifact.path}: artifact_type should be ${expected}.`);
		if (artifact.frontmatter.schema_version !== "2.2") findings.push(`${artifact.path}: schema_version should be "2.2".`);
		const id = artifact.frontmatter.id ?? artifact.frontmatter.project_id;
		if (expected !== "dossier_project" && typeof id === "string" && !artifact.path.endsWith(`${id}.md`)) findings.push(`${artifact.path}: filename must match id ${id}.`);
		if (artifact.frontmatter.artifact_type === "capability") {
			for (const ref of artifact.frontmatter.source_refs ?? []) if (!sourceIds.has(String(ref.source_id))) findings.push(`${artifactId(artifact)}: missing source ref ${displayValue(ref.source_id)}.`);
			const claim = artifact.frontmatter.claim;
			if (artifact.frontmatter.status !== "retired" && [
				"actor",
				"trigger",
				"observable_behavior",
				"system_response",
				"state_change",
				"continuity"
			].some((key) => typeof claim?.[key] !== "string" || String(claim[key]).trim() === "")) findings.push(`${artifactId(artifact)}: capability claim is incomplete.`);
			if (artifact.frontmatter.status === "existing" && (artifact.frontmatter.demo_evidence ?? []).length === 0) findings.push(`${artifactId(artifact)}: existing capability lacks pass demo evidence or observed baseline.`);
		}
		if (artifact.frontmatter.artifact_type === "work_item") {
			for (const ref of artifact.frontmatter.source_refs ?? []) if (!sourceIds.has(String(ref.source_id))) findings.push(`${artifactId(artifact)}: missing source ref ${displayValue(ref.source_id)}.`);
			const delivery = artifact.frontmatter.delivery;
			for (const ref of delivery?.capability_refs ?? []) if (!capabilityIds.has(String(ref.capability_id))) findings.push(`${artifactId(artifact)}: missing capability ref ${displayValue(ref.capability_id)}.`);
			for (const dependency of artifact.frontmatter.dependencies ?? []) if (!workIds.has(String(dependency))) findings.push(`${artifactId(artifact)}: missing dependency ${displayValue(dependency)}.`);
			findings.push(...closureFindings(artifact, artifacts));
		}
	}
	return result(command, {
		result: findings.length === 0 ? "success" : "blocked",
		findings: findings.length === 0 ? ["No lint findings."] : findings,
		blockers: findings.length === 0 ? [] : ["Dossier lint found errors."],
		next_actions: findings.length === 0 ? [next("dossier-engineer status --root .", "Review derived readiness after validation.")] : [next("dossier-engineer repair frontmatter --path <artifact-path> --type <artifact-type>", "Repair machine-owned frontmatter only when semantics are inferable.")],
		exitCode: findings.length === 0 ? 0 : 3
	});
};
var repairFrontmatter = async (ctx, command) => {
	const root = discoverRoot(ctx.cwd, value(command, "root"), "repair frontmatter");
	const targetPath = requireValue(command, "path");
	const type = requireValue(command, "type");
	if (!existsSync(path.resolve(root, targetPath))) throw new UsageError(`Artifact path does not exist: ${targetPath}`);
	let artifact;
	try {
		artifact = await readArtifactFile(root, targetPath);
	} catch {
		throw new BlockedError("Cannot safely repair missing or invalid frontmatter without risking semantic loss.");
	}
	if (artifact.frontmatter.artifact_type !== type) {
		const updated = {
			...artifact.frontmatter,
			artifact_type: type,
			schema_version: "2.2"
		};
		await writeArtifactFile(root, artifact.path, updated, artifact.body);
		return result(command, {
			result: "success",
			changed_artifacts: [{
				path: artifact.path,
				artifact_type: type,
				id: displayValue(updated.id ?? updated.project_id)
			}],
			warnings: ["Only safe machine metadata was repaired; semantic fields were not invented."],
			next_actions: [next(`dossier-engineer lint --path ${artifact.path}`, "Validate the repaired artifact.")]
		});
	}
	return result(command, {
		result: "success",
		summary: ["No repair needed."],
		next_actions: [next(`dossier-engineer lint --path ${artifact.path}`, "Validate the artifact.")]
	});
};
var sourceAdd = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const sourcePath = requireValue(command, "path");
	const kind = requireEnum(command, "kind", SOURCE_KINDS);
	const authority = requireEnum(command, "authority", AUTHORITIES);
	const title = requireValue(command, "title");
	const duplicate = findArtifactsByType(artifacts, "source").find((artifact) => artifact.frontmatter.source_path === sourcePath);
	if (duplicate !== void 0 && !hasFlag(command, "allow-duplicate")) return result(command, {
		result: "blocked",
		warnings: [`Source path already registered: ${artifactId(duplicate)}`],
		blockers: ["Duplicate source path. Use --allow-duplicate only when intentional."],
		next_actions: [next("dossier-engineer source list --root .", "Inspect registered sources.")],
		exitCode: 2
	});
	const absoluteSourcePath = path.resolve(root, sourcePath);
	let hash = null;
	if (isUrlLike(sourcePath)) {
		if (kind !== "external-reference") throw new UsageError("URL-like source paths require --kind external-reference.");
	} else {
		if (!await localPathExists(absoluteSourcePath)) throw new UsageError(`Source file does not exist: ${sourcePath}`);
		hash = await hashFile(absoluteSourcePath);
	}
	const now = isoNow(ctx.now());
	const id = makeId(root, "SRC", title, ctx.randomHex, (candidate) => artifactPath("source", candidate), ctx.now());
	const frontmatter = {
		artifact_type: "source",
		schema_version: "2.2",
		id,
		title,
		source_path: sourcePath,
		source_kind: kind,
		authority,
		content_hash: {
			algorithm: "sha256",
			value: hash
		},
		registered_at: now,
		changed_at: null,
		status: "active",
		tags: values(command, "tag")
	};
	const relativePath = artifactPath("source", id);
	await writeArtifactFile(root, relativePath, frontmatter, body(title, [
		"Summary",
		"Source interpretation",
		"Notes"
	]));
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "source",
			id
		}],
		next_actions: [next(`dossier-engineer capability create --title "<capability>" --status intended --source ${id}`, "Map an observable capability to this source."), next("dossier-engineer source refresh --root .", "Refresh sources after source files change.")]
	});
};
var sourceList = async (ctx, command) => {
	const { artifacts } = await loadRootArtifacts(ctx, command);
	const statusFilter = value(command, "status");
	const kindFilter = value(command, "kind");
	const findings = findArtifactsByType(artifacts, "source").filter((source) => statusFilter === void 0 || source.frontmatter.status === statusFilter).filter((source) => kindFilter === void 0 || source.frontmatter.source_kind === kindFilter).map((source) => `${artifactId(source)} ${displayValue(source.frontmatter.source_kind)} ${displayValue(source.frontmatter.authority)} ${displayValue(source.frontmatter.source_path)}`);
	return result(command, {
		result: "success",
		summary: findings.length === 0 ? ["No sources."] : findings,
		next_actions: [next("dossier-engineer source refresh --root .", "Check for changed source hashes.")]
	});
};
var impactedBySource = (sourceId, artifacts) => {
	const capabilities = findArtifactsByType(artifacts, "capability").filter((capability) => (capability.frontmatter.source_refs ?? []).some((ref) => ref.source_id === sourceId));
	const capabilityIds = new Set(capabilities.map((capability) => String(capability.frontmatter.id)));
	return {
		capabilities,
		workItems: findArtifactsByType(artifacts, "work_item").filter((work) => {
			const direct = (work.frontmatter.source_refs ?? []).some((ref) => ref.source_id === sourceId);
			const viaCapability = (work.frontmatter.delivery?.capability_refs ?? []).some((ref) => capabilityIds.has(String(ref.capability_id)));
			return direct || viaCapability;
		})
	};
};
var sourceRefresh = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const sourceId = value(command, "source");
	const sources = findArtifactsByType(artifacts, "source").filter((source) => sourceId === void 0 || source.frontmatter.id === sourceId);
	if (sourceId !== void 0 && sources.length === 0) throw new UsageError(`Source not found: ${sourceId}`);
	const changed = [];
	const created = [];
	const warnings = [];
	const now = isoNow(ctx.now());
	for (const source of sources) {
		const sourcePath = String(source.frontmatter.source_path);
		if (isUrlLike(sourcePath)) continue;
		const absolute = path.resolve(root, sourcePath);
		if (!await localPathExists(absolute)) {
			if (hasFlag(command, "record-missing")) {
				const updated = await updateArtifact(root, source, {
					...source.frontmatter,
					status: "missing"
				}, now);
				changed.push(updated);
			} else warnings.push(`${artifactId(source)}: missing local source ${sourcePath}`);
			continue;
		}
		const currentHash = await hashFile(absolute);
		const contentHash = source.frontmatter.content_hash;
		if (contentHash?.value === currentHash) continue;
		const previousHash = typeof contentHash?.value === "string" ? contentHash.value : null;
		const updated = await updateArtifact(root, source, {
			...source.frontmatter,
			content_hash: {
				algorithm: "sha256",
				value: currentHash
			},
			changed_at: now,
			status: "active"
		}, now);
		changed.push(updated);
		if (previousHash !== null) {
			const impact = impactedBySource(String(source.frontmatter.id), artifacts);
			const srId = makeId(root, "SR", `${displayValue(source.frontmatter.title)} review`, ctx.randomHex, (candidate) => artifactPath("source-review", candidate), ctx.now());
			const reviewPath = artifactPath("source-review", srId);
			await writeArtifactFile(root, reviewPath, {
				artifact_type: "source_review",
				schema_version: "2.2",
				id: srId,
				source_id: source.frontmatter.id,
				previous_hash: previousHash,
				current_hash: currentHash,
				status: "open",
				opened_at: now,
				resolved_at: null,
				verdict: null,
				impacted_capabilities: impact.capabilities.map((entry) => entry.frontmatter.id),
				impacted_work_items: impact.workItems.map((entry) => entry.frontmatter.id)
			}, body(`Source review ${srId}`, [
				"Change summary",
				"Backlog impact",
				"Resolution notes"
			]));
			created.push({
				path: reviewPath,
				artifact_type: "source_review",
				id: srId
			});
		}
	}
	return result(command, {
		result: warnings.length > 0 ? "blocked" : "success",
		changed_artifacts: changed.map(artifactInfo),
		created_artifacts: created,
		warnings,
		blockers: warnings.length > 0 ? ["Missing sources were detected."] : [],
		next_actions: created.length > 0 ? [next("dossier-engineer attention --root .", "Resolve opened source reviews before linked work is ready.")] : [next("dossier-engineer status --root .", "Review current readiness.")],
		exitCode: warnings.length > 0 ? 2 : 0
	});
};
var sourceImpact = async (ctx, command) => {
	const { artifacts } = await loadRootArtifacts(ctx, command);
	const sourceId = requireValue(command, "source");
	const source = findArtifactById(artifacts, sourceId);
	if (source === void 0 || source.frontmatter.artifact_type !== "source") throw new UsageError(`Source not found: ${sourceId}`);
	const impact = impactedBySource(sourceId, artifacts);
	return result(command, {
		result: "success",
		summary: [
			`Source: ${sourceId}`,
			`Impacted capabilities: ${impact.capabilities.map((entry) => entry.frontmatter.id).join(", ") || "none"}`,
			`Impacted work items: ${impact.workItems.map((entry) => entry.frontmatter.id).join(", ") || "none"}`
		],
		next_actions: [next("dossier-engineer source refresh --source <source-id>", "Refresh hash and create a source review if content changed.")]
	});
};
var sourceReviewResolve = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const reviewId = requireValue(command, "review");
	const verdict = requireEnum(command, "verdict", SOURCE_REVIEW_VERDICTS);
	const summary = requireValue(command, "summary");
	const review = findArtifactById(artifacts, reviewId);
	if (review === void 0 || review.frontmatter.artifact_type !== "source_review") throw new UsageError(`Source review not found: ${reviewId}`);
	if (!["open", "blocked"].includes(String(review.frontmatter.status))) throw new UsageError(`Source review is not open or blocked: ${reviewId}`);
	const now = isoNow(ctx.now());
	const updated = await updateArtifact(root, review, {
		...review.frontmatter,
		status: verdict === "blocked_pending_decision" ? "blocked" : "resolved",
		verdict,
		resolved_at: verdict === "blocked_pending_decision" ? null : now
	}, now);
	return result(command, {
		result: verdict === "blocked_pending_decision" ? "blocked" : "success",
		changed_artifacts: [artifactInfo(updated)],
		blockers: verdict === "blocked_pending_decision" ? [summary] : [],
		next_actions: [next("dossier-engineer queue --root .", "Recompute ready work after source-review resolution.")],
		exitCode: verdict === "blocked_pending_decision" ? 2 : 0
	});
};
var capabilityCreate = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const title = requireValue(command, "title");
	const status = requireEnum(command, "status", CAPABILITY_STATUSES);
	const sourceId = requireValue(command, "source");
	if (!findArtifactById(artifacts, sourceId)) throw new UsageError(`Source not found: ${sourceId}`);
	const now = isoNow(ctx.now());
	const id = makeId(root, "CAP", title, ctx.randomHex, (candidate) => artifactPath("capability", candidate), ctx.now());
	const frontmatter = {
		...newArtifactFrontmatter("capability", id, title, now),
		status,
		source_refs: [sourceRef(sourceId)],
		claim: {
			actor: null,
			trigger: null,
			observable_behavior: null,
			system_response: null,
			state_change: null,
			continuity: null
		},
		anti_claims: [],
		demo_evidence: [],
		owner: value(command, "owner") ?? "agent",
		area: values(command, "area").length > 0 ? values(command, "area") : ["core"]
	};
	const relativePath = artifactPath("capability", id);
	await writeArtifactFile(root, relativePath, frontmatter, body(title, [
		"Summary",
		"Concept interpretation",
		"Observable behavior",
		"Anti-claims",
		"Demonstrations",
		"Notes"
	]));
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "capability",
			id
		}],
		warnings: status === "existing" ? ["Existing capability remains unverified until pass demo or observed baseline evidence is recorded."] : [],
		next_actions: [next(`dossier-engineer capability claim set --capability ${id} --actor "<actor>" --trigger "<trigger>" --behavior "<behavior>" --response "<response>" --state-change "<state/effect>" --continuity "<continuity>"`, "Complete the observable capability claim."), next(`dossier-engineer work create --title "<work>" --type feature --delivery capability --capability ${id} --relation introduces --source ${sourceId} --area core --owner agent`, "Create work only after the capability claim is concrete.")]
	});
};
var capabilityClaimSet = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const id = requireValue(command, "capability");
	const capability = findArtifactById(artifacts, id);
	if (capability === void 0 || capability.frontmatter.artifact_type !== "capability") throw new UsageError(`Capability not found: ${id}`);
	const claim = {
		actor: requireValue(command, "actor"),
		trigger: requireValue(command, "trigger"),
		observable_behavior: requireValue(command, "behavior"),
		system_response: requireValue(command, "response"),
		state_change: requireValue(command, "state-change"),
		continuity: requireValue(command, "continuity")
	};
	const now = isoNow(ctx.now());
	const updated = await updateArtifact(root, capability, {
		...capability.frontmatter,
		claim
	}, now);
	const impactedWork = findArtifactsByType(artifacts, "work_item").filter((work) => (work.frontmatter.delivery?.capability_refs ?? []).some((ref) => ref.capability_id === id));
	const changed = [artifactInfo(updated)];
	for (const work of impactedWork) {
		const updatedWork = await updateArtifact(root, work, recomputeWorkHash(work, artifacts), now);
		changed.push(artifactInfo(updatedWork));
	}
	return result(command, {
		result: "success",
		changed_artifacts: changed,
		next_actions: [next(`dossier-engineer capability anti-claim add --capability ${id} --text "<explicit non-goal>"`, "Record capability-level anti-claims where useful."), next(`dossier-engineer capability demo record --capability ${id} --verdict pass --summary "<observed behavior>" --evidence <path>`, "Record observed demo evidence for existing capabilities.")]
	});
};
var capabilityAntiClaimAdd = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const id = requireValue(command, "capability");
	const text = requireValue(command, "text");
	const capability = findArtifactById(artifacts, id);
	if (capability === void 0 || capability.frontmatter.artifact_type !== "capability") throw new UsageError(`Capability not found: ${id}`);
	const antiClaims = [...new Set([...capability.frontmatter.anti_claims, text])];
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, capability, {
			...capability.frontmatter,
			anti_claims: antiClaims
		}, isoNow(ctx.now())))],
		next_actions: [next("dossier-engineer capability check --root .", "Validate capability governance gates.")]
	});
};
var capabilityDemoRecord = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const id = requireValue(command, "capability");
	const verdict = requireEnum(command, "verdict", VERDICTS);
	const summary = requireValue(command, "summary");
	const evidence = values(command, "evidence");
	const missing = await evidencePathsExist(root, evidence);
	if (missing.length > 0) throw new UsageError(`Evidence path does not exist: ${missing.join(", ")}`);
	const capability = findArtifactById(artifacts, id);
	if (capability === void 0 || capability.frontmatter.artifact_type !== "capability") throw new UsageError(`Capability not found: ${id}`);
	const now = isoNow(ctx.now());
	const demoId = makeId(root, "VER", `${displayValue(capability.frontmatter.title)} demo`, ctx.randomHex, (candidate) => `${DOSSIER_DIR}/_embedded/${candidate}`, ctx.now());
	const demoEvidence = [...capability.frontmatter.demo_evidence ?? [], {
		id: demoId,
		verdict,
		summary,
		evidence: evidence.map((entry) => ({ path: entry })),
		recorded_at: now
	}];
	const updated = await updateArtifact(root, capability, {
		...capability.frontmatter,
		demo_evidence: demoEvidence
	}, now);
	return result(command, {
		result: verdict === "pass" ? "success" : "blocked",
		changed_artifacts: [artifactInfo(updated)],
		blockers: verdict === "pass" ? [] : [`Capability demo verdict is ${verdict}.`],
		next_actions: [next("dossier-engineer capability check --root .", "Re-evaluate capability evidence.")],
		exitCode: verdict === "pass" ? 0 : 2
	});
};
var capabilityCheck = async (ctx, command) => {
	const { artifacts } = await loadRootArtifacts(ctx, command);
	const capabilityFilter = value(command, "capability");
	const workFilter = value(command, "work");
	const findings = [];
	for (const capability of findArtifactsByType(artifacts, "capability").filter((entry) => capabilityFilter === void 0 || entry.frontmatter.id === capabilityFilter)) {
		const claim = capability.frontmatter.claim;
		if (capability.frontmatter.status !== "retired" && [
			"actor",
			"trigger",
			"observable_behavior",
			"system_response",
			"state_change",
			"continuity"
		].some((key) => typeof claim?.[key] !== "string" || String(claim[key]).trim() === "")) findings.push(`${artifactId(capability)}: incomplete observable behavior claim.`);
		if (capability.frontmatter.status === "existing" && (capability.frontmatter.demo_evidence ?? []).filter((entry) => entry.verdict === "pass").length === 0) findings.push(`${artifactId(capability)}: existing capability lacks pass demo evidence.`);
	}
	for (const work of findArtifactsByType(artifacts, "work_item").filter((entry) => workFilter === void 0 || entry.frontmatter.id === workFilter)) {
		findings.push(...workGateFindings(work));
		const stageState = work.frontmatter.stage_state;
		if (isUserVisibleCapabilityWork(work) && (stageState?.implementation === "closed" || work.frontmatter.lifecycle === "implemented") && !liveAppVerificationFresh(work, artifacts)) findings.push(`${artifactId(work)}: user-visible capability implementation lacks fresh live-app behavioral evidence.`);
	}
	return result(command, {
		result: findings.length === 0 ? "success" : "blocked",
		findings: findings.length === 0 ? ["Capability gates pass."] : findings,
		blockers: findings.length === 0 ? [] : ["Capability governance blockers exist."],
		next_actions: findings.length === 0 ? [next("dossier-engineer queue --root .", "Inspect ready work.")] : [next("dossier-engineer next --work <work-id>", "Resolve the next protocol-safe work item action.")],
		exitCode: findings.length === 0 ? 0 : 2
	});
};
var baselineCreate = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const title = requireValue(command, "title");
	const mode = requireEnum(command, "mode", BASELINE_MODES);
	const sourceId = requireValue(command, "source");
	if (!findArtifactById(artifacts, sourceId)) throw new UsageError(`Source not found: ${sourceId}`);
	const now = isoNow(ctx.now());
	const id = makeId(root, "BASE", title, ctx.randomHex, (candidate) => artifactPath("baseline", candidate), ctx.now());
	const frontmatter = {
		...newArtifactFrontmatter("baseline", id, title, now),
		mode,
		source_refs: [sourceId],
		capabilities: []
	};
	const relativePath = artifactPath("baseline", id);
	await writeArtifactFile(root, relativePath, frontmatter, body(title, [
		"Scope",
		"Observed capabilities",
		"Assumed or unverified capabilities",
		"Evidence notes",
		"Gaps"
	]));
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "baseline",
			id
		}],
		next_actions: [next(`dossier-engineer baseline capability add --baseline ${id} --capability <capability-id> --status observed --evidence <path>`, "Attach observed existing capabilities to this baseline.")]
	});
};
var baselineCapabilityAdd = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const baselineId = requireValue(command, "baseline");
	const capabilityId = requireValue(command, "capability");
	const status = requireEnum(command, "status", BASELINE_STATUSES);
	const evidence = values(command, "evidence");
	const missing = await evidencePathsExist(root, evidence);
	if (missing.length > 0) throw new UsageError(`Evidence path does not exist: ${missing.join(", ")}`);
	const baseline = findArtifactById(artifacts, baselineId);
	const capability = findArtifactById(artifacts, capabilityId);
	if (baseline === void 0 || baseline.frontmatter.artifact_type !== "baseline") throw new UsageError(`Baseline not found: ${baselineId}`);
	if (capability === void 0 || capability.frontmatter.artifact_type !== "capability") throw new UsageError(`Capability not found: ${capabilityId}`);
	const capabilityHasPassDemo = (capability.frontmatter.demo_evidence ?? []).some((entry) => entry.verdict === "pass");
	if (status === "observed" && evidence.length === 0 && !capabilityHasPassDemo) throw new BlockedError("Observed baseline membership requires evidence path or pass capability demo.");
	const now = isoNow(ctx.now());
	const membership = {
		capability_id: capabilityId,
		status,
		evidence,
		added_at: now,
		notes: value(command, "notes") ?? null
	};
	const existing = (baseline.frontmatter.capabilities ?? []).filter((entry) => entry.capability_id !== capabilityId);
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, baseline, {
			...baseline.frontmatter,
			capabilities: [...existing, membership]
		}, now))],
		next_actions: [next("dossier-engineer capability check --root .", "Validate existing capability evidence after baseline update.")]
	});
};
var guardrailAdd = async (ctx, command) => {
	const { root } = await loadRootArtifacts(ctx, command);
	const title = requireValue(command, "title");
	const now = isoNow(ctx.now());
	const id = makeId(root, "KILL", title, ctx.randomHex, (candidate) => artifactPath("guardrail", candidate), ctx.now());
	const frontmatter = {
		...newArtifactFrontmatter("guardrail", id, title, now),
		condition: requireValue(command, "condition"),
		action: requireValue(command, "action"),
		status: "active",
		scope: {
			areas: values(command, "area"),
			capability_ids: values(command, "capability")
		},
		triggered_at: null,
		resolved_at: null,
		resolution: null
	};
	const relativePath = artifactPath("guardrail", id);
	await writeArtifactFile(root, relativePath, frontmatter, body(title, [
		"Intent",
		"Trigger interpretation",
		"Required action",
		"Resolution history"
	]));
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "guardrail",
			id
		}],
		next_actions: [next("dossier-engineer guardrail check --root .", "Evaluate active guardrails.")]
	});
};
var guardrailCheck = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const guardrailId = value(command, "guardrail");
	const findings = [];
	const changed = [];
	const now = isoNow(ctx.now());
	for (const guardrail of findArtifactsByType(artifacts, "guardrail").filter((entry) => guardrailId === void 0 || entry.frontmatter.id === guardrailId)) {
		if (guardrail.frontmatter.status === "triggered") {
			findings.push(`${artifactId(guardrail)}: already triggered.`);
			continue;
		}
		if (guardrail.frontmatter.status !== "active") continue;
		findings.push(`${artifactId(guardrail)}: needs_manual_evaluation: ${displayValue(guardrail.frontmatter.condition)}`);
		if (hasFlag(command, "record")) changed.push(await updateArtifact(root, guardrail, {
			...guardrail.frontmatter,
			status: "triggered",
			triggered_at: now
		}, now));
	}
	return result(command, {
		result: findings.length === 0 ? "success" : "blocked",
		findings: findings.length === 0 ? ["No active guardrail findings."] : findings,
		changed_artifacts: changed.map(artifactInfo),
		blockers: findings.length === 0 ? [] : ["Guardrail evaluation requires action or manual decision."],
		next_actions: findings.length === 0 ? [next("dossier-engineer queue --root .", "Continue with ready work.")] : [next("dossier-engineer guardrail resolve --guardrail <guardrail-id> --summary \"<resolution>\"", "Resolve triggered or manually evaluated guardrails.")],
		exitCode: findings.length === 0 ? 0 : 2
	});
};
var guardrailResolve = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const id = requireValue(command, "guardrail");
	const summary = requireValue(command, "summary");
	const evidence = values(command, "evidence");
	const missing = await evidencePathsExist(root, evidence);
	if (missing.length > 0) throw new UsageError(`Evidence path does not exist: ${missing.join(", ")}`);
	const guardrail = findArtifactById(artifacts, id);
	if (guardrail === void 0 || guardrail.frontmatter.artifact_type !== "guardrail") throw new UsageError(`Guardrail not found: ${id}`);
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, guardrail, {
			...guardrail.frontmatter,
			status: "resolved",
			resolved_at: isoNow(ctx.now()),
			resolution: {
				summary,
				evidence
			}
		}, isoNow(ctx.now())))],
		next_actions: [next("dossier-engineer queue --root .", "Recompute queue after guardrail resolution.")]
	});
};
var workCreate = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const title = requireValue(command, "title");
	const type = requireEnum(command, "type", WORK_TYPES);
	const delivery = requireEnum(command, "delivery", DELIVERY_KINDS);
	const sourceId = requireValue(command, "source");
	const area = requireValue(command, "area");
	const owner = requireValue(command, "owner");
	const capabilityId = value(command, "capability");
	const relation = value(command, "relation");
	if (!findArtifactById(artifacts, sourceId)) throw new UsageError(`Source not found: ${sourceId}`);
	if (capabilityId !== void 0 && !findArtifactById(artifacts, capabilityId)) throw new UsageError(`Capability not found: ${capabilityId}`);
	if (delivery === "capability" && capabilityId === void 0) throw new UsageError("Capability delivery requires --capability.");
	if (delivery === "capability" && !["introduces", "extends"].includes(String(relation))) throw new UsageError("Capability delivery requires --relation introduces|extends.");
	if (delivery === "maintenance" && relation !== "maintains") throw new UsageError("Maintenance delivery requires --relation maintains.");
	if (relation !== void 0 && !isOneOf(relation, RELATIONS)) throw new UsageError(`Invalid --relation: ${relation}.`);
	const capabilityRefs = capabilityId === void 0 ? [] : [{
		capability_id: capabilityId,
		relation: relation ?? (delivery === "support" ? "supports" : "introduces")
	}];
	const now = isoNow(ctx.now());
	const id = makeId(root, "WI", title, ctx.randomHex, (candidate) => artifactPath("work", candidate), ctx.now());
	const frontmatter = {
		...newArtifactFrontmatter("work_item", id, title, now),
		type,
		lifecycle: "defined",
		owners: [owner],
		area: [area],
		source_refs: [sourceRef(sourceId)],
		delivery: {
			kind: delivery,
			capability_refs: capabilityRefs,
			support_reason: null
		},
		acceptance: {
			criteria: [],
			coverage_gate: "open"
		},
		demonstration: {
			name: null,
			scenario: null,
			falsifiers: []
		},
		anti_claims: [],
		challenge: {
			recorded: false,
			latest_event_id: null
		},
		risk: {
			implementation: [],
			policy: []
		},
		review_policy: "risk_weighted",
		dependencies: [],
		blocks: [],
		blockers: [],
		stage_state: {
			"feature-intake": "not_started",
			"spec-compact": "not_started",
			"plan-slice": "not_started",
			implementation: "not_started",
			"change-proposal": "not_started"
		},
		post_close_hygiene: { implementation: "not_started" },
		material_scope_hash: null,
		priority: value(command, "priority") ?? "normal"
	};
	const bodyText = workItemBody(title, delivery);
	const withHash = {
		...frontmatter,
		material_scope_hash: materialWorkHash({
			body: bodyText,
			frontmatter
		}, findArtifactsByType(artifacts, "capability"), findArtifactsByType(artifacts, "source"))
	};
	const relativePath = artifactPath("work", id);
	await writeArtifactFile(root, relativePath, withHash, bodyText);
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "work_item",
			id
		}],
		next_actions: [next(`dossier-engineer work acceptance add --work ${id} --kind behavior --text "<criterion>" --source ${sourceId}#<anchor>`, "Capability work needs behavioral acceptance."), next(`dossier-engineer stage start --work ${id} --stage feature-intake --session <session-id>`, "Start the first workflow stage.")]
	});
};
var workAcceptanceAdd = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const kind = requireEnum(command, "kind", ACCEPTANCE_KINDS);
	const text = requireValue(command, "text");
	const source = resolveSourcePart(requireValue(command, "source"));
	if (!findArtifactById(artifacts, source.source_id)) throw new UsageError(`Source not found: ${source.source_id}`);
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const now = isoNow(ctx.now());
	const acId = makeId(root, "AC", text, ctx.randomHex, (candidate) => `${DOSSIER_DIR}/_embedded/${candidate}`, ctx.now());
	const acceptance = work.frontmatter.acceptance;
	const criteria = [...acceptance.criteria ?? [], {
		id: acId,
		kind,
		text,
		source_ref: {
			source_id: source.source_id,
			anchor: source.anchor
		},
		status: "active"
	}];
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, work, recomputeWorkHash({
			...work,
			frontmatter: {
				...work.frontmatter,
				acceptance: {
					...acceptance,
					criteria
				}
			}
		}, artifacts), now))],
		next_actions: [next(`dossier-engineer work demo set --work ${workId} --name "<demo>" --scenario "<observable scenario>"`, "Define the demonstration that proves the criteria.")]
	});
};
var workDemoSet = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, work, recomputeWorkHash({
			...work,
			frontmatter: {
				...work.frontmatter,
				demonstration: {
					name: requireValue(command, "name"),
					scenario: requireValue(command, "scenario"),
					falsifiers: values(command, "falsifier")
				}
			}
		}, artifacts), isoNow(ctx.now())))],
		next_actions: [next(`dossier-engineer work anti-claim add --work ${workId} --text "<explicit non-goal>"`, "Record anti-claims before spec closure.")]
	});
};
var workAntiClaimAdd = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const text = requireValue(command, "text");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, work, recomputeWorkHash({
			...work,
			frontmatter: {
				...work.frontmatter,
				anti_claims: [...new Set([...work.frontmatter.anti_claims, text])]
			}
		}, artifacts), isoNow(ctx.now())))],
		next_actions: [next(`dossier-engineer work challenge record --work ${workId} --summary "<how this plan could be wrong>"`, "Challenge implementation before plan-slice closure.")]
	});
};
var createStageEvent = async (root, ctx, workId, stage, event, summary, sessionId) => {
	const id = makeId(root, "STG", `${workId} ${stage} ${event}`, ctx.randomHex, (candidate) => `${DOSSIER_DIR}/stages/${workId}/${candidate}.md`, ctx.now());
	const relativePath = `${DOSSIER_DIR}/stages/${workId}/${id}.md`;
	await writeArtifactFile(root, relativePath, {
		artifact_type: "stage_event",
		schema_version: "2.2",
		id,
		work_item_id: workId,
		stage,
		event,
		session_id: sessionId,
		created_at: isoNow(ctx.now()),
		summary,
		linked_artifacts: []
	}, body(`${stage} ${event}`, ["Summary", "Notes"]));
	return {
		path: relativePath,
		id
	};
};
var workChallengeRecord = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const summary = requireValue(command, "summary");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const event = await createStageEvent(root, ctx, workId, "plan-slice", "challenge", summary, value(command, "session") ?? null);
	const updated = await updateArtifact(root, work, recomputeWorkHash({
		...work,
		frontmatter: {
			...work.frontmatter,
			challenge: {
				recorded: true,
				latest_event_id: event.id
			}
		}
	}, artifacts), isoNow(ctx.now()));
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: event.path,
			artifact_type: "stage_event",
			id: event.id
		}],
		changed_artifacts: [artifactInfo(updated)],
		next_actions: [next(`dossier-engineer stage ready --work ${workId} --stage plan-slice --summary "<result>"`, "Mark plan-slice ready after challenge and plan evidence are complete.")]
	});
};
var workSupportExplain = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const reason = requireValue(command, "reason");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const delivery = work.frontmatter.delivery;
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, work, recomputeWorkHash({
			...work,
			frontmatter: {
				...work.frontmatter,
				delivery: {
					...delivery,
					support_reason: reason
				}
			}
		}, artifacts), isoNow(ctx.now())))],
		next_actions: [next("dossier-engineer capability check --root .", "Validate support work does not masquerade as capability.")]
	});
};
var workDependencyAdd = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const dependency = requireValue(command, "depends-on");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	if (!findArtifactById(artifacts, dependency)) throw new UsageError(`Dependency work item not found: ${dependency}`);
	if (dependency === workId) throw new UsageError("A work item cannot depend on itself.");
	const dependencies = [...new Set([...work.frontmatter.dependencies, dependency])];
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, work, recomputeWorkHash({
			...work,
			frontmatter: {
				...work.frontmatter,
				dependencies
			}
		}, artifacts), isoNow(ctx.now())))],
		next_actions: [next("dossier-engineer queue --root .", "Recompute dependency-aware queue.")]
	});
};
var workDependencyRemove = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const dependency = requireValue(command, "depends-on");
	requireValue(command, "reason");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const dependencies = (work.frontmatter.dependencies ?? []).filter((entry) => entry !== dependency);
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, work, recomputeWorkHash({
			...work,
			frontmatter: {
				...work.frontmatter,
				dependencies
			}
		}, artifacts), isoNow(ctx.now())))],
		next_actions: [next("dossier-engineer queue --root .", "Recompute dependency-aware queue.")]
	});
};
var workBlockerAdd = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const kind = requireValue(command, "kind");
	const summary = requireValue(command, "summary");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const now = isoNow(ctx.now());
	const blockerId = makeId(root, "BLK", summary, ctx.randomHex, (candidate) => `${DOSSIER_DIR}/_embedded/${candidate}`, ctx.now());
	const blockers = [...work.frontmatter.blockers ?? [], {
		id: blockerId,
		kind,
		summary,
		blocking: !hasFlag(command, "non-blocking"),
		created_at: now,
		resolved_at: null,
		resolution: null
	}];
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, work, {
			...work.frontmatter,
			blockers
		}, now))],
		next_actions: [next(`dossier-engineer work blocker resolve --work ${workId} --blocker ${blockerId} --summary "<resolution>"`, "Resolve blockers before closure.")]
	});
};
var workBlockerResolve = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const blocker = requireValue(command, "blocker");
	const summary = requireValue(command, "summary");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const now = isoNow(ctx.now());
	const blockers = (work.frontmatter.blockers ?? []).map((entry) => {
		const item = entry;
		return item.id === blocker ? {
			...item,
			resolved_at: now,
			resolution: summary
		} : item;
	});
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, work, {
			...work.frontmatter,
			blockers
		}, now))],
		next_actions: [next(`dossier-engineer next --work ${workId}`, "Continue protocol after blocker resolution.")]
	});
};
var workRiskSet = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const risk = {
		implementation: (value(command, "implementation") ?? "").split(",").map((entry) => entry.trim()).filter(Boolean),
		policy: (value(command, "policy") ?? "").split(",").map((entry) => entry.trim()).filter(Boolean)
	};
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, work, recomputeWorkHash({
			...work,
			frontmatter: {
				...work.frontmatter,
				risk
			}
		}, artifacts), isoNow(ctx.now())))],
		next_actions: [next(`dossier-engineer review required --work ${workId} --stage implementation`, "Inspect review requirements after risk update.")]
	});
};
var workRetire = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	requireValue(command, "reason");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(await updateArtifact(root, work, {
			...work.frontmatter,
			lifecycle: "retired"
		}, isoNow(ctx.now())))],
		next_actions: [next("dossier-engineer queue --root .", "Recompute queue after retirement.")]
	});
};
var workSplit = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const sourceWorkId = requireValue(command, "work");
	const title = requireValue(command, "title");
	requireValue(command, "reason");
	const sourceWork = findArtifactById(artifacts, sourceWorkId);
	if (sourceWork === void 0 || sourceWork.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${sourceWorkId}`);
	const now = isoNow(ctx.now());
	const id = makeId(root, "WI", title, ctx.randomHex, (candidate) => artifactPath("work", candidate), ctx.now());
	const frontmatter = {
		...sourceWork.frontmatter,
		id,
		title,
		lifecycle: "defined",
		created_at: now,
		updated_at: now,
		source_refs: value(command, "source") ? [sourceRef(requireValue(command, "source"))] : sourceWork.frontmatter.source_refs,
		stage_state: {
			"feature-intake": "not_started",
			"spec-compact": "not_started",
			"plan-slice": "not_started",
			implementation: "not_started",
			"change-proposal": "not_started"
		}
	};
	const relativePath = artifactPath("work", id);
	await writeArtifactFile(root, relativePath, recomputeWorkHash({
		path: relativePath,
		frontmatter,
		body: sourceWork.body
	}, artifacts), sourceWork.body.replace(/^# .*/m, `# ${title}`));
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "work_item",
			id
		}],
		next_actions: [next(`dossier-engineer next --work ${id}`, "Continue the new split work item.")]
	});
};
var previousStageClosed = (work, stage) => {
	const state = work.frontmatter.stage_state;
	if (stage === "feature-intake" || stage === "change-proposal") return true;
	if (stage === "spec-compact") return state["feature-intake"] === "closed";
	if (stage === "plan-slice") return state["spec-compact"] === "closed";
	if (stage === "implementation") return state["plan-slice"] === "closed";
	return false;
};
var markdownSection = (bodyText, heading, level) => {
	const marker = "#".repeat(level);
	const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const start = new RegExp(`^${marker}\\s+${escaped}\\s*$`, "im").exec(bodyText);
	if (start === null) return null;
	const contentStart = start.index + start[0].length;
	const next = new RegExp(`^#{1,${level}}\\s+`, "im").exec(bodyText.slice(contentStart));
	const contentEnd = next === null ? bodyText.length : contentStart + next.index;
	return bodyText.slice(contentStart, contentEnd).trim();
};
var materialText = (input) => input.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "" && !line.startsWith("#")).filter((line) => !/^(-\s*)?(todo|tbd|placeholder|fill me|n\/a)$/i.test(line)).join(" ").trim();
var hasMaterialSectionContent = (input) => {
	const content = materialText(input);
	return content.length >= 24 && /[A-Za-zА-Яа-я0-9]/.test(content);
};
var requiredSubsectionFindings = (work, sectionName, subsections) => {
	const section = markdownSection(work.body, sectionName, 2);
	if (section === null || !hasMaterialSectionContent(section)) return [`${artifactId(work)}: ${sectionName} body section is missing, heading-only, placeholder-only, or template-only.`];
	const findings = [];
	for (const subsection of subsections) {
		const content = markdownSection(section, subsection, 3);
		if (content === null || !hasMaterialSectionContent(content)) findings.push(`${artifactId(work)}: ${sectionName} / ${subsection} lacks project-specific content.`);
	}
	return findings;
};
var hasNegativeOrFalsifierCriterion = (work) => {
	return (work.frontmatter.acceptance?.criteria ?? []).some((entry) => ["negative", "falsifier"].includes(String(entry.kind)));
};
var specCompactFindings = (work) => {
	const findings = requiredSubsectionFindings(work, "Spec Compact", [
		"Behavior statement",
		"Acceptance criteria matrix",
		"Negative acceptance / falsifiers",
		"Anti-claims and non-goals",
		"Open questions and gaps"
	]);
	const spec = markdownSection(work.body, "Spec Compact", 2) ?? "";
	if (/testable[- ](?:negative|anti-claim)|testable anti-claim/i.test(spec) && !hasNegativeOrFalsifierCriterion(work)) findings.push(`${artifactId(work)}: testable anti-claims must be represented as negative or falsifier acceptance criteria.`);
	return findings;
};
var planSliceFindings = (work) => {
	const findings = requiredSubsectionFindings(work, "Plan Slice", [
		"Implementation target",
		"Integration path",
		"Files, interfaces, and components",
		"Sequence",
		"AC to evidence matrix",
		"Risks and fallback/change-proposal triggers"
	]);
	const plan = markdownSection(work.body, "Plan Slice", 2) ?? "";
	const integration = markdownSection(plan, "Integration path", 3) ?? "";
	const files = markdownSection(plan, "Files, interfaces, and components", 3) ?? "";
	const matrix = markdownSection(plan, "AC to evidence matrix", 3) ?? "";
	const risks = markdownSection(plan, "Risks and fallback/change-proposal triggers", 3) ?? "";
	for (const field of [
		"Actor entrypoint",
		"Runtime path",
		"Production components touched",
		"UI/API/agent path",
		"State/effect path",
		"Continuity path",
		"What would prove this is integrated",
		"What would prove this is only substrate"
	]) if (hasMaterialSectionContent(integration) && markdownLineValue(integration, field) === null) findings.push(`${artifactId(work)}: Plan Slice / Integration path lacks ${field}.`);
	if (hasMaterialSectionContent(integration) && markdownLineValue(integration, "Actor entrypoint") === null && !/production entrypoint/i.test(integration)) findings.push(`${artifactId(work)}: Plan Slice / Integration path must name production or actor entrypoint for user-visible capability work.`);
	if (hasMaterialSectionContent(files) && !(/(?:^|\s)(?:[\w.-]+\/)+[\w.-]+/.test(files) || /non-code/i.test(files))) findings.push(`${artifactId(work)}: Plan Slice / Files, interfaces, and components must name concrete files/interfaces/components or an explicit non-code rationale.`);
	const normalizedMatrix = matrix.toLowerCase();
	for (const column of [
		"ac",
		"observable behavior",
		"implementation surface",
		"evidence method",
		"falsifier"
	]) if (hasMaterialSectionContent(matrix) && !normalizedMatrix.includes(column)) findings.push(`${artifactId(work)}: Plan Slice / AC to evidence matrix lacks ${column}.`);
	if (hasMaterialSectionContent(risks) && (!/change-proposal/i.test(risks) || !/trigger/i.test(risks))) findings.push(`${artifactId(work)}: Plan Slice / Risks and fallback/change-proposal triggers must name change-proposal triggers.`);
	return findings;
};
var stageGateFindings = (work, all, stage) => {
	const findings = [];
	const delivery = work.frontmatter.delivery;
	if (!previousStageClosed(work, stage)) findings.push(`${artifactId(work)}: previous stage is not closed for ${stage}.`);
	if (openBlockers(work).length > 0) findings.push(`${artifactId(work)}: open blocker exists.`);
	if (stage === "feature-intake") {
		if (!isOneOf(delivery.kind, DELIVERY_KINDS)) findings.push(`${artifactId(work)}: invalid delivery kind.`);
	}
	if (stage === "spec-compact") {
		findings.push(...workGateFindings(work).filter((entry) => !entry.includes("challenge")));
		if (delivery.kind === "capability") findings.push(...specCompactFindings(work));
	}
	if (stage === "plan-slice") {
		if (work.frontmatter.challenge.recorded !== true) findings.push(`${artifactId(work)}: challenge must be recorded before plan-slice readiness.`);
		if (delivery.kind === "capability") {
			findings.push(...planSliceFindings(work));
			if (!reviewFreshForStage(work, all, "concept-conformance-reviewer", "plan-slice")) findings.push(`${artifactId(work)}: current PASS concept-conformance-reviewer review is required before plan-slice close. Run dossier-engineer review required --work ${artifactId(work)} --stage plan-slice.`);
		}
	}
	if (stage === "implementation") {
		if (delivery.kind === "capability" && !verificationFresh(work, all, "behavioral-demo")) findings.push(`${artifactId(work)}: fresh behavioral-demo verification required.`);
		if (isUserVisibleCapabilityWork(work) && !liveAppVerificationFresh(work, all)) findings.push(`${artifactId(work)}: fresh live-app behavioral-demo verification required for user-visible capability work.`);
		for (const reviewClass of requiredReviewClasses(work, "implementation")) if (!reviewFresh(work, all, reviewClass)) findings.push(`${artifactId(work)}: fresh ${reviewClass} review required.`);
	}
	return findings;
};
var stageTransition = async (ctx, command, action) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const stage = requireEnum(command, "stage", STAGES);
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const state = work.frontmatter.stage_state;
	const warnings = [];
	const blockers = [];
	if (action === "start") {
		if (!previousStageClosed(work, stage)) blockers.push(`${stage}: previous required stage is not closed.`);
		requireValue(command, "session");
	}
	if (action === "ready") {
		requireValue(command, "summary");
		blockers.push(...stageGateFindings(work, artifacts, stage));
	}
	if (action === "close") {
		if (state[stage] !== "ready_for_close") blockers.push(`${stage}: stage is not ready_for_close.`);
		blockers.push(...stageGateFindings(work, artifacts, stage));
	}
	if (action === "reopen") requireValue(command, "reason");
	if (blockers.length > 0) return result(command, {
		result: "blocked",
		blockers,
		next_actions: [next(`dossier-engineer next --work ${workId}`, "Resolve stage blockers through the next safe action.")],
		exitCode: 2
	});
	const nextState = action === "start" ? "in_progress" : action === "ready" ? "ready_for_close" : action === "close" ? "closed" : "reopened";
	const lifecycleByStage = {
		"feature-intake": "intaken",
		"spec-compact": "specified",
		"plan-slice": "planned",
		implementation: "implemented"
	};
	const updated = await updateArtifact(root, work, {
		...work.frontmatter,
		stage_state: {
			...state,
			[stage]: nextState
		},
		lifecycle: action === "close" && lifecycleByStage[stage] !== void 0 ? lifecycleByStage[stage] : work.frontmatter.lifecycle
	}, isoNow(ctx.now()));
	const event = await createStageEvent(root, ctx, workId, stage, action === "ready" ? "ready" : action, value(command, "summary") ?? value(command, "reason") ?? `${stage} ${action}`, value(command, "session") ?? null);
	if (action === "close" && stage === "implementation") warnings.push("Implementation is implemented, not fully closed, until hygiene passes and project closure policy is satisfied.");
	return result(command, {
		result: "success",
		changed_artifacts: [artifactInfo(updated)],
		created_artifacts: [{
			path: event.path,
			artifact_type: "stage_event",
			id: event.id
		}],
		warnings,
		next_actions: action === "close" && stage === "implementation" ? [next(`dossier-engineer hygiene run --work ${workId} --stage implementation`, "Run post-close hygiene before handoff.")] : [next(`dossier-engineer next --work ${workId}`, "Continue with the next protocol-safe action.")]
	});
};
var stageLog = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const stage = requireEnum(command, "stage", STAGES);
	const summary = requireValue(command, "summary");
	if (!findArtifactById(artifacts, workId)) throw new UsageError(`Work item not found: ${workId}`);
	const event = await createStageEvent(root, ctx, workId, stage, value(command, "event") ?? "note", summary, value(command, "session") ?? null);
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: event.path,
			artifact_type: "stage_event",
			id: event.id
		}],
		next_actions: [next(`dossier-engineer next --work ${workId}`, "Continue protocol after the note.")]
	});
};
var requiredReviewClasses = (work, stage = "implementation") => {
	const delivery = work.frontmatter.delivery;
	const risk = work.frontmatter.risk;
	const classes = /* @__PURE__ */ new Set();
	if (stage === "plan-slice") {
		if (delivery.kind === "capability") classes.add("concept-conformance-reviewer");
		return [...classes];
	}
	if (delivery.kind === "capability") {
		classes.add("concept-conformance-reviewer");
		classes.add("spec-conformance-reviewer");
	}
	if ((risk?.implementation ?? []).some((entry) => ["code", "implementation"].includes(entry))) classes.add("code-reviewer");
	if ([...risk?.implementation ?? [], ...risk?.policy ?? []].some((entry) => [
		"security",
		"auth",
		"privacy",
		"network",
		"dependency"
	].includes(entry))) classes.add("security-reviewer");
	return [...classes];
};
var verifyRequired = async (ctx, command) => {
	const { artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const delivery = work.frontmatter.delivery;
	const required = delivery.kind === "capability" ? ["behavioral-demo"] : delivery.kind === "maintenance" ? ["default"] : ["default"];
	const findings = required.map((profile) => `${profile}: ${verificationFresh(work, artifacts, profile) ? "fresh" : "missing_or_stale"}`);
	if (isUserVisibleCapabilityWork(work)) findings.push(`behavioral-demo live-app: ${liveAppVerificationFresh(work, artifacts) ? "fresh" : "missing_or_stale"}`);
	const recordCommand = isUserVisibleCapabilityWork(work) ? `dossier-engineer verify record --work ${workId} --stage implementation --profile behavioral-demo --evidence-class live-app --entrypoint "<actual app entrypoint>" --runtime-path "<production path>" --verdict pass --summary "<observed behavior>" --evidence <path>` : `dossier-engineer verify record --work ${workId} --stage implementation --profile ${required[0]} --evidence-class behavioral --verdict pass --summary "<observed behavior>" --evidence <path>`;
	return result(command, {
		result: findings.some((entry) => entry.includes("missing")) ? "blocked" : "success",
		findings,
		next_actions: [next(recordCommand, "Record verification evidence when no runnable profile is configured.")],
		exitCode: findings.some((entry) => entry.includes("missing")) ? 2 : 0
	});
};
var verifyRun = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const stage = requireEnum(command, "stage", STAGES);
	const profile = requireValue(command, "profile");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const profileCommands = (findArtifactsByType(artifacts, "dossier_project")[0]?.frontmatter.verification_profiles)?.[profile]?.commands ?? [];
	if (profileCommands.length > 0) {
		const startingMaterialScopeHash = currentMaterialWorkHash(work, artifacts);
		const startingProfileCommands = JSON.stringify(profileCommands);
		const commandResults = profileCommands.map((profileCommand) => {
			const spawned = spawnSync(profileCommand, {
				cwd: root,
				encoding: "utf8",
				shell: true
			});
			return {
				command: profileCommand,
				exit_code: spawned.status ?? 1,
				stdout: spawned.stdout.slice(0, 4e3),
				stderr: spawned.stderr.slice(0, 4e3)
			};
		});
		return withMutationEnvelope(ctx, command, async () => {
			const { artifacts: currentArtifacts } = await loadRootArtifacts(ctx, command);
			const currentWork = findArtifactById(currentArtifacts, workId);
			if (currentWork === void 0 || currentWork.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
			if (currentMaterialWorkHash(currentWork, currentArtifacts) !== startingMaterialScopeHash) return result(command, {
				result: "blocked",
				blockers: ["Verification result was not recorded because the work item material scope changed while the external command was running."],
				next_actions: [next(`dossier-engineer verify run --work ${workId} --stage ${stage} --profile ${profile}`, "Re-run verification against the current work item scope.")],
				exitCode: 2
			});
			const currentProfileCommands = (findArtifactsByType(currentArtifacts, "dossier_project")[0]?.frontmatter.verification_profiles)?.[profile]?.commands ?? [];
			if (JSON.stringify(currentProfileCommands) !== startingProfileCommands) return result(command, {
				result: "blocked",
				blockers: ["Verification result was not recorded because the verification profile changed while the external command was running."],
				next_actions: [next(`dossier-engineer verify run --work ${workId} --stage ${stage} --profile ${profile}`, "Re-run verification using the current profile command set.")],
				exitCode: 2
			});
			const failed = commandResults.find((entry) => entry.exit_code !== 0);
			const verdict = failed === void 0 ? "pass" : "fail";
			const id = makeId(root, "VER", `${workId} ${profile}`, ctx.randomHex, (candidate) => `${DOSSIER_DIR}/verification/${workId}/${candidate}.md`, ctx.now());
			const relativePath = `${DOSSIER_DIR}/verification/${workId}/${id}.md`;
			await writeArtifactFile(root, relativePath, {
				artifact_type: "verification",
				schema_version: "2.2",
				id,
				work_item_id: workId,
				stage,
				profile,
				evidence_class: profile === "behavioral-demo" ? "behavioral" : "support",
				verdict,
				commands: commandResults,
				evidence: [],
				coverage_gate: verdict === "pass" ? "green" : "open",
				created_at: isoNow(ctx.now()),
				material_scope_hash: currentMaterialWorkHash(currentWork, currentArtifacts)
			}, body(`${profile} verification`, ["Command output", "Evidence interpretation"]));
			const changed = [];
			if (verdict === "pass") {
				const acceptance = currentWork.frontmatter.acceptance;
				const updated = await updateArtifact(root, currentWork, {
					...currentWork.frontmatter,
					acceptance: {
						...acceptance,
						coverage_gate: "green"
					}
				}, isoNow(ctx.now()));
				changed.push(artifactInfo(updated));
			}
			return result(command, {
				result: verdict === "pass" ? "success" : "failed",
				created_artifacts: [{
					path: relativePath,
					artifact_type: "verification",
					id
				}],
				changed_artifacts: changed,
				blockers: failed === void 0 ? [] : [`Verification command failed (${failed.exit_code}): ${failed.command}`],
				next_actions: verdict === "pass" ? [next(`dossier-engineer review required --work ${workId} --stage ${stage}`, "Check review requirements after verification evidence.")] : [next(`dossier-engineer verify run --work ${workId} --stage ${stage} --profile ${profile}`, "Rerun after fixing the failed command.")],
				exitCode: verdict === "pass" ? 0 : 4
			});
		}, root);
	}
	return result(command, {
		result: "blocked",
		blockers: [`Verification profile ${profile} has no configured commands; use verify record for external/manual evidence or configure project.md verification_profiles.`],
		next_actions: [next(`dossier-engineer verify record --work ${workId} --stage ${stage} --profile ${profile} --evidence-class manual --verdict pass --summary "<summary>" --evidence <path>`, "Record evidence explicitly when no runnable profile is configured.")],
		exitCode: 2
	});
};
var verifyRecord = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const stage = requireEnum(command, "stage", STAGES);
	const profile = requireValue(command, "profile");
	const evidenceClass = requireValue(command, "evidence-class");
	const verdict = requireEnum(command, "verdict", VERDICTS);
	const summary = requireValue(command, "summary");
	const evidence = values(command, "evidence");
	const entrypoint = value(command, "entrypoint");
	const runtimePath = value(command, "runtime-path");
	if (evidenceClass === "live-app" && (entrypoint === void 0 || entrypoint.trim() === "" || runtimePath === void 0 || runtimePath.trim() === "")) throw new UsageError("live-app evidence requires --entrypoint and --runtime-path structured fields.");
	const missing = await evidencePathsExist(root, evidence);
	if (missing.length > 0) throw new UsageError(`Evidence path does not exist: ${missing.join(", ")}`);
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const id = makeId(root, "VER", `${workId} ${profile}`, ctx.randomHex, (candidate) => `${DOSSIER_DIR}/verification/${workId}/${candidate}.md`, ctx.now());
	const relativePath = `${DOSSIER_DIR}/verification/${workId}/${id}.md`;
	await writeArtifactFile(root, relativePath, {
		artifact_type: "verification",
		schema_version: "2.2",
		id,
		work_item_id: workId,
		stage,
		profile,
		evidence_class: evidenceClass,
		...evidenceClass === "live-app" ? {
			entrypoint,
			runtime_path: runtimePath
		} : {},
		verdict,
		commands: [],
		evidence,
		coverage_gate: verdict === "pass" ? "green" : "open",
		created_at: isoNow(ctx.now()),
		material_scope_hash: currentMaterialWorkHash(work, artifacts)
	}, [
		`# ${profile} verification`,
		"",
		"## Summary",
		"",
		summary,
		"",
		"## Evidence interpretation",
		""
	].join("\n"));
	const changed = [];
	if (verdict === "pass") {
		const acceptance = work.frontmatter.acceptance;
		const updated = await updateArtifact(root, work, {
			...work.frontmatter,
			acceptance: {
				...acceptance,
				coverage_gate: "green"
			}
		}, isoNow(ctx.now()));
		changed.push(artifactInfo(updated));
	}
	return result(command, {
		result: verdict === "pass" ? "success" : "blocked",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "verification",
			id
		}],
		changed_artifacts: changed,
		blockers: verdict === "pass" ? [] : [`Verification verdict is ${verdict}.`],
		next_actions: [next(`dossier-engineer review required --work ${workId} --stage ${stage}`, "Check review requirements after verification evidence.")],
		exitCode: verdict === "pass" ? 0 : 2
	});
};
var reviewRequired = async (ctx, command) => {
	const { artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const stage = value(command, "stage") === void 0 ? "implementation" : requireEnum(command, "stage", STAGES);
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const required = requiredReviewClasses(work, stage);
	const findings = required.map((reviewClass) => {
		return `${reviewClass}: ${(stage === "plan-slice" ? reviewFreshForStage(work, artifacts, reviewClass, stage) : reviewFresh(work, artifacts, reviewClass)) ? "fresh" : "missing_or_stale"} for stage=${stage}`;
	});
	return result(command, {
		result: findings.some((entry) => entry.includes("missing")) ? "blocked" : "success",
		findings: findings.length === 0 ? ["No required reviews by current risk policy."] : findings,
		next_actions: [next(`dossier-engineer review record --work ${workId} --stage ${stage} --class ${required[0] ?? "<review-class>"} --verdict pass --reviewer <reviewer-id>`, stage === "plan-slice" ? "Record current concept-conformance review before plan-slice close." : "Record immutable external review evidence.")],
		exitCode: findings.some((entry) => entry.includes("missing")) ? 2 : 0
	});
};
var reviewRecord = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const stage = requireEnum(command, "stage", STAGES);
	const auditClass = requireValue(command, "class");
	if (!REVIEW_CLASSES.includes(auditClass) && !auditClass.includes("-reviewer")) throw new UsageError(`Invalid review class: ${auditClass}`);
	const verdict = requireEnum(command, "verdict", VERDICTS);
	const reviewer = requireValue(command, "reviewer");
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const id = makeId(root, "REV", `${workId} ${auditClass}`, ctx.randomHex, (candidate) => `${DOSSIER_DIR}/reviews/${workId}/${candidate}.md`, ctx.now());
	const relativePath = `${DOSSIER_DIR}/reviews/${workId}/${id}.md`;
	await writeArtifactFile(root, relativePath, {
		artifact_type: "review",
		schema_version: "2.2",
		id,
		work_item_id: workId,
		stage,
		audit_class: auditClass,
		verdict,
		reviewer,
		created_at: isoNow(ctx.now()),
		material_scope_hash: stage === "plan-slice" ? currentMaterialWorkHash(work, artifacts) : currentMaterialReviewHash(work, artifacts),
		reviewed_artifacts: [work.path],
		findings: [],
		summary: value(command, "summary") ?? null,
		evidence: values(command, "evidence")
	}, body(`${auditClass} review`, ["Findings", "Reviewer notes"]));
	return result(command, {
		result: verdict === "pass" || verdict === "not_applicable" ? "success" : "blocked",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "review",
			id
		}],
		blockers: verdict === "pass" || verdict === "not_applicable" ? [] : [`Review verdict is ${verdict}.`],
		next_actions: [next(`dossier-engineer stage ready --work ${workId} --stage ${stage} --summary "<implemented result>"`, "Mark implementation ready only after all required reviews and verification pass.")],
		exitCode: verdict === "pass" || verdict === "not_applicable" ? 0 : 2
	});
};
var hygieneRun = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const workId = requireValue(command, "work");
	const stage = requireEnum(command, "stage", STAGES);
	const work = findArtifactById(artifacts, workId);
	if (work === void 0 || work.frontmatter.artifact_type !== "work_item") throw new UsageError(`Work item not found: ${workId}`);
	const findings = closureFindings(work, artifacts);
	const verdict = findings.length === 0 ? "pass" : "blocked";
	const id = makeId(root, "HYG", `${workId} ${stage}`, ctx.randomHex, (candidate) => `${DOSSIER_DIR}/hygiene/${workId}/${candidate}.md`, ctx.now());
	const relativePath = `${DOSSIER_DIR}/hygiene/${workId}/${id}.md`;
	await writeArtifactFile(root, relativePath, {
		artifact_type: "hygiene",
		schema_version: "2.2",
		id,
		work_item_id: workId,
		stage,
		verdict,
		checked_at: isoNow(ctx.now()),
		checks: {
			source_reviews: "pass",
			capability_claim: findings.some((entry) => entry.includes("claim")) ? "fail" : "pass",
			behavioral_demo: findings.some((entry) => entry.includes("behavioral")) ? "fail" : "pass",
			concept_conformance: findings.some((entry) => entry.includes("concept")) ? "fail" : "pass",
			status_overlay: "pass",
			queue_impact: "pass",
			attention: findings.length === 0 ? "pass" : "fail",
			review_freshness: findings.some((entry) => entry.includes("review")) ? "fail" : "pass"
		}
	}, body(`${stage} hygiene`, ["Findings", "Follow-up"]));
	const changed = [];
	if (verdict === "pass") {
		const updated = await updateArtifact(root, work, {
			...work.frontmatter,
			post_close_hygiene: {
				...work.frontmatter.post_close_hygiene,
				[stage]: "closed"
			},
			lifecycle: stage === "implementation" ? "closed" : work.frontmatter.lifecycle
		}, isoNow(ctx.now()));
		changed.push(artifactInfo(updated));
	}
	return result(command, {
		result: verdict === "pass" ? "success" : "blocked",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "hygiene",
			id
		}],
		changed_artifacts: changed,
		findings,
		blockers: findings,
		next_actions: verdict === "pass" ? [next("dossier-engineer changeset create --scope current-branch --summary \"<branch summary>\"", "Create branch-level evidence before handoff.")] : [next(`dossier-engineer next --work ${workId}`, "Resolve hygiene blockers.")],
		exitCode: verdict === "pass" ? 0 : 2
	});
};
var changesetCreate = async (ctx, command) => {
	const { root } = await loadRootArtifacts(ctx, command);
	const scope = requireValue(command, "scope");
	const summary = requireValue(command, "summary");
	const id = makeId(root, "CS", summary, ctx.randomHex, (candidate) => artifactPath("changeset", candidate), ctx.now());
	const relativePath = artifactPath("changeset", id);
	await writeArtifactFile(root, relativePath, {
		artifact_type: "changeset",
		schema_version: "2.2",
		id,
		scope,
		created_at: isoNow(ctx.now()),
		sources: values(command, "source"),
		capabilities: values(command, "capability"),
		baselines: [],
		guardrails: [],
		work_items: values(command, "work"),
		source_reviews: [],
		reviews: [],
		verification: [],
		hygiene: [],
		process_misses: [],
		skill_feedback: [],
		capability_drift: []
	}, body(summary, [
		"Branch summary",
		"Artifacts",
		"Process misses",
		"Skill feedback",
		"Capability drift"
	]));
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "changeset",
			id
		}],
		next_actions: [next("dossier-engineer lint --root .", "Validate dossier before handoff.")]
	});
};
var reportCreate = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const kind = requireValue(command, "kind");
	const scope = requireValue(command, "scope");
	const id = `${kind}-${ctx.now().toISOString().slice(0, 10)}`;
	const relativePath = `${DOSSIER_DIR}/reports/${id}.md`;
	await writeArtifactFile(root, relativePath, {
		artifact_type: "report",
		schema_version: "2.2",
		id,
		kind,
		scope,
		derived: true,
		created_at: isoNow(ctx.now()),
		source_artifacts: artifacts.map((entry) => entry.path)
	}, body(`${kind} report`, [
		"Summary",
		"Findings",
		"Next actions"
	]));
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "report",
			id
		}],
		warnings: ["Reports are derived views and are not closure evidence."],
		next_actions: [next("dossier-engineer status --root .", "Use live derived state for current readiness.")]
	});
};
var retroCreate = async (ctx, command) => {
	const { root, artifacts } = await loadRootArtifacts(ctx, command);
	const since = requireValue(command, "since");
	const until = requireValue(command, "until");
	const id = makeId(root, "RETRO", `${since} ${until}`, ctx.randomHex, (candidate) => artifactPath("retro", candidate), ctx.now());
	const relativePath = artifactPath("retro", id);
	await writeArtifactFile(root, relativePath, {
		artifact_type: "retrospective_report",
		schema_version: "2.2",
		id,
		since,
		until,
		derived: true,
		created_at: isoNow(ctx.now()),
		source_artifacts: artifacts.map((entry) => entry.path)
	}, body(`Retrospective ${since} - ${until}`, [
		"Capability completion",
		"Support ratio",
		"Demonstration outcomes",
		"Review outcomes",
		"Guardrail outcomes",
		"Process misses",
		"Skill feedback"
	]));
	return result(command, {
		result: "success",
		created_artifacts: [{
			path: relativePath,
			artifact_type: "retrospective_report",
			id
		}],
		next_actions: [next("dossier-engineer report create --kind status --scope repository", "Create a status report only if a durable derived view is needed.")]
	});
};
//#endregion
//#region src/cli/run-cli.ts
var TOOL_NAME = "dossier-engineer";
var write = (stream, value) => {
	stream.write(`${value}\n`);
};
var COMMANDS = [
	"init --root <path> --project-name \"<name>\"",
	"status --root <path>",
	"attention --root <path>",
	"queue --root <path> [--area <area>] [--owner <owner>]",
	"next --work <work-id>",
	"lint --root <path> | --path <artifact-path>",
	"source add|list|refresh|impact|review resolve",
	"capability create|claim set|anti-claim add|demo record|check",
	"baseline create|capability add",
	"guardrail add|check|resolve",
	"work create|acceptance add|demo set|anti-claim add|challenge record|support explain|dependency add|dependency remove|blocker add|blocker resolve|risk set|split|retire",
	"stage start|ready|close|reopen|log",
	"verify required|run|record",
	"review required|record",
	"hygiene run",
	"changeset create",
	"report create",
	"retro create"
];
var renderHelp = (version, command) => {
	if (command !== void 0) return [
		`${TOOL_NAME} ${command}`,
		"",
		"Common options:",
		"  --root <path>       Dossier root. Defaults to nearest docs/dossier/project.md.",
		"  --format text|yaml  Output format. Defaults to text.",
		"  --quiet             Suppress summaries, never blockers or next actions.",
		"",
		"Run `dossier-engineer help` for the command family list."
	].join("\n");
	return [
		`${TOOL_NAME} CLI v${version}`,
		"",
		"Purpose:",
		"  Manage Markdown/YAML dossier artifacts without JSON canonical state.",
		"",
		"Commands:",
		...COMMANDS.map((entry) => `  ${entry}`),
		"",
		"Common options:",
		"  --root <path>       Dossier root.",
		"  --format text|yaml  Machine-readable YAML output.",
		"  --quiet             Keep blockers and next actions visible.",
		"",
		"Exit codes:",
		"  0 success, no blockers",
		"  1 invalid command, args, filesystem, or parser error",
		"  2 protocol validation blocked the action",
		"  3 lint found errors",
		"  4 external verification command failed",
		"  5 dossier root not found or unsupported layout"
	].join("\n");
};
var parse = (args) => {
	const words = [];
	const positionals = [];
	const options = {};
	const commandLimit = args[0] === "source" && args[1] === "review" ? 3 : args[0] === "capability" && [
		"claim",
		"anti-claim",
		"demo"
	].includes(String(args[1])) ? 3 : args[0] === "baseline" && args[1] === "capability" ? 3 : args[0] === "work" && [
		"acceptance",
		"demo",
		"anti-claim",
		"challenge",
		"support",
		"dependency",
		"blocker",
		"risk"
	].includes(String(args[1])) ? 3 : 2;
	let index = 0;
	while (index < args.length) {
		const token = args[index];
		if (token === void 0) break;
		if (token.startsWith("--")) {
			const name = token.slice(2);
			const next = args[index + 1];
			let parsed = true;
			if (next !== void 0 && !next.startsWith("--")) {
				parsed = next;
				index += 1;
			}
			const existing = options[name];
			if (existing === void 0) options[name] = parsed;
			else if (Array.isArray(existing)) options[name] = [...existing, String(parsed)];
			else options[name] = [String(existing), String(parsed)];
		} else if (words.length < commandLimit) words.push(token);
		else positionals.push(token);
		index += 1;
	}
	if (words.length === 0) words.push("help");
	return {
		words,
		options,
		positionals,
		raw: [TOOL_NAME, ...args].join(" ")
	};
};
var outputFormat = (command) => {
	const raw = command.options.format;
	if (raw === void 0 || raw === "text") return "text";
	if (raw === "yaml") return "yaml";
	throw new UsageError("Invalid --format. Expected text or yaml.");
};
var quiet = (command) => command.options.quiet === true;
var renderText = (result, compact) => {
	const lines = [];
	lines.push(`Result: ${result.result}`);
	lines.push(`Command: ${result.command}`);
	if (!compact && result.summary !== void 0 && result.summary.length > 0) {
		lines.push("Summary:");
		lines.push(...result.summary.map((entry) => `- ${entry}`));
	}
	if (!compact && result.findings !== void 0 && result.findings.length > 0) {
		lines.push("Findings:");
		lines.push(...result.findings.map((entry) => `- ${entry}`));
	}
	lines.push("Created artifacts:");
	lines.push(...result.created_artifacts.length === 0 ? ["- none"] : result.created_artifacts.map((entry) => `- ${entry.path}`));
	lines.push("Changed artifacts:");
	lines.push(...result.changed_artifacts.length === 0 ? ["- none"] : result.changed_artifacts.map((entry) => `- ${entry.path}`));
	lines.push("Warnings:");
	lines.push(...result.warnings.length === 0 ? ["- none"] : result.warnings.map((entry) => `- ${entry}`));
	lines.push("Blockers:");
	lines.push(...result.blockers.length === 0 ? ["- none"] : result.blockers.map((entry) => `- ${entry}`));
	lines.push("Next actions:");
	lines.push(...result.next_actions.length === 0 ? ["1. none"] : result.next_actions.map((entry, index) => `${index + 1}. ${entry.command} - ${entry.reason}`));
	return lines.join("\n");
};
var renderYaml = (result) => browser_default.stringify({
	result: result.result,
	command: result.command.replace(/^dossier-engineer\s*/, ""),
	summary: result.summary ?? [],
	findings: result.findings ?? [],
	created_artifacts: result.created_artifacts,
	changed_artifacts: result.changed_artifacts,
	warnings: result.warnings,
	blockers: result.blockers,
	next_actions: result.next_actions
});
var runCli = async (args, io, version) => {
	try {
		if (args.length === 0 || args[0] === "-h" || args[0] === "--help" || args[0] === "help") {
			const requested = args[0] === "help" ? args.slice(1).join(" ") || void 0 : void 0;
			write(io.stdout, renderHelp(version, requested));
			return 0;
		}
		if (args[0] === "-v" || args[0] === "--version") {
			write(io.stdout, version);
			return 0;
		}
		const command = parse(args);
		const format = outputFormat(command);
		const commandResult = await runCommand(defaultContext(process.cwd()), command);
		write(io.stdout, format === "yaml" ? renderYaml(commandResult) : renderText(commandResult, quiet(command)));
		return commandResult.exitCode ?? (commandResult.result === "blocked" ? 2 : commandResult.result === "failed" ? 1 : 0);
	} catch (error) {
		const exitCode = error instanceof DossierError ? error.exitCode : 1;
		let format = "text";
		try {
			format = outputFormat(parse(args));
		} catch {
			format = "text";
		}
		const failure = {
			result: exitCode === 2 ? "blocked" : "failed",
			command: [TOOL_NAME, ...args].join(" "),
			created_artifacts: [],
			changed_artifacts: [],
			warnings: [],
			blockers: [error instanceof Error ? error.message : String(error)],
			next_actions: [{
				command: "dossier-engineer help",
				reason: "Review command usage and required options."
			}],
			exitCode
		};
		write(io.stdout, format === "yaml" ? renderYaml(failure) : renderText(failure, false));
		return exitCode;
	}
};
//#endregion
//#region src/cli.ts
var io = {
	stdout: process.stdout,
	stderr: process.stderr
};
process.exitCode = await runCli(process.argv.slice(2), io, package_default.version);
//#endregion
export { runCli };

//# sourceMappingURL=dossier-engineer.mjs.map