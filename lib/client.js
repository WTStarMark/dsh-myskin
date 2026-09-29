window.__ModuleLoader__.load({ id: "dsh-myskin", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  NAMESPACE_CANDIDATES: () => NAMESPACE_CANDIDATES,
  SETTINGS_NS: () => SETTINGS_NS,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);

// src/client/MySkinSection.tsx
var import_react = require("react");
var import_client = require("react-dom/client");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/icons.ts
var primitives = __toESM(require("@deepseek-ai/dsh-client-ui-primitives"), 1);
var table = primitives;
function pick(candidates) {
  for (const candidate of candidates) {
    const icon = table[candidate];
    if (typeof icon === "function") return icon;
  }
  return function MissingIcon() {
    return null;
  };
}
var IconPersonalization = pick(["IconPersonalizationOutlineRegular", "IconPersonalizationOutlineMedium", "IconPersonalizationOutline16"]);
var IconPlus = pick(["IconPlusOutlineRegular", "IconPlusOutlineMedium", "IconPlusOutline16"]);
var IconTrash = pick(["IconTrashOutlineRegular", "IconTrashOutlineMedium", "IconTrashOutline16"]);
var IconClose = pick(["IconCloseOutlineRegular", "IconCloseOutlineMedium", "IconCloseOutline16"]);

// src/skin-schema.ts
var SKIN_SETTINGS_NAMESPACE = "dsh-myskin";
var LEGACY_SETTINGS_NAMESPACE = "myskin";
var EMPTY_SKIN = {
  enabled: false,
  tokens: {},
  css: [],
  text: [],
  canvas: { background: void 0, images: [] },
  layers: [],
  library: []
};
function cloneSkin(skin) {
  return {
    enabled: skin.enabled === true,
    tokens: { ...skin.tokens ?? {} },
    css: (skin.css ?? []).map((r) => ({ selector: r.selector, rule: r.rule })),
    text: (skin.text ?? []).map((o) => ({ selector: o.selector, before: o.before, after: o.after })),
    canvas: {
      ...skin.canvas ?? { images: [] },
      images: (skin.canvas?.images ?? []).map((i) => ({ ...i }))
    },
    layers: (skin.layers ?? []).map((l) => ({ ...l })),
    library: (skin.library ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      tokens: { ...s.tokens ?? {} },
      css: (s.css ?? []).map((r) => ({ selector: r.selector, rule: r.rule })),
      text: (s.text ?? []).map((o) => ({ selector: o.selector, before: o.before, after: o.after })),
      canvas: {
        ...s.canvas ?? { images: [] },
        images: (s.canvas?.images ?? []).map((i) => ({ ...i }))
      },
      layers: (s.layers ?? []).map((l) => ({ ...l }))
    }))
  };
}
function parseSkin(skin) {
  if (skin === void 0) return cloneSkin(EMPTY_SKIN);
  return cloneSkin(skin);
}

// src/client/desktop.ts
var RECALL_ATTRIBUTE = "data-window-drag-recall";
var PLUGIN_UI_ATTRIBUTE = "data-dsh-myskin-ui";
function readDesktopShell(doc) {
  const target = doc ?? (typeof document === "undefined" ? void 0 : document);
  const root = target?.documentElement;
  if (root === void 0 || root === null) {
    return { desktop: false, platform: void 0, windowsTitlebar: false, fullscreen: false };
  }
  const platform = root.getAttribute("data-platform") ?? void 0;
  const windowsTitlebar = root.hasAttribute("data-windows-titlebar");
  return {
    desktop: platform !== void 0 || windowsTitlebar,
    platform,
    windowsTitlebar,
    fullscreen: root.hasAttribute("data-fullscreen")
  };
}
function editorFrameRules(shell) {
  const rules = [];
  rules.push("body > :not(#root):not([data-dsh-myskin-ui]):has([data-shortcut-modal]) {");
  rules.push("  top: calc(var(--dsh-myskin-chrome-top, 0px) + var(--dsh-myskin-inset-top, 48px)) !important;");
  rules.push("  right: var(--dsh-myskin-inset-right, 340px) !important;");
  rules.push("}");
  rules.push('[data-shortcut-modal="settings"] {');
  rules.push("  height: min(800px, max(240px, calc(100vh - var(--dsh-myskin-chrome-top, 0px) - var(--dsh-myskin-inset-top, 48px) - 48px))) !important;");
  rules.push("  max-width: calc(100vw - var(--dsh-myskin-inset-right, 340px) - 48px) !important;");
  rules.push("}");
  if (shell.desktop) {
    if (shell.windowsTitlebar) {
      rules.push("html[data-windows-titlebar] { --dsh-myskin-chrome-top: var(--dsh-windows-titlebar-height, 40px); }");
    }
    if (shell.platform === "darwin") {
      rules.push("html[data-platform='darwin'] { --dsh-myskin-leading: 96px; }");
      rules.push("html[data-platform='darwin'][data-fullscreen] { --dsh-myskin-leading: 24px; }");
    }
    rules.push("[" + PLUGIN_UI_ATTRIBUTE + "] { -webkit-app-region: no-drag; app-region: no-drag; }");
  }
  if (shell.windowsTitlebar) {
    rules.push('[class*="_frame"] { padding-top: calc(var(--dsh-windows-titlebar-height, 40px) + var(--dsh-myskin-inset-top, 48px)) !important; }');
    rules.push("body { margin-right: var(--dsh-myskin-inset-right, 340px) !important; }");
  } else {
    rules.push("body {");
    rules.push("  margin-top: var(--dsh-myskin-inset-top, 48px) !important;");
    rules.push("  margin-right: var(--dsh-myskin-inset-right, 340px) !important;");
    rules.push("  height: calc(100vh - var(--dsh-myskin-inset-top, 48px)) !important;");
    rules.push("}");
    rules.push("#root { height: 100% !important; }");
  }
  return rules;
}
function defaultSchedule(doc) {
  const view = doc.defaultView;
  if (view !== null && typeof view.requestAnimationFrame === "function") {
    return (frame) => {
      view.requestAnimationFrame(() => {
        frame();
      });
    };
  }
  return (frame) => {
    setTimeout(frame, 16);
  };
}
function pulseWindowDragRecall(doc, frames = 3, schedule) {
  const target = doc ?? (typeof document === "undefined" ? void 0 : document);
  if (target === void 0 || readDesktopShell(target).platform !== "darwin") return;
  const body = target.body;
  if (body === null) return;
  const next = schedule ?? defaultSchedule(target);
  let left = frames;
  const step = () => {
    body.removeAttribute(RECALL_ATTRIBUTE);
    if (left <= 0) return;
    left -= 1;
    body.setAttribute(RECALL_ATTRIBUTE, "");
    next(step);
  };
  step();
}

// src/client/skin-engine.ts
var PLUGIN_ID = "dsh-myskin";
var STYLE_ID = "dsh-myskin-rule";
function parseCssColor(color) {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/);
  if (m !== null) {
    const raw = m[4];
    const alpha = raw === void 0 ? 1 : raw.endsWith("%") ? Number(raw.slice(0, -1)) / 100 : Number(raw);
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: Number.isFinite(alpha) ? alpha : 1 };
  }
  const h = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (h === null) return void 0;
  const hex = h[1].length === 3 ? h[1].split("").map((c) => c + c).join("") : h[1];
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
  };
}
function directTextNode(el) {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) return node;
  }
  return void 0;
}
function textMatches(data, before) {
  const raw = data.trim();
  return before === "" ? raw !== "" : raw === before.trim();
}
function findTargets(entry) {
  if (typeof document === "undefined") return [];
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  const add = (el) => {
    if (el !== null && !seen.has(el)) {
      seen.add(el);
      result.push(el);
    }
  };
  if (entry.selector !== "") {
    try {
      document.querySelectorAll(entry.selector).forEach(add);
    } catch {
    }
  }
  if (result.length === 0) {
    for (const el of Array.from(document.body?.querySelectorAll("*") ?? [])) {
      const text = directTextNode(el);
      if (text !== void 0 && textMatches(text.data, entry.before)) {
        add(el);
        continue;
      }
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        if (el.placeholder === entry.before) add(el);
      }
    }
  }
  return result;
}
function defaultSkin() {
  return { enabled: false, tokens: {}, css: [], text: [], canvas: { background: void 0, images: [] }, layers: [], library: [] };
}
function currentSettingsPageKey(doc) {
  const cell = doc.querySelector('button[aria-current="true"]');
  if (cell === null) return "";
  const label = (cell.textContent ?? "").replace(/\s+/g, " ").trim();
  if (label === "") return "";
  let pos = 0;
  const parent = cell.parentElement;
  if (parent !== null) {
    let i = 0;
    for (const c of Array.from(parent.children)) {
      if (c === cell) {
        pos = i;
        break;
      }
      if (c.tagName === "BUTTON") i++;
    }
  }
  return label + "@" + pos;
}
var DEFAULT_BACKGROUND_OPACITY = 0.75;
var BG_OPACITY_SELECTOR = ":root";
var BG_OPACITY_PROPERTY = "--dsh-myskin-bg-opacity";
function readBackgroundOpacity(skin) {
  const explicit = skin.canvas.backgroundOpacity;
  if (typeof explicit === "number" && Number.isFinite(explicit)) return explicit;
  for (const rule of skin.css ?? []) {
    if (rule.selector !== BG_OPACITY_SELECTOR) continue;
    const match = rule.rule.match(/--dsh-myskin-bg-opacity:\s*([\d.]+)/);
    if (match !== null) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) return value;
    }
  }
  return DEFAULT_BACKGROUND_OPACITY;
}
function withBackgroundOpacity(css, opacity) {
  const value = String(Math.round(opacity * 100) / 100);
  const rest = (css ?? []).filter((rule) => !(rule.selector === BG_OPACITY_SELECTOR && rule.rule.includes(BG_OPACITY_PROPERTY)));
  return [...rest.map((rule) => ({ selector: rule.selector, rule: rule.rule })), { selector: BG_OPACITY_SELECTOR, rule: BG_OPACITY_PROPERTY + ": " + value + ";" }];
}
var FRAME_SELECTOR = '[class*="_frame"], [class~="frame"]';
var COLUMN_SELECTORS = ['[class*="_centerCol"]', '[class~="centerCol"]'];
var CENTER_COLUMN_SELECTOR = COLUMN_SELECTORS.join(", ");
var SEAT_SELECTORS = ["[data-composer-seat]", '[class*="_composerSeat"]', '[class~="composerSeat"]'];
var CONTENT_SLOT_SELECTORS = ['[data-slot="conversation.session"]', '[data-slot^="conversation.view"]'];
function scoped(outer, inner) {
  const out = [];
  for (const ancestor of outer) for (const descendant of inner) out.push(ancestor + " " + descendant);
  return out.join(", ");
}
var HIDE_DECLARATION = "visibility: hidden !important";
var REMOVE_DECLARATION = "display: none !important";
function declarationPairs(rule) {
  const out = [];
  for (const part of rule.replace(/\/\*[\s\S]*?\*\//g, "").split(";")) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const prop = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (prop !== "" && value !== "") out.push([prop, value]);
  }
  return out;
}
function mergeDeclaration(rule, addition) {
  const merged = new Map(declarationPairs(rule ?? ""));
  for (const [prop, value] of declarationPairs(addition)) merged.set(prop, value);
  return [...merged].map(([prop, value]) => prop + ": " + value).join("; ");
}
function withoutDeclaration(rule, property) {
  return declarationPairs(rule ?? "").filter(([prop]) => prop !== property).map(([prop, value]) => prop + ": " + value).join("; ");
}
function textCarrier(el) {
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE && child.data.trim() !== "") return child;
  }
  return void 0;
}
function textHostOf(el) {
  if (textCarrier(el) !== void 0) return el;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return el;
  for (const child of Array.from(el.querySelectorAll("*"))) {
    if (textCarrier(child) !== void 0) return child;
  }
  return void 0;
}
var INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="menuitemcheckbox"], [role="checkbox"], [role="switch"]';
var COMPOSER_PLACEHOLDER_SELECTOR = "[data-composer-placeholder]";
function layoutAvailable(doc) {
  const rect = doc.body?.getBoundingClientRect();
  return rect !== void 0 && (rect.width > 0 || rect.height > 0);
}
function underPoint(el, clientX, clientY, layout) {
  if (!layout) return true;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}
