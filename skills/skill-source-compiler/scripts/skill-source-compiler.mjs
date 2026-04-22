#!/usr/bin/env node
import { parseArgs } from "node:util";
import { dirname, join, resolve } from "node:path";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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
var name = "@kostysh/skill-source-compiler-cli";
var version$1 = "0.1.0";
var description = "CLI utilities for the skill-source-compiler skill.";
var type = "module";
var bin = { "skill-source-compiler": "scripts/skill-source-compiler.mjs" };
var exports = { ".": "./scripts/skill-source-compiler.mjs" };
var files = ["scripts"];
var engines = { "node": ">=22.22.0" };
var scripts = {
	"build": "vite build && chmod +x scripts/skill-source-compiler.mjs",
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
//#region src/fs-utils.ts
/**
* Reads a UTF-8 text file.
*/
var readTextFile = async (path) => readFile(path, "utf8");
/**
* Writes a UTF-8 text file, creating parent directories as needed.
*/
var writeTextFile = async (path, content) => {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, content, "utf8");
};
/**
* Removes a directory if it exists.
*/
var removeDirectory = async (path) => {
	await rm(path, {
		force: true,
		recursive: true
	});
};
/**
* Copies a single file, creating parent directories as needed.
*/
var copyFilePortable = async (sourcePath, targetPath) => {
	await mkdir(dirname(targetPath), { recursive: true });
	await cp(sourcePath, targetPath);
};
/**
* Recursively walks a directory and returns relative file paths with forward slashes.
*/
var walkFiles = async (rootDir, relativeDir = "") => {
	const entries = await readdir(join(rootDir, relativeDir), { withFileTypes: true });
	const results = [];
	for (const entry of entries) {
		const relativePath = relativeDir === "" ? entry.name : `${relativeDir}/${entry.name}`;
		if (entry.isDirectory()) {
			results.push(...await walkFiles(rootDir, relativePath));
			continue;
		}
		if (entry.isFile()) results.push(relativePath);
	}
	return results.sort();
};
/**
* Checks whether a path exists and is a file.
*/
var fileExists = async (path) => {
	try {
		return (await stat(path)).isFile();
	} catch {
		return false;
	}
};
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
$constructor("ZodError", initializer);
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
function object(shape, params) {
	return new ZodObject({
		type: "object",
		shape: shape ?? {},
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
//#region src/schema.ts
var nonEmptyString = string().trim().min(1);
var descriptionString = nonEmptyString.max(1024);
var positiveInteger = number().int().positive();
var versionString = string().trim().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u, "Version must be semver-like.");
var skillName = string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Skill names must be lowercase kebab-case.").max(64);
var relativePortablePath = string().trim().min(1).refine((value) => !value.startsWith("/") && !/^[A-Za-z]:\\/u.test(value), { message: "Path must be relative." }).refine((value) => !value.includes("\\"), { message: "Use forward slashes in portable paths." }).refine((value) => !value.split("/").some((segment) => segment === ".."), { message: "Path traversal is not allowed." });
var supportGlob = relativePortablePath.refine((value) => !value.startsWith("references/") && !value.startsWith("assets/") && !value.startsWith("scripts/"), { message: "Supporting content should not live inside active runtime directories." });
var copiedFileSchema = object({
	id: nonEmptyString,
	source: relativePortablePath,
	target: relativePortablePath,
	description: nonEmptyString.optional()
});
var referenceSchema = copiedFileSchema.extend({
	title: nonEmptyString,
	trigger: nonEmptyString,
	required: boolean().default(false)
});
var interopRuleSchema = object({
	id: nonEmptyString,
	domain: nonEmptyString,
	winner: nonEmptyString,
	rationale: nonEmptyString
});
var workflowStageSchema = object({
	id: nonEmptyString,
	title: nonEmptyString,
	goal: nonEmptyString,
	steps: array(nonEmptyString).min(1),
	validation: array(nonEmptyString).default([])
});
var gotchaSchema = object({
	id: nonEmptyString,
	priority: _enum([
		"high",
		"medium",
		"low"
	]),
	text: nonEmptyString
});
var commandSchema = object({
	id: nonEmptyString,
	command: nonEmptyString,
	summary: nonEmptyString,
	when: nonEmptyString,
	script: relativePortablePath.optional(),
	inputs: array(nonEmptyString).default([]),
	outputs: array(nonEmptyString).default([]),
	tests: array(relativePortablePath).default([]),
	examples: array(nonEmptyString).default([])
});
var policySchema = object({
	id: nonEmptyString,
	title: nonEmptyString,
	text: nonEmptyString
});
var portabilitySchema = object({
	required: literal(true),
	rules: array(nonEmptyString).min(1),
	checklist: array(nonEmptyString).min(1)
});
var skillSourceSchema = object({
	apiVersion: literal("skillforge/v1alpha1"),
	kind: literal("SkillSource"),
	skill: object({
		name: skillName,
		"source-version": versionString,
		"recommended-skill-md-max-bytes": positiveInteger.default(2e4),
		description: descriptionString,
		license: nonEmptyString.optional(),
		compatibility: nonEmptyString.max(500).optional(),
		metadata: record(string(), string()).default({}),
		allowedTools: array(nonEmptyString).default([])
	}),
	fragments: record(string(), relativePortablePath).default({}),
	references: array(referenceSchema).default([]),
	assets: array(copiedFileSchema).default([]),
	copies: array(copiedFileSchema).default([]),
	supporting: array(copiedFileSchema).default([]),
	surfaces: object({
		active: object({
			requiredReferences: array(nonEmptyString).default([]),
			optionalReferences: array(nonEmptyString).default([])
		}),
		supportingGlobs: array(supportGlob).default([])
	}),
	sections: object({
		startHere: array(nonEmptyString).min(1),
		whenToUse: array(nonEmptyString).min(1),
		whenNotToUse: array(nonEmptyString).min(1),
		workflow: array(workflowStageSchema).min(1),
		interop: array(interopRuleSchema).default([]),
		commands: array(commandSchema).default([]),
		gotchas: array(gotchaSchema).default([]),
		policies: array(policySchema).default([]),
		portability: portabilitySchema
	})
});
var compiledFrontmatterSchema = object({
	name: skillName,
	description: descriptionString,
	license: nonEmptyString.optional(),
	compatibility: nonEmptyString.max(500).optional(),
	metadata: object({
		"source-version": versionString,
		"skillforge-source-manifest": nonEmptyString.optional(),
		"skillforge-source-hash": nonEmptyString.optional()
	}).catchall(string()),
	"allowed-tools": nonEmptyString.optional()
});
//#endregion
//#region src/text.ts
/**
* Normalizes text for duplicate detection.
*/
var normalizeText = (input) => input.toLowerCase().replace(/`+/g, "").replace(/\s+/g, " ").trim();
/**
* Computes a stable SHA-256 hash.
*/
var sha256 = (input) => createHash("sha256").update(input).digest("hex");
/**
* Detects whether a path-like string is an absolute filesystem path.
*/
var containsAbsolutePath = (input) => {
	return /(^|[\s"'`(])\/(?:home|Users|var|opt|tmp|etc|code|workspace|mnt)\//u.test(input) || /(^|[\s"'`(])(?:[A-Za-z]:\\)/u.test(input);
};
//#endregion
//#region src/check.ts
var finalizeResult = (diagnostics) => ({
	diagnostics,
	ok: diagnostics.every((entry) => entry.level !== "error")
});
var extractFrontmatter = (markdown) => {
	const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u);
	if (match === null) throw new Error("SKILL.md is missing YAML frontmatter.");
	return {
		body: match[2] ?? "",
		frontmatter: browser_default.parse(match[1] ?? "")
	};
};
/**
* Checks a compiled skill folder for portability and structural invariants.
*/
var checkCompiledSkill = async (skillDir) => {
	const diagnostics = [];
	const normalizedDir = resolve(skillDir);
	const skillMarkdownPath = resolve(normalizedDir, "SKILL.md");
	const markdown = await readTextFile(skillMarkdownPath).catch((error) => {
		diagnostics.push({
			code: "missing-skill-markdown",
			level: "error",
			message: `Could not read ${skillMarkdownPath}: ${error instanceof Error ? error.message : String(error)}`
		});
		return null;
	});
	if (markdown === null) return finalizeResult(diagnostics);
	let body = "";
	let frontmatter = {};
	try {
		const extracted = extractFrontmatter(markdown);
		body = extracted.body;
		frontmatter = extracted.frontmatter;
	} catch (error) {
		diagnostics.push({
			code: "missing-frontmatter",
			level: "error",
			message: error instanceof Error ? error.message : String(error)
		});
	}
	const parsedFrontmatter = compiledFrontmatterSchema.safeParse(frontmatter);
	if (!parsedFrontmatter.success) diagnostics.push({
		code: "invalid-frontmatter",
		level: "error",
		message: parsedFrontmatter.error.message
	});
	else {
		const folderName = normalizedDir.split(/[/\\]/u).at(-1);
		if (parsedFrontmatter.data.name !== folderName) diagnostics.push({
			code: "folder-name-mismatch",
			level: "error",
			message: `Frontmatter name ${parsedFrontmatter.data.name} does not match folder ${folderName}.`
		});
	}
	for (const heading of [
		"## Start here",
		"## When to use this skill",
		"## When NOT to use this skill",
		"## Required active references",
		"## Portability rules",
		"## Supporting and historical surface"
	]) if (!body.includes(heading)) diagnostics.push({
		code: "missing-heading",
		level: "error",
		message: `Generated SKILL.md is missing heading: ${heading}`
	});
	if (containsAbsolutePath(markdown)) diagnostics.push({
		code: "absolute-path-in-skill",
		level: "error",
		message: "Compiled SKILL.md contains an absolute path."
	});
	const relativeFiles = await walkFiles(normalizedDir);
	for (const relativePath of relativeFiles) {
		const content = await readTextFile(resolve(normalizedDir, relativePath)).catch(() => "");
		if (content !== "" && containsAbsolutePath(content)) diagnostics.push({
			code: "absolute-path-in-file",
			level: "error",
			message: `Compiled file contains an absolute path: ${relativePath}`
		});
	}
	const requiredReferenceLinks = [...markdown.matchAll(/\[[^\]]+\]\((references\/[^)]+)\)/gu)].map((match) => match[1]).filter((value) => value !== void 0);
	if (requiredReferenceLinks.length === 0) diagnostics.push({
		code: "no-reference-links",
		level: "error",
		message: "Compiled SKILL.md does not link to any reference file."
	});
	for (const referencePath of requiredReferenceLinks) if (!relativeFiles.includes(referencePath)) diagnostics.push({
		code: "missing-linked-reference",
		level: "error",
		message: `SKILL.md links to ${referencePath}, but the file is missing.`
	});
	return finalizeResult(diagnostics);
};
//#endregion
//#region src/errors.ts
var SkillforgeError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "SkillforgeError";
	}
};
//#endregion
//#region src/source-loader.ts
var packageManifestSchema = object({ version: string().trim().min(1) });
var collectReferencedPaths = (source) => {
	const result = ["skill.yaml"];
	result.push(...Object.values(source.fragments));
	for (const reference of source.references) result.push(reference.source);
	for (const asset of source.assets) result.push(asset.source);
	for (const copy of source.copies) result.push(copy.source);
	for (const supporting of source.supporting) result.push(supporting.source);
	return [...new Set(result)].sort();
};
/**
* Loads and validates a source skill bundle.
*/
var loadSourceBundle = async (rootDir) => {
	const normalizedRootDir = resolve(rootDir);
	const manifestPath = resolve(normalizedRootDir, "skill.yaml");
	const manifestContent = await readTextFile(manifestPath).catch((error) => {
		throw new SkillforgeError("missing-manifest", `Could not read ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`);
	});
	const rawDocument = browser_default.parse(manifestContent);
	const parsed = skillSourceSchema.safeParse(rawDocument);
	if (!parsed.success) throw new SkillforgeError("invalid-source", parsed.error.message);
	const source = parsed.data;
	const files = /* @__PURE__ */ new Map();
	for (const relativePath of collectReferencedPaths(source)) {
		const absolutePath = resolve(normalizedRootDir, relativePath);
		const content = await readTextFile(absolutePath).catch((error) => {
			throw new SkillforgeError("missing-source-file", `Could not read ${relativePath} from ${normalizedRootDir}: ${error instanceof Error ? error.message : String(error)}`);
		});
		files.set(relativePath, {
			absolutePath,
			content,
			relativePath
		});
	}
	const packageManifestPath = resolve(normalizedRootDir, "package.json");
	const hasPackageManifest = await fileExists(packageManifestPath);
	let packageVersion = null;
	if (hasPackageManifest) {
		const packageManifestContent = await readTextFile(packageManifestPath).catch((error) => {
			throw new SkillforgeError("invalid-package-manifest", `Could not read package.json from ${normalizedRootDir}: ${error instanceof Error ? error.message : String(error)}`);
		});
		let rawPackageDocument;
		try {
			rawPackageDocument = JSON.parse(packageManifestContent);
		} catch (error) {
			throw new SkillforgeError("invalid-package-manifest", `Could not parse package.json from ${normalizedRootDir}: ${error instanceof Error ? error.message : String(error)}`);
		}
		const parsedPackageManifest = packageManifestSchema.safeParse(rawPackageDocument);
		if (!parsedPackageManifest.success) throw new SkillforgeError("invalid-package-manifest", parsedPackageManifest.error.message);
		packageVersion = parsedPackageManifest.data.version;
		files.set("package.json", {
			absolutePath: packageManifestPath,
			content: packageManifestContent,
			relativePath: "package.json"
		});
	}
	return {
		files,
		manifestPath,
		packageVersion,
		rootDir: normalizedRootDir,
		source
	};
};
//#endregion
//#region src/lint.ts
var pushIf = (diagnostics, condition, level, code, message) => {
	if (condition) diagnostics.push({
		code,
		level,
		message
	});
};
var duplicateIds = (items) => {
	const seen = /* @__PURE__ */ new Set();
	const duplicates = /* @__PURE__ */ new Set();
	for (const item of items) {
		if (seen.has(item)) {
			duplicates.add(item);
			continue;
		}
		seen.add(item);
	}
	return [...duplicates].sort();
};
var detectDuplicateNormativeTexts = (texts) => {
	const counts = /* @__PURE__ */ new Map();
	for (const text of texts) {
		const normalized = normalizeText(text);
		if (normalized.length < 24) continue;
		counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
	}
	return [...counts.entries()].filter(([, count]) => count > 1).map(([text]) => text).sort();
};
var lintLoadedBundle = async (loaded) => {
	const diagnostics = [];
	const { source } = loaded;
	const ids = [
		...source.references.map((entry) => entry.id),
		...source.assets.map((entry) => entry.id),
		...source.copies.map((entry) => entry.id),
		...source.supporting.map((entry) => entry.id),
		...source.sections.workflow.map((entry) => entry.id),
		...source.sections.interop.map((entry) => entry.id),
		...source.sections.commands.map((entry) => entry.id),
		...source.sections.gotchas.map((entry) => entry.id),
		...source.sections.policies.map((entry) => entry.id)
	];
	for (const duplicateId of duplicateIds(ids)) diagnostics.push({
		code: "duplicate-id",
		level: "error",
		message: `Duplicate id detected: ${duplicateId}`
	});
	const targetPaths = [
		...source.references.map((entry) => entry.target),
		...source.assets.map((entry) => entry.target),
		...source.copies.map((entry) => entry.target),
		...source.supporting.map((entry) => entry.target)
	];
	for (const duplicateTarget of duplicateIds(targetPaths)) diagnostics.push({
		code: "duplicate-target",
		level: "error",
		message: `Multiple emitted files target the same path: ${duplicateTarget}`
	});
	const requiredReferenceIds = new Set(source.surfaces.active.requiredReferences);
	const optionalReferenceIds = new Set(source.surfaces.active.optionalReferences);
	for (const referenceId of requiredReferenceIds) pushIf(diagnostics, !source.references.some((entry) => entry.id === referenceId), "error", "unknown-required-reference", `Required reference id is not declared in references: ${referenceId}`);
	for (const referenceId of optionalReferenceIds) pushIf(diagnostics, !source.references.some((entry) => entry.id === referenceId), "error", "unknown-optional-reference", `Optional reference id is not declared in references: ${referenceId}`);
	for (const reference of source.references) if (reference.required && !requiredReferenceIds.has(reference.id)) diagnostics.push({
		code: "unreachable-required-reference",
		level: "error",
		message: `Reference ${reference.id} is marked required but is not listed in surfaces.active.requiredReferences.`
	});
	for (const entry of [
		...source.references,
		...source.assets,
		...source.copies,
		...source.supporting
	]) pushIf(diagnostics, containsAbsolutePath(entry.description ?? ""), "error", "absolute-path-in-description", `Description for ${entry.id} contains an absolute path hint.`);
	const normativeTexts = [
		...source.sections.startHere,
		...source.sections.whenToUse,
		...source.sections.whenNotToUse,
		...source.sections.workflow.flatMap((entry) => [
			entry.goal,
			...entry.steps,
			...entry.validation
		]),
		...source.sections.interop.flatMap((entry) => [
			entry.domain,
			entry.winner,
			entry.rationale
		]),
		...source.sections.commands.flatMap((entry) => [
			entry.command,
			entry.summary,
			entry.when,
			...entry.inputs,
			...entry.outputs
		]),
		...source.sections.gotchas.map((entry) => entry.text),
		...source.sections.policies.flatMap((entry) => [entry.title, entry.text]),
		...source.sections.portability.rules,
		...source.sections.portability.checklist
	];
	for (const duplicateText of detectDuplicateNormativeTexts(normativeTexts)) diagnostics.push({
		code: "duplicated-guidance",
		level: "warning",
		message: `Potential duplicate guidance detected: ${duplicateText}`
	});
	for (const command of source.sections.commands) {
		pushIf(diagnostics, command.script === void 0, "error", "missing-command-runtime", `Command ${command.id} does not declare a runtime script.`);
		if (command.script !== void 0) pushIf(diagnostics, !source.copies.some((entry) => entry.target === command.script), "error", "missing-command-script", `Command ${command.id} references ${command.script}, but no copied runtime file emits that path.`);
		for (const testPath of command.tests) {
			pushIf(diagnostics, !await fileExists(resolve(loaded.rootDir, testPath)), "error", "missing-command-test", `Command ${command.id} expects test file ${testPath}, but it does not exist.`);
			pushIf(diagnostics, !source.copies.some((entry) => entry.target === testPath), "error", "missing-command-test-copy", `Command ${command.id} references ${testPath}, but no copied runtime file emits that path.`);
		}
	}
	pushIf(diagnostics, source.sections.commands.length > 0 && loaded.packageVersion === null, "error", "missing-package-manifest", "Command-bearing source bundles must include package.json so the shipped CLI version can be tracked separately.");
	const referencesToSupportingTargets = new Set(source.supporting.map((entry) => entry.target));
	for (const reference of source.references) pushIf(diagnostics, referencesToSupportingTargets.has(reference.target), "error", "surface-conflict", `Target ${reference.target} is declared as both active and supporting content.`);
	return {
		diagnostics,
		loaded,
		ok: diagnostics.every((entry) => entry.level !== "error")
	};
};
/**
* Lints a structured source bundle.
*/
var lintSourceBundle = async (rootDir) => lintLoadedBundle(await loadSourceBundle(rootDir));
//#endregion
//#region src/renderer.ts
var renderBulletList = (items) => items.map((item) => `- ${item}`).join("\n");
var renderNumberedList = (items) => items.map((item, index) => `${index + 1}. ${item}`).join("\n");
var renderFrontmatter = (loaded) => {
	const { source } = loaded;
	const frontmatter = {
		name: source.skill.name,
		description: source.skill.description,
		...source.skill.license === void 0 ? {} : { license: source.skill.license },
		...source.skill.compatibility === void 0 ? {} : { compatibility: source.skill.compatibility },
		metadata: {
			"source-version": source.skill["source-version"],
			...source.skill.metadata,
			"skillforge-source-manifest": "skill.yaml",
			"skillforge-source-hash": sha256(JSON.stringify(source))
		},
		...source.skill.allowedTools.length === 0 ? {} : { "allowed-tools": source.skill.allowedTools.join(" ") }
	};
	return `---\n${browser_default.stringify(frontmatter).trimEnd()}\n---`;
};
var renderReferenceList = (loaded, referenceIds, heading) => {
	const references = referenceIds.map((referenceId) => loaded.source.references.find((entry) => entry.id === referenceId)).filter((entry) => entry !== void 0);
	if (references.length === 0) return null;
	return `## ${heading}\n${references.map((reference) => `- [${reference.title}](${reference.target}) — ${reference.trigger}`).join("\n")}`;
};
var renderCommands = (loaded) => {
	const { commands } = loaded.source.sections;
	if (commands.length === 0) return null;
	return `## Runnable commands\n${commands.map((command) => {
		const details = [
			`**Use when:** ${command.when}`,
			`**Summary:** ${command.summary}`,
			...command.script === void 0 ? [] : [`**Runtime script:** \`${command.script}\``],
			...command.inputs.length === 0 ? [] : [`**Inputs:** ${command.inputs.join("; ")}`],
			...command.outputs.length === 0 ? [] : [`**Outputs:** ${command.outputs.join("; ")}`],
			...command.tests.length === 0 ? [] : [`**Tests:** ${command.tests.map((item) => `\`${item}\``).join(", ")}`],
			...command.examples.length === 0 ? [] : [`**Examples:** ${command.examples.join("; ")}`]
		];
		return `### CLI command: \`${command.command}\`\n${details.join("\n\n")}`;
	}).join("\n\n")}`;
};
/**
* Renders the generated SKILL.md content.
*/
var renderSkillMarkdown = (loaded) => {
	const { source, files } = loaded;
	const overview = source.fragments.overview === void 0 ? null : files.get(source.fragments.overview)?.content.trim() ?? null;
	const finalChecks = source.fragments.finalChecks === void 0 ? null : files.get(source.fragments.finalChecks)?.content.trim() ?? null;
	const parts = [
		renderFrontmatter(loaded),
		`# ${source.skill.name}`,
		"## Start here",
		renderNumberedList(source.sections.startHere),
		"## When to use this skill",
		renderBulletList(source.sections.whenToUse),
		"## When NOT to use this skill",
		renderBulletList(source.sections.whenNotToUse)
	];
	if (overview !== null && overview.length > 0) parts.push("## Overview", overview);
	const workflow = source.sections.workflow.map((stage) => {
		const lines = [
			`### Workflow stage: ${stage.title}`,
			stage.goal,
			renderNumberedList(stage.steps)
		];
		if (stage.validation.length > 0) lines.push("Validation:", renderBulletList(stage.validation));
		return lines.join("\n\n");
	}).join("\n\n");
	parts.push("## Workflow stages", workflow);
	if (source.sections.interop.length > 0) {
		const interop = source.sections.interop.map((entry) => `- **${entry.domain}:** ${entry.winner}. ${entry.rationale}`).join("\n");
		parts.push("## Interop priority", interop);
	}
	const commandsSection = renderCommands(loaded);
	if (commandsSection !== null) parts.push(commandsSection);
	if (source.sections.gotchas.length > 0) {
		const gotchas = source.sections.gotchas.map((entry) => `- **${entry.priority}** — ${entry.text}`).join("\n");
		parts.push("## Gotchas", gotchas);
	}
	if (source.sections.policies.length > 0) {
		const policies = source.sections.policies.map((entry) => `### ${entry.title}\n${entry.text}`).join("\n\n");
		parts.push("## Policies", policies);
	}
	const requiredReferences = renderReferenceList(loaded, source.surfaces.active.requiredReferences, "Required active references");
	if (requiredReferences !== null) parts.push(requiredReferences);
	const optionalReferences = renderReferenceList(loaded, source.surfaces.active.optionalReferences, "Optional references");
	if (optionalReferences !== null) parts.push(optionalReferences);
	if (source.assets.length > 0) {
		const assets = source.assets.map((entry) => `- \`${entry.target}\`${entry.description === void 0 ? "" : ` — ${entry.description}`}`).join("\n");
		parts.push("## Bundled assets", assets);
	}
	parts.push("## Portability rules", renderBulletList(source.sections.portability.rules), "## Portability checklist before finishing", renderBulletList(source.sections.portability.checklist), "## Supporting and historical surface", ["- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.", ...source.surfaces.supportingGlobs.map((item) => `- Supporting glob: \`${item}\``)].join("\n"));
	if (finalChecks !== null && finalChecks.length > 0) parts.push("## Final checks", finalChecks);
	return `${parts.join("\n\n").trim()}\n`;
};
/**
* Renders a non-normative compile report.
*/
var renderCompileReport = (loaded, warnings) => {
	const sourceFiles = [...loaded.files.keys()].sort().map((item) => `- \`${item}\``).join("\n");
	const versionLines = [`- Skill source version: \`${loaded.source.skill["source-version"]}\``, ...loaded.packageVersion === null ? [] : [`- CLI package version: \`${loaded.packageVersion}\``]].join("\n");
	const requiredReferences = loaded.source.references.filter((reference) => reference.required).map((reference) => `- \`${reference.target}\``).join("\n");
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
		"- It does not override `SKILL.md`."
	].join("\n");
};
//#endregion
//#region src/compiler.ts
var buildSkillMarkdownSizeWarning = (currentSizeBytes, recommendedMaxBytes) => `Generated SKILL.md is ${currentSizeBytes} bytes, above the recommended maximum ${recommendedMaxBytes} bytes. Move detailed guidance into references/* and keep SKILL.md focused on activation, workflow, and navigation. Raise skill.recommended-skill-md-max-bytes only when references cannot reasonably reduce the size.`;
/**
* Compiles a source bundle into a standard skill folder.
*/
var compileSourceBundle = async (sourceDir, options) => {
	const lint = await lintSourceBundle(sourceDir);
	if (!lint.ok) throw new SkillforgeError("lint-failed", `Cannot compile source bundle with lint errors:\n${lint.diagnostics.map((entry) => `[${entry.level}] ${entry.code}: ${entry.message}`).join("\n")}`);
	const { loaded } = lint;
	const outputDir = resolve(options.outDir, loaded.source.skill.name);
	if (options.clean ?? true) await removeDirectory(outputDir);
	const renderedSkillMarkdown = renderSkillMarkdown(loaded);
	const warnings = lint.diagnostics.filter((entry) => entry.level === "warning").map((entry) => entry.message);
	const skillMarkdownSizeBytes = Buffer.byteLength(renderedSkillMarkdown, "utf8");
	const recommendedMaxBytes = loaded.source.skill["recommended-skill-md-max-bytes"];
	if (skillMarkdownSizeBytes > recommendedMaxBytes) warnings.push(buildSkillMarkdownSizeWarning(skillMarkdownSizeBytes, recommendedMaxBytes));
	await writeTextFile(resolve(outputDir, "SKILL.md"), renderedSkillMarkdown);
	await writeTextFile(resolve(outputDir, "docs/compile-report.md"), renderCompileReport(loaded, warnings));
	for (const file of loaded.source.references) await copyFilePortable(resolve(loaded.rootDir, file.source), resolve(outputDir, file.target));
	for (const file of loaded.source.assets) await copyFilePortable(resolve(loaded.rootDir, file.source), resolve(outputDir, file.target));
	for (const file of loaded.source.copies) await copyFilePortable(resolve(loaded.rootDir, file.source), resolve(outputDir, file.target));
	for (const file of loaded.source.supporting) await copyFilePortable(resolve(loaded.rootDir, file.source), resolve(outputDir, file.target));
	return {
		outputDir,
		warnings
	};
};
/**
* Compiles every source bundle contained in a directory.
*/
var compileAllSourceBundles = async (sourcesRoot, options) => {
	const { readdir } = await import("node:fs/promises");
	const entries = await readdir(sourcesRoot, { withFileTypes: true });
	const results = [];
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		results.push(await compileSourceBundle(resolve(sourcesRoot, entry.name), options));
	}
	return results;
};
//#endregion
//#region src/run-cli.ts
var TOOL_NAME = "skill-source-compiler";
var RUNTIME_SCRIPT = "scripts/skill-source-compiler.mjs";
var EXIT_SUCCESS = 0;
var EXIT_FAILURE = 1;
var EXIT_USAGE = 2;
var EXIT_INTERNAL = 3;
var CliUsageError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "CliUsageError";
	}
};
var COMMANDS = {
	check: {
		summary: "Validate a compiled skill folder for frontmatter, headings, links, and portability invariants.",
		usage: [`node ${RUNTIME_SCRIPT} check <compiled-skill-dir>`]
	},
	compile: {
		summary: "Compile one source bundle into a skill folder under the provided output directory.",
		usage: [`node ${RUNTIME_SCRIPT} compile <source-dir> --out-dir <skills-dir>`]
	},
	"compile-all": {
		summary: "Compile every source bundle found directly under the provided sources root.",
		usage: [`node ${RUNTIME_SCRIPT} compile-all <sources-root> --out-dir <skills-dir>`]
	},
	lint: {
		summary: "Validate a source bundle without writing output files.",
		usage: [`node ${RUNTIME_SCRIPT} lint <source-dir>`]
	}
};
var writeLine = (stream, value = "") => {
	stream.write(`${value}\n`);
};
var formatDiagnostics = (diagnostics) => diagnostics.map((entry) => `[${entry.level}] ${entry.code}: ${entry.message}`).join("\n");
var renderGlobalHelp = (version) => [
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
	`Run \`${TOOL_NAME} help <command>\` for command-local examples.`
].join("\n");
var renderCommandHelp = (command) => {
	if (command === "help") return [
		"help - Show global help or command-local help.",
		"",
		"Usage:",
		`  node ${RUNTIME_SCRIPT} --help`,
		`  node ${RUNTIME_SCRIPT} help <command>`,
		"",
		"Supported commands:",
		...Object.keys(COMMANDS).map((name) => `  - ${name}`)
	].join("\n");
	const details = COMMANDS[command];
	return [
		`${command} - ${details.summary}`,
		"",
		"Usage:",
		...details.usage.map((entry) => `  ${entry}`),
		"",
		"Exit codes:",
		"  0 success",
		command === "compile" || command === "compile-all" ? "  1 source validation or file-system failure" : "  1 command found validation issues",
		"  2 usage error",
		"  3 unexpected internal failure"
	].join("\n");
};
var toUsageError = (error) => new CliUsageError(error instanceof Error ? error.message : String(error));
var parseOutDirArgs = (args) => {
	try {
		return parseArgs({
			allowPositionals: true,
			args,
			options: { "out-dir": { type: "string" } },
			strict: true
		});
	} catch (error) {
		throw toUsageError(error);
	}
};
var isHelpFlag = (value) => value === "-h" || value === "--help";
var resolveCommand = (rawCommand) => {
	if (rawCommand === void 0 || rawCommand === "help") return "help";
	if (rawCommand === "lint" || rawCommand === "compile" || rawCommand === "compile-all" || rawCommand === "check") return rawCommand;
	return null;
};
var ensureSinglePositional = (commandName, positionals, expected) => {
	if (positionals.length !== 1 || positionals[0] === void 0) throw new CliUsageError(`${commandName} requires ${expected}.`);
	return positionals[0];
};
var runCli = async (args, io, version) => {
	try {
		const [command, ...rest] = args;
		if (command === void 0 || isHelpFlag(command)) {
			writeLine(io.stdout, renderGlobalHelp(version));
			return EXIT_SUCCESS;
		}
		if (command === "-v" || command === "--version") {
			writeLine(io.stdout, version);
			return EXIT_SUCCESS;
		}
		if (command === "help") {
			const requestedCommand = resolveCommand(rest[0]);
			if (rest.length > 1) throw new CliUsageError("help accepts at most one command name.");
			if (rest[0] !== void 0 && requestedCommand === null) throw new CliUsageError(`Unknown command: ${rest[0]}`);
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
				if (result.diagnostics.length > 0) writeLine(io.stdout, formatDiagnostics(result.diagnostics));
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
				if (outDir === void 0) throw new CliUsageError("compile requires --out-dir <skills-dir>.");
				const result = await compileSourceBundle(sourceDir, { outDir });
				writeLine(io.stdout, `Compiled ${sourceDir} -> ${result.outputDir}`);
				if (result.warnings.length > 0) {
					writeLine(io.stdout, "Warnings:");
					for (const warning of result.warnings) writeLine(io.stdout, `- ${warning}`);
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
				if (outDir === void 0) throw new CliUsageError("compile-all requires --out-dir <skills-dir>.");
				const results = await compileAllSourceBundles(sourcesRoot, { outDir });
				writeLine(io.stdout, `Compiled ${results.length} source bundle(s).`);
				for (const result of results) {
					writeLine(io.stdout, `- ${result.outputDir}`);
					if (result.warnings.length > 0) {
						writeLine(io.stdout, "  Warnings:");
						for (const warning of result.warnings) writeLine(io.stdout, `  - ${warning}`);
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
				if (result.diagnostics.length > 0) writeLine(io.stdout, formatDiagnostics(result.diagnostics));
				return result.ok ? EXIT_SUCCESS : EXIT_FAILURE;
			}
			default: throw new CliUsageError(`Unknown command: ${command}`);
		}
	} catch (error) {
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
//#endregion
//#region src/cli.ts
var io = {
	stdout: process.stdout,
	stderr: process.stderr
};
process.exitCode = await runCli(process.argv.slice(2), io, package_default.version);
//#endregion
export { runCli };

//# sourceMappingURL=skill-source-compiler.mjs.map