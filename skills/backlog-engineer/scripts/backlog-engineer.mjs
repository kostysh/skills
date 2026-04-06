#!/usr/bin/env node
import path from "node:path";
import { parseArgs } from "node:util";
import crypto from "node:crypto";
import fs from "node:fs/promises";
//#region package.json
var name = "@kostysh/backlog-engineer-cli";
var version$1 = "0.1.0";
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
	version: version$1,
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
//#region src/schemas/scalars.ts
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
var BacklogRelativePosixPathSchema = NonEmptyStringSchema.superRefine((value, ctx) => {
	if (value.includes("\0")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Backlog-relative path must not contain NUL bytes."
	});
	if (value.startsWith("/")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Backlog-relative path must not be absolute."
	});
	if (value.includes("\\")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Backlog-relative path must use POSIX separators."
	});
	if (/^[A-Za-z]:(?:$|\/)/.test(value)) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Backlog-relative path must not use Windows drive-prefixed forms."
	});
	const segments = value.split("/");
	if (segments.some((segment) => segment.length === 0)) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Backlog-relative path must not contain empty segments."
	});
	if (segments.some((segment) => segment === "." || segment === "..")) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Backlog-relative path must not contain dot segments."
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
var PatchKindSchema = _enum(["patch-item", "remove-item"]);
_enum([
	"replace_fields",
	"append_unique",
	"remove_values",
	"remove_todo",
	"remove_item"
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
//#region src/schemas/packet.ts
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
//#region src/schemas/artifacts.ts
var RootMarkerFileSchema = strictObject({
	schema_version: SchemaVersionSchema,
	tool_name: NonEmptyStringSchema,
	created_at: IsoUtcTimestampSchema,
	layout_version: LayoutVersionSchema
});
var SourceRecordSchema = strictObject({
	source_id: SourceIdSchema,
	source_label: SourceLabelSchema,
	path: BacklogRelativePosixPathSchema,
	kind: ControlledStringSchema,
	authority: ControlledStringSchema,
	note: NonEmptyStringSchema.optional(),
	hash: Sha256HexSchema,
	registered_at: IsoUtcTimestampSchema,
	last_checked_at: IsoUtcTimestampSchema
});
var SourceRegistryFileSchema = strictObject({
	schema_version: SchemaVersionSchema,
	created_at: IsoUtcTimestampSchema,
	updated_at: IsoUtcTimestampSchema,
	sources: uniqueArraySchema(SourceRecordSchema, (value) => value.source_id, "Source IDs must be unique.")
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
//#region src/schemas/commands.ts
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
var RegisterSourceCommandOutputSchema = strictObject({
	source_id: SourceIdSchema,
	source_label: SourceLabelSchema,
	path: BacklogRelativePosixPathSchema,
	kind: NonEmptyStringSchema,
	authority: NonEmptyStringSchema,
	note: NonEmptyStringSchema.optional(),
	hash: string().regex(/^[a-f0-9]{64}$/)
});
var ListSourcesCommandInputSchema = strictObject({
	item_key: ItemKeySchema.optional(),
	path: CliPathInputSchema.optional()
});
var ListSourcesCommandOutputSchema = array(SourceRecordSchema);
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
	open_todo_count: NonNegativeIntSchema
});
var ReportCommandInputSchema = strictObject({});
var ReportCommandOutputSchema = strictObject({
	report_path: BacklogRelativePosixPathSchema,
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
	deleted_path: literal("."),
	deleted: literal(true)
});
//#endregion
//#region src/errors/error-codes.ts
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
	"BE_TODO_NOT_FOUND",
	"BE_ITEM_NOT_FOUND",
	"BE_CANONICAL_WRITE_FAILED",
	"BE_REPORT_WRITE_FAILED",
	"BE_TEMPLATE_OUTPUT_INVALID",
	"BE_DELETE_CONFIRM_REQUIRED",
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
	BE_TODO_NOT_FOUND: 5,
	BE_ITEM_NOT_FOUND: 5,
	BE_CANONICAL_WRITE_FAILED: 1,
	BE_REPORT_WRITE_FAILED: 1,
	BE_TEMPLATE_OUTPUT_INVALID: 2,
	BE_DELETE_CONFIRM_REQUIRED: 6,
	BE_INTERNAL_STATE_CORRUPT: 1
};
var ERROR_DEFAULT_MESSAGES = {
	BE_USAGE_INVALID: "Command arguments are invalid.",
	BE_ROOT_NOT_FOUND: "Backlog root was not found.",
	BE_ROOT_ALREADY_EXISTS: "Backlog root already exists.",
	BE_ROOT_NOT_EMPTY: "Cannot initialize backlog in a non-empty directory.",
	BE_INVALID_JSON: "Input JSON is invalid.",
	BE_SCHEMA_INVALID: "Input does not match the required schema.",
	BE_INPUT_FILE_NOT_FOUND: "Input file was not found.",
	BE_SOURCE_NOT_FOUND: "Source was not found.",
	BE_SOURCE_FILE_MISSING: "Registered source file is missing on disk.",
	BE_SOURCE_READ_FAILED: "Registered source file could not be read safely.",
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
	BE_TODO_NOT_FOUND: "Todo was not found.",
	BE_ITEM_NOT_FOUND: "Item was not found.",
	BE_CANONICAL_WRITE_FAILED: "Failed to write canonical artifact.",
	BE_REPORT_WRITE_FAILED: "Failed to write report artifact.",
	BE_TEMPLATE_OUTPUT_INVALID: "Template output path is invalid.",
	BE_DELETE_CONFIRM_REQUIRED: "Destructive command requires explicit confirmation.",
	BE_INTERNAL_STATE_CORRUPT: "Internal runtime state is corrupt."
};
//#endregion
//#region src/schemas/errors.ts
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
//#region src/schemas/patch.ts
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
		})
	])).min(1)
}).superRefine((value, ctx) => {
	const targetKeys = new Set(value.metadata.target_item_keys);
	for (const [index, operation] of value.operations.entries()) if (!targetKeys.has(operation.item_key)) ctx.addIssue({
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
	for (const [index, operation] of value.operations.entries()) if (operation.action === "remove_item") ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "patch-item must not contain remove_item operations.",
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
//#region src/schemas/cli.ts
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
var GlobalHelpOutputSchema = strictObject({
	cli_name: NonEmptyStringSchema,
	version: NonEmptyStringSchema,
	usage: array(NonEmptyStringSchema).min(1),
	commands: array(CommandCatalogEntrySchema).min(1)
});
var CommandHelpOutputSchema = strictObject({
	cli_name: NonEmptyStringSchema,
	version: NonEmptyStringSchema,
	command: NonEmptyStringSchema,
	summary: NonEmptyStringSchema,
	usage: array(NonEmptyStringSchema).min(1),
	options: array(CommandHelpOptionSchema)
});
var VersionOutputSchema = strictObject({
	cli_name: NonEmptyStringSchema,
	version: NonEmptyStringSchema
});
//#endregion
//#region src/schemas/index.ts
var commandInputSchemas = {
	init: InitCommandInputSchema,
	"register-source": RegisterSourceCommandInputSchema,
	"list-sources": ListSourcesCommandInputSchema,
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
//#region src/errors/backlog-error.ts
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
//#region src/errors/factories.ts
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
//#region src/errors/index.ts
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
//#region src/commands/arg-parsers.ts
function helpHint(commandName) {
	return `Run \`backlog-engineer help ${commandName}\` to inspect the command contract.`;
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
//#region src/commands/query-helpers.ts
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
//#region src/runtime/tool-metadata.ts
var TOOL_NAME = "@kostysh/backlog-engineer-cli";
var DELETE_BACKLOG_COMMAND = {
	name: "delete-backlog",
	summary: "Delete the backlog and its utility-owned artifacts.",
	usage: ["backlog-engineer delete-backlog --confirm"],
	options: [{
		flags: ["--confirm"],
		description: "Explicitly confirm backlog deletion.",
		required: true
	}],
	inputSchema: DeleteBacklogCommandInputSchema,
	outputSchema: DeleteBacklogCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("delete-backlog", args, { options: { confirm: { type: "boolean" } } });
		assertNoPositionals("delete-backlog", parsed.positionals);
		if (parsed.values.confirm !== true) throw createBacklogError({
			code: "BE_DELETE_CONFIRM_REQUIRED",
			details: { command: "delete-backlog" },
			hint: "Re-run the command with `--confirm` only after explicit operator approval."
		});
		return parseUsageInput("delete-backlog", DeleteBacklogCommandInputSchema, { confirm: true });
	},
	async execute(_input, context) {
		if (!context.backlogRoot) throw context.errors.create("BE_ROOT_NOT_FOUND", void 0, { details: { command: "delete-backlog" } });
		const marker = await context.artifacts.readRootMarker(context.backlogRoot);
		if (marker.tool_name !== "@kostysh/backlog-engineer-cli" || marker.schema_version !== 1 || marker.layout_version !== 1) throw context.errors.create("BE_ROOT_NOT_FOUND", void 0, { details: {
			path: context.backlogRoot,
			tool_name: marker.tool_name,
			schema_version: marker.schema_version,
			layout_version: marker.layout_version
		} });
		const currentWorkingDirectory = context.host.getProcessCwd();
		const relativeToRoot = path.relative(context.backlogRoot, currentWorkingDirectory);
		const runsInsideBacklogRoot = relativeToRoot === "" || relativeToRoot !== "" && !relativeToRoot.startsWith("..") && !path.isAbsolute(relativeToRoot);
		if (runsInsideBacklogRoot) context.host.chdir(path.dirname(context.backlogRoot));
		try {
			await context.artifacts.deleteBacklog(context.backlogRoot);
		} catch (error) {
			if (runsInsideBacklogRoot) context.host.chdir(currentWorkingDirectory);
			throw error;
		}
		return {
			deleted_path: ".",
			deleted: true
		};
	}
};
var GAPS_COMMAND = {
	name: "gaps",
	summary: "List explicit blockers and unresolved gaps.",
	usage: ["backlog-engineer gaps", "backlog-engineer gaps --item-key <item_key>"],
	options: [{
		flags: ["--item-key"],
		value_name: "<item_key>",
		description: "Restrict output to a single task key."
	}],
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
var INIT_COMMAND = {
	name: "init",
	summary: "Initialize a backlog directory and utility-owned artifacts.",
	usage: ["backlog-engineer init --path <path>"],
	options: [{
		flags: ["--path"],
		value_name: "<path>",
		description: "Path to the backlog root directory to initialize.",
		required: true
	}],
	inputSchema: InitCommandInputSchema,
	outputSchema: InitCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("init", args, { options: { path: { type: "string" } } });
		assertNoPositionals("init", parsed.positionals);
		return parseUsageInput("init", InitCommandInputSchema, { path: requireStringOption("init", "--path", getStringOption(parsed.values.path)) });
	},
	async execute(input, context) {
		const root = context.host.resolveCliPath(input.path);
		const createdAt = context.host.nowIsoUtc();
		const agentsContent = context.templates.renderBacklogAgentsTemplate();
		return context.artifacts.initializeBacklogRoot({
			root,
			createdAt,
			agentsContent
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
//#region src/commands/list-sources.ts
function collectItemSourceIds$6(item) {
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
		let sources = [...(await context.artifacts.readSourceRegistry(context.backlogRoot)).sources];
		if (input.item_key) {
			const { state } = await context.ensureQueryState();
			const item = state.items.find((candidate) => candidate.item_key === input.item_key);
			if (!item) throw context.errors.create("BE_ITEM_NOT_FOUND", void 0, { details: { item_key: input.item_key } });
			const itemSourceIds = collectItemSourceIds$6(item);
			sources = sources.filter((source) => itemSourceIds.has(source.source_id));
		}
		if (input.path) {
			const normalizedSource = await context.sources.resolveCliSourcePath({
				backlogRoot: context.backlogRoot,
				inputPath: context.host.resolveCliPath(input.path)
			});
			sources = sources.filter((source) => source.path === normalizedSource.relative_path);
		}
		return context.schemas.parseCommandOutput("list-sources", [...sources].sort((left, right) => {
			const labelCompare = left.source_label.localeCompare(right.source_label);
			if (labelCompare !== 0) return labelCompare;
			return left.source_id.localeCompare(right.source_id);
		}));
	}
};
//#endregion
//#region src/commands/mutation-helpers.ts
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
		const { state: nextState, ...output } = await context.core.mutation.applyPacket({
			state,
			packet: packetInput.value,
			sourceRegistry,
			packetId,
			dryRun: input.dry_run
		});
		if (input.dry_run) return output;
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
		const { state: nextState, ...output } = summary;
		if (input.dry_run) return output;
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
//#region src/commands/refresh-helpers.ts
function collectItemSourceIds$5(item) {
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
		for (const sourceId of collectItemSourceIds$5(item)) sourceIds.add(sourceId);
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
		selector: input
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
		open_todo_count: state.todos.length
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
var REFRESH_COMMAND = {
	name: "refresh",
	summary: "Refresh source-derived state in full or scoped form.",
	usage: [
		"backlog-engineer refresh",
		"backlog-engineer refresh --item-key <item_key>",
		"backlog-engineer refresh --source-id <source_id>",
		"backlog-engineer refresh --source-label <source_label>",
		"backlog-engineer refresh --source-path <path>"
	],
	options: [
		{
			flags: ["--item-key"],
			value_name: "<item_key>",
			description: "Refresh the dependency subgraph rooted at a specific task."
		},
		{
			flags: ["--source-id"],
			value_name: "<source_id>",
			description: "Refresh tasks linked to a specific source ID."
		},
		{
			flags: ["--source-label"],
			value_name: "<source_label>",
			description: "Refresh tasks linked to a specific source label."
		},
		{
			flags: ["--source-path"],
			value_name: "<path>",
			description: "Refresh tasks linked to a specific source path."
		}
	],
	inputSchema: RefreshCommandInputSchema,
	outputSchema: RefreshCommandOutputSchema,
	parseArgs(args) {
		const parsed = parseCommandArgs("refresh", args, { options: {
			"item-key": { type: "string" },
			"source-id": { type: "string" },
			"source-label": { type: "string" },
			"source-path": { type: "string" }
		} });
		assertNoPositionals("refresh", parsed.positionals);
		const selectors = [
			parsed.values["item-key"] ? "item" : null,
			parsed.values["source-id"] ? "source_id" : null,
			parsed.values["source-label"] ? "source_label" : null,
			parsed.values["source-path"] ? "source_path" : null
		].filter((value) => value !== null);
		if (selectors.length > 1) throw createUsageError({
			command: "refresh",
			conflicting_selectors: selectors
		}, "Use only one selector: --item-key, --source-id, --source-label, or --source-path.");
		if (parsed.values["item-key"]) return parseUsageInput("refresh", RefreshCommandInputSchema, {
			kind: "item",
			item_key: parsed.values["item-key"]
		});
		if (parsed.values["source-id"]) return parseUsageInput("refresh", RefreshCommandInputSchema, {
			kind: "source_id",
			source_id: parsed.values["source-id"]
		});
		if (parsed.values["source-label"]) return parseUsageInput("refresh", RefreshCommandInputSchema, {
			kind: "source_label",
			source_label: parsed.values["source-label"]
		});
		if (parsed.values["source-path"]) return parseUsageInput("refresh", RefreshCommandInputSchema, {
			kind: "source_path",
			source_path: parsed.values["source-path"]
		});
		return parseUsageInput("refresh", RefreshCommandInputSchema, { kind: "all" });
	},
	async execute(input, context) {
		const { summary } = await executeRefreshFlow({
			input,
			context
		});
		return summary;
	}
};
//#endregion
//#region src/runtime/path-safety.ts
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
//#region src/sources/path-normalizer.ts
function toPosixRelativePath(relativePath) {
	return relativePath.replaceAll("\\", "/");
}
function createSourceLabel(relativePath) {
	return relativePath;
}
function normalizeSourcePath(payload) {
	const absolutePath = payload.path.resolve(payload.backlogRoot, payload.inputPath);
	const rootRelativePath = resolvePathRelativeToRoot({
		path: payload.path,
		root: payload.backlogRoot,
		target: absolutePath
	});
	if (!rootRelativePath) throw payload.errors.create("BE_SCHEMA_INVALID", void 0, {
		details: { path: absolutePath },
		hint: "Source path must stay inside the current backlog root."
	});
	const relativePath = toPosixRelativePath(rootRelativePath.posixRelativePath);
	const parsedRelativePath = BacklogRelativePosixPathSchema.safeParse(relativePath);
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
//#region src/artifacts/store-helpers.ts
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
function createTempSiblingPath$1(path, targetPath, seedHash) {
	return path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.tmp-${seedHash.slice(0, 12)}`);
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
	if (root && path) await ensureManagedFilePathSafe({
		fs,
		path,
		errors,
		root,
		filePath,
		errorCode: readErrorCode
	});
	let rawText;
	try {
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
	const tempPath = createTempSiblingPath$1(path, targetPath, await hash.sha256Text(`${targetPath}\n${content}`));
	if (root) await ensureManagedFilePathSafe({
		fs,
		path,
		errors,
		root,
		filePath: targetPath,
		errorCode: writeErrorCode
	});
	try {
		await fs.mkdir(path.dirname(targetPath), { recursive: true });
		await fs.rm(tempPath, { force: true });
		await fs.writeText(tempPath, content);
		await fs.rename(tempPath, targetPath);
	} catch (error) {
		try {
			await fs.rm(tempPath, { force: true });
		} catch {}
		throw errors.create(writeErrorCode, void 0, {
			details: { path: targetPath },
			cause: error
		});
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
//#region src/sources/source-hash-service.ts
var MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024;
function isErrnoException$1(error) {
	return error instanceof Error && "code" in error;
}
function isMissingFileError(error) {
	return isErrnoException$1(error) && error.code === "ENOENT";
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
//#region src/sources/source-registry-service.ts
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
//#region src/sources/source-scope-service.ts
function collectItemSourceIds$4(item) {
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
		errors: payload.errors,
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
		const sourceIds = collectItemSourceIds$4(item);
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
//#region src/sources/index.ts
function createSourcesModule(dependencies) {
	return {
		resolveCliSourcePath(payload) {
			return Promise.resolve(normalizeSourcePath({
				path: dependencies.path,
				errors: dependencies.errors,
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
		validateSourceKind(input.kind, context.errors);
		validateSourceAuthority(input.authority, context.errors);
		const normalizedSource = await context.sources.resolveCliSourcePath({
			backlogRoot: context.backlogRoot,
			inputPath: context.host.resolveCliPath(input.path)
		});
		const existingRegistry = await context.artifacts.readSourceRegistry(context.backlogRoot);
		const existingSource = existingRegistry.sources.find((source) => source.path === normalizedSource.relative_path);
		if (existingSource) return context.schemas.parseCommandOutput("register-source", {
			source_id: existingSource.source_id,
			source_label: existingSource.source_label,
			path: existingSource.path,
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
				backlogRoot: context.backlogRoot
			});
		}
		return context.schemas.parseCommandOutput("register-source", {
			source_id: source.source_id,
			source_label: source.source_label,
			path: source.path,
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
		const { state: nextState, ...output } = summary;
		if (input.dry_run) return output;
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
		await context.hooks.afterPatchApplied?.({
			summary: output,
			state: nextState,
			backlogRoot: context.backlogRoot
		});
		return output;
	}
};
var REPORT_COMMAND = {
	name: "report",
	summary: "Generate a human-readable backlog report on disk.",
	usage: ["backlog-engineer report"],
	options: [],
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
			report_path: reportPath,
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
//#region src/commands/template.ts
var OPTIONS = [{
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
	options: OPTIONS,
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
function buildGlobalHelpOutput(version) {
	return GlobalHelpOutputSchema.parse({
		cli_name: CLI_DISPLAY_NAME,
		version,
		usage: [
			`${CLI_DISPLAY_NAME} <command> [options]`,
			`${CLI_DISPLAY_NAME} help [command]`,
			`${CLI_DISPLAY_NAME} --help`,
			`${CLI_DISPLAY_NAME} --version`
		],
		commands: COMMANDS.map((command) => ({
			name: command.name,
			summary: command.summary
		}))
	});
}
function buildCommandHelpOutput(command, version) {
	return CommandHelpOutputSchema.parse({
		cli_name: CLI_DISPLAY_NAME,
		version,
		command: command.name,
		summary: command.summary,
		usage: [...command.usage],
		options: [...command.options]
	});
}
function buildVersionOutput(version) {
	return VersionOutputSchema.parse({
		cli_name: CLI_DISPLAY_NAME,
		version
	});
}
//#endregion
//#region src/cli/parse-argv.ts
function usageHint$1() {
	return "Run `backlog-engineer --help` to inspect the available command surface.";
}
function assertNoExtraGlobalArgs(argv, intent) {
	if (argv.length === 1) return;
	throw createUsageError({
		command: intent === "version" ? "--version" : "--help",
		unexpected_argv: argv.slice(1)
	}, usageHint$1());
}
function parseCliIntent(argv) {
	const [first, ...rest] = argv;
	if (!first) return { kind: "global_help" };
	if (first === "--help" || first === "-h") {
		assertNoExtraGlobalArgs(argv, "global_help");
		return { kind: "global_help" };
	}
	if (first === "--version") {
		assertNoExtraGlobalArgs(argv, "version");
		return { kind: "version" };
	}
	if (first === "help") {
		if (rest.length === 0) return { kind: "global_help" };
		if (rest.length === 1) {
			const [commandName] = rest;
			if (!commandName) throw createUsageError({ command: "help" }, usageHint$1());
			return {
				kind: "command_help",
				commandName
			};
		}
		throw createUsageError({
			command: "help",
			unexpected_argv: rest.slice(1)
		}, usageHint$1());
	}
	if (first.startsWith("-")) throw createUsageError({
		reason: "unknown_global_flag",
		flag: first
	}, usageHint$1());
	return {
		kind: "command_run",
		commandName: first,
		args: rest
	};
}
//#endregion
//#region src/artifacts/backlog-layout.ts
var ROOT_MARKER_BASENAME = ".backlog.json";
var BACKLOG_INTERNAL_DIRNAME = ".backlog";
var PACKETS_DIRNAME = "packets";
var PATCHES_DIRNAME = "patches";
var REPORTS_DIRNAME = "reports";
var AGENTS_BASENAME = "AGENTS.md";
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
		agentsPath: getAgentsPath(path, root)
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
function getSourceRegistryPath(path, root) {
	return path.join(root, BACKLOG_INTERNAL_DIRNAME, SOURCES_REGISTRY_BASENAME);
}
function getAppliedRegistryPath(path, root) {
	return path.join(root, BACKLOG_INTERNAL_DIRNAME, APPLIED_REGISTRY_BASENAME);
}
function getStatePath(path, root) {
	return path.join(root, BACKLOG_INTERNAL_DIRNAME, STATE_BASENAME);
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
//#region src/artifacts/canonical-import-store.ts
async function importCanonicalArtifact(payload) {
	const { dependencies, root, sourcePath, rawContent, canonicalBasename, directoryName } = payload;
	const sha256 = await dependencies.hash.sha256Text(rawContent);
	const filename = createCanonicalImportFilename(sha256, canonicalBasename, dependencies.errors);
	const directories = getLayoutDirectories(dependencies.path, root);
	const targetDir = directoryName === "packets" ? directories.packetsDir : directories.patchesDir;
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
//#region src/artifacts/delete-backlog.ts
async function deleteBacklog(dependencies, root) {
	if (!await dependencies.fs.exists(root)) return;
	const rootStat = await dependencies.fs.lstat(root);
	if (!rootStat.isDirectory || rootStat.isSymbolicLink) throw dependencies.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, { details: { path: root } });
	const remainingEntries = await dependencies.fs.readdir(root);
	const allowedEntries = new Set([
		ROOT_MARKER_BASENAME,
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
		filePath: managedPaths.agentsPath,
		errorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
	for (const directoryPath of [
		managedPaths.internalDir,
		managedPaths.packetsDir,
		managedPaths.patchesDir,
		managedPaths.reportsDir
	]) await ensureManagedDirectoryPathSafe({
		fs: dependencies.fs,
		path: dependencies.path,
		errors: dependencies.errors,
		root,
		directoryPath,
		errorCode: "BE_INTERNAL_STATE_CORRUPT"
	});
	await dependencies.fs.rm(managedPaths.rootMarkerPath, { force: true });
	await dependencies.fs.rm(managedPaths.agentsPath, { force: true });
	await dependencies.fs.rm(managedPaths.internalDir, {
		recursive: true,
		force: true
	});
	await dependencies.fs.rm(managedPaths.packetsDir, {
		recursive: true,
		force: true
	});
	await dependencies.fs.rm(managedPaths.patchesDir, {
		recursive: true,
		force: true
	});
	await dependencies.fs.rm(managedPaths.reportsDir, {
		recursive: true,
		force: true
	});
	if ((await dependencies.fs.readdir(root)).length === 0) await dependencies.fs.rm(root, {
		recursive: true,
		force: true
	});
}
//#endregion
//#region src/artifacts/initialize-backlog.ts
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
async function assertInitTargetAvailable(dependencies, root) {
	const markerPath = getRootMarkerPath(dependencies.path, root);
	if (await dependencies.fs.exists(markerPath)) {
		const markerStat = await dependencies.fs.lstat(markerPath);
		if (markerStat.isFile && !markerStat.isSymbolicLink) throw dependencies.errors.create("BE_ROOT_ALREADY_EXISTS", void 0, { details: {
			path: root,
			root_marker_path: markerPath
		} });
	}
	if (!await dependencies.fs.exists(root)) return;
	const rootStat = await dependencies.fs.lstat(root);
	if (rootStat.isSymbolicLink || !rootStat.isDirectory) throw dependencies.errors.create("BE_ROOT_NOT_EMPTY", void 0, { details: { path: root } });
	const entries = await dependencies.fs.readdir(root);
	if (entries.length > 0) throw dependencies.errors.create("BE_ROOT_NOT_EMPTY", void 0, { details: {
		path: root,
		entries
	} });
}
async function initializeBacklogRoot(dependencies, payload) {
	await assertInitTargetAvailable(dependencies, payload.root);
	const marker = dependencies.schemas.parseRootMarker(createInitialRootMarker(payload.createdAt));
	const sourceRegistry = dependencies.schemas.parseSourceRegistry(createInitialSourceRegistry(payload.createdAt));
	const appliedRegistry = dependencies.schemas.parseAppliedRegistry(createInitialAppliedRegistry(payload.createdAt));
	const state = dependencies.schemas.parseStateFile(createInitialState(payload.createdAt));
	await dependencies.artifacts.writeInitialArtifacts({
		root: payload.root,
		marker,
		agentsContent: payload.agentsContent,
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
//#region src/artifacts/report-store.ts
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
//#region src/artifacts/root-marker-store.ts
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
//#region src/artifacts/source-registry-store.ts
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
//#region src/artifacts/applied-registry-store.ts
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
//#region src/artifacts/state-store.ts
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
//#region src/artifacts/index.ts
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
			} catch (error) {
				for (const targetPath of [
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
				]) try {
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
//#region src/core/read-model-helpers.ts
var ATTENTION_REASON_ORDER = [
	"source_changed",
	"dependency_changed",
	"context_changed",
	"gaps"
];
function collectItemSourceIds$3(item) {
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
	return [...collectItemSourceIds$3(payload.item)].map((sourceId) => {
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
//#region src/core/attention-service.ts
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
//#region src/core/replay-pipeline.ts
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
	for (const todoId of todoIds) if (!ownedTodoIds.has(todoId)) throw payload.errors.create("BE_TODO_NOT_FOUND", void 0, { details: {
		item_key: payload.itemKey,
		todo_id: todoId
	} });
	next.todos = next.todos.filter((todo) => !todoIds.has(todo.todo_id));
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
function sortItems(items) {
	return [...items].sort((left, right) => left.item_key.localeCompare(right.item_key));
}
function sortTodos$1(todos) {
	return [...todos].sort((left, right) => left.todo_id.localeCompare(right.todo_id));
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
	for (const operation of payload.patch.operations) {
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
					errors: payload.errors
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
	}
	if (removedItemKeys.size > 0) next = cleanupRemovedItemReferences$1(next, removedItemKeys);
	validateReferentialIntegrity({
		state: next,
		errors: payload.errors
	});
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
//#region src/core/context-service.ts
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
//#region src/core/derived-state-service.ts
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
//#region src/core/graph-service.ts
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
			const updatedItemKeys = uniqueSorted(patch.operations.filter((operation) => operation.action !== "remove_item").map((operation) => operation.item_key));
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
//#region src/core/items-service.ts
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
//#region src/core/mutation-service.ts
function sortKeys(values) {
	return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
function cloneState$1(value) {
	return structuredClone(value);
}
function collectItemSourceIds$2(item) {
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
		const itemSourceIds = collectItemSourceIds$2(item);
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
		const sourceIds = sortKeys(new Set([...beforeItem ? [...collectItemSourceIds$2(beforeItem)] : [], ...afterItem ? [...collectItemSourceIds$2(afterItem)] : []]));
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
		if (operation.action === "remove_todo" || operation.action === "remove_item") continue;
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
		const itemSourceIds = collectItemSourceIds$2(item);
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
			return Promise.resolve({
				...payload.schemas.parseCommandOutput("packet", {
					dry_run: summary.dry_run,
					counts: summary.counts,
					added: summary.added,
					removed: summary.removed,
					todo_created: summary.todo_created,
					todo_updated: summary.todo_updated,
					next_commands: summary.next_commands
				}),
				state: nextState
			});
		},
		applyPatch({ state, patch, sourceRegistry, dryRun }) {
			const isRemoveItemPatch = patch.operations.every((operation) => operation.action === "remove_item");
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
				return item ? [...collectItemSourceIds$2(item)] : [];
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
//#region src/core/queue-service.ts
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
//#region src/core/search-service.ts
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
//#region src/core/todo-service.ts
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
	const message = payload.type === "review_source_change" ? createSourceChangeMessage(relatedSources) : payload.type === "review_dependency_change" ? createDependencyChangeMessage(relatedItemKeys) : createContextChangeMessage(relatedItemKeys);
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
//#region src/core/create-core-module.ts
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
//#region src/reports/render-mermaid-graph.ts
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
//#region src/reports/build-report-model.ts
function collectItemSourceIds$1(item) {
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
		for (const sourceId of new Set(collectItemSourceIds$1(item))) sourceCoverage.set(sourceId, (sourceCoverage.get(sourceId) ?? 0) + 1);
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
//#region src/reports/render-report-markdown.ts
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
//#region src/reports/index.ts
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
//#region src/templates/render-agents-template.ts
var BACKLOG_AGENTS_TEMPLATE = `# AGENTS.md

This directory is a backlog root managed by \`@kostysh/backlog-engineer-cli\`.

## Core rules

- Treat the utility as the source of truth for the current backlog state.
- Do not reconstruct current state by reading \`packets/\`, \`patches/\`, or \`.backlog/*\` directly.
- Do not edit \`.backlog.json\`, \`.backlog/\`, \`packets/\`, \`patches/\`, or \`reports/\` manually unless the task is explicitly about the utility implementation itself.
- Packets are immutable after registration.
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
- Use utility lookups such as \`list-sources\` instead of rebuilding source mappings from packet files.

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
//#region src/templates/render-packet-template.ts
var PACKET_TEMPLATE = `{
  "context": {
    "glossary": [],
    "key_strategy": {
      "module_prefix": "<module_prefix>",
      "item_pattern": "<module>-<capability>-<result>"
    },
    "target_system": [],
    "as_built": [],
    "claims": [],
    "contracts": [],
    "data_domains": [],
    "quality_attributes": [],
    "policy_decisions": []
  },
  "items": []
}
`;
function renderPacketTemplate() {
	return PACKET_TEMPLATE;
}
//#endregion
//#region src/templates/render-patch-template.ts
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
//#region src/templates/index.ts
function createTemplatesModule() {
	return {
		renderBacklogAgentsTemplate,
		renderPacketTemplate,
		renderPatchTemplate
	};
}
//#endregion
//#region src/hooks/no-op-hooks.ts
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
//#region src/runtime/ports.ts
function createNodeFileSystemPort() {
	return {
		async readText(filePath) {
			return fs.readFile(filePath, "utf8");
		},
		async writeText(filePath, content) {
			await fs.writeFile(filePath, content, "utf8");
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
//#region src/runtime/root-discovery.ts
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
//#region src/runtime/rebuild-state.ts
function collectItemSourceIds(item) {
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
		const itemSourceIds = collectItemSourceIds(item);
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
		if (payload.patch.operations.some((operation) => operation.action === "remove_item")) throw payload.errors.create("BE_PATCH_OPERATION_INVALID", void 0, { details: { patch_id: payload.entry.patch_id } });
		return;
	}
	const removedKeys = new Set(payload.patch.operations.filter((operation) => operation.action === "remove_item").map((operation) => operation.item_key));
	if (payload.patch.operations.some((operation) => operation.action !== "remove_item") || payload.entry.target_item_keys.some((itemKey) => !removedKeys.has(itemKey))) throw payload.errors.create("BE_PATCH_OPERATION_INVALID", void 0, { details: { patch_id: payload.entry.patch_id } });
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
		missingCode: "BE_INTERNAL_STATE_CORRUPT",
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
		missingCode: "BE_INTERNAL_STATE_CORRUPT",
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
		const packet = await readCanonicalPacket({
			backlogRoot: payload.backlogRoot,
			dependencies: payload.dependencies,
			schemas: payload.schemas,
			errors: payload.errors,
			canonicalPath: packetEntry.canonical_path
		});
		if (JSON.stringify(packet.items.map((item) => item.item_key)) !== JSON.stringify(packetEntry.item_keys)) throw payload.errors.create("BE_INTERNAL_STATE_CORRUPT", void 0, { details: {
			packet_id: packetEntry.packet_id,
			reason: "Packet item_keys do not match applied registry entry."
		} });
		state = applyPacketReplay({
			state,
			packet,
			errors: payload.errors
		});
	}
	const patchEntries = [...runtimeArtifacts.appliedRegistry.patches].sort((left, right) => {
		const applyCompare = left.apply_index - right.apply_index;
		if (applyCompare !== 0) return applyCompare;
		const sequenceCompare = left.sequence - right.sequence;
		if (sequenceCompare !== 0) return sequenceCompare;
		return left.canonical_path.localeCompare(right.canonical_path);
	});
	for (const patchEntry of patchEntries) {
		const patch = await readCanonicalPatch({
			backlogRoot: payload.backlogRoot,
			dependencies: payload.dependencies,
			schemas: payload.schemas,
			errors: payload.errors,
			canonicalPath: patchEntry.canonical_path
		});
		validatePatchKind({
			entry: patchEntry,
			patch,
			errors: payload.errors
		});
		state = applyPatchReplay({
			state,
			patch,
			errors: payload.errors
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
//#region src/runtime/state-recovery.ts
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
//#region src/runtime/create-runtime.ts
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
				hint: "Run `backlog-engineer init --path <path>` inside a new backlog root or execute the command from an existing backlog directory."
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
							return {
								absolutePath,
								canonicalBasename: dependencies.path.basename(absolutePath),
								rawContent: await dependencies.fs.readText(absolutePath)
							};
						} catch (error) {
							if (isErrnoException(error) && error.code === "ENOENT") throw modules.errors.create("BE_INPUT_FILE_NOT_FOUND", void 0, {
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
//#region src/cli/run-cli.ts
function commandHelpRequested(args) {
	return args.includes("--help") || args.includes("-h");
}
function writeJson(stream, payload) {
	stream.write(`${JSON.stringify(payload)}\n`);
}
function usageHint() {
	return `Run \`${CLI_DISPLAY_NAME} --help\` to inspect the available command surface.`;
}
function writeErrorPayload(cliIo, error) {
	writeJson(cliIo.stderr, error.toPayload());
	return error.exitCode;
}
async function runCli(argv, cliIo, version, dependencies = {}) {
	try {
		const intent = parseCliIntent(argv);
		const findCommandImpl = dependencies.findCommand ?? findCommand;
		const createRuntimeImpl = dependencies.createRuntime ?? createRuntime;
		if (intent.kind === "global_help") {
			writeJson(cliIo.stdout, buildGlobalHelpOutput(version));
			return 0;
		}
		if (intent.kind === "version") {
			writeJson(cliIo.stdout, buildVersionOutput(version));
			return 0;
		}
		const commandName = intent.commandName;
		const command = findCommandImpl(commandName);
		if (!command) throw createUsageError({
			reason: "unknown_command",
			command: commandName
		}, usageHint());
		if (intent.kind === "command_help") {
			writeJson(cliIo.stdout, buildCommandHelpOutput(command, version));
			return 0;
		}
		if (commandHelpRequested(intent.args)) {
			writeJson(cliIo.stdout, buildCommandHelpOutput(command, version));
			return 0;
		}
		const input = command.parseArgs(intent.args);
		const runtime = createRuntimeImpl();
		const commandCwd = dependencies.getCwd ? dependencies.getCwd() : runtime.getProcessCwd();
		const context = await runtime.createContext(command.name, commandCwd);
		await context.hooks.beforeCommand?.({
			command: command.name,
			input,
			...context.backlogRoot ? { backlogRoot: context.backlogRoot } : {}
		});
		const output = await command.execute(input, context);
		const validatedOutput = command.outputSchema.parse(output);
		await context.hooks.afterCommand?.({
			command: command.name,
			output: validatedOutput,
			...context.backlogRoot ? { backlogRoot: context.backlogRoot } : {}
		});
		writeJson(cliIo.stdout, validatedOutput);
		return 0;
	} catch (error) {
		return writeErrorPayload(cliIo, normalizeError(error));
	}
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