var SNAP_THRESHOLD = 4;
function snapAxis(start, size, targets, threshold = SNAP_THRESHOLD) {
  const edges = [start, start + size / 2, start + size];
  let best;
  for (const edge of edges) {
    for (const target of targets) {
      const delta = target - edge;
      if (!Number.isFinite(delta) || Math.abs(delta) > threshold) continue;
      if (best === void 0 || Math.abs(delta) < Math.abs(best.delta)) best = { delta, line: target };
    }
  }
  return best;
}
function snapMove(box, targets, threshold = SNAP_THRESHOLD) {
  const x = snapAxis(box.left, box.width, targets.x, threshold);
  const y = snapAxis(box.top, box.height, targets.y, threshold);
  const lines = [];
  if (x !== void 0) lines.push({ axis: "x", at: x.line });
  if (y !== void 0) lines.push({ axis: "y", at: y.line });
  return { dx: x?.delta ?? 0, dy: y?.delta ?? 0, lines };
}
function snapScale(box, scale, targets, threshold = SNAP_THRESHOLD) {
  if (!(box.width > 0) || !(box.height > 0)) return { scale, lines: [] };
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  let best;
  const consider = (axis, center, current, lines) => {
    for (const target of lines) {
      const from = target >= center ? center + current / 2 : center - current / 2;
      const error = Math.abs(target - from);
      if (!Number.isFinite(error) || error > threshold) continue;
      const wanted = Math.abs(target - center) * 2;
      if (!(wanted > 0)) continue;
      const factor = wanted / current;
      if (best === void 0 || error < best.error) best = { factor, error, line: { axis, at: target } };
    }
  };
  consider("x", cx, box.width, targets.x);
  consider("y", cy, box.height, targets.y);
  if (best === void 0) return { scale, lines: [] };
  return { scale: Math.round(scale * best.factor * 100) / 100, lines: [best.line] };
}
function snapTargetsFor(el, isOwn = () => false, max = 40) {
  const x = [];
  const y = [];
  const push = (rect) => {
    if (rect.width === 0 && rect.height === 0) return;
    x.push(rect.left, rect.left + rect.width / 2, rect.left + rect.width);
    y.push(rect.top, rect.top + rect.height / 2, rect.top + rect.height);
  };
  const parent = el.parentElement;
  if (parent !== null) {
    push(parent.getBoundingClientRect());
    let seen = 0;
    for (const sibling of Array.from(parent.children)) {
      if (seen >= max) break;
      if (sibling === el || isOwn(sibling)) continue;
      seen += 1;
      push(sibling.getBoundingClientRect());
    }
  }
  const view = el.ownerDocument.defaultView;
  if (view !== null) {
    x.push(view.innerWidth / 2);
    y.push(view.innerHeight / 2);
  }
  return { x, y };
}
function stepValue(current, direction, step, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  const base = Number.isFinite(current) ? current : 0;
  const next = Math.min(max, Math.max(min, base + direction * step));
  return Math.round(next * 100) / 100;
}
function isPointerlessTextOverlay(el) {
  if (textCarrier(el) === void 0) return false;
  const view = el.ownerDocument.defaultView;
  return view !== null && view.getComputedStyle(el).pointerEvents === "none";
}
function textOverlayAt(stack, clientX, clientY, isOwn = () => false) {
  const usable = stack.filter((el) => !isOwn(el));
  if (usable.length === 0) return void 0;
  const layout = layoutAvailable(usable[0].ownerDocument);
  const candidates = (predicate) => {
    const found = [];
    for (const host of usable) {
      if (predicate(host) && underPoint(host, clientX, clientY, layout)) found.push(host);
      for (const child of Array.from(host.children)) {
        if (!isOwn(child) && predicate(child) && underPoint(child, clientX, clientY, layout)) found.push(child);
      }
    }
    return found;
  };
  const marker = candidates((el) => el.matches(COMPOSER_PLACEHOLDER_SELECTOR));
  if (marker.length > 0) return marker[0];
  const overlay = candidates(isPointerlessTextOverlay);
  return overlay[0];
}
function pickElementAt(stack, clientX, clientY, isOwn = () => false) {
  const usable = stack.filter((el) => !isOwn(el));
  if (usable.length === 0) return void 0;
  const hit = usable[0];
  const interactive2 = hit.closest(INTERACTIVE_SELECTOR);
  if (interactive2 !== null && !isOwn(interactive2)) return interactive2;
  return textOverlayAt(usable, clientX, clientY, isOwn) ?? hit;
}
var INSPECTOR_PROPERTIES = [
  "font-size",
  "font-family",
  "font-weight",
  "line-height",
  "text-align",
  "color",
  "width",
  "height",
  "padding",
  "margin",
  "border-radius",
  "border-width",
  "border-color",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "box-shadow",
  "opacity",
  "transform"
];
function withManagedDeclarations(existing, addition, managed = INSPECTOR_PROPERTIES) {
  const kept = declarationPairs(existing ?? "").filter(([property]) => !managed.includes(property));
  const next = declarationPairs(addition);
  return [...kept, ...next].map(([property, value]) => property + ": " + value).join("; ");
}
function fontFormat(fileName) {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  if (ext === ".woff2") return "woff2";
  if (ext === ".woff") return "woff";
  if (ext === ".ttf") return "truetype";
  if (ext === ".otf") return "opentype";
  return void 0;
}
function fontFaceRule(family, url, format) {
  return "font-family: '" + family + "'; src: url('" + url + "') format('" + format + "'); font-display: swap;";
}
function transformValue(x, y, scale) {
  const round = (value) => String(Math.round(value * 100) / 100);
  const parts = [];
  if (Number.isFinite(x) && Number.isFinite(y) && (x !== 0 || y !== 0)) parts.push("translate(" + round(x) + "px, " + round(y) + "px)");
  if (Number.isFinite(scale) && scale !== 1) parts.push("scale(" + round(scale) + ")");
  return parts.join(" ");
}
function parseTransform(rule) {
  const found = declarationPairs(rule ?? "").find(([property]) => property === "transform")?.[1] ?? "";
  const translate = found.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/);
  const scale = found.match(/scale\(\s*(-?[\d.]+)\s*\)/);
  return {
    x: translate === null ? 0 : Number(translate[1]),
    y: translate === null ? 0 : Number(translate[2]),
    scale: scale === null ? 1 : Number(scale[1])
  };
}
function sameDeclarations(left, right) {
  const parse = (rule) => {
    const out = /* @__PURE__ */ new Map();
    for (const [property, value] of declarationPairs(rule ?? "")) {
      out.set(property, value.replace(/\s*!important\s*$/i, "").replace(/\s+/g, " ").trim());
    }
    return out;
  };
  const a = parse(left);
  const b = parse(right);
  if (a.size !== b.size) return false;
  for (const [property, value] of a) if (b.get(property) !== value) return false;
  return true;
}
function elementLabel(el, maxText = 28) {
  const tag = el.tagName.toLowerCase();
  const id = el.id === "" ? "" : "#" + el.id;
  const classes = (el.getAttribute("class") ?? "").split(/\s+/).filter((name2) => name2 !== "").slice(0, 2);
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  const snippet = text === "" ? "" : " \xB7 " + (text.length > maxText ? text.slice(0, maxText) + "\u2026" : text);
  return tag + id + classes.map((name2) => "." + name2).join("") + snippet;
}
function parentTarget(el, isOwn = () => false) {
  const parent = el.parentElement;
  if (parent === null || isOwn(parent)) return void 0;
  return parent;
}
function childTargetIn(stack, el, isOwn = () => false) {
  const direct = [];
  for (const candidate of stack) {
    if (candidate === el || isOwn(candidate) || !el.contains(candidate)) continue;
    let node = candidate;
    while (node.parentElement !== null && node.parentElement !== el) node = node.parentElement;
    if (node.parentElement === el && !direct.includes(node)) direct.push(node);
  }
  return direct[0];
}
var FONT_FACE_SELECTOR = "@font-face";
var STABLE_ANCHORS = [
  ["[data-shortcut-modal]", "data-shortcut-modal"],
  ['[role="dialog"]', void 0],
  ['[role="menu"]', void 0],
  ['[role="listbox"]', void 0]
];
function escapeId(id, view) {
  const carrier = globalThis;
  const fromWindow = view;
  const css = carrier.CSS ?? (fromWindow === null ? void 0 : fromWindow.CSS);
  if (css !== void 0 && typeof css.escape === "function") return css.escape(id);
  return id.replace(/[^A-Za-z0-9_-]/g, (char) => "\\" + char);
}
function pathWithin(ancestor, el) {
  const parts = [];
  let node = el;
  while (node !== null && node !== ancestor) {
    const current = node;
    const parent = current.parentElement;
    if (parent === null) break;
    const sameTag = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
    const index = sameTag.indexOf(current) + 1;
    const name2 = current.tagName.toLowerCase();
    parts.unshift(index > 1 ? name2 + ":nth-of-type(" + index + ")" : name2);
    node = parent;
  }
  return parts.join(" > ");
}
function selectorOf(el) {
  if (el.id !== "") return "#" + escapeId(el.id, el.ownerDocument.defaultView);
  const root = el.ownerDocument.getElementById("root");
  if (root !== null && root !== el && root.contains(el)) return "#root > " + pathWithin(root, el);
  for (const [anchor, attribute] of STABLE_ANCHORS) {
    const holder = el.closest(anchor);
    if (holder === null) continue;
    const base = attribute === void 0 ? anchor : "[" + attribute + '="' + (holder.getAttribute(attribute) ?? "") + '"]';
    const rest = holder === el ? "" : pathWithin(holder, el);
    return rest === "" ? base : base + " > " + rest;
  }
  return "body > " + pathWithin(el.ownerDocument.body, el);
}
function surfaceTint(doc, opacity = DEFAULT_BACKGROUND_OPACITY, frameTint) {
  if (!(opacity < 0.999)) return void 0;
  const base = Math.min(0.98, Math.max(0.35, opacity));
  const surface = shellSurfaceColor(doc);
  const tint = surface === void 0 && frameTint !== void 0 ? parseCssColor(frameTint) : void 0;
  const rgb = surface ?? (tint === void 0 ? void 0 : tint.r + ", " + tint.g + ", " + tint.b);
  if (rgb === void 0) return void 0;
  return { rgb, base, panel: Math.min(1, base + 0.15), target: surface === void 0 ? "frame" : "token" };
}
function wallpaperRules(doc, url, tint) {
  const geometry = "background-size: cover !important; background-position: center !important; background-attachment: fixed !important;";
  const body = 'background-image: url("' + url + '") !important; ' + geometry;
  const rules = ["body { " + body + " }"];
  const fmt = (value) => String(Math.round(value * 100) / 100);
  const layers = tint === void 0 ? 'url("' + url + '")' : "linear-gradient(rgba(" + tint.rgb + ", " + fmt(tint.base) + "), rgba(" + tint.rgb + ", " + fmt(tint.base) + ')), url("' + url + '")';
  const shell = readDesktopShell(doc);
  if (shell.windowsTitlebar) {
    rules.push(CENTER_COLUMN_SELECTOR + " { background-image: " + layers + " !important; " + geometry + " background-color: transparent !important; }");
    return rules;
  }
  if (!shell.desktop) return rules;
  rules.push(FRAME_SELECTOR + " { background-image: " + layers + " !important; " + geometry + " }");
  if (tint !== void 0) rules.push(CENTER_COLUMN_SELECTOR + " { background-color: transparent !important; }");
  return rules;
}
function shellSurfaceColor(doc) {
  const frame = doc.querySelector(FRAME_SELECTOR);
  for (const el of [frame, doc.body]) {
    if (el === null || el === void 0) continue;
    const parsed = parseCssColor(getComputedStyle(el).backgroundColor);
    if (parsed === void 0 || parsed.a === 0) continue;
    return parsed.r + ", " + parsed.g + ", " + parsed.b;
  }
  return void 0;
}
function desktopFrameTint(doc) {
  if (!readDesktopShell(doc).desktop) return void 0;
  const view = doc.defaultView;
  if (view === null) return void 0;
  for (const el of [doc.body, doc.documentElement]) {
    if (el === null || el === void 0) continue;
    const value = view.getComputedStyle(el).getPropertyValue("--dsw-alias-bg-base").trim();
    if (value !== "" && parseCssColor(value) !== void 0) return value;
  }
  return void 0;
}
function backgroundSurfaceRules(doc, opacity = DEFAULT_BACKGROUND_OPACITY, frameTint) {
  const tint = surfaceTint(doc, opacity, frameTint);
  if (tint === void 0) return [];
  const fmt = (value) => String(Math.round(value * 100) / 100);
  const rules = [tint.target === "token" ? "body { --dsw-alias-bg-base: rgba(" + tint.rgb + ", " + fmt(tint.base) + ") !important; }" : FRAME_SELECTOR + " { background-color: rgba(" + tint.rgb + ", " + fmt(tint.base) + ") !important; }"];
  if (tint.panel < 0.999) rules.push("body { --dsw-alias-bg-layer-1: rgba(" + tint.rgb + ", " + fmt(tint.panel) + ") !important; }");
  const canvas = "rgba(" + tint.rgb + ", " + fmt(tint.base) + ")";
  rules.push(CENTER_COLUMN_SELECTOR + " { --dsw-alias-bg-base: transparent !important; }");
  rules.push(scoped(COLUMN_SELECTORS, CONTENT_SLOT_SELECTORS) + " { --dsw-alias-bg-base: " + canvas + " !important; }");
  rules.push(scoped(COLUMN_SELECTORS, SEAT_SELECTORS) + " { background: none !important; --dsw-alias-bg-base: " + canvas + " !important; }");
  return rules;
}
function embedAfter(img) {
  const blend = img.blend !== void 0 && img.blend !== "normal" ? " mix-blend-mode: " + img.blend + ";" : "";
  return `::after { content: ''; position: absolute; inset: 0; background-image: url("` + img.url + '"); background-repeat: no-repeat; background-position: ' + img.x + "px " + img.y + "px; background-size: " + img.w + "px " + img.h + "px; opacity: " + (img.opacity ?? 1) + "; pointer-events: none; z-index: 1;" + blend + " }";
}
function applySkin(theme, skin) {
  const cleanups = [];
  let disposed = false;
  let bodyStyleProto = null;
  if (typeof document !== "undefined") bodyStyleProto = document.body.getAttribute("style");
  if (Object.keys(skin.tokens).length > 0) {
    const disposeTokens = theme.overrideTokens(PLUGIN_ID, skin.tokens);
    cleanups.push(() => {
      disposeTokens();
    });
    if (typeof document !== "undefined") {
      const dark = document.body.hasAttribute("data-ds-dark-theme") || document.documentElement.style.colorScheme === "dark";
      const sv = ((name2, modes) => {
        document.body.style.setProperty(name2, dark ? modes.dark : modes.light);
        cleanups.push(() => {
          document.body.style.removeProperty(name2);
        });
      });
      for (const [name2, modes] of Object.entries(skin.tokens)) sv(name2, modes);
    }
  }
  const rules = [];
  const embedTargets = skin.canvas.images.filter(
    (img) => img.selector !== "" && img.url !== "" && img.fallbackSelector !== void 0 && img.fallbackSelector !== ""
  );
  for (const img of skin.canvas.images) {
    if (img.selector === "" || img.url === "") continue;
    rules.push(img.selector + " { position: relative; }");
    rules.push(img.selector + embedAfter(img));
  }
  if (embedTargets.length > 0 && typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    const taggedElements = /* @__PURE__ */ new Map();
    const taggedChains = /* @__PURE__ */ new Map();
    const pick2 = (selector) => {
      let els;
      try {
        els = Array.from(document.querySelectorAll(selector));
      } catch {
        return void 0;
      }
      if (els.length === 0) return void 0;
      if (els.length === 1) return els[0];
      return els.find((el) => el.getClientRects().length > 0) ?? els[0];
    };
    const chainOf = (el) => {
      const chain = [];
      let node = el;
      while (node !== null && node !== document.body && chain.length < 8) {
        chain.unshift(node.tagName + "." + (node.getAttribute("class") ?? ""));
        node = node.parentElement;
      }
      return chain;
    };
    const findByChain = (chain) => {
      if (chain.length === 0) return void 0;
      const leaf = chain[chain.length - 1];
      const dot = leaf.indexOf(".");
      const tag = leaf.slice(0, dot).toLowerCase();
      const classes = leaf.slice(dot + 1).trim().split(/\s+/).filter((name2) => name2 !== "");
      const selector = classes.reduce((acc, name2) => acc + "." + name2, tag);
      let candidates;
      try {
        candidates = Array.from(document.querySelectorAll(selector));
      } catch {
        return void 0;
      }
      const matches = candidates.filter((el) => {
        const own = chainOf(el);
        return own.length === chain.length && own.every((part, index) => part === chain[index]);
      });
      return matches.length === 1 ? matches[0] : void 0;
    };
    const retag = () => {
      if (disposed) return;
      const curKey = currentSettingsPageKey(document);
      for (const img of embedTargets) {
        const scoped2 = img.pageKey !== void 0 && img.pageKey !== "";
        if (scoped2 && img.pageKey !== curKey) {
          const stale = document.querySelector('[data-dsh-myskin-embed="' + img.id + '"]');
          if (stale !== null) stale.removeAttribute("data-dsh-myskin-embed");
          taggedElements.delete(img.id);
          taggedChains.delete(img.id);
          continue;
        }
        const known = taggedElements.get(img.id);
        let target = pick2(img.fallbackSelector);
        if (target === void 0 && known !== void 0 && known.isConnected) target = known;
        if (target === void 0) {
          const chain = taggedChains.get(img.id);
          if (chain !== void 0) target = findByChain(chain);
        }
        if (target === void 0) continue;
        if (target.getAttribute("data-dsh-myskin-embed") !== img.id) target.setAttribute("data-dsh-myskin-embed", img.id);
        taggedElements.set(img.id, target);
        taggedChains.set(img.id, chainOf(target));
      }
    };
    retag();
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        retag();
      });
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-current", "class", "hidden"] });
    cleanups.push(() => {
      mo.disconnect();
    });
  }
  if (skin.canvas.background !== void 0 && skin.canvas.background !== "" && typeof document !== "undefined") {
    const opacity = readBackgroundOpacity(skin);
    rules.push(...wallpaperRules(document, skin.canvas.background, surfaceTint(document, opacity, desktopFrameTint(document))));
    rules.push(...backgroundSurfaceRules(document, opacity, desktopFrameTint(document)));
  }
  for (const { selector, rule } of skin.css) {
    if (selector !== "" && rule !== "") rules.push(`${selector} { ${rule} }`);
  }
  if (rules.length > 0 && typeof document !== "undefined") {
    const tag = document.createElement("style");
    tag.dataset.plugin = PLUGIN_ID;
    tag.dataset.pluginCss = STYLE_ID;
    tag.id = STYLE_ID;
    tag.textContent = rules.join("\n");
    document.head.appendChild(tag);
    cleanups.push(() => {
      tag.remove();
    });
  }
  const layerList = skin.layers.filter((l) => l.selector !== "" && (l.kind === "div" || l.url !== void 0 && l.url !== ""));
  if (layerList.length > 0 && typeof document !== "undefined") {
    const injectedNodes = /* @__PURE__ */ new Set();
    const injectLayer = (layer) => {
      if (disposed) return;
      const container = document.querySelector(layer.selector);
      if (container === null) return;
      const key = '[data-dsh-myskin-layer="' + layer.id + '"]';
      if (container.querySelector(key) !== null) return;
      const node = document.createElement(layer.kind);
      node.setAttribute("data-dsh-myskin-layer", layer.id);
      node.setAttribute("data-dsh-myskin-owner", PLUGIN_ID);
      node.setAttribute("aria-hidden", "true");
      if (layer.kind === "img") {
        const img = node;
        img.alt = "";
        img.src = layer.url || "";
      } else if (layer.url !== void 0 && layer.url !== "") {
        ;
        node.style.backgroundImage = 'url("' + layer.url + '")';
        node.style.backgroundSize = "contain";
        node.style.backgroundRepeat = "no-repeat";
      }
      const st = node.style;
      if (layer.x !== void 0) st.left = layer.x + "px";
      if (layer.y !== void 0) st.top = layer.y + "px";
      if (layer.w !== void 0) st.width = layer.w + "px";
      if (layer.h !== void 0) st.height = layer.h + "px";
      if (layer.opacity !== void 0) st.opacity = String(layer.opacity);
      if (layer.blend !== void 0 && layer.blend !== "normal") st.mixBlendMode = layer.blend;
      if (layer.css) st.cssText += (st.cssText === "" ? "" : "; ") + layer.css;
      if (layer.attach === "prepend") container.prepend(node);
      else container.append(node);
      injectedNodes.add(node);
    };
    for (const layer of layerList) injectLayer(layer);
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        for (const layer of layerList) injectLayer(layer);
      });
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      mo.disconnect();
      injectedNodes.forEach((n) => n.remove());
      injectedNodes.clear();
    });
  }
  if ((skin.css ?? []).some((r2) => String(r2.selector).includes("data-maid-")) && typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    const decorated = /* @__PURE__ */ new Set();
    const decorate = () => {
      if (disposed) return;
      document.querySelectorAll("[role='tree']").forEach((tree) => {
        const rows = Array.from(tree.querySelectorAll("[role='treeitem']"));
        if (tree.matches("[class*='flatList']") && !rows.some((r) => r.hasAttribute("aria-expanded"))) {
          rows.filter((r) => r.hasAttribute("aria-selected")).forEach((r) => {
            r.dataset.maidWorkspaceRow = "";
            r.dataset.maidSessionRow = "";
            r.dataset.maidSessionFlat = "";
            decorated.add(r);
          });
          return;
        }
        let workspaceRow;
        let sessionRows = [];
        const decorateGroup = () => {
          if (!workspaceRow) return;
          workspaceRow.dataset.maidWorkspaceRow = "";
          decorated.add(workspaceRow);
          if (workspaceRow.parentElement) {
            workspaceRow.parentElement.dataset.maidWorkspaceGroup = "";
            decorated.add(workspaceRow.parentElement);
          }
          sessionRows.forEach((r) => {
            r.dataset.maidSessionRow = "";
            decorated.add(r);
          });
          if (sessionRows[0]) sessionRows[0].dataset.maidSessionFirst = "";
          if (sessionRows.at(-1)) sessionRows.at(-1).dataset.maidSessionLast = "";
          const current = workspaceRow.getAttribute("aria-expanded") === "true" && sessionRows.some((r) => r.getAttribute("aria-selected") === "true");
          if (current) workspaceRow.dataset.maidWorkspaceActive = "";
        };
        rows.forEach((row) => {
          if (row.hasAttribute("aria-expanded")) {
            decorateGroup();
            workspaceRow = row;
            sessionRows = [];
          } else if (workspaceRow && row.hasAttribute("aria-selected")) sessionRows.push(row);
        });
        decorateGroup();
      });
    };
    decorate();
    const observer = new MutationObserver(() => {
      decorate();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["aria-expanded", "aria-selected"], childList: true, subtree: true });
    const clear = () => {
      observer.disconnect();
      decorated.forEach((el) => {
        delete el.dataset.maidWorkspaceRow;
        delete el.dataset.maidWorkspaceGroup;
        delete el.dataset.maidWorkspaceActive;
        delete el.dataset.maidSessionRow;
        delete el.dataset.maidSessionFlat;
        delete el.dataset.maidSessionFirst;
        delete el.dataset.maidSessionLast;
      });
      decorated.clear();
    };
    cleanups.push(clear);
  }
  const textEntries = skin.text.filter((e) => e.after !== "" && e.before !== e.after);
  const patches = /* @__PURE__ */ new Map();
  const placeholderPatches = [];
  if (textEntries.length > 0 && typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    let scheduled = false;
    const applyTexts = () => {
      scheduled = false;
      if (disposed) return;
      for (const entry of textEntries) {
        for (const el of findTargets(entry)) {
          const node = directTextNode(el);
          if (node !== void 0 && textMatches(node.data, entry.before)) {
            if (!patches.has(node)) patches.set(node, { node, original: node.data, applied: entry.after });
            node.data = entry.after;
          } else if (node === void 0 && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
            if (el.placeholder === entry.before) {
              el.placeholder = entry.after;
              placeholderPatches.push({ el, original: entry.before, applied: entry.after });
            }
          }
        }
      }
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(applyTexts);
    };
    applyTexts();
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    cleanups.push(() => {
      mo.disconnect();
    });
  }
  cleanups.push(() => {
    for (const p of placeholderPatches) {
      if (p.el.placeholder === p.applied) p.el.placeholder = p.original;
    }
  });
  cleanups.push(() => {
    for (const patch of patches.values()) {
      if (patch.node.data === patch.applied) patch.node.data = patch.original;
    }
    patches.clear();
  });
  cleanups.push(() => {
    if (typeof document === "undefined") return;
    if (bodyStyleProto === null) document.body.removeAttribute("style");
    else document.body.setAttribute("style", bodyStyleProto);
  });
  return {
    dispose() {
      disposed = true;
      for (const cleanup of cleanups.splice(0)) cleanup();
    }
  };
}
function currentSkin(value) {
  return value ?? defaultSkin();
}

// src/client/canvas-ui.ts
var CANVAS_UI_STYLE_ID = "dsh-myskin-canvas-ui";
var CANVAS_UI_ATTR = "data-dsh-myskin-draw";
function canvasUiRules() {
  return [
    "@keyframes dsh-myskin-drop { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }",
    "@keyframes dsh-myskin-slide { from { opacity: 0; transform: translateX(14px) } to { opacity: 1; transform: translateX(0) } }",
    "@keyframes dsh-myskin-pop { from { opacity: 0; transform: scale(.982) } to { opacity: 1; transform: scale(1) } }",
    "@keyframes dsh-myskin-fade { from { opacity: 0 } to { opacity: 1 } }",
    "@keyframes dsh-myskin-pulse { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }",
    "[data-dsh-myskin-canvas] { --dsh-myskin-ease: cubic-bezier(.2, .7, .3, 1) }",
    // Toolbar: entrance + a soft seat so it reads as its own surface above the app.
    "[data-dsh-myskin-canvas] .dsh-myskin-bar { animation: dsh-myskin-drop 170ms var(--dsh-myskin-ease) both; box-shadow: 0 12px 26px -22px rgba(0, 0, 0, .6) }",
    "[data-dsh-myskin-canvas] .dsh-myskin-sep { width: 1px; align-self: stretch; margin: 6px 2px; flex: none; background: var(--dsw-alias-border-l2) }",
    // Panel: entrance + a fade/slide when folded away. Width is NOT animated: the page
    // inset follows the panel through a ResizeObserver, and animating it would re-layout
    // the whole app on every frame.
    "[data-dsh-myskin-canvas] .dsh-myskin-panel { animation: dsh-myskin-slide 190ms var(--dsh-myskin-ease) both; transition: opacity 140ms ease, transform 140ms ease; box-shadow: -12px 0 28px -24px rgba(0, 0, 0, .65) }",
    '[data-dsh-myskin-canvas] .dsh-myskin-panel[data-open="0"] { opacity: 0; transform: translateX(16px) }',
    "[data-dsh-myskin-canvas] .dsh-myskin-card { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; transition: background-color 140ms ease, border-color 140ms ease }",
    "[data-dsh-myskin-canvas] .dsh-myskin-card:hover { border-color: var(--dsw-alias-border-l3) }",
    // Hover/selection chrome: two tiny boxes, animation only on (re)mount.
    "[data-dsh-myskin-canvas] .dsh-myskin-box { animation: dsh-myskin-pop 130ms var(--dsh-myskin-ease) both }",
    "[data-dsh-myskin-canvas] .dsh-myskin-chip { animation: dsh-myskin-fade 130ms var(--dsh-myskin-ease) both; box-shadow: 0 3px 12px -8px rgba(0, 0, 0, .6) }",
    "[data-dsh-myskin-canvas] .dsh-myskin-hoverbox { opacity: .9 }",
    // Alignment guides: a hairline that fades in, no layout, nothing to clean up.
    "[data-dsh-myskin-canvas] .dsh-myskin-guide { animation: dsh-myskin-fade 90ms ease-out both; box-shadow: 0 0 3px -1px var(--dsw-alias-brand-primary) }",
    // Save chip: the only looping animation, and only while a write is in flight.
    "[data-dsh-myskin-canvas] .dsh-myskin-dot { transition: background-color 160ms ease }",
    '[data-dsh-myskin-canvas] .dsh-myskin-dot[data-state="saving"] { animation: dsh-myskin-pulse 900ms ease-in-out infinite }',
    "[data-dsh-myskin-canvas] .dsh-myskin-warn { animation: dsh-myskin-fade 140ms ease-out both }",
    // Our own controls (the ui-primitives Button styles itself; these do not).
    "[data-dsh-myskin-canvas] .dsh-myskin-iconbtn { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 0; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l2); background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 12px; line-height: 18px; transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease, transform 90ms ease }",
    "[data-dsh-myskin-canvas] .dsh-myskin-iconbtn:hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l3); color: var(--dsw-alias-label-primary) }",
    "[data-dsh-myskin-canvas] .dsh-myskin-iconbtn:active { transform: scale(.92) }",
    "[data-dsh-myskin-canvas] .dsh-myskin-iconbtn:disabled { opacity: .35; cursor: default; transform: none }",
    "[data-dsh-myskin-canvas] .dsh-myskin-iconbtn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px }",
    // Collapsible group headers: the chevron rotates instead of the body growing.
    "[data-dsh-myskin-canvas] .dsh-myskin-head { display: flex; align-items: center; gap: 6px; width: 100%; padding: 2px 0; background: transparent; border: none; cursor: pointer; text-align: left; color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 20px; font-weight: 500; transition: color 120ms ease }",
    "[data-dsh-myskin-canvas] .dsh-myskin-head:hover { color: var(--dsw-alias-brand-primary) }",
    "[data-dsh-myskin-canvas] .dsh-myskin-head:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; border-radius: 6px }",
    "[data-dsh-myskin-canvas] .dsh-myskin-chev { display: inline-block; width: 10px; flex: none; color: var(--dsw-alias-label-tertiary); transition: transform 160ms var(--dsh-myskin-ease) }",
    '[data-dsh-myskin-canvas] .dsh-myskin-head[data-open="0"] .dsh-myskin-chev { transform: rotate(-90deg) }',
    "[data-dsh-myskin-canvas] .dsh-myskin-body { display: flex; flex-direction: column; gap: 8px; animation: dsh-myskin-fade 150ms ease-out both }",
    "[data-dsh-myskin-canvas] .dsh-myskin-field { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; width: 100%; min-height: 28px; padding: 0 2px; border-radius: 7px; font-size: 12px; line-height: 20px; transition: background-color 120ms ease }",
    "[data-dsh-myskin-canvas] .dsh-myskin-field:hover { background: var(--dsw-alias-bg-layer-2) }",
    "[data-dsh-myskin-canvas] .dsh-myskin-empty { display: flex; flex-direction: column; gap: 8px; padding: 16px 14px; border: 1px dashed var(--dsw-alias-border-l3); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; animation: dsh-myskin-fade 160ms ease-out both }",
    // Thin scrollbar for the panel only (the app keeps its own).
    "[data-dsh-myskin-canvas] .dsh-myskin-scroll::-webkit-scrollbar { width: 8px; height: 8px }",
    "[data-dsh-myskin-canvas] .dsh-myskin-scroll::-webkit-scrollbar-thumb { background: var(--dsw-alias-border-l2); border-radius: 8px }",
    "[data-dsh-myskin-canvas] .dsh-myskin-scroll::-webkit-scrollbar-track { background: transparent }",
    // Sliders and disclosure markers get the native-surface treatment too: the panel
    // otherwise mixes styled controls with raw browser widgets.
    '[data-dsh-myskin-canvas] input[type="range"] { -webkit-appearance: none; appearance: none; height: 18px; background: transparent; cursor: pointer }',
    '[data-dsh-myskin-canvas] input[type="range"]::-webkit-slider-runnable-track { height: 4px; border-radius: 999px; background: var(--dsw-alias-border-l2) }',
    '[data-dsh-myskin-canvas] input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; margin-top: -4px; border-radius: 50%; background: var(--dsw-alias-brand-primary); border: 2px solid var(--dsw-alias-bg-overlay); transition: transform 100ms ease }',
    '[data-dsh-myskin-canvas] input[type="range"]:hover::-webkit-slider-thumb { transform: scale(1.15) }',
    '[data-dsh-myskin-canvas] input[type="range"]:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; border-radius: 999px }',
    "[data-dsh-myskin-canvas] details > summary { list-style: none; cursor: pointer }",
    "[data-dsh-myskin-canvas] details > summary::-webkit-details-marker { display: none }",
    '[data-dsh-myskin-canvas] details > summary::before { content: "\\25B8"; display: inline-block; width: 10px; color: var(--dsw-alias-label-tertiary); transition: transform 160ms var(--dsh-myskin-ease) }',
    "[data-dsh-myskin-canvas] details[open] > summary::before { transform: rotate(90deg) }",
    // Picking cursor over the real page; our own chrome keeps its normal cursors.
    "html[" + CANVAS_UI_ATTR + '="1"] body, html[' + CANVAS_UI_ATTR + '="1"] body :not([data-dsh-myskin-ui]):not([data-dsh-myskin-ui] *) { cursor: crosshair }',
    "@media (prefers-reduced-motion: reduce) {",
    '  [data-dsh-myskin-canvas] .dsh-myskin-bar, [data-dsh-myskin-canvas] .dsh-myskin-panel, [data-dsh-myskin-canvas] .dsh-myskin-box, [data-dsh-myskin-canvas] .dsh-myskin-chip, [data-dsh-myskin-canvas] .dsh-myskin-body, [data-dsh-myskin-canvas] .dsh-myskin-empty, [data-dsh-myskin-canvas] .dsh-myskin-warn, [data-dsh-myskin-canvas] .dsh-myskin-dot, [data-dsh-myskin-canvas] .dsh-myskin-chev, [data-dsh-myskin-canvas] .dsh-myskin-guide, [data-dsh-myskin-canvas] input[type="range"]::-webkit-slider-thumb { animation: none !important; transition: none !important }',
    "}"
  ].join(String.fromCharCode(10));
}
function wheelStep(deltaY, shiftKey) {
  if (deltaY === 0) return void 0;
  return { direction: deltaY < 0 ? 1 : -1, big: shiftKey };
}
function attachWheelNudge(el, onStep) {
  const onWheel = (e) => {
    const step = wheelStep(e.deltaY, e.shiftKey);
    if (step === void 0) return;
    e.preventDefault();
    onStep(step.direction, step.big);
  };
  el.addEventListener("wheel", onWheel, { passive: false });
  return () => {
    el.removeEventListener("wheel", onWheel);
  };
}
function mountCanvasUi(doc) {
  const tag = doc.createElement("style");
  tag.id = CANVAS_UI_STYLE_ID;
  tag.textContent = canvasUiRules();
  doc.head.appendChild(tag);
  return () => {
    tag.remove();
  };
}
function setDrawCursor(doc, on) {
  if (on) doc.documentElement.setAttribute(CANVAS_UI_ATTR, "1");
  else doc.documentElement.removeAttribute(CANVAS_UI_ATTR);
}

