#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { promises } from "node:fs";
import path from "node:path";
//#region package.json
var name = "@kostysh/dossier-engineer-cli";
var version = "0.1.0";
var description = "CLI utilities for the dossier-engineer skill.";
var type = "module";
var bin = { "dossier": "scripts/dossier.mjs" };
var exports = { ".": "./scripts/dossier.mjs" };
var files = ["scripts"];
var engines = { "node": ">=22.22.0" };
var scripts = {
	"build": "vite build && chmod +x scripts/dossier.mjs",
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
var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR$1;
var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
function isCollection(node) {
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
var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
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
		if (isCollection(node)) {
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
		if (isCollection(node)) {
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
	if (isScalar(node)) return visitor.Scalar?.(key, node, path);
	if (isAlias(node)) return visitor.Alias?.(key, node, path);
}
function replaceNode(key, path, node) {
	const parent = path[path.length - 1];
	if (isCollection(parent)) parent.items[key] = node;
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
				if (typeof ref === "object" && ref.anchor && (isScalar(ref.node) || isCollection(ref.node))) ref.node.anchor = ref.anchor;
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
	} else if (isCollection(node)) {
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
			if (isCollection(node)) node.addIn(rest, value);
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
		if (isCollection(node)) return node.deleteIn(rest);
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
		if (rest.length === 0) return !keepScalar && isScalar(node) ? node.value : node;
		else return isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
	}
	hasAllNullValues(allowScalar) {
		return this.items.every((node) => {
			if (!isPair(node)) return false;
			const n = node.value;
			return n == null || allowScalar && isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
		});
	}
	/**
	* Checks if the collection includes a value with the key `key`.
	*/
	hasIn(path) {
		const [key, ...rest] = path;
		if (rest.length === 0) return this.has(key);
		const node = this.get(key, true);
		return isCollection(node) ? node.hasIn(rest) : false;
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
			if (isCollection(node)) node.setIn(rest, value);
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
	if (isScalar(item)) {
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
	const anchor = (isScalar(node) || isCollection(node)) && node.anchor;
	if (anchor && anchorIsValid(anchor)) {
		anchors.add(anchor);
		props.push(`&${anchor}`);
	}
	const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
	if (tag) props.push(doc.directives.tagString(tag));
	return props.join(" ");
}
function stringify(item, ctx, onComment, onChompKeep) {
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
	const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : isScalar(node) ? stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
	if (!props) return str;
	return isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}\n${ctx.indent}${str}`;
}
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/browser/dist/stringify/stringifyPair.js
function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
	const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
	let keyComment = isNode(key) && key.comment || null;
	if (simpleKeys) {
		if (keyComment) throw new Error("With simple keys, key nodes cannot have comments");
		if (isCollection(key) || !isNode(key) && typeof key === "object") throw new Error("With simple keys, collection cannot be used as a key value");
	}
	let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || isCollection(key) || (isScalar(key) ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL : typeof key === "object"));
	ctx = Object.assign({}, ctx, {
		allNullValues: false,
		implicitKey: !explicitKey && (simpleKeys || !allNullValues),
		indent: indent + indentStep
	});
	let keyCommentDone = false;
	let chompKeep = false;
	let str = stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
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
	if (!explicitKey && !keyComment && isScalar(value)) ctx.indentAtStart = str.length + 1;
	chompKeep = false;
	if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && isSeq(value) && !value.flow && !value.tag && !value.anchor) ctx.indent = ctx.indent.substring(2);
	let valueCommentDone = false;
	const valueStr = stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
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
	} else if (!explicitKey && isCollection(value)) {
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
var isMergeKey = (ctx, key) => (merge.identify(key) || isScalar(key) && (!key.type || key.type === Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
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
		let str = stringify(item, itemCtx, () => comment = null, () => chompKeep = true);
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
		let str = stringify(item, itemCtx, () => comment = null);
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
	const k = isScalar(key) ? key.value : key;
	for (const it of items) if (isPair(it)) {
		if (it.key === key || it.key === k) return it;
		if (isScalar(it.key) && it.key.value === k) return it;
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
			if (isScalar(prev.value) && isScalarValue(_pair.value)) prev.value.value = _pair.value;
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
		return (!keepScalar && isScalar(node) ? node.value : node) ?? void 0;
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
		return !keepScalar && isScalar(it) ? it.value : it;
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
		if (isScalar(prev) && isScalarValue(value)) prev.value = value;
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
	let idx = isScalar(key) ? key.value : key;
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
		for (const { key } of pairs.items) if (isScalar(key)) if (seenKeys.includes(key.value)) onError(`Ordered maps must not include duplicate keys: ${key.value}`);
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
		return !keepPair && isPair(pair) ? isScalar(pair.key) ? pair.key.value : pair.key : pair;
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
		let body = stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
		if (contentComment) body += lineComment(body, "", commentString(contentComment));
		if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") lines[lines.length - 1] = `--- ${body}`;
		else lines.push(body);
	} else lines.push(stringify(doc.contents, ctx));
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
		if (flow && isCollection(node)) node.flow = true;
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
		return isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
	}
	/**
	* Returns item at `path`, or `undefined` if not found. By default unwraps
	* scalar values from their surrounding node; to disable set `keepScalar` to
	* `true` (collections are always returned intact).
	*/
	getIn(path, keepScalar) {
		if (isEmptyPath(path)) return !keepScalar && isScalar(this.contents) ? this.contents.value : this.contents;
		return isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
	}
	/**
	* Checks if the document includes a value with the key `key`.
	*/
	has(key) {
		return isCollection(this.contents) ? this.contents.has(key) : false;
	}
	/**
	* Checks if the document includes a value at `path`.
	*/
	hasIn(path) {
		if (isEmptyPath(path)) return this.contents !== void 0;
		return isCollection(this.contents) ? this.contents.hasIn(path) : false;
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
	if (isCollection(contents)) return true;
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
	const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || isScalar(a) && isScalar(b) && a.value === b.value;
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
		scalar = isScalar(res) ? res : new Scalar(res);
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
	if (atKey && ctx.options.stringKeys && (!isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) onError(tag ?? token, "NON_STRING_KEY", "With stringKeys, all keys must be strings");
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
			else if (isCollection(dc) && !dc.flow && dc.items.length > 0) {
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
function parse(src, reviver, options) {
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
//#endregion
//#region src/lib/frontmatter.ts
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
		const parsed = parse(extracted.raw);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
	} catch {}
	return parseWithFallback(extracted.raw);
}
//#endregion
//#region src/lib/fs-utils.ts
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
//#region src/lib/dossier-utils.ts
var DEFAULT_DOSSIERS_DIR = "docs/features";
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
//#region src/lib/git-utils.ts
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
	const envBase = process.env.GITHUB_BASE_REF || process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME || process.env.CHANGE_TARGET;
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
//#region src/lib/lifecycle-telemetry.ts
var LIFECYCLE_STAGES = [
	"feature-intake",
	"spec-compact",
	"plan-slice",
	"implementation"
];
function toNullableString(value) {
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
	const featureId = toNullableString(metadata.feature_id);
	const featureCycleId = toNullableString(metadata.feature_cycle_id);
	const stage = toNullableString(metadata.command) === "feature-intake" ? "feature-intake" : toNullableString(metadata.stage);
	if (!featureId || !featureCycleId || !stage || !LIFECYCLE_STAGES.includes(stage)) return null;
	return {
		path: absPath,
		pathRel: path.relative(root, absPath).split(path.sep).join("/"),
		metadata,
		featureId,
		featureCycleId,
		stage,
		cycleId: toNullableString(metadata.cycle_id),
		backlogItemKey: toNullableString(metadata.backlog_item_key),
		sessionId: toNullableString(metadata.session_id),
		traceRuntime: toNullableString(metadata.trace_runtime) ?? "codex",
		traceLocatorKind: toNullableString(metadata.trace_locator_kind) ?? "session_id",
		startTs: toNullableString(metadata.start_ts),
		intakeProcessCompleteTs: toNullableString(metadata.intake_process_complete_ts),
		localGatesGreenTs: toNullableString(metadata.local_gates_green_ts),
		processCompleteTs: toNullableString(metadata.process_complete_ts),
		stepCloseTs: toNullableString(metadata.step_close_ts),
		stepArtifact: toNullableString(metadata.step_artifact),
		firstReviewAgentStartedTs: toNullableString(metadata.first_review_agent_started_ts),
		finalPassTs: toNullableString(metadata.final_pass_ts)
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
	const absPath = path.resolve(root, log.stepArtifact);
	if (!await fileExists(absPath)) return null;
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
	await writeTextAtomic(outputPath, `${merged.map((record) => JSON.stringify(record)).join("\n")}${merged.length > 0 ? "\n" : ""}`);
	return outputPath;
}
async function refreshLifecycleArtifacts(options) {
	const root = path.resolve(options.root);
	const logs = await loadLifecycleLogs(root, options.featureId);
	const featureCycleId = chooseFeatureCycleId(logs, options.featureCycleId ?? null);
	const cycleLogs = logs.filter((log) => log.featureCycleId === featureCycleId);
	if (cycleLogs.length === 0) throw new Error(`No lifecycle logs were found for feature ${options.featureId} and feature_cycle_id ${featureCycleId}.`);
	const grouped = /* @__PURE__ */ new Map();
	for (const stage of LIFECYCLE_STAGES) grouped.set(stage, cycleLogs.filter((log) => log.stage === stage).sort(compareByTimestamp));
	const intake = aggregateStage(grouped.get("feature-intake") ?? []);
	const specCompact = aggregateStage(grouped.get("spec-compact") ?? []);
	const planSlice = aggregateStage(grouped.get("plan-slice") ?? []);
	const implementation = aggregateStage(grouped.get("implementation") ?? []);
	implementation.processCompleteTs = await validateImplementationClosure(root, options.featureId, grouped.get("implementation") ?? []);
	const backlogItemKey = cycleLogs.find((log) => log.backlogItemKey)?.backlogItemKey ?? null;
	const sessionIndexRecords = await buildSessionIndexRecords(root, cycleLogs, featureCycleId);
	const snapshot = {
		version: 1,
		generated_at: (/* @__PURE__ */ new Date()).toISOString(),
		feature_id: options.featureId,
		feature_cycle_id: featureCycleId,
		identity: {
			feature_id: options.featureId,
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
				}
			}
		},
		metrics: {
			phase_cycle_time_ms: {
				"feature-intake": diffMillis(intake.startTs, intake.intakeProcessCompleteTs),
				"spec-compact": diffMillis(specCompact.startTs, specCompact.processCompleteTs),
				"plan-slice": diffMillis(planSlice.startTs, planSlice.processCompleteTs),
				implementation: diffMillis(implementation.startTs, implementation.processCompleteTs)
			},
			review_loop_time_ms: diffMillis(earliestTimestamp([
				specCompact.firstReviewAgentStartedTs,
				planSlice.firstReviewAgentStartedTs,
				implementation.firstReviewAgentStartedTs
			]), latestTimestamp([
				specCompact.finalPassTs,
				planSlice.finalPassTs,
				implementation.finalPassTs
			])),
			rerounds_per_feature: countRerounds(specCompact) + countRerounds(planSlice) + countRerounds(implementation),
			first_pass_close: implementation.processCompleteTs === null ? null : countRerounds(specCompact) + countRerounds(planSlice) + countRerounds(implementation) === 0,
			closure_latency_ms: diffMillis(implementation.localGatesGreenTs, implementation.stepCloseTs),
			verification_failures_total: countVerificationFailures(specCompact) + countVerificationFailures(planSlice) + countVerificationFailures(implementation),
			backlog_actualization_failures_total: countBacklogFailures(specCompact) + countBacklogFailures(planSlice) + countBacklogFailures(implementation) + countBacklogFailures(intake),
			operator_interventions_total: countOperatorInterventions(specCompact) + countOperatorInterventions(planSlice) + countOperatorInterventions(implementation) + countOperatorInterventions(intake)
		},
		session_index_records: sessionIndexRecords
	};
	const metricsPath = path.join(root, ".dossier", "metrics", options.featureId, `${featureCycleId}.json`);
	await writeJsonAtomic(metricsPath, snapshot);
	const sessionIndexPath = await writeSessionIndex(root, sessionIndexRecords);
	return {
		featureId: options.featureId,
		featureCycleId,
		snapshot,
		metricsPath,
		sessionIndexPath
	};
}
//#endregion
//#region src/core/markdown.ts
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
//#region src/core/lint-dossiers.ts
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
//#region src/core/workflow.ts
var WORKFLOW_STAGES = new Set([
	"spec-compact",
	"plan-slice",
	"implementation",
	"change-proposal",
	"adr-log",
	"dependency-check"
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
//#region src/commands.ts
var CLI_DISPLAY_NAME = "node scripts/dossier.mjs";
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
function takeManyOptions(argv, name) {
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
function ensureRequired(value, message, helpText) {
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
		"node",
		"scripts/dossier.mjs",
		commandName,
		...args
	]);
}
function slugify(value) {
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
async function readJsonArtifact(root, artifactPath) {
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
	return COMMANDS.find((command) => command.name === name || command.aliases.includes(name));
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
		"  --backlog-item-key <key>     Selected backlog item key from backlog-engineer. Required.",
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
		"  --output <path>              Optional dossier output path directly inside docs/features.",
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
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	if (argv.includes("--selected-work") || argv.some((arg) => arg.startsWith("--selected-work="))) throw new UsageError("--selected-work is no longer supported. Use --backlog-item-key, --backlog-delivery-state, and at least one --backlog-source.", helpText);
	const title = ensureRequired(takeOption(argv, "--title", null), "--title is required.", helpText);
	const backlogItemKey = ensureRequired(takeOption(argv, "--backlog-item-key", null), "--backlog-item-key is required.", helpText);
	const backlogDeliveryState = ensureEnumValue(ensureRequired(takeOption(argv, "--backlog-delivery-state", null), "--backlog-delivery-state is required.", helpText), BACKLOG_DELIVERY_STATES, "--backlog-delivery-state", helpText);
	const backlogSources = ensureNonEmpty(takeManyOptions(argv, "--backlog-source"), "At least one --backlog-source is required.", helpText);
	const backlogDependencies = takeManyOptions(argv, "--backlog-dependency");
	const backlogBlockers = takeManyOptions(argv, "--backlog-blocker");
	const area = ensureRequired(takeOption(argv, "--area", null), "--area is required.", helpText);
	const owners = takeManyOptions(argv, "--owner");
	const impacts = takeManyOptions(argv, "--impact");
	const dependsOn = takeManyOptions(argv, "--depends-on");
	const output = takeOption(argv, "--output", null);
	const json = hasOption(argv, "--json");
	const slug = takeOption(argv, "--slug", slugify(title)) ?? slugify(title);
	if (owners.length === 0) throw new UsageError("At least one --owner is required.", helpText);
	if (impacts.length === 0) throw new UsageError("At least one --impact is required.", helpText);
	const absRoot = path.resolve(root);
	const absDossiersDir = path.resolve(absRoot, DEFAULT_DOSSIERS_DIR);
	const featureId = nextFeatureId(await fileExists(absDossiersDir) ? await readAllDossiers(absRoot, DEFAULT_DOSSIERS_DIR, { strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES }) : []);
	const defaultRelPath = path.join(DEFAULT_DOSSIERS_DIR, `${featureId}-${slug}.md`);
	const outputPath = output ? path.resolve(absRoot, output) : path.resolve(absRoot, defaultRelPath);
	const outputBaseName = path.basename(outputPath);
	const outputDir = path.dirname(outputPath);
	if (!isDossierFile(outputBaseName) || !matchesFeatureFile(featureId, outputBaseName)) throw new UsageError("--output must point to a dossier file named like docs/features/F-XXXX-slug.md for the allocated feature id.", helpText);
	if (outputDir !== absDossiersDir) throw new UsageError("--output must point to a dossier file directly inside docs/features for the current repository root.", helpText);
	await promises.mkdir(absDossiersDir, { recursive: true });
	const realRoot = await promises.realpath(absRoot);
	if (await promises.realpath(absDossiersDir) !== path.join(realRoot, "docs/features")) throw new UsageError("docs/features must be a real directory inside the repository root and must not be a symlinked path.", helpText);
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
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	const dossiersDir = takeOption(argv, "--dossiers-dir", "docs/features") ?? "docs/features";
	const indexFile = takeOption(argv, "--index-file", DEFAULT_INDEX_FILE) ?? DEFAULT_INDEX_FILE;
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
	const dossiersDir = takeOption(argv, "--dossiers-dir", "docs/features") ?? "docs/features";
	const indexFile = takeOption(argv, "--index-file", DEFAULT_INDEX_FILE) ?? DEFAULT_INDEX_FILE;
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
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
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	const dossiersDir = takeOption(argv, "--dossiers-dir", "docs/features") ?? "docs/features";
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
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = takeOption(argv, "--dossier", null);
	const dossiersDir = takeOption(argv, "--dossiers-dir", "docs/features") ?? "docs/features";
	const changedOnly = hasOption(argv, "--changed-only");
	const base = takeOption(argv, "--base", null);
	const strictStatusesRaw = takeOption(argv, "--strict-statuses", null);
	const strictStatuses = strictStatusesRaw ? new Set(strictStatusesRaw.split(",").map((value) => value.trim()).filter(Boolean)) : DEFAULT_STRICT_COVERAGE_STATUSES;
	const orphansScope = takeOption(argv, "--orphans-scope", "auto") ?? "auto";
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
		`  ${CLI_DISPLAY_NAME} marker-audit [options]`,
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
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	const changedOnly = hasOption(argv, "--changed-only");
	const base = takeOption(argv, "--base", null);
	const paths = (takeOption(argv, "--paths", "") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
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
	writeLine$1(io.stdout, `Marker audit (debt-audit compatibility): ${filesToScan.length} file(s) scanned.`);
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
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = ensureRequired(takeOption(argv, "--dossier", null), "--dossier is required.", helpText);
	const base = takeOption(argv, "--base", null);
	const beforeFile = takeOption(argv, "--before-file", null);
	const output = takeOption(argv, "--output", null);
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
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = ensureRequired(takeOption(argv, "--dossier", null), "--dossier is required.", helpText);
	const step = ensureRequired(takeOption(argv, "--step", null), "--step is required.", helpText);
	const verdict = ensureRequired(takeOption(argv, "--verdict", null), "--verdict is required.", helpText).toUpperCase();
	const reviewer = ensureRequired(takeOption(argv, "--reviewer", null), "--reviewer is required.", helpText);
	const eventCommit = takeOption(argv, "--event-commit", null);
	const notes = takeOption(argv, "--notes", "") ?? "";
	const output = takeOption(argv, "--output", null);
	const mustFix = takeManyOptions(argv, "--must-fix");
	const shouldFix = takeManyOptions(argv, "--should-fix");
	const evidence = takeManyOptions(argv, "--evidence");
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
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = ensureRequired(takeOption(argv, "--dossier", null), "--dossier is required.", helpText);
	const step = ensureRequired(takeOption(argv, "--step", null), "--step is required.", helpText);
	const verifyArtifact = ensureRequired(takeOption(argv, "--verify-artifact", null), "--verify-artifact is required.", helpText);
	const reviewArtifact = ensureRequired(takeOption(argv, "--review-artifact", null), "--review-artifact is required.", helpText);
	const nextStep = takeOption(argv, "--next-step", null);
	const output = takeOption(argv, "--output", null);
	const allowDirty = hasOption(argv, "--allow-dirty");
	const absRoot = path.resolve(root);
	const absDossier = path.resolve(absRoot, dossier);
	const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
	const featureId = frontmatterString(dossierRecord.frontmatter, "id", path.basename(absDossier, ".md"));
	const blockers = [];
	let verify = null;
	try {
		verify = await readJsonArtifact(absRoot, verifyArtifact);
	} catch (error) {
		blockers.push(`Could not read verification artifact ${relativeToRoot(absRoot, path.resolve(absRoot, verifyArtifact))} (${error instanceof Error ? error.message : String(error)}).`);
	}
	let review = null;
	try {
		review = await readJsonArtifact(absRoot, reviewArtifact);
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
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	const step = takeOption(argv, "--step", "implementation") ?? "implementation";
	const dossier = takeOption(argv, "--dossier", null);
	const changedOnly = hasOption(argv, "--changed-only");
	const base = takeOption(argv, "--base", null);
	const output = takeOption(argv, "--output", null);
	const skipIndexRefresh = hasOption(argv, "--skip-index-refresh");
	const skipDiffCheck = hasOption(argv, "--skip-diff-check");
	const coverageOrphansScope = takeOption(argv, "--coverage-orphans-scope", "auto") ?? "auto";
	const extra = takeManyOptions(argv, "--extra");
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
		"  - next-step stays dossier-local; use backlog-engineer for backlog selection, readiness, or lifecycle actualization."
	].join("\n");
}
async function runNextStepCommand(argv, io) {
	const helpText = nextStepHelp();
	if (hasOption(argv, "--help", "-h")) {
		writeLine$1(io.stdout, helpText);
		return 0;
	}
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = takeOption(argv, "--dossier", null);
	const json = hasOption(argv, "--json");
	const absRoot = path.resolve(root);
	const dossiers = await fileExists(path.resolve(absRoot, "docs/features")) ? await readAllDossiers(absRoot, DEFAULT_DOSSIERS_DIR, { strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES }) : [];
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
	const blockers = latestStepArtifact?.process_complete === false && Array.isArray(latestStepArtifact.blockers) ? latestStepArtifact.blockers.filter((value) => typeof value === "string") : target ? [] : ["No active dossier found. Select backlog work with backlog-engineer and create a dossier via feature-intake before using next-step."];
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
	const root = takeOption(argv, "--root", process.cwd()) ?? process.cwd();
	const dossier = takeOption(argv, "--dossier", null);
	let featureId = takeOption(argv, "--feature-id", null);
	const featureCycleId = takeOption(argv, "--feature-cycle-id", null);
	const json = hasOption(argv, "--json");
	const absRoot = path.resolve(root);
	if (dossier) {
		const dossierRecord = await readDossierRecord(path.resolve(absRoot, dossier), { root: absRoot });
		featureId = featureId ?? frontmatterString(dossierRecord.frontmatter, "id", path.basename(dossierRecord.absPath, ".md"));
	}
	featureId = ensureRequired(featureId, "--feature-id is required unless --dossier is provided.", helpText);
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
var COMMANDS = [
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
		aliases: ["marker-audit"],
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
function globalHelp() {
	const commandLines = COMMANDS.map((command) => {
		const aliasSuffix = command.aliases.length > 0 ? ` (aliases: ${command.aliases.join(", ")})` : "";
		return `  ${command.name.padEnd(22)} ${command.description}${aliasSuffix}`;
	});
	return [
		"Unified CLI for the dossier-engineer skill.",
		"Commands below are shipped CLI commands only.",
		"Workflow stages such as init (repository bootstrap), spec-compact, plan-slice, implementation, change-proposal, adr-log, and dependency-check are documented in SKILL.md and references/workflow.md.",
		"",
		"Usage:",
		`  ${CLI_DISPLAY_NAME} <command> [options]`,
		`  ${CLI_DISPLAY_NAME} help [command]`,
		"",
		"Commands:",
		...commandLines,
		"",
		"Global options:",
		"  -h, --help                   Show global or command-specific help.",
		"  --version                    Show CLI version."
	].join("\n");
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
	return executeCommand(command, rest, cliIo, commandName);
}
var exitCode = await runCli(process.argv.slice(2), io);
process.exitCode = exitCode;
//#endregion
export { COMMANDS, runCli };

//# sourceMappingURL=dossier.mjs.map