// src/client/dshskin.ts
var DSHSKIN_FORMAT = "dshskin";
var DSHSKIN_EXTENSION = ".dshskin";
var DSHSKIN_VERSION = 1;
var ASSET_REF_PREFIX = "dshskin:";
var MANIFEST_PATH = "manifest.json";
var README_PATH = "README.txt";
var ASSET_DIR = "assets";
function toArrayBuffer(bytes) {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}
var DATA_URL = /data:([A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+)?(;base64)?,([A-Za-z0-9+/=%\s]*)/g;
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
function base64ToBytes(base64) {
  const clean = base64.replace(/\s+/g, "");
  const binary = atob(clean);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}
function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
function dataUrlMime(url) {
  const match = /^data:([A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+)?[;,]/.exec(url);
  return match?.[1] ?? "application/octet-stream";
}
function dataUrlBytes(url) {
  if (!url.startsWith("data:")) return void 0;
  const comma = url.indexOf(",");
  if (comma < 0) return void 0;
  const head = url.slice(0, comma);
  const body = url.slice(comma + 1);
  if (!head.includes(";base64")) return textEncoder.encode(decodeURIComponent(body));
  return base64ToBytes(body);
}
function bytesToDataUrl(bytes, mime) {
  return "data:" + mime + ";base64," + bytesToBase64(bytes);
}
var MIME_EXTENSIONS = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "font/woff2": "woff2",
  "font/woff": "woff",
  "font/ttf": "ttf",
  "font/otf": "otf",
  "application/font-woff2": "woff2",
  "application/font-woff": "woff"
};
function extForMime(mime) {
  const known = MIME_EXTENSIONS[mime.toLowerCase()];
  if (known !== void 0) return known;
  const tail = mime.split("/")[1] ?? "bin";
  return tail.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
}
function mimeForPath(path) {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  for (const [mime, known] of Object.entries(MIME_EXTENSIONS)) if (known === ext) return mime;
  return void 0;
}
function kindForMime(mime) {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("font/") || mime.includes("font-")) return "font";
  return "file";
}
var CRC_TABLE = (() => {
  const table2 = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let bit = 0; bit < 8; bit += 1) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    table2[i] = c >>> 0;
  }
  return table2;
})();
function crc32(bytes) {
  let c = 4294967295;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ c >>> 8;
  return (c ^ 4294967295) >>> 0;
}
function dosDateTime(date) {
  const time = date.getHours() << 11 | date.getMinutes() << 5 | Math.floor(date.getSeconds() / 2);
  const day = date.getFullYear() - 1980 << 9 | date.getMonth() + 1 << 5 | date.getDate();
  return { time: time & 65535, date: day & 65535 };
}
function zipStore(entries, now = /* @__PURE__ */ new Date()) {
  const { time, date } = dosDateTime(now);
  const prepared = entries.map((entry) => {
    const name2 = textEncoder.encode(entry.path);
    return { name: name2, bytes: entry.bytes, crc: crc32(entry.bytes) };
  });
  let size = 22;
  for (const entry of prepared) size += 30 + entry.name.length + entry.bytes.length + 46 + entry.name.length;
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  let offset = 0;
  const central = [];
  for (const entry of prepared) {
    const localOffset = offset;
    view.setUint32(offset, 67324752, true);
    offset += 4;
    view.setUint16(offset, 20, true);
    offset += 2;
    view.setUint16(offset, 2048, true);
    offset += 2;
    view.setUint16(offset, 0, true);
    offset += 2;
    view.setUint16(offset, time, true);
    offset += 2;
    view.setUint16(offset, date, true);
    offset += 2;
    view.setUint32(offset, entry.crc, true);
    offset += 4;
    view.setUint32(offset, entry.bytes.length, true);
    offset += 4;
    view.setUint32(offset, entry.bytes.length, true);
    offset += 4;
    view.setUint16(offset, entry.name.length, true);
    offset += 2;
    view.setUint16(offset, 0, true);
    offset += 2;
    out.set(entry.name, offset);
    offset += entry.name.length;
    out.set(entry.bytes, offset);
    offset += entry.bytes.length;
    central.push(localOffset);
  }
  const centralStart = offset;
  prepared.forEach((entry, index) => {
    view.setUint32(offset, 33639248, true);
    offset += 4;
    view.setUint16(offset, 20, true);
    offset += 2;
    view.setUint16(offset, 20, true);
    offset += 2;
    view.setUint16(offset, 2048, true);
    offset += 2;
    view.setUint16(offset, 0, true);
    offset += 2;
    view.setUint16(offset, time, true);
    offset += 2;
    view.setUint16(offset, date, true);
    offset += 2;
    view.setUint32(offset, entry.crc, true);
    offset += 4;
    view.setUint32(offset, entry.bytes.length, true);
    offset += 4;
    view.setUint32(offset, entry.bytes.length, true);
    offset += 4;
    view.setUint16(offset, entry.name.length, true);
    offset += 2;
    view.setUint16(offset, 0, true);
    offset += 2;
    view.setUint16(offset, 0, true);
    offset += 2;
    view.setUint16(offset, 0, true);
    offset += 2;
    view.setUint16(offset, 0, true);
    offset += 2;
    view.setUint32(offset, 0, true);
    offset += 4;
    view.setUint32(offset, central[index], true);
    offset += 4;
    out.set(entry.name, offset);
    offset += entry.name.length;
  });
  const centralSize = offset - centralStart;
  view.setUint32(offset, 101010256, true);
  offset += 4;
  view.setUint16(offset, 0, true);
  offset += 2;
  view.setUint16(offset, 0, true);
  offset += 2;
  view.setUint16(offset, prepared.length, true);
  offset += 2;
  view.setUint16(offset, prepared.length, true);
  offset += 2;
  view.setUint32(offset, centralSize, true);
  offset += 4;
  view.setUint32(offset, centralStart, true);
  offset += 4;
  view.setUint16(offset, 0, true);
  offset += 2;
  return out;
}
function isZip(bytes) {
  return bytes.length > 4 && bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4;
}
async function inflateRaw(bytes) {
  const codec = globalThis.DecompressionStream;
  if (codec === void 0) throw new Error("this environment cannot read deflated entries");
  const stream = new Blob([toArrayBuffer(bytes)]).stream().pipeThrough(new codec("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function unzip(bytes) {
  if (!isZip(bytes)) throw new Error("not a zip archive");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i -= 1) {
    if (view.getUint32(i, true) === 101010256) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("zip end-of-directory not found");
  const count = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const files = /* @__PURE__ */ new Map();
  for (let i = 0; i < count; i += 1) {
    if (view.getUint32(cursor, true) !== 33639248) throw new Error("zip central directory is damaged");
    const method = view.getUint16(cursor + 10, true);
    const crc = view.getUint32(cursor + 16, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name2 = textDecoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extraLength + commentLength;
    if (name2.endsWith("/")) continue;
    if (view.getUint32(localOffset, true) !== 67324752) throw new Error('zip entry "' + name2 + '" is damaged');
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const raw = bytes.subarray(start, start + compressedSize);
    let payload;
    if (method === 0) payload = raw;
    else if (method === 8) payload = await inflateRaw(raw);
    else throw new Error('zip entry "' + name2 + '" uses an unsupported compression method (' + method + ")");
    if (crc32(payload) !== crc) throw new Error('zip entry "' + name2 + '" failed its checksum');
    files.set(name2, payload);
  }
  return files;
}
function refString(value, refFor) {
  if (!value.includes("data:")) return value;
  return value.replace(DATA_URL, (match) => refFor(match));
}
function mapStrings(value, map) {
  if (typeof value === "string") return map(value);
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, map));
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = mapStrings(item, map);
    return out;
  }
  return value;
}
function replaceAssetRefs(value, urlFor) {
  if (!value.includes(ASSET_REF_PREFIX)) return value;
  let out = "";
  let rest = value;
  for (; ; ) {
    const at = rest.indexOf(ASSET_REF_PREFIX);
    if (at < 0) return out + rest;
    out += rest.slice(0, at);
    const after = rest.slice(at + ASSET_REF_PREFIX.length);
    const end = after.search(/[\s'")]/);
    const path = end < 0 ? after : after.slice(0, end);
    out += urlFor(path);
    if (end < 0) return out;
    rest = after.slice(end);
  }
}
function skinStats(skin) {
  return {
    tokens: Object.keys(skin.tokens ?? {}).length,
    css: (skin.css ?? []).length,
    text: (skin.text ?? []).length,
    images: (skin.canvas?.images ?? []).length,
    layers: (skin.layers ?? []).length,
    library: (skin.library ?? []).length
  };
}
function packSkin(skin, options) {
  const payloads = [];
  const seen = /* @__PURE__ */ new Map();
  let counter = 0;
  const refFor = (url) => {
    const known = seen.get(url);
    if (known !== void 0) return ASSET_REF_PREFIX + known;
    const mime = dataUrlMime(url);
    const bytes2 = dataUrlBytes(url) ?? new Uint8Array(0);
    counter += 1;
    const path = ASSET_DIR + "/" + kindForMime(mime) + "-" + counter + "." + extForMime(mime);
    payloads.push({ path, mime, bytes: bytes2 });
    seen.set(url, path);
    return ASSET_REF_PREFIX + path;
  };
  const packed = mapStrings(skin, (value) => refString(value, refFor));
  const manifest = {
    format: DSHSKIN_FORMAT,
    formatVersion: DSHSKIN_VERSION,
    generator: options.generator,
    name: options.name,
    createdAt: options.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    assets: payloads.map((payload) => ({ path: payload.path, kind: kindForMime(payload.mime), mime: payload.mime, bytes: payload.bytes.length })),
    stats: skinStats(skin),
    skin: packed
  };
  const readme = [
    "dshskin \u2014 DSH \u76AE\u80A4\u5305 / DSH skin package",
    "",
    "\u8FD9\u662F\u4E00\u4E2A ZIP \u5BB9\u5668\uFF08\u672C\u5305\u7528 STORE \u672A\u538B\u7F29\u5199\u5165\uFF0C\u4EFB\u4F55\u89E3\u538B\u5DE5\u5177\u90FD\u80FD\u6253\u5F00\uFF09\uFF1A",
    "  manifest.json  \u76AE\u80A4\u6587\u6863\uFF08\u56FE\u7247/\u5B57\u4F53\u7B49\u5DF2\u62BD\u6210 assets/ \u4E0B\u7684\u5F15\u7528\uFF09",
    "  assets/*       \u771F\u5B9E\u5B57\u8282\u7684\u8D44\u6E90\u6587\u4EF6\uFF0C\u53EF\u76F4\u63A5\u66FF\u6362\u6210\u81EA\u5DF1\u7684\u56FE/\u5B57\u4F53",
    "  README.txt     \u672C\u8BF4\u660E",
    "",
    "\u91CD\u65B0\u6253\u5305\u540E\u4ECD\u53EF\u5BFC\u5165\uFF1Amanifest.json \u91CC\u7684\u5F15\u7528\u5F62\u5982 dshskin:assets/image-1.webp\uFF0C",
    "\u628A\u540C\u540D\u6587\u4EF6\u6362\u6389\u5373\u53EF\uFF08\u6269\u5C55\u540D\u4FDD\u6301\u4E00\u81F4\u7684\u683C\u5F0F\uFF0C\u4F8B\u5982 .webp \u6362 .webp\uFF09\u3002",
    "\u5BFC\u5165\u53E3\u5728 DSH \u8BBE\u7F6E \u2192\u300C\u76AE\u80A4\u7BA1\u7406\u300D\u2192 \u5BFC\u5165\u76AE\u80A4\u3002",
    "",
    "generator: " + options.generator,
    "createdAt: " + manifest.createdAt,
    "assets: " + String(manifest.assets.length)
  ].join(String.fromCharCode(10));
  const bytes = zipStore([
    { path: MANIFEST_PATH, bytes: textEncoder.encode(JSON.stringify(manifest, null, 2)) },
    ...payloads.map((payload) => ({ path: payload.path, bytes: payload.bytes })),
    { path: README_PATH, bytes: textEncoder.encode(readme) }
  ]);
  return { bytes, manifest };
}
async function unpackSkin(bytes) {
  if (!isZip(bytes)) {
    const parsed = JSON.parse(textDecoder.decode(bytes));
    return {
      skin: parseSkin(parsed),
      manifest: {
        format: DSHSKIN_FORMAT,
        formatVersion: 0,
        generator: "legacy json",
        name: "dsh-myskin.json",
        createdAt: "",
        assets: [],
        stats: skinStats(parseSkin(parsed)),
        skin: parseSkin(parsed)
      }
    };
  }
  const files = await unzip(bytes);
  const manifestBytes = files.get(MANIFEST_PATH);
  if (manifestBytes === void 0) throw new Error("missing " + MANIFEST_PATH);
  const manifest = JSON.parse(textDecoder.decode(manifestBytes));
  if (manifest.format !== DSHSKIN_FORMAT) throw new Error("not a " + DSHSKIN_FORMAT + " package");
  if (typeof manifest.formatVersion !== "number" || manifest.formatVersion > DSHSKIN_VERSION) {
    throw new Error("package needs a newer dsh-myskin (format v" + String(manifest.formatVersion) + ")");
  }
  const mimes = new Map((manifest.assets ?? []).map((asset) => [asset.path, asset.mime]));
  const urls = /* @__PURE__ */ new Map();
  const missing = [];
  const used = /* @__PURE__ */ new Set();
  const urlFor = (path) => {
    used.add(path);
    const known = urls.get(path);
    if (known !== void 0) return known;
    const payload = files.get(path);
    if (payload === void 0) {
      missing.push(path);
      return ASSET_REF_PREFIX + path;
    }
    const mime = mimes.get(path) ?? mimeForPath(path) ?? "application/octet-stream";
    const url = bytesToDataUrl(payload, mime);
    urls.set(path, url);
    return url;
  };
  const skin = mapStrings(manifest.skin ?? {}, (value) => replaceAssetRefs(value, urlFor));
  if (missing.length > 0) throw new Error("package is missing assets: " + [...new Set(missing)].join(", "));
  return { skin: parseSkin(skin), manifest };
}

// src/client/presets.ts
function surfaces(elevated, floating, floatHover, contrast) {
  return {
    "--dsw-alias-button-elevated-fill": elevated,
    "--dsw-alias-button-floating-fill": floating,
    "--dsw-alias-button-floating-hover": floatHover,
    "--dsw-alias-button-contrast-fill": contrast
  };
}
function primary(brand, dimmed, hover, fg) {
  return {
    "--dsw-alias-button-primary-fill": brand,
    "--dsw-alias-button-primary-dimmed": dimmed,
    "--dsw-alias-button-primary-hover": hover,
    "--dsw-alias-label-primary-foreground": fg
  };
}
function interactive(hover, active) {
  return {
    "--dsw-alias-interactive-bg-hover": hover,
    "--dsw-alias-interactive-bg-active": active
  };
}
function toolbar(fill, hover) {
  return { "--dsw-alias-button-tool-bar-fill": fill, "--dsw-alias-button-tool-bar-hover": hover };
}
function labels(tertiary, caption, dimmed, modulePlatform) {
  return {
    "--dsw-alias-label-tertiary": tertiary,
    "--dsw-alias-label-caption": caption,
    "--dsw-alias-label-dimmed": dimmed,
    "--dsw-alias-bg-module-platform": modulePlatform
  };
}
function chrome(bgLayer3, borderL3, business, hoverDanger, sb1, sb2, sbh1, sbh2) {
  return {
    "--dsw-alias-bg-layer-3": bgLayer3,
    "--dsw-alias-border-l3": borderL3,
    "--dsw-alias-state-business-primary": business,
    "--dsw-alias-interactive-bg-hover-danger": hoverDanger,
    "--dsw-alias-scrollbar-bg-l1": sb1,
    "--dsw-alias-scrollbar-bg-l2": sb2,
    "--dsw-alias-scrollbar-hover-l1": sbh1,
    "--dsw-alias-scrollbar-hover-l2": sbh2
  };
}
function surfacesPlus(input, selector, infoFill, infoHover, navHover, navActive, borderThin) {
  return {
    "--dsw-specific-input-major": input,
    "--dsw-specific-selector": selector,
    "--dsw-alias-button-info-fill": infoFill,
    "--dsw-alias-button-info-hover": infoHover,
    "--dsw-specific-sidebar-nav-item-hover": navHover,
    "--dsw-specific-sidebar-nav-item-active": navActive,
    "--dsw-alias-border-l2-darkmode-thin": borderThin
  };
}
var deep = {
  "--dsw-alias-bg-base": { light: "#eef3fb", dark: "#0d1420" },
  "--dsw-alias-bg-layer-1": { light: "#f7faff", dark: "#131c2b" },
  "--dsw-alias-bg-layer-2": { light: "#eef3fb", dark: "#1a2437" },
  "--dsw-alias-bg-overlay": { light: "#ffffff", dark: "#1d2940" },
  "--dsw-specific-sidebar-fill": { light: "#e6edf9", dark: "#0f1826" },
  "--dsw-alias-border-l1": { light: "#cbd5e1", dark: "#263349" },
  "--dsw-alias-border-l2": { light: "#aab6c8", dark: "#334156" },
  "--dsw-alias-brand-primary": { light: "#2563eb", dark: "#4f8cff" },
  "--dsw-alias-label-primary": { light: "#0f172a", dark: "#e6edf7" },
  "--dsw-alias-label-secondary": { light: "#334155", dark: "#aab8cc" },
  ...primary({ light: "#2563eb", dark: "#4f8cff" }, { light: "#dbe7fb", dark: "#1e3a68" }, { light: "#1d4ed8", dark: "#7fb2ff" }, { light: "#ffffff", dark: "#eaf1ff" }),
  ...surfaces({ light: "#ffffff", dark: "#16233a" }, { light: "#ffffff", dark: "#1d2940" }, { light: "#e3ecfb", dark: "#2a3b5e" }, { light: "#dbe7fb", dark: "#1e3a68" }),
  ...interactive({ light: "rgba(37,99,235,0.08)", dark: "rgba(79,140,255,0.10)" }, { light: "rgba(37,99,235,0.14)", dark: "rgba(79,140,255,0.18)" }),
  ...toolbar({ light: "#e3ecfb", dark: "#1b2c4d" }, { light: "#cbdaf7", dark: "#24395f" }),
  ...surfacesPlus({ light: "#ffffff", dark: "#131c2b" }, { light: "#f5f6f7", dark: "#1d2940" }, { light: "#2563eb", dark: "#4f8cff" }, { light: "#1d4ed8", dark: "#7fb2ff" }, { light: "rgba(37,99,235,0.06)", dark: "rgba(79,140,255,0.08)" }, { light: "#dbe7fb", dark: "#1e3a68" }, { light: "rgba(0,0,0,0.10)", dark: "rgba(79,140,255,0.10)" }),
  ...labels({ light: "#5a6b85", dark: "#8ea0b8" }, { light: "#8a97ab", dark: "#6f8098" }, { light: "#aab6c8", dark: "#5a6b80" }, { light: "#e6edf9", dark: "#16233a" }),
  ...chrome({ light: "#e6edf9", dark: "#1a2437" }, { light: "#9fb2d0", dark: "#42598a" }, { light: "#2563eb", dark: "#4f8cff" }, { light: "rgba(220,38,38,0.06)", dark: "rgba(248,113,113,0.10)" }, { light: "rgba(0,0,0,0.10)", dark: "rgba(255,255,255,0.10)" }, { light: "rgba(0,0,0,0.16)", dark: "rgba(255,255,255,0.16)" }, { light: "rgba(0,0,0,0.16)", dark: "rgba(255,255,255,0.16)" }, { light: "rgba(0,0,0,0.24)", dark: "rgba(255,255,255,0.24)" })
};
var warm = {
  "--dsw-alias-bg-base": { light: "#fdf8f0", dark: "#1a130e" },
  "--dsw-alias-bg-layer-1": { light: "#fffaF3", dark: "#241a12" },
  "--dsw-alias-bg-layer-2": { light: "#fdf0e0", dark: "#2a1e14" },
  "--dsw-alias-bg-overlay": { light: "#fff8ee", dark: "#33241a" },
  "--dsw-specific-sidebar-fill": { light: "#f8ead6", dark: "#1c130c" },
  "--dsw-alias-border-l1": { light: "#e4d3ba", dark: "#40301f" },
  "--dsw-alias-border-l2": { light: "#d2bd9c", dark: "#54402a" },
  "--dsw-alias-brand-primary": { light: "#ea580c", dark: "#fb923c" },
  "--dsw-alias-label-primary": { light: "#2a2118", dark: "#f7f0e8" },
  "--dsw-alias-label-secondary": { light: "#6b5843", dark: "#c9b7a2" },
  ...primary({ light: "#ea580c", dark: "#fb923c" }, { light: "#fbe0d0", dark: "#4a2c19" }, { light: "#c2410c", dark: "#ffab66" }, { light: "#ffffff", dark: "#241611" }),
  ...surfaces({ light: "#fff3e6", dark: "#3a2717" }, { light: "#fff8ee", dark: "#33241a" }, { light: "#f8ead6", dark: "#40301f" }, { light: "#fbe0d0", dark: "#4a2c19" }),
  ...interactive({ light: "rgba(234,88,12,0.08)", dark: "rgba(251,146,60,0.10)" }, { light: "rgba(234,88,12,0.14)", dark: "rgba(251,146,60,0.18)" }),
  ...toolbar({ light: "#f9e7d8", dark: "#3a2717" }, { light: "#f2d3b6", dark: "#4a311c" }),
  ...surfacesPlus({ light: "#fffdf8", dark: "#2a1e14" }, { light: "#f8ead6", dark: "#33241a" }, { light: "#ea580c", dark: "#fb923c" }, { light: "#c2410c", dark: "#ffab66" }, { light: "rgba(234,88,12,0.06)", dark: "rgba(251,146,60,0.08)" }, { light: "#fbe0d0", dark: "#4a2c19" }, { light: "rgba(0,0,0,0.10)", dark: "rgba(251,146,60,0.10)" }),
  ...labels({ light: "#8a6f52", dark: "#c9b7a2" }, { light: "#a08a70", dark: "#9a8873" }, { light: "#c0ab90", dark: "#75604a" }, { light: "#f8ead6", dark: "#2a1e14" }),
  ...chrome({ light: "#f3e2cf", dark: "#34231a" }, { light: "#c8b398", dark: "#6a4f32" }, { light: "#ea580c", dark: "#fb923c" }, { light: "rgba(220,38,38,0.06)", dark: "rgba(248,113,113,0.10)" }, { light: "rgba(0,0,0,0.10)", dark: "rgba(255,255,255,0.10)" }, { light: "rgba(0,0,0,0.16)", dark: "rgba(255,255,255,0.16)" }, { light: "rgba(0,0,0,0.16)", dark: "rgba(255,255,255,0.16)" }, { light: "rgba(0,0,0,0.24)", dark: "rgba(255,255,255,0.24)" })
};
var night = {
  "--dsw-alias-bg-base": { light: "#0b0b0f", dark: "#000000" },
  "--dsw-alias-bg-layer-1": { light: "#131318", dark: "#0a0a0d" },
  "--dsw-alias-bg-layer-2": { light: "#0f0f14", dark: "#14141a" },
  "--dsw-alias-bg-overlay": { light: "#1b1b22", dark: "#1a1a22" },
  "--dsw-specific-sidebar-fill": { light: "#0d0d12", dark: "#000000" },
  "--dsw-alias-border-l1": { light: "#26262e", dark: "#26262e" },
  "--dsw-alias-border-l2": { light: "#33333c", dark: "#33333c" },
  "--dsw-alias-brand-primary": { light: "#a78bfa", dark: "#c4a7ff" },
  "--dsw-alias-label-primary": { light: "#f5f5fa", dark: "#ffffff" },
  "--dsw-alias-label-secondary": { light: "#9a9aa6", dark: "#b7b7c4" },
  ...primary({ light: "#a78bfa", dark: "#c4a7ff" }, { light: "#e9e2fb", dark: "#2e2450" }, { light: "#8b6ff5", dark: "#d3bcff" }, { light: "#1a1030", dark: "#1a1030" }),
  ...surfaces({ light: "#131318", dark: "#14141a" }, { light: "#1b1b22", dark: "#1a1a22" }, { light: "#26262e", dark: "#26262e" }, { light: "#e9e2fb", dark: "#2e2450" }),
  ...interactive({ light: "rgba(167,139,250,0.08)", dark: "rgba(196,167,255,0.10)" }, { light: "rgba(167,139,250,0.14)", dark: "rgba(196,167,255,0.18)" }),
  ...toolbar({ light: "#ded6f7", dark: "#241c40" }, { light: "#cec1f3", dark: "#2c2350" }),
  ...surfacesPlus({ light: "#131318", dark: "#0a0a0d" }, { light: "#1b1b22", dark: "#1a1a22" }, { light: "#a78bfa", dark: "#c4a7ff" }, { light: "#8b6ff5", dark: "#d3bcff" }, { light: "rgba(167,139,250,0.06)", dark: "rgba(196,167,255,0.08)" }, { light: "#e9e2fb", dark: "#2e2450" }, { light: "rgba(0,0,0,0.10)", dark: "rgba(196,167,255,0.10)" }),
  ...labels({ light: "#9a9aa6", dark: "#8a8a96" }, { light: "#7c7c88", dark: "#6f6f7b" }, { light: "#6f6f7b", dark: "#5c5c68" }, { light: "#1b1b22", dark: "#14141a" }),
  ...chrome({ light: "#0a0a0d", dark: "#0a0a0d" }, { light: "#3a3a44", dark: "#3a3a44" }, { light: "#a78bfa", dark: "#c4a7ff" }, { light: "rgba(220,38,38,0.06)", dark: "rgba(248,113,113,0.10)" }, { light: "rgba(0,0,0,0.10)", dark: "rgba(255,255,255,0.10)" }, { light: "rgba(0,0,0,0.16)", dark: "rgba(255,255,255,0.16)" }, { light: "rgba(0,0,0,0.16)", dark: "rgba(255,255,255,0.16)" }, { light: "rgba(0,0,0,0.24)", dark: "rgba(255,255,255,0.24)" })
};
var PRESETS = [
  { id: "default", labelKey: "presetDefault", tokens: {} },
  { id: "deep", labelKey: "presetDeep", tokens: deep },
  { id: "warm", labelKey: "presetWarm", tokens: warm },
  { id: "night", labelKey: "presetNight", tokens: night }
];

// src/client/token-catalog.ts
var TOKEN_GROUP_KEYS = {
  background: "tokenGroupBackground",
  border: "tokenGroupBorder",
  brand: "tokenGroupBrand",
  label: "tokenGroupLabel",
  button: "tokenGroupButton",
  interactive: "tokenGroupInteractive"
};
var TOKEN_CATALOG = [
  { name: "--dsw-alias-bg-base", group: "background" },
  { name: "--dsw-alias-bg-layer-1", group: "background" },
  { name: "--dsw-alias-bg-layer-2", group: "background" },
  { name: "--dsw-alias-bg-overlay", group: "background" },
  { name: "--dsw-specific-sidebar-fill", group: "background" },
  { name: "--dsw-alias-border-l1", group: "border" },
  { name: "--dsw-alias-border-l2", group: "border" },
  { name: "--dsw-alias-brand-primary", group: "brand" },
  { name: "--dsw-alias-label-primary", group: "label" },
  { name: "--dsw-alias-label-secondary", group: "label" },
  { name: "--dsw-alias-label-tertiary", group: "label" },
  { name: "--dsw-alias-button-primary-fill", group: "button" },
  { name: "--dsw-alias-button-primary-hover", group: "button" },
  { name: "--dsw-alias-button-primary-dimmed", group: "button" },
  { name: "--dsw-alias-button-elevated-fill", group: "button" },
  { name: "--dsw-alias-button-floating-fill", group: "button" },
  { name: "--dsw-alias-interactive-bg-hover", group: "interactive" },
  { name: "--dsw-alias-interactive-bg-active", group: "interactive" }
];

// src/client/MySkinSection.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var tok = {
  labelPrimary: "var(--dsw-alias-label-primary)",
  labelSecondary: "var(--dsw-alias-label-secondary)",
  labelTertiary: "var(--dsw-alias-label-tertiary)",
  borderL2: "var(--dsw-alias-border-l2)",
  borderL3: "var(--dsw-alias-border-l3)",
  bgLayer1: "var(--dsw-alias-bg-layer-1)",
  bgLayer2: "var(--dsw-alias-bg-layer-2)",
  bgOverlay: "var(--dsw-alias-bg-overlay)",
  bgBase: "var(--dsw-alias-bg-base)",
  brand: "var(--dsw-alias-brand-primary)",
  success: "var(--dsw-alias-state-success-primary)",
  warn: "var(--dsw-alias-state-warn-primary)",
  error: "var(--dsw-alias-state-error-primary)"
};
var BLEND_OPTIONS = [
  { value: "normal", labelKey: "blendNormal" },
  { value: "multiply", labelKey: "blendMultiply" },
  { value: "screen", labelKey: "blendScreen" },
  { value: "overlay", labelKey: "blendOverlay" }
];
var sectionStyle = { display: "flex", flexDirection: "column", width: "100%", maxWidth: 720, color: tok.labelPrimary, gap: 8 };
var titleStyle = { margin: 0, fontSize: 16, lineHeight: "24px", fontWeight: 500, color: tok.labelPrimary };
var introStyle = { margin: 0, fontSize: 14, lineHeight: "22px", color: tok.labelTertiary };
var rowStyle = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "0 0 8px 0", borderBottom: "1px solid " + tok.borderL2 };
var lastRowStyle = { ...rowStyle, borderBottom: "none" };
var rowTitleStyle = { fontSize: 14, lineHeight: "22px", color: tok.labelPrimary };
var btnBase = { whiteSpace: "nowrap", flexShrink: 0 };
function centerOf(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return void 0;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
function safeQuery(selector) {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}
function toNum(value, fallback) {
  const parsed = Number(value);
  return value.trim() === "" || !Number.isFinite(parsed) ? fallback : parsed;
}
function clampNum(v, min, max) {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}
function beginPointerDrag(e, onMove) {
  const el = e.currentTarget;
  const move = (ev) => onMove(ev);
  const finish = () => {
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
    }
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", finish);
    el.removeEventListener("pointercancel", finish);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("blur", finish);
  };
  try {
    el.setPointerCapture(e.pointerId);
  } catch {
  }
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", finish);
  el.addEventListener("pointercancel", finish);
  window.addEventListener("pointerup", finish);
  window.addEventListener("blur", finish);
}
function parseStateRule(rule) {
  const out = {};
  for (const part of rule.split(";")) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const prop = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).replace(/\s*!important\s*$/i, "").trim();
    if (value !== "") out[prop] = value;
  }
  return out;
}
function declarationPair(declaration) {
  const index = declaration.indexOf(":");
  return [declaration.slice(0, index).trim(), declaration.slice(index + 1).trim()];
}
var HIDE_PAIR = declarationPair(HIDE_DECLARATION);
var REMOVE_PAIR = declarationPair(REMOVE_DECLARATION);
function toHex(v) {
  if (v === "transparent") return void 0;
  const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m !== null) {
    if (m[4] !== void 0 && Number(m[4]) < 1) return void 0;
    const rgb = [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join("");
    return "#" + rgb;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return "#" + v.slice(1).split("").map((c) => c + c).join("");
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  return void 0;
}
function persist(scope, skin) {
  const writes = [
    ["enabled", scope.set("enabled", skin.enabled)],
    ["tokens", scope.set("tokens", skin.tokens)],
    ["css", scope.set("css", skin.css)],
    ["text", scope.set("text", skin.text)],
    ["canvas", scope.set("canvas", skin.canvas)],
    ["layers", scope.set("layers", skin.layers)],
    ["content", scope.set("content", skin.content ?? {})],
    ["library", scope.set("library", skin.library)]
  ];
  return Promise.all(writes.map(([, write]) => write)).then((accepted) => {
    const failed = writes.filter((_, index) => accepted[index] !== true).map(([field]) => field);
    return { ok: failed.length === 0, failed };
  });
}
function saveFailureText(report, t) {
  if (report.failed.includes("*")) return t("applyFailed");
  return t("saveFailed") + report.failed.join(", ");
}
function activePresetId(skin) {
  for (const p of PRESETS) {
    const pk = Object.keys(p.tokens);
    const sk = Object.keys(skin.tokens);
    if (pk.length !== sk.length) continue;
    if (!pk.every((k) => skin.tokens[k]?.light === p.tokens[k].light && skin.tokens[k]?.dark === p.tokens[k].dark)) continue;
    return p.id;
  }
  return void 0;
}
var editorHost;
function closeSkinEditor() {
  if (editorHost === void 0) return;
  editorHost.root.unmount();
  editorHost.container.remove();
  editorHost = void 0;
}
function openSkinEditor(initial, t, onCommit, onClose, onPersistStrength) {
  closeSkinEditor();
  const container = document.createElement("div");
  document.body.appendChild(container);
  editorHost = { root: (0, import_client.createRoot)(container), container };
  editorHost.root.render(
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SkinCanvas,
      {
        initial,
        t,
        onPersistStrength,
        onSave: onCommit,
        onCommit: async (next) => {
          const report = await onCommit(next);
          if (report.ok) closeSkinEditor();
          return report;
        },
        onClose: () => {
          onClose();
          closeSkinEditor();
        }
      }
    )
  );
}
function MySkinSection(props) {
  const { scope, theme, t, close } = props;
  if (scope === void 0 || theme === void 0 || t === void 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loaded, { scope, theme, t, close });
}
function Loaded({ scope, theme, t, close }) {
  const [skin, setSkin] = (0, import_react.useState)(() => parseSkin(scope.getSnapshot().value ?? EMPTY_SKIN));
  const [notice, setNotice] = (0, import_react.useState)(void 0);
  const [nameDialog, setNameDialog] = (0, import_react.useState)(null);
  const [skinName, setSkinName] = (0, import_react.useState)("\u6211\u7684\u76AE\u80A4");
  const LEGACY_LIB_KEY = "dsh-myskin.library";
  (0, import_react.useEffect)(() => {
    const sync = () => {
      const doc = parseSkin(scope.getSnapshot().value ?? EMPTY_SKIN);
      if (doc.library.length === 0) {
        try {
          const legacy = JSON.parse(window.localStorage.getItem(LEGACY_LIB_KEY) ?? "[]");
          if (Array.isArray(legacy) && legacy.length > 0) {
            const merged = { ...doc, library: legacy };
            setSkin(merged);
            void persist(scope, merged).catch(() => {
            });
            try {
              window.localStorage.removeItem(LEGACY_LIB_KEY);
            } catch {
            }
            return;
          }
        } catch {
        }
      }
      setSkin(doc);
    };
    sync();
    const unsub = scope.subscribe(sync);
    return () => {
      unsub();
    };
  }, [scope]);
  const persistNow = async (next) => {
    setSkin(parseSkin(next));
    try {
      return await persist(scope, next);
    } catch {
      return { ok: false, failed: ["*"] };
    }
  };
  const persistStrength = async (canvas, css) => {
    try {
      const accepted = await Promise.all([scope.set("canvas", canvas), scope.set("css", css)]);
      const failed = ["canvas", "css"].filter((_, index) => accepted[index] !== true);
      return { ok: failed.length === 0, failed };
    } catch {
      return { ok: false, failed: ["*"] };
    }
  };
  const update = (next) => {
    void persistNow(next).then((report) => {
      if (!report.ok) setNotice(saveFailureText(report, t));
    });
  };
  const applyNow = () => {
    void persist(scope, skin);
    setNotice(t("saved"));
  };
  const onPreview = () => {
    if (Object.keys(skin.tokens).length === 0 && skin.css.length === 0 && skin.text.length === 0) {
      setNotice(t("none"));
      return;
    }
    update({ ...skin, enabled: true });
    close?.();
  };
  const reset = () => {
    update(EMPTY_SKIN);
    setNotice(t("reset"));
  };
  const applyPreset = (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset === void 0) return;
    update({ ...skin, enabled: true, tokens: { ...preset.tokens } });
    setNotice(t("saved"));
  };
  const importRef = (0, import_react.useRef)(null);
  const onExport = () => {
    const name2 = skinName.trim() || "dsh-myskin";
    const { bytes, manifest } = packSkin(skin, { name: name2, generator: "dsh-myskin" });
    const blob = new Blob([toArrayBuffer(bytes)], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name2.replace(/[\\/:*?"<>|]/g, "-") + DSHSKIN_EXTENSION;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(t("exportedOk") + " \xB7 " + t("assetsLabel") + " " + String(manifest.assets.length));
  };
  const onImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file === void 0) return;
    const reader = new FileReader();
    reader.onerror = () => {
      setNotice(t("importError"));
    };
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result);
      void unpackSkin(bytes).then(({ skin: imported, manifest }) => {
        update(parseSkin(imported));
        setNotice(t("importedOk") + " \xB7 " + t("assetsLabel") + " " + String(manifest.assets.length));
      }).catch((error) => {
        setNotice(t("importError") + " " + (error instanceof Error ? error.message : ""));
      });
    };
    reader.readAsArrayBuffer(file);
  };
  const saveSkin = () => {
    setSkinName("\u6211\u7684\u76AE\u80A4");
    setNameDialog({ mode: "save" });
  };
  const renameSkin = (entry) => {
    setSkinName(entry.name);
    setNameDialog({ mode: "rename", id: entry.id });
  };
  const confirmSkinName = () => {
    const name2 = skinName.trim() || "\u6211\u7684\u76AE\u80A4";
    if (nameDialog === null) return;
    if (nameDialog.mode === "save") {
      const entry = {
        id: "skin-" + Date.now(),
        name: name2,
        tokens: skin.tokens,
        css: skin.css,
        text: skin.text,
        canvas: skin.canvas,
        // Required by NamedSkin: saving without it silently dropped every injected
        // layer from the library (and from any export of it).
        layers: skin.layers
      };
      update({ ...skin, library: [...skin.library, entry] });
    } else if (nameDialog.mode === "rename" && nameDialog.id !== void 0) {
      const id = nameDialog.id;
      update({ ...skin, library: skin.library.map((s) => s.id === id ? { ...s, name: name2 } : s) });
    }
    setNameDialog(null);
    setNotice(t("saved"));
  };
  const moveSkin = (entry, dir) => {
    const library = [...skin.library];
    const i = library.indexOf(entry);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= library.length) return;
    library[i] = library[j];
    library[j] = entry;
    update({ ...skin, library });
  };
  const loadSkin = (entry) => {
    update({ ...skin, enabled: true, tokens: entry.tokens, css: entry.css, text: entry.text, canvas: entry.canvas });
  };
  const deleteSkin = (id) => {
    update({ ...skin, library: skin.library.filter((s) => s.id !== id) });
  };
  const duplicateSkin = (entry) => {
    const copy = { ...entry, id: "skin-" + Date.now(), name: entry.name + " \xB7 " + t("copySuffix") };
    update({ ...skin, library: [...skin.library, copy] });
  };
  const activePreset = activePresetId(skin);
  const presetOf = PRESETS.find((p) => p.id === activePreset);
  const currentLabel = presetOf !== void 0 ? t(presetOf.labelKey) : Object.keys(skin.tokens).length > 0 || skin.css.length > 0 || skin.text.length > 0 ? t("customSkin") : t("none");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: sectionStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: titleStyle, children: t("title") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: introStyle, children: t("intro") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rowTitleStyle, children: t("skinLabel") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rowTitleStyle, children: currentLabel })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rowTitleStyle, children: t("preset") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
      PRESETS.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Pill, { style: btnBase, active: activePreset === preset.id, onClick: () => {
        applyPreset(preset.id);
      }, children: t(preset.labelKey) }, preset.id))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rowTitleStyle, children: t("enabled") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkinToggle, { checked: skin.enabled, onChange: (v) => update({ ...skin, enabled: v }), status: skin.enabled ? t("enabledOn") : t("enabledOff") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: lastRowStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPersonalization, { size: 16 }), onClick: () => {
        close?.();
        openSkinEditor(skin, t, (next) => persistNow(next), () => {
        }, (canvas, css) => persistStrength(canvas, css));
      }, children: t("edit") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", onClick: onPreview, children: t("preview") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, onClick: applyNow, children: t("apply") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "ghost", onClick: reset, children: t("reset") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: saveSkin, children: t("saveSkin") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: onExport, children: t("exportSkin") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
        importRef.current?.click();
      }, children: t("importSkin") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: importRef, type: "file", accept: ".dshskin,.zip,application/json,.json", style: { display: "none" }, onChange: onImportFile })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...lastRowStyle, color: tok.labelTertiary, fontSize: 12, lineHeight: "18px" }, children: t("skinPackHint") }),
    skin.library.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rowTitleStyle, children: t("skinLibrary") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } })
      ] }),
      skin.library.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: index === skin.library.length - 1 ? lastRowStyle : rowStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: 28, height: 28, borderRadius: 6, border: "1px solid " + tok.borderL2, background: entry.tokens["--dsw-alias-bg-base"]?.light ?? "var(--dsw-alias-bg-base)", overflow: "hidden", display: "inline-flex", flex: "none" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: "100%", height: 14, background: entry.tokens["--dsw-alias-brand-primary"]?.light ?? "var(--dsw-alias-brand-primary)" } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rowTitleStyle, children: entry.name }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
          moveSkin(entry, -1);
        }, children: t("layerUp") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
          moveSkin(entry, 1);
        }, children: t("layerDown") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlus, { size: 14 }), onClick: () => {
          duplicateSkin(entry);
        }, children: t("duplicate") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
          renameSkin(entry);
        }, children: t("rename") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "outline", onClick: () => {
          loadSkin(entry);
        }, children: t("load") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 14 }), onClick: () => {
          deleteSkin(entry.id);
        }, children: t("remove") })
      ] }, entry.id))
    ] }),
    notice === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "6px 0 0", fontSize: 12, lineHeight: "18px", color: tok.success }, children: notice }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Modal,
      {
        open: nameDialog !== null,
        onClose: () => {
          setNameDialog(null);
        },
        title: nameDialog?.mode === "rename" ? t("renameSkin") : t("saveSkin"),
        closeLabel: t("cancel"),
        footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", onClick: () => {
            setNameDialog(null);
          }, children: t("cancel") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, onClick: confirmSkinName, children: t("confirm") })
        ] }),
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Input,
          {
            value: skinName,
            autoFocus: true,
            onChange: (e) => {
              setSkinName(e.target.value);
            },
            onKeyDown: (e) => {
              if (e.key === "Enter") confirmSkinName();
            }
          }
        )
      }
    )
  ] });
}
function SkinToggle({ checked, onChange, status }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "button",
    {
      "data-dsh-myskin-ui": "1",
      role: "switch",
      "aria-checked": checked,
      onClick: () => {
        onChange(!checked);
      },
      style: { display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", padding: 0, cursor: "pointer", color: tok.labelPrimary },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { position: "relative", flex: "none", width: 40, height: 22, borderRadius: 11, background: checked ? tok.brand : "var(--dsw-alias-bg-layer-2)", border: "1px solid " + (checked ? tok.brand : tok.borderL2), transition: "background .15s, border-color .15s", boxShadow: "inset 0 1px 2px rgba(0,0,0,.06)" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { position: "absolute", top: 2, left: checked ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.25)", transition: "left .15s" } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 14, lineHeight: "22px", color: checked ? tok.brand : tok.labelSecondary }, children: status })
      ]
    }
  );
}
var MAX_FONT_BYTES = 30 * 1024 * 1024;
var FONT_WARN_BYTES = 2 * 1024 * 1024;
var FONT_SUGGESTIONS = [
  "system-ui",
  '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  '"Microsoft YaHei", "PingFang SC", sans-serif',
  '"Noto Sans CJK SC", "Source Han Sans SC", sans-serif',
  '"HarmonyOS Sans SC", "MiSans", "Alibaba PuHuiTi", sans-serif',
  'Georgia, "Songti SC", "SimSun", serif',
  '"Kaiti SC", "KaiTi", serif',
  '"JetBrains Mono", Consolas, "SFMono-Regular", monospace',
  "cursive"
];
var MAX_IMAGE_EDGE = 2048;
var MAX_WALLPAPER_EDGE = 1600;
var MAX_DATA_URL_LENGTH = 15e5;
async function readBoundedImage(file) {
  const first = await readImageFile(file, MAX_WALLPAPER_EDGE, 0.85);
  if (first === "") return { url: "", compressed: false };
  if (first.length <= MAX_DATA_URL_LENGTH) return { url: first, compressed: false };
  const steps = [[1280, 0.8], [960, 0.72]];
  for (const [edge, quality] of steps) {
    const next = await readImageFile(file, edge, quality);
    if (next !== "" && next.length <= MAX_DATA_URL_LENGTH) return { url: next, compressed: true };
  }
  return { url: "", compressed: true };
}
function readImageFile(file, maxEdge = MAX_IMAGE_EDGE, quality = 0.9) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const url = String(reader.result ?? "");
      if (url === "") {
        resolve("");
        return;
      }
      const image = new Image();
      image.onerror = () => resolve(url);
      image.onload = () => {
        const edge = Math.max(image.naturalWidth, image.naturalHeight);
        if (edge <= maxEdge || typeof document === "undefined") {
          resolve(url);
          return;
        }
        const scale = maxEdge / edge;
        const target = document.createElement("canvas");
        target.width = Math.max(1, Math.round(image.naturalWidth * scale));
        target.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = target.getContext("2d");
        if (context === null) {
          resolve(url);
          return;
        }
        context.drawImage(image, 0, 0, target.width, target.height);
        try {
          resolve(target.toDataURL("image/webp", quality));
        } catch {
          resolve(url);
        }
      };
      image.src = url;
    };
    reader.readAsDataURL(file);
  });
}
function SkinCanvas({ initial, onClose, onSave, onCommit, onPersistStrength, t }) {
  const [draft, setDraft] = (0, import_react.useState)(() => parseSkin(initial));
  const [selected, setSelected] = (0, import_react.useState)(void 0);
  const [mode, setMode] = (0, import_react.useState)("edit");
  const [showTokens, setShowTokens] = (0, import_react.useState)(false);
  const [hint, setHint] = (0, import_react.useState)(void 0);
  const [flash, setFlash] = (0, import_react.useState)(void 0);
  const [hover, setHover] = (0, import_react.useState)(void 0);
  const [panelOpen, setPanelOpen] = (0, import_react.useState)(true);
  const [confirmReset, setConfirmReset] = (0, import_react.useState)(false);
  const [selectionEpoch, setSelectionEpoch] = (0, import_react.useState)(0);
  const [snapOn, setSnapOn] = (0, import_react.useState)(true);
  const [guides, setGuides] = (0, import_react.useState)([]);
  const selectedRef = (0, import_react.useRef)(void 0);
  const closeRef = (0, import_react.useRef)(() => {
  });
  const lastPointRef = (0, import_react.useRef)(void 0);
  const embedBgRef = (0, import_react.useRef)(null);
  const pageBgRef = (0, import_react.useRef)(null);
  const [, bump] = (0, import_react.useState)(0);
  const liveStyleRef = (0, import_react.useRef)(null);
  const [, bumpHistory] = (0, import_react.useState)(0);
  const draftRef = (0, import_react.useRef)(draft);
  (0, import_react.useEffect)(() => {
    draftRef.current = draft;
  }, [draft]);
  const pastRef = (0, import_react.useRef)([]);
  const futureRef = (0, import_react.useRef)([]);
  const [save, setSave] = (0, import_react.useState)({ state: "saved" });
  const snapshot = () => {
    pastRef.current = [...pastRef.current, JSON.parse(JSON.stringify(draftRef.current))];
    futureRef.current = [];
    bumpHistory((n) => n + 1);
    setSave((prev) => prev.state === "dirty" ? prev : { state: "dirty" });
  };
  const undo = () => {
    const prev = pastRef.current[pastRef.current.length - 1];
    if (prev === void 0) return;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [draftRef.current, ...futureRef.current];
    setDraft(prev);
    bumpHistory((n) => n + 1);
  };
  const redo = () => {
    const next = futureRef.current[0];
    if (next === void 0) return;
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, draftRef.current];
    setDraft(next);
    bumpHistory((n) => n + 1);
  };
  (0, import_react.useEffect)(() => {
    let frame = 0;
    const schedule = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        bump((n) => n + 1);
      });
    };
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);
  (0, import_react.useEffect)(() => {
    if (mode !== "edit") return;
    const own = (target) => target instanceof Element && isOwnElement(target);
    const onPointerDown = (e) => {
      if (own(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const onClick = (e) => {
      if (own(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      liveApplyRef.current = false;
      liveTextRef.current = false;
      liveTransformRef.current = false;
      setConfirmReset(false);
      setHint(void 0);
      setFlash(void 0);
      setSelectionEpoch((n) => n + 1);
      setSelected(hitTest(e.clientX, e.clientY));
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [mode]);
  const barRef = (0, import_react.useRef)(null);
  const panelRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const root = document.documentElement;
    const priorStyle = root.getAttribute("style");
    const shell = readDesktopShell(document);
    const tag = document.createElement("style");
    tag.id = "dsh-myskin-frame";
    tag.textContent = editorFrameRules(shell).join(String.fromCharCode(10));
    document.head.appendChild(tag);
    const unmountUi = mountCanvasUi(document);
    pulseWindowDragRecall(document);
    const measure = () => {
      const bar = barRef.current;
      const panel = panelRef.current;
      root.style.setProperty("--dsh-myskin-inset-top", Math.round(bar === null ? 48 : bar.getBoundingClientRect().height) + "px");
      root.style.setProperty("--dsh-myskin-inset-right", Math.round(panel === null ? 340 : panel.getBoundingClientRect().width) + "px");
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (barRef.current !== null) observer.observe(barRef.current);
    if (panelRef.current !== null) observer.observe(panelRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      unmountUi();
      tag.remove();
      setDrawCursor(document, false);
      if (priorStyle === null) root.removeAttribute("style");
      else root.setAttribute("style", priorStyle);
      pulseWindowDragRecall(document);
    };
  }, []);
  (0, import_react.useEffect)(() => {
    setDrawCursor(document, mode === "edit");
    return () => {
      setDrawCursor(document, false);
    };
  }, [mode]);
  (0, import_react.useEffect)(() => {
    const rules = [];
    if (draft.canvas.background !== void 0 && draft.canvas.background !== "") {
      const opacity = readBackgroundOpacity(draft);
      rules.push(...wallpaperRules(document, draft.canvas.background, surfaceTint(document, opacity, desktopFrameTint(document))));
      rules.push(...backgroundSurfaceRules(document, opacity, desktopFrameTint(document)));
    }
    for (const { selector, rule } of draft.css) {
      if (selector !== "" && rule !== "") rules.push(selector + " { " + rule + " }");
    }
    for (const img of draft.canvas.images) {
      if (img.selector !== "" && img.url !== "") {
        rules.push(img.selector + " { position: relative; }");
        const blendCss = img.blend !== void 0 && img.blend !== "normal" ? " mix-blend-mode: " + img.blend + ";" : "";
        rules.push(img.selector + '::after { content: ""; position: absolute; inset: 0; background-image: url("' + img.url + '"); background-repeat: no-repeat; background-position: ' + img.x + "px " + img.y + "px; background-size: " + img.w + "px " + img.h + "px; opacity: " + (img.opacity ?? 1) + "; pointer-events: none; z-index: 1;" + blendCss + " }");
      }
    }
    const d = document;
    if (rules.length > 0) {
      if (liveStyleRef.current === null) {
        const tag = d.createElement("style");
        tag.dataset.live = "dsh-myskin";
        tag.id = "dsh-myskin-live";
        d.head.appendChild(tag);
        liveStyleRef.current = tag;
      }
      liveStyleRef.current.textContent = rules.join("\n");
    } else if (liveStyleRef.current !== null) {
      liveStyleRef.current.remove();
      liveStyleRef.current = null;
    }
  }, [draft.css, draft.canvas.background, draft.canvas.backgroundOpacity, draft.canvas.images]);
  (0, import_react.useEffect)(() => () => {
    if (liveStyleRef.current !== null) {
      liveStyleRef.current.remove();
      liveStyleRef.current = null;
    }
    restoreLiveText();
  }, []);
  const isOwnElement = (el) => el.getAttribute("data-dsh-myskin-ui") === "1" || el.closest('[data-dsh-myskin-ui="1"]') !== null || el === document.body || el === document.documentElement || el === document.getElementById("root");
  const elementAt = (clientX, clientY) => pickElementAt(Array.from(document.elementsFromPoint(clientX, clientY)), clientX, clientY, isOwnElement);
  const hitTest = (clientX, clientY) => {
    lastPointRef.current = { x: clientX, y: clientY };
    return elementAt(clientX, clientY);
  };
  const applyStyle = (selector, declaration) => {
    snapshot();
    const rules = draft.css.filter((r) => r.selector !== selector);
    setDraft({ ...draft, css: [...rules, { selector, rule: declaration }] });
  };
  const liveApplyRef = (0, import_react.useRef)(false);
  const liveTransformRef = (0, import_react.useRef)(false);
  const liveApply = (selector, declaration) => {
    if (!liveApplyRef.current) {
      snapshot();
      liveApplyRef.current = true;
    }
    const existing = draft.css.find((r) => r.selector === selector)?.rule;
    const merged = withManagedDeclarations(existing, declaration);
    if (sameDeclarations(existing, merged)) return;
    const rest = draft.css.filter((r) => r.selector !== selector);
    setDraft({ ...draft, css: merged === "" ? rest : [...rest, { selector, rule: merged }] });
  };
  const setElementProperty = (selector, property, value) => {
    snapshot();
    const existing = draft.css.find((r) => r.selector === selector)?.rule;
    const merged = value === void 0 ? withoutDeclaration(existing, property) : mergeDeclaration(existing, property + ": " + value);
    const rest = draft.css.filter((r) => r.selector !== selector);
    setDraft({ ...draft, css: merged === "" ? rest : [...rest, { selector, rule: merged }] });
  };
  const hideElement = (selector) => {
    setElementProperty(selector, HIDE_PAIR[0], HIDE_PAIR[1]);
  };
  const unhideElement = (selector) => {
    setElementProperty(selector, HIDE_PAIR[0], void 0);
  };
  const removeControl = (selector) => {
    setElementProperty(selector, REMOVE_PAIR[0], REMOVE_PAIR[1]);
  };
  const restoreControl = (selector) => {
    setElementProperty(selector, REMOVE_PAIR[0], void 0);
  };
  const textPatches = (0, import_react.useRef)(/* @__PURE__ */ new Map());
  const patchLiveText = (selector, after) => {
    const host = document.querySelector(selector);
    if (host === null) return;
    if (host.tagName === "INPUT" || host.tagName === "TEXTAREA") {
      const field = host;
      if (!textPatches.current.has(field)) textPatches.current.set(field, field.placeholder);
      field.placeholder = after;
      return;
    }
    const node = Array.from(host.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
    if (node === void 0) return;
    if (!textPatches.current.has(node)) textPatches.current.set(node, node.data);
    node.data = after;
  };
  const liveTextRef = (0, import_react.useRef)(false);
  const liveTransform = (selector, x, y, scale) => {
    if (!liveTransformRef.current) {
      snapshot();
      liveTransformRef.current = true;
    }
    const existing = draft.css.find((r) => r.selector === selector)?.rule;
    const value = transformValue(x, y, scale);
    const merged = withManagedDeclarations(existing, value === "" ? "" : "transform: " + value);
    if (sameDeclarations(existing, merged)) return;
    const rest = draft.css.filter((r) => r.selector !== selector);
    setDraft({ ...draft, css: merged === "" ? rest : [...rest, { selector, rule: merged }] });
  };
  const liveText = (selector, before, after) => {
    if (!liveTextRef.current) {
      snapshot();
      liveTextRef.current = true;
    }
    const rest = draft.text.filter((o) => o.selector !== selector || o.before !== before);
    setDraft({ ...draft, text: [...rest, { selector, before, after }] });
    patchLiveText(selector, after);
  };
  const restoreLiveText = (host) => {
    for (const [target, original] of [...textPatches.current]) {
      if (host !== void 0) {
        const owns = target instanceof Text ? host.contains(target) : target === host;
        if (!owns) continue;
      }
      if (target instanceof Text) {
        if (target.isConnected) target.data = original;
      } else if (target.isConnected) target.placeholder = original;
      textPatches.current.delete(target);
    }
  };
  const addText = (selector, before, after) => {
    snapshot();
    const rest = draft.text.filter((o) => o.selector !== selector || o.before !== before);
    setDraft({ ...draft, text: [...rest, { selector, before, after }] });
    patchLiveText(selector, after);
  };
  const removeText = (selector) => {
    snapshot();
    setDraft({ ...draft, text: draft.text.filter((o) => o.selector !== selector) });
    restoreLiveText(document.querySelector(selector) ?? void 0);
  };
  const removeSelector = (selector) => {
    snapshot();
    setDraft({
      ...draft,
      css: draft.css.filter((r) => r.selector !== selector),
      text: draft.text.filter((o) => o.selector !== selector)
    });
  };
  const embedFont = (family, url, format) => {
    snapshot();
    setDraft({ ...draft, css: [...draft.css, { selector: FONT_FACE_SELECTOR, rule: fontFaceRule(family, url, format) }] });
  };
  const removeFont = (family) => {
    snapshot();
    setDraft({ ...draft, css: draft.css.filter((r) => !(r.selector === FONT_FACE_SELECTOR && r.rule.includes("'" + family + "'"))) });
  };
  const fontToPage = (family) => {
    if (family.trim() === "") return;
    snapshot();
    const existing = draft.css.find((r) => r.selector === "body")?.rule;
    const merged = mergeDeclaration(existing, "font-family: " + family.trim() + " !important");
    const rest = draft.css.filter((r) => r.selector !== "body");
    setDraft({ ...draft, css: [...rest, { selector: "body", rule: merged }] });
  };
  const onEmbedBgFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file === void 0) return;
    if (selected === void 0) {
      setHint(t("selectFirst"));
      return;
    }
    const target = selected;
    void readImageFile(file).then((url) => {
      if (url === "") {
        setHint(t("applyFailed"));
        return;
      }
      snapshot();
      const id = "embed-" + Date.now() + "-" + Math.floor(Math.random() * 1e3);
      target.setAttribute("data-dsh-myskin-embed", id);
      const img = { id, selector: '[data-dsh-myskin-embed="' + id + '"]', fallbackSelector: selectorOf(target), url, x: 0, y: 0, w: 320, h: 200, opacity: 0.9, pageKey: currentSettingsPageKey(target.ownerDocument) };
      setDraft({ ...draft, canvas: { ...draft.canvas, images: [...draft.canvas.images, img] } });
    });
  };
  const onPageBgFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file === void 0) return;
    void readBoundedImage(file).then(({ url, compressed }) => {
      if (url === "") {
        setHint(t("imageTooLarge"));
        return;
      }
      snapshot();
      setDraft({ ...draft, canvas: { ...draft.canvas, background: url } });
      setHint(compressed ? t("imageCompressed") : void 0);
    });
  };
  const clearPageBg = () => {
    snapshot();
    setDraft({ ...draft, canvas: { ...draft.canvas, background: void 0 } });
  };
  const setEmbedLive = (id, patch) => {
    setDraft({ ...draft, canvas: { ...draft.canvas, images: draft.canvas.images.map((img) => img.id === id ? { ...img, ...patch } : img) } });
  };
  const updateEmbed = (id, patch) => {
    snapshot();
    setEmbedLive(id, patch);
  };
  const removeEmbed = (id) => {
    snapshot();
    setDraft({ ...draft, canvas: { ...draft.canvas, images: draft.canvas.images.filter((img) => img.id !== id) } });
  };
  const onEmbedPointerDown = (e, img) => {
    e.preventDefault();
    snapshot();
    const startX = e.clientX, startY = e.clientY, ox = img.x, oy = img.y;
    beginPointerDrag(e, (ev) => {
      setEmbedLive(img.id, { x: ox + (ev.clientX - startX), y: oy + (ev.clientY - startY) });
    });
  };
  const transformDrag = (e, kind) => {
    const el = selected;
    if (el === void 0) return;
    e.preventDefault();
    e.stopPropagation();
    const selector = selectorOf(el);
    const base = parseTransform(draft.css.find((r) => r.selector === selector)?.rule);
    const rect = el.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const startX = e.clientX;
    const startY = e.clientY;
    const reach = Math.max(24, rect.width + rect.height);
    const targets = snapOn ? snapTargetsFor(el, isOwnElement) : { x: [], y: [] };
    let frame = 0;
    let pending;
    liveTransformRef.current = false;
    const flush = () => {
      frame = 0;
      const next = pending;
      pending = void 0;
      if (next !== void 0) liveTransform(selector, next.x, next.y, next.scale);
    };
    beginPointerDrag(e, (ev) => {
      if (kind === "move") {
        let x = base.x + (ev.clientX - startX);
        let y = base.y + (ev.clientY - startY);
        if (snapOn && !ev.altKey) {
          const box = { left: rect.left + (x - base.x), top: rect.top + (y - base.y), width: rect.width, height: rect.height };
          const snap = snapMove(box, targets, SNAP_THRESHOLD);
          x += snap.dx;
          y += snap.dy;
          setGuides(snap.lines);
        } else setGuides([]);
        pending = { x, y, scale: base.scale };
      } else {
        let scaleValue = clampNum(base.scale * (1 + (ev.clientX - startX + (ev.clientY - startY)) / reach), 0.2, 3);
        if (snapOn && !ev.altKey && base.scale > 0) {
          const width = rect.width * (scaleValue / base.scale);
          const height = rect.height * (scaleValue / base.scale);
          const box = { left: center.x - width / 2, top: center.y - height / 2, width, height };
          const snap = snapScale(box, scaleValue, targets, SNAP_THRESHOLD);
          scaleValue = clampNum(snap.scale, 0.2, 3);
          setGuides(snap.lines);
        } else setGuides([]);
        pending = { x: base.x, y: base.y, scale: scaleValue };
      }
      if (frame === 0) frame = requestAnimationFrame(flush);
    });
    const finish = () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      flush();
      setGuides([]);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };
  const startEmbedResize = (e, img) => {
    e.preventDefault();
    snapshot();
    const startW = img.w, startH = img.h, sx = e.clientX, sy = e.clientY;
    beginPointerDrag(e, (ev) => {
      setEmbedLive(img.id, { w: Math.max(24, startW + (ev.clientX - sx)), h: Math.max(24, startH + (ev.clientY - sy)) });
    });
  };
  const setToken = (name2, light, dark) => {
    snapshot();
    setDraft({ ...draft, tokens: { ...draft.tokens, [name2]: { light, dark } } });
  };
  const toggleToken = (name2, on) => {
    if (on) {
      const cur = getComputedStyle(document.body).getPropertyValue(name2).trim() || "#808080";
      snapshot();
      setDraft({ ...draft, tokens: { ...draft.tokens, [name2]: { light: cur, dark: cur } } });
    } else {
      snapshot();
      const tokens = { ...draft.tokens };
      delete tokens[name2];
      setDraft({ ...draft, tokens });
    }
  };
  const resetDraft = () => {
    snapshot();
    setDraft(parseSkin(EMPTY_SKIN));
    setSelected(void 0);
    restoreLiveText();
  };
  const saveDraft = () => {
    setHint(void 0);
    setFlash(void 0);
    setSave({ state: "saving" });
    void onSave({ ...draft }).then((report) => {
      if (report.ok) {
        setSave({ state: "saved" });
        setFlash(t("savedHint"));
        return;
      }
      const detail = saveFailureText(report, t);
      setSave({ state: "failed", detail });
      setHint(detail);
    });
  };
  const onApply = () => {
    setHint(void 0);
    setFlash(void 0);
    setSave({ state: "saving" });
    void onCommit({ ...draft, enabled: true }).then((report) => {
      if (report.ok) {
        setSave({ state: "saved" });
        return;
      }
      const detail = saveFailureText(report, t);
      setSave({ state: "failed", detail });
      setHint(detail);
    });
  };
  const onCloseOrSave = () => {
    if (save.state !== "dirty") {
      onClose();
      return;
    }
    setSave({ state: "saving" });
    void onCommit({ ...draft }).then((report) => {
      if (report.ok) {
        onClose();
        return;
      }
      const detail = saveFailureText(report, t);
      setSave({ state: "failed", detail });
      setHint(detail);
    });
  };
  (0, import_react.useEffect)(() => {
    selectedRef.current = selected;
  }, [selected]);
  (0, import_react.useEffect)(() => {
    closeRef.current = onCloseOrSave;
  });
  const selectParent = () => {
    const el = selectedRef.current;
    if (el === void 0) return;
    const parent = parentTarget(el, isOwnElement);
    if (parent !== void 0) setSelected(parent);
  };
  const selectChild = () => {
    const el = selectedRef.current;
    if (el === void 0) return;
    const point = lastPointRef.current ?? centerOf(el);
    if (point === void 0) return;
    const stack = Array.from(document.elementsFromPoint(point.x, point.y));
    const child = childTargetIn(stack, el, isOwnElement);
    if (child !== void 0) setSelected(child);
  };
  (0, import_react.useEffect)(() => {
    if (mode !== "edit") {
      setHover(void 0);
      return;
    }
    let frame = 0;
    let pending;
    const flush = () => {
      frame = 0;
      const point = pending;
      pending = void 0;
      if (point === void 0) return;
      setHover(elementAt(point.x, point.y));
    };
    const onMove = (e) => {
      if (e.target instanceof Element && isOwnElement(e.target)) pending = void 0;
      else pending = { x: e.clientX, y: e.clientY };
      if (pending === void 0) {
        setHover(void 0);
        return;
      }
      if (frame === 0) frame = requestAnimationFrame(flush);
    };
    const onLeave = () => {
      pending = void 0;
      setHover(void 0);
    };
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerleave", onLeave, true);
    return () => {
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerleave", onLeave, true);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [mode]);
  (0, import_react.useEffect)(() => {
    const editing = (target) => target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
    const onKey = (e) => {
      if (editing(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mode === "edit") {
        if (mod && (e.key === "z" || e.key === "Z")) {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
        if (mod && (e.key === "y" || e.key === "Y")) {
          e.preventDefault();
          redo();
          return;
        }
        if (e.altKey && e.key === "ArrowUp") {
          e.preventDefault();
          selectParent();
          return;
        }
        if (e.altKey && e.key === "ArrowDown") {
          e.preventDefault();
          selectChild();
          return;
        }
      }
      if (e.key === "Escape") {
        if (document.querySelector('[data-shortcut-modal], [aria-modal="true"]') !== null) return;
        e.preventDefault();
        if (selectedRef.current !== void 0) {
          setSelected(void 0);
          return;
        }
        closeRef.current();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
    };
  }, [mode]);
  const strengthTimer = (0, import_react.useRef)(void 0);
  (0, import_react.useEffect)(() => () => {
    if (strengthTimer.current !== void 0) window.clearTimeout(strengthTimer.current);
  }, []);
  const schedulePersistStrength = (canvas, css) => {
    if (strengthTimer.current !== void 0) window.clearTimeout(strengthTimer.current);
    strengthTimer.current = window.setTimeout(() => {
      strengthTimer.current = void 0;
      void onPersistStrength(canvas, css).then((report) => {
        if (report.ok) {
          setSave({ state: "saved" });
          return;
        }
        const detail = saveFailureText(report, t);
        setSave({ state: "failed", detail });
        setHint(detail);
      });
    }, 400);
  };
  const selRect = selected !== void 0 && selected.isConnected ? selected.getBoundingClientRect() : null;
  const hoverRect = mode === "edit" && hover !== void 0 && hover !== selected && hover.isConnected ? hover.getBoundingClientRect() : null;
  const saveColor = save.state === "failed" ? tok.error : save.state === "dirty" ? tok.warn : tok.labelTertiary;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { "data-dsh-myskin-ui": "1", "data-dsh-myskin-canvas": "1", style: { position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", color: tok.labelPrimary }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: barRef, className: "dsh-myskin-bar", "data-dsh-myskin-ui": "1", style: { pointerEvents: "auto", position: "absolute", top: "var(--dsh-myskin-chrome-top, 0px)", left: 0, right: 0, background: tok.bgOverlay, borderBottom: "1px solid var(--dsw-alias-border-l1)", zIndex: 10005, color: tok.labelPrimary, display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, minHeight: 44, flexWrap: "wrap", padding: "6px 16px 6px var(--dsh-myskin-leading, 16px)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPersonalization, { size: 16 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 14, lineHeight: "22px", fontWeight: 500, whiteSpace: "nowrap" }, children: [
          t("title"),
          " \u2014 ",
          t("edit")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", border: "1px solid " + tok.borderL2, borderRadius: 8, overflow: "hidden" }, title: t("modeHint"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: mode === "edit" ? "primary" : "ghost", onClick: () => {
            setMode("edit");
          }, title: t("editHint"), children: t("selectMode") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: mode === "interact" ? "primary" : "ghost", onClick: () => {
            setMode("interact");
          }, title: t("interactHint"), children: t("interactMode") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "ghost", onClick: undo, disabled: pastRef.current.length === 0, title: t("undoHint"), children: [
          "\u21B6 ",
          t("undo")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "ghost", onClick: redo, disabled: futureRef.current.length === 0, title: t("redoHint"), children: [
          "\u21B7 ",
          t("redo")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-myskin-sep" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlus, { size: 16 }), onClick: () => {
          if (selected === void 0) setHint(t("selectFirst"));
          else embedBgRef.current?.click();
        }, title: t("embedImageHint"), children: t("embedImage") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlus, { size: 16 }), onClick: () => {
          pageBgRef.current?.click();
        }, children: t("backgroundImage") }),
        draft.canvas.background !== void 0 && draft.canvas.background !== "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: clearPageBg, children: t("clearBackground") }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-myskin-sep" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: snapOn ? "primary" : "ghost", onClick: () => {
          setSnapOn(!snapOn);
        }, title: t("snapHint"), children: t("snapAlign") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: showTokens ? "primary" : "ghost", onClick: () => {
          setShowTokens(!showTokens);
        }, children: t("tokenPanel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: panelOpen ? "ghost" : "primary", onClick: () => {
          setPanelOpen(!panelOpen);
        }, title: panelOpen ? t("panelHideHint") : t("panelShowHint"), children: [
          panelOpen ? "\u203A" : "\u2039",
          " ",
          t("panelLabel")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-myskin-sep" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { title: save.state === "failed" ? save.detail ?? t("saveFailed") : t("saveHint"), style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 9px", borderRadius: 999, border: "1px solid " + tok.borderL2, background: tok.bgLayer2, fontSize: 12, lineHeight: "18px", whiteSpace: "nowrap", color: saveColor }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-myskin-dot", "data-state": save.state, style: { width: 8, height: 8, borderRadius: "50%", background: saveColor, flex: "none" } }),
          save.state === "dirty" ? t("unsaved") : save.state === "saving" ? t("saving") : save.state === "failed" ? t("saveFailed") + (save.detail ?? "") : t("savedOk")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "outline", onClick: saveDraft, title: t("saveHint"), children: t("saveDraft") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", onClick: onApply, title: t("applyHint"), children: t("apply") }),
        confirmReset ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", whiteSpace: "nowrap", color: tok.warn }, children: t("resetConfirm") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "outline", onClick: () => {
            setConfirmReset(false);
            resetDraft();
          }, children: t("confirm") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
            setConfirmReset(false);
          }, children: t("cancel") })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 14 }), onClick: () => {
          setConfirmReset(true);
        }, title: t("resetHint"), children: t("reset") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClose, { size: 16 }), onClick: onCloseOrSave, title: t("closeHint"), children: t("close") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "0 16px 6px var(--dsh-myskin-leading, 16px)", fontSize: 12, lineHeight: "18px", color: hint !== void 0 ? tok.warn : flash !== void 0 ? tok.success : tok.labelTertiary }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: hint !== void 0 || flash !== void 0 ? "dsh-myskin-warn" : void 0, style: { flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: hint ?? flash ?? (mode === "edit" ? t("editHint") : t("interactHint")) }, hint ?? flash ?? "idle"),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: "none", color: tok.labelTertiary }, children: t("shortcuts") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: panelRef, className: "dsh-myskin-panel dsh-myskin-scroll", "data-open": panelOpen ? "1" : "0", "data-dsh-myskin-ui": "1", style: { pointerEvents: panelOpen ? "auto" : "none", visibility: panelOpen ? "visible" : "hidden", position: "absolute", top: "calc(var(--dsh-myskin-chrome-top, 0px) + var(--dsh-myskin-inset-top, 48px))", right: 0, bottom: 0, width: panelOpen ? 340 : 0, display: "flex", flexDirection: "column", gap: 12, overflowX: "hidden", overflowY: "auto", padding: panelOpen ? 12 : 0, background: panelOpen ? tok.bgOverlay : "transparent", borderLeft: panelOpen ? "1px solid " + tok.borderL2 : "none", zIndex: 10004 }, children: [
      draft.canvas.background !== void 0 && draft.canvas.background !== "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: tok.labelSecondary }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          t("backgroundOpacity"),
          " \xB7 ",
          Math.round(readBackgroundOpacity(draft) * 100),
          "%"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "range",
            min: 0.35,
            max: 1,
            step: 0.05,
            value: readBackgroundOpacity(draft),
            onPointerDown: () => {
              snapshot();
            },
            onChange: (e) => {
              const opacity = Number(e.target.value);
              const canvas = { ...draft.canvas, backgroundOpacity: opacity };
              const css = withBackgroundOpacity(draft.css, opacity);
              setDraft({ ...draft, canvas, css });
              schedulePersistStrength(canvas, css);
            }
          }
        )
      ] }) : null,
      mode === "edit" ? selected !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        Inspector,
        {
          target: selected,
          draft,
          onSample: liveApply,
          onReplaceStyle: applyStyle,
          onText: addText,
          onLiveText: liveText,
          onRemoveText: removeText,
          onRemove: removeSelector,
          onEmbedOpacity: (id, v) => updateEmbed(id, { opacity: clampNum(v, 0, 1) }),
          onEmbedBlend: (id, v) => updateEmbed(id, { blend: v }),
          onRemoveEmbed: removeEmbed,
          onHide: hideElement,
          onUnhide: unhideElement,
          onRemoveControl: removeControl,
          onRestoreControl: restoreControl,
          onSelectParent: selectParent,
          onSelectChild: selectChild,
          onEmbedFont: embedFont,
          onRemoveFont: removeFont,
          onFontToPage: fontToPage,
          t
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-empty", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, color: tok.labelSecondary }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPersonalization, { size: 16 }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { style: { fontSize: 13, lineHeight: "20px", fontWeight: 500 }, children: t("emptyTitle") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("noSelection") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("emptySteps") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary }, children: t("shortcuts") })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelTertiary }, children: t("interactHint") }),
      mode === "edit" && showTokens ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TokenPanel, { tokens: draft.tokens, onToggle: toggleToken, onChange: setToken, t }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: embedBgRef, type: "file", accept: "image/*", multiple: false, style: { display: "none" }, onChange: onEmbedBgFile }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: pageBgRef, type: "file", accept: "image/*", multiple: false, style: { display: "none" }, onChange: onPageBgFile }),
    mode === "edit" && guides.map((line) => line.axis === "x" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { "data-dsh-myskin-ui": "1", className: "dsh-myskin-guide", style: { position: "fixed", left: line.at, top: 0, bottom: 0, width: 1, background: tok.brand, pointerEvents: "none", zIndex: 10003 } }, "gx" + String(line.at)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { "data-dsh-myskin-ui": "1", className: "dsh-myskin-guide", style: { position: "fixed", left: 0, right: 0, top: line.at, height: 1, background: tok.brand, pointerEvents: "none", zIndex: 10003 } }, "gy" + String(line.at))),
    mode === "edit" && hoverRect !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ElementBox, { rect: hoverRect, label: elementLabel(hover), solid: false }) : null,
    mode === "edit" && selRect !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ElementBox, { rect: selRect, label: selected === void 0 ? "" : elementLabel(selected), solid: true }, "sel-" + selectionEpoch) : null,
    mode === "edit" && selRect !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          "data-dsh-myskin-ui": "1",
          onPointerDown: (e) => {
            transformDrag(e, "move");
          },
          title: t("moveGripHint"),
          style: { position: "fixed", left: selRect.left - 11, top: selRect.top - 11, width: 22, height: 22, zIndex: 10002, borderRadius: 999, border: "1px solid " + tok.brand, background: tok.bgOverlay, color: tok.brand, fontSize: 12, lineHeight: "19px", textAlign: "center", cursor: "move", pointerEvents: "auto", touchAction: "none", userSelect: "none" },
          children: "\u2725"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          "data-dsh-myskin-ui": "1",
          onPointerDown: (e) => {
            transformDrag(e, "scale");
          },
          title: t("scaleGripHint"),
          style: { position: "fixed", left: selRect.right - 9, top: selRect.bottom - 9, width: 18, height: 18, zIndex: 10002, borderRadius: 5, border: "2px solid " + tok.bgOverlay, background: tok.brand, cursor: "nwse-resize", pointerEvents: "auto", touchAction: "none" }
        }
      )
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", { id: "dsh-myskin-font-list", children: FONT_SUGGESTIONS.map((family) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: family }, family)) }),
    draft.canvas.images.map((img) => {
      const container = document.querySelector(img.selector);
      const crect = container !== null ? container.getBoundingClientRect() : null;
      if (crect === null) return null;
      const zx = crect.left + (img.x || 0), zy = crect.top + (img.y || 0);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            "data-dsh-myskin-ui": "1",
            onPointerDown: (e) => {
              onEmbedPointerDown(e, img);
            },
            onClick: (e) => {
              e.stopPropagation();
            },
            style: { position: "fixed", left: zx + "px", top: zy + "px", width: img.w + "px", height: img.h + "px", border: "2px dashed " + tok.brand, background: "transparent", pointerEvents: mode === "edit" ? "auto" : "none", cursor: "move", zIndex: 10001 }
          }
        ),
        mode === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              "data-dsh-myskin-ui": "1",
              onClick: (e) => {
                e.stopPropagation();
                removeEmbed(img.id);
              },
              style: { position: "fixed", left: zx + img.w - 16 + "px", top: zy - 12 + "px", width: 24, height: 24, zIndex: 10003, border: "none", borderRadius: "50%", background: "var(--dsw-alias-state-error-primary)", color: "#fff", fontSize: 14, lineHeight: "24px", textAlign: "center", cursor: "pointer", pointerEvents: "auto" },
              children: "\u2715"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              "data-dsh-myskin-ui": "1",
              onPointerDown: (e) => {
                e.stopPropagation();
                startEmbedResize(e, img);
              },
              style: { position: "fixed", left: zx + img.w - 8 + "px", top: zy + img.h - 8 + "px", width: 16, height: 16, zIndex: 10002, background: tok.brand, borderRadius: 3, cursor: "nwse-resize", pointerEvents: "auto" }
            }
          )
        ] }) : null
      ] }, img.id);
    })
  ] });
}
function ElementBox({ rect, label, solid }) {
  const z = solid ? 10001 : 1e4;
  const below = rect.top < 64;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: solid ? "dsh-myskin-box" : "dsh-myskin-box dsh-myskin-hoverbox", "data-dsh-myskin-ui": "1", style: { position: "fixed", left: rect.left, top: rect.top, width: rect.width, height: rect.height, border: (solid ? "2px solid " : "1px dashed ") + tok.brand, boxShadow: solid ? "0 0 0 1px var(--dsw-alias-bg-overlay)" : "none", borderRadius: 4, pointerEvents: "none", zIndex: z } }),
    label === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-myskin-chip", "data-dsh-myskin-ui": "1", style: { position: "fixed", left: Math.max(4, rect.left), top: below ? rect.bottom + 4 : rect.top - 22, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, lineHeight: "17px", padding: "2px 7px", borderRadius: 6, background: tok.bgOverlay, border: "1px solid " + (solid ? tok.brand : tok.borderL3), color: solid ? tok.labelPrimary : tok.labelSecondary, pointerEvents: "none", zIndex: z }, children: label })
  ] });
}
function Section({ title, badge, children }) {
  const [open, setOpen] = (0, import_react.useState)(true);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-card", style: { display: "flex", flexDirection: "column", gap: 8, padding: 10 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "dsh-myskin-head", "data-open": open ? "1" : "0", onClick: () => {
      setOpen(!open);
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-myskin-chev", children: "\u25BE" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: title }),
      badge === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.brand }, children: badge })
    ] }),
    open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-myskin-body", children }) : null
  ] });
}
function WheelNudge({ onStep, children }) {
  const ref = (0, import_react.useRef)(null);
  const handler = (0, import_react.useRef)(onStep);
  (0, import_react.useEffect)(() => {
    handler.current = onStep;
  });
  (0, import_react.useEffect)(() => {
    const el = ref.current;
    if (el === null) return;
    return attachWheelNudge(el, (direction, big) => {
      handler.current(direction, big);
    });
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { ref, style: { display: "inline-flex", alignItems: "center", flex: "1 1 90px", minWidth: 0 }, children });
}
function Field({ label, clearTitle, clearable, onClear, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh-myskin-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { minWidth: 52, flex: "none", color: tok.labelSecondary }, children: label }),
    children,
    clearable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-myskin-iconbtn", title: clearTitle, onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClear();
    }, children: "\xD7" }) : null
  ] });
}
function Inspector({ target, draft, onSample, onReplaceStyle, onText, onLiveText, onRemoveText, onRemove, onEmbedOpacity, onEmbedBlend, onRemoveEmbed, onHide, onUnhide, onRemoveControl, onRestoreControl, onSelectParent, onSelectChild, onEmbedFont, onRemoveFont, onFontToPage, t }) {
  const [fontSize, setFontSize] = (0, import_react.useState)("");
  const [color, setColor] = (0, import_react.useState)("");
  const [bg, setBg] = (0, import_react.useState)("");
  const [weight, setWeight] = (0, import_react.useState)("");
  const [radius, setRadius] = (0, import_react.useState)("");
  const [borderColor, setBorderColor] = (0, import_react.useState)("");
  const [borderWidth, setBorderWidth] = (0, import_react.useState)("");
  const [padding, setPadding] = (0, import_react.useState)("");
  const [width, setWidth] = (0, import_react.useState)("");
  const [height, setHeight] = (0, import_react.useState)("");
  const [margin, setMargin] = (0, import_react.useState)("");
  const [lineHeight, setLineHeight] = (0, import_react.useState)("");
  const [opacity, setOpacity] = (0, import_react.useState)("");
  const [shadow, setShadow] = (0, import_react.useState)("");
  const [textAlign, setTextAlign] = (0, import_react.useState)("");
  const [bgImage, setBgImage] = (0, import_react.useState)("");
  const [text, setText] = (0, import_react.useState)("");
  const [fontFamily, setFontFamily] = (0, import_react.useState)("");
  const [computedFont, setComputedFont] = (0, import_react.useState)("");
  const [fontIssue, setFontIssue] = (0, import_react.useState)(void 0);
  const fontRef = (0, import_react.useRef)(null);
  const [transX, setTransX] = (0, import_react.useState)("");
  const [transY, setTransY] = (0, import_react.useState)("");
  const [scale, setScale] = (0, import_react.useState)("");
  const transformFocusRef = (0, import_react.useRef)(false);
  const [touched, setTouched] = (0, import_react.useState)({});
  const [geek, setGeek] = (0, import_react.useState)(false);
  const [geekCss, setGeekCss] = (0, import_react.useState)("");
  const [geekSel, setGeekSel] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    setGeekSel(selectorOf(target));
  }, [target]);
  const applyGeek = () => {
    if (geekSel.trim() !== "" && geekCss.trim() !== "") onReplaceStyle(geekSel, geekCss.trim());
  };
  (0, import_react.useEffect)(() => {
    if (!geek) return;
    setGeekCss(draft.css.find((r) => r.selector === geekSel)?.rule ?? "");
  }, [geek, target, geekSel, draft.css]);
  const beforeRef = (0, import_react.useRef)("");
  const hostRef = (0, import_react.useRef)(void 0);
  const [textIssue, setTextIssue] = (0, import_react.useState)(void 0);
  const bgImageRef = (0, import_react.useRef)(null);
  const onEmbedBg = (e) => {
    const file = e.target.files?.[0];
    if (file === void 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      setBgImage('url("' + url + '")');
      touch("bgImage");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  (0, import_react.useEffect)(() => {
    const sel2 = selectorOf(target);
    const rule2 = draft.css.find((r) => r.selector === sel2)?.rule;
    if (rule2 !== void 0 && rule2.trim() !== "") {
      const d = parseStateRule(rule2);
      setFontSize(d["font-size"] ?? "");
      setColor(d["color"] ?? "");
      setBg(d["background-color"] ?? "");
      setWeight(d["font-weight"] ?? "");
      setRadius(d["border-radius"] ?? "");
      setBorderColor(d["border-color"] ?? "");
      setBorderWidth(d["border-width"] ?? "");
      setPadding(d["padding"] ?? "");
      setWidth(d["width"] ?? "");
      setHeight(d["height"] ?? "");
      setMargin(d["margin"] ?? "");
      setLineHeight(d["line-height"] ?? "");
      setOpacity(d["opacity"] ?? "");
      setShadow(d["box-shadow"] ?? "");
      setTextAlign(d["text-align"] ?? "");
      setBgImage(d["background-image"] ?? "");
      setFontFamily(d["font-family"] ?? "");
      const tr = parseTransform(rule2);
      setTransX(tr.x === 0 ? "" : String(tr.x));
      setTransY(tr.y === 0 ? "" : String(tr.y));
      setScale(tr.scale === 1 ? "" : String(tr.scale));
      setTouched({
        fontSize: d["font-size"] !== void 0,
        color: d["color"] !== void 0,
        bg: d["background-color"] !== void 0,
        bgImage: d["background-image"] !== void 0,
        weight: d["font-weight"] !== void 0,
        radius: d["border-radius"] !== void 0,
        borderColor: d["border-color"] !== void 0,
        borderWidth: d["border-width"] !== void 0,
        padding: d["padding"] !== void 0,
        width: d["width"] !== void 0,
        height: d["height"] !== void 0,
        margin: d["margin"] !== void 0,
        lineHeight: d["line-height"] !== void 0,
        opacity: d["opacity"] !== void 0,
        shadow: d["box-shadow"] !== void 0,
        textAlign: d["text-align"] !== void 0,
        fontFamily: d["font-family"] !== void 0,
        transX: d["transform"] !== void 0 && tr.x !== 0,
        transY: d["transform"] !== void 0 && tr.y !== 0,
        scale: d["transform"] !== void 0 && tr.scale !== 1
      });
    } else {
      const css = getComputedStyle(target);
      setComputedFont(css.fontFamily);
      setFontFamily("");
      setTransX("");
      setTransY("");
      setScale("");
      setFontSize(css.fontSize);
      setColor(css.color);
      setBg(css.backgroundColor);
      setWeight(css.fontWeight);
      setRadius(css.borderRadius);
      setBorderColor(css.borderTopColor);
      setBorderWidth(css.borderTopWidth);
      setPadding(css.padding);
      setWidth(css.width);
      setHeight(css.height);
      setMargin(css.margin);
      setLineHeight(css.lineHeight);
      setOpacity(css.opacity);
      setShadow(css.boxShadow);
      setTextAlign(css.textAlign);
      setBgImage(css.backgroundImage === "none" ? "" : css.backgroundImage);
      setTouched({});
    }
    const host = textHostOf(target);
    hostRef.current = host;
    const isField = host !== void 0 && (host.tagName === "INPUT" || host.tagName === "TEXTAREA");
    const direct = host === void 0 ? void 0 : Array.from(host.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.data.trim() !== "");
    const raw = host === void 0 ? "" : isField ? host.placeholder : direct === void 0 ? "" : direct.data;
    beforeRef.current = raw.trim();
    const applied = host === void 0 ? void 0 : draft.text.find((o) => o.selector === selectorOf(host));
    setText(applied !== void 0 ? applied.after : raw.trim());
    setTextIssue(void 0);
  }, [target]);
  const textTimer = (0, import_react.useRef)(void 0);
  const cancelTextTimer = () => {
    if (textTimer.current !== void 0) {
      window.clearTimeout(textTimer.current);
      textTimer.current = void 0;
    }
  };
  const runLiveText = () => {
    const host = hostRef.current;
    if (host === void 0 || touched.text !== true) return;
    const desired = text.trim();
    if (desired === "") return;
    const selector = selectorOf(host);
    if (desired === beforeRef.current) {
      onRemoveText(selector);
      return;
    }
    onLiveText(selector, beforeRef.current, desired);
  };
  (0, import_react.useEffect)(() => {
    if (touched.text !== true) return;
    cancelTextTimer();
    const host = hostRef.current;
    textTimer.current = window.setTimeout(() => {
      textTimer.current = void 0;
      if (hostRef.current !== host) return;
      runLiveText();
    }, 250);
    return cancelTextTimer;
  }, [text]);
  (0, import_react.useEffect)(() => {
    cancelTextTimer();
  }, [target]);
  (0, import_react.useEffect)(() => () => {
    cancelTextTimer();
  }, []);
  const touch = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };
  const used = (field) => touched[field] === true;
  const embeddedFonts = draft.css.filter((r) => r.selector === FONT_FACE_SELECTOR).map((r) => {
    const family = (r.rule.match(/font-family:\s*'([^']+)'/) ?? [])[1] ?? "";
    const base64 = (r.rule.match(/base64,([^']*)'/) ?? [])[1] ?? "";
    return { family, bytes: Math.round(base64.length * 3 / 4) };
  }).filter((font) => font.family !== "");
  const nudge = (field, direction, big) => {
    if (field === "scale") {
      setScale(String(stepValue(toNum(scale, 1), direction, big ? 0.25 : 0.05, 0.2, 3)));
      touch("scale");
      return;
    }
    const next = String(stepValue(toNum(field === "transX" ? transX : transY, 0), direction, big ? 10 : 1));
    if (field === "transX") setTransX(next);
    else setTransY(next);
    touch(field);
  };
  const resetButton = (title, disabled, onClick) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      type: "button",
      className: "dsh-myskin-iconbtn",
      title,
      disabled,
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      },
      children: "\u21BA"
    }
  );
  const onPickFont = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file === void 0) return;
    const format = fontFormat(file.name);
    if (format === void 0) {
      setFontIssue({ text: t("fontUnsupported"), kind: "warn" });
      return;
    }
    if (file.size > MAX_FONT_BYTES) {
      setFontIssue({ text: t("fontTooLarge"), kind: "warn" });
      return;
    }
    const heavy = file.size > FONT_WARN_BYTES;
    const size = (file.size / (1024 * 1024)).toFixed(1) + " MB";
    const reader = new FileReader();
    reader.onerror = () => {
      setFontIssue({ text: t("fontTooLarge"), kind: "warn" });
    };
    reader.onload = () => {
      const url = String(reader.result ?? "");
      if (url === "") {
        setFontIssue({ text: t("fontTooLarge"), kind: "warn" });
        return;
      }
      const family = "myskin-font-" + Math.random().toString(36).slice(2, 7);
      onEmbedFont(family, url, format);
      setFontFamily(family);
      touch("fontFamily");
      setFontIssue(heavy ? { text: t("fontHeavy") + " \xB7 " + size, kind: "warn" } : { text: t("fontEmbedded") + " \xB7 " + size, kind: "ok" });
    };
    reader.readAsDataURL(file);
  };
  const customBadge = (fields) => {
    const count = fields.filter((field) => touched[field] === true).length;
    return count === 0 ? void 0 : t("customBadge") + " " + count;
  };
  const clearField = (field, reset) => {
    reset();
    setTouched((prev) => ({ ...prev, [field]: false }));
  };
  const colorType = (v, set, field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "input",
    {
      type: "color",
      value: toHex(v) ?? "#000000",
      onChange: (e) => {
        set(e.target.value);
        touch(field);
      },
      style: { width: 28, height: 24, border: "1px solid " + tok.borderL2, borderRadius: 4, background: tok.bgBase, padding: 0, cursor: "pointer" }
    }
  );
  const previewTransform = transformValue(toNum(transX, 0), toNum(transY, 0), toNum(scale, 1));
  const transformDecl = previewTransform === "" ? "" : "transform: " + previewTransform + " !important";
  (0, import_react.useEffect)(() => {
    const decl = [
      used("fontSize") ? "font-size: " + fontSize + " !important" : "",
      used("fontFamily") && fontFamily.trim() !== "" ? "font-family: " + fontFamily.trim() + " !important" : "",
      used("color") ? "color: " + color + " !important" : "",
      transformDecl,
      used("bg") ? "background-color: " + bg + " !important" : "",
      used("bgImage") ? "background-image: " + bgImage + " !important; background-size: cover !important; background-position: center !important" : "",
      used("weight") ? "font-weight: " + weight + " !important" : "",
      used("radius") ? "border-radius: " + radius + " !important" : "",
      used("borderColor") ? "border-color: " + borderColor + " !important" : "",
      used("borderWidth") ? "border-width: " + borderWidth + " !important" : "",
      used("padding") ? "padding: " + padding + " !important" : "",
      used("width") ? "width: " + width + " !important" : "",
      used("height") ? "height: " + height + " !important" : "",
      used("margin") ? "margin: " + margin + " !important" : "",
      used("lineHeight") ? "line-height: " + lineHeight + " !important" : "",
      used("opacity") ? "opacity: " + opacity + " !important" : "",
      used("shadow") ? "box-shadow: " + shadow + " !important" : "",
      used("textAlign") ? "text-align: " + textAlign + " !important" : ""
    ].filter((s) => s !== "").join("; ");
    onSample(selectorOf(target), decl);
  }, [fontSize, fontFamily, color, bg, bgImage, weight, radius, borderColor, borderWidth, padding, width, height, margin, lineHeight, opacity, shadow, textAlign, transX, transY, scale, touched]);
  (0, import_react.useEffect)(() => {
    if (transformFocusRef.current) return;
    const current = parseTransform(draft.css.find((r) => r.selector === selectorOf(target))?.rule);
    setTransX(current.x === 0 ? "" : String(current.x));
    setTransY(current.y === 0 ? "" : String(current.y));
    setScale(current.scale === 1 ? "" : String(current.scale));
  }, [draft.css]);
  const applyText = () => {
    const host = hostRef.current;
    const desired = text.trim();
    if (host === void 0 || desired === "") {
      setTextIssue(t("noEditableText"));
      return;
    }
    cancelTextTimer();
    onText(selectorOf(host), beforeRef.current, desired);
    setTextIssue(t("textApplied"));
  };
  const sel = selectorOf(target);
  const rule = draft.css.find((r) => r.selector === sel)?.rule;
  const hidden = rule !== void 0 && /visibility\s*:\s*hidden/.test(rule);
  const removed = rule !== void 0 && /display\s*:\s*none/.test(rule);
  const fieldLabel = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 12, lineHeight: "20px", width: "100%" };
  const style = {
    position: "relative",
    zIndex: 5,
    width: "100%",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    color: tok.labelPrimary
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { style: { fontSize: 14, lineHeight: "22px", fontWeight: 500 }, children: t("editMenu") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-card", style: { display: "flex", flexDirection: "column", gap: 4, padding: 10 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1, fontSize: 12, lineHeight: "18px", color: tok.labelTertiary }, children: t("target") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: onSelectParent, title: t("selectParentHint"), children: [
          "\u2191 ",
          t("selectParent")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: onSelectChild, title: t("selectChildHint"), children: [
          "\u2193 ",
          t("selectChild")
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelPrimary, wordBreak: "break-word" }, children: elementLabel(target, 48) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary, fontFamily: "var(--ds-font-family-code, monospace)", wordBreak: "break-all" }, children: selectorOf(target) }),
      target.matches(COMPOSER_PLACEHOLDER_SELECTOR) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("placeholderTarget") }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: geek ? "primary" : "ghost", onClick: () => {
      setGeek(!geek);
    }, children: t("geekMode") }) }),
    geek ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-card", style: { display: "flex", flexDirection: "column", gap: 8, padding: 10 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        t("target"),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: geekSel, onChange: (e) => {
          setGeekSel(e.target.value);
        }, placeholder: "#root > \u2026 :hover" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("selectorHint") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeEditor, { value: geekCss, onChange: setGeekCss }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", onClick: applyGeek, children: t("apply") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "ghost", onClick: () => {
          setGeekCss("");
        }, children: t("reset") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { style: { fontSize: 12, color: tok.labelTertiary, cursor: "pointer" }, children: t("codeRef") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { style: { fontSize: 11, lineHeight: "16px", overflow: "auto", maxHeight: 120, color: tok.labelSecondary, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "var(--ds-font-family-code, monospace)" }, children: target.outerHTML.slice(0, 500) })
      ] })
    ] }) : null,
    geek ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, { title: t("groupText"), badge: customBadge(["fontSize", "weight", "lineHeight", "color", "textAlign"]), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldFontSize"), clearTitle: t("clearField"), clearable: used("fontSize"), onClear: () => {
          clearField("fontSize", () => {
            setFontSize("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: fontSize, onChange: (e) => {
          setFontSize(e.target.value);
          touch("fontSize");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldFont"), clearTitle: t("clearField"), clearable: used("fontFamily"), onClear: () => {
          clearField("fontFamily", () => {
            setFontFamily("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { list: "dsh-myskin-font-list", value: fontFamily, placeholder: computedFont, onChange: (e) => {
          setFontFamily(e.target.value);
          touch("fontFamily");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
            fontRef.current?.click();
          }, title: t("embedFontHint"), children: t("embedFont") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", disabled: fontFamily.trim() === "", onClick: () => {
            onFontToPage(fontFamily.trim());
          }, title: t("fontToPageHint"), children: t("fontToPage") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: "1 1 120px", minWidth: 0, fontSize: 11, lineHeight: "16px", color: fontIssue === void 0 ? tok.labelTertiary : fontIssue.kind === "ok" ? tok.success : tok.warn }, children: fontIssue?.text ?? t("fontHint") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: fontRef, type: "file", accept: ".woff2,.woff,.ttf,.otf", style: { display: "none" }, onChange: onPickFont }),
        embeddedFonts.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: embeddedFonts.map((font) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: tok.labelSecondary }, children: font.family }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { flex: "none", fontSize: 11, color: tok.labelTertiary }, children: [
            Math.round(font.bytes / 1024),
            " KB"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-myskin-iconbtn", title: t("remove"), onClick: () => {
            onRemoveFont(font.family);
          }, children: "\xD7" })
        ] }, font.family)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldWeight"), clearTitle: t("clearField"), clearable: used("weight"), onClear: () => {
          clearField("weight", () => {
            setWeight("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: weight, onChange: (e) => {
          setWeight(e.target.value);
          touch("weight");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldLineHeight"), clearTitle: t("clearField"), clearable: used("lineHeight"), onClear: () => {
          clearField("lineHeight", () => {
            setLineHeight("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: lineHeight, onChange: (e) => {
          setLineHeight(e.target.value);
          touch("lineHeight");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldColor"), clearTitle: t("clearField"), clearable: used("color"), onClear: () => {
          clearField("color", () => {
            setColor("");
          });
        }, children: [
          colorType(color, setColor, "color"),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: color, onChange: (e) => {
            setColor(e.target.value);
            touch("color");
          } })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldTextAlign"), clearTitle: t("clearField"), clearable: used("textAlign"), onClear: () => {
          clearField("textAlign", () => {
            setTextAlign("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: textAlign, onChange: (e) => {
          setTextAlign(e.target.value);
          touch("textAlign");
        } }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, { title: t("groupBox"), badge: customBadge(["width", "height", "padding", "margin", "radius", "borderWidth", "borderColor"]), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldWidth"), clearTitle: t("clearField"), clearable: used("width"), onClear: () => {
          clearField("width", () => {
            setWidth("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: width, onChange: (e) => {
          setWidth(e.target.value);
          touch("width");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldHeight"), clearTitle: t("clearField"), clearable: used("height"), onClear: () => {
          clearField("height", () => {
            setHeight("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: height, onChange: (e) => {
          setHeight(e.target.value);
          touch("height");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldPadding"), clearTitle: t("clearField"), clearable: used("padding"), onClear: () => {
          clearField("padding", () => {
            setPadding("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: padding, onChange: (e) => {
          setPadding(e.target.value);
          touch("padding");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldMargin"), clearTitle: t("clearField"), clearable: used("margin"), onClear: () => {
          clearField("margin", () => {
            setMargin("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: margin, onChange: (e) => {
          setMargin(e.target.value);
          touch("margin");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldRadius"), clearTitle: t("clearField"), clearable: used("radius"), onClear: () => {
          clearField("radius", () => {
            setRadius("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: radius, onChange: (e) => {
          setRadius(e.target.value);
          touch("radius");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldBorderWidth"), clearTitle: t("clearField"), clearable: used("borderWidth"), onClear: () => {
          clearField("borderWidth", () => {
            setBorderWidth("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: borderWidth, onChange: (e) => {
          setBorderWidth(e.target.value);
          touch("borderWidth");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldBorderColor"), clearTitle: t("clearField"), clearable: used("borderColor"), onClear: () => {
          clearField("borderColor", () => {
            setBorderColor("");
          });
        }, children: [
          colorType(borderColor, setBorderColor, "borderColor"),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: borderColor, onChange: (e) => {
            setBorderColor(e.target.value);
            touch("borderColor");
          } })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, { title: t("groupLook"), badge: customBadge(["bg", "bgImage", "shadow", "opacity"]), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldBg"), clearTitle: t("clearField"), clearable: used("bg"), onClear: () => {
          clearField("bg", () => {
            setBg("");
          });
        }, children: [
          colorType(bg, setBg, "bg"),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: bg, onChange: (e) => {
            setBg(e.target.value);
            touch("bg");
          } })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldBgImage"), clearTitle: t("clearField"), clearable: used("bgImage"), onClear: () => {
          clearField("bgImage", () => {
            setBgImage("");
          });
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: bgImage, placeholder: "url(...)/gradient", onChange: (e) => {
            setBgImage(e.target.value);
            touch("bgImage");
          } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
            bgImageRef.current?.click();
          }, children: t("embedBg") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: bgImageRef, type: "file", accept: "image/*", multiple: false, style: { display: "none" }, onChange: onEmbedBg }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldShadow"), clearTitle: t("clearField"), clearable: used("shadow"), onClear: () => {
          clearField("shadow", () => {
            setShadow("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: shadow, onChange: (e) => {
          setShadow(e.target.value);
          touch("shadow");
        } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("fieldOpacity"), clearTitle: t("clearField"), clearable: used("opacity"), onClear: () => {
          clearField("opacity", () => {
            setOpacity("");
          });
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: opacity, onChange: (e) => {
          setOpacity(e.target.value);
          touch("opacity");
        } }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, { title: t("groupTransform"), badge: previewTransform === "" ? void 0 : t("customBadge"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldTransX"), clearTitle: t("clearField"), clearable: false, onClear: () => void 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
            nudge("transX", direction, big);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: transX, placeholder: "0", title: t("wheelHint"), onChange: (e) => {
            setTransX(e.target.value);
            touch("transX");
          }, onFocus: () => {
            transformFocusRef.current = true;
          }, onBlur: () => {
            transformFocusRef.current = false;
          } }) }),
          resetButton(t("resetAxisX"), transX.trim() === "", () => {
            clearField("transX", () => {
              setTransX("");
            });
          })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldTransY"), clearTitle: t("clearField"), clearable: false, onClear: () => void 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
            nudge("transY", direction, big);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: transY, placeholder: "0", title: t("wheelHint"), onChange: (e) => {
            setTransY(e.target.value);
            touch("transY");
          }, onFocus: () => {
            transformFocusRef.current = true;
          }, onBlur: () => {
            transformFocusRef.current = false;
          } }) }),
          resetButton(t("resetAxisY"), transY.trim() === "", () => {
            clearField("transY", () => {
              setTransY("");
            });
          })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldScale"), clearTitle: t("clearField"), clearable: false, onClear: () => void 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
            nudge("scale", direction, big);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: scale, placeholder: "1", title: t("wheelHintScale"), onChange: (e) => {
            setScale(e.target.value);
            touch("scale");
          }, onFocus: () => {
            transformFocusRef.current = true;
          }, onBlur: () => {
            transformFocusRef.current = false;
          } }) }),
          resetButton(t("resetScale"), scale.trim() === "", () => {
            clearField("scale", () => {
              setScale("");
            });
          })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("scaleSlider"), clearTitle: t("clearField"), clearable: false, onClear: () => void 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "range", min: 20, max: 300, step: 1, value: Math.round(toNum(scale, 1) * 100), onChange: (e) => {
          setScale(String(Number(e.target.value) / 100));
          touch("scale");
        }, style: { flex: "1 1 120px", minWidth: 120 } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
            clearField("transX", () => {
              setTransX("");
            });
            clearField("transY", () => {
              setTransY("");
            });
            clearField("scale", () => {
              setScale("");
            });
          }, children: t("resetTransform") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: "1 1 120px", minWidth: 0, fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("transformHint") })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, { title: t("elementActions"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
          t("editText"),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: text, placeholder: beforeRef.current !== "" ? beforeRef.current : t("noEditableText"), onChange: (e) => {
            setText(e.target.value);
            touch("text");
          }, onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyText();
            }
          } })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("textLiveHint") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, lineHeight: "16px", color: textIssue !== void 0 && textIssue !== t("textApplied") ? "var(--dsw-alias-state-warn-primary)" : tok.labelTertiary }, children: [
          t("textWhere"),
          ": ",
          hostRef.current === void 0 ? "\u2014" : selectorOf(hostRef.current),
          textIssue === void 0 ? "" : " \xB7 " + textIssue
        ] }),
        hidden || removed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: [
          hidden ? t("hiddenBadge") : "",
          hidden && removed ? " \xB7 " : "",
          removed ? t("removedBadge") : ""
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", onClick: applyText, children: t("applyText") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "ghost", disabled: hostRef.current === void 0, onClick: () => {
            const host = hostRef.current;
            if (host !== void 0) onRemoveText(selectorOf(host));
          }, children: t("textRevert") }),
          hidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", onClick: () => {
            onUnhide(sel);
          }, children: t("unhide") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "ghost", onClick: () => {
            onHide(sel);
          }, children: t("hide") }),
          removed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", onClick: () => {
            onRestoreControl(sel);
          }, children: t("restoreControl") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 16 }), onClick: () => {
            onRemoveControl(sel);
          }, children: t("removeControl") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "ghost", onClick: () => {
            onRemove(sel);
          }, children: t("clearElement") })
        ] })
      ] })
    ] }),
    draft.canvas.images.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-card", style: { display: "flex", flexDirection: "column", gap: 8, padding: 10, fontSize: 12, lineHeight: "18px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { style: { fontSize: 13, lineHeight: "20px", fontWeight: 500, color: tok.labelSecondary }, children: t("embedBg") }),
      draft.canvas.images.map((img) => {
        const host = safeQuery(img.selector);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6, paddingTop: 8, borderTop: "1px solid " + tok.borderL2 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: img.selector, style: { color: tok.labelTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: host === null ? img.selector : elementLabel(host, 30) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary, minWidth: 40 }, children: t("opacity") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "range", min: 0, max: 100, value: Math.round((img.opacity ?? 1) * 100), onChange: (e) => {
              onEmbedOpacity(img.id, Number(e.target.value) / 100);
            }, style: { flex: "1 1 70px", minWidth: 70 } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary }, children: t("blend") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "select",
              {
                value: img.blend ?? "normal",
                onChange: (e) => {
                  onEmbedBlend(img.id, e.target.value);
                },
                style: { background: tok.bgBase, color: tok.labelPrimary, border: "1px solid " + tok.borderL2, borderRadius: 6, fontSize: 12, lineHeight: "18px", padding: "2px 6px" },
                children: BLEND_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: o.value, children: t(o.labelKey) }, o.value))
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 14 }), onClick: () => {
              onRemoveEmbed(img.id);
            }, children: t("remove") })
          ] })
        ] }, img.id);
      })
    ] })
  ] });
}
function highlightCss(css) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let html = esc(css);
  html = html.replace(/([a-zA-Z-]+)(\s*:)/g, '<span style="color:#f472b6">$1</span>$2');
  html = html.replace(/:\s*([^;]+)(;)/g, ':<span style="color:#86efac">$1</span>$2');
  html = html.replace(/(-?\d+\.?\d*)(px|%|rem|em|fr|deg|s|ms)?/g, '<span style="color:#7dd3fc">$1$2</span>');
  return html;
}
function CodeEditor({ value, onChange }) {
  const gutterRef = (0, import_react.useRef)(null);
  const preRef = (0, import_react.useRef)(null);
  const taRef = (0, import_react.useRef)(null);
  const lines = value.split("\n");
  const codeFont = 'var(--ds-font-family-code, "SFMono-Regular", Consolas, monospace)';
  const syncScroll = (el) => {
    if (gutterRef.current !== null) gutterRef.current.scrollTop = el.scrollTop;
    if (preRef.current !== null) {
      preRef.current.scrollTop = el.scrollTop;
      preRef.current.scrollLeft = el.scrollLeft;
    }
  };
  const onKey = (e) => {
    const el = e.currentTarget;
    if (e.key === "Tab") {
      e.preventDefault();
      const start = el.selectionStart, end = el.selectionEnd;
      onChange(value.slice(0, start) + "  " + value.slice(end));
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const start = el.selectionStart;
      const before = value.slice(0, start), after = value.slice(el.selectionEnd);
      const lineStart = before.lastIndexOf("\n") + 1;
      const indent = (before.slice(lineStart).match(/^\s+/) || [""])[0];
      onChange(before + "\n" + indent + after);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 1 + indent.length;
      });
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "relative", border: "1px solid " + tok.borderL2, borderRadius: 8, background: tok.bgBase, overflow: "hidden", fontFamily: codeFont, fontSize: 12, lineHeight: "18px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: gutterRef, style: { flex: "none", padding: "8px 6px", minWidth: 28, textAlign: "right", color: tok.labelTertiary, fontFamily: codeFont, fontSize: 12, lineHeight: "18px", userSelect: "none", background: tok.bgBase, overflow: "hidden", maxHeight: 150 }, children: lines.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "18px" }, children: i + 1 }, i)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", flex: 1 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { ref: preRef, "aria-hidden": true, style: { position: "absolute", inset: 0, margin: 0, padding: "8px 10px", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: codeFont, fontSize: 12, lineHeight: "18px", color: tok.labelPrimary, pointerEvents: "none", overflow: "hidden" }, dangerouslySetInnerHTML: { __html: highlightCss(value) + "\n" } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          ref: taRef,
          value,
          onChange: (e) => {
            onChange(e.target.value);
            syncScroll(e.target);
          },
          onKeyDown: onKey,
          onScroll: (e) => syncScroll(e.currentTarget),
          spellCheck: false,
          rows: 6,
          style: { position: "relative", display: "block", width: "100%", height: 150, padding: "8px 10px", background: "transparent", color: "transparent", caretColor: tok.labelPrimary, border: "none", outline: "none", resize: "vertical", fontFamily: codeFont, fontSize: 12, lineHeight: "18px", whiteSpace: "pre-wrap", wordBreak: "break-word", minHeight: 96 }
        }
      )
    ] })
  ] }) });
}
function TokenPanel({ tokens, onToggle, onChange, t }) {
  const groups = ["background", "border", "brand", "label", "button", "interactive"];
  const groupLabel = (g) => t(TOKEN_GROUP_KEYS[g]);
  const current = (name2) => tokens[name2]?.light ?? (getComputedStyle(document.body).getPropertyValue(name2).trim() || "#808080");
  const panelStyle = {
    width: "100%",
    maxHeight: 360,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 10,
    color: tok.labelPrimary,
    fontSize: 12
  };
  const groupStyle = { fontSize: 12, lineHeight: "18px", fontWeight: 600, color: tok.labelTertiary, marginTop: 4 };
  const rowStyle2 = { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" };
  const nameStyle = { fontSize: 11, lineHeight: "16px", fontFamily: "var(--ds-font-family-code, monospace)", color: tok.labelSecondary, minWidth: 150, flex: 1 };
  const pick2 = (v) => toHex(v) ?? "#000000";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-card dsh-myskin-scroll", style: panelStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { style: { fontSize: 13, lineHeight: "20px", fontWeight: 500 }, children: t("tokenPanel") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: [
      t("light"),
      " / ",
      t("dark")
    ] }),
    groups.map((g) => {
      const items = TOKEN_CATALOG.filter((item) => item.group === g);
      if (items.length === 0) return null;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: groupStyle, children: groupLabel(g) }),
        items.map((item) => {
          const on = Object.prototype.hasOwnProperty.call(tokens, item.name);
          const cur = current(item.name);
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: rowStyle2, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: on, onChange: (e) => {
              onToggle(item.name, e.target.checked);
            }, style: { accentColor: "var(--dsw-alias-brand-primary)", width: 14, height: 14, cursor: "pointer", flex: "none" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: 14, height: 14, borderRadius: 5, border: "1px solid " + tok.borderL2, background: on ? cur : tok.bgLayer2, flex: "none" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: nameStyle, children: item.name }),
            on ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "color", value: pick2(tokens[item.name].light), onChange: (e) => {
                onChange(item.name, e.target.value, tokens[item.name].dark);
              }, style: { width: 24, height: 22, padding: 0, border: "1px solid " + tok.borderL2, borderRadius: 4, background: "transparent", cursor: "pointer" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "color", value: pick2(tokens[item.name].dark), onChange: (e) => {
                onChange(item.name, tokens[item.name].light, e.target.value);
              }, style: { width: 24, height: 22, padding: 0, border: "1px solid " + tok.borderL2, borderRadius: 4, background: "transparent", cursor: "pointer" } })
            ] }) : null
          ] }, item.name);
        })
      ] }, g);
    })
  ] });
}

// src/client/locales.ts
var zh = {
  nav: "\u76AE\u80A4\u7BA1\u7406",
  title: "\u76AE\u80A4\u7BA1\u7406",
  intro: "\u5728\u8FD9\u91CC\u7BA1\u7406\u3001\u9884\u89C8\u5E76\u53EF\u89C6\u5316\u81EA\u5B9A\u4E49 DSH \u901A\u7528\u76AE\u80A4\u6846\u67B6\uFF08dsh-myskin\uFF09\u3002\u76AE\u80A4\u662F\u5B8C\u5168\u53EF\u9006\u7684\u8986\u76D6\u5C42\uFF0C\u4E0D\u5F71\u54CD DSH \u6B63\u5E38\u8FD0\u884C\u3002",
  enabled: "\u542F\u7528\u76AE\u80A4",
  skinLabel: "\u5F53\u524D\u76AE\u80A4",
  preset: "\u9884\u8BBE\u4E3B\u9898",
  presetDefault: "\u9ED8\u8BA4",
  presetDeep: "\u6DF1\u6D77",
  presetWarm: "\u6696\u9633",
  presetNight: "\u6781\u591C",
  edit: "\u7ED8\u5236\u6A21\u5F0F",
  editMenu: "\u7F16\u8F91\u83DC\u5355",
  apply: "\u5E94\u7528",
  reset: "\u8FD8\u539F\u9ED8\u8BA4",
  preview: "\u5B9E\u65F6\u9884\u89C8",
  saved: "\u5DF2\u4FDD\u5B58",
  disabled: "\u672A\u542F\u7528",
  enabledOn: "\u5DF2\u542F\u7528",
  enabledOff: "\u672A\u542F\u7528",
  none: "\uFF08\u65E0\u81EA\u5B9A\u4E49\u76AE\u80A4\uFF09",
  addImage: "\u6DFB\u52A0\u56FE\u7247",
  editText: "\u7F16\u8F91\u6587\u5B57",
  remove: "\u79FB\u9664",
  hide: "\u9690\u85CF\u63A7\u4EF6",
  exportSkin: "\u5BFC\u51FA\u76AE\u80A4",
  importSkin: "\u5BFC\u5165\u76AE\u80A4",
  importError: "\u5BFC\u5165\u5931\u8D25\uFF1A",
  importedOk: "\u2713 \u5DF2\u5BFC\u5165\u76AE\u80A4\u5305",
  exportedOk: "\u2713 \u5DF2\u5BFC\u51FA\u76AE\u80A4\u5305\uFF08.dshskin\uFF09",
  assetsLabel: "\u8D44\u6E90",
  skinPackHint: "\u76AE\u80A4\u5305 = .dshskin\uFF08\u7C7B zip \u5BB9\u5668\uFF09\uFF1Amanifest.json \u662F\u5B8C\u6574\u914D\u7F6E\uFF0Cassets/ \u91CC\u662F\u539F\u6837\u7684\u56FE\u7247\u4E0E\u5B57\u4F53\u6587\u4EF6\uFF0C\u53EF\u76F4\u63A5\u66FF\u6362\u540E\u91CD\u65B0\u5BFC\u5165\uFF1B\u65E7\u7248 .json \u5BFC\u51FA\u4ECD\u53EF\u5BFC\u5165\u3002",
  layerUp: "\u4E0A\u79FB",
  layerDown: "\u4E0B\u79FB",
  size: "\u5C3A\u5BF8",
  selectMode: "\u9009\u62E9",
  interactMode: "\u4EA4\u4E92",
  saveSkin: "\u4FDD\u5B58\u4E3A\u76AE\u80A4",
  cancel: "\u53D6\u6D88",
  confirm: "\u4FDD\u5B58",
  rename: "\u91CD\u547D\u540D",
  renameSkin: "\u91CD\u547D\u540D\u76AE\u80A4",
  load: "\u52A0\u8F7D",
  skinLibrary: "\u6211\u7684\u76AE\u80A4",
  backgroundImage: "\u80CC\u666F\u56FE",
  clearBackground: "\u6E05\u9664\u80CC\u666F\u56FE",
  backgroundOpacity: "\u80CC\u666F\u5F3A\u5EA6\uFF08\u8D8A\u4F4E\u58C1\u7EB8\u8D8A\u660E\u663E\uFF0C100% = \u4E0D\u900F\u89C6\uFF09",
  embedBg: "\u5D4C\u5165\u80CC\u666F\u56FE",
  embedImage: "\u5D4C\u5165\u56FE\u7247",
  selectFirst: "\u8BF7\u5148\u70B9\u51FB\u8981\u5D4C\u5165\u7684\u533A\u57DF",
  opacity: "\u4E0D\u900F\u660E\u5EA6",
  blend: "\u6DF7\u5408",
  blendNormal: "\u6B63\u5E38",
  blendMultiply: "\u6B63\u7247\u53E0\u5E95",
  blendScreen: "\u6EE4\u8272",
  blendOverlay: "\u53E0\u52A0",
  close: "\u5173\u95ED",
  light: "\u6D45\u8272",
  dark: "\u6DF1\u8272",
  customSkin: "\u81EA\u5B9A\u4E49\u76AE\u80A4",
  stateNormal: "\u6B63\u5E38",
  stateHover: "\u60AC\u505C",
  editState: "\u7F16\u8F91\u72B6\u6001",
  geekMode: "\u6781\u5BA2\u6A21\u5F0F",
  codeRef: "\u5143\u7D20\u4EE3\u7801\uFF08\u53C2\u8003\uFF09",
  stateFocus: "\u805A\u7126",
  stateActive: "\u6FC0\u6D3B",
  stateClick: "\u6309\u538B",
  stateSelected: "\u70B9\u51FB/\u9009\u4E2D",
  selectorHint: '\u9009\u62E9\u5668\u53EF\u81EA\u7531\u6539\u52A8\uFF08\u5982\u8FFD\u52A0 :hover\u3001.active\u3001[aria-selected="true"]\uFF09\uFF0C\u7528\u4E8E\u6539\u5199\u771F\u5B9E\u4EA4\u4E92/\u9009\u4E2D\u6001\u3002',
  stateEdited: "\u2713 \u6B64\u72B6\u6001\u5DF2\u6709\u81EA\u5B9A\u4E49\u89C4\u5219\uFF08\u771F\u5B9E\u60AC\u505C/\u9009\u4E2D\u65F6\u751F\u6548\uFF09",
  stateEmpty: "\u6B64\u72B6\u6001\u6682\u672A\u6DFB\u52A0\u81EA\u5B9A\u4E49\u89C4\u5219\uFF0C\u6837\u5F0F\u4E0E\u6B63\u5E38\u4E00\u81F4\uFF1B\u6539\u52A8\u4EFB\u4E00\u5C5E\u6027\u5373\u4E3A\u8BE5\u72B6\u6001\u5355\u72EC\u5B9A\u5236\u3002",
  target: "\u76EE\u6807\u5143\u7D20",
  stateHint: "\u60AC\u505C/\u6309\u538B/\u70B9\u51FB\u9009\u4E2D\u4E3A\u4EA4\u4E92\u6216\u9009\u4E2D\u72B6\u6001\uFF1A\u6539\u5C5E\u6027\u4F1A\u5728\u5143\u7D20\u4E0A\u7ACB\u5373\u9884\u89C8\uFF1B\u771F\u5B9E\u9875\u9762\u4EC5\u5728\u60AC\u505C\u3001\u6309\u4E0B\u6216\u88AB\u9009\u4E2D\u65F6\u751F\u6548\u3002",
  noSelection: "\u70B9\u51FB\u9875\u9762\u5143\u7D20\u5F00\u59CB\u7F16\u8F91",
  editHint: "\u7F16\u8F91\u6A21\u5F0F\uFF1A\u70B9\u51FB\u9875\u9762\u4EFB\u610F\u5143\u7D20\u5373\u53EF\u9009\u4E2D\uFF08\u539F\u6309\u94AE\u4E0D\u4F1A\u88AB\u89E6\u53D1\uFF09\u3002\u8981\u6EDA\u52A8\u6216\u6B63\u5E38\u64CD\u4F5C\uFF0C\u8BF7\u5207\u5230\u300C\u4EA4\u4E92\u300D\u3002",
  applyFailed: "\u4FDD\u5B58\u5931\u8D25\uFF1A\u56FE\u7247\u53EF\u80FD\u8FC7\u5927\u6216\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u8BF7\u91CD\u8BD5",
  interactHint: "\u4EA4\u4E92\u6A21\u5F0F\u4E0B\u4E0D\u53EF\u7F16\u8F91\uFF0C\u70B9\u51FB\u201C\u9009\u62E9\u201D\u5207\u56DE\u7F16\u8F91\u6A21\u5F0F",
  undo: "\u64A4\u9500",
  redo: "\u91CD\u505A",
  duplicate: "\u590D\u5236",
  copySuffix: "\u526F\u672C",
  tokenPanel: "\u4EE4\u724C",
  tokenGroupBackground: "\u80CC\u666F",
  tokenGroupBorder: "\u8FB9\u6846",
  tokenGroupBrand: "\u54C1\u724C\u8272",
  tokenGroupLabel: "\u6587\u5B57",
  tokenGroupButton: "\u6309\u94AE",
  tokenGroupInteractive: "\u4EA4\u4E92",
  unhide: "\u53D6\u6D88\u9690\u85CF",
  removeControl: "\u79FB\u9664\u63A7\u4EF6\uFF08\u4E0D\u5360\u4F4D\uFF09",
  restoreControl: "\u6062\u590D\u663E\u793A",
  clearElement: "\u6E05\u9664\u8BE5\u5143\u7D20\u7684\u81EA\u5B9A\u4E49",
  hiddenBadge: "\u5DF2\u9690\u85CF\uFF08\u4FDD\u7559\u5360\u4F4D\uFF09",
  removedBadge: "\u5DF2\u79FB\u9664\uFF08\u4E0D\u5360\u4F4D\uFF09",
  textWhere: "\u6587\u5B57\u4F4D\u7F6E",
  noEditableText: "\u8FD9\u4E2A\u5143\u7D20\u91CC\u6CA1\u6709\u53EF\u76F4\u63A5\u7F16\u8F91\u7684\u6587\u5B57\uFF1A\u8BF7\u9009\u4E2D\u771F\u6B63\u627F\u8F7D\u6587\u5B57\u7684\u8282\u70B9\uFF08\u65B0\u5BF9\u8BDD\u9875\u90A3\u884C\u7070\u5B57\u53EF\u76F4\u63A5\u9009\u4E2D\uFF09\uFF0C\u6216\u6539\u7528\u300C\u9690\u85CF/\u79FB\u9664\u63A7\u4EF6\u300D",
  textRevert: "\u8FD8\u539F\u6587\u5B57",
  textApplied: "\u2713 \u6587\u5B57\u5DF2\u66FF\u6362",
  applyText: "\u5E94\u7528\u6587\u5B57",
  textLiveHint: "\u6539\u52A8\u5373\u65F6\u9884\u89C8\uFF1B\u56DE\u8F66\u6216\u70B9\u300C\u5E94\u7528\u6587\u5B57\u300D\u5199\u5165\u8349\u7A3F",
  placeholderTarget: "\u7070\u8272\u9ED8\u8BA4\u6587\u5B57\uFF08\u65B0\u5BF9\u8BDD\u65F6\u7684\u5360\u4F4D\u63D0\u793A\uFF09",
  unsaved: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539",
  saving: "\u4FDD\u5B58\u4E2D\u2026",
  savedOk: "\u5DF2\u4FDD\u5B58",
  saveFailed: "\u4FDD\u5B58\u5931\u8D25\uFF1A",
  imageTooLarge: "\u56FE\u7247\u8FC7\u5927\u4E14\u538B\u7F29\u540E\u4ECD\u65E0\u6CD5\u4FDD\u5B58\uFF0C\u8BF7\u6362\u4E00\u5F20\u66F4\u5C0F\u7684\u56FE",
  imageCompressed: "\u56FE\u7247\u5DF2\u81EA\u52A8\u538B\u7F29\uFF0C\u4FDD\u8BC1\u4FDD\u5B58\u4F53\u79EF\u53EF\u63A7",
  elementActions: "\u5143\u7D20\u64CD\u4F5C",
  // —— 0.3.8 绘制模式 UI ——
  modeHint: "\u9009\u62E9\uFF1A\u70B9\u51FB\u9875\u9762\u5143\u7D20\u5373\u9009\u4E2D\uFF1B\u4EA4\u4E92\uFF1A\u6B63\u5E38\u4F7F\u7528\u9875\u9762\uFF08\u6EDA\u52A8\u3001\u70B9\u51FB\u4E0D\u89E6\u53D1\u9009\u4E2D\uFF09",
  undoHint: "\u64A4\u9500\uFF08Ctrl/Cmd+Z\uFF09",
  redoHint: "\u91CD\u505A\uFF08Ctrl/Cmd+Shift+Z\uFF09",
  embedImageHint: "\u5148\u9009\u4E2D\u4E00\u4E2A\u5BB9\u5668\uFF0C\u518D\u5D4C\u5165\u56FE\u7247",
  panelLabel: "\u9762\u677F",
  panelShowHint: "\u5C55\u5F00\u53F3\u4FA7\u9762\u677F",
  panelHideHint: "\u6536\u8D77\u53F3\u4FA7\u9762\u677F\u67E5\u770B\u6574\u9875\uFF08\u9875\u9762\u4F1A\u81EA\u52A8\u94FA\u6EE1\uFF09",
  resetHint: "\u8FD8\u539F\u9ED8\u8BA4\uFF1A\u4E22\u5F03\u5168\u90E8\u672A\u5E94\u7528\u7684\u6539\u52A8",
  resetConfirm: "\u8FD8\u539F\u4F1A\u4E22\u5F03\u8349\u7A3F\uFF0C\u786E\u5B9A\uFF1F",
  applyHint: "\u5199\u5165\u5E76\u542F\u7528\uFF0C\u7136\u540E\u9000\u51FA\u7ED8\u5236\u6A21\u5F0F",
  saveDraft: "\u4FDD\u5B58",
  saveHint: "\u5199\u5165\u76AE\u80A4\u6587\u6863\uFF0C\u7EE7\u7EED\u7559\u5728\u7ED8\u5236\u6A21\u5F0F\uFF08\u4E0D\u6539\u53D8\u76AE\u80A4\u7684\u542F\u7528\u72B6\u6001\uFF09",
  savedHint: "\u2713 \u5DF2\u5199\u5165\u76AE\u80A4\u6587\u6863\uFF0C\u53EF\u7EE7\u7EED\u7F16\u8F91",
  closeHint: "\u5173\u95ED\u7F16\u8F91\u5668\u5E76\u4FDD\u5B58\u672A\u5E94\u7528\u7684\u6539\u52A8",
  shortcuts: "Esc \u53D6\u6D88\u9009\u62E9 \xB7 Ctrl+Z \u64A4\u9500 \xB7 Alt+\u2191\u2193 \u5C42\u7EA7",
  emptyTitle: "\u5F00\u59CB\u7ED8\u5236",
  emptySteps: "\u70B9\u51FB\u9875\u9762\u5143\u7D20\u9009\u4E2D\u5B83 \u2192 \u5728\u53F3\u4FA7\u6539\u6837\u5F0F\u6216\u6587\u5B57 \u2192 \u70B9\u300C\u5E94\u7528\u300D\u5199\u5165\u76AE\u80A4",
  selectParent: "\u7236\u7EA7",
  selectChild: "\u5B50\u7EA7",
  selectParentHint: "\u9009\u4E2D\u4E0A\u4E00\u7EA7\uFF08Alt+\u2191\uFF09",
  selectChildHint: "\u9009\u4E2D\u4E0B\u4E00\u7EA7\uFF08Alt+\u2193\uFF09",
  clearField: "\u6E05\u9664\u8FD9\u4E00\u9879",
  customBadge: "\u81EA\u5B9A\u4E49",
  groupText: "\u6587\u5B57",
  groupBox: "\u76D2\u5B50",
  groupLook: "\u5916\u89C2",
  fieldFontSize: "\u5B57\u53F7",
  fieldWeight: "\u5B57\u91CD",
  fieldLineHeight: "\u884C\u9AD8",
  fieldColor: "\u989C\u8272",
  fieldTextAlign: "\u6587\u5B57\u5BF9\u9F50",
  fieldWidth: "\u5BBD",
  fieldHeight: "\u9AD8",
  fieldPadding: "\u5185\u8FB9\u8DDD",
  fieldMargin: "\u5916\u8FB9\u8DDD",
  fieldRadius: "\u5706\u89D2",
  fieldBorderWidth: "\u8FB9\u6846\u5BBD",
  fieldBorderColor: "\u8FB9\u6846\u8272",
  fieldBg: "\u80CC\u666F\u8272",
  fieldBgImage: "\u80CC\u666F\u56FE",
  fieldShadow: "\u9634\u5F71",
  fieldOpacity: "\u4E0D\u900F\u660E\u5EA6",
  // —— 0.3.8 字体与变换 ——
  fieldFont: "\u5B57\u4F53",
  embedFont: "\u5D4C\u5165\u5B57\u4F53\u6587\u4EF6",
  embedFontHint: "\u628A .woff2/.woff/.ttf/.otf \u5B58\u8FDB\u76AE\u80A4\uFF08\u2264400 KB\uFF1B\u6570\u636E\u968F\u76AE\u80A4\u6587\u6863\u4FDD\u5B58\uFF0C\u8D8A\u5927\u4FDD\u5B58\u8D8A\u6162\uFF09",
  fontToPage: "\u5E94\u7528\u5230\u6574\u9875",
  fontToPageHint: "\u628A\u8BE5\u5B57\u4F53\u5199\u5230 body\uFF08\u6574\u7AD9\u751F\u6548\uFF09\u3002body \u65E0\u6CD5\u5728\u753B\u5E03\u4E0A\u70B9\u9009\uFF0C\u6240\u4EE5\u5355\u72EC\u7ED9\u4E00\u4E2A\u5165\u53E3",
  fontHint: "\u53EF\u76F4\u63A5\u8F93\u5165\u4EFB\u610F\u5B57\u4F53\u540D\uFF08\u7CFB\u7EDF\u5B57\u4F53\u4E5F\u884C\uFF09\uFF0C\u5B57\u4F53\u6808\u53EF\u6574\u6BB5\u7C98\u8D34",
  fontEmbedded: "\u2713 \u5B57\u4F53\u5DF2\u5D4C\u5165\u5E76\u5E94\u7528\u5230\u8BE5\u5143\u7D20",
  fontTooLarge: "\u5B57\u4F53\u6587\u4EF6\u8FC7\u5927\uFF08\u4E0A\u9650 30 MB\uFF09",
  fontHeavy: "\u26A0 \u5B57\u4F53\u5DF2\u5D4C\u5165\uFF0C\u4F46\u5B83\u4F1A\u968F\u76AE\u80A4\u6587\u6863\u6574\u4EFD\u91CD\u53D1\uFF1A\u6BCF\u6B21\u4FDD\u5B58\u90FD\u4F1A\u53D8\u6162\uFF0C\u5BFC\u51FA\u7684 .dshskin \u91CC\u5219\u662F\u539F\u6837\u6587\u4EF6",
  fontUnsupported: "\u4E0D\u652F\u6301\u7684\u5B57\u4F53\u683C\u5F0F\uFF1A\u8BF7\u7528 .woff2 / .woff / .ttf / .otf",
  groupTransform: "\u4F4D\u7F6E\u4E0E\u7F29\u653E",
  fieldTransX: "X \u4F4D\u79FB",
  fieldTransY: "Y \u4F4D\u79FB",
  fieldScale: "\u7F29\u653E",
  resetTransform: "\u91CD\u7F6E\u53D8\u6362\uFF08\u4E09\u8F74\uFF09",
  resetAxisX: "\u91CD\u7F6E X \u4F4D\u79FB",
  resetAxisY: "\u91CD\u7F6E Y \u4F4D\u79FB",
  resetScale: "\u91CD\u7F6E\u7F29\u653E",
  scaleSlider: "\u7F29\u653E\u6ED1\u5757",
  wheelHint: "\u6EDA\u8F6E \xB11px\uFF08Shift \xB110px\uFF09",
  wheelHintScale: "\u6EDA\u8F6E \xB10.05\uFF08Shift \xB10.25\uFF09",
  snapAlign: "\u5BF9\u9F50",
  snapHint: "\u62D6\u52A8 / \u7F29\u653E\u65F6\u4F4E\u654F\u81EA\u52A8\u5BF9\u9F50\uFF1A4px \u5185\u5438\u9644\u5230\u540C\u7EA7\u5143\u7D20\u6216\u7236\u7EA7\u7684\u8FB9\u4E0E\u4E2D\u7EBF\uFF0C\u5E76\u663E\u793A\u5BF9\u9F50\u7EBF\uFF1B\u6309\u4F4F Alt \u53EF\u4E34\u65F6\u5173\u95ED",
  transformHint: "\u53EA\u505A\u89C6\u89C9\u4F4D\u79FB/\u7F29\u653E\uFF0C\u4E0D\u6539\u53D8\u5E03\u5C40\u6D41\uFF1B\u4E5F\u53EF\u62D6\u9009\u4E2D\u6846\u5DE6\u4E0A\u89D2 \u2725\uFF08\u79FB\u52A8\uFF09\u4E0E\u53F3\u4E0B\u89D2\u624B\u67C4\uFF08\u7F29\u653E\uFF09\u3002\u60AC\u505C\u6570\u503C\u6846\u6EDA\u8F6E\u53EF\u5FAE\u8C03\uFF0C\u21BA \u5355\u72EC\u91CD\u7F6E\u8BE5\u8F74\u3002",
  moveGripHint: "\u62D6\u52A8\uFF1AX/Y \u53CC\u8F74\u79FB\u52A8\uFF08\u4E0D\u6539\u53D8\u5E03\u5C40\uFF09",
  scaleGripHint: "\u62D6\u52A8\uFF1A\u7B49\u6BD4\u7F29\u653E"
};
var en = {
  nav: "Skin",
  title: "Skin Management",
  intro: "Manage, preview, and visually customize your DSH skin framework (dsh-myskin). A skin is a fully reversible overlay that never disturbs DSH itself.",
  enabled: "Enable skin",
  skinLabel: "Current skin",
  preset: "Preset themes",
  presetDefault: "Default",
  presetDeep: "Deep sea",
  presetWarm: "Warm",
  presetNight: "Night",
  edit: "Draw mode",
  editMenu: "Edit menu",
  apply: "Apply",
  reset: "Restore default",
  preview: "Live preview",
  saved: "Saved",
  disabled: "Disabled",
  enabledOn: "Enabled",
  enabledOff: "Disabled",
  none: "(no custom skin)",
  addImage: "Add image",
  editText: "Edit text",
  remove: "Remove",
  hide: "Hide control",
  exportSkin: "Export skin",
  importSkin: "Import skin",
  importError: "Import failed: ",
  importedOk: "\u2713 Skin package imported",
  exportedOk: "\u2713 Skin package exported (.dshskin)",
  assetsLabel: "assets",
  skinPackHint: "A skin package is a .dshskin (zip-like): manifest.json holds the full configuration, assets/ holds the raw image and font files (swap them and re-import); legacy .json exports still import.",
  layerUp: "Up",
  layerDown: "Down",
  size: "Size",
  selectMode: "Select",
  interactMode: "Interact",
  saveSkin: "Save as skin",
  cancel: "Cancel",
  confirm: "Save",
  rename: "Rename",
  renameSkin: "Rename skin",
  load: "Load",
  skinLibrary: "My skins",
  backgroundImage: "Background image",
  clearBackground: "Clear background",
  backgroundOpacity: "Background strength (lower = more wallpaper, 100% = opaque)",
  embedBg: "Embed background",
  embedImage: "Embed image",
  selectFirst: "Click an area first, then embed",
  opacity: "Opacity",
  blend: "Blend",
  blendNormal: "Normal",
  blendMultiply: "Multiply",
  blendScreen: "Screen",
  blendOverlay: "Overlay",
  close: "Close",
  light: "Light",
  dark: "Dark",
  customSkin: "Custom skin",
  stateNormal: "Normal",
  stateHover: "Hover",
  editState: "Edit state",
  geekMode: "Geek mode",
  codeRef: "Element code (reference)",
  stateFocus: "Focus",
  stateActive: "Active",
  stateClick: "Press",
  stateSelected: "Clicked/selected",
  selectorHint: 'The selector is free-form \u2014 append :hover, .active, [aria-selected="true"] etc. to target real interaction/selection states.',
  stateEdited: "\u2713 This state has custom rules (applies on real hover/selected)",
  stateEmpty: "No custom rules for this state yet \u2014 it looks like \u201Cnormal\u201D. Edit any property to customize this state separately.",
  target: "Target element",
  stateHint: "Hover/Press/Clicked-selected are interaction or selection states: edits preview instantly here; on the real page they only apply while hovering, pressed, or selected.",
  noSelection: "Click an element on the page to start editing",
  editHint: "Edit mode: click any element to select it (the real control will not fire). Switch to Interact to scroll or use the app.",
  applyFailed: "Save failed: the image may be too large or the connection dropped. Try again.",
  interactHint: 'Not editable in interact mode; click "Select" to switch back',
  undo: "Undo",
  redo: "Redo",
  duplicate: "Duplicate",
  copySuffix: "copy",
  tokenPanel: "Tokens",
  tokenGroupBackground: "Background",
  tokenGroupBorder: "Border",
  tokenGroupBrand: "Brand",
  tokenGroupLabel: "Label",
  tokenGroupButton: "Button",
  tokenGroupInteractive: "Interactive",
  unhide: "Unhide",
  removeControl: "Remove control (frees the slot)",
  restoreControl: "Restore",
  clearElement: "Clear this element edits",
  hiddenBadge: "Hidden (keeps its slot)",
  removedBadge: "Removed (slot freed)",
  textWhere: "Text node",
  noEditableText: "This element has no directly editable text \u2014 select the node that holds it (the gray line on a new conversation is clickable), or use Hide / Remove control.",
  textRevert: "Revert text",
  textApplied: "Text replaced",
  applyText: "Apply text",
  textLiveHint: "Previews live while you type; press Enter or Apply text to write the draft",
  placeholderTarget: "Gray default text (the new-conversation placeholder)",
  unsaved: "Unsaved changes",
  saving: "Saving\u2026",
  savedOk: "Saved",
  saveFailed: "Save failed: ",
  imageTooLarge: "The image is too large to save even after compression \u2014 pick a smaller one",
  imageCompressed: "Image auto-compressed so the document stays saveable",
  elementActions: "Element actions",
  // —— 0.3.8 draw-mode UI ——
  modeHint: "Select: clicking an element selects it. Interact: use the page normally (clicks never select).",
  undoHint: "Undo (Ctrl/Cmd+Z)",
  redoHint: "Redo (Ctrl/Cmd+Shift+Z)",
  embedImageHint: "Select a container first, then embed an image",
  panelLabel: "Panel",
  panelShowHint: "Show the right panel",
  panelHideHint: "Hide the right panel to see the whole page (the page fills back in)",
  resetHint: "Restore default: discard every unapplied change",
  resetConfirm: "Restore discards the draft \u2014 continue?",
  applyHint: "Write, enable, then leave draw mode",
  saveDraft: "Save",
  saveHint: "Write the skin document and stay in draw mode (keeps the enabled state as it is)",
  savedHint: "\u2713 Skin document written \u2014 keep editing",
  closeHint: "Close the editor and save unapplied changes",
  shortcuts: "Esc clears the selection \xB7 Ctrl+Z undo \xB7 Alt+\u2191\u2193 walk the tree",
  emptyTitle: "Start drawing",
  emptySteps: "Click an element to select it \u2192 edit styles or text on the right \u2192 press Apply to write the skin",
  selectParent: "Parent",
  selectChild: "Child",
  selectParentHint: "Select the parent level (Alt+\u2191)",
  selectChildHint: "Select the child level (Alt+\u2193)",
  clearField: "Clear this property",
  customBadge: "custom",
  groupText: "Text",
  groupBox: "Box",
  groupLook: "Appearance",
  fieldFontSize: "Font size",
  fieldWeight: "Weight",
  fieldLineHeight: "Line height",
  fieldColor: "Color",
  fieldTextAlign: "Text align",
  fieldWidth: "Width",
  fieldHeight: "Height",
  fieldPadding: "Padding",
  fieldMargin: "Margin",
  fieldRadius: "Radius",
  fieldBorderWidth: "Border width",
  fieldBorderColor: "Border color",
  fieldBg: "Background",
  fieldBgImage: "Background image",
  fieldShadow: "Shadow",
  fieldOpacity: "Opacity",
  // —— 0.3.8 fonts & transform ——
  fieldFont: "Font family",
  embedFont: "Embed font file",
  embedFontHint: "Store a .woff2/.woff/.ttf/.otf inside the skin (\u2264400 KB; it is saved with the skin document, so bigger means slower saves)",
  fontToPage: "Apply to page",
  fontToPageHint: "Write this family onto body (site-wide). body cannot be picked on the canvas, so it gets its own door",
  fontHint: "Any family name works (system fonts included); a whole stack can be pasted as is",
  fontEmbedded: "\u2713 Font embedded and applied to this element",
  fontTooLarge: "Font file too large (30 MB cap)",
  fontHeavy: "\u26A0 Font embedded, but it rides in the skin document as base64: every save gets slower (the exported .dshskin keeps it as a real file)",
  fontUnsupported: "Unsupported font format: use .woff2 / .woff / .ttf / .otf",
  groupTransform: "Position & scale",
  fieldTransX: "X offset",
  fieldTransY: "Y offset",
  fieldScale: "Scale",
  resetTransform: "Reset transform (all three)",
  resetAxisX: "Reset X offset",
  resetAxisY: "Reset Y offset",
  resetScale: "Reset scale",
  scaleSlider: "Scale slider",
  wheelHint: "Wheel \xB11px (Shift \xB110px)",
  wheelHintScale: "Wheel \xB10.05 (Shift \xB10.25)",
  snapAlign: "Align",
  snapHint: "Low-sensitivity snapping while moving or scaling: within 4px of a sibling/parent edge or centre it snaps and draws a guide line; hold Alt to suspend it",
  transformHint: "Visual move/scale only \u2014 layout flow is untouched; you can also drag the \u2725 (move) and the corner grip (scale) on the selection box. Hover a number and wheel to nudge it, \u21BA resets that axis alone.",
  moveGripHint: "Drag to move on both axes (layout untouched)",
  scaleGripHint: "Drag to scale uniformly"
};

// src/client/index.ts
var SETTINGS_NS = "settings.dsh-myskin";
var name = "dsh-myskin";
var inject = ["slots", "locale", "configForms", "theme"];
var NAMESPACE_CANDIDATES = [SKIN_SETTINGS_NAMESPACE, LEGACY_SETTINGS_NAMESPACE];
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), "dsh-myskin: copy dictionaries");
  const theme = ctx.theme;
  const t = ctx.locale.bind(SETTINGS_NS);
  ctx.effect(() => ctx.configForms.whileServed(NAMESPACE_CANDIDATES, (served) => {
    const namespace = NAMESPACE_CANDIDATES.find((candidate) => served.has(candidate));
    if (namespace === void 0) return () => void 0;
    const scope = ctx.configForms.get(namespace);
    let override;
    const apply2 = () => {
      const snap = scope.getSnapshot();
      if (snap.status !== "ready") return;
      const value = currentSkin(snap.value);
      override?.dispose();
      override = value.enabled ? applySkin(theme, value) : void 0;
    };
    const offSnapshot = scope.subscribe(apply2);
    apply2();
    const offSlot = ctx.slots.inject("settings.section", () => ctx.slots.register({
      name: "settings.section",
      id: "dsh-myskin",
      order: 20,
      label: () => t("nav"),
      locale: SETTINGS_NS,
      inject: () => ({ scope, theme, t })
    }, MySkinSection));
    return () => {
      offSlot();
      offSnapshot();
      override?.dispose();
      override = void 0;
    };
  }), "dsh-myskin: settings-backed lifecycle");
}
return module.exports; } });
