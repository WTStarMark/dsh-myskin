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

// src/client/interop.ts
var SKIN_MARKER_ATTRIBUTE = "data-dsh-skin";
var WALLPAPER_ENGINE_ATTRIBUTE = "data-we-wallpaper";
var WALLPAPER_ENGINE_MARKERS = [
  "data-we-glass-page",
  "data-we-adapter",
  WALLPAPER_ENGINE_ATTRIBUTE
];
function wallpaperEngineInstalled(doc) {
  const body = doc?.body;
  if (body === void 0 || body === null) return false;
  return WALLPAPER_ENGINE_MARKERS.some((marker) => body.hasAttribute(marker));
}
var SKIN_MARKER_VALUE = "dsh-myskin";
function publishSkinMarker(doc, active) {
  const root = doc?.documentElement;
  if (root === void 0 || root === null) return;
  const current = root.getAttribute(SKIN_MARKER_ATTRIBUTE);
  if (active) {
    if (current === null || current === SKIN_MARKER_VALUE) root.setAttribute(SKIN_MARKER_ATTRIBUTE, SKIN_MARKER_VALUE);
    return;
  }
  if (current === SKIN_MARKER_VALUE) root.removeAttribute(SKIN_MARKER_ATTRIBUTE);
}
function wallpaperEngineOnStage(doc) {
  const body = doc?.body;
  return body !== void 0 && body !== null && body.hasAttribute(WALLPAPER_ENGINE_ATTRIBUTE);
}
function observeWallpaperEngine(doc, onChange) {
  const body = doc?.body;
  if (body === void 0 || body === null || typeof MutationObserver === "undefined") return () => {
  };
  const observer = new MutationObserver(() => {
    onChange();
  });
  observer.observe(body, { attributes: true, attributeFilter: [...WALLPAPER_ENGINE_MARKERS] });
  return () => {
    observer.disconnect();
  };
}

// src/skin-schema.ts
var SKIN_SETTINGS_NAMESPACE = "dsh-myskin";
var LEGACY_SETTINGS_NAMESPACE = "myskin";
function resetSkin(current) {
  const identity = cloneSkin(EMPTY_SKIN);
  if (current === void 0) return identity;
  return cloneSkin({ ...identity, library: current.library ?? [] });
}
var EMPTY_SKIN = {
  enabled: false,
  tokens: {},
  css: [],
  text: [],
  canvas: { background: void 0, images: [] },
  layers: [],
  library: []
};
function cloneImage(img) {
  const copy = { ...img };
  if (img.anchor === void 0) delete copy.anchor;
  else copy.anchor = { ...img.anchor };
  return copy;
}
function cloneSkin(skin) {
  return {
    enabled: skin.enabled === true,
    tokens: { ...skin.tokens ?? {} },
    css: (skin.css ?? []).map((r) => ({ selector: r.selector, rule: r.rule })),
    text: (skin.text ?? []).map((o) => ({ selector: o.selector, before: o.before, after: o.after })),
    canvas: {
      ...skin.canvas ?? { images: [] },
      images: (skin.canvas?.images ?? []).map(cloneImage)
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
        images: (s.canvas?.images ?? []).map(cloneImage)
      },
      layers: (s.layers ?? []).map((l) => ({ ...l }))
    }))
  };
}
function imageModeOf(img) {
  return img.mode === "anchor" ? "anchor" : "embed";
}
function parseSkin(skin) {
  if (skin === void 0) return cloneSkin(EMPTY_SKIN);
  return cloneSkin(skin);
}

// src/client/anchors.ts
var ANCHOR_COMPONENTS = [
  { id: "app", labelKey: "compApp", selector: "#root" },
  { id: "frame", labelKey: "compFrame", selector: '[class*="_frame"], [class~="frame"]' },
  { id: "column", labelKey: "compColumn", selector: '[class*="_centerCol"], [class~="centerCol"]' },
  { id: "session", labelKey: "compSession", selector: '[data-slot="conversation.session"]' },
  { id: "view", labelKey: "compView", selector: '[data-slot^="conversation.view"]' },
  { id: "composer", labelKey: "compComposer", selector: "[data-composer-seat]" },
  { id: "composerInput", labelKey: "compComposerInput", selector: "[data-composer-input]" },
  { id: "placeholder", labelKey: "compPlaceholder", selector: "[data-composer-placeholder]" },
  { id: "tree", labelKey: "compTree", selector: '[role="tree"]' }
];
function componentById(id) {
  return ANCHOR_COMPONENTS.find((entry) => entry.id === id);
}
function anchorOf(img) {
  if (img.anchor !== void 0) {
    const value = img.anchor.kind === "element" && img.anchor.value === "" ? img.fallbackSelector ?? "" : img.anchor.value;
    return { ...img.anchor, value };
  }
  return { kind: "element", value: img.fallbackSelector ?? "" };
}
function anchorKey(anchor) {
  return anchor.kind + ":" + anchor.value;
}
function anchorLabel(anchor, t) {
  if (anchor.kind === "component") {
    const component = componentById(anchor.value);
    if (component !== void 0) return t(component.labelKey);
  }
  if (anchor.label !== void 0 && anchor.label !== "") return anchor.label;
  return anchor.value;
}

// src/client/dock.ts
var DOCK_ATTRIBUTE = "data-dsh-myskin-dock";
var DOCK_STORAGE_KEY = "dsh-myskin.dock";
var DEFAULT_DOCK = "right";
function otherDock(side) {
  return side === "left" ? "right" : "left";
}
function isDockSide(value) {
  return value === "left" || value === "right";
}
function browserStorage() {
  try {
    return typeof localStorage === "undefined" ? void 0 : localStorage;
  } catch {
    return void 0;
  }
}
function readDockSide(storage) {
  try {
    const raw = storage?.getItem(DOCK_STORAGE_KEY);
    return isDockSide(raw) ? raw : DEFAULT_DOCK;
  } catch {
    return DEFAULT_DOCK;
  }
}
function writeDockSide(storage, side) {
  try {
    storage?.setItem(DOCK_STORAGE_KEY, side);
  } catch {
  }
}
function applyDockAttribute(doc, side) {
  doc.documentElement.setAttribute(DOCK_ATTRIBUTE, side);
}
function clearDockAttribute(doc) {
  doc.documentElement.removeAttribute(DOCK_ATTRIBUTE);
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
  rules.push("html[" + DOCK_ATTRIBUTE + "='right'] { --dsh-myskin-inset-x: var(--dsh-myskin-inset-right, 340px); }");
  rules.push("html[" + DOCK_ATTRIBUTE + "='left'] { --dsh-myskin-inset-x: var(--dsh-myskin-inset-left, 340px); }");
  const modalLayer = "body > :not(#root):not([data-dsh-myskin-ui]):has([data-shortcut-modal])";
  const modalTop = "  top: calc(var(--dsh-myskin-chrome-top, 0px) + var(--dsh-myskin-inset-top, 48px)) !important;";
  rules.push("html[" + DOCK_ATTRIBUTE + "='right'] " + modalLayer + " {");
  rules.push(modalTop);
  rules.push("  right: var(--dsh-myskin-inset-x, 340px) !important;");
  rules.push("}");
  rules.push("html[" + DOCK_ATTRIBUTE + "='left'] " + modalLayer + " {");
  rules.push(modalTop);
  rules.push("  left: var(--dsh-myskin-inset-x, 340px) !important;");
  rules.push("}");
  rules.push('[data-shortcut-modal="settings"] {');
  rules.push("  height: min(800px, max(240px, calc(100vh - var(--dsh-myskin-chrome-top, 0px) - var(--dsh-myskin-inset-top, 48px) - 48px))) !important;");
  rules.push("  max-width: calc(100vw - var(--dsh-myskin-inset-x, 340px) - 48px) !important;");
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
  const margin = (side, property) => "html[" + DOCK_ATTRIBUTE + "='" + side + "'] body { " + property + ": var(--dsh-myskin-inset-x, 340px) !important; }";
  if (shell.windowsTitlebar) {
    rules.push('[class*="_frame"] { padding-top: calc(var(--dsh-windows-titlebar-height, 40px) + var(--dsh-myskin-inset-top, 48px)) !important; }');
    rules.push(margin("right", "margin-right"));
    rules.push(margin("left", "margin-left"));
  } else {
    rules.push("body {");
    rules.push("  margin-top: var(--dsh-myskin-inset-top, 48px) !important;");
    rules.push("  height: calc(100vh - var(--dsh-myskin-inset-top, 48px)) !important;");
    rules.push("}");
    rules.push(margin("right", "margin-right"));
    rules.push(margin("left", "margin-left"));
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
var DRAFT_STYLE_ID = "dsh-myskin-live";
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
  const cell = doc.querySelector('[data-shortcut-modal] button[aria-current="true"]') ?? doc.querySelector('button[aria-current="true"]');
  if (cell === null) return "";
  return (cell.textContent ?? "").replace(/\s+/g, " ").trim();
}
function sameSettingsPage(recorded, current) {
  if (recorded === "" || current === "") return false;
  const label = (key) => key.split("@")[0].trim();
  return label(recorded) === label(current);
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
  return withRootMarker(css, BG_OPACITY_PROPERTY, String(Math.round(opacity * 100) / 100));
}
var BG_ANCHOR_PROPERTY = "--dsh-myskin-bg-anchor";
function readBackgroundAnchor(skin) {
  for (const rule of skin.css ?? []) {
    const match = rule.rule.match(/--dsh-myskin-bg-anchor:\s*([a-z-]+)/);
    if (match !== null) return match[1] === "conversation" ? "conversation" : "viewport";
  }
  return "viewport";
}
function withBackgroundAnchor(css, anchor) {
  return withRootMarker(css, BG_ANCHOR_PROPERTY, anchor === "conversation" ? "conversation" : void 0);
}
var COMPAT_PROPERTY = "--dsh-myskin-compat";
var PANEL_FILL_PROPERTY = "--dsh-myskin-panel";
function readCompatChoice(skin) {
  for (const rule of skin.css ?? []) {
    const match = rule.rule.match(/--dsh-myskin-compat:\s*([a-z0-9]+)/);
    if (match === null) continue;
    const value = match[1];
    if (value === "0" || value === "off" || value === "false") return "off";
    if (value === "1" || value === "on" || value === "true") return "on";
  }
  return "auto";
}
function resolveCompatMode(choice, wallpaperEngineInstalled2) {
  if (choice === "on") return true;
  if (choice === "off") return false;
  return wallpaperEngineInstalled2;
}
function withCompatMode(css, on) {
  return withRootMarker(css, COMPAT_PROPERTY, on ? "1" : "0");
}
function isBackgroundToken(name2) {
  return name2.startsWith("--dsw-alias-bg-") || name2 === "--dsw-specific-sidebar-fill";
}
function paintableTokens(tokens, compat) {
  if (!compat) return tokens;
  const kept = {};
  for (const name2 of Object.keys(tokens ?? {})) {
    if (!isBackgroundToken(name2)) kept[name2] = tokens[name2];
  }
  return kept;
}
function paintableRules(css, compat) {
  if (!compat) return css;
  const out = [];
  for (const entry of css ?? []) {
    if (declarationValue(entry.rule, PANEL_FILL_PROPERTY) === void 0) {
      out.push(entry);
      continue;
    }
    let rule = withoutDeclaration(entry.rule, "background-color");
    rule = withoutDeclaration(rule, "background");
    rule = withoutDeclaration(rule, PANEL_FILL_PROPERTY);
    if (rule !== "") out.push({ selector: entry.selector, rule });
  }
  return out;
}
function withRootMarker(css, property, value) {
  const rules = css ?? [];
  const existing = rules.find((rule2) => rule2.selector === BG_OPACITY_SELECTOR)?.rule;
  const rule = value === void 0 ? withoutDeclaration(existing, property) : mergeDeclaration(existing, property + ": " + value + ";");
  const rest = rules.filter((entry) => entry.selector !== BG_OPACITY_SELECTOR).map((entry) => ({ selector: entry.selector, rule: entry.rule }));
  return rule === "" ? rest : [...rest, { selector: BG_OPACITY_SELECTOR, rule }];
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
function declarationOf(rule, property) {
  const found = declarationPairs(rule ?? "").find(([prop]) => prop === property);
  return found === void 0 ? void 0 : found[0] + ": " + found[1];
}
function isRemovedRule(rule) {
  return declarationPairs(rule ?? "").some(([property, value]) => property === "display" && value.replace(/\s*!important\s*$/i, "").trim().toLowerCase() === "none");
}
function removedControls(css) {
  return css.filter((r) => r.selector !== "" && isRemovedRule(r.rule)).map((r) => ({ selector: r.selector, rule: r.rule }));
}
function withControlRestored(css, selector) {
  return css.flatMap((r) => {
    if (r.selector !== selector) return [r];
    const rest = withoutDeclaration(r.rule, "display");
    return rest === "" ? [] : [{ selector: r.selector, rule: rest }];
  });
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
  "transform",
  "z-index"
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
function transformEdit(existing, x, y, scale) {
  const value = transformValue(x, y, scale);
  return value === "" ? withoutDeclaration(existing, "transform") : mergeDeclaration(existing, "transform: " + value + " !important");
}
function transformPreview(rule, fields, authored) {
  if (!authored) return declarationOf(rule, "transform") ?? "";
  const value = transformValue(fields.x, fields.y, fields.scale);
  return value === "" ? "" : "transform: " + value + " !important";
}
function naturalDisplayOf(el) {
  const doc = el.ownerDocument;
  const head = doc.head;
  if (head === null) return void 0;
  const sheets = [doc.getElementById(STYLE_ID), doc.getElementById(DRAFT_STYLE_ID)].filter((node) => node !== null && node.tagName === "STYLE");
  const placed = sheets.map((sheet) => ({ sheet, next: sheet.nextSibling }));
  try {
    for (const sheet of sheets) sheet.remove();
    const value = doc.defaultView?.getComputedStyle(el).display ?? "";
    const display = value.trim();
    return display === "" || display === "none" ? void 0 : display;
  } catch {
    return void 0;
  } finally {
    for (const { sheet, next } of placed) {
      if (sheet.parentNode !== null) continue;
      if (next !== null && next.parentNode === head) head.insertBefore(sheet, next);
      else head.appendChild(sheet);
    }
  }
}
function keepStylesheetLast(tag) {
  if (tag === null || typeof document === "undefined") return;
  const head = tag.parentNode;
  if (head === null || head !== document.head) return;
  if (head.lastElementChild !== tag) head.appendChild(tag);
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
function pickOne(selector) {
  if (typeof document === "undefined" || selector === "") return void 0;
  let elements;
  try {
    elements = Array.from(document.querySelectorAll(selector));
  } catch {
    return void 0;
  }
  if (elements.length === 0) return void 0;
  if (elements.length === 1) return elements[0];
  return elements.find((el) => el.getClientRects().length > 0) ?? elements[0];
}
function innermost(candidates) {
  return candidates.find((el) => !candidates.some((other) => other !== el && el.contains(other))) ?? candidates[0];
}
function findByText(doc, wanted) {
  if (wanted === "") return void 0;
  const exact = [];
  const loose = [];
  for (const el of Array.from(doc.body?.querySelectorAll("*") ?? [])) {
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const placeholder = el.placeholder.trim();
      if (placeholder === wanted) exact.push(el);
      else if (placeholder.includes(wanted)) loose.push(el);
      continue;
    }
    const node = directTextNode(el);
    if (node === void 0) continue;
    const data = node.data.trim();
    if (data === "") continue;
    if (data === wanted) exact.push(el);
    else if (data.includes(wanted)) loose.push(el);
  }
  return innermost(exact) ?? innermost(loose);
}
function anchorTextOf(el) {
  const host = textHostOf(el);
  if (host === void 0) return void 0;
  if (host.tagName === "INPUT" || host.tagName === "TEXTAREA") {
    const placeholder = host.placeholder.trim();
    return placeholder === "" ? void 0 : placeholder;
  }
  const node = directTextNode(host);
  const text = node?.data.trim() ?? "";
  return text === "" ? void 0 : text;
}
function resolveImageAnchor(img, doc) {
  const anchor = anchorOf(img);
  const fallback = img.fallbackSelector ?? "";
  if (anchor.kind === "group") return pickOne(anchor.value) ?? pickOne(fallback);
  if (anchor.kind === "text") {
    return findByText(doc, anchor.value.trim()) ?? pickOne(fallback);
  }
  if (anchor.kind === "component") {
    const component = componentById(anchor.value);
    if (component === void 0) return pickOne(fallback);
    return pickOne(component.selector) ?? pickOne(fallback);
  }
  return pickOne(anchor.value) ?? pickOne(fallback);
}
function resolveImageTargets(img, doc) {
  const anchor = anchorOf(img);
  if (anchor.kind === "group") {
    const matches = allOf(doc, anchor.value);
    if (matches.length > 0) return matches;
    const fallback = img.fallbackSelector ?? "";
    return fallback === "" ? [] : allOf(doc, fallback).slice(0, 1);
  }
  const one = resolveImageAnchor(img, doc);
  return one === void 0 ? [] : [one];
}
function allOf(doc, selector) {
  if (selector === "") return [];
  try {
    return Array.from(doc.querySelectorAll(selector));
  } catch {
    return [];
  }
}
function hasIdentity(img) {
  const anchor = anchorOf(img);
  return anchor.value !== "" || (img.fallbackSelector ?? "") !== "";
}
var OVERLAY_ATTR = "data-dsh-myskin-overlay";
var ANCHOR_IMAGE_ATTR = "data-dsh-myskin-anchor-image";
var OVERLAY_Z_INDEX = 900;
function mountImageOverlay(getImages, doc = document, getFeather = () => ({ width: 0, soft: 0 }), getAllowed = () => true) {
  const view = doc.defaultView;
  const host = doc.createElement("div");
  host.setAttribute(OVERLAY_ATTR, "1");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position: fixed; inset: 0; overflow: visible; pointer-events: none; z-index: " + String(OVERLAY_Z_INDEX) + ";";
  doc.body.appendChild(host);
  const nodes = /* @__PURE__ */ new Map();
  const nodeFor = (img, index) => {
    const key = img.id + "#" + String(index);
    const known = nodes.get(key);
    if (known !== void 0) return known;
    const node = doc.createElement("div");
    node.setAttribute(ANCHOR_IMAGE_ATTR, img.id);
    if (index > 0) node.setAttribute("data-dsh-myskin-anchor-index", String(index));
    node.setAttribute("data-dsh-myskin-owner", PLUGIN_ID);
    node.style.cssText = "position: absolute; pointer-events: none; display: none; background-repeat: no-repeat; background-size: 100% 100%; background-position: center;";
    host.appendChild(node);
    nodes.set(key, node);
    return node;
  };
  const setStyle = (node, property, value) => {
    if (node.style.getPropertyValue(property) !== value) node.style.setProperty(property, value);
  };
  const sync = () => {
    const images = getImages();
    const live = /* @__PURE__ */ new Set();
    const pageKey = currentSettingsPageKey(doc);
    for (const img of images) {
      const scoped2 = !getAllowed(img, pageKey);
      const targets = scoped2 || img.url === "" ? [] : resolveImageTargets(img, doc);
      const slots = Math.max(targets.length, 1);
      for (let index = 0; index < slots; index += 1) {
        const key = img.id + "#" + String(index);
        live.add(key);
        const node = nodeFor(img, index);
        const target = targets[index];
        if (target === void 0) {
          setStyle(node, "display", "none");
          continue;
        }
        const rect = target.getBoundingClientRect();
        const feather = getFeather(img.id);
        const spread = feather.width;
        const style = featherStyle(feather);
        setStyle(node, "display", "block");
        setStyle(node, "left", rect.left + (img.x || 0) - spread + "px");
        setStyle(node, "top", rect.top + (img.y || 0) - spread + "px");
        setStyle(node, "width", Math.max(1, img.w + spread * 2) + "px");
        setStyle(node, "height", Math.max(1, img.h + spread * 2) + "px");
        setStyle(node, "opacity", String(img.opacity ?? 1));
        setStyle(node, "mix-blend-mode", img.blend ?? "normal");
        setStyle(node, "background-image", 'url("' + img.url + '")');
        for (const property of ["mask-image", "mask-composite", "-webkit-mask-composite", "mask-repeat", "filter"]) {
          setStyle(node, property, style[property] ?? "");
        }
      }
    }
    for (const [key, node] of nodes) {
      if (!live.has(key)) {
        node.remove();
        nodes.delete(key);
      }
    }
  };
  let frame = 0;
  const raf = (fn) => view !== null && typeof view.requestAnimationFrame === "function" ? view.requestAnimationFrame(fn) : setTimeout(fn, 16);
  const cancelRaf = (id) => {
    if (view !== null && typeof view.cancelAnimationFrame === "function") view.cancelAnimationFrame(id);
    else clearTimeout(id);
  };
  const schedule = () => {
    if (frame !== 0) return;
    frame = raf(() => {
      frame = 0;
      sync();
    });
  };
  const onScroll = () => {
    schedule();
  };
  view?.addEventListener("scroll", onScroll, true);
  view?.addEventListener("resize", onScroll);
  const observer = typeof MutationObserver === "undefined" ? void 0 : new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target;
      if (target instanceof Element && target.closest("[" + OVERLAY_ATTR + "]") !== null) continue;
      schedule();
      return;
    }
  });
  observer?.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden", "style", "aria-current"] });
  sync();
  return {
    sync,
    dispose: () => {
      if (frame !== 0) {
        cancelRaf(frame);
        frame = 0;
      }
      view?.removeEventListener("scroll", onScroll, true);
      view?.removeEventListener("resize", onScroll);
      observer?.disconnect();
      host.remove();
      nodes.clear();
    }
  };
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
function wallpaperRules(doc, url, tint, anchor = "viewport") {
  const geometry = "background-size: cover !important; background-position: center !important; background-attachment: fixed !important;";
  const body = 'background-image: url("' + url + '") !important; ' + geometry;
  const rules = ["body { " + body + " }"];
  const fmt = (value) => String(Math.round(value * 100) / 100);
  const layers = tint === void 0 ? 'url("' + url + '")' : "linear-gradient(rgba(" + tint.rgb + ", " + fmt(tint.base) + "), rgba(" + tint.rgb + ", " + fmt(tint.base) + ')), url("' + url + '")';
  const shell = readDesktopShell(doc);
  const conversation = anchor === "conversation" ? CENTER_COLUMN_SELECTOR + " { background-image: " + layers + " !important; background-size: cover !important; background-position: center !important; background-attachment: scroll !important; }" : void 0;
  if (shell.windowsTitlebar) {
    rules.push(CENTER_COLUMN_SELECTOR + " { background-image: " + layers + " !important; " + geometry + " background-color: transparent !important; }");
    if (conversation !== void 0) rules.push(conversation);
    return rules;
  }
  if (!shell.desktop) {
    if (conversation !== void 0) rules.push(conversation);
    return rules;
  }
  rules.push(FRAME_SELECTOR + " { background-image: " + layers + " !important; " + geometry + " }");
  if (tint !== void 0) rules.push(CENTER_COLUMN_SELECTOR + " { background-color: transparent !important; }");
  if (conversation !== void 0) rules.push(conversation);
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
function featherStyle(feather) {
  if (feather.width <= 0) return {};
  const out = {};
  const bleed = Math.round(feather.width * FEATHER_BLEED);
  const ramp = Math.round(feather.width) + bleed;
  const alpha = (t) => {
    const eased = (1 - feather.soft) * t + feather.soft * (t * t * (3 - 2 * t));
    return String(Math.round(eased * 100) / 100);
  };
  const rise = [];
  for (let step = 1; step <= FEATHER_SAMPLES; step += 1) {
    const t = step / FEATHER_SAMPLES;
    const at = Math.round(t * ramp);
    rise.push("rgba(0, 0, 0, " + alpha(t) + ") " + (step === FEATHER_SAMPLES ? ramp + "px" : at + "px"));
  }
  const fall = [...rise].reverse().map((stop) => {
    const [colour, position] = stop.split(") ");
    const px = position.replace("px", "");
    return colour + ") calc(100% - " + px + "px)";
  });
  const axis = (direction) => "linear-gradient(to " + direction + ", rgba(0, 0, 0, 0) 0px, " + rise.join(", ") + ", #000 calc(100% - " + ramp + "px), " + fall.join(", ") + ", rgba(0, 0, 0, 0) 100%)";
  out["mask-image"] = axis("right") + ", " + axis("bottom");
  out["mask-composite"] = "intersect";
  out["-webkit-mask-composite"] = "source-in";
  out["mask-repeat"] = "no-repeat";
  return out;
}
function embedAfterRule(img, above, feather) {
  const blend = img.blend !== void 0 && img.blend !== "normal" ? " mix-blend-mode: " + img.blend + ";" : "";
  const layer = above ? "z-index: 1;" : "z-index: -1;";
  const bleed = feather.width > 0 ? Math.round(feather.width * FEATHER_BLEED) : 0;
  const inset = bleed > 0 ? -bleed + "px" : "0";
  const extra = Object.entries(featherStyle(feather)).map(([property, value]) => " " + property + ": " + value + ";").join("");
  return "::after { content: ''; position: absolute; inset: " + inset + '; background-image: url("' + img.url + '"); background-repeat: no-repeat; background-position: ' + img.x + "px " + img.y + "px; background-size: " + (img.w + bleed * 2) + "px " + (img.h + bleed * 2) + "px; opacity: " + (img.opacity ?? 1) + "; pointer-events: none; " + layer + blend + extra + " }";
}
function declarationValue(rule, property) {
  const escaped = property.replace(/[-[\]{}()*+?.\\^$|]/g, "\\$&");
  const match = rule.match(new RegExp("(?:^|;)\\s*" + escaped + "\\s*:\\s*([^;]+)"));
  if (match === null) return void 0;
  return match[1].replace(/!important/i, "").trim();
}
var IMAGE_LAYER_PROPERTY = "--dsh-myskin-layer";
function readImageLayer(skin, id) {
  const marker = (skin.css ?? []).find((rule) => rule.selector === '[data-dsh-myskin-embed="' + id + '"]');
  const value = marker === void 0 ? void 0 : declarationValue(marker.rule, IMAGE_LAYER_PROPERTY);
  return value === "above" || value === "below" ? value : "auto";
}
function withImageLayer(css, id, layer) {
  return withImageMarker(css, id, IMAGE_LAYER_PROPERTY, layer === "auto" ? void 0 : layer);
}
var IMAGE_FEATHER_PROPERTY = "--dsh-myskin-feather";
var IMAGE_PAGE_SCOPE_PROPERTY = "--dsh-myskin-page-scope";
function readImagePageScope(skin, id) {
  return imageMarker(skin.css, id, IMAGE_PAGE_SCOPE_PROPERTY) !== "any";
}
function imagePageMatches(skin, img, currentKey) {
  if (imageMarker(skin.css, img.id, IMAGE_PAGE_SCOPE_PROPERTY) === "any") return true;
  const recorded = img.pageKey ?? "";
  if (recorded === "") return true;
  return sameSettingsPage(recorded, currentKey);
}
var IMAGE_FEATHER_SOFT_PROPERTY = "--dsh-myskin-feather-soft";
var FEATHER_BLEED = 0.25;
var FEATHER_SAMPLES = 5;
function imageMarker(css, id, property) {
  const marker = (css ?? []).find((rule) => rule.selector === '[data-dsh-myskin-embed="' + id + '"]');
  return marker === void 0 ? void 0 : declarationValue(marker.rule, property);
}
function withImageMarker(css, id, property, value) {
  const selector = '[data-dsh-myskin-embed="' + id + '"]';
  const rules = css ?? [];
  const existing = rules.find((rule2) => rule2.selector === selector)?.rule;
  const rule = value === void 0 || value === "" ? withoutDeclaration(existing, property) : mergeDeclaration(existing, property + ": " + value + ";");
  const rest = rules.filter((entry) => entry.selector !== selector).map((entry) => ({ selector: entry.selector, rule: entry.rule }));
  return rule === "" ? rest : [...rest, { selector, rule }];
}
function readImageFeather(skin, id) {
  const width = Number.parseFloat(imageMarker(skin.css, id, IMAGE_FEATHER_PROPERTY) ?? "");
  const soft = Number.parseFloat(imageMarker(skin.css, id, IMAGE_FEATHER_SOFT_PROPERTY) ?? "");
  return {
    width: Number.isFinite(width) && width > 0 ? Math.min(400, width) : 0,
    soft: Number.isFinite(soft) ? Math.min(1, Math.max(0, soft / 100)) : 0
  };
}
function withImageFeather(css, id, feather) {
  let next = withImageMarker(css, id, IMAGE_FEATHER_PROPERTY, feather.width > 0 ? String(Math.round(feather.width)) + "px" : void 0);
  next = withImageMarker(next, id, IMAGE_FEATHER_SOFT_PROPERTY, feather.width > 0 && feather.soft > 0 ? String(Math.round(feather.soft * 100)) : void 0);
  next = withImageMarker(next, id, "--dsh-myskin-feather-blur", void 0);
  return withImageMarker(next, id, "--dsh-myskin-feather-shape", void 0);
}
function embedPaintsAbove(img, layer = "auto") {
  if (layer === "above") return true;
  if (layer === "below") return false;
  return img.blend !== void 0 && img.blend !== "normal";
}
function embedHostRule(selector, above) {
  return above ? selector + " { position: relative; }" : selector + " { position: relative; isolation: isolate; }";
}
function parseDeclarations(text) {
  if (text === void 0 || text === "") return [];
  const out = [];
  for (const chunk of text.split(";")) {
    const at = chunk.indexOf(":");
    if (at <= 0) continue;
    const property = chunk.slice(0, at).trim();
    const value = chunk.slice(at + 1).trim();
    if (property === "" || value === "") continue;
    out.push([property, value]);
  }
  return out;
}
function applyLayerStyle(node, layer, applied = []) {
  const st = node.style;
  st.position = layer.attach === "prepend" || layer.attach === "append" ? "fixed" : "fixed";
  st.left = (layer.x ?? 0) + "px";
  st.top = (layer.y ?? 0) + "px";
  st.width = (layer.w ?? 48) + "px";
  st.height = (layer.h ?? 48) + "px";
  st.opacity = String(layer.opacity ?? 1);
  st.mixBlendMode = layer.blend !== void 0 && layer.blend !== "normal" ? layer.blend : "normal";
  st.pointerEvents = "none";
  if (layer.kind === "img") {
    const img = node;
    img.alt = "";
    if (img.src !== (layer.url ?? "")) img.src = layer.url ?? "";
    st.objectFit = "contain";
    st.backgroundImage = "";
  } else {
    st.backgroundImage = layer.url !== void 0 && layer.url !== "" ? 'url("' + layer.url + '")' : "";
    st.backgroundSize = "contain";
    st.backgroundRepeat = "no-repeat";
  }
  const pairs = parseDeclarations(layer.css);
  for (const [property, value] of pairs) st.setProperty(property, value);
  for (const property of applied) {
    if (!pairs.some(([next]) => next === property)) st.removeProperty(property);
  }
  return pairs;
}
function mountInjectedLayers(getLayers, doc = document, getPageKey = () => "") {
  const nodes = /* @__PURE__ */ new Map();
  const applied = /* @__PURE__ */ new Map();
  let frame = 0;
  const sync = () => {
    const layers = getLayers();
    const pageKey = getPageKey();
    const live = /* @__PURE__ */ new Set();
    for (const layer of layers) {
      const recorded = layer.pageKey ?? "";
      if (recorded !== "" && !sameSettingsPage(recorded, pageKey)) continue;
      const container = doc.querySelector(layer.selector);
      if (container === null) continue;
      live.add(layer.id);
      const known = nodes.get(layer.id);
      if (known !== void 0 && known.isConnected) {
        applied.set(known, applyLayerStyle(known, layer, (applied.get(known) ?? []).map(([property]) => property)));
        continue;
      }
      if (known !== void 0) {
        known.remove();
        nodes.delete(layer.id);
        applied.delete(known);
      }
      const node = doc.createElement(layer.kind);
      node.setAttribute("data-dsh-myskin-layer", layer.id);
      node.setAttribute("data-dsh-myskin-owner", PLUGIN_ID);
      node.setAttribute("aria-hidden", "true");
      applied.set(node, applyLayerStyle(node, layer));
      if (layer.attach === "prepend") container.prepend(node);
      else container.append(node);
      nodes.set(layer.id, node);
    }
    for (const [id, node] of nodes) {
      if (!live.has(id)) {
        node.remove();
        nodes.delete(id);
        applied.delete(node);
      }
    }
  };
  const schedule = () => {
    if (frame !== 0) return;
    frame = raf(() => {
      frame = 0;
      sync();
    });
  };
  const raf = (fn) => {
    const view = doc.defaultView;
    return view !== null && typeof view.requestAnimationFrame === "function" ? view.requestAnimationFrame(fn) : setTimeout(fn, 16);
  };
  const cancel = (id) => {
    const view = doc.defaultView;
    if (view !== null && typeof view.cancelAnimationFrame === "function") view.cancelAnimationFrame(id);
    else clearTimeout(id);
  };
  sync();
  const observer = typeof MutationObserver === "undefined" ? void 0 : new MutationObserver(() => {
    schedule();
  });
  observer?.observe(doc.body, { childList: true, subtree: true });
  return {
    sync,
    nodeFor: (id) => nodes.get(id),
    dispose: () => {
      observer?.disconnect();
      if (frame !== 0) {
        cancel(frame);
        frame = 0;
      }
      for (const node of nodes.values()) node.remove();
      nodes.clear();
      applied.clear();
    }
  };
}
function applySkin(theme, skin) {
  const cleanups = [];
  let disposed = false;
  let bodyStyleProto = null;
  if (typeof document !== "undefined") bodyStyleProto = document.body.getAttribute("style");
  const compat = resolveCompatMode(
    readCompatChoice(skin),
    typeof document !== "undefined" && wallpaperEngineInstalled(document)
  );
  if (typeof document !== "undefined" && !compat) {
    publishSkinMarker(document, true);
    cleanups.push(() => {
      publishSkinMarker(document, false);
    });
  }
  const tokens = paintableTokens(skin.tokens, compat);
  if (Object.keys(tokens).length > 0) {
    const disposeTokens = theme.overrideTokens(PLUGIN_ID, tokens);
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
      for (const [name2, modes] of Object.entries(tokens)) sv(name2, modes);
    }
  }
  const rules = [];
  const embedTargets = skin.canvas.images.filter(
    (img) => imageModeOf(img) === "embed" && img.selector !== "" && img.url !== "" && hasIdentity(img)
  );
  const anchoredImages = skin.canvas.images.filter(
    (img) => imageModeOf(img) === "anchor" && img.url !== "" && hasIdentity(img)
  );
  for (const img of embedTargets) {
    const above = embedPaintsAbove(img, readImageLayer(skin, img.id));
    rules.push(embedHostRule(img.selector, above));
    rules.push(img.selector + embedAfterRule(img, above, readImageFeather(skin, img.id)));
  }
  if (embedTargets.length > 0 && typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    const taggedElements = /* @__PURE__ */ new Map();
    const taggedChains = /* @__PURE__ */ new Map();
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
      if (document.querySelector('[data-dsh-myskin-canvas="1"]') !== null) return;
      const curKey = currentSettingsPageKey(document);
      for (const img of embedTargets) {
        const scoped2 = !imagePageMatches(skin, img, curKey);
        if (scoped2) {
          for (const stale of document.querySelectorAll('[data-dsh-myskin-embed="' + img.id + '"]')) stale.removeAttribute("data-dsh-myskin-embed");
          taggedElements.delete(img.id);
          taggedChains.delete(img.id);
          continue;
        }
        const previous = taggedElements.get(img.id) ?? [];
        let targets = resolveImageTargets(img, document);
        if (targets.length === 0 && previous.length === 1 && previous[0].isConnected) targets = previous;
        if (targets.length === 0) {
          const chain = taggedChains.get(img.id);
          const recovered = chain === void 0 ? void 0 : findByChain(chain);
          if (recovered !== void 0) targets = [recovered];
        }
        for (const el of previous) if (!targets.includes(el)) el.removeAttribute("data-dsh-myskin-embed");
        if (targets.length === 0) continue;
        for (const el of targets) {
          if (el.getAttribute("data-dsh-myskin-embed") !== img.id) el.setAttribute("data-dsh-myskin-embed", img.id);
        }
        taggedElements.set(img.id, targets);
        if (targets.length === 1) taggedChains.set(img.id, chainOf(targets[0]));
        else taggedChains.delete(img.id);
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
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-current", "aria-expanded", "aria-selected", "class", "hidden"] });
    cleanups.push(() => {
      mo.disconnect();
      for (const img of embedTargets) {
        for (const node of taggedElements.get(img.id) ?? []) node.removeAttribute("data-dsh-myskin-embed");
        for (const node of document.querySelectorAll('[data-dsh-myskin-embed="' + img.id + '"]')) node.removeAttribute("data-dsh-myskin-embed");
      }
    });
  }
  if (anchoredImages.length > 0 && typeof document !== "undefined") {
    const overlay = mountImageOverlay(() => anchoredImages, document, (id) => readImageFeather(skin, id), (img, key) => imagePageMatches(skin, img, key));
    cleanups.push(overlay.dispose);
  }
  const wallpaperTaken = compat || typeof document !== "undefined" && wallpaperEngineOnStage(document);
  if (!wallpaperTaken && skin.canvas.background !== void 0 && skin.canvas.background !== "" && typeof document !== "undefined") {
    const opacity = readBackgroundOpacity(skin);
    rules.push(...wallpaperRules(document, skin.canvas.background, surfaceTint(document, opacity, desktopFrameTint(document)), readBackgroundAnchor(skin)));
    rules.push(...backgroundSurfaceRules(document, opacity, desktopFrameTint(document)));
  }
  for (const { selector, rule } of paintableRules(skin.css, compat)) {
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
  const layerList = (skin.layers ?? []).filter((l) => l.selector !== "" && (l.kind === "div" || l.url !== void 0 && l.url !== ""));
  if (layerList.length > 0 && typeof document !== "undefined") {
    const mount = mountInjectedLayers(() => layerList, document, () => currentSettingsPageKey(document));
    cleanups.push(mount.dispose);
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

// src/client/fonts.ts
var FONT_CANDIDATES = [
  // CJK
  "PingFang SC",
  "PingFang TC",
  "Hiragino Sans GB",
  "Microsoft YaHei",
  "Microsoft JhengHei",
  "SimHei",
  "SimSun",
  "NSimSun",
  "KaiTi",
  "FangSong",
  "Noto Sans CJK SC",
  "Noto Sans CJK TC",
  "Noto Sans CJK JP",
  "Noto Sans CJK KR",
  "Noto Serif CJK SC",
  "Source Han Sans SC",
  "Source Han Sans CN",
  "Source Han Serif SC",
  "WenQuanYi Micro Hei",
  "WenQuanYi Zen Hei",
  "WenQuanYi Bitmap Song",
  "AR PL UMing CN",
  "AR PL UKai CN",
  "Droid Sans Fallback",
  "Sarasa Gothic SC",
  "HarmonyOS Sans SC",
  // Sans
  "Arial",
  "Arial Black",
  "Helvetica",
  "Helvetica Neue",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Segoe UI",
  "Calibri",
  "Candara",
  "Corbel",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Inter",
  "Ubuntu",
  "Cantarell",
  "DejaVu Sans",
  "Liberation Sans",
  "Noto Sans",
  "FreeSans",
  "Source Sans Pro",
  "PT Sans",
  "Fira Sans",
  "IBM Plex Sans",
  "Nunito",
  "Poppins",
  // Serif
  "Times New Roman",
  "Times",
  "Georgia",
  "Cambria",
  "Garamond",
  "Palatino",
  "Book Antiqua",
  "DejaVu Serif",
  "Liberation Serif",
  "Noto Serif",
  "FreeSerif",
  "PT Serif",
  "Source Serif Pro",
  // Mono
  "Consolas",
  "Courier New",
  "Courier",
  "Menlo",
  "Monaco",
  "SF Mono",
  "Cascadia Code",
  "Cascadia Mono",
  "JetBrains Mono",
  "Fira Code",
  "Source Code Pro",
  "IBM Plex Mono",
  "DejaVu Sans Mono",
  "Liberation Mono",
  "Noto Sans Mono",
  "FreeMono",
  "Ubuntu Mono",
  "Roboto Mono",
  "Inconsolata",
  "Hack"
];
var PROBE_TEXT = "mmmmmmmmmmlliWW";
function localFontsSupported(win = window) {
  return typeof win.queryLocalFonts === "function";
}
function normalizeFamilies(names) {
  const seen = /* @__PURE__ */ new Map();
  for (const raw of names) {
    const name2 = raw.trim();
    if (name2 === "") continue;
    const key = name2.toLowerCase();
    if (!seen.has(key)) seen.set(key, name2);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, void 0, { numeric: true, sensitivity: "base" }));
}
function filterFamilies(families, query, limit = 300) {
  const needle = query.trim().toLowerCase();
  if (needle === "") return families.slice(0, limit);
  const terms = needle.split(/\s+/);
  return families.filter((family) => {
    const haystack = family.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  }).slice(0, limit);
}
function quoteFamily(family) {
  const name2 = family.trim();
  if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(name2)) return name2;
  return '"' + name2.replace(/"/g, "") + '"';
}
async function queryLocalFonts(win = window) {
  const api = win.queryLocalFonts;
  if (typeof api !== "function") return { ok: false, reason: "unsupported" };
  try {
    const records = await api.call(win);
    const families = normalizeFamilies(records.map((record) => record.family));
    if (families.length === 0) return { ok: false, reason: "failed" };
    return { ok: true, families };
  } catch (error) {
    const name2 = error instanceof Error ? error.name : "";
    return { ok: false, reason: name2 === "NotAllowedError" || name2 === "SecurityError" ? "denied" : "failed" };
  }
}
function isFamilyAvailable(doc, family) {
  const context = doc.createElement("canvas").getContext?.("2d");
  if (context === null || context === void 0) return false;
  const measure = (stack) => {
    context.font = "72px " + stack;
    return context.measureText(PROBE_TEXT).width;
  };
  const baseline = measure("monospace");
  const probe = measure('"' + family.replace(/"/g, "") + '", monospace');
  return probe !== baseline;
}
function detectFamilies(doc, candidates = FONT_CANDIDATES) {
  const found = candidates.filter((family) => {
    try {
      return isFamilyAvailable(doc, family);
    } catch {
      return false;
    }
  });
  return normalizeFamilies(found);
}
async function scanFonts(doc, win) {
  if (localFontsSupported(win)) {
    const result = await queryLocalFonts(win);
    if (result.ok) return { source: "local", families: result.families };
    return { source: "detected", families: detectFamilies(doc), denied: result.reason === "denied" };
  }
  return { source: "detected", families: detectFamilies(doc) };
}

// src/client/font-roles.ts
var FONT_ROLES = ["ui", "text", "code"];
var UI_FONT_PROPERTY = "--dsw-font-family";
var CODE_FONT_PROPERTY = "--ds-font-family-code";
var CODE_MARKDOWN_FONT_PROPERTY = "--dsw-font-markdown-code-font-family";
var ROOT_FONT_SELECTOR = ":root";
var TEXT_FONT_SELECTOR = [
  '[data-slot="conversation.session"]',
  '[data-slot^="conversation.view"]',
  '[class*="_markdown_"]',
  "[data-composer-input]",
  "[data-composer-placeholder]"
].join(", ");
var ROLE_TARGETS = {
  ui: { selector: ROOT_FONT_SELECTOR, properties: [UI_FONT_PROPERTY] },
  code: { selector: ROOT_FONT_SELECTOR, properties: [CODE_FONT_PROPERTY, CODE_MARKDOWN_FONT_PROPERTY] },
  text: { selector: TEXT_FONT_SELECTOR, properties: ["font-family"] }
};
function propertyOf(rule, property) {
  for (const part of (rule ?? "").split(";")) {
    const index = part.indexOf(":");
    if (index < 0) continue;
    if (part.slice(0, index).trim() !== property) continue;
    return part.slice(index + 1).replace(/\s*!important\s*$/i, "").trim();
  }
  return void 0;
}
function roleFont(css, role) {
  const target = ROLE_TARGETS[role];
  const rule = css.find((entry) => entry.selector === target.selector)?.rule;
  for (const property of target.properties) {
    const value = propertyOf(rule, property);
    if (value !== void 0 && value !== "") return value;
  }
  return "";
}
function withRoleFont(css, role, stack) {
  const target = ROLE_TARGETS[role];
  const value = stack.trim();
  const existing = css.find((entry) => entry.selector === target.selector);
  let rule = existing?.rule;
  for (const property of target.properties) {
    rule = value === "" ? withoutDeclaration(rule, property) : mergeDeclaration(rule, property + ": " + value);
  }
  const rest = css.filter((entry) => entry.selector !== target.selector);
  const merged = rule ?? "";
  if (merged === "") return rest;
  return [...rest, { selector: target.selector, rule: merged }];
}
function roleStackFor(family, role) {
  const fallback = role === "code" ? "monospace" : "system-ui, sans-serif";
  return family + ", " + fallback;
}

// src/client/groups.ts
var WORKSPACE_ROW_SELECTOR = '[role="treeitem"][aria-expanded]';
var SESSION_ROW_SELECTOR = '[role="treeitem"]:not([aria-expanded])';
var TREE_SELECTOR = '[role="tree"]';
var KIND_KEYS = {
  workspace: "groupWorkspace",
  session: "groupSession",
  tree: "groupTree",
  peers: "groupPeers",
  site: "scopeSite"
};
function groupLabelKey(kind) {
  return KIND_KEYS[kind];
}
var MODULE_CLASS = /^_[A-Za-z][\w-]*_[a-z0-9]{4,}(_\d+)?$/;
var MODULE_CLASS_HASHED = /^[A-Za-z0-9]{4,}_[A-Za-z][\w-]*$|^[A-Za-z0-9]{2,}_[A-Za-z0-9]{2,}_[A-Za-z][\w-]*$/;
var STATE_CLASS = /^(is|has)[-_]|^(active|selected|disabled|open|closed|hover|focus|hidden|expanded|collapsed|current|dragging|loading|pressed)$/i;
function stableClasses(el) {
  const all = Array.from(el.classList);
  const moduleish = all.filter((name2) => (MODULE_CLASS.test(name2) || MODULE_CLASS_HASHED.test(name2)) && !STATE_CLASS.test(name2));
  if (moduleish.length > 0) return moduleish.slice(0, 3);
  return all.filter((name2) => !STATE_CLASS.test(name2)).slice(0, 3);
}
function classSelectorFor(el) {
  const classes = stableClasses(el);
  if (classes.length === 0) return void 0;
  return el.tagName.toLowerCase() + classes.map((name2) => "." + name2).join("");
}
function stableAttribute(el) {
  for (const name2 of ["aria-label", "title"]) {
    const value = el.getAttribute(name2);
    if (value === null) continue;
    const trimmed = value.trim();
    if (trimmed === "" || trimmed.length > 60) continue;
    return name2 + '="' + trimmed.replace(/"/g, "") + '"';
  }
  return void 0;
}
function countOf(doc, selector) {
  try {
    return doc.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
}
function allOf2(doc, selector) {
  try {
    return Array.from(doc.querySelectorAll(selector));
  } catch {
    return [];
  }
}
function relativePath(from, to) {
  const steps = [];
  let node = to;
  while (node !== null && node !== from) {
    steps.unshift("> " + (classSelectorFor(node) ?? node.tagName.toLowerCase()));
    node = node.parentElement;
  }
  if (node !== from) return void 0;
  return steps.join(" ");
}
function sharedParentSelector(matches) {
  const seen = /* @__PURE__ */ new Set();
  for (const match of matches) {
    const parent = match.parentElement;
    const selector = parent === null ? void 0 : classSelectorFor(parent);
    if (selector === void 0) return void 0;
    seen.add(selector);
  }
  return seen.size === 1 ? [...seen][0] : void 0;
}
function treeAnchorFor(el) {
  const row = el.closest('[role="treeitem"]');
  if (row !== null) {
    const workspace = row.hasAttribute("aria-expanded");
    return { selector: workspace ? WORKSPACE_ROW_SELECTOR : SESSION_ROW_SELECTOR, kind: workspace ? "workspace" : "session", element: row };
  }
  const tree = el.closest(TREE_SELECTOR);
  if (tree !== null) return { selector: TREE_SELECTOR, kind: "tree", element: tree };
  return void 0;
}
function moveRuleToBlock(css, selector, blockSelector) {
  const own = css.find((entry) => entry.selector === selector)?.rule ?? "";
  if (own.trim() === "" || selector === blockSelector) return [...css];
  const block = css.find((entry) => entry.selector === blockSelector)?.rule;
  const rest = css.filter((entry) => entry.selector !== selector && entry.selector !== blockSelector);
  return [...rest, { selector: blockSelector, rule: mergeDeclaration(block, own) }];
}
function gapSelectorFor(group, doc) {
  const adjacent = group.selector + " + " + group.selector;
  return countOf(doc, adjacent) > 0 ? adjacent : void 0;
}
function withGapRule(css, selector, value) {
  const property = "margin-top";
  const existing = css.find((entry) => entry.selector === selector)?.rule;
  const rule = value.trim() === "" ? withoutDeclaration(existing, property) : mergeDeclaration(existing, property + ": " + value.trim() + " !important");
  const rest = css.filter((entry) => entry.selector !== selector);
  return rule === "" ? rest : [...rest, { selector, rule }];
}
function gapOf(css, selector) {
  const rule = css.find((entry) => entry.selector === selector)?.rule ?? "";
  const match = /(?:^|;)\s*margin-top\s*:\s*([^;!]+)/.exec(rule);
  return match === null ? "" : match[1].trim();
}
function gapLength(raw) {
  const value = raw.trim();
  if (value === "") return "";
  return /[a-z%]$/i.test(value) ? value : value + "px";
}
function elementGroupFor(el, doc = el.ownerDocument) {
  const anchor = treeAnchorFor(el);
  if (anchor !== void 0 && el === anchor.element) {
    return { selector: anchor.selector, count: countOf(doc, anchor.selector), kind: anchor.kind };
  }
  if (anchor !== void 0) {
    const path = relativePath(anchor.element, el);
    if (path === void 0) return void 0;
    const attribute2 = stableAttribute(el);
    if (attribute2 !== void 0) {
      const withAttribute = anchor.selector + " " + path + "[" + attribute2 + "]";
      const count = countOf(doc, withAttribute);
      if (count > 1) return { selector: withAttribute, count, kind: anchor.kind };
    }
    const selector = anchor.selector + " " + path;
    return { selector, count: countOf(doc, selector), kind: anchor.kind };
  }
  const own = classSelectorFor(el);
  if (own === void 0) return void 0;
  const attribute = stableAttribute(el);
  const identities = attribute === void 0 ? [own] : [own + "[" + attribute + "]", own];
  for (const identity of identities) {
    const matches = allOf2(doc, identity);
    if (matches.length < 2 || !matches.includes(el)) continue;
    const parentSelector = sharedParentSelector(matches);
    if (parentSelector === void 0) continue;
    const selector = parentSelector + " " + identity;
    const count = countOf(doc, selector);
    if (count > 1) return { selector, count, kind: "peers" };
  }
  return void 0;
}

// src/client/site-scope.ts
var SITE_SCOPE_MAX = 64;
var PER_INSTANCE_DATA = /^data-(index|idx|key|id|state|active|selected|open|order|pos|position|count)$/i;
function dataAtom(el) {
  for (const attribute of Array.from(el.attributes)) {
    const name2 = attribute.name;
    if (!name2.startsWith("data-") || name2.startsWith("data-dsh-myskin-")) continue;
    if (PER_INSTANCE_DATA.test(name2)) continue;
    const value = attribute.value.trim();
    if (value === "" || value.length > 60) continue;
    return name2 + '="' + value.replace(/"/g, "") + '"';
  }
  return void 0;
}
function roleAtom(el) {
  const role = el.getAttribute("role");
  const trimmed = role === null ? "" : role.trim();
  return trimmed === "" ? void 0 : trimmed;
}
function matchesOf(doc, selector) {
  try {
    return Array.from(doc.querySelectorAll(selector));
  } catch {
    return [];
  }
}
function siteCandidates(el, doc = el.ownerDocument) {
  const tag = el.tagName.toLowerCase();
  const classes = stableClasses(el).map((name2) => "." + name2).join("");
  const data = dataAtom(el);
  const role = roleAtom(el);
  const sharedData = data !== void 0 && matchesOf(doc, "[" + data + "]").length > 1 ? data : void 0;
  const out = [];
  if (classes !== "") {
    if (sharedData !== void 0) out.push(tag + classes + "[" + sharedData + "]");
    if (role !== void 0) out.push(tag + classes + '[role="' + role + '"]');
    out.push(tag + classes);
  }
  if (data !== void 0) {
    out.push(tag + "[" + data + "]");
    out.push("[" + data + "]");
  }
  if (classes === "" && role !== void 0) {
    out.push(tag + '[role="' + role + '"]');
    out.push('[role="' + role + '"]');
  }
  return out;
}
function siteScopeFor(el, doc = el.ownerDocument) {
  const tag = el.tagName.toLowerCase();
  if (tag === "html" || tag === "body") return { ok: false, reason: "no-identity", count: 0 };
  let smallest = Number.POSITIVE_INFINITY;
  for (const selector of siteCandidates(el, doc)) {
    const matches = matchesOf(doc, selector);
    if (!matches.includes(el)) continue;
    if (matches.length <= SITE_SCOPE_MAX) {
      return { ok: true, scope: { selector, count: matches.length, kind: "site" } };
    }
    smallest = Math.min(smallest, matches.length);
  }
  return smallest === Number.POSITIVE_INFINITY ? { ok: false, reason: "no-identity", count: 0 } : { ok: false, reason: "too-generic", count: smallest };
}

// src/client/stacking.ts
var MAX_STACKING_NEIGHBOURS = 6;
function stackingContextReason(style) {
  const read = (name2) => typeof style[name2] === "string" ? String(style[name2]) : "";
  const position = read("position");
  const zIndex = read("zIndex");
  if (position !== "" && position !== "static" && zIndex !== "" && zIndex !== "auto") return "z-index: " + zIndex;
  if (position === "fixed" || position === "sticky") return "position: " + position;
  const opacity = read("opacity");
  if (opacity !== "" && Number(opacity) < 1) return "opacity: " + opacity;
  if (read("transform") !== "" && read("transform") !== "none") return "transform";
  if (read("filter") !== "" && read("filter") !== "none") return "filter";
  if (read("perspective") !== "" && read("perspective") !== "none") return "perspective";
  if (read("isolation") === "isolate") return "isolation: isolate";
  const blend = read("mixBlendMode");
  if (blend !== "" && blend !== "normal") return "mix-blend-mode: " + blend;
  const backdrop = read("backdropFilter");
  if (backdrop !== "" && backdrop !== "none") return "backdrop-filter";
  return void 0;
}
function nearestStackingContext(el, style) {
  const view = el.ownerDocument.defaultView;
  const read = style ?? ((node2) => view === null ? {} : view.getComputedStyle(node2));
  let node = el.parentElement;
  while (node !== null) {
    const reason = stackingContextReason(read(node));
    if (reason !== void 0) return { el: node, reason };
    node = node.parentElement;
  }
  return void 0;
}
function zIndexOf(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
function overlaps(a, b) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}
function stackingReport(el, isOwn = () => false, label = () => "") {
  const view = el.ownerDocument.defaultView;
  const style = (node) => view === null ? {} : view.getComputedStyle(node);
  const own = style(el);
  const box = el.getBoundingClientRect();
  const candidates = [];
  const parent = el.parentElement;
  if (parent !== null) {
    for (const child of Array.from(parent.children)) if (child !== el) candidates.push(child);
    const grand = parent.parentElement;
    if (grand !== null) {
      for (const child of Array.from(grand.children)) if (child !== parent) candidates.push(child);
    }
  }
  const neighbours = [];
  for (const candidate of candidates) {
    if (neighbours.length >= MAX_STACKING_NEIGHBOURS) break;
    if (isOwn(candidate) || candidate.contains(el) || el.contains(candidate)) continue;
    const box2 = candidate.getBoundingClientRect();
    if (box2.width === 0 || box2.height === 0) continue;
    if (!overlaps(box, box2)) continue;
    const computed = style(candidate);
    neighbours.push({ el: candidate, zIndex: computed.zIndex === "" ? "auto" : computed.zIndex, label: label(candidate) });
  }
  const values = neighbours.map((neighbour) => zIndexOf(neighbour.zIndex));
  const context = nearestStackingContext(el, style);
  return {
    zIndex: own.zIndex === "" ? "auto" : own.zIndex,
    position: own.position === "" ? "static" : own.position,
    context: context?.el,
    contextReason: context?.reason,
    neighbours,
    above: Math.max(0, ...values) + 1,
    below: Math.min(0, ...values) - 1
  };
}

// src/client/views.ts
var SETTINGS_SURFACE_ATTRIBUTE = "data-shortcut-modal";
var MAIN_SLOT_SELECTOR = '[data-slot="main"]';
var INFRASTRUCTURE_ATTRIBUTES = /* @__PURE__ */ new Set(["data-slot", "data-window-drag", "data-dragging"]);
var MARKER_DEPTH = 5;
function settingsSurface(label) {
  const marker = "[" + SETTINGS_SURFACE_ATTRIBUTE + "]";
  return { id: "settings:" + marker, label, marker, overlay: true };
}
function settingsOpen(doc) {
  return doc.querySelector("[" + SETTINGS_SURFACE_ATTRIBUTE + "]") !== null;
}
function surfaceMarkers(el) {
  const out = [];
  const slot = el.getAttribute("data-slot");
  if (slot !== null && slot !== "main" && slot.trim() !== "") out.push('[data-slot="' + slot + '"]');
  for (const attribute of Array.from(el.attributes)) {
    const name2 = attribute.name;
    if (!name2.startsWith("data-")) continue;
    if (name2.startsWith("data-dsh-myskin-")) continue;
    if (INFRASTRUCTURE_ATTRIBUTES.has(name2)) continue;
    out.push("[" + name2 + "]");
  }
  return out;
}
function currentPageSurface(doc, label) {
  const main = doc.querySelector(MAIN_SLOT_SELECTOR);
  if (main === null) return void 0;
  let node = Array.from(main.children).find((child) => child.getClientRects().length > 0) ?? main.firstElementChild;
  const root = node;
  for (let depth = 0; node !== null && depth < MARKER_DEPTH; depth += 1) {
    for (const marker of surfaceMarkers(node)) {
      if (doc.querySelectorAll(marker).length === 0) continue;
      const anchored = MAIN_SLOT_SELECTOR + " " + marker;
      return { id: "page:" + anchored, label: label(root ?? node), marker: anchored, overlay: false };
    }
    node = node.firstElementChild;
  }
  return void 0;
}
function surfaceRuleSelector(surface, identity) {
  return "body:has(" + surface.marker + ") " + identity;
}
function hiddenInSurface(css, surface, identity) {
  const selector = surfaceRuleSelector(surface, identity);
  return isRemovedRule(css.find((entry) => entry.selector === selector)?.rule);
}
function withSurfaceHidden(css, surface, identity, hidden) {
  return rewrite(css, surfaceRuleSelector(surface, identity), hidden);
}
function hiddenRulesFor(css, identity) {
  if (identity === "") return [];
  return css.filter((entry) => isRemovedRule(entry.rule) && (entry.selector === identity || entry.selector.endsWith(" " + identity)));
}
function withAllHiddenRestored(css, identity) {
  let out = [...css];
  for (const entry of hiddenRulesFor(css, identity)) out = rewrite(out, entry.selector, false);
  return out;
}
function rewrite(css, selector, hidden) {
  const existing = css.find((entry) => entry.selector === selector)?.rule;
  const rule = hidden ? mergeDeclaration(existing, REMOVE_DECLARATION) : withoutDeclaration(existing, "display");
  const rest = css.filter((entry) => entry.selector !== selector);
  return rule === "" ? rest : [...rest, { selector, rule }];
}
function onlySurfaceRuleSelector(surface, identity) {
  return "body:not(:has(" + surface.marker + ")) " + identity;
}
function hiddenWhile(css, surface, identity, surfaces2) {
  const has = (selector) => isRemovedRule(css.find((entry) => entry.selector === selector)?.rule);
  if (has(surfaceRuleSelector(surface, identity))) return true;
  if (has(identity)) return true;
  return surfaces2.some((other) => other.id !== surface.id && has(onlySurfaceRuleSelector(other, identity)));
}
function withVisibleWhile(css, surface, identity, surfaces2) {
  let out = rewrite(css, surfaceRuleSelector(surface, identity), false);
  out = rewrite(out, identity, false);
  for (const other of surfaces2) {
    if (other.id === surface.id) continue;
    out = rewrite(out, onlySurfaceRuleSelector(other, identity), false);
  }
  return out;
}
function withOnlySurface(css, surface, identity, surfaces2 = []) {
  const cleared = withAllHiddenRestored(css, identity);
  const inverted = { selector: onlySurfaceRuleSelector(surface, identity), rule: REMOVE_DECLARATION };
  const overlays = surfaces2.filter((other) => other.id !== surface.id && other.overlay).map((other) => ({ selector: surfaceRuleSelector(other, identity), rule: REMOVE_DECLARATION }));
  return [...cleared, ...overlays, inverted];
}
function withHiddenEverywhere(css, identity) {
  return [...withAllHiddenRestored(css, identity), { selector: identity, rule: REMOVE_DECLARATION }];
}
var SURFACES_STORAGE_KEY = "dsh-myskin.surfaces";
var MAX_REMEMBERED_SURFACES = 8;
function readRememberedSurfaces(storage) {
  try {
    const raw = storage?.getItem(SURFACES_STORAGE_KEY);
    if (raw === null || raw === void 0 || raw === "") return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const candidate = entry;
      if (typeof candidate.id !== "string" || typeof candidate.label !== "string" || typeof candidate.marker !== "string") continue;
      if (!candidate.marker.startsWith("[data-") || candidate.marker.length > 200) continue;
      if (candidate.label.length > 80 || out.some((surface) => surface.id === candidate.id)) continue;
      out.push({ id: candidate.id, label: candidate.label, marker: candidate.marker, overlay: false });
      if (out.length >= MAX_REMEMBERED_SURFACES) break;
    }
    return out;
  } catch {
    return [];
  }
}
function rememberSurface(storage, surfaces2, surface) {
  const remembered = { id: surface.id, label: surface.label, marker: surface.marker, overlay: false };
  const next = [remembered, ...surfaces2.filter((entry) => entry.id !== surface.id)].slice(0, MAX_REMEMBERED_SURFACES);
  try {
    storage?.setItem(SURFACES_STORAGE_KEY, JSON.stringify(next));
  } catch {
  }
  return next;
}

// src/client/save-report.ts
function diagnoseCanvas(canvas) {
  let json = "";
  try {
    json = JSON.stringify(canvas);
  } catch {
    json = "";
  }
  const images = Array.isArray(canvas.images) ? canvas.images : [];
  return {
    // UTF-16 length is close enough for a "this is large" hint and never fails.
    bytes: json.length,
    images: images.length,
    groupAnchors: images.filter((img) => img.anchor?.kind === "group").length
  };
}
var CANVAS_LARGE_BYTES = 512 * 1024;
function canvasLooksOversized(diagnosis) {
  return diagnosis.bytes >= CANVAS_LARGE_BYTES;
}

// src/client/canvas-ui.ts
var CANVAS_UI_STYLE_ID = "dsh-myskin-canvas-ui";
var CANVAS_UI_ATTR = "data-dsh-myskin-draw";
function canvasUiRules() {
  return [
    "@keyframes dsh-myskin-drop { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }",
    "@keyframes dsh-myskin-slide { from { opacity: 0; transform: translateX(14px) } to { opacity: 1; transform: translateX(0) } }",
    "@keyframes dsh-myskin-slide-left { from { opacity: 0; transform: translateX(-14px) } to { opacity: 1; transform: translateX(0) } }",
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
    // Docked left, the panel mirrors: it enters from its own edge, its shadow falls the other way
    // and folding it away slides it toward that edge. Gated on the same <html> attribute the frame
    // rules use (dock.ts), so there is one answer to "which side is it on" for the whole editor.
    "html[" + DOCK_ATTRIBUTE + '="left"] [data-dsh-myskin-canvas] .dsh-myskin-panel { animation-name: dsh-myskin-slide-left; box-shadow: 12px 0 28px -24px rgba(0, 0, 0, .65) }',
    "html[" + DOCK_ATTRIBUTE + '="left"] [data-dsh-myskin-canvas] .dsh-myskin-panel[data-open="0"] { transform: translateX(-16px) }',
    // `flex: none`: a card is a block of content, not a rubber band. Without it a tall card in
    // the height-constrained panel is squeezed (its own `overflow` drops its automatic minimum
    // size to 0) instead of letting the panel scroll.
    "[data-dsh-myskin-canvas] .dsh-myskin-card { flex: none; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; transition: background-color 140ms ease, border-color 140ms ease }",
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
    // Font list rows: each name is drawn in its own family (the list doubles as the
    // preview). Static metrics only — this sheet never animates layout.
    //
    // `flex: none` + `min-height` are LOAD-BEARING, not cosmetics. A flex item with
    // `overflow: hidden` has an automatic minimum size of ZERO, so a 224-family list inside a
    // height-constrained column shrinks every row to its padding floor — and `overflow: hidden`
    // then clips the 20px line box away entirely. The result: rows that scroll but render not
    // one readable name (and, before `box-sizing`, a stray horizontal scrollbar from
    // `width: 100%` + padding + border).
    "[data-dsh-myskin-canvas] .dsh-myskin-fontpick { display: block; box-sizing: border-box; flex: none; width: 100%; min-height: 26px; text-align: left; padding: 3px 7px; border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 20px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: background-color 120ms ease, border-color 120ms ease }",
    "[data-dsh-myskin-canvas] .dsh-myskin-fontpick:hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2) }",
    '[data-dsh-myskin-canvas] .dsh-myskin-fontpick[data-active="1"] { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-brand-primary) }',
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

// src/client/panel-tabs.ts
var PANEL_TABS = ["variant", "component", "image", "text", "markdown", "region", "look"];
var PANEL_TAB_LABEL = {
  variant: "tabVariant",
  component: "tabComponent",
  image: "tabImage",
  text: "tabText",
  markdown: "tabMarkdown",
  region: "tabRegion",
  look: "tabLook"
};
var PANEL_TAB_STORAGE_KEY = "dsh-myskin.panel";
function isPanelTab(value) {
  return value !== null && value !== void 0 && PANEL_TABS.includes(value);
}
function readPanelTab(storage) {
  if (storage === void 0) return PANEL_TABS[0];
  try {
    const raw = storage.getItem(PANEL_TAB_STORAGE_KEY);
    return isPanelTab(raw) ? raw : PANEL_TABS[0];
  } catch {
    return PANEL_TABS[0];
  }
}
function writePanelTab(storage, tab) {
  if (storage === void 0) return;
  try {
    storage.setItem(PANEL_TAB_STORAGE_KEY, tab);
  } catch {
  }
}

// src/client/occlusion.ts
var SAMPLE_COLUMNS = 2;
var SAMPLE_ROWS = 4;
var SAMPLE_MARGIN = 10;
function occludingElement(stack, isOwn) {
  return stack.find((el) => !isOwn(el));
}
function sameElements(a, b) {
  return a.length === b.length && a.every((el, index) => el === b[index]);
}
function panelSamplePoints(rect, grid = {}) {
  const columns = Math.max(1, Math.round(grid.columns ?? SAMPLE_COLUMNS));
  const rows = Math.max(1, Math.round(grid.rows ?? SAMPLE_ROWS));
  const margin = grid.margin ?? SAMPLE_MARGIN;
  if (rect.width <= margin * 2 || rect.height <= margin * 2) return [];
  const left = rect.left + margin;
  const right = rect.left + rect.width - margin;
  const top = rect.top + margin;
  const bottom = rect.top + rect.height - margin;
  const points = [];
  for (let column = 0; column < columns; column += 1) {
    const x = columns === 1 ? (left + right) / 2 : left + (right - left) * column / (columns - 1);
    for (let row = 0; row < rows; row += 1) {
      const y = rows === 1 ? (top + bottom) / 2 : top + (bottom - top) * row / (rows - 1);
      points.push({ x: Math.round(x), y: Math.round(y) });
    }
  }
  return points;
}
function occludedBehindPanel(rect, doc, isOwn, grid = {}) {
  const points = panelSamplePoints(rect, grid);
  if (points.length === 0) return [];
  const from = doc.elementsFromPoint;
  if (typeof from !== "function") return [];
  const seen = /* @__PURE__ */ new Set();
  const found = [];
  for (const point of points) {
    let hit;
    try {
      hit = occludingElement(Array.from(from.call(doc, point.x, point.y)), isOwn);
    } catch {
      hit = void 0;
    }
    if (hit !== void 0 && !seen.has(hit)) {
      seen.add(hit);
      found.push(hit);
    }
  }
  return found;
}

// src/client/dshframework.ts
var FRAMEWORK_FORMAT = "dshframework";
var LEGACY_FORMAT = "dshskin";
var FRAMEWORK_EXTENSION = ".dshframework";
var IMPORT_ACCEPT = ".dshframework,.dshskin,.zip,application/json,.json";
var FRAMEWORK_VERSION = 1;
var ASSET_REF_PREFIX = "dshframework:";
var LEGACY_ASSET_REF_PREFIX = "dshskin:";
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
function replacePrefix(value, prefix, urlFor) {
  if (!value.includes(prefix)) return value;
  let out = "";
  let rest = value;
  for (; ; ) {
    const at = rest.indexOf(prefix);
    if (at < 0) return out + rest;
    out += rest.slice(0, at);
    const after = rest.slice(at + prefix.length);
    const end = after.search(/[\s'")]/);
    const path = end < 0 ? after : after.slice(0, end);
    out += urlFor(path);
    if (end < 0) return out;
    rest = after.slice(end);
  }
}
function replaceAssetRefs(value, urlFor) {
  return replacePrefix(replacePrefix(value, ASSET_REF_PREFIX, urlFor), LEGACY_ASSET_REF_PREFIX, urlFor);
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
    format: FRAMEWORK_FORMAT,
    formatVersion: FRAMEWORK_VERSION,
    generator: options.generator,
    name: options.name,
    createdAt: options.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    assets: payloads.map((payload) => ({ path: payload.path, kind: kindForMime(payload.mime), mime: payload.mime, bytes: payload.bytes.length })),
    stats: skinStats(skin),
    skin: packed
  };
  const readme = [
    "dshframework \u2014 DSH \u76AE\u80A4\u5305 / DSH skin package",
    "",
    "\u8FD9\u662F\u4E00\u4E2A ZIP \u5BB9\u5668\uFF08\u672C\u5305\u7528 STORE \u672A\u538B\u7F29\u5199\u5165\uFF0C\u4EFB\u4F55\u89E3\u538B\u5DE5\u5177\u90FD\u80FD\u6253\u5F00\uFF09\uFF1A",
    "  manifest.json  \u76AE\u80A4\u6587\u6863\uFF08\u56FE\u7247/\u5B57\u4F53\u7B49\u5DF2\u62BD\u6210 assets/ \u4E0B\u7684\u5F15\u7528\uFF09",
    "  assets/*       \u771F\u5B9E\u5B57\u8282\u7684\u8D44\u6E90\u6587\u4EF6\uFF0C\u53EF\u76F4\u63A5\u66FF\u6362\u6210\u81EA\u5DF1\u7684\u56FE/\u5B57\u4F53",
    "  README.txt     \u672C\u8BF4\u660E",
    "",
    "\u91CD\u65B0\u6253\u5305\u540E\u4ECD\u53EF\u5BFC\u5165\uFF1Amanifest.json \u91CC\u7684\u5F15\u7528\u5F62\u5982 dshframework:assets/image-1.webp\uFF0C",
    "\uFF08\u65E7\u7248 .dshskin \u5305\u91CC\u7684 dshskin: \u5F15\u7528\u540C\u6837\u80FD\u5BFC\u5165\uFF0C\u4E24\u79CD\u5199\u6CD5\u90FD\u8BA4\u3002\uFF09",
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
        format: LEGACY_FORMAT,
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
  if (manifest.format !== FRAMEWORK_FORMAT && manifest.format !== LEGACY_FORMAT) {
    throw new Error("not a " + FRAMEWORK_FORMAT + " package");
  }
  if (typeof manifest.formatVersion !== "number" || manifest.formatVersion > FRAMEWORK_VERSION) {
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

// src/client/gif.ts
var GIF87 = "GIF87a";
var GIF89 = "GIF89a";
var EXTENSION = 33;
var IMAGE_DESCRIPTOR = 44;
var TRAILER = 59;
var APPLICATION_EXTENSION = 255;
function isGif(bytes) {
  if (bytes.length < 13) return false;
  const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
  return header === GIF87 || header === GIF89;
}
function isAnimatedGif(bytes) {
  if (!isGif(bytes)) return false;
  const flags = bytes[10];
  let at = 13;
  if ((flags & 128) !== 0) at += 3 * 2 ** ((flags & 7) + 1);
  let frames = 0;
  let looped = false;
  const skipSubBlocks = () => {
    while (at < bytes.length) {
      const size = bytes[at];
      at += 1;
      if (size === 0) return true;
      at += size;
    }
    return false;
  };
  while (at < bytes.length) {
    const introducer = bytes[at];
    if (introducer === TRAILER) break;
    if (introducer === EXTENSION) {
      const label = bytes[at + 1];
      at += 2;
      if (label === APPLICATION_EXTENSION && bytes[at] === 11) {
        const id = String.fromCharCode(...bytes.slice(at + 1, at + 12));
        if (id === "NETSCAPE2.0" || id === "ANIMEXTS1.0") looped = true;
      }
      if (!skipSubBlocks()) break;
      continue;
    }
    if (introducer === IMAGE_DESCRIPTOR) {
      frames += 1;
      if (at + 10 > bytes.length) break;
      const local = bytes[at + 9];
      at += 10;
      if ((local & 128) !== 0) at += 3 * 2 ** ((local & 7) + 1);
      at += 1;
      if (!skipSubBlocks()) break;
      continue;
    }
    break;
  }
  return frames > 1 || looped;
}

// src/client/image-diag.ts
function coveringDescendant(doc, x, y, host) {
  if (typeof doc.elementsFromPoint !== "function") return void 0;
  const stack = typeof doc.elementsFromPoint === "function" ? Array.from(doc.elementsFromPoint(x, y)) : [];
  for (const el of stack) {
    if (el === host) return void 0;
    if (host.contains(el)) return el;
  }
  return void 0;
}
function diagnoseEmbeddedImage(img, doc, above, samples = 3, feather = 0, pageScope = false) {
  const host = resolveImageTargets(img, doc)[0];
  if (host === void 0) return { verdict: "unresolved", feather };
  const box = { x: img.x, y: img.y, w: img.w, h: img.h };
  const pageKey = img.pageKey ?? "";
  if (pageScope && pageKey !== "" && !sameSettingsPage(pageKey, currentSettingsPageKey(doc))) return { verdict: "page-scope", host, box, feather };
  const rect = host.getBoundingClientRect();
  const hostSize = { w: rect.width, h: rect.height };
  if (rect.width <= 0 || rect.height <= 0) return { verdict: "ok", host, box, hostSize, feather };
  if (!above) {
    const left = Math.max(0, box.x - feather);
    const top = Math.max(0, box.y - feather);
    const right = Math.min(rect.width, box.x + box.w + feather);
    const bottom = Math.min(rect.height, box.y + box.h + feather);
    if (right > left && bottom > top) {
      for (let column = 1; column <= samples; column += 1) {
        for (let row = 1; row <= samples; row += 1) {
          const x = rect.left + left + (right - left) * column / (samples + 1);
          const y = rect.top + top + (bottom - top) * row / (samples + 1);
          const cover = coveringDescendant(doc, x, y, host);
          if (cover !== void 0) return { verdict: "covered", host, cover, box, hostSize, feather };
        }
      }
    }
  }
  const clipped = box.x - feather < 0 || box.y - feather < 0 || box.x + box.w + feather > rect.width + 0.5 || box.y + box.h + feather > rect.height + 0.5;
  if (clipped) return { verdict: "clipped", host, box, hostSize, feather };
  return { verdict: "ok", host, box, hostSize, feather };
}

// src/client/regions.ts
var REGIONS = [
  {
    id: "conversation",
    labelKey: "regionConversation",
    hintKey: "regionConversationHint",
    selectors: ['[class*="_centerCol"]', '[class~="centerCol"]']
  },
  {
    id: "sidebar",
    labelKey: "regionSidebar",
    hintKey: "regionSidebarHint",
    selectors: ['[class*="_sidebarCol"]', '[class~="sidebarCol"]']
  },
  {
    /*
     * DSH's own right sidebar (document preview / files / browser / terminal / plugin panes).
     *
     * Three anchors, because the column is not one element:
     *   · `[data-sidebar-right-panel][data-sidebar-right-open]` — the panel itself: the card the
     *     user sees, and still the card in the "开始" guide state where NO pane is mounted yet.
     *     The `[data-sidebar-right-open]` half is not decoration: that container STAYS MOUNTED with
     *     its full width while the panel is closed (only its children are hidden), so painting the
     *     bare attribute would leave a plate behind a closed sidebar. The wallpaper plugin documents
     *     the same trap in its own stylesheet and guards it the same way.
     *   · `[data-dockkit-pane]` / `[data-dockkit-float]` — a docked pane (which paints its own
     *     opaque `--dsw-alias-bg-base`) and a pane dragged out of the dock. They need the SAME
     *     radius as the panel, or a square child paints over the panel's rounded corner.
     *
     * All three are published `data-*` hooks (no CSS-module hash to rot), and `data-dockkit-*`
     * belongs to that one package — checked against the install.
     */
    id: "rightSidebar",
    labelKey: "regionRightSidebar",
    hintKey: "regionRightSidebarHint",
    selectors: ["[data-sidebar-right-panel][data-sidebar-right-open]", "[data-dockkit-pane]", "[data-dockkit-float]"]
  },
  {
    // The composer publishes `data-composer-*` hooks (card = the whole input surface, seat = where it
    // sits), so this needs no CSS-module hash at all.
    id: "composer",
    labelKey: "regionComposer",
    hintKey: "regionComposerHint",
    selectors: ["[data-composer-card]", "[data-composer-seat]"]
  },
  {
    id: "settings",
    labelKey: "regionSettings",
    hintKey: "regionSettingsHint",
    selectors: ["[data-shortcut-modal]"]
  },
  {
    id: "messages",
    labelKey: "regionMessages",
    hintKey: "regionMessagesHint",
    selectors: ["[data-conversation-content]"]
  }
];
var REGION_SHADOWS = [
  { value: "", labelKey: "regionShadowNone" },
  { value: "0 1px 2px rgba(0, 0, 0, 0.06), 0 8px 24px -18px rgba(0, 0, 0, 0.35)", labelKey: "regionShadowSoft" },
  { value: "0 2px 6px rgba(0, 0, 0, 0.08), 0 18px 48px -24px rgba(0, 0, 0, 0.45)", labelKey: "regionShadowMedium" },
  { value: "0 4px 12px rgba(0, 0, 0, 0.12), 0 32px 64px -28px rgba(0, 0, 0, 0.55)", labelKey: "regionShadowStrong" }
];
var REGION_RADII = [
  { value: "", labelKey: "regionRadiusDefault" },
  { value: "8px", labelKey: "regionRadiusS" },
  { value: "14px", labelKey: "regionRadiusM" },
  { value: "20px", labelKey: "regionRadiusL" },
  { value: "28px", labelKey: "regionRadiusXL" }
];
var REGION_FIELDS = [
  { id: "bg", labelKey: "regionBg", property: "background-color", kind: "color" },
  { id: "radius", labelKey: "regionRadius", property: "border-radius", kind: "option", options: REGION_RADII },
  // 四角单独定义。留空＝跟随上面那个统一值；一旦单独填了，统一值仍然保留并继续管其余三角。
  { id: "radiusTL", labelKey: "regionRadiusTL", property: "border-top-left-radius", kind: "px", unit: "px", step: 1, min: 0, max: 200, refines: "border-radius" },
  { id: "radiusTR", labelKey: "regionRadiusTR", property: "border-top-right-radius", kind: "px", unit: "px", step: 1, min: 0, max: 200, refines: "border-radius" },
  { id: "radiusBR", labelKey: "regionRadiusBR", property: "border-bottom-right-radius", kind: "px", unit: "px", step: 1, min: 0, max: 200, refines: "border-radius" },
  { id: "radiusBL", labelKey: "regionRadiusBL", property: "border-bottom-left-radius", kind: "px", unit: "px", step: 1, min: 0, max: 200, refines: "border-radius" },
  { id: "shadow", labelKey: "regionShadow", property: "box-shadow", kind: "option", options: REGION_SHADOWS },
  { id: "blur", labelKey: "regionBlur", property: "backdrop-filter", kind: "px", unit: "px", step: 1, min: 0, max: 40, template: "blur({value})" },
  { id: "borderColor", labelKey: "regionBorderColor", property: "border-color", kind: "color" },
  { id: "borderWidth", labelKey: "regionBorderWidth", property: "border-width", kind: "px", unit: "px", step: 1, min: 0, max: 8 },
  { id: "borderStyle", labelKey: "regionBorderStyle", property: "border-style", kind: "toggle", onValue: "solid", offValue: "none" },
  { id: "pad", labelKey: "regionPad", property: "padding", kind: "px", unit: "px", step: 2, min: 0, max: 64 },
  { id: "gap", labelKey: "regionGap", property: "gap", kind: "px", unit: "px", step: 2, min: 0, max: 48 },
  { id: "opacity", labelKey: "regionOpacity", property: "opacity", kind: "number", step: 0.05, min: 0.2, max: 1 }
];
function regionSelector(region) {
  return region.selectors.join(", ");
}
function formatRegionValue(field, value) {
  return field.template === void 0 ? value : field.template.replace("{value}", value);
}
function parseRegionValue(field, declaration) {
  if (field.template === void 0) return declaration;
  const [head, tail] = field.template.split("{value}");
  const inner = declaration.slice(head.length, declaration.length - tail.length);
  return inner.trim() === "" ? declaration : inner;
}
function readRegionStyle(css, region) {
  const out = /* @__PURE__ */ new Map();
  const selector = regionSelector(region);
  const rule = (css ?? []).find((entry) => entry.selector === selector);
  if (rule === void 0) return out;
  for (const field of REGION_FIELDS) {
    const value = declarationValue(rule.rule, field.property);
    if (value !== void 0) out.set(field.id, parseRegionValue(field, value));
  }
  return out;
}
function writeRegionStyle(css, region, field, value) {
  const selector = regionSelector(region);
  const rules = css ?? [];
  const current = rules.find((rule2) => rule2.selector === selector)?.rule;
  const existing = field.refines === void 0 ? current : hoistShorthand(current, field.refines);
  const written = value === void 0 || value === "" ? withoutDeclaration(existing, field.property) : mergeDeclaration(existing, field.property + ": " + formatRegionValue(field, value) + " !important;");
  const withoutMarker = withoutDeclaration(written, PANEL_FILL_PROPERTY);
  const rule = declarationValue(written, "background-color") === void 0 ? withoutMarker : mergeDeclaration(withoutMarker, PANEL_FILL_PROPERTY + ": 1;");
  const rest = rules.filter((entry) => entry.selector !== selector).map((entry) => ({ selector: entry.selector, rule: entry.rule }));
  return rule === "" ? rest : [...rest, { selector, rule }];
}
function hoistShorthand(rule, shorthand) {
  const text = rule ?? "";
  const value = declarationValue(text, shorthand);
  if (value === void 0) return text;
  const important = new RegExp(shorthand.replace(/[-[\]{}()*+?.\\^$|]/g, "\\$&") + "\\s*:[^;]*!important", "i").test(text);
  const rest = withoutDeclaration(text, shorthand);
  return shorthand + ": " + value + (important ? " !important" : "") + (rest === "" ? "" : "; " + rest);
}
function clearRegionStyles(css) {
  const owned = new Set(REGIONS.map((region) => regionSelector(region)));
  return (css ?? []).filter((rule) => !owned.has(rule.selector)).map((rule) => ({ selector: rule.selector, rule: rule.rule }));
}
var REGION_PRESETS = [
  {
    id: "glass",
    labelKey: "regionPresetGlass",
    hintKey: "regionPresetGlassHint",
    values: { bg: "rgba(255, 255, 255, 0.55)", blur: "18px", radius: "20px", shadow: REGION_SHADOWS[1].value, borderStyle: "solid", borderWidth: "1px", borderColor: "rgba(255, 255, 255, 0.5)" }
  },
  {
    id: "paper",
    labelKey: "regionPresetPaper",
    hintKey: "regionPresetPaperHint",
    values: { radius: "14px", shadow: REGION_SHADOWS[2].value, borderStyle: "none", blur: "" }
  },
  {
    id: "flat",
    labelKey: "regionPresetFlat",
    hintKey: "regionPresetFlatHint",
    values: { radius: "14px", shadow: "", borderStyle: "none", blur: "" }
  }
];
function applyRegionPreset(css, region, preset) {
  let next = css ?? [];
  for (const field of REGION_FIELDS) {
    const value = preset.values[field.id];
    next = writeRegionStyle(next, region, field, value === void 0 || value === "" ? void 0 : value);
  }
  return next.map((rule) => ({ selector: rule.selector, rule: rule.rule }));
}
function regionCount(doc, region) {
  return doc.querySelectorAll(regionSelector(region)).length;
}

// src/client/markdown.ts
var MD_BODY = '[class*="_markdown"]:not([data-markdown-variant="compact"])';
var MD_CONVERSATION = "[data-conversation-content] " + MD_BODY;
var MD_SCOPE_PROPERTY = "--dsh-myskin-md-scope";
function readMarkdownScope(skin) {
  for (const rule of skin.css ?? []) {
    const match = rule.rule.match(/--dsh-myskin-md-scope:\s*([a-z-]+)/);
    if (match !== null) return match[1] === "conversation" || match[1] === "assistant" ? "conversation" : "all";
  }
  return "all";
}
function withMarkdownScope(css, scope) {
  return withRootMarker(css, MD_SCOPE_PROPERTY, scope === "conversation" ? "conversation" : void 0);
}
function markdownContainers(scope) {
  return scope === "conversation" ? MD_CONVERSATION : MD_BODY;
}
function markdownBody(scope) {
  return markdownContainers(scope);
}
var MARKDOWN_GROUPS = [
  { id: "text", labelKey: "mdGroupText" },
  { id: "heading", labelKey: "mdGroupHeading" },
  { id: "list", labelKey: "mdGroupList" },
  { id: "quote", labelKey: "mdGroupQuote" },
  { id: "code", labelKey: "mdGroupCode" },
  { id: "table", labelKey: "mdGroupTable" },
  { id: "misc", labelKey: "mdGroupMisc" }
];
var MARKDOWN_FIELDS = [
  { id: "paraGap", group: "text", labelKey: "mdParaGap", targets: [" p", " ul", " ol"], property: "margin", kind: "px", unit: "px", step: 1, min: 0, max: 40, probe: { target: " p", property: "margin-top" } },
  { id: "hGap", group: "heading", labelKey: "mdHGap", targets: [" h1", " h2", " h3", " h4"], property: "margin-top", kind: "px", unit: "px", step: 1, min: 0, max: 48, probe: { target: " h1", property: "margin-top" } },
  { id: "hGapBottom", group: "heading", labelKey: "mdHGapBottom", targets: [" h1", " h2", " h3", " h4"], property: "margin-bottom", kind: "px", unit: "px", step: 1, min: 0, max: 48, probe: { target: " h1", property: "margin-bottom" } },
  { id: "hWeight", group: "heading", labelKey: "mdHWeight", targets: [" h1", " h2", " h3", " h4"], property: "font-weight", kind: "number", step: 100, min: 300, max: 900, probe: { target: " h1", property: "font-weight" } },
  { id: "liGap", group: "list", labelKey: "mdLiGap", targets: [" li"], property: "margin-top", kind: "px", unit: "px", step: 1, min: 0, max: 24, probe: { target: " li", property: "margin-top" } },
  { id: "liMarker", group: "list", labelKey: "mdLiMarker", targets: [" li::marker"], property: "color", kind: "color", probe: { target: " li", property: "color", pseudo: "::marker" } },
  { id: "listIndent", group: "list", labelKey: "mdListIndent", targets: [" ul", " ol"], property: "padding-left", kind: "px", unit: "px", step: 2, min: 0, max: 64, probe: { target: " ul", property: "padding-left" } },
  { id: "quoteBorder", group: "quote", labelKey: "mdQuoteBorder", targets: [" blockquote"], property: "border-left-color", kind: "color", probe: { target: " blockquote", property: "border-left-color" } },
  { id: "quoteWidth", group: "quote", labelKey: "mdQuoteWidth", targets: [" blockquote"], property: "border-left-width", kind: "px", unit: "px", step: 1, min: 0, max: 12, probe: { target: " blockquote", property: "border-left-width" } },
  { id: "quoteColor", group: "quote", labelKey: "mdQuoteColor", targets: [" blockquote"], property: "color", kind: "color", probe: { target: " blockquote", property: "color" } },
  { id: "quoteBg", group: "quote", labelKey: "mdQuoteBg", targets: [" blockquote"], property: "background-color", kind: "color", probe: { target: " blockquote", property: "background-color" } },
  { id: "codePad", group: "code", labelKey: "mdInlineCodePad", targets: [" :not(pre) > code"], property: "padding", kind: "px", unit: "px", step: 1, min: 0, max: 12, probe: { target: " :not(pre) > code", property: "padding" } },
  { id: "codeColor", group: "code", labelKey: "mdInlineCodeColor", targets: [" :not(pre) > code"], property: "color", kind: "color", probe: { target: " :not(pre) > code", property: "color" } },
  { id: "codeRadius", group: "code", labelKey: "mdInlineCodeRadius", targets: [" :not(pre) > code"], property: "border-radius", kind: "px", unit: "px", step: 1, min: 0, max: 16, probe: { target: " :not(pre) > code", property: "border-radius" } },
  { id: "preBg", group: "code", labelKey: "mdPreBg", targets: [" pre"], property: "background-color", kind: "color", probe: { target: " pre", property: "background-color" } },
  { id: "prePad", group: "code", labelKey: "mdPrePad", targets: [" pre"], property: "padding", kind: "px", unit: "px", step: 2, min: 0, max: 40, probe: { target: " pre", property: "padding" } },
  { id: "tablePad", group: "table", labelKey: "mdTablePad", targets: [" th", " td"], property: "padding", kind: "px", unit: "px", step: 1, min: 0, max: 24, probe: { target: " td", property: "padding" } },
  { id: "tableBorder", group: "table", labelKey: "mdTableBorder", targets: [" th", " td"], property: "border-bottom-color", kind: "color", probe: { target: " td", property: "border-bottom-color" } },
  { id: "tableHeadBg", group: "table", labelKey: "mdTableHeadBg", targets: [" th"], property: "background-color", kind: "color", probe: { target: " th", property: "background-color" } },
  { id: "tableZebra", group: "table", labelKey: "mdTableZebra", targets: [" tbody tr:nth-child(even)"], property: "background-color", kind: "toggle", onValue: "rgba(127, 127, 127, 0.08)", offValue: "transparent" },
  { id: "linkWeight", group: "misc", labelKey: "mdLinkWeight", targets: [" a"], property: "font-weight", kind: "number", step: 100, min: 300, max: 900, probe: { target: " a", property: "font-weight" } },
  { id: "hrColor", group: "misc", labelKey: "mdHrColor", targets: [" hr"], property: "background", kind: "color", probe: { target: " hr", property: "background-color" } },
  { id: "hrHeight", group: "misc", labelKey: "mdHrHeight", targets: [" hr"], property: "height", kind: "px", unit: "px", step: 1, min: 0, max: 8, probe: { target: " hr", property: "height" } },
  { id: "hrGap", group: "misc", labelKey: "mdHrGap", targets: [" hr"], property: "margin", kind: "px", unit: "px", step: 1, min: 0, max: 60, probe: { target: " hr", property: "margin-top" } },
  { id: "imgRadius", group: "misc", labelKey: "mdImgRadius", targets: [" img"], property: "border-radius", kind: "px", unit: "px", step: 1, min: 0, max: 32, probe: { target: " img", property: "border-radius" } },
  { id: "imgMax", group: "misc", labelKey: "mdImgMax", targets: [" img"], property: "max-width", kind: "number", unit: "%", step: 5, min: 20, max: 100, probe: { target: " img", property: "max-width" } }
];
function markdownSelector(field, scope) {
  return field.targets.map((target) => markdownBody(scope) + target).join(", ");
}
function readMarkdownStyles(css, scope) {
  const out = /* @__PURE__ */ new Map();
  for (const field of MARKDOWN_FIELDS) {
    const selector = markdownSelector(field, scope);
    const rule = (css ?? []).find((entry) => entry.selector === selector);
    if (rule === void 0) continue;
    const value = declarationValue(rule.rule, field.property);
    if (value !== void 0) out.set(field.id, value);
  }
  return out;
}
function writeMarkdownStyle(css, scope, field, value) {
  const selector = markdownSelector(field, scope);
  const rules = css ?? [];
  const existing = rules.find((rule2) => rule2.selector === selector)?.rule;
  const rule = value === void 0 || value === "" ? withoutDeclaration(existing, field.property) : mergeDeclaration(existing, field.property + ": " + value + " !important;");
  const rest = rules.filter((entry) => entry.selector !== selector).map((entry) => ({ selector: entry.selector, rule: entry.rule }));
  return rule === "" ? rest : [...rest, { selector, rule }];
}
function clearMarkdownStyles(css, scope) {
  const body = markdownBody(scope);
  return (css ?? []).filter((rule) => !rule.selector.startsWith(body)).map((rule) => ({ selector: rule.selector, rule: rule.rule }));
}
var MARKDOWN_TOKENS = [
  { id: "tokBaseSize", labelKey: "mdTokBaseSize", token: "--dsw-font-markdown-base-font-size", kind: "px", unit: "px", step: 1, min: 10, max: 24, probe: { target: "", property: "font-size" } },
  { id: "tokBaseLine", labelKey: "mdTokBaseLine", token: "--dsw-font-markdown-base-line-height", kind: "px", unit: "px", step: 1, min: 12, max: 44, probe: { target: "", property: "line-height" } },
  { id: "tokH1Size", labelKey: "mdTokH1Size", token: "--dsw-font-markdown-h1-font-size", kind: "px", unit: "px", step: 1, min: 12, max: 40, probe: { target: " h1", property: "font-size" } },
  { id: "tokH2Size", labelKey: "mdTokH2Size", token: "--dsw-font-markdown-h2-font-size", kind: "px", unit: "px", step: 1, min: 12, max: 36, probe: { target: " h2", property: "font-size" } },
  { id: "tokH3Size", labelKey: "mdTokH3Size", token: "--dsw-font-markdown-h3-font-size", kind: "px", unit: "px", step: 1, min: 12, max: 32, probe: { target: " h3", property: "font-size" } },
  { id: "tokH4Size", labelKey: "mdTokH4Size", token: "--dsw-font-markdown-h4-font-size", kind: "px", unit: "px", step: 1, min: 12, max: 28, probe: { target: " h4", property: "font-size" } },
  { id: "tokCodeSize", labelKey: "mdTokCodeSize", token: "--dsw-font-markdown-code-font-size", kind: "px", unit: "px", step: 1, min: 10, max: 20, probe: { target: " :not(pre) > code", property: "font-size" } },
  { id: "tokCodeBlockSize", labelKey: "mdTokCodeBlockSize", token: "--dsw-font-markdown-code-block-font-size", kind: "px", unit: "px", step: 1, min: 10, max: 20, probe: { target: " pre code", property: "font-size" } },
  { id: "tokInlineCodeBg", labelKey: "mdTokInlineCodeBg", token: "--dsw-alias-markdown-inline-code", kind: "color", probe: { target: " :not(pre) > code", property: "background-color" } },
  { id: "tokCodeBlockBg", labelKey: "mdTokCodeBlockBg", token: "--dsw-alias-markdown-code-block", kind: "color", probe: { target: " pre", property: "background-color" } },
  { id: "tokCodeBannerBg", labelKey: "mdTokCodeBannerBg", token: "--dsw-alias-markdown-code-block-banner", kind: "color" },
  { id: "tokLink", labelKey: "mdTokLink", token: "--dsw-alias-link", kind: "color", probe: { target: " a", property: "color" } }
];
function readMarkdownTokens(skin) {
  const out = /* @__PURE__ */ new Map();
  for (const field of MARKDOWN_TOKENS) {
    const entry = skin.tokens[field.token];
    if (entry === void 0) continue;
    const value = entry.light !== "" ? entry.light : entry.dark;
    if (value !== "") out.set(field.id, value);
  }
  return out;
}
function markdownTokenSplit(skin) {
  return MARKDOWN_TOKENS.filter((field) => {
    const entry = skin.tokens[field.token];
    return entry !== void 0 && entry.light !== entry.dark;
  }).map((field) => field.token);
}
function writeMarkdownToken(skin, field, value) {
  const tokens = { ...skin.tokens };
  if (value === void 0 || value === "") delete tokens[field.token];
  else tokens[field.token] = { light: value, dark: value };
  return { ...skin, tokens };
}
function clearMarkdownTokens(skin) {
  const tokens = { ...skin.tokens };
  for (const field of MARKDOWN_TOKENS) delete tokens[field.token];
  return { ...skin, tokens };
}
var MARKDOWN_PRESETS = [
  {
    id: "tight",
    labelKey: "mdPresetTight",
    tokens: { tokBaseSize: "13px", tokBaseLine: "20px", tokH1Size: "18px", tokH2Size: "16px", tokH3Size: "15px", tokH4Size: "14px" },
    values: { paraGap: "6px", hGap: "14px", hGapBottom: "6px", liGap: "2px", listIndent: "18px", hrGap: "16px" }
  },
  {
    id: "normal",
    labelKey: "mdPresetNormal",
    tokens: { tokBaseSize: "14px", tokBaseLine: "22px", tokH1Size: "20px", tokH2Size: "18px", tokH3Size: "16px", tokH4Size: "15px" },
    values: { paraGap: "12px", hGap: "24px", hGapBottom: "10px", liGap: "4px", listIndent: "20px", hrGap: "24px" }
  },
  {
    id: "loose",
    labelKey: "mdPresetLoose",
    tokens: { tokBaseSize: "15px", tokBaseLine: "26px", tokH1Size: "24px", tokH2Size: "21px", tokH3Size: "18px", tokH4Size: "16px" },
    values: { paraGap: "18px", hGap: "34px", hGapBottom: "14px", liGap: "7px", listIndent: "22px", hrGap: "32px" }
  }
];
function applyMarkdownPreset(skin, scope, preset) {
  let css = skin.css ?? [];
  for (const field of MARKDOWN_FIELDS) {
    const value = preset.values[field.id];
    if (value !== void 0) css = writeMarkdownStyle(css, scope, field, value);
  }
  let next = { ...skin, css: css.map((rule) => ({ selector: rule.selector, rule: rule.rule })) };
  for (const field of MARKDOWN_TOKENS) {
    const value = preset.tokens[field.id];
    if (value !== void 0) next = writeMarkdownToken(next, field, value);
  }
  return next;
}
function readEffectiveMarkdown(doc, scope, tokenValue = (name2) => {
  const view = doc.defaultView;
  const body = doc.querySelector(markdownBody(scope));
  if (view === null || body === null || typeof view.getComputedStyle !== "function") return "";
  return view.getComputedStyle(body).getPropertyValue(name2).trim();
}) {
  const out = /* @__PURE__ */ new Map();
  const view = doc.defaultView;
  if (view === null || typeof view.getComputedStyle !== "function") return out;
  const body = doc.querySelector(markdownBody(scope));
  if (body === null) return out;
  const probe = (field) => {
    if (field.probe === void 0) return;
    const target = field.probe.target === "" ? body : body.querySelector(field.probe.target);
    if (target === null) return;
    const style = view.getComputedStyle(target, field.probe.pseudo);
    const raw = style.getPropertyValue(field.probe.property).trim();
    if (raw === "" || raw === "normal" || raw === "auto") return;
    const px = raw.match(/^(-?[\d.]+)px$/);
    const shown = px === null ? raw : String(Math.round(Number.parseFloat(px[1]) * 10) / 10) + "px";
    out.set(field.id, shown);
  };
  for (const field of MARKDOWN_FIELDS) probe(field);
  for (const field of MARKDOWN_TOKENS) {
    const raw = tokenValue(field.token);
    if (raw !== "") {
      out.set(field.id, raw);
      continue;
    }
    probe(field);
  }
  return out;
}
function markdownSurfaceCount(doc, scope) {
  return {
    bodies: doc.querySelectorAll(markdownBody(scope)).length,
    all: doc.querySelectorAll('[class*="_markdown"]').length
  };
}

// src/client/variants.ts
var VARIANT_PROPERTY = "--dsh-myskin-variant";
var ALL_REGIONS = "*";
var REGION_FIELD_INDEX = new Map(REGION_FIELDS.map((field) => [field.id, field]));
var border = (color, width) => ({ borderStyle: "solid", borderWidth: width, borderColor: color });
var glassFrame = (blur, shadow) => ({ blur, shadow, ...border("rgba(255, 255, 255, 0.5)", "1px") });
var outlineFrame = () => ({ blur: "", shadow: "none", ...border("var(--dsw-alias-border-l2)", "1px") });
var noFrame = () => ({ blur: "", shadow: "none", ...border("transparent", "0px") });
var RADIUS_SIZES = [
  { id: "square", labelKey: "variantRadiusSquare", hintKey: "variantRadiusSquareHint", value: "0px" },
  { id: "s", labelKey: "variantRadiusS", hintKey: "variantRadiusSHint", value: "8px" },
  { id: "m", labelKey: "variantRadiusM", hintKey: "variantRadiusMHint", value: "14px" },
  { id: "l", labelKey: "variantRadiusL", hintKey: "variantRadiusLHint", value: "20px" },
  { id: "pill", labelKey: "variantRadiusPill", hintKey: "variantRadiusPillHint", value: "28px" }
];
function radiusAxis(id, fieldId, labelKey, subOf) {
  return {
    id,
    labelKey,
    ...subOf === void 0 ? {} : { subOf },
    options: RADIUS_SIZES.map((size) => ({
      id: size.id,
      labelKey: size.labelKey,
      hintKey: size.hintKey,
      regions: { "*": { [fieldId]: size.value } }
    }))
  };
}
var VARIANT_AXES = [
  {
    id: "frame",
    labelKey: "variantFrame",
    options: [
      {
        id: "glass",
        labelKey: "variantFrameGlass",
        hintKey: "variantFrameGlassHint",
        regions: {
          "sidebar": glassFrame("18px", "0 1px 2px rgba(0, 0, 0, 0.06), 0 8px 24px -18px rgba(0, 0, 0, 0.35)"),
          // The native right sidebar is a panel like the left one: a look that skipped it would
          // leave one column in the old material (see regions.ts).
          "rightSidebar": glassFrame("18px", "0 1px 2px rgba(0, 0, 0, 0.06), 0 8px 24px -18px rgba(0, 0, 0, 0.35)"),
          "composer": glassFrame("20px", "0 2px 6px rgba(0, 0, 0, 0.08), 0 18px 48px -24px rgba(0, 0, 0, 0.45)"),
          "settings": glassFrame("24px", "0 4px 12px rgba(0, 0, 0, 0.12), 0 32px 64px -28px rgba(0, 0, 0, 0.55)"),
          "conversation": noFrame(),
          "messages": noFrame()
        }
      },
      {
        id: "outline",
        labelKey: "variantFrameOutline",
        hintKey: "variantFrameOutlineHint",
        regions: {
          "sidebar": outlineFrame(),
          "rightSidebar": outlineFrame(),
          "composer": outlineFrame(),
          "settings": outlineFrame(),
          "conversation": noFrame(),
          "messages": noFrame()
        }
      },
      {
        id: "none",
        labelKey: "variantFrameNone",
        hintKey: "variantFrameNoneHint",
        regions: {
          "sidebar": noFrame(),
          "rightSidebar": noFrame(),
          "composer": noFrame(),
          "settings": noFrame(),
          "conversation": noFrame(),
          "messages": noFrame()
        }
      }
    ]
  },
  {
    id: "fill",
    labelKey: "variantFill",
    options: [
      {
        id: "glass",
        labelKey: "variantFillGlass",
        hintKey: "variantFillGlassHint",
        regions: {
          "sidebar": { bg: "rgba(255, 255, 255, 0.42)" },
          "rightSidebar": { bg: "rgba(255, 255, 255, 0.42)" },
          "composer": { bg: "rgba(255, 255, 255, 0.55)" },
          "settings": { bg: "rgba(255, 255, 255, 0.72)" },
          // The conversation and the message list ARE the canvas: giving them a fill would cover
          // whatever is behind the app, which is the opposite of what these two regions are for.
          "conversation": { bg: "transparent" },
          "messages": { bg: "transparent" }
        }
      },
      {
        id: "card",
        labelKey: "variantFillCard",
        hintKey: "variantFillCardHint",
        regions: {
          "sidebar": { bg: "var(--dsw-alias-bg-layer-1)" },
          "rightSidebar": { bg: "var(--dsw-alias-bg-layer-1)" },
          "composer": { bg: "var(--dsw-alias-bg-layer-1)" },
          "settings": { bg: "var(--dsw-alias-bg-layer-1)" },
          "conversation": { bg: "transparent" },
          "messages": { bg: "transparent" }
        }
      },
      {
        id: "none",
        labelKey: "variantFillNone",
        hintKey: "variantFillNoneHint",
        regions: {
          "sidebar": { bg: "transparent" },
          "rightSidebar": { bg: "transparent" },
          "composer": { bg: "transparent" },
          "settings": { bg: "transparent" },
          "conversation": { bg: "transparent" },
          "messages": { bg: "transparent" }
        }
      }
    ]
  },
  radiusAxis("radius", "radius", "variantRadius"),
  // 四角单独定义：都挂在圆角下面（subOf），点选与其它维度完全同构——留空＝跟随统一值。
  radiusAxis("radiusTL", "radiusTL", "regionRadiusTL", "radius"),
  radiusAxis("radiusTR", "radiusTR", "regionRadiusTR", "radius"),
  radiusAxis("radiusBR", "radiusBR", "regionRadiusBR", "radius"),
  radiusAxis("radiusBL", "radiusBL", "regionRadiusBL", "radius"),
  {
    id: "density",
    labelKey: "variantDensity",
    options: [
      {
        id: "tight",
        labelKey: "variantDensityTight",
        hintKey: "variantDensityTightHint",
        tokens: { tokBaseSize: "13px", tokBaseLine: "20px", tokH1Size: "18px", tokH2Size: "16px", tokH3Size: "15px", tokH4Size: "14px" },
        regions: { "*": { pad: "10px" } }
      },
      {
        id: "normal",
        labelKey: "variantDensityNormal",
        hintKey: "variantDensityNormalHint",
        tokens: { tokBaseSize: "14px", tokBaseLine: "22px", tokH1Size: "20px", tokH2Size: "18px", tokH3Size: "16px", tokH4Size: "15px" },
        regions: { "*": { pad: "14px" } }
      },
      {
        id: "loose",
        labelKey: "variantDensityLoose",
        hintKey: "variantDensityLooseHint",
        tokens: { tokBaseSize: "15px", tokBaseLine: "26px", tokH1Size: "24px", tokH2Size: "21px", tokH3Size: "18px", tokH4Size: "16px" },
        regions: { "*": { pad: "20px" } }
      }
    ]
  },
  {
    id: "accent",
    labelKey: "variantAccent",
    options: [
      { id: "theme", labelKey: "variantAccentTheme", hintKey: "variantAccentThemeHint" },
      { id: "blue", labelKey: "variantAccentBlue", hintKey: "variantAccentBlueHint", brand: { light: "#2f6feb", dark: "#6ea8ff" } },
      { id: "violet", labelKey: "variantAccentViolet", hintKey: "variantAccentVioletHint", brand: { light: "#7c5cff", dark: "#a78bfa" } },
      { id: "teal", labelKey: "variantAccentTeal", hintKey: "variantAccentTealHint", brand: { light: "#0f9b8e", dark: "#4fd1c5" } },
      { id: "rose", labelKey: "variantAccentRose", hintKey: "variantAccentRoseHint", brand: { light: "#d63f7a", dark: "#f472b6" } }
    ]
  }
];
var VARIANT_LOOKS = [
  { id: "glass", labelKey: "variantLookGlass", hintKey: "variantLookGlassHint", choices: { frame: "glass", fill: "glass", radius: "l", density: "normal", accent: "theme" } },
  { id: "paper", labelKey: "variantLookPaper", hintKey: "variantLookPaperHint", choices: { frame: "none", fill: "card", radius: "m", density: "normal", accent: "theme" } },
  { id: "quiet", labelKey: "variantLookQuiet", hintKey: "variantLookQuietHint", choices: { frame: "none", fill: "none", radius: "s", density: "tight", accent: "theme" } },
  { id: "vivid", labelKey: "variantLookVivid", hintKey: "variantLookVividHint", choices: { frame: "glass", fill: "glass", radius: "pill", density: "loose", accent: "violet" } }
];
var LEGACY_MATERIAL = {
  glass: { frame: "glass", fill: "glass" },
  paper: { frame: "none", fill: "card" },
  outline: { frame: "outline", fill: "none" },
  bare: { frame: "none", fill: "none" }
};
function readVariantChoices(skin) {
  const out = {};
  for (const rule of skin.css ?? []) {
    const match = rule.rule.match(/--dsh-myskin-variant:\s*([^;]+)/);
    if (match === null) continue;
    for (const entry of match[1].split(",")) {
      const [pair, scope] = entry.split("@");
      const [axis, option] = (pair ?? "").split("=");
      if (axis === void 0 || option === void 0) continue;
      const axisId = axis.trim();
      const optionId = option.trim();
      if (axisId === "" || optionId === "") continue;
      const scopeId = (scope ?? "").trim() === "" ? ALL_REGIONS : scope.trim();
      const perScope = out[scopeId] ?? (out[scopeId] = {});
      perScope[axisId] = optionId;
    }
    break;
  }
  for (const [scope, perScope] of Object.entries(out)) {
    const legacy = perScope["material"];
    if (legacy === void 0) continue;
    const mapped = LEGACY_MATERIAL[legacy];
    delete perScope["material"];
    if (mapped !== void 0) {
      if (perScope["frame"] === void 0) perScope["frame"] = mapped.frame;
      if (perScope["fill"] === void 0) perScope["fill"] = mapped.fill;
    }
  }
  return out;
}
function choicesFor(choices, scope = ALL_REGIONS) {
  return { ...choices[ALL_REGIONS] ?? {}, ...choices[scope] ?? {} };
}
function serialize(choices) {
  const scopes = Object.keys(choices).sort((a, b) => a === ALL_REGIONS ? -1 : b === ALL_REGIONS ? 1 : a < b ? -1 : 1);
  const parts = [];
  for (const scope of scopes) {
    for (const axis of VARIANT_AXES) {
      const option = choices[scope][axis.id];
      if (option === void 0) continue;
      parts.push(scope === ALL_REGIONS ? axis.id + "=" + option : axis.id + "=" + option + "@" + scope);
    }
  }
  return parts.join(",");
}
function applyVariantOption(skin, axis, option, scope = ALL_REGIONS) {
  let next = { ...skin };
  for (const [regionId, properties] of Object.entries(option.regions ?? {})) {
    const named = regionId === "*" ? REGIONS : REGIONS.filter((region) => region.id === regionId);
    for (const region of named) {
      if (scope !== ALL_REGIONS && region.id !== scope) continue;
      for (const [fieldId, value] of Object.entries(properties)) {
        const field = REGION_FIELD_INDEX.get(fieldId);
        if (field === void 0) continue;
        next = { ...next, css: writeRegionStyle(next.css, region, field, value === "" ? void 0 : value) };
      }
    }
  }
  for (const [fieldId, value] of Object.entries(option.tokens ?? {})) {
    const field = MARKDOWN_TOKENS.find((entry) => entry.id === fieldId);
    if (field === void 0) continue;
    next = writeMarkdownToken(next, field, value);
  }
  const tokens = { ...next.tokens };
  if (option.brand === void 0) delete tokens["--dsw-alias-brand-primary"];
  else tokens["--dsw-alias-brand-primary"] = { light: option.brand.light, dark: option.brand.dark };
  next = { ...next, tokens };
  const recorded = readVariantChoices(skin);
  const forScope = { ...recorded[scope] ?? {} };
  forScope[axis.id] = option.id;
  const choices = { ...recorded, [scope]: forScope };
  return { ...next, css: withRootMarker(next.css, VARIANT_PROPERTY, serialize(choices)) };
}
function applyVariantLook(skin, look, scope = ALL_REGIONS) {
  let next = skin;
  for (const axis of VARIANT_AXES) {
    const optionId = look.choices[axis.id];
    const option = axis.options.find((entry) => entry.id === optionId);
    if (option !== void 0) next = applyVariantOption(next, axis, option, scope);
  }
  return next;
}
function clearVariant(skin) {
  let next = { ...skin, css: withRootMarker(skin.css, VARIANT_PROPERTY, void 0) };
  for (const axis of VARIANT_AXES) {
    for (const option of axis.options) {
      for (const [regionId, properties] of Object.entries(option.regions ?? {})) {
        const targets = regionId === "*" ? REGIONS : REGIONS.filter((region) => region.id === regionId);
        for (const region of targets) {
          for (const fieldId of Object.keys(properties)) {
            const field = REGION_FIELD_INDEX.get(fieldId);
            if (field === void 0) continue;
            next = { ...next, css: writeRegionStyle(next.css, region, field, void 0) };
          }
        }
      }
      for (const fieldId of Object.keys(option.tokens ?? {})) {
        const field = MARKDOWN_TOKENS.find((entry) => entry.id === fieldId);
        if (field !== void 0) next = writeMarkdownToken(next, field, void 0);
      }
    }
  }
  const tokens = { ...next.tokens };
  delete tokens["--dsw-alias-brand-primary"];
  return { ...next, tokens };
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
function brandTinted(bubble, bubbleHighlight, navAccent, labelBluish) {
  return {
    "--dsw-specific-bubble": bubble,
    "--dsw-specific-bubble-highlight": bubbleHighlight,
    "--dsw-specific-sidebar-nav-item-active-accent": navAccent,
    "--dsw-alias-label-primary-bluish": labelBluish
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
  "--dsw-alias-bg-base": { light: "#f4f7fb", dark: "#0c1322" },
  "--dsw-alias-bg-layer-1": { light: "#ffffff", dark: "#121b2c" },
  "--dsw-alias-bg-layer-2": { light: "#e9eff7", dark: "#182338" },
  "--dsw-alias-bg-overlay": { light: "#ffffff", dark: "#1b2740" },
  "--dsw-specific-sidebar-fill": { light: "#eaf0f8", dark: "#0e1727" },
  "--dsw-alias-border-l1": { light: "#d6dfec", dark: "#24324a" },
  "--dsw-alias-border-l2": { light: "#c0cde0", dark: "#2f4059" },
  "--dsw-alias-brand-primary": { light: "#1d4ed8", dark: "#60a5fa" },
  "--dsw-alias-label-primary": { light: "#0b1729", dark: "#e8eefb" },
  "--dsw-alias-label-secondary": { light: "#3f5069", dark: "#b3c1d6" },
  ...primary({ light: "#1d4ed8", dark: "#60a5fa" }, { light: "#dbe4f0", dark: "#22304a" }, { light: "#1e40af", dark: "#93c5fd" }, { light: "#ffffff", dark: "#08111f" }),
  ...surfaces({ light: "#ffffff", dark: "#162033" }, { light: "#ffffff", dark: "#1b2740" }, { light: "#e9eff7", dark: "#253352" }, { light: "#0f1b2e", dark: "#f2f6ff" }),
  ...interactive({ light: "rgba(29,78,216,0.07)", dark: "rgba(96,165,250,0.10)" }, { light: "rgba(29,78,216,0.13)", dark: "rgba(96,165,250,0.16)" }),
  ...toolbar({ light: "#dfe8f4", dark: "#1b2740" }, { light: "#ccd9ea", dark: "#253352" }),
  ...surfacesPlus({ light: "#ffffff", dark: "#121b2c" }, { light: "#eef3f9", dark: "#182338" }, { light: "#1d4ed8", dark: "#60a5fa" }, { light: "#1e40af", dark: "#93c5fd" }, { light: "rgba(29,78,216,0.06)", dark: "rgba(96,165,250,0.08)" }, { light: "#dbe7fb", dark: "#1c2a44" }, { light: "rgba(11,23,41,0.10)", dark: "rgba(148,163,184,0.14)" }),
  ...labels({ light: "#5b6f8b", dark: "#93a4bd" }, { light: "#6b7f99", dark: "#7d8ea8" }, { light: "#8494a9", dark: "#5a6b85" }, { light: "#eef3f9", dark: "#162032" }),
  ...chrome({ light: "#dfe8f4", dark: "#1e2a42" }, { light: "#9dafc9", dark: "#3d5271" }, { light: "#1d4ed8", dark: "#60a5fa" }, { light: "rgba(220,38,38,0.07)", dark: "rgba(248,113,113,0.12)" }, { light: "rgba(11,23,41,0.12)", dark: "rgba(226,232,240,0.14)" }, { light: "rgba(11,23,41,0.18)", dark: "rgba(226,232,240,0.20)" }, { light: "rgba(11,23,41,0.18)", dark: "rgba(226,232,240,0.20)" }, { light: "rgba(11,23,41,0.26)", dark: "rgba(226,232,240,0.28)" }),
  ...brandTinted({ light: "#e8effb", dark: "#1c2c46" }, { light: "#d3e2f8", dark: "#1f3250" }, { light: "#dbe7fb", dark: "#1c2a44" }, { light: "#13336b", dark: "#a8c6f5" })
};
var warm = {
  "--dsw-alias-bg-base": { light: "#fbf7f0", dark: "#17110b" },
  "--dsw-alias-bg-layer-1": { light: "#fffdf8", dark: "#211810" },
  "--dsw-alias-bg-layer-2": { light: "#f4e9d8", dark: "#2a1f14" },
  "--dsw-alias-bg-overlay": { light: "#fffdf8", dark: "#33261a" },
  "--dsw-specific-sidebar-fill": { light: "#f7efe1", dark: "#1b140d" },
  "--dsw-alias-border-l1": { light: "#e3d5bf", dark: "#3b2c1d" },
  "--dsw-alias-border-l2": { light: "#d3c0a3", dark: "#4d3a26" },
  "--dsw-alias-brand-primary": { light: "#b45309", dark: "#fbbf24" },
  "--dsw-alias-label-primary": { light: "#2a1f14", dark: "#f7efe3" },
  "--dsw-alias-label-secondary": { light: "#5b4732", dark: "#d3bfa4" },
  ...primary({ light: "#b45309", dark: "#fbbf24" }, { light: "#e8dcc8", dark: "#3a2c1c" }, { light: "#92400e", dark: "#fcd34d" }, { light: "#ffffff", dark: "#1a1206" }),
  ...surfaces({ light: "#fffdf8", dark: "#2a1f14" }, { light: "#fffdf8", dark: "#33261a" }, { light: "#f4e9d8", dark: "#3f2f1f" }, { light: "#2a1f14", dark: "#f7efe3" }),
  ...interactive({ light: "rgba(180,83,9,0.07)", dark: "rgba(251,191,36,0.10)" }, { light: "rgba(180,83,9,0.13)", dark: "rgba(251,191,36,0.16)" }),
  ...toolbar({ light: "#efdfc8", dark: "#2a1f14" }, { light: "#e3cfb0", dark: "#3a2c1c" }),
  ...surfacesPlus({ light: "#fffdf8", dark: "#211810" }, { light: "#f6eddd", dark: "#2a1f14" }, { light: "#b45309", dark: "#fbbf24" }, { light: "#92400e", dark: "#fcd34d" }, { light: "rgba(180,83,9,0.06)", dark: "rgba(251,191,36,0.08)" }, { light: "#f2e0c8", dark: "#3a2c1c" }, { light: "rgba(42,31,20,0.10)", dark: "rgba(215,190,150,0.14)" }),
  ...labels({ light: "#77624a", dark: "#b39a78" }, { light: "#8a7458", dark: "#9a8362" }, { light: "#a08a6b", dark: "#7a6a52" }, { light: "#f6eddd", dark: "#241a12" }),
  ...chrome({ light: "#eedfc9", dark: "#33271a" }, { light: "#b89b76", dark: "#654c31" }, { light: "#b45309", dark: "#fbbf24" }, { light: "rgba(220,38,38,0.07)", dark: "rgba(248,113,113,0.12)" }, { light: "rgba(42,31,20,0.12)", dark: "rgba(235,220,200,0.14)" }, { light: "rgba(42,31,20,0.18)", dark: "rgba(235,220,200,0.20)" }, { light: "rgba(42,31,20,0.18)", dark: "rgba(235,220,200,0.20)" }, { light: "rgba(42,31,20,0.26)", dark: "rgba(235,220,200,0.28)" }),
  ...brandTinted({ light: "#fbeee0", dark: "#34261a" }, { light: "#f6ddc2", dark: "#453121" }, { light: "#f7e3cd", dark: "#3a2c1c" }, { light: "#6d3f12", dark: "#f0c98a" })
};
var rose = {
  "--dsw-alias-bg-base": { light: "#fdf5f7", dark: "#180d13" },
  "--dsw-alias-bg-layer-1": { light: "#fffafc", dark: "#221219" },
  "--dsw-alias-bg-layer-2": { light: "#f9e6ec", dark: "#2c1921" },
  "--dsw-alias-bg-overlay": { light: "#fffafc", dark: "#37222c" },
  "--dsw-specific-sidebar-fill": { light: "#f8ecf1", dark: "#1c1017" },
  "--dsw-alias-border-l1": { light: "#eed4dd", dark: "#3a222c" },
  "--dsw-alias-border-l2": { light: "#e0bcc9", dark: "#4c2d3a" },
  "--dsw-alias-brand-primary": { light: "#be123c", dark: "#fb7185" },
  "--dsw-alias-label-primary": { light: "#3d1220", dark: "#fbeaf0" },
  "--dsw-alias-label-secondary": { light: "#6d3448", dark: "#d9b3c1" },
  ...primary({ light: "#be123c", dark: "#fb7185" }, { light: "#f0d6de", dark: "#40202d" }, { light: "#9f1239", dark: "#fda4af" }, { light: "#ffffff", dark: "#2a0f1b" }),
  ...surfaces({ light: "#fffafc", dark: "#2c1921" }, { light: "#fffafc", dark: "#37222c" }, { light: "#f9e6ec", dark: "#452b37" }, { light: "#3d1220", dark: "#fbeaf0" }),
  ...interactive({ light: "rgba(190,18,60,0.06)", dark: "rgba(251,113,133,0.10)" }, { light: "rgba(190,18,60,0.12)", dark: "rgba(251,113,133,0.16)" }),
  ...toolbar({ light: "#f4dbe3", dark: "#36202a" }, { light: "#eccbd6", dark: "#452b37" }),
  ...surfacesPlus({ light: "#fffafc", dark: "#221219" }, { light: "#f7e9ee", dark: "#2c1921" }, { light: "#be123c", dark: "#fb7185" }, { light: "#9f1239", dark: "#fda4af" }, { light: "rgba(190,18,60,0.05)", dark: "rgba(251,113,133,0.08)" }, { light: "#f7dbe4", dark: "#43222f" }, { light: "rgba(61,18,32,0.10)", dark: "rgba(251,228,238,0.14)" }),
  ...labels({ light: "#8d5468", dark: "#b98ba0" }, { light: "#9c6b7c", dark: "#a67b8e" }, { light: "#ab7d91", dark: "#8a6072" }, { light: "#f7e9ee", dark: "#241319" }),
  ...chrome({ light: "#f4d9e2", dark: "#36202a" }, { light: "#c794a6", dark: "#654050" }, { light: "#be123c", dark: "#fb7185" }, { light: "rgba(220,38,38,0.07)", dark: "rgba(248,113,113,0.12)" }, { light: "rgba(61,18,32,0.12)", dark: "rgba(251,228,238,0.14)" }, { light: "rgba(61,18,32,0.18)", dark: "rgba(251,228,238,0.20)" }, { light: "rgba(61,18,32,0.18)", dark: "rgba(251,228,238,0.20)" }, { light: "rgba(61,18,32,0.26)", dark: "rgba(251,228,238,0.28)" }),
  ...brandTinted({ light: "#fce9ef", dark: "#3a1f29" }, { light: "#f8d7e1", dark: "#4b2a36" }, { light: "#f7dbe4", dark: "#43222f" }, { light: "#7a1733", dark: "#f8b8c8" })
};
var PRESETS = [
  { id: "default", labelKey: "presetDefault", tokens: {} },
  { id: "deep", labelKey: "presetDeep", tokens: deep },
  { id: "warm", labelKey: "presetWarm", tokens: warm },
  { id: "rose", labelKey: "presetRose", tokens: rose }
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
function isOwnElement(el) {
  const doc = el.ownerDocument;
  return el.getAttribute("data-dsh-myskin-ui") === "1" || el.closest('[data-dsh-myskin-ui="1"]') !== null || el === doc.body || el === doc.documentElement || el === doc.getElementById("root");
}
var OCCLUDED_LABEL_MAX = 30;
function shortLabel(label) {
  return label.length > OCCLUDED_LABEL_MAX ? label.slice(0, OCCLUDED_LABEL_MAX - 1) + "\u2026" : label;
}
function pageLabel(el) {
  return elementLabel(el, 40);
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
function round1(value) {
  return Math.round(value * 10) / 10;
}
function formatOne(value) {
  return String(round1(value));
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
function roleLabelKey(role) {
  return role === "ui" ? "roleUi" : role === "text" ? "roleText" : "roleCode";
}
function anchorFromElement(el) {
  return { kind: "element", value: selectorOf(el), label: elementLabel(el, 24) };
}
function defaultAnchor(kind, img, target, groupAnchor) {
  if (kind === "group") return groupAnchor ?? anchorFromElement(target);
  if (kind === "component") {
    const current = anchorOf(img);
    const existing = current.kind === "component" ? current.value : "";
    return { kind: "component", value: existing !== "" ? existing : ANCHOR_COMPONENTS[0].id, label: "" };
  }
  if (kind === "text") {
    const copy = anchorTextOf(target);
    return { kind: "text", value: copy ?? "", label: copy ?? "" };
  }
  return anchorFromElement(target);
}
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
function saveFailureText(report, t, canvas) {
  if (report.failed.includes("*")) return t("applyFailed");
  const base = t("saveFailed") + report.failed.join(", ");
  if (canvas === void 0 || !report.failed.includes("canvas")) return base;
  const diagnosis = diagnoseCanvas(canvas);
  return canvasLooksOversized(diagnosis) ? base + " \u2014\u2014 " + t("saveFailedCanvasLarge").replace("{n}", String(Math.round(diagnosis.bytes / 1024))) : base + " \u2014\u2014 " + t("saveFailedCanvas");
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
function openSkinEditor(theme, initial, t, onCommit, onClose, onPersistStrength) {
  closeSkinEditor();
  const container = document.createElement("div");
  document.body.appendChild(container);
  editorHost = { root: (0, import_client.createRoot)(container), container };
  editorHost.root.render(
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SkinCanvas,
      {
        theme,
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
function useWallpaperEnginePresent() {
  const [present, setPresent] = (0, import_react.useState)(() => typeof document !== "undefined" && wallpaperEngineInstalled(document));
  (0, import_react.useEffect)(() => {
    if (typeof document === "undefined") return void 0;
    return observeWallpaperEngine(document, () => {
      setPresent(wallpaperEngineInstalled(document));
    });
  }, []);
  return present;
}
function MySkinSection(props) {
  const { scope, theme, t, close } = props;
  if (scope === void 0 || theme === void 0 || t === void 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loaded, { scope, theme, t, close });
}
function Loaded({ scope, theme, t, close }) {
  const [skin, setSkin] = (0, import_react.useState)(() => parseSkin(scope.getSnapshot().value ?? EMPTY_SKIN));
  const [notice, setNoticeState] = (0, import_react.useState)(void 0);
  const setNotice = (text, tone = "ok") => {
    setNoticeState({ text, tone });
  };
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
      if (!report.ok) setNotice(saveFailureText(report, t, next.canvas), "error");
    });
  };
  const applyNow = () => {
    void persist(scope, skin);
    setNotice(t("saved"));
  };
  const reset = () => {
    update(resetSkin(skin));
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
    a.download = name2.replace(/[\\/:*?"<>|]/g, "-") + FRAMEWORK_EXTENSION;
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
  const enginePresent = useWallpaperEnginePresent();
  const compatChoice = readCompatChoice(skin);
  const compatMode = resolveCompatMode(compatChoice, enginePresent);
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rowTitleStyle, children: t("compat") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkinToggle, { checked: compatMode, onChange: (v) => update({ ...skin, css: withCompatMode(skin.css, v) }), status: compatMode ? t("enabledOn") : t("enabledOff") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...lastRowStyle, color: compatMode ? tok.brand : tok.labelTertiary, fontSize: 12, lineHeight: "18px" }, children: [
      enginePresent && compatChoice === "auto" ? t("compatAutoHint") + " " : "",
      t("compatHint")
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: lastRowStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPersonalization, { size: 16 }), onClick: () => {
        close?.();
        openSkinEditor(theme, skin, t, (next) => persistNow(next), () => {
        }, (canvas, css) => persistStrength(canvas, css));
      }, children: t("edit") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, onClick: applyNow, children: t("apply") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "ghost", onClick: reset, children: t("reset") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: saveSkin, children: t("saveSkin") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: onExport, children: t("exportSkin") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
        importRef.current?.click();
      }, children: t("importSkin") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: importRef, type: "file", accept: IMPORT_ACCEPT, style: { display: "none" }, onChange: onImportFile })
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
    notice === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "6px 0 0", fontSize: 12, lineHeight: "18px", color: notice.tone === "error" ? tok.error : tok.success }, children: notice.text }),
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
var MAX_ANIMATED_URL_LENGTH = 4e6;
async function readPickedImage(file, maxEdge = MAX_IMAGE_EDGE, quality = 0.9) {
  let animated = false;
  let bytes = new Uint8Array(0);
  try {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (isGif(head)) {
      bytes = new Uint8Array(await file.arrayBuffer());
      animated = isAnimatedGif(bytes);
    }
  } catch {
    animated = false;
  }
  if (animated) {
    const url = bytesToDataUrl(bytes, "image/gif");
    const size = { width: bytes[6] | bytes[7] << 8, height: bytes[8] | bytes[9] << 8 };
    if (url.length <= MAX_ANIMATED_URL_LENGTH) return { url, animated: true, stilled: false, ...size };
    const still2 = await readImageFile(file, maxEdge, quality);
    return { url: still2.url, animated: true, stilled: true, width: still2.width, height: still2.height };
  }
  const still = await readImageFile(file, maxEdge, quality);
  return { url: still.url, animated: false, stilled: false, width: still.width, height: still.height };
}
var EMBED_BOX_WIDTH = 320;
var EMBED_BOX_HEIGHT = 240;
function embedSizeFor(width, height) {
  if (width <= 0 || height <= 0) return { w: EMBED_BOX_WIDTH, h: EMBED_BOX_HEIGHT };
  const scale = Math.min(1, EMBED_BOX_WIDTH / width, EMBED_BOX_HEIGHT / height);
  return { w: Math.max(24, Math.round(width * scale)), h: Math.max(24, Math.round(height * scale)) };
}
function dataUrlSize(url) {
  return (Math.round(url.length / 1024 / 1024 * 10) / 10).toFixed(1) + " MB";
}
var MAX_IMAGE_EDGE = 2048;
var MAX_WALLPAPER_EDGE = 1600;
var MAX_DATA_URL_LENGTH = 15e5;
async function readBoundedImage(file) {
  const picked = await readPickedImage(file, MAX_WALLPAPER_EDGE, 0.85);
  if (picked.animated && picked.url !== "") {
    return { url: picked.url, compressed: false, animated: true, stilled: picked.stilled };
  }
  const first = (await readImageFile(file, MAX_WALLPAPER_EDGE, 0.85)).url;
  if (first === "") return { url: "", compressed: false, animated: false, stilled: false };
  if (first.length <= MAX_DATA_URL_LENGTH) return { url: first, compressed: false, animated: false, stilled: false };
  const steps = [[1280, 0.8], [960, 0.72]];
  for (const [edge, quality] of steps) {
    const next = (await readImageFile(file, edge, quality)).url;
    if (next !== "" && next.length <= MAX_DATA_URL_LENGTH) return { url: next, compressed: true, animated: false, stilled: false };
  }
  return { url: "", compressed: true, animated: false, stilled: false };
}
function readImageFile(file, maxEdge = MAX_IMAGE_EDGE, quality = 0.9) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const failed = { url: "", width: 0, height: 0 };
    reader.onerror = () => resolve(failed);
    reader.onload = () => {
      const url = String(reader.result ?? "");
      if (url === "") {
        resolve(failed);
        return;
      }
      const image = new Image();
      image.onerror = () => resolve({ url, width: 0, height: 0 });
      image.onload = () => {
        const natural = { width: image.naturalWidth, height: image.naturalHeight };
        const edge = Math.max(image.naturalWidth, image.naturalHeight);
        if (edge <= maxEdge || typeof document === "undefined") {
          resolve({ url, ...natural });
          return;
        }
        const scale = maxEdge / edge;
        const target = document.createElement("canvas");
        target.width = Math.max(1, Math.round(image.naturalWidth * scale));
        target.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = target.getContext("2d");
        if (context === null) {
          resolve({ url, ...natural });
          return;
        }
        context.drawImage(image, 0, 0, target.width, target.height);
        try {
          resolve({ url: target.toDataURL("image/webp", quality), ...natural });
        } catch {
          resolve({ url, ...natural });
        }
      };
      image.src = url;
    };
    reader.readAsDataURL(file);
  });
}
var PANEL_WIDTH = 340;
var Z_INDEX_PRESETS = [0, 10, 100, 1e3];
var MAX_SURFACE_ROWS = 6;
var PEER_OUTLINE_MAX = 24;
function SkinCanvas({ theme, initial, onClose, onSave, onCommit, onPersistStrength, t }) {
  const [draft, setDraft] = (0, import_react.useState)(() => parseSkin(initial));
  const tokenKey = Object.entries(draft.tokens).map(([name2, modes]) => name2 + ":" + modes.light + "/" + modes.dark).join(";");
  const compatMode = resolveCompatMode(readCompatChoice(draft), useWallpaperEnginePresent());
  const [selected, setSelected] = (0, import_react.useState)(void 0);
  const [mode, setMode] = (0, import_react.useState)("edit");
  const [showTokens, setShowTokens] = (0, import_react.useState)(false);
  const [hint, setHint] = (0, import_react.useState)(void 0);
  const [flash, setFlash] = (0, import_react.useState)(void 0);
  const [hover, setHover] = (0, import_react.useState)(void 0);
  const [panelOpen, setPanelOpen] = (0, import_react.useState)(true);
  const [dock, setDock] = (0, import_react.useState)(() => readDockSide(browserStorage()));
  const [occluded, setOccluded] = (0, import_react.useState)([]);
  const [selectedImage, setSelectedImage] = (0, import_react.useState)(void 0);
  const selectedImageRef = (0, import_react.useRef)(void 0);
  const [panelTab, setPanelTab] = (0, import_react.useState)(() => readPanelTab(browserStorage()));
  (0, import_react.useEffect)(() => {
    writePanelTab(browserStorage(), panelTab);
  }, [panelTab]);
  const [pageView, setPageView] = (0, import_react.useState)(() => currentPageSurface(document, pageLabel));
  const [inSettings, setInSettings] = (0, import_react.useState)(() => settingsOpen(document));
  const [knownPages, setKnownPages] = (0, import_react.useState)(() => readRememberedSurfaces(browserStorage()));
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
  const [restoredLive, setRestoredLive] = (0, import_react.useState)({});
  const [scope, setScope] = (0, import_react.useState)("single");
  const group = (0, import_react.useMemo)(
    () => selected === void 0 ? void 0 : elementGroupFor(selected, document),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, selectionEpoch]
  );
  const site = (0, import_react.useMemo)(
    () => selected === void 0 ? void 0 : siteScopeFor(selected, document),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, selectionEpoch]
  );
  const siteScope = site !== void 0 && site.ok ? site.scope : void 0;
  const activeSelector = scope === "group" && group !== void 0 ? group.selector : scope === "site" && siteScope !== void 0 ? siteScope.selector : selected === void 0 ? "" : selectorOf(selected);
  const gapSelector = (0, import_react.useMemo)(
    () => scope === "group" && group !== void 0 ? gapSelectorFor(group, document) : void 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scope, group, selectionEpoch]
  );
  const gap = gapSelector === void 0 ? "" : gapOf(draft.css, gapSelector);
  const gapEditRef = (0, import_react.useRef)(false);
  const setGap = (value) => {
    if (gapSelector === void 0) return;
    if (!gapEditRef.current) {
      snapshot();
      gapEditRef.current = true;
    }
    setDraft((prev) => ({ ...prev, css: withGapRule(prev.css, gapSelector, value) }));
  };
  const changeScope = (next) => {
    if (next === scope) return;
    setScope(next);
    if (selected === void 0) return;
    const wide = next === "group" ? group?.selector : next === "site" ? siteScope?.selector : void 0;
    if (wide === void 0) return;
    const own = selectorOf(selected);
    if (own === wide) return;
    snapshot();
    setDraft((prev) => ({ ...prev, css: moveRuleToBlock(prev.css, own, wide) }));
  };
  const setSurfaceVisibility = (surface, hidden) => {
    if (siteScope === void 0) return;
    snapshot();
    setDraft((prev) => ({
      ...prev,
      css: hidden ? withSurfaceHidden(prev.css, surface, siteScope.selector, true) : withVisibleWhile(prev.css, surface, siteScope.selector, surfaces2)
    }));
  };
  const keepOnlySurface = (surface) => {
    if (siteScope === void 0) return;
    snapshot();
    setDraft((prev) => ({ ...prev, css: withOnlySurface(prev.css, surface, siteScope.selector, surfaces2) }));
  };
  const hideEverywhere = () => {
    if (siteScope === void 0) return;
    snapshot();
    setDraft((prev) => ({ ...prev, css: withHiddenEverywhere(prev.css, siteScope.selector) }));
  };
  const addDeclaration = (selector, declaration) => {
    snapshot();
    setDraft((prev) => {
      const existing = prev.css.find((entry) => entry.selector === selector)?.rule;
      const rest = prev.css.filter((entry) => entry.selector !== selector);
      return { ...prev, css: [...rest, { selector, rule: mergeDeclaration(existing, declaration) }] };
    });
  };
  const restoreAllHidden = () => {
    if (siteScope === void 0) return;
    snapshot();
    setDraft((prev) => ({ ...prev, css: withAllHiddenRestored(prev.css, siteScope.selector) }));
  };
  const committedImagesRef = (0, import_react.useRef)(initial.canvas.images);
  const [, bumpHistory] = (0, import_react.useState)(0);
  const draftRef = (0, import_react.useRef)(draft);
  (0, import_react.useEffect)(() => {
    draftRef.current = draft;
  }, [draft]);
  (0, import_react.useEffect)(() => {
    selectedImageRef.current = selectedImage;
  }, [selectedImage]);
  (0, import_react.useEffect)(() => {
    if (selectedImage !== void 0) setPanelTab("image");
  }, [selectedImage]);
  (0, import_react.useEffect)(() => {
    if (selectedImage !== void 0 && !draft.canvas.images.some((img) => img.id === selectedImage)) setSelectedImage(void 0);
  }, [draft.canvas.images, selectedImage]);
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
      selectElement(hitTest(e.clientX, e.clientY));
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
  const measureRef = (0, import_react.useRef)(() => {
  });
  (0, import_react.useLayoutEffect)(() => {
    applyDockAttribute(document, dock);
    writeDockSide(browserStorage(), dock);
    measureRef.current();
    pulseWindowDragRecall(document);
  }, [dock]);
  (0, import_react.useEffect)(() => {
    if (!panelOpen) {
      setOccluded((prev) => prev.length === 0 ? prev : []);
      return;
    }
    let frame = 0;
    const scan = () => {
      frame = 0;
      const panel = panelRef.current;
      if (panel === null) return;
      const found = occludedBehindPanel(panel.getBoundingClientRect(), document, isOwnElement);
      setOccluded((prev) => sameElements(prev, found) ? prev : found);
      const nextPage = currentPageSurface(document, pageLabel);
      setPageView((prev) => prev?.id === nextPage?.id && prev?.label === nextPage?.label ? prev : nextPage);
      if (nextPage !== void 0) {
        setKnownPages((prev) => prev.some((entry) => entry.id === nextPage.id) ? prev : rememberSurface(browserStorage(), prev, nextPage));
      }
      const nextSettings = settingsOpen(document);
      setInSettings((prev) => prev === nextSettings ? prev : nextSettings);
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(scan);
    };
    const timer = window.setInterval(schedule, 1500);
    schedule();
    return () => {
      window.clearInterval(timer);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [panelOpen, dock, mode, selectionEpoch]);
  (0, import_react.useEffect)(() => {
    const root = document.documentElement;
    const priorStyle = root.getAttribute("style");
    const priorDock = root.getAttribute(DOCK_ATTRIBUTE);
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
      const width = Math.round(panel === null ? PANEL_WIDTH : panel.getBoundingClientRect().width) + "px";
      root.style.setProperty("--dsh-myskin-inset-left", width);
      root.style.setProperty("--dsh-myskin-inset-right", width);
    };
    measureRef.current = measure;
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
      if (priorDock === null) clearDockAttribute(document);
      else root.setAttribute(DOCK_ATTRIBUTE, priorDock);
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
    if (!compatMode && draft.canvas.background !== void 0 && draft.canvas.background !== "") {
      const opacity = readBackgroundOpacity(draft);
      rules.push(...wallpaperRules(document, draft.canvas.background, surfaceTint(document, opacity, desktopFrameTint(document)), readBackgroundAnchor(draft)));
      rules.push(...backgroundSurfaceRules(document, opacity, desktopFrameTint(document)));
    }
    for (const { selector, rule } of paintableRules(draft.css, compatMode)) {
      if (selector !== "" && rule !== "") rules.push(selector + " { " + rule + " }");
    }
    for (const img of draft.canvas.images) {
      if (img.selector !== "" && img.url !== "") {
        const above = embedPaintsAbove(img, readImageLayer(draft, img.id));
        const feather = readImageFeather(draft, img.id);
        rules.push(embedHostRule(img.selector, above));
        rules.push(img.selector + embedAfterRule(img, above, feather));
      }
    }
    const removedNow = new Set(removedControls(draft.css).map((entry) => entry.selector));
    for (const [selector, display] of Object.entries(restoredLive)) {
      if (!removedNow.has(selector)) rules.push(selector + " { display: " + display + " !important }");
    }
    const d = document;
    if (rules.length > 0) {
      if (liveStyleRef.current === null) {
        const tag = d.createElement("style");
        tag.dataset.live = "dsh-myskin";
        tag.id = DRAFT_STYLE_ID;
        d.head.appendChild(tag);
        liveStyleRef.current = tag;
      }
      liveStyleRef.current.textContent = rules.join("\n");
    } else if (liveStyleRef.current !== null) {
      liveStyleRef.current.remove();
      liveStyleRef.current = null;
    }
  }, [draft.css, draft.canvas.background, draft.canvas.backgroundOpacity, draft.canvas.images, restoredLive, compatMode]);
  const imageSignature = draft.canvas.images.map((img) => img.id + "|" + imageModeOf(img) + "|" + anchorKey(anchorOf(img))).join(";");
  const anchorImageIds = draft.canvas.images.filter((img) => imageModeOf(img) === "anchor").map((img) => img.id).join(",");
  const stampDraftImages = () => {
    const images = draftRef.current.canvas.images;
    const live = new Set(images.filter((img) => imageModeOf(img) === "embed").map((img) => img.id));
    for (const node of Array.from(document.querySelectorAll("[data-dsh-myskin-embed]"))) {
      const id = node.getAttribute("data-dsh-myskin-embed") ?? "";
      if (!live.has(id)) node.removeAttribute("data-dsh-myskin-embed");
    }
    for (const img of images) {
      if (imageModeOf(img) !== "embed") continue;
      const targets = resolveImageTargets(img, document);
      for (const node of Array.from(document.querySelectorAll('[data-dsh-myskin-embed="' + img.id + '"]'))) {
        if (!targets.includes(node)) node.removeAttribute("data-dsh-myskin-embed");
      }
      for (const target of targets) {
        if (target.getAttribute("data-dsh-myskin-embed") !== img.id) target.setAttribute("data-dsh-myskin-embed", img.id);
      }
    }
  };
  (0, import_react.useEffect)(() => {
    stampDraftImages();
  }, [imageSignature]);
  (0, import_react.useEffect)(() => {
    let frame = 0;
    const pass = () => {
      frame = 0;
      stampDraftImages();
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(pass);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);
  const overlayRef = (0, import_react.useRef)(void 0);
  (0, import_react.useEffect)(() => {
    if (anchorImageIds === "") return;
    const overlay = mountImageOverlay(
      () => draftRef.current.canvas.images.filter((img) => imageModeOf(img) === "anchor"),
      document
    );
    overlayRef.current = overlay;
    return () => {
      overlay.dispose();
      overlayRef.current = void 0;
    };
  }, [anchorImageIds]);
  (0, import_react.useEffect)(() => {
    overlayRef.current?.sync();
  });
  (0, import_react.useEffect)(() => {
    const observer = new MutationObserver(() => {
      keepStylesheetLast(liveStyleRef.current);
    });
    observer.observe(document.head, { childList: true });
    keepStylesheetLast(liveStyleRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);
  (0, import_react.useEffect)(() => () => {
    if (liveStyleRef.current !== null) {
      liveStyleRef.current.remove();
      liveStyleRef.current = null;
    }
    restoreLiveText();
    const committed = new Set(committedImagesRef.current.map((img) => img.id));
    for (const node of Array.from(document.querySelectorAll("[data-dsh-myskin-embed]"))) {
      const id = node.getAttribute("data-dsh-myskin-embed") ?? "";
      if (!committed.has(id)) node.removeAttribute("data-dsh-myskin-embed");
    }
    for (const img of committedImagesRef.current) {
      const target = resolveImageAnchor(img, document);
      if (target !== void 0 && target.getAttribute("data-dsh-myskin-embed") !== img.id) target.setAttribute("data-dsh-myskin-embed", img.id);
    }
  }, []);
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
  const clearStyle = (selector) => {
    if (selector === "") return;
    if (!draftRef.current.css.some((entry) => entry.selector === selector)) return;
    snapshot();
    setRestoredLive((prev) => {
      if (prev[selector] === void 0) return prev;
      const next = { ...prev };
      delete next[selector];
      return next;
    });
    setDraft((prev) => ({ ...prev, css: prev.css.filter((entry) => entry.selector !== selector) }));
  };
  const liveApplyRef = (0, import_react.useRef)(false);
  const liveTransformRef = (0, import_react.useRef)(false);
  const transformAuthoredRef = (0, import_react.useRef)(false);
  const roleEditRef = (0, import_react.useRef)(false);
  const liveApply = (selector, declaration) => {
    if (!liveApplyRef.current) {
      snapshot();
      liveApplyRef.current = true;
    }
    setDraft((prev) => {
      const existing = prev.css.find((r) => r.selector === selector)?.rule;
      const merged = withManagedDeclarations(existing, declaration);
      if (sameDeclarations(existing, merged)) return prev;
      const rest = prev.css.filter((r) => r.selector !== selector);
      return merged === "" ? { ...prev, css: rest } : { ...prev, css: [...rest, { selector, rule: merged }] };
    });
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
    setRestoredLive((prev) => {
      if (prev[selector] === void 0) return prev;
      const next = { ...prev };
      delete next[selector];
      return next;
    });
    setElementProperty(selector, REMOVE_PAIR[0], REMOVE_PAIR[1]);
  };
  const restoreRemoved = (selectors) => {
    if (selectors.length === 0) return;
    snapshot();
    const measured = {};
    for (const selector of selectors) {
      const element = safeQuery(selector);
      if (element === null) continue;
      const display = naturalDisplayOf(element);
      if (display !== void 0) measured[selector] = display;
    }
    if (Object.keys(measured).length > 0) setRestoredLive((prev) => ({ ...prev, ...measured }));
    setDraft((prev) => ({ ...prev, css: selectors.reduce((list, selector) => withControlRestored(list, selector), prev.css) }));
  };
  const restoreControl = (selector) => {
    restoreRemoved([selector]);
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
    setDraft((prev) => {
      const existing = prev.css.find((r) => r.selector === selector)?.rule;
      const merged = transformEdit(existing, x, y, scale);
      if (sameDeclarations(existing, merged)) return prev;
      const rest = prev.css.filter((r) => r.selector !== selector);
      return merged === "" ? { ...prev, css: rest } : { ...prev, css: [...rest, { selector, rule: merged }] };
    });
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
  const setRoleFont = (role, value) => {
    if (!roleEditRef.current) {
      snapshot();
      roleEditRef.current = true;
    }
    setDraft((prev) => ({ ...prev, css: withRoleFont(prev.css, role, value) }));
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
    void readPickedImage(file).then(({ url, animated, stilled, width, height }) => {
      if (url === "") {
        setHint(t("applyFailed"));
        return;
      }
      if (animated) setHint(stilled ? t("gifStilled") : t("gifKept").replace("{n}", dataUrlSize(url)));
      snapshot();
      const id = "embed-" + Date.now() + "-" + Math.floor(Math.random() * 1e3);
      target.setAttribute("data-dsh-myskin-embed", id);
      const img = {
        id,
        selector: '[data-dsh-myskin-embed="' + id + '"]',
        fallbackSelector: selectorOf(target),
        // A brand-new image is anchored to the element the user embedded it on — or, when the
        // panel is in 整组 scope, to the whole block: one picture on every workspace row, now and
        // for the rows created later. The anchor panel can re-point it either way afterwards.
        anchor: scope === "group" && group !== void 0 ? { kind: "group", value: group.selector, label: t(groupLabelKey(group.kind)) } : anchorFromElement(target),
        url,
        x: 0,
        y: 0,
        ...embedSizeFor(width, height),
        opacity: 0.9,
        pageKey: currentSettingsPageKey(target.ownerDocument)
      };
      setDraft({ ...draft, canvas: { ...draft.canvas, images: [...draft.canvas.images, img] } });
    });
  };
  const onPageBgFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file === void 0) return;
    void readBoundedImage(file).then(({ url, compressed, animated, stilled }) => {
      if (url === "") {
        setHint(t("imageTooLarge"));
        return;
      }
      snapshot();
      setDraft({ ...draft, canvas: { ...draft.canvas, background: url } });
      if (animated) setHint(stilled ? t("gifStilled") : t("gifKept").replace("{n}", dataUrlSize(url)));
      else setHint(compressed ? t("imageCompressed") : void 0);
    });
  };
  (0, import_react.useEffect)(() => {
    if (typeof document === "undefined") return void 0;
    const tokens = paintableTokens(draftRef.current.tokens, resolveCompatMode(readCompatChoice(draftRef.current), wallpaperEngineInstalled(document)));
    const dark = document.body.hasAttribute("data-ds-dark-theme") || document.documentElement.style.colorScheme === "dark";
    const previous = /* @__PURE__ */ new Map();
    const applied = /* @__PURE__ */ new Map();
    for (const [name2, modes] of Object.entries(tokens)) {
      const value = dark ? modes.dark : modes.light;
      previous.set(name2, document.body.style.getPropertyValue(name2));
      applied.set(name2, value);
      document.body.style.setProperty(name2, value);
    }
    const dispose = typeof theme.overrideTokens === "function" ? theme.overrideTokens(PLUGIN_ID, tokens) : void 0;
    return () => {
      if (typeof dispose === "function") dispose();
      for (const [name2, before] of previous) {
        if (document.body.style.getPropertyValue(name2) !== applied.get(name2)) continue;
        if (before === "") document.body.style.removeProperty(name2);
        else document.body.style.setProperty(name2, before);
      }
    };
  }, [tokenKey, compatMode, theme]);
  const setImageLayer = (id, layer) => {
    snapshot();
    setDraft({ ...draft, css: withImageLayer(draft.css, id, layer) });
  };
  const setImageFeather = (id, feather) => {
    snapshot();
    setDraft({ ...draft, css: withImageFeather(draft.css, id, feather) });
  };
  const setImagePageScope = (id, own) => {
    snapshot();
    setDraft({ ...draft, css: withImageMarker(draft.css, id, IMAGE_PAGE_SCOPE_PROPERTY, own ? void 0 : "any") });
  };
  const setMarkdownSkin = (next) => {
    snapshot();
    setDraft(next);
  };
  const setBackgroundAnchor = (anchor) => {
    snapshot();
    const css = withBackgroundAnchor(draft.css, anchor);
    setDraft({ ...draft, css });
    schedulePersistStrength(draft.canvas, css);
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
    transformAuthoredRef.current = false;
    const selector = activeSelector !== "" ? activeSelector : selectorOf(el);
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
  const resetAll = () => {
    setConfirmReset(false);
    setHint(void 0);
    setFlash(void 0);
    const next = resetSkin(draft);
    snapshot();
    setDraft(next);
    setSelected(void 0);
    setSelectedImage(void 0);
    setRestoredLive({});
    restoreLiveText();
    setSave({ state: "saving" });
    void onSave({ ...next }).then((report) => {
      if (report.ok) {
        committedImagesRef.current = next.canvas.images;
        setRestoredLive({});
        setSave({ state: "saved" });
        setFlash(t("resetDone"));
        return;
      }
      const detail = saveFailureText(report, t, next.canvas);
      setSave({ state: "failed", detail });
      setHint(detail);
    });
  };
  const saveDraft = () => {
    setHint(void 0);
    setFlash(void 0);
    setSave({ state: "saving" });
    void onSave({ ...draft }).then((report) => {
      if (report.ok) {
        committedImagesRef.current = draft.canvas.images;
        setRestoredLive({});
        setSave({ state: "saved" });
        setFlash(t("savedHint"));
        return;
      }
      const detail = saveFailureText(report, t, draft.canvas);
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
        committedImagesRef.current = draft.canvas.images;
        setRestoredLive({});
        setSave({ state: "saved" });
        return;
      }
      const detail = saveFailureText(report, t, draft.canvas);
      setSave({ state: "failed", detail });
      setHint(detail);
    });
  };
  const closeDiscarding = () => {
    onClose();
  };
  (0, import_react.useEffect)(() => {
    selectedRef.current = selected;
  }, [selected]);
  (0, import_react.useEffect)(() => {
    closeRef.current = closeDiscarding;
  });
  const selectElement = (el) => {
    setSelectedImage(void 0);
    setSelected(el);
    setPanelTab("component");
  };
  const selectParent = () => {
    const el = selectedRef.current;
    if (el === void 0) return;
    const parent = parentTarget(el, isOwnElement);
    if (parent !== void 0) selectElement(parent);
  };
  const selectChild = () => {
    const el = selectedRef.current;
    if (el === void 0) return;
    const point = lastPointRef.current ?? centerOf(el);
    if (point === void 0) return;
    const stack = Array.from(document.elementsFromPoint(point.x, point.y));
    const child = childTargetIn(stack, el, isOwnElement);
    if (child !== void 0) selectElement(child);
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
        if (selectedImageRef.current !== void 0) {
          setSelectedImage(void 0);
          return;
        }
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
        const detail = saveFailureText(report, t, canvas);
        setSave({ state: "failed", detail });
        setHint(detail);
      });
    }, 400);
  };
  const scopeSelector = scope === "group" ? group?.selector : scope === "site" ? siteScope?.selector : void 0;
  const groupPeers = scopeSelector === void 0 ? [] : Array.from(document.querySelectorAll(scopeSelector)).filter((el) => el !== selected && el.isConnected).slice(0, PEER_OUTLINE_MAX);
  const selRect = selected !== void 0 && selected.isConnected ? selected.getBoundingClientRect() : null;
  const hoverRect = mode === "edit" && hover !== void 0 && hover !== selected && hover.isConnected ? hover.getBoundingClientRect() : null;
  const elementChrome = mode === "edit" && selectedImage === void 0;
  const selectedImageData = selectedImage === void 0 ? void 0 : draft.canvas.images.find((img) => img.id === selectedImage);
  const selectedImageHost = selectedImageData === void 0 ? void 0 : resolveImageAnchor(selectedImageData, document);
  const imageDiag = selectedImageData === void 0 ? void 0 : diagnoseEmbeddedImage(selectedImageData, document, embedPaintsAbove(selectedImageData, readImageLayer(draft, selectedImageData.id)), 3, readImageFeather(draft, selectedImageData.id).width, (selectedImageData.pageKey ?? "") !== "" && !imagePageMatches(draft, selectedImageData, currentSettingsPageKey(document)));
  const saveColor = save.state === "failed" ? tok.error : save.state === "dirty" ? tok.warn : tok.labelTertiary;
  const panelArrow = dock === "right" === panelOpen ? "\u203A" : "\u2039";
  const dockTarget = otherDock(dock);
  const groupAnchor = scope === "group" && group !== void 0 ? { kind: "group", value: group.selector, label: t(groupLabelKey(group.kind)) } : void 0;
  const settingsView = settingsSurface(t("viewSettings"));
  const surfaces2 = [settingsView];
  if (pageView !== void 0) surfaces2.push(pageView);
  for (const known of knownPages) {
    if (surfaces2.length >= MAX_SURFACE_ROWS || surfaces2.some((entry) => entry.id === known.id)) continue;
    surfaces2.push(known);
  }
  const occludedLabel = occluded.length === 0 ? "" : shortLabel(elementLabel(occluded[0]));
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
          panelArrow,
          " ",
          t("panelLabel")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
          setDock(dockTarget);
        }, title: dockTarget === "left" ? t("dockLeftHint") : t("dockRightHint"), children: [
          dockTarget === "left" ? "\u21E4 " : "\u21E5 ",
          dockTarget === "left" ? t("dockLeft") : t("dockRight")
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
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "outline", onClick: resetAll, children: t("resetGo") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
            setConfirmReset(false);
          }, children: t("cancel") })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 14 }), onClick: () => {
          setConfirmReset(true);
        }, title: t("resetHint"), children: t("reset") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClose, { size: 16 }), onClick: closeDiscarding, title: t("closeHint"), children: t("close") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "0 16px 6px var(--dsh-myskin-leading, 16px)", fontSize: 12, lineHeight: "18px", color: hint !== void 0 ? tok.warn : flash !== void 0 ? tok.success : tok.labelTertiary }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: hint !== void 0 || flash !== void 0 ? "dsh-myskin-warn" : void 0, style: { flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: hint ?? flash ?? (mode === "edit" ? t("editHint") : t("interactHint")) }, hint ?? flash ?? "idle"),
        occluded.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            "data-dsh-myskin-ui": "1",
            className: "dsh-myskin-chip",
            onClick: () => {
              setDock(dockTarget);
            },
            title: t("occludedHint"),
            style: { flex: "none", display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, border: "1px solid " + tok.warn, background: tok.bgLayer2, color: tok.warn, fontSize: 12, lineHeight: "18px", whiteSpace: "nowrap", cursor: "pointer" },
            children: [
              "\u26A0 ",
              t("occludedWarn").replace("{n}", occludedLabel),
              " \xB7 ",
              dockTarget === "left" ? t("dockLeft") : t("dockRight")
            ]
          }
        ) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: "none", color: tok.labelTertiary }, children: t("shortcuts") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: panelRef, className: "dsh-myskin-panel dsh-myskin-scroll", "data-open": panelOpen ? "1" : "0", "data-dsh-myskin-ui": "1", style: { pointerEvents: panelOpen ? "auto" : "none", visibility: panelOpen ? "visible" : "hidden", position: "absolute", top: "calc(var(--dsh-myskin-chrome-top, 0px) + var(--dsh-myskin-inset-top, 48px))", ...dock === "right" ? { right: 0 } : { left: 0 }, bottom: 0, width: panelOpen ? PANEL_WIDTH : 0, display: "flex", flexDirection: "column", gap: 12, overflowX: "hidden", overflowY: "auto", padding: panelOpen ? 12 : 0, background: panelOpen ? tok.bgOverlay : "transparent", borderLeft: panelOpen && dock === "right" ? "1px solid " + tok.borderL2 : "none", borderRight: panelOpen && dock === "left" ? "1px solid " + tok.borderL2 : "none", zIndex: 10004 }, children: [
      mode === "edit" && compatMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 11, lineHeight: "16px", color: tok.warn, padding: "0 2px" }, children: t("compatBackgroundHint") }) : null,
      mode === "edit" && panelTab === "look" && draft.canvas.background !== void 0 && draft.canvas.background !== "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: tok.labelSecondary }, children: [
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
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh-myskin-field", style: { gap: 6, alignItems: "flex-start", cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: readBackgroundAnchor(draft) === "conversation",
              onChange: (e) => {
                setBackgroundAnchor(e.target.checked ? "conversation" : "viewport");
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { flex: 1, minWidth: 0, fontSize: 11, lineHeight: "16px", color: tok.labelSecondary }, children: [
            t("backgroundAnchor"),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary }, children: t("backgroundAnchorHint") })
          ] })
        ] })
      ] }) : null,
      mode === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { display: "inline-flex", border: "1px solid " + tok.borderL2, borderRadius: 8, overflow: "hidden" }, children: PANEL_TABS.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        import_dsh_client_ui_primitives.Button,
        {
          size: "sm",
          variant: panelTab === entry ? "primary" : "ghost",
          title: t("tabHint"),
          onClick: () => {
            setPanelTab(entry);
          },
          children: [
            t(PANEL_TAB_LABEL[entry]),
            entry === "image" && draft.canvas.images.length > 0 ? " " + String(draft.canvas.images.length) : "",
            entry === "text" && draft.text.length > 0 ? " " + String(draft.text.length) : ""
          ]
        },
        entry
      )) }) }) }) : null,
      mode === "edit" && panelTab === "component" ? selected !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        Inspector,
        {
          target: selected,
          draft,
          onSample: liveApply,
          onReplaceStyle: applyStyle,
          onClearStyle: clearStyle,
          onText: addText,
          onLiveText: liveText,
          onRemoveText: removeText,
          onRemove: removeSelector,
          onHide: hideElement,
          onUnhide: unhideElement,
          onRemoveControl: removeControl,
          onRestoreControl: restoreControl,
          onSelectParent: selectParent,
          onSelectChild: selectChild,
          onEmbedFont: embedFont,
          onRemoveFont: removeFont,
          activeSelector,
          group,
          site,
          settingsView,
          pageView,
          surfaces: surfaces2,
          inSettings,
          onSurfaceHidden: setSurfaceVisibility,
          onKeepOnly: keepOnlySurface,
          onHideEverywhere: hideEverywhere,
          onRestoreAllHidden: restoreAllHidden,
          onAddDeclaration: addDeclaration,
          scope,
          onScope: changeScope,
          gapSelector,
          gap,
          onGap: setGap,
          onGapEnd: () => {
            gapEditRef.current = false;
          },
          onRoleFont: setRoleFont,
          onRoleFontEnd: () => {
            roleEditRef.current = false;
          },
          transformAuthored: transformAuthoredRef,
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
      ] }) : mode === "edit" ? null : (
        /* 交互模式下没有页签：面板只留一句提示（页面自己的键盘与鼠标都归 DSH）。 */
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelTertiary }, children: t("interactHint") })
      ),
      mode === "edit" && panelTab === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: selectedImageData !== void 0 ? (
        /* 选中的图片：和选中组件同级——画布上只有这一个框，面板这里也只显示它。 */
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-card", style: { display: "flex", flexDirection: "column", gap: 6, padding: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelSecondary }, children: t("imageSelected") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelPrimary, wordBreak: "break-word" }, children: selectedImageHost === void 0 ? anchorLabel(anchorOf(selectedImageData), t) : elementLabel(selectedImageHost, 40) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: selectedImageHost === void 0 ? tok.warn : tok.success }, children: selectedImageHost === void 0 ? t("anchorMissing") : t("anchorOk") + " \xB7 " + anchorLabel(anchorOf(selectedImageData), t) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_dsh_client_ui_primitives.Button,
              {
                style: btnBase,
                size: "sm",
                variant: "outline",
                disabled: selectedImageHost === void 0,
                onClick: () => {
                  if (selectedImageHost !== void 0) {
                    selectElement(selectedImageHost);
                    setSelectionEpoch((n) => n + 1);
                  }
                },
                children: t("selectHost")
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
              setSelectedImage(void 0);
            }, children: t("deselect") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: imageDiag !== void 0 && imageDiag.verdict === "ok" ? tok.success : tok.warn }, children: t(imageDiagKey(imageDiag)) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("imageSelectedHint") })
        ] })
      ) : null }) : null,
      mode === "edit" && panelTab === "variant" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VariantPanel, { draft, compat: compatMode, onChangeSkin: setMarkdownSkin, t }) : null,
      mode === "edit" && panelTab === "region" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegionPanel, { draft, compat: compatMode, onChangeSkin: setMarkdownSkin, t }) : null,
      mode === "edit" && panelTab === "markdown" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkdownPanel, { draft, onChangeSkin: setMarkdownSkin, t }) : null,
      mode === "edit" && panelTab === "text" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        TextPanel,
        {
          draft,
          onEdit: liveText,
          onRemove: removeText,
          onSelect: (selector) => {
            const el = safeQuery(selector);
            if (el !== null) selectElement(el);
          },
          t
        }
      ) : null,
      mode === "edit" && panelTab === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        EmbedImages,
        {
          draft,
          target: selected,
          groupAnchor,
          onAnchor: (id, anchor) => {
            updateEmbed(id, { anchor });
          },
          onMode: (id, mode2) => {
            updateEmbed(id, { mode: mode2 });
          },
          onOpacity: (id, value) => {
            updateEmbed(id, { opacity: clampNum(value, 0, 1) });
          },
          onBlend: (id, value) => {
            updateEmbed(id, { blend: value });
          },
          onGeometry: (id, patch) => {
            updateEmbed(id, patch);
          },
          onLayer: setImageLayer,
          onFeather: setImageFeather,
          onPageScope: setImagePageScope,
          onRemove: removeEmbed,
          selectedImage,
          onSelectImage: setSelectedImage,
          onSelectHost: (el) => {
            selectElement(el);
            setSelectionEpoch((n) => n + 1);
          },
          t
        }
      ) : null,
      mode === "edit" && panelTab === "component" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        RecycleBin,
        {
          entries: removedControls(draft.css),
          onRestore: (selector) => {
            restoreRemoved([selector]);
          },
          onRestoreAll: () => {
            restoreRemoved(removedControls(draft.css).map((entry) => entry.selector));
          },
          t
        }
      ) : null,
      mode === "edit" && panelTab === "look" && showTokens ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TokenPanel, { tokens: draft.tokens, compat: compatMode, onToggle: toggleToken, onChange: setToken, t }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: embedBgRef, type: "file", accept: "image/*", multiple: false, style: { display: "none" }, onChange: onEmbedBgFile }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: pageBgRef, type: "file", accept: "image/*", multiple: false, style: { display: "none" }, onChange: onPageBgFile }),
    mode === "edit" && guides.map((line) => line.axis === "x" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { "data-dsh-myskin-ui": "1", className: "dsh-myskin-guide", style: { position: "fixed", left: line.at, top: 0, bottom: 0, width: 1, background: tok.brand, pointerEvents: "none", zIndex: 10003 } }, "gx" + String(line.at)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { "data-dsh-myskin-ui": "1", className: "dsh-myskin-guide", style: { position: "fixed", left: 0, right: 0, top: line.at, height: 1, background: tok.brand, pointerEvents: "none", zIndex: 10003 } }, "gy" + String(line.at))),
    elementChrome && hoverRect !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ElementBox, { rect: hoverRect, label: elementLabel(hover), solid: false }) : null,
    elementChrome ? groupPeers.map((el, index) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return null;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          "data-dsh-myskin-ui": "1",
          className: "dsh-myskin-peer",
          style: { position: "fixed", left: rect.left, top: rect.top, width: rect.width, height: rect.height, border: "1px dashed " + tok.brand, borderRadius: 4, opacity: 0.5, pointerEvents: "none", zIndex: 1e4 }
        },
        "peer-" + String(index)
      );
    }) : null,
    elementChrome && selRect !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ElementBox, { rect: selRect, label: selected === void 0 ? "" : elementLabel(selected) + (scope === "group" && group !== void 0 ? " \xB7 " + t("scopeGroup") + " " + String(group.count) : ""), solid: true }, "sel-" + selectionEpoch) : null,
    elementChrome && selRect !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
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
      const imageTargets = resolveImageTargets(img, document);
      const container = (selected !== void 0 && imageTargets.includes(selected) ? selected : imageTargets[0]) ?? null;
      const crect = container !== null ? container.getBoundingClientRect() : null;
      if (crect === null) return null;
      const zx = crect.left + (img.x || 0), zy = crect.top + (img.y || 0);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            "data-dsh-myskin-ui": "1",
            onPointerDown: (e) => {
              setSelectedImage(img.id);
              onEmbedPointerDown(e, img);
            },
            onClick: (e) => {
              e.stopPropagation();
            },
            title: t("imageSelectedHint"),
            style: { position: "fixed", left: zx + "px", top: zy + "px", width: img.w + "px", height: img.h + "px", border: "2px " + (img.id === selectedImage ? "solid" : "dashed") + " " + tok.brand, boxShadow: img.id === selectedImage ? "0 0 0 1px " + tok.bgOverlay : "none", background: "transparent", pointerEvents: mode === "edit" ? "auto" : "none", cursor: "move", zIndex: 10001 }
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
var IMAGE_LAYERS = ["auto", "below", "above"];
var IMAGE_LAYER_LABEL = {
  auto: "imageLayerAuto",
  below: "imageLayerBelow",
  above: "imageLayerAbove"
};
var IMAGE_LAYER_HINT = {
  auto: "imageLayerAutoHint",
  below: "imageLayerBelowHint",
  above: "imageLayerAboveHint"
};
function imageDiagKey(diagnosis) {
  if (diagnosis === void 0 || diagnosis.verdict === "ok") return "imgDiagOk";
  if (diagnosis.verdict === "unresolved") return "imgDiagUnresolved";
  if (diagnosis.verdict === "page-scope") return "imgDiagPageScope";
  if (diagnosis.verdict === "covered") return "imgDiagCovered";
  return "imgDiagClipped";
}
function VariantPanel({ draft, compat, onChangeSkin, t }) {
  const [scope, setScope] = (0, import_react.useState)(ALL_REGIONS);
  const choices = choicesFor(readVariantChoices(draft), scope);
  const optionRow = (entry, current, fallback) => {
    const chosen = current[entry.id];
    const dropped = compat && entry.id === "fill";
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelSecondary }, children: [
        t(entry.labelKey),
        dropped ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { marginLeft: 6, fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("compatPanelTag") }) : null,
        chosen === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { marginLeft: 6, fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: fallback }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: entry.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_dsh_client_ui_primitives.Button,
        {
          size: "sm",
          variant: option.id === chosen ? "primary" : "ghost",
          style: btnBase,
          title: t(option.hintKey),
          onClick: () => {
            onChangeSkin(applyVariantOption(draft, entry, option, scope));
          },
          children: t(option.labelKey)
        },
        option.id
      )) })
    ] });
  };
  const scopeLabel = (id) => id === ALL_REGIONS ? t("variantScopeAll") : t(REGIONS.find((region) => region.id === id)?.labelKey ?? "variantScopeAll");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelSecondary }, children: t("variantTitle") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("variantHint") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelSecondary }, children: t("variantScope") }),
      [ALL_REGIONS, ...REGIONS.map((region) => region.id)].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Pill, { style: btnBase, active: id === scope, onClick: () => {
        setScope(id);
      }, children: scopeLabel(id) }, id)),
      scope === ALL_REGIONS ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("variantGlobalHint") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
      VARIANT_LOOKS.map((look) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_dsh_client_ui_primitives.Button,
        {
          style: btnBase,
          size: "sm",
          variant: "outline",
          title: t(look.hintKey),
          onClick: () => {
            onChangeSkin(applyVariantLook(draft, look, scope));
          },
          children: t(look.labelKey)
        },
        look.id
      )),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_dsh_client_ui_primitives.Button,
        {
          style: btnBase,
          size: "sm",
          variant: "ghost",
          title: t("variantResetHint"),
          onClick: () => {
            onChangeSkin(clearVariant(draft));
          },
          children: t("mdReset")
        }
      )
    ] }),
    VARIANT_AXES.filter((axis) => axis.subOf === void 0).map((axis) => {
      const children = VARIANT_AXES.filter((entry) => entry.subOf === axis.id);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
        optionRow(axis, choices, t("variantCornerFollow")),
        children.length === 0 ? null : (
          // 四角单独调: four more rows of the same five buttons, so they go behind a summary —
          // and only a corner that was actually CHOSEN is highlighted (an untouched corner
          // follows the uniform value, which is not the same as having picked 直角 for it).
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelSecondary, cursor: "pointer" }, children: t("variantCorners") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6, paddingTop: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("variantCornersHint") }),
              children.map((child) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: optionRow(child, choices, t("variantCornerFollow")) }, child.id))
            ] })
          ] })
        )
      ] }, axis.id);
    }),
    compat ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.warn }, children: t("variantCompatHint") }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("variantScopeHint") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("variantNote") })
  ] });
}
function RegionPanel({ draft, compat, onChangeSkin, t }) {
  const [regionId, setRegionId] = (0, import_react.useState)(REGIONS[0].id);
  const region = REGIONS.find((entry) => entry.id === regionId) ?? REGIONS[0];
  const values = readRegionStyle(draft.css, region);
  const count = regionCount(document, region);
  const write = (field, value) => {
    onChangeSkin({ ...draft, css: writeRegionStyle(draft.css, region, field, value) });
  };
  const selectStyle = { background: tok.bgBase, color: tok.labelPrimary, border: "1px solid " + tok.borderL2, borderRadius: 6, fontSize: 12, lineHeight: "18px", padding: "2px 6px", flex: "1 1 90px", minWidth: 0 };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelSecondary }, children: t("regionTitle") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("regionHint") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: REGIONS.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Button,
      {
        size: "sm",
        variant: entry.id === region.id ? "primary" : "ghost",
        style: btnBase,
        title: t(entry.hintKey),
        onClick: () => {
          setRegionId(entry.id);
        },
        children: t(entry.labelKey)
      },
      entry.id
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: count > 0 ? tok.success : tok.warn }, children: count > 0 ? t("regionFound").replace("{n}", String(count)) : t("regionMissing") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: regionSelector(region), style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary, wordBreak: "break-all" }, children: regionSelector(region) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
      REGION_PRESETS.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_dsh_client_ui_primitives.Button,
        {
          style: btnBase,
          size: "sm",
          variant: "outline",
          title: t(preset.hintKey),
          onClick: () => {
            onChangeSkin({ ...draft, css: applyRegionPreset(draft.css, region, preset) });
          },
          children: t(preset.labelKey)
        },
        preset.id
      )),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_dsh_client_ui_primitives.Button,
        {
          style: btnBase,
          size: "sm",
          variant: "ghost",
          title: t("regionResetHint"),
          onClick: () => {
            onChangeSkin({ ...draft, css: clearRegionStyles(draft.css) });
          },
          children: t("mdReset")
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("regionCornersHint") }),
    REGION_FIELDS.filter((field) => field.kind !== "option" || field.options !== void 0).map((field) => {
      const label = t(field.labelKey);
      const raw = values.get(field.id);
      if (field.kind === "color") {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
          field.id === "bg" && compat ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("compatPanelTag") }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, { label, raw, clearTitle: t("mdUnset"), onSet: (value) => {
            write(field, value);
          } })
        ] }, field.id);
      }
      if (field.kind === "option") {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label, clearTitle: t("mdUnset"), clearable: raw !== void 0, onClear: () => {
          write(field, void 0);
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { value: raw ?? "", style: selectStyle, onChange: (e) => {
          write(field, e.target.value === "" ? void 0 : e.target.value);
        }, children: (field.options ?? []).map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: option.value, children: t(option.labelKey) }, option.value)) }) }, field.id);
      }
      if (field.kind === "toggle") {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh-myskin-field", style: { gap: 6, cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: raw === field.onValue,
              onChange: (e) => {
                write(field, e.target.checked ? field.onValue : field.offValue);
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1, minWidth: 0 }, children: label })
        ] }, field.id);
      }
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        NumberRow,
        {
          label,
          raw,
          unit: field.unit ?? "",
          step: field.step ?? 1,
          min: field.min ?? 0,
          max: field.max ?? 9999,
          clearTitle: t("mdUnset"),
          onSet: (value) => {
            write(field, value);
          }
        },
        field.id
      );
    })
  ] });
}
function NumberRow({ label, raw, unit, step, min, max, onSet, clearTitle }) {
  const parsed = raw === void 0 ? void 0 : Number.parseFloat(raw);
  const value = parsed !== void 0 && Number.isFinite(parsed) ? parsed : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label, clearTitle, clearable: raw !== void 0, onClear: () => {
    onSet(void 0);
  }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
    const next = Math.min(max, Math.max(min, (value ?? 0) + direction * step * (big ? 10 : 1)));
    onSet(String(Math.round(next * 100) / 100) + unit);
  }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_dsh_client_ui_primitives.Input,
    {
      value: value === void 0 ? "" : String(value) + unit,
      placeholder: clearTitle,
      title: label,
      onChange: (e) => {
        const cleaned = e.target.value.replace(/[^0-9.\-]/g, "");
        if (cleaned.trim() === "") {
          onSet(void 0);
          return;
        }
        const next = Number.parseFloat(cleaned);
        if (!Number.isFinite(next)) return;
        onSet(String(Math.min(max, Math.max(min, next))) + unit);
      }
    }
  ) }) });
}
function ColorRow({ label, raw, onSet, clearTitle }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label, clearTitle, clearable: raw !== void 0, onClear: () => {
    onSet(void 0);
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        type: "color",
        value: toHex(raw ?? "") ?? "#888888",
        style: { width: 28, height: 22, flex: "none", padding: 0, border: "1px solid " + tok.borderL2, borderRadius: 6, background: "transparent" },
        onChange: (e) => {
          onSet(e.target.value);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Input,
      {
        value: raw ?? "",
        placeholder: clearTitle,
        title: label,
        onChange: (e) => {
          const next = e.target.value.trim();
          onSet(next === "" ? void 0 : next);
        }
      }
    )
  ] });
}
function TextPanel({ draft, onEdit, onRemove, onSelect, t }) {
  const entries = draft.text;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, { title: t("tabText"), badge: entries.length === 0 ? void 0 : String(entries.length), children: entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("textEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("textPanelHint") }),
    entries.map((entry) => {
      const host = safeQuery(entry.selector);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-card", style: { display: "flex", flexDirection: "column", gap: 8, padding: 10 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: entry.selector, style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: tok.labelSecondary }, children: host === null ? entry.selector : elementLabel(host, 30) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              style: { ...btnBase, flex: "none" },
              size: "sm",
              variant: "ghost",
              disabled: host === null,
              onClick: () => {
                onSelect(entry.selector);
              },
              children: t("selectHost")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              style: { ...btnBase, flex: "none" },
              size: "sm",
              variant: "ghost",
              icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 14 }),
              title: t("remove"),
              onClick: () => {
                onRemove(entry.selector);
              },
              children: t("remove")
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("textBefore"), clearTitle: t("mdClear"), clearable: false, onClear: () => void 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Input,
          {
            value: entry.before,
            title: t("textBefore"),
            onChange: (e) => {
              onEdit(entry.selector, e.target.value, entry.after);
            }
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("textAfter"), clearTitle: t("mdClear"), clearable: false, onClear: () => void 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Input,
          {
            value: entry.after,
            title: t("textAfter"),
            onChange: (e) => {
              onEdit(entry.selector, entry.before, e.target.value);
            }
          }
        ) })
      ] }, entry.selector);
    })
  ] }) });
}
function MarkdownPanel({ draft, onChangeSkin, t }) {
  const scope = readMarkdownScope(draft);
  const values = readMarkdownStyles(draft.css, scope);
  const tokens = readMarkdownTokens(draft);
  const effective = readEffectiveMarkdown(document, scope);
  const split = markdownTokenSplit(draft);
  const counts = markdownSurfaceCount(document, scope);
  const writeRule = (target, value) => {
    onChangeSkin({ ...draft, css: writeMarkdownStyle(draft.css, scope, target, value) });
  };
  const writeToken = (target, value) => {
    onChangeSkin(writeMarkdownToken(draft, target, value));
  };
  const number = (raw) => {
    if (raw === void 0) return void 0;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : void 0;
  };
  const numericRow = (label, raw, unit, step, bounds, set, current) => {
    const value = number(raw);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label, clearTitle: t("mdClear"), clearable: raw !== void 0, onClear: () => {
      set(void 0);
    }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
      const base = value ?? 0;
      const next = Math.min(bounds[1], Math.max(bounds[0], base + direction * step * (big ? 10 : 1)));
      set(String(Math.round(next * 10) / 10) + unit);
    }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Input,
      {
        value: value === void 0 ? "" : String(value) + unit,
        placeholder: current === void 0 ? t("mdUnset") : current,
        title: label,
        onChange: (e) => {
          const cleaned = e.target.value.replace(/[^0-9.]/g, "");
          if (cleaned.trim() === "") {
            set(void 0);
            return;
          }
          const parsed = Number.parseFloat(cleaned);
          if (!Number.isFinite(parsed)) return;
          set(String(Math.min(bounds[1], Math.max(bounds[0], parsed))) + unit);
        }
      }
    ) }) }, label);
  };
  const colorRow = (label, raw, set, current) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label, clearTitle: t("mdClear"), clearable: raw !== void 0, onClear: () => {
    set(void 0);
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        type: "color",
        value: toHex(raw ?? "") ?? "#888888",
        style: { width: 28, height: 22, flex: "none", padding: 0, border: "1px solid " + tok.borderL2, borderRadius: 6, background: "transparent" },
        onChange: (e) => {
          set(e.target.value);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Input,
      {
        value: raw ?? "",
        placeholder: current === void 0 ? t("mdUnset") : current,
        title: label,
        onChange: (e) => {
          const next = e.target.value.trim();
          set(next === "" ? void 0 : next);
        }
      }
    )
  ] }, label);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelSecondary }, children: t("mdTitle") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("mdHint") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: counts.bodies > 0 ? tok.success : tok.warn }, children: counts.bodies > 0 ? t("mdFound").replace("{n}", String(counts.bodies)) : t("mdMissing") }),
    counts.bodies > 0 && effective.size > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("mdEffective") }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelTertiary }, children: t("mdScopeLabel") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", border: "1px solid " + tok.borderL2, borderRadius: 8, overflow: "hidden" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            size: "sm",
            variant: scope === "all" ? "primary" : "ghost",
            title: t("mdScopeAllHint"),
            onClick: () => {
              onChangeSkin({ ...draft, css: withMarkdownScope(draft.css, "all") });
            },
            children: t("mdScopeAll")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            size: "sm",
            variant: scope === "conversation" ? "primary" : "ghost",
            title: t("mdScopeConversationHint"),
            onClick: () => {
              onChangeSkin({ ...draft, css: withMarkdownScope(draft.css, "conversation") });
            },
            children: t("mdScopeConversation")
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
      MARKDOWN_PRESETS.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_dsh_client_ui_primitives.Button,
        {
          style: btnBase,
          size: "sm",
          variant: "outline",
          onClick: () => {
            onChangeSkin(applyMarkdownPreset(draft, scope, preset));
          },
          children: t(preset.labelKey)
        },
        preset.id
      )),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_dsh_client_ui_primitives.Button,
        {
          style: btnBase,
          size: "sm",
          variant: "ghost",
          title: t("mdResetHint"),
          onClick: () => {
            onChangeSkin(clearMarkdownTokens({ ...draft, css: clearMarkdownStyles(draft.css, scope) }));
          },
          children: t("mdReset")
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, { title: t("mdTokensGroup"), badge: tokens.size === 0 ? void 0 : String(tokens.size), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("mdTokensHint") }),
      MARKDOWN_TOKENS.map((entry) => {
        const label = t(entry.labelKey);
        const raw = tokens.get(entry.id);
        const set = (value) => {
          writeToken(entry, value);
        };
        const row = entry.kind === "color" ? colorRow(label, raw, set, effective.get(entry.id)) : numericRow(label, raw, entry.unit ?? "", entry.step ?? 1, [entry.min ?? 1, entry.max ?? 999], set, effective.get(entry.id));
        if (!split.includes(entry.token)) return row;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
          row,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.warn }, children: t("mdTokenSplit") })
        ] }, entry.id);
      })
    ] }),
    MARKDOWN_GROUPS.map((group) => {
      const fields = MARKDOWN_FIELDS.filter((entry) => entry.group === group.id);
      const setCount = fields.filter((entry) => values.has(entry.id)).length;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, { title: t(group.labelKey), badge: setCount === 0 ? void 0 : String(setCount), children: fields.map((entry) => {
        const label = t(entry.labelKey);
        const current = values.get(entry.id);
        if (entry.kind === "toggle") {
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh-myskin-field", style: { gap: 6, cursor: "pointer" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: current === entry.onValue,
                onChange: (e) => {
                  writeRule(entry, e.target.checked ? entry.onValue : entry.offValue);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1, minWidth: 0 }, children: label })
          ] }, entry.id);
        }
        if (entry.kind === "color") return colorRow(label, current, (value) => {
          writeRule(entry, value);
        }, effective.get(entry.id));
        if (entry.kind === "number" && entry.unit === void 0) {
          return numericRow(label, current, "", entry.step ?? 1, [entry.min ?? 100, entry.max ?? 900], (value) => {
            writeRule(entry, value);
          }, effective.get(entry.id));
        }
        return numericRow(label, current, entry.unit ?? "", entry.step ?? 1, [entry.min ?? 0, entry.max ?? 999], (value) => {
          writeRule(entry, value);
        }, effective.get(entry.id));
      }) }, group.id);
    })
  ] });
}
function EmbedImages({ draft, target, groupAnchor, selectedImage, onSelectImage, onAnchor, onMode, onOpacity, onBlend, onGeometry, onLayer, onFeather, onPageScope, onRemove, onSelectHost, t }) {
  const images = draft.canvas.images;
  const signature = images.map((img) => img.id + "|" + anchorKey(anchorOf(img))).join(";");
  const hosts = (0, import_react.useMemo)(() => {
    const out = /* @__PURE__ */ new Map();
    for (const img of images) out.set(img.id, resolveImageAnchor(img, document));
    return out;
  }, [signature, target]);
  const [openImages, setOpenImages] = (0, import_react.useState)(() => images.length === 1 ? [images[0].id] : []);
  const toggleImagePanel = (id) => {
    if (openImages.includes(id)) {
      setOpenImages(openImages.filter((entry) => entry !== id));
      return;
    }
    setOpenImages([...openImages, id]);
    onSelectImage(id);
  };
  (0, import_react.useEffect)(() => {
    if (selectedImage === void 0) return;
    setOpenImages((previous) => previous.includes(selectedImage) ? previous : [...previous, selectedImage]);
  }, [selectedImage]);
  if (images.length === 0) return null;
  const selectStyle = { background: tok.bgBase, color: tok.labelPrimary, border: "1px solid " + tok.borderL2, borderRadius: 6, fontSize: 12, lineHeight: "18px", padding: "2px 6px" };
  const axes = [
    { key: "x", label: "X", hintKey: "imageAxisX" },
    { key: "y", label: "Y", hintKey: "imageAxisY" },
    { key: "w", label: t("fieldWidth"), hintKey: "imageAxisW" },
    { key: "h", label: t("fieldHeight"), hintKey: "imageAxisH" }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelSecondary }, children: [
      t("embedImages"),
      " \xB7 ",
      String(images.length)
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("embedImagesHint") }),
    images.map((img) => {
      const anchor = anchorOf(img);
      const host = hosts.get(img.id);
      const ok = host !== void 0;
      const isSelected = img.id === selectedImage;
      const open = openImages.includes(img.id);
      return (
        /* 每张图 = 它自己的面板：标题行可折叠，右边是它自己的动作，展开才是它自己的设置。 */
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            className: "dsh-myskin-card",
            style: { display: "flex", flexDirection: "column", gap: 8, padding: 10, borderColor: isSelected ? tok.brand : void 0 },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: "dsh-myskin-head",
                    "data-open": open ? "1" : "0",
                    title: t("imagePanelHint"),
                    onClick: () => {
                      toggleImagePanel(img.id);
                    },
                    style: { flex: "1 1 auto", minWidth: 0 },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-myskin-chev", children: "\u25BE" }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: img.selector, style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isSelected ? tok.brand : void 0 }, children: ok ? elementLabel(host, 26) : anchorLabel(anchor, t) }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: "none", fontSize: 11, lineHeight: "16px", color: ok ? tok.success : tok.warn }, children: ok ? "\u2713" : "\u26A0" })
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  import_dsh_client_ui_primitives.Button,
                  {
                    style: { ...btnBase, flex: "none" },
                    size: "sm",
                    variant: isSelected ? "primary" : "ghost",
                    title: t("selectImageHint"),
                    onClick: () => {
                      onSelectImage(isSelected ? void 0 : img.id);
                    },
                    children: isSelected ? t("deselect") : t("selectImage")
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: { ...btnBase, flex: "none" }, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 14 }), title: t("remove"), onClick: () => {
                  onRemove(img.id);
                }, children: t("remove") })
              ] }),
              open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-body", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1, minWidth: 0, fontSize: 11, lineHeight: "16px", color: ok ? tok.success : tok.warn }, children: ok ? t("anchorOk") + " \xB7 " + anchorLabel(anchor, t) : t("anchorMissing") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    import_dsh_client_ui_primitives.Button,
                    {
                      style: btnBase,
                      size: "sm",
                      variant: "ghost",
                      disabled: !ok,
                      title: t("selectHostHint"),
                      onClick: () => {
                        if (host !== void 0) onSelectHost(host);
                      },
                      children: t("selectHost")
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary, minWidth: 40 }, children: t("anchor") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "select",
                    {
                      value: anchor.kind,
                      title: t("anchorHint"),
                      style: selectStyle,
                      onChange: (e) => {
                        const kind = e.target.value;
                        if (target === void 0) {
                          onAnchor(img.id, { kind, value: anchor.value, label: anchor.label });
                          return;
                        }
                        onAnchor(img.id, defaultAnchor(kind, img, target, groupAnchor));
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "element", children: t("anchorKindElement") }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "text", children: t("anchorKindText") }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "component", children: t("anchorKindComponent") }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "group", disabled: groupAnchor === void 0, children: t("anchorKindGroup") })
                      ]
                    }
                  ),
                  anchor.kind === "component" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "select",
                    {
                      value: anchor.value,
                      title: t("anchorHint"),
                      style: { ...selectStyle, flex: "1 1 90px", minWidth: 90 },
                      onChange: (e) => {
                        onAnchor(img.id, { kind: "component", value: e.target.value });
                      },
                      children: ANCHOR_COMPONENTS.map((component) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: component.id, children: t(component.labelKey) }, component.id))
                    }
                  ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    import_dsh_client_ui_primitives.Input,
                    {
                      value: anchor.value,
                      title: anchor.kind === "text" ? t("anchorTextHint") : t("anchorSelectorHint"),
                      placeholder: anchor.kind === "text" ? t("anchorTextPlaceholder") : t("anchorSelectorPlaceholder"),
                      onChange: (e) => {
                        onAnchor(img.id, { kind: anchor.kind, value: e.target.value });
                      }
                    }
                  ),
                  anchor.kind === "element" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", disabled: target === void 0, onClick: () => {
                    if (target !== void 0) onAnchor(img.id, anchorFromElement(target));
                  }, children: t("anchorUseSelected") }) : null,
                  anchor.kind === "text" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    import_dsh_client_ui_primitives.Button,
                    {
                      style: btnBase,
                      size: "sm",
                      variant: "ghost",
                      disabled: target === void 0,
                      title: t("anchorUseTextHint"),
                      onClick: () => {
                        if (target === void 0) return;
                        const copy = anchorTextOf(target);
                        if (copy !== void 0) onAnchor(img.id, { kind: "text", value: copy, label: copy });
                      },
                      children: t("anchorUseText")
                    }
                  ) : null
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary, minWidth: 40 }, children: t("imageMode") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "select",
                    {
                      value: imageModeOf(img),
                      title: t("imageModeHint"),
                      style: selectStyle,
                      onChange: (e) => {
                        onMode(img.id, e.target.value);
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "embed", children: t("imageModeEmbed") }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "anchor", children: t("imageModeAnchor") })
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: "1 1 120px", minWidth: 0, fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: imageModeOf(img) === "anchor" ? t("imageModeAnchorNote") : t("imageModeEmbedNote") })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary, minWidth: 40 }, children: t("opacity") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "range", min: 0, max: 100, value: Math.round((img.opacity ?? 1) * 100), onChange: (e) => {
                    onOpacity(img.id, Number(e.target.value) / 100);
                  }, style: { flex: "1 1 70px", minWidth: 70 } }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary }, children: t("blend") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { value: img.blend ?? "normal", onChange: (e) => {
                    onBlend(img.id, e.target.value);
                  }, style: selectStyle, children: BLEND_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: o.value, children: t(o.labelKey) }, o.value)) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: embedPaintsAbove(img, readImageLayer(draft, img.id)) ? tok.warn : tok.labelTertiary }, children: t("blendLayerNote") }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary, minWidth: 40 }, children: t("imageLayer") }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { display: "inline-flex", border: "1px solid " + tok.borderL2, borderRadius: 8, overflow: "hidden" }, children: IMAGE_LAYERS.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    import_dsh_client_ui_primitives.Button,
                    {
                      size: "sm",
                      variant: readImageLayer(draft, img.id) === entry ? "primary" : "ghost",
                      title: t(IMAGE_LAYER_HINT[entry]),
                      onClick: () => {
                        onLayer(img.id, entry);
                      },
                      children: t(IMAGE_LAYER_LABEL[entry])
                    },
                    entry
                  )) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("imageLayerHint") }),
                (img.pageKey ?? "") === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh-myskin-field", style: { gap: 6, cursor: "pointer" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "input",
                    {
                      type: "checkbox",
                      checked: readImagePageScope(draft, img.id),
                      onChange: (e) => {
                        onPageScope(img.id, e.target.checked);
                      }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { flex: 1, minWidth: 0, fontSize: 11, lineHeight: "16px", color: tok.labelSecondary }, children: [
                    t("imagePageScope"),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary }, children: t("imagePageScopeHint") })
                  ] })
                ] }),
                (() => {
                  const feather = readImageFeather(draft, img.id);
                  const setFeather = (patch) => {
                    onFeather(img.id, { ...feather, ...patch });
                  };
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary, minWidth: 40 }, children: t("imageFeather") }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
                        const next = Math.max(0, Math.min(200, feather.width + direction * (big ? 10 : 2)));
                        setFeather({ width: next });
                      }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        import_dsh_client_ui_primitives.Input,
                        {
                          value: feather.width === 0 ? "" : String(Math.round(feather.width)) + "px",
                          placeholder: t("imageFeatherOff"),
                          title: t("imageFeatherHint"),
                          onChange: (e) => {
                            const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                            setFeather({ width: cleaned.trim() === "" ? 0 : Math.min(200, Number.parseFloat(cleaned) || 0) });
                          }
                        }
                      ) })
                    ] }),
                    feather.width > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary, minWidth: 40 }, children: t("imageFeatherSoft") }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
                          setFeather({ soft: Math.max(0, Math.min(1, feather.soft + direction * (big ? 0.25 : 0.05))) });
                        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          import_dsh_client_ui_primitives.Input,
                          {
                            value: feather.soft === 0 ? "" : String(Math.round(feather.soft * 100)),
                            placeholder: t("imageFeatherOff"),
                            title: t("imageFeatherSoftHint"),
                            onChange: (e) => {
                              const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                              setFeather({ soft: cleaned.trim() === "" ? 0 : Math.min(1, (Number.parseFloat(cleaned) || 0) / 100) });
                            }
                          }
                        ) })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("imageFeatherNote") })
                    ] }) : null
                  ] });
                })(),
                axes.map((axis) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: axis.label, clearTitle: t("clearField"), clearable: false, onClear: () => void 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
                  onGeometry(img.id, { [axis.key]: round1(stepValue(img[axis.key], direction, big ? 10 : 1)) });
                }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  import_dsh_client_ui_primitives.Input,
                  {
                    value: formatOne(img[axis.key]),
                    title: t(axis.hintKey),
                    onChange: (e) => {
                      onGeometry(img.id, { [axis.key]: round1(toNum(e.target.value, img[axis.key])) });
                    }
                  }
                ) }) }, axis.key))
              ] }) : null
            ]
          },
          img.id
        )
      );
    })
  ] });
}
function RecycleBin({ entries, onRestore, onRestoreAll, t }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, { title: t("recycleBin"), badge: entries.length === 0 ? void 0 : String(entries.length), children: entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("recycleEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("recycleHint") }),
    entries.map((entry) => {
      const host = safeQuery(entry.selector);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: { gap: 6 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: entry.selector, style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: tok.labelSecondary }, children: host === null ? entry.selector : elementLabel(host, 30) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "outline", onClick: () => {
          onRestore(entry.selector);
        }, children: t("restore") })
      ] }, entry.selector);
    }),
    entries.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: onRestoreAll, children: t("restoreAll") }) }) : null
  ] }) });
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
function Inspector({ target, draft, onSample, onReplaceStyle, onClearStyle, onText, onLiveText, onRemoveText, onRemove, onHide, onUnhide, onRemoveControl, onRestoreControl, onSelectParent, onSelectChild, onEmbedFont, onRemoveFont, activeSelector, group, site, settingsView, pageView, surfaces: surfaces2, inSettings, onSurfaceHidden, onKeepOnly, onHideEverywhere, onRestoreAllHidden, onAddDeclaration, scope, onScope, gapSelector, gap, onGap, onGapEnd, onRoleFont, onRoleFontEnd, transformAuthored, t }) {
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
  const [zIndex, setZIndex] = (0, import_react.useState)("");
  const [staticPosition, setStaticPosition] = (0, import_react.useState)(false);
  const [stacking, setStacking] = (0, import_react.useState)(void 0);
  const [bgImage, setBgImage] = (0, import_react.useState)("");
  const [text, setText] = (0, import_react.useState)("");
  const [fontFamily, setFontFamily] = (0, import_react.useState)("");
  const [computedFont, setComputedFont] = (0, import_react.useState)("");
  const [fontIssue, setFontIssue] = (0, import_react.useState)(void 0);
  const fontRef = (0, import_react.useRef)(null);
  const [fontScan, setFontScan] = (0, import_react.useState)(void 0);
  const [fontQuery, setFontQuery] = (0, import_react.useState)("");
  const [fontBusy, setFontBusy] = (0, import_react.useState)(false);
  const [fontNote, setFontNote] = (0, import_react.useState)(void 0);
  const [fontTarget, setFontTarget] = (0, import_react.useState)("element");
  const [transX, setTransX] = (0, import_react.useState)("");
  const [transY, setTransY] = (0, import_react.useState)("");
  const [scale, setScale] = (0, import_react.useState)("");
  const transformFocusRef = (0, import_react.useRef)(false);
  const [touched, setTouched] = (0, import_react.useState)({});
  const [geek, setGeek] = (0, import_react.useState)(false);
  const [geekCss, setGeekCss] = (0, import_react.useState)("");
  const [geekSel, setGeekSel] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    setGeekSel(activeSelector !== "" ? activeSelector : selectorOf(target));
  }, [target, activeSelector]);
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
    transformAuthored.current = false;
    const sel2 = selectorOf(target);
    const rule2 = draft.css.find((r) => r.selector === sel2)?.rule;
    setStaticPosition(getComputedStyle(target).position === "static");
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
      setZIndex(d["z-index"] ?? "");
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
        zIndex: d["z-index"] !== void 0,
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
      setZIndex(css.zIndex === "auto" ? "" : css.zIndex);
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
  (0, import_react.useEffect)(() => {
    setStacking(stackingReport(target, isOwnElement, (el) => elementLabel(el, 32)));
  }, [target, draft.css, zIndex]);
  const applyZIndex = (value) => {
    setZIndex(value);
    touch("zIndex");
    if (staticPosition) onAddDeclaration(sel, "position: relative !important");
  };
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
    transformAuthored.current = true;
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
  const loadLocalFonts = () => {
    if (fontBusy) return;
    setFontBusy(true);
    void scanFonts(document, window).then((scan) => {
      setFontBusy(false);
      setFontScan(scan);
      setFontQuery("");
      if (scan.source === "local") {
        setFontNote(t("fontLocalCount") + " \xB7 " + String(scan.families.length));
        return;
      }
      const reason = scan.denied === true ? t("fontDenied") : t("fontProbeCount");
      setFontNote(reason + " \xB7 " + String(scan.families.length));
    }).catch(() => {
      setFontBusy(false);
      setFontScan({ source: "detected", families: [] });
      setFontNote(t("fontProbeCount") + " \xB7 0");
    });
  };
  const applyPickedFamily = (family) => {
    const quoted = quoteFamily(family);
    if (fontTarget === "element") {
      setFontFamily(quoted);
      touch("fontFamily");
      return;
    }
    onRoleFontEnd();
    onRoleFont(fontTarget, roleStackFor(quoted, fontTarget));
    setFontIssue({ text: t("roleApplied") + " \xB7 " + t(roleLabelKey(fontTarget)), kind: "ok" });
  };
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
  const sel = activeSelector !== "" ? activeSelector : selectorOf(target);
  const rule = draft.css.find((r) => r.selector === sel)?.rule;
  const fontFamilies = fontScan === void 0 ? [] : filterFamilies(fontScan.families, fontQuery);
  const activeFontFamily = (fontTarget === "element" ? fontFamily : roleFont(draft.css, fontTarget)).split(",")[0].trim().replace(/^"|"$/g, "").toLowerCase();
  const hidden = rule !== void 0 && /visibility\s*:\s*hidden/.test(rule);
  const removed = rule !== void 0 && /display\s*:\s*none/.test(rule);
  const previewTransform = transformValue(toNum(transX, 0), toNum(transY, 0), toNum(scale, 1));
  const transformDecl = transformPreview(rule, { x: toNum(transX, 0), y: toNum(transY, 0), scale: toNum(scale, 1) }, transformAuthored.current);
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
      used("zIndex") ? "z-index: " + zIndex + " !important" : "",
      used("shadow") ? "box-shadow: " + shadow + " !important" : "",
      used("textAlign") ? "text-align: " + textAlign + " !important" : ""
    ].filter((s) => s !== "").join("; ");
    onSample(sel, decl);
  }, [fontSize, fontFamily, color, bg, bgImage, weight, radius, borderColor, borderWidth, padding, width, height, margin, lineHeight, opacity, shadow, textAlign, zIndex, transX, transY, scale, touched]);
  (0, import_react.useEffect)(() => {
    if (transformFocusRef.current) return;
    transformAuthored.current = false;
    const current = parseTransform(draft.css.find((r) => r.selector === sel)?.rule);
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
  const siteGroup = site !== void 0 && site.ok ? site.scope : void 0;
  const hideRules = siteGroup === void 0 ? [] : hiddenRulesFor(draft.css, siteGroup.selector);
  const hiddenEverywhere = siteGroup !== void 0 && (hideRules.some((entry) => entry.selector === siteGroup.selector) || surfaces2.every((surface) => hiddenInSurface(draft.css, surface, siteGroup.selector)));
  const siteMissText = site === void 0 || site.ok ? t("scopeSiteHint") : site.reason === "too-generic" ? t("scopeSiteTooGeneric").replace("{n}", String(site.count)) : t("scopeSiteNoIdentity");
  const fieldLabel = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 12, lineHeight: "20px", width: "100%" };
  const style = {
    // `flex: none`: the panel is the scroller. Letting the Inspector shrink instead squeezes
    // its own content (and, at the limit, everything below it) into slivers.
    position: "relative",
    zIndex: 5,
    width: "100%",
    flex: "none",
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelTertiary }, children: t("editScope") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", border: "1px solid " + tok.borderL2, borderRadius: 8, overflow: "hidden" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: scope === "single" ? "primary" : "ghost", onClick: () => {
            onScope("single");
          }, children: t("scopeSingle") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              size: "sm",
              variant: scope === "group" ? "primary" : "ghost",
              disabled: group === void 0,
              title: group === void 0 ? t("scopeUnavailable") : t("scopeGroupHint"),
              onClick: () => {
                onScope("group");
              },
              children: group === void 0 ? t("scopeGroup") : t("scopeGroup") + " \xB7 " + t(groupLabelKey(group.kind)) + " " + String(group.count)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              size: "sm",
              variant: scope === "site" ? "primary" : "ghost",
              disabled: siteGroup === void 0,
              title: siteGroup === void 0 ? siteMissText : t("scopeSiteHint"),
              onClick: () => {
                onScope("site");
              },
              children: siteGroup === void 0 ? t("scopeSite") : t("scopeSite") + " \xB7 " + String(siteGroup.count)
            }
          )
        ] })
      ] }),
      scope === "site" && siteGroup === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.warn }, children: siteMissText }) : null,
      scope === "site" && siteGroup !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: siteGroup.count === 1 ? t("scopeSiteOne") : t("scopeSiteMany").replace("{n}", String(siteGroup.count)) }) : null,
      scope === "group" ? gapSelector === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("gapUnavailable") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("gap"), clearTitle: t("gapClear"), clearable: gap.trim() !== "", onClear: () => {
        onGap("");
        onGapEnd();
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
          onGap(gapLength(String(stepValue(toNum(gap, 0), direction, big ? 10 : 1))));
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Input,
          {
            value: gap.replace(/px$/i, ""),
            placeholder: "0",
            title: t("gapHint"),
            onChange: (e) => {
              onGap(gapLength(e.target.value));
            },
            onBlur: onGapEnd
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: "px" })
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("scopeWrites") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: scope === "single" ? tok.labelTertiary : tok.brand, fontFamily: "var(--ds-font-family-code, monospace)", wordBreak: "break-all" }, children: sel }),
      target.matches(COMPOSER_PLACEHOLDER_SELECTOR) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("placeholderTarget") }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-card", style: { display: "flex", flexDirection: "column", gap: 6, padding: 10 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: "18px", color: tok.labelSecondary }, children: t("viewCard") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: [
          t("viewCurrent"),
          inSettings ? settingsView.label : pageView?.label ?? t("viewUnknown")
        ] })
      ] }),
      surfaces2.map((surface) => {
        const hidden2 = siteGroup !== void 0 && hiddenWhile(draft.css, surface, siteGroup.selector, surfaces2);
        const isPage = surface.id === pageView?.id;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: "1 1 88px", minWidth: 0, fontSize: 12, lineHeight: "18px", color: tok.labelPrimary }, title: surface.marker, children: isPage ? t("viewThisPage") + surface.label : surface.label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", border: "1px solid " + tok.borderL2, borderRadius: 8, overflow: "hidden" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_dsh_client_ui_primitives.Button,
              {
                size: "sm",
                variant: hidden2 ? "ghost" : "primary",
                disabled: siteGroup === void 0,
                title: surface.marker,
                onClick: () => {
                  onSurfaceHidden(surface, false);
                },
                children: t("viewShown")
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_dsh_client_ui_primitives.Button,
              {
                size: "sm",
                variant: hidden2 ? "primary" : "ghost",
                disabled: siteGroup === void 0,
                title: surface.marker,
                onClick: () => {
                  onSurfaceHidden(surface, true);
                },
                children: t("viewHidden")
              }
            )
          ] })
        ] }, surface.id);
      }),
      pageView === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.warn }, children: t("viewNoPageMarker") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelTertiary }, children: t("viewPresets") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            style: btnBase,
            size: "sm",
            variant: "outline",
            disabled: siteGroup === void 0 || pageView === void 0,
            title: t("viewOnlyHereHint"),
            onClick: () => {
              if (pageView !== void 0) onKeepOnly(pageView);
            },
            children: t("viewOnlyHere")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            style: btnBase,
            size: "sm",
            variant: "outline",
            disabled: siteGroup === void 0,
            title: t("viewHideEverywhereHint"),
            onClick: onHideEverywhere,
            children: t("viewHideEverywhere")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            style: btnBase,
            size: "sm",
            variant: "outline",
            disabled: siteGroup === void 0 || hideRules.length === 0,
            title: t("viewRestoreAllHint"),
            onClick: onRestoreAllHidden,
            children: t("viewRestoreAll")
          }
        )
      ] }),
      hiddenEverywhere ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.warn }, children: t("viewAllHidden") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("viewHint") }),
      siteGroup === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.warn }, children: siteMissText }) : hideRules.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary, fontFamily: "var(--ds-font-family-code, monospace)", wordBreak: "break-all" }, children: siteGroup.selector }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.brand, fontFamily: "var(--ds-font-family-code, monospace)", wordBreak: "break-all" }, children: [
        t("viewRules"),
        hideRules.map((entry) => entry.selector).join("  ")
      ] })
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
          setTouched({});
          transformAuthored.current = false;
          setTransX("");
          setTransY("");
          setScale("");
          setGeekCss("");
          onClearStyle(geekSel);
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
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: loadLocalFonts, disabled: fontBusy, title: t("fontListHint"), children: fontBusy ? t("fontListing") : t("fontList") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
            fontRef.current?.click();
          }, title: t("embedFontHint"), children: t("embedFont") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: [
            t("fontTargetNote"),
            fontTarget === "element" ? t("fieldFont") : t(roleLabelKey(fontTarget))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: "1 1 120px", minWidth: 0, fontSize: 11, lineHeight: "16px", color: fontIssue === void 0 ? tok.labelTertiary : fontIssue.kind === "ok" ? tok.success : tok.warn }, children: fontIssue?.text ?? t("fontHint") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: fontRef, type: "file", accept: ".woff2,.woff,.ttf,.otf", style: { display: "none" }, onChange: onPickFont }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6, paddingTop: 6, borderTop: "1px solid " + tok.borderL2 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelSecondary }, children: t("fontRoles") }),
          FONT_ROLES.map((role) => {
            const value = roleFont(draft.css, role);
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t(roleLabelKey(role)), clearTitle: t("clearField"), clearable: value !== "", onClear: () => {
              onRoleFont(role, "");
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_dsh_client_ui_primitives.Input,
                {
                  value,
                  placeholder: t("roleUnset"),
                  title: t("fontRolesHint"),
                  onFocus: () => {
                    setFontTarget(role);
                  },
                  onBlur: onRoleFontEnd,
                  onChange: (e) => {
                    onRoleFont(role, e.target.value);
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_dsh_client_ui_primitives.Button,
                {
                  style: btnBase,
                  size: "sm",
                  variant: "ghost",
                  title: t("rolePickHint"),
                  onClick: () => {
                    setFontTarget(role);
                    if (fontScan === void 0) loadLocalFonts();
                  },
                  children: t("rolePick")
                }
              )
            ] }, role);
          }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("fontRolesHint") })
        ] }),
        fontScan === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-card", style: { display: "flex", flexDirection: "column", gap: 6, padding: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1, minWidth: 0, fontSize: 11, lineHeight: "16px", color: fontScan.source === "local" ? tok.success : tok.warn }, children: fontNote }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-myskin-iconbtn", title: t("close"), onClick: () => {
              setFontScan(void 0);
            }, children: "\xD7" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: fontQuery, placeholder: t("fontSearch"), onChange: (e) => {
            setFontQuery(e.target.value);
          } }),
          fontQuery.trim() === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: [
            String(fontFamilies.length),
            " / ",
            String(fontScan.families.length)
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-myskin-scroll", style: { display: "block", flex: "none", height: 156, overflowY: "auto", overflowX: "hidden" }, children: fontFamilies.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("fontListEmpty") }) : fontFamilies.map((family) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: "dsh-myskin-fontpick",
              "data-active": activeFontFamily === family.toLowerCase() ? "1" : void 0,
              title: family,
              style: { fontFamily: quoteFamily(family) },
              onClick: () => {
                applyPickedFamily(family);
              },
              children: family
            },
            family
          )) })
        ] }),
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, { title: t("groupTransform"), badge: previewTransform === "" && !used("zIndex") ? void 0 : t("customBadge"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldTransX"), clearTitle: t("clearField"), clearable: false, onClear: () => void 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
            nudge("transX", direction, big);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: transX, placeholder: "0", title: t("wheelHint"), onChange: (e) => {
            transformAuthored.current = true;
            setTransX(e.target.value);
            touch("transX");
          }, onFocus: () => {
            transformFocusRef.current = true;
          }, onBlur: () => {
            transformFocusRef.current = false;
          } }) }),
          resetButton(t("resetAxisX"), transX.trim() === "", () => {
            transformAuthored.current = true;
            clearField("transX", () => {
              setTransX("");
            });
          })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldTransY"), clearTitle: t("clearField"), clearable: false, onClear: () => void 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
            nudge("transY", direction, big);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: transY, placeholder: "0", title: t("wheelHint"), onChange: (e) => {
            transformAuthored.current = true;
            setTransY(e.target.value);
            touch("transY");
          }, onFocus: () => {
            transformFocusRef.current = true;
          }, onBlur: () => {
            transformFocusRef.current = false;
          } }) }),
          resetButton(t("resetAxisY"), transY.trim() === "", () => {
            transformAuthored.current = true;
            clearField("transY", () => {
              setTransY("");
            });
          })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldScale"), clearTitle: t("clearField"), clearable: false, onClear: () => void 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
            nudge("scale", direction, big);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: scale, placeholder: "1", title: t("wheelHintScale"), onChange: (e) => {
            transformAuthored.current = true;
            setScale(e.target.value);
            touch("scale");
          }, onFocus: () => {
            transformFocusRef.current = true;
          }, onBlur: () => {
            transformFocusRef.current = false;
          } }) }),
          resetButton(t("resetScale"), scale.trim() === "", () => {
            transformAuthored.current = true;
            clearField("scale", () => {
              setScale("");
            });
          })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t("scaleSlider"), clearTitle: t("clearField"), clearable: false, onClear: () => void 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "range", min: 20, max: 300, step: 1, value: Math.round(toNum(scale, 1) * 100), onChange: (e) => {
          transformAuthored.current = true;
          setScale(String(Number(e.target.value) / 100));
          touch("scale");
        }, style: { flex: "1 1 120px", minWidth: 120 } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t("fieldZIndex"), clearTitle: t("clearField"), clearable: used("zIndex"), onClear: () => {
          clearField("zIndex", () => {
            setZIndex("");
          });
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WheelNudge, { onStep: (direction, big) => {
            setZIndex(String(stepValue(toNum(zIndex, 0), direction, big ? 10 : 1)));
            touch("zIndex");
          }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: zIndex, placeholder: t("zIndexAuto"), title: t("zIndexHint"), onChange: (e) => {
            setZIndex(e.target.value);
            touch("zIndex");
          } }) }),
          Z_INDEX_PRESETS.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              style: btnBase,
              size: "sm",
              variant: "ghost",
              title: t("zIndexPresetHint"),
              onClick: () => {
                setZIndex(String(value));
                touch("zIndex");
              },
              children: String(value)
            },
            value
          ))
        ] }),
        stacking === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 4, paddingTop: 4, borderTop: "1px solid " + tok.borderL2 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary, wordBreak: "break-word" }, children: [
            t("zIndexNow"),
            "z-index ",
            stacking.zIndex,
            " \xB7 position ",
            stacking.position,
            " \xB7 ",
            t("zIndexContext"),
            stacking.context === void 0 ? t("zIndexContextRoot") : elementLabel(stacking.context, 32) + "\uFF08" + (stacking.contextReason ?? "") + "\uFF09"
          ] }),
          stacking.context !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.warn }, children: t("zIndexTrapped") }) : null,
          stacking.neighbours.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary }, children: t("zIndexNoOverlap") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary, wordBreak: "break-word" }, children: [
            t("zIndexNeighbours").replace("{n}", String(stacking.neighbours.length)),
            stacking.neighbours.map((entry) => " \xB7 " + entry.label + " z=" + entry.zIndex).join("")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "outline", title: t("zIndexTopHint"), onClick: () => {
              applyZIndex(String(stacking.above));
            }, children: t("zIndexTop").replace("{n}", String(stacking.above)) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "outline", title: t("zIndexBottomHint"), onClick: () => {
              applyZIndex(String(stacking.below));
            }, children: t("zIndexBottom").replace("{n}", String(stacking.below)) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
            transformAuthored.current = true;
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
        scope === "group" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.warn }, children: t("textScopeNote") }) : null,
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
function TokenPanel({ tokens, compat = false, onToggle, onChange, t }) {
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
          const skipped = compat && isBackgroundToken(item.name);
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-myskin-field", style: rowStyle2, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: on, onChange: (e) => {
              onToggle(item.name, e.target.checked);
            }, style: { accentColor: "var(--dsw-alias-brand-primary)", width: 14, height: 14, cursor: "pointer", flex: "none" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: 14, height: 14, borderRadius: 5, border: "1px solid " + tok.borderL2, background: on ? cur : tok.bgLayer2, flex: "none" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: skipped ? { ...nameStyle, color: tok.labelTertiary } : nameStyle, children: item.name }),
            skipped ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary, whiteSpace: "nowrap" }, children: t("compatTokenTag") }) : null,
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
  intro: "DSH \u5168\u517C\u5BB9\u76AE\u80A4\u53EF\u89C6\u5316\u7F16\u8F91\u6846\u67B6\uFF08dsh-myskin\uFF09\uFF1A\u5728\u8FD9\u91CC\u7BA1\u7406\u3001\u9884\u89C8\u5E76\u53EF\u89C6\u5316\u81EA\u5B9A\u4E49\u4F60\u7684\u76AE\u80A4\u3002\u76AE\u80A4\u662F\u5B8C\u5168\u53EF\u9006\u7684\u8986\u76D6\u5C42\uFF0C\u4E0D\u5F71\u54CD DSH \u6B63\u5E38\u8FD0\u884C\u3002",
  enabled: "\u542F\u7528\u76AE\u80A4",
  skinLabel: "\u5F53\u524D\u76AE\u80A4",
  preset: "\u9884\u8BBE\u4E3B\u9898",
  presetDefault: "\u9ED8\u8BA4",
  presetDeep: "\u6DF1\u6D77",
  presetWarm: "\u6696\u9633",
  presetRose: "\u7C89\u9EDB",
  edit: "\u7ED8\u5236\u6A21\u5F0F",
  editMenu: "\u7F16\u8F91\u83DC\u5355",
  apply: "\u5E94\u7528",
  reset: "\u8FD8\u539F\u9ED8\u8BA4",
  saved: "\u5DF2\u4FDD\u5B58",
  disabled: "\u672A\u542F\u7528",
  enabledOn: "\u5DF2\u542F\u7528",
  enabledOff: "\u672A\u542F\u7528",
  compat: "\u517C\u5BB9\u6A21\u5F0F",
  compatOn: "\u5DF2\u5F00\u542F",
  compatOff: "\u5DF2\u5173\u95ED",
  compatHint: "\u517C\u5BB9\u6A21\u5F0F\uFF1A\u4E0D\u63A5\u7BA1\u80CC\u666F\u3002\u522B\u4EBA\u5728\u753B\u80CC\u666F\uFF08\u58C1\u7EB8 / \u73BB\u7483 / \u684C\u9762\u58F3\u7279\u6548\uFF09\u65F6\u7528\u5B83\uFF1A\u4E0D\u753B\u80CC\u666F\u56FE\u3001\u4E0D\u5199\u80CC\u666F\u7C7B\u4EE4\u724C\uFF08--dsw-alias-bg-*\u3001--dsw-specific-sidebar-fill\uFF09\u3001\u4E0D\u5199\u533A\u57DF/\u9762\u677F\u5E95\u8272\uFF0C\u4E5F\u4E0D\u8981\u6C42\u58C1\u7EB8\u63D2\u4EF6\u8BA9\u8DEF\uFF1B\u914D\u8272\u3001\u8FB9\u6846\u3001\u6A21\u7CCA\u3001\u5706\u89D2\u3001\u6309\u94AE\u3001\u89C4\u5219\u3001\u6587\u5B57\u3001\u56FE\u5C42\u7167\u5E38\u3002\u8FD9\u4E9B\u503C\u4ECD\u4FDD\u5B58\u5728\u6587\u6863\u91CC\uFF0C\u5173\u6389\u672C\u6A21\u5F0F\u5373\u6062\u590D\u3002",
  compatTokenTag: "\u517C\u5BB9\u6A21\u5F0F\uFF1A\u4E0D\u5199",
  compatPanelTag: "\u517C\u5BB9\u6A21\u5F0F\uFF1A\u5E95\u8272\u4E0D\u5199",
  compatAutoHint: "\u68C0\u6D4B\u5230\u58C1\u7EB8\u63D2\u4EF6 dsh-plugin-wallpaper-engine\uFF1A\u5DF2\u81EA\u52A8\u5F00\u542F\u517C\u5BB9\u6A21\u5F0F\uFF08\u80CC\u666F\u4EA4\u7ED9\u5B83\uFF09\u3002\u70B9\u4E00\u4E0B\u5F00\u5173\u5373\u660E\u786E\u5173\u95ED\u3002",
  variantCompatHint: "\u517C\u5BB9\u6A21\u5F0F\u5DF2\u5F00\u542F\uFF1A\u53D8\u4F53\u53EA\u5199\u8FB9\u6846 / \u6A21\u7CCA / \u5706\u89D2 / \u9634\u5F71\u4E0E\u6392\u7248\uFF0C\u9762\u677F\u5E95\u8272\u7559\u7ED9\u522B\u4EBA\u3002",
  compatBackgroundHint: "\u517C\u5BB9\u6A21\u5F0F\u5DF2\u5F00\u542F\uFF1A\u80CC\u666F\u56FE\u4E0E\u80CC\u666F\u5F3A\u5EA6\u4E0D\u751F\u6548\uFF08\u5728\u300C\u76AE\u80A4\u7BA1\u7406\u300D\u91CC\u5173\u95ED\u517C\u5BB9\u6A21\u5F0F\uFF09\u3002",
  none: "\uFF08\u65E0\u81EA\u5B9A\u4E49\u76AE\u80A4\uFF09",
  addImage: "\u6DFB\u52A0\u56FE\u7247",
  editText: "\u7F16\u8F91\u6587\u5B57",
  remove: "\u79FB\u9664",
  hide: "\u9690\u85CF\u63A7\u4EF6",
  exportSkin: "\u5BFC\u51FA\u76AE\u80A4",
  importSkin: "\u5BFC\u5165\u76AE\u80A4",
  importError: "\u5BFC\u5165\u5931\u8D25\uFF1A",
  importedOk: "\u2713 \u5DF2\u5BFC\u5165\u76AE\u80A4\u5305",
  exportedOk: "\u2713 \u5DF2\u5BFC\u51FA\u76AE\u80A4\u5305\uFF08.dshframework\uFF09",
  assetsLabel: "\u8D44\u6E90",
  skinPackHint: "\u76AE\u80A4\u5305 = .dshframework\uFF08\u7C7B zip \u5BB9\u5668\uFF09\uFF1Amanifest.json \u662F\u5B8C\u6574\u914D\u7F6E\uFF0Cassets/ \u91CC\u662F\u539F\u6837\u7684\u56FE\u7247\u4E0E\u5B57\u4F53\u6587\u4EF6\uFF0C\u53EF\u76F4\u63A5\u66FF\u6362\u540E\u91CD\u65B0\u5BFC\u5165\uFF1B\u65E7\u7684 .dshskin \u4E0E .json \u5BFC\u51FA\u4ECD\u53EF\u5BFC\u5165\u3002",
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
  backgroundAnchor: "\u58C1\u7EB8\u8DDF\u968F\u5BF9\u8BDD\u533A",
  backgroundAnchorHint: "\u4FA7\u8FB9\u680F\u5C55\u5F00 / \u6536\u8D77\u65F6\uFF0C\u5BF9\u8BDD\u533A\u91CC\u7684\u58C1\u7EB8\u4F1A\u91CD\u65B0\u5C45\u4E2D\uFF08\u951A\u5728\u5BF9\u8BDD\u533A\u81EA\u5DF1\u7684\u6846\u4E0A\uFF0C\u4E0D\u7528\u811A\u672C\uFF09\u3002\u4FA7\u8FB9\u680F\u4ECD\u662F\u6574\u9875\u90A3\u4E00\u4EFD\uFF0C\u6240\u4EE5\u4E24\u8FB9\u53D6\u666F\u4F1A\u4E0D\u540C\u2014\u2014\u8FD9\u5C31\u662F\u300C\u53EA\u5728\u5BF9\u8BDD\u533A\u5C45\u4E2D\u300D\u7684\u4EE3\u4EF7\u3002",
  tabComponent: "\u7EC4\u4EF6",
  tabImage: "\u56FE\u7247",
  tabText: "\u6587\u5B57",
  tabMarkdown: "\u5BF9\u8BDD",
  tabLook: "\u753B\u9762",
  tabHint: "\u6BCF\u7C7B\u7F16\u8F91\u4E00\u4E2A\u9875\u7B7E\uFF1A\u4E0D\u540C\u7C7B\u578B\u4E0D\u518D\u6324\u5728\u540C\u4E00\u6761\u6EDA\u52A8\u91CC\u3002",
  textPanelHint: "\u8FD9\u4E9B\u662F\u76AE\u80A4\u6539\u8FC7\u7684\u6587\u6848\u3002\u53EF\u4EE5\u5728\u4E0B\u9762\u76F4\u63A5\u6539\uFF0C\u6216\u70B9\u300C\u9009\u4E2D\u5BB9\u5668\u300D\u628A\u753B\u5E03\u5E26\u5230\u5B83\u8EAB\u4E0A\u3002",
  textEmpty: "\u8FD8\u6CA1\u6709\u6539\u8FC7\u6587\u6848\uFF1A\u5728\u300C\u7EC4\u4EF6\u300D\u91CC\u9009\u4E2D\u4E00\u6BB5\u6587\u5B57\uFF0C\u6539\u5B83\u7684\u5185\u5BB9\u5373\u53EF\u3002",
  textBefore: "\u539F\u6587",
  textAfter: "\u6539\u6210",
  textNew: "\u65B0\u589E",
  tabRegion: "\u533A\u57DF",
  tabVariant: "\u53D8\u4F53",
  variantTitle: "\u53D8\u4F53\uFF08\u6574\u5957\u89C2\u611F\uFF09",
  variantHint: "\u5148\u9009\u4E00\u6574\u5957\uFF0C\u518D\u6309\u7EF4\u5EA6\u5FAE\u8C03\uFF0C\u6216\u628A\u4F5C\u7528\u5BF9\u8C61\u5207\u5230\u67D0\u4E00\u5904\u5355\u72EC\u6539\u2014\u2014\u5168\u662F\u70B9\u9009\uFF0C\u4E0D\u9700\u8981\u5199 CSS\u3002\u6539\u7684\u662F\u76AE\u80A4\u6587\u6863\uFF0C\u968F\u65F6\u53EF\u64A4\u9500\u3002",
  variantResetHint: "\u6E05\u6389\u53D8\u4F53\u5199\u4E0B\u7684\u533A\u57DF\u89C4\u5219\u4E0E\u4EE4\u724C\uFF08\u5176\u5B83\u89C4\u5219\u4E0D\u52A8\uFF09",
  variantNote: "\u300C\u53D8\u4F53\u300D\u4E0E\u300C\u533A\u57DF\u300D\u300C\u5BF9\u8BDD\u300D\u5199\u7684\u662F\u540C\u4E00\u6279\u5C5E\u6027\uFF1A\u540E\u6539\u7684\u8986\u76D6\u5148\u6539\u7684\u3002\u4F5C\u7528\u5BF9\u8C61\u53EA\u7EA6\u675F\u533A\u57DF\u5C5E\u6027\u3002",
  variantScope: "\u4F5C\u7528\u5BF9\u8C61",
  variantScopeAll: "\u5168\u90E8\u533A\u57DF",
  variantScopeHint: "\u70B9\u4E00\u5904\uFF0C\u8FD9\u6B21\u53EA\u6539\u90A3\u4E00\u5904\uFF08\u5706\u89D2 / \u8D28\u611F / \u5E95\u8272 / \u5185\u8FB9\u8DDD\uFF09\uFF1B\u5BC6\u5EA6\u91CC\u7684\u6392\u7248\u4EE4\u724C\u4E0E\u5F3A\u8C03\u8272\u662F\u5168\u5C40\u7684\uFF0C\u6CA1\u6709\u5206\u533A\u5F62\u6001\u3002",
  variantGlobalHint: "\u6392\u7248\u4E0E\u5F3A\u8C03\u8272\u59CB\u7EC8\u5168\u5C40",
  variantFrame: "\u8D28\u611F",
  variantFrameGlass: "\u73BB\u7483",
  variantFrameGlassHint: "\u80CC\u666F\u6A21\u7CCA + \u7EC6\u767D\u8FB9\u6846 + \u8F7B\u9634\u5F71\uFF08\u4E0D\u542B\u5E95\u8272\uFF1A\u5E95\u8272\u5728\u4E0B\u9762\u5355\u72EC\u4E00\u6863\uFF09",
  variantFrameOutline: "\u63CF\u8FB9",
  variantFrameOutlineHint: "\u53EA\u52A0\u4E00\u6761\u8FB9\u6846\uFF0C\u4E0D\u8981\u6A21\u7CCA\u3001\u4E0D\u8981\u9634\u5F71",
  variantFrameNone: "\u65E0",
  variantFrameNoneHint: "\u4EC0\u4E48\u90FD\u4E0D\u52A0\uFF1A\u6CA1\u6709\u6A21\u7CCA\u3001\u8FB9\u6846\u3001\u9634\u5F71",
  variantFill: "\u5E95\u8272",
  variantFillGlass: "\u73BB\u7483\u767D",
  variantFillGlassHint: "\u534A\u900F\u660E\u767D\uFF0842%\u201372%\uFF0C\u6309\u9762\u7684\u5927\u5C0F\u5206\u6863\uFF09\uFF1A\u58C1\u7EB8\u4F1A\u900F\u4E0A\u6765",
  variantFillCard: "\u5361\u7247\u8272",
  variantFillCardHint: "\u7528\u4E3B\u9898\u7684\u5361\u7247\u8272\uFF08--dsw-alias-bg-layer-1\uFF09\uFF0C\u4E0D\u900F\u660E",
  variantFillNone: "\u900F\u660E",
  variantFillNoneHint: "\u4E0D\u753B\u5E95\u8272\uFF1A\u7559\u7ED9\u58C1\u7EB8 / \u522B\u7684\u63D2\u4EF6\u3002\u4E0E\u300C\u73BB\u7483\u300D\u8D28\u611F\u642D\u914D\uFF1D\u6709\u73BB\u7483\u8FB9\u7F18\u4F46\u4E0D\u76D6\u80CC\u666F",
  variantRadius: "\u5706\u89D2",
  variantCorners: "\u56DB\u89D2\u5355\u72EC\u8C03",
  variantCornersHint: "\u5C55\u5F00\u540E\u6BCF\u4E00\u89D2\u5355\u72EC\u70B9\u9009\uFF1B\u6CA1\u70B9\u8FC7\u7684\u89D2\u8DDF\u968F\u4E0A\u9762\u7684\u7EDF\u4E00\u5706\u89D2\uFF08\u4E24\u8005\u53EF\u4EE5\u5E76\u5B58\uFF09\u3002",
  variantCornerFollow: "\u8DDF\u968F\u7EDF\u4E00\u5706\u89D2",
  variantRadiusSquare: "\u76F4\u89D2",
  variantRadiusSquareHint: "0\uFF1A\u786C\u6717\u3001\u5229\u843D",
  variantRadiusS: "\u5C0F",
  variantRadiusSHint: "8px",
  variantRadiusM: "\u4E2D",
  variantRadiusMHint: "14px",
  variantRadiusL: "\u5927",
  variantRadiusLHint: "20px\uFF1A\u5361\u7247\u611F\u66F4\u5F3A",
  variantRadiusPill: "\u80F6\u56CA",
  variantRadiusPillHint: "28px\uFF1A\u975E\u5E38\u5706\u6DA6",
  variantDensity: "\u5BC6\u5EA6",
  variantDensityTight: "\u7D27\u51D1",
  variantDensityTightHint: "\u6B63\u6587 13px\uFF0C\u5185\u8FB9\u8DDD 10px\uFF1A\u4E00\u5C4F\u770B\u5230\u66F4\u591A",
  variantDensityNormal: "\u6807\u51C6",
  variantDensityNormalHint: "\u6B63\u6587 14px\uFF0C\u5185\u8FB9\u8DDD 14px",
  variantDensityLoose: "\u5BBD\u677E",
  variantDensityLooseHint: "\u6B63\u6587 15px\uFF0C\u5185\u8FB9\u8DDD 20px\uFF1A\u66F4\u597D\u8BFB",
  variantAccent: "\u5F3A\u8C03\u8272",
  variantAccentTheme: "\u8DDF\u968F\u4E3B\u9898",
  variantAccentThemeHint: "\u7528 DSH \u81EA\u5DF1\u7684\u54C1\u724C\u8272\uFF08\u4E0D\u8986\u76D6\u4EE4\u724C\uFF09",
  variantAccentBlue: "\u84DD",
  variantAccentBlueHint: "\u6C89\u9759\u7684\u84DD\uFF0C\u4EAE\u6697\u5404\u4E00\u6863",
  variantAccentViolet: "\u7D2B",
  variantAccentVioletHint: "\u504F\u7D2B\u7684\u5F3A\u8C03\u8272",
  variantAccentTeal: "\u9752",
  variantAccentTealHint: "\u9752\u7EFF\uFF0C\u504F\u51B7",
  variantAccentRose: "\u7C89",
  variantAccentRoseHint: "\u73AB\u7C89\uFF0C\u504F\u6696",
  variantLookGlass: "\u73BB\u7483\u901A\u900F",
  variantLookGlassHint: "\u73BB\u7483\u8D28\u611F + \u73BB\u7483\u767D\u5E95\u8272 + \u5927\u5706\u89D2 + \u6807\u51C6\u5BC6\u5EA6\uFF08\u6700\u63A5\u8FD1\u53C2\u8003\u56FE\uFF09",
  variantLookPaper: "\u7EB8\u7247\u6E05\u723D",
  variantLookPaperHint: "\u65E0\u8D28\u611F + \u5361\u7247\u8272\u5E95\u8272 + \u4E2D\u5706\u89D2 + \u6807\u51C6\u5BC6\u5EA6",
  variantLookQuiet: "\u6781\u7B80\u5B89\u9759",
  variantLookQuietHint: "\u65E0\u8D28\u611F + \u900F\u660E\u5E95\u8272\uFF1A\u5B8C\u5168\u8BA9\u5F00\u80CC\u666F\uFF0C\u5C0F\u5706\u89D2 + \u7D27\u51D1\u5BC6\u5EA6",
  variantLookVivid: "\u5F20\u626C",
  variantLookVividHint: "\u73BB\u7483\u8D28\u611F + \u73BB\u7483\u767D\u5E95\u8272 + \u80F6\u56CA\u5706\u89D2 + \u5BBD\u677E\u5BC6\u5EA6 + \u7D2B\u8272\u5F3A\u8C03",
  regionTitle: "\u533A\u57DF\u5916\u89C2",
  regionHint: "\u6574\u5757\u6539\uFF1A\u5BF9\u8BDD\u533A\u3001\u4FA7\u8FB9\u680F\u3001\u8F93\u5165\u6846\u3001\u8BBE\u7F6E\u9875\u3001\u6D88\u606F\u5217\u8868\u3002\u951A\u70B9\u53D6\u5BB9\u5668\u7C7B\u540D\u7684\u8BED\u4E49\u534A\u622A\u6216 data-* \u94A9\u5B50\uFF0C\u5347\u7EA7 DSH \u4E0D\u4F1A\u5931\u6548\u3002",
  regionFound: "\u672C\u9875\u547D\u4E2D {n} \u4E2A\u5143\u7D20\uFF0C\u6539\u52A8\u5373\u65F6\u751F\u6548",
  regionMissing: "\u672C\u9875\u6CA1\u6709\u8FD9\u4E2A\u533A\u57DF\uFF08\u6362\u5230\u6709\u5B83\u7684\u754C\u9762\uFF0C\u6216\u8FD9\u4E2A\u7248\u672C\u7684\u951A\u70B9\u53D8\u4E86\uFF09",
  regionConversation: "\u5BF9\u8BDD\u533A",
  regionConversationHint: "\u5BF9\u8BDD\u6240\u5728\u7684\u4E2D\u95F4\u90A3\u4E00\u5217",
  regionSidebar: "\u4FA7\u8FB9\u680F",
  regionSidebarHint: "\u5DE6\u4FA7\u680F\uFF08\u5DE5\u4F5C\u533A\u4E0E\u4F1A\u8BDD\u5217\u8868\uFF09",
  regionRightSidebar: "\u53F3\u4FA7\u4FA7\u8FB9\u680F",
  regionRightSidebarHint: "DSH \u81EA\u5E26\u7684\u53F3\u4FA7\u680F\uFF08\u6587\u6863\u9884\u89C8 / \u6587\u4EF6 / \u6D4F\u89C8\u5668 / \u7EC8\u7AEF\u7B49\u9762\u677F\u90FD\u5728\u8FD9\u91CC\uFF09\u3002\u951A\u70B9\u662F\u5B83\u53D1\u5E03\u7684 [data-dockkit-pane]\uFF0C\u9762\u677F\u672A\u6253\u5F00\u65F6\u547D\u4E2D\u6570\u4E3A 0\uFF0C\u5C5E\u6B63\u5E38\u3002",
  regionComposer: "\u8F93\u5165\u6846",
  regionComposerHint: "\u5E95\u90E8\u8F93\u5165\u5361\u7247\uFF08data-composer-card / seat\uFF09",
  regionSettings: "\u8BBE\u7F6E\u9875",
  regionSettingsHint: "\u8BBE\u7F6E\u5F39\u7A97\u672C\u4F53",
  regionMessages: "\u6D88\u606F\u5217\u8868",
  regionMessagesHint: "\u4F1A\u8BDD\u6EDA\u52A8\u533A\uFF08data-conversation-content\uFF09",
  regionBg: "\u80CC\u666F",
  regionRadius: "\u5706\u89D2",
  regionRadiusTL: "\u5DE6\u4E0A\u89D2",
  regionRadiusTR: "\u53F3\u4E0A\u89D2",
  regionRadiusBR: "\u53F3\u4E0B\u89D2",
  regionRadiusBL: "\u5DE6\u4E0B\u89D2",
  regionCornersHint: "\u5706\u89D2\uFF1A\u4E0A\u9762\u9009\u4E00\u4E2A\u7EDF\u4E00\u503C\uFF1B\u4E0B\u9762\u56DB\u89D2\u7559\u7A7A\uFF1D\u8DDF\u968F\u7EDF\u4E00\u503C\uFF0C\u5355\u72EC\u586B\u4E86\u5C31\u53EA\u6539\u90A3\u4E00\u89D2\uFF08\u7EDF\u4E00\u503C\u7EE7\u7EED\u7BA1\u5176\u4F59\u4E09\u89D2\uFF09\u3002",
  regionRadiusDefault: "\u9ED8\u8BA4",
  regionRadiusS: "\u5C0F 8",
  regionRadiusM: "\u4E2D 14",
  regionRadiusL: "\u5927 20",
  regionRadiusXL: "\u7279\u5927 28",
  regionShadow: "\u9634\u5F71",
  regionShadowNone: "\u65E0",
  regionShadowSoft: "\u8F7B",
  regionShadowMedium: "\u4E2D",
  regionShadowStrong: "\u91CD",
  regionBlur: "\u80CC\u666F\u6A21\u7CCA",
  regionBorderColor: "\u8FB9\u6846\u8272",
  regionBorderWidth: "\u8FB9\u6846\u5BBD",
  regionBorderStyle: "\u663E\u793A\u8FB9\u6846",
  regionPad: "\u5185\u8FB9\u8DDD",
  regionGap: "\u95F4\u8DDD",
  regionOpacity: "\u4E0D\u900F\u660E\u5EA6",
  regionPresetGlass: "\u73BB\u7483",
  regionPresetGlassHint: "\u534A\u900F\u660E + \u80CC\u666F\u6A21\u7CCA + \u5927\u5706\u89D2 + \u8F7B\u9634\u5F71\uFF08\u53C2\u8003\u56FE\u90A3\u79CD\u8D28\u611F\uFF09",
  regionPresetPaper: "\u7EB8\u7247",
  regionPresetPaperHint: "\u4E0D\u900F\u660E\u3001\u5706\u89D2\u3001\u4E2D\u9634\u5F71\uFF0C\u8FB9\u6846\u53BB\u6389",
  regionPresetFlat: "\u6781\u7B80",
  regionPresetFlatHint: "\u53EA\u6709\u5706\u89D2\uFF1A\u65E0\u8FB9\u6846\u3001\u65E0\u9634\u5F71\u3001\u65E0\u6A21\u7CCA",
  regionResetHint: "\u5220\u6389\u533A\u57DF\u5916\u89C2\u5199\u4E0B\u7684\u5168\u90E8\u89C4\u5219\uFF08\u5176\u5B83\u89C4\u5219\u4E0D\u52A8\uFF09",
  mdTitle: "\u5BF9\u8BDD\u6392\u7248\uFF08Markdown\uFF09",
  mdHint: '\u4F5C\u7528\u4E8E DSH \u751F\u6210\u7684 markdown\uFF08\u4F1A\u8BDD\u6B63\u6587\u3001\u601D\u8003\u3001\u5DE5\u5177\u8F93\u51FA\uFF09\u3002\u951A\u70B9\u662F\u6E32\u67D3\u5668\u81EA\u5DF1\u7684\u6839\u5143\u7D20\uFF08[class*="_markdown"]\uFF09\uFF0C\u4E0D\u5199\u6B7B\u6784\u5EFA\u54C8\u5E0C\uFF0C\u5347\u7EA7 DSH \u4E0D\u4F1A\u5931\u6548\uFF1Bcompact \u53D8\u4F53\uFF08\u5DE5\u5177\u9884\u89C8\uFF09\u4E0D\u53D7\u5F71\u54CD\u3002',
  mdFound: "\u672C\u9875\u6709 {n} \u5904 markdown\uFF0C\u6539\u52A8\u5373\u65F6\u751F\u6548",
  mdEffective: "\u7070\u5B57\u662F\u672C\u9875**\u5F53\u524D\u751F\u6548**\u7684\u503C\uFF08\u53EF\u80FD\u6765\u81EA DSH\u3001\u53D8\u4F53\u6216\u5176\u5B83\u89C4\u5219\uFF09\u2014\u2014\u586B\u4E86\u624D\u4F1A\u8986\u76D6\u5B83\u3002",
  mdMissing: "\u672C\u9875\u6CA1\u6709 markdown \u8F93\u51FA\uFF08\u6253\u5F00\u4E00\u6BB5\u5BF9\u8BDD\u518D\u770B\u6548\u679C\uFF09",
  mdScopeConversation: "\u4EC5\u5BF9\u8BDD\u6B63\u6587",
  mdScopeConversationHint: "\u53EA\u4F5C\u7528\u4E8E\u5BF9\u8BDD\u533A\uFF08data-conversation-content\uFF09\u91CC\u7684 markdown\uFF0C\u5DE5\u5177\u4E0E\u4FA7\u680F\u8F93\u51FA\u4FDD\u6301\u539F\u6837",
  mdTokensGroup: "\u5B57\u53F7\u4E0E\u884C\u9AD8\uFF08\u4EE4\u724C\uFF09",
  mdTokensHint: "\u6539\u7684\u662F DSH \u81EA\u5DF1\u7684 --dsw-font-markdown-* \u5206\u91CF\u4EE4\u724C\uFF1A\u6574\u5757\u5B57\u53F7/\u884C\u9AD8/\u5B57\u91CD\u4E00\u8D77\u52A8\uFF0C\u6BD4\u5199\u6B7B\u58F0\u660E\u66F4\u7A33\u3002\u4EAE\u6697\u4E24\u5957\u5171\u7528\u8FD9\u4E00\u4E2A\u503C\uFF0C\u8981\u5206\u5F00\u8BBE\u8BF7\u53BB\u4EE4\u724C\u9762\u677F\u3002",
  mdTokenSplit: "\u4EAE/\u6697\u5F53\u524D\u4E0D\u540C\u503C\uFF08\u4EE4\u724C\u9762\u677F\u91CC\u5206\u522B\u8BBE\u8FC7\uFF09",
  mdTokBaseSize: "\u6B63\u6587\u5B57\u53F7",
  mdTokBaseLine: "\u6B63\u6587\u884C\u9AD8",
  mdTokH1Size: "H1 \u5B57\u53F7",
  mdTokH2Size: "H2 \u5B57\u53F7",
  mdTokH3Size: "H3 \u5B57\u53F7",
  mdTokH4Size: "H4\u2013H6 \u5B57\u53F7",
  mdTokCodeSize: "\u884C\u5185\u4EE3\u7801\u5B57\u53F7",
  mdTokCodeBlockSize: "\u4EE3\u7801\u5757\u5B57\u53F7",
  mdTokInlineCodeBg: "\u884C\u5185\u4EE3\u7801\u80CC\u666F",
  mdTokCodeBlockBg: "\u4EE3\u7801\u5757\u80CC\u666F",
  mdTokCodeBannerBg: "\u4EE3\u7801\u5757\u6807\u9898\u680F\u80CC\u666F",
  mdTokLink: "\u94FE\u63A5\u8272",
  mdHGapBottom: "\u6807\u9898\u4E0B\u95F4\u8DDD",
  mdInlineCodePad: "\u884C\u5185\u4EE3\u7801\u5185\u8FB9\u8DDD",
  mdLinkWeight: "\u94FE\u63A5\u5B57\u91CD",
  mdHrHeight: "\u5206\u9694\u7EBF\u7C97\u7EC6",
  mdScopeLabel: "\u4F5C\u7528\u8303\u56F4",
  mdScopeAll: "\u5168\u90E8\u8F93\u51FA",
  mdScopeAllHint: "\u4F1A\u8BDD\u6B63\u6587\u3001\u601D\u8003\u3001\u5DE5\u5177\u8F93\u51FA\u91CC\u7684 markdown \u90FD\u6309\u8FD9\u5957\u6392\u7248",
  mdClear: "\u6E05\u9664\u8FD9\u4E00\u9879",
  mdUnset: "\u672A\u8BBE\u7F6E",
  mdReset: "\u6062\u590D\u9ED8\u8BA4",
  mdResetHint: "\u5220\u6389\u672C\u5361\u5199\u5165\u7684\u5168\u90E8 markdown \u89C4\u5219\uFF08\u624B\u5199\u7684\u89C4\u5219\u4E0D\u53D7\u5F71\u54CD\uFF09",
  mdPresetTight: "\u7D27\u51D1",
  mdPresetNormal: "\u6807\u51C6",
  mdPresetLoose: "\u5BBD\u677E",
  mdGroupText: "\u6B63\u6587",
  mdGroupHeading: "\u6807\u9898",
  mdGroupList: "\u5217\u8868",
  mdGroupQuote: "\u5F15\u7528",
  mdGroupCode: "\u4EE3\u7801",
  mdGroupTable: "\u8868\u683C",
  mdGroupMisc: "\u94FE\u63A5\u4E0E\u5176\u5B83",
  mdParaGap: "\u6BB5/\u5217\u8868\u95F4\u8DDD",
  mdHWeight: "\u6807\u9898\u5B57\u91CD",
  mdHGap: "\u6807\u9898\u4E0A\u95F4\u8DDD",
  mdLiGap: "\u6761\u76EE\u95F4\u8DDD",
  mdLiMarker: "\u6807\u8BB0\u8272",
  mdListIndent: "\u5217\u8868\u7F29\u8FDB",
  mdQuoteBorder: "\u5DE6\u8FB9\u6846\u8272",
  mdQuoteWidth: "\u5DE6\u8FB9\u6846\u5BBD",
  mdQuoteColor: "\u6587\u5B57\u8272",
  mdQuoteBg: "\u80CC\u666F\u8272",
  mdInlineCodeColor: "\u884C\u5185\u4EE3\u7801\u6587\u5B57",
  mdInlineCodeRadius: "\u884C\u5185\u4EE3\u7801\u5706\u89D2",
  mdPreBg: "\u4EE3\u7801\u5757\u80CC\u666F",
  mdPrePad: "\u4EE3\u7801\u5757\u5185\u8FB9\u8DDD",
  mdTableBorder: "\u8FB9\u6846\u8272",
  mdTableHeadBg: "\u8868\u5934\u80CC\u666F",
  mdTablePad: "\u5355\u5143\u683C\u5185\u8FB9\u8DDD",
  mdTableZebra: "\u6591\u9A6C\u7EB9\uFF08\u5076\u6570\u884C\u5E95\u8272\uFF09",
  mdHrColor: "\u5206\u9694\u7EBF\u989C\u8272",
  mdHrGap: "\u5206\u9694\u7EBF\u95F4\u8DDD",
  mdImgRadius: "\u56FE\u7247\u5706\u89D2",
  mdImgMax: "\u56FE\u7247\u6700\u5927\u5BBD",
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
  saveFailedCanvas: "canvas \u88AB\u5BBF\u4E3B\u62D2\u7EDD\u3002\u6700\u5E38\u89C1\u539F\u56E0\uFF1A\u5BBF\u4E3B schema \u6BD4\u5BA2\u6237\u7AEF\u65E7\uFF08\u88C5\u4E86\u65B0\u7248\u672C\u4F46\u6CA1\u91CD\u542F DSH\uFF09\uFF0C\u6B64\u65F6\u4EFB\u4F55\u542B\u65B0\u951A\u70B9\uFF08\u6574\u7EC4\uFF09\u7684\u753B\u5E03\u90FD\u4F1A\u6574\u4F53\u88AB\u62D2\u2014\u2014\u53EF\u5148\u628A\u8BE5\u56FE\u7247\u951A\u70B9\u6539\u56DE\u300C\u5143\u7D20\u300D\u4FDD\u5B58\uFF0C\u6216\u91CD\u542F DSH\uFF08\u6CE8\u610F\uFF1A\u91CD\u542F\u4F1A\u7ED3\u675F\u5F53\u524D\u4F1A\u8BDD\uFF09\u3002",
  gifKept: "\u52A8\u56FE\u5DF2\u6309\u539F\u6837\u5D4C\u5165\uFF08\u4FDD\u7559\u52A8\u753B\uFF09\xB7 {n}\u2014\u2014\u6BD4\u9759\u6B62\u56FE\u91CD\uFF0C\u4FDD\u5B58\u4F1A\u6162\u4E00\u70B9",
  gifStilled: "\u52A8\u56FE\u8D85\u51FA\u6587\u6863\u9884\u7B97\uFF08\u7EA6 3 MB \u7684 base64\uFF09\uFF0C\u5DF2\u6309\u9759\u6B62\u56FE\u5D4C\u5165\uFF1A\u53EA\u4FDD\u7559\u7B2C\u4E00\u5E27\uFF08\u52A8\u753B\u4E22\u5931\uFF09",
  saveFailedCanvasLarge: "\u753B\u5E03\u6570\u636E\u7EA6 {n} KB\uFF08\u56FE\u7247\u4EE5 data URL \u5185\u5D4C\u5728 canvas \u91CC\uFF09\uFF1A\u82E5\u5BBF\u4E3B\u5BF9\u8BBE\u7F6E\u5728\u5927\u5C0F\u4E0A\u6709\u9650\u5236\uFF0C\u6362\u4E00\u5F20\u66F4\u5C0F\u7684\u56FE\u5373\u53EF\u3002",
  imageTooLarge: "\u56FE\u7247\u8FC7\u5927\u4E14\u538B\u7F29\u540E\u4ECD\u65E0\u6CD5\u4FDD\u5B58\uFF0C\u8BF7\u6362\u4E00\u5F20\u66F4\u5C0F\u7684\u56FE",
  imageCompressed: "\u56FE\u7247\u5DF2\u81EA\u52A8\u538B\u7F29\uFF0C\u4FDD\u8BC1\u4FDD\u5B58\u4F53\u79EF\u53EF\u63A7",
  elementActions: "\u5143\u7D20\u64CD\u4F5C",
  // —— 0.3.8 绘制模式 UI ——
  modeHint: "\u9009\u62E9\uFF1A\u70B9\u51FB\u9875\u9762\u5143\u7D20\u5373\u9009\u4E2D\uFF1B\u4EA4\u4E92\uFF1A\u6B63\u5E38\u4F7F\u7528\u9875\u9762\uFF08\u6EDA\u52A8\u3001\u70B9\u51FB\u4E0D\u89E6\u53D1\u9009\u4E2D\uFF09",
  undoHint: "\u64A4\u9500\uFF08Ctrl/Cmd+Z\uFF09",
  redoHint: "\u91CD\u505A\uFF08Ctrl/Cmd+Shift+Z\uFF09",
  embedImageHint: "\u5148\u9009\u4E2D\u4E00\u4E2A\u5BB9\u5668\uFF0C\u518D\u5D4C\u5165\u56FE\u7247",
  panelLabel: "\u9762\u677F",
  panelShowHint: "\u5C55\u5F00\u9762\u677F\uFF08\u9875\u9762\u81EA\u52A8\u8BA9\u51FA\u4F4D\u7F6E\uFF09",
  panelHideHint: "\u6536\u8D77\u9762\u677F\u67E5\u770B\u6574\u9875\uFF08\u9875\u9762\u4F1A\u81EA\u52A8\u94FA\u6EE1\uFF09",
  // —— 0.4.0 面板停靠 / 遮挡诊断 ——
  dockLeft: "\u9762\u677F\u9760\u5DE6",
  dockRight: "\u9762\u677F\u9760\u53F3",
  dockLeftHint: "\u628A\u9762\u677F\u4E0E\u9875\u9762\u5185\u7F29\u4E00\u8D77\u6362\u5230\u5DE6\u4FA7\u3002\u7B2C\u4E09\u65B9\u63D2\u4EF6\u82E5\u628A\u754C\u9762\u56FA\u5B9A\u5728\u7A97\u53E3\u53F3\u4FA7\uFF08position: fixed\uFF09\uFF0C\u5B83\u4E0D\u4F1A\u968F\u9875\u9762\u5185\u7F29\u79FB\u52A8\uFF0C\u6B63\u597D\u88AB\u53F3\u4FA7\u9762\u677F\u538B\u4F4F\u2014\u2014\u6362\u5230\u5DE6\u4FA7\u5C31\u80FD\u770B\u89C1\u3001\u4E5F\u80FD\u70B9\u4E2D\u5B83",
  dockRightHint: "\u628A\u9762\u677F\u6362\u56DE\u53F3\u4FA7\uFF08\u9ED8\u8BA4\u505C\u9760\uFF09",
  occludedWarn: "\u9762\u677F\u6321\u4F4F\u4E86 {n}",
  // {n} = 被压住的那个组件的名字（例如 button.icon_x · 发送）
  occludedHint: "\u5B83\u56FA\u5B9A\u5728\u7A97\u53E3\u8FB9\u7F18\uFF0C\u4E0D\u4F1A\u968F\u9875\u9762\u5185\u7F29\u79FB\u52A8\uFF0C\u6240\u4EE5\u88AB\u9762\u677F\u538B\u4F4F\u4E86\uFF1A\u70B9\u4E00\u4E0B\u628A\u9762\u677F\u505C\u9760\u5230\u53E6\u4E00\u4FA7\uFF0C\u5B83\u7ACB\u523B\u53EF\u89C1\u53EF\u70B9",
  resetHint: "\u8FD8\u539F\u9ED8\u8BA4\uFF1A\u6E05\u7A7A\u6574\u5957\u76AE\u80A4\u3001\u56DE\u5230 DSH \u539F\u751F\u5916\u89C2\uFF08\u76AE\u80A4\u5E93\u91CC\u7684\u5DF2\u5B58\u76AE\u80A4\u4FDD\u7559\uFF09",
  resetConfirm: "\u8FD8\u539F\u4F1A\u6E05\u7A7A\u6574\u5957\u76AE\u80A4\uFF08\u542B\u5DF2\u4FDD\u5B58\u7684\u90A3\u4EFD\uFF09\uFF0C\u786E\u5B9A\uFF1F",
  resetGo: "\u786E\u5B9A\u8FD8\u539F",
  resetDone: "\u2713 \u5DF2\u8FD8\u539F\u4E3A DSH \u539F\u751F\u5916\u89C2",
  applyHint: "\u5199\u5165\u5E76\u542F\u7528\uFF0C\u7136\u540E\u9000\u51FA\u7ED8\u5236\u6A21\u5F0F",
  saveDraft: "\u4FDD\u5B58",
  saveHint: "\u5199\u5165\u76AE\u80A4\u6587\u6863\uFF0C\u7EE7\u7EED\u7559\u5728\u7ED8\u5236\u6A21\u5F0F\uFF08\u4E0D\u6539\u53D8\u76AE\u80A4\u7684\u542F\u7528\u72B6\u6001\uFF09",
  savedHint: "\u2713 \u5DF2\u5199\u5165\u76AE\u80A4\u6587\u6863\uFF0C\u53EF\u7EE7\u7EED\u7F16\u8F91",
  closeHint: "\u76F4\u63A5\u5173\u95ED\u5E76\u820D\u5F03\u672A\u4FDD\u5B58\u7684\u6539\u52A8\uFF08\u8981\u5199\u5165\u76AE\u80A4\u8BF7\u70B9\u300C\u4FDD\u5B58\u300D\u6216\u300C\u5E94\u7528\u300D\uFF09",
  shortcuts: "Esc \u53D6\u6D88\u9009\u62E9\uFF08\u518D\u6309\u9000\u51FA\u5E76\u820D\u5F03\uFF09 \xB7 Ctrl+Z \u64A4\u9500 \xB7 Alt+\u2191\u2193 \u5C42\u7EA7",
  emptyTitle: "\u5F00\u59CB\u7ED8\u5236",
  emptySteps: "\u70B9\u51FB\u9875\u9762\u5143\u7D20\u9009\u4E2D\u5B83 \u2192 \u5728\u9762\u677F\u91CC\u6539\u6837\u5F0F\u6216\u6587\u5B57 \u2192 \u70B9\u300C\u5E94\u7528\u300D\u5199\u5165\u76AE\u80A4",
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
  fontTargetNote: "\u300C\u672C\u673A\u5B57\u4F53\u300D\u5217\u8868\u5F53\u524D\u5199\u5165\uFF1A",
  fontRoles: "\u6574\u7AD9\u5B57\u4F53",
  roleUi: "\u754C\u9762",
  roleText: "\u6B63\u6587",
  roleCode: "\u4EE3\u7801",
  roleUnset: "\u7EE7\u627F\u9ED8\u8BA4",
  rolePick: "\u672C\u673A",
  rolePickHint: "\u4ECE\u300C\u672C\u673A\u5B57\u4F53\u300D\u5217\u8868\u91CC\u6311\u4E00\u4E2A\u5199\u5165\u8FD9\u4E00\u9879\uFF08\u4F1A\u9644\u5E26\u540C\u7C7B\u515C\u5E95\u5B57\u4F53\uFF0C\u4FBF\u4E8E\u6362\u673A\u4F7F\u7528\uFF09",
  roleApplied: "\u2713 \u5DF2\u5E94\u7528",
  fontRolesHint: "\u754C\u9762 = \u5168\u5C40\u57FA\u51C6\uFF08DSH \u7684 --dsw-font-family\uFF09\uFF1B\u6B63\u6587 = \u5BF9\u8BDD\u5185\u5BB9\u4E0E markdown \u7684\u8986\u76D6\uFF1B\u4EE3\u7801 = \u4EE3\u7801\u5757/\u884C\u5185\u4EE3\u7801/\u4EE3\u7801\u7F16\u8F91\u5668\uFF08--ds-font-family-code\uFF09\u3002\u4E09\u8005\u4E92\u4E0D\u5E72\u6270\u3001\u53EF\u5404\u81EA\u6E05\u9664\uFF1B\u6B63\u6587\u5B57\u4F53\u4E0D\u4F1A\u62A2\u8D70\u4EE3\u7801\u5B57\u4F53\u3002",
  fontHint: "\u53EF\u76F4\u63A5\u8F93\u5165\u4EFB\u610F\u5B57\u4F53\u540D\uFF08\u7CFB\u7EDF\u5B57\u4F53\u4E5F\u884C\uFF09\uFF0C\u5B57\u4F53\u6808\u53EF\u6574\u6BB5\u7C98\u8D34",
  fontEmbedded: "\u2713 \u5B57\u4F53\u5DF2\u5D4C\u5165\u5E76\u5E94\u7528\u5230\u8BE5\u5143\u7D20",
  fontTooLarge: "\u5B57\u4F53\u6587\u4EF6\u8FC7\u5927\uFF08\u4E0A\u9650 30 MB\uFF09",
  fontHeavy: "\u26A0 \u5B57\u4F53\u5DF2\u5D4C\u5165\uFF0C\u4F46\u5B83\u4F1A\u968F\u76AE\u80A4\u6587\u6863\u6574\u4EFD\u91CD\u53D1\uFF1A\u6BCF\u6B21\u4FDD\u5B58\u90FD\u4F1A\u53D8\u6162\uFF0C\u5BFC\u51FA\u7684 .dshframework \u91CC\u5219\u662F\u539F\u6837\u6587\u4EF6",
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
  scaleGripHint: "\u62D6\u52A8\uFF1A\u7B49\u6BD4\u7F29\u653E",
  // —— 0.3.9 回收站 / 本机字体 / 位移 ——
  recycleBin: "\u56DE\u6536\u7AD9",
  recycleEmpty: "\u6682\u65E0\u88AB\u79FB\u9664\u7684\u7EC4\u4EF6",
  recycleHint: "\u88AB\u300C\u79FB\u9664\u63A7\u4EF6\uFF08\u4E0D\u5360\u4F4D\uFF09\u300D\u7684\u7EC4\u4EF6\u7559\u5728\u8FD9\u91CC\uFF1A\u5B83\u5DF2\u4E0D\u53C2\u4E0E\u9875\u9762\u70B9\u51FB\uFF0C\u753B\u5E03\u4E0A\u4E5F\u9009\u4E0D\u4E2D\uFF0C\u53EA\u80FD\u4ECE\u8FD9\u91CC\u6062\u590D\u3002",
  restore: "\u6062\u590D",
  restoreAll: "\u5168\u90E8\u6062\u590D",
  fontList: "\u672C\u673A\u5B57\u4F53",
  fontListing: "\u8BFB\u53D6\u4E2D\u2026",
  fontListHint: "\u8BFB\u53D6\u672C\u673A\u5DF2\u5B89\u88C5\u7684\u5B57\u4F53\u5E76\u5217\u6210\u5217\u8868\uFF08Chromium \u5185\u6838\u9996\u6B21\u4F7F\u7528\u9700\u6388\u6743\uFF1B\u4E0D\u652F\u6301\u8BE5\u63A5\u53E3\u7684\u6D4F\u89C8\u5668\u9000\u5316\u4E3A\u5E38\u89C1\u5B57\u4F53\u63A2\u6D4B\uFF09",
  fontSearch: "\u641C\u7D22\u5B57\u4F53",
  fontListEmpty: "\u6CA1\u6709\u5339\u914D\u7684\u5B57\u4F53",
  fontLocalCount: "\u672C\u673A\u5B57\u4F53",
  fontProbeCount: "\u68C0\u6D4B\u5230\u7684\u5E38\u89C1\u5B57\u4F53\uFF08\u5F53\u524D\u6D4F\u89C8\u5668\u65E0\u6CD5\u679A\u4E3E\u672C\u673A\u5B57\u4F53\uFF09",
  fontDenied: "\u672A\u83B7\u5F97\u5B57\u4F53\u8BBF\u95EE\u6388\u6743\uFF0C\u5DF2\u9000\u5316\u4E3A\u5E38\u89C1\u5B57\u4F53\u63A2\u6D4B",
  // —— 0.3.9 嵌入图片锚定 ——
  imageMode: "\u5448\u73B0",
  imageModeEmbed: "\u7EC4\u4EF6\u5D4C\u5165\uFF08\u7EC4\u4EF6\u5185\uFF09",
  imageModeAnchor: "\u7EC4\u4EF6\u951A\u5B9A\uFF08\u7EC4\u4EF6\u5916\uFF09",
  imageModeHint: "\u7EC4\u4EF6\u5D4C\u5165\uFF1A\u753B\u5728\u7EC4\u4EF6\u5185\u90E8\uFF0C\u968F\u7EC4\u4EF6\u7684\u88C1\u526A\uFF1B\u7EC4\u4EF6\u951A\u5B9A\uFF1A\u753B\u5728\u7EC4\u4EF6\u4E4B\u5916\u7684\u72EC\u7ACB\u56FE\u5C42\uFF0C\u53EF\u9732\u51FA\u7EC4\u4EF6\u8FB9\u754C\uFF0C\u4E14\u5B8C\u5168\u4E0D\u52A8\u8BE5\u7EC4\u4EF6\u81EA\u8EAB\u7684\u5B9A\u4F4D\u4E0E\u88C1\u526A",
  imageModeEmbedNote: "\u753B\u5728\u7EC4\u4EF6\u5185\u90E8\uFF08\u8DDF\u968F\u88C1\u526A\uFF0C\u4E0D\u4F1A\u8D85\u51FA\u7EC4\u4EF6\uFF09",
  imageModeAnchorNote: "\u753B\u5728\u7EC4\u4EF6\u5916\u7684\u72EC\u7ACB\u56FE\u5C42\uFF08\u4E0D\u4F1A\u88AB\u88C1\u526A\uFF0C\u53EF\u8D1F\u504F\u79FB\u9732\u5230\u7EC4\u4EF6\u5916\uFF09",
  anchor: "\u951A\u5B9A",
  embedImages: "\u5D4C\u5165\u56FE\u7247",
  embedImagesHint: "\u6BCF\u5F20\u56FE\u4E00\u4E2A\u9762\u677F\uFF1A\u70B9\u6807\u9898\u5C55\u5F00\u5B83\u81EA\u5DF1\u7684\u8BBE\u7F6E\uFF0C\u4E0D\u5FC5\u5148\u627E\u5230\u5B83\u5D4C\u5728\u54EA\u513F\u3002",
  selectHost: "\u9009\u4E2D\u5BB9\u5668",
  imageSelected: "\u6B63\u5728\u7F16\u8F91\u7684\u56FE\u7247",
  imageSelectedHint: "\u753B\u5E03\u4E0A\u53EA\u7559\u8FD9\u4E00\u4E2A\u9009\u4E2D\u6846\uFF08\u548C\u9009\u4E2D\u7EC4\u4EF6\u540C\u7EA7\uFF09\uFF1A\u62D6\u52A8\u79FB\u52A8\u3001\u53F3\u4E0B\u89D2\u7F29\u653E\uFF1B\u5B83\u7684\u8BBE\u7F6E\u5728\u4E0B\u9762\u90A3\u5F20\u5DF2\u5C55\u5F00\u7684\u9762\u677F\u91CC\u3002\u70B9\u9875\u9762\u5176\u5B83\u5143\u7D20\u6216\u6309 Esc \u5373\u9000\u51FA\u3002",
  selectImage: "\u9009\u4E2D",
  imageLayer: "\u5C42\u7EA7",
  imageLayerAuto: "\u81EA\u52A8",
  imageLayerAutoHint: "\u81EA\u52A8\uFF1A\u9009\u4E86\u6DF7\u5408\u6A21\u5F0F\u5C31\u753B\u5728\u5185\u5BB9\u4E4B\u4E0A\uFF08\u5426\u5219\u6DF7\u5408\u770B\u4E0D\u51FA\u6548\u679C\uFF09\uFF0Cnormal \u65F6\u753B\u5728\u5185\u5BB9\u4E4B\u4E0B",
  imageLayerBelow: "\u5185\u5BB9\u4E4B\u4E0B",
  imageLayerBelowHint: "\u5185\u5BB9\u4E4B\u4E0B\uFF1A\u4E0D\u6321\u5BB9\u5668\u91CC\u7684\u6587\u5B57\u4E0E\u6309\u94AE\uFF0C\u4F46\u5BB9\u5668\u91CC\u4E0D\u900F\u660E\u7684\u5B50\u5143\u7D20\u4F1A\u76D6\u4F4F\u5B83",
  imageLayerAbove: "\u5185\u5BB9\u4E4B\u4E0A",
  imageLayerAboveHint: "\u5185\u5BB9\u4E4B\u4E0A\uFF1A\u4E00\u5B9A\u770B\u5F97\u89C1\uFF08\u6B63\u9762\u671D\u4E0A\uFF09\uFF0C\u4EE3\u4EF7\u662F\u4F1A\u76D6\u5728\u5BB9\u5668\u5185\u5BB9\u4E0A\u9762\u2014\u2014\u9002\u5408\u8BBE\u7F6E\u9875\u5361\u7247\u8FD9\u79CD\u5185\u5BB9\u4E0D\u900F\u660E\u7684\u5BB9\u5668",
  imageFeather: "\u8FB9\u7F18\u6655\u67D3",
  imageFeatherOff: "\u5173",
  imageFeatherHint: "\u7FBD\u5316\u5BBD\u5EA6\uFF08px\uFF09\uFF1A0 = \u5173\u3002\u6655\u67D3\u4F1A\u5411\u5916\u6269\u5F20\u56FE\u7247\uFF0C\u786C\u8FB9\u56E0\u6B64\u5316\u8FDB\u80CC\u666F",
  imageFeatherSoft: "\u67D4\u5316",
  imageFeatherSoftHint: "\u8FB9\u7F18\u8FC7\u6E21\u7684\u67D4\u548C\u5EA6 0\u2013100\uFF1A0 = \u76F4\u7EBF\u8870\u51CF\uFF0C100 = S \u66F2\u7EBF\uFF08\u4E24\u7AEF\u66F4\u7F13\uFF09\u3002\u53EA\u6539\u8FC7\u6E21\u66F2\u7EBF\uFF0C\u4E0D\u6A21\u7CCA\u753B\u9762\u3002",
  imageFeatherNote: "\u6655\u67D3\u4F1A\u8BA9\u8FB9\u7F18\u5411\u5185\u5403\u6389\u7EA6\u8FD9\u4E2A\u5BBD\u5EA6\uFF0C\u5E76\u5411\u5916\u6655\u51FA\u7EA6\u56DB\u5206\u4E4B\u4E00\uFF08\u56FE\u6846\u4E0D\u52A8\uFF0C\u6240\u4EE5\u753B\u9762\u770B\u8D77\u6765\u7565\u5C0F\u4E00\u70B9\uFF09\uFF1B\u60F3\u5B8C\u5168\u4E0D\u53D7\u5BB9\u5668\u88C1\u526A\uFF0C\u7528\u300C\u7EC4\u4EF6\u951A\u5B9A\u300D\u3002",
  imageLayerHint: "\u770B\u4E0D\u89C1\u56FE\u65F6\u5148\u8BD5\u300C\u5185\u5BB9\u4E4B\u4E0A\u300D\uFF1B\u8981\u5B8C\u5168\u4E0D\u53D7\u5BB9\u5668\u88C1\u526A\uFF0C\u628A\u300C\u5448\u73B0\u65B9\u5F0F\u300D\u6539\u6210\u7EC4\u4EF6\u951A\u5B9A\u3002",
  imagePageScope: "\u53EA\u5728\u5D4C\u5165\u5B83\u7684\u8BBE\u7F6E\u9875\u663E\u793A",
  imagePageScopeHint: "\u9ED8\u8BA4\u5982\u6B64\uFF1A\u8FD9\u5F20\u56FE\u662F\u5728\u8BBE\u7F6E\u9875\u91CC\u5D4C\u7684\uFF0C\u522B\u7684\u8BBE\u7F6E\u9875\u4E0D\u4F1A\u51FA\u73B0\u5B83\u3002\u53D6\u6D88\u52FE\u9009\uFF1D\u6BCF\u4E2A\u8BBE\u7F6E\u9875\u90FD\u663E\u793A\u3002",
  imgDiagOk: "\u2713 \u5E94\u8BE5\u53EF\u89C1\uFF08\u951A\u70B9\u5DF2\u89E3\u6790\u3001\u5C42\u7EA7\u4E0E\u5BB9\u5668\u5C3A\u5BF8\u90FD\u6CA1\u95EE\u9898\uFF09",
  imgDiagUnresolved: "\u26A0 \u951A\u70B9\u5F53\u524D\u89E3\u6790\u4E0D\u5230\u4EFB\u4F55\u5143\u7D20\uFF1A\u8FD9\u5F20\u56FE\u7684\u89C4\u5219\u5339\u914D\u4E0D\u5230\u4E1C\u897F\uFF0C\u9875\u9762\u4E0A\u4E0D\u4F1A\u6709\u5B83",
  imgDiagPageScope: "\u26A0 \u8FD9\u5F20\u56FE\u53EA\u5728\u5D4C\u5165\u65F6\u6240\u5728\u7684\u8BBE\u7F6E\u9875\u663E\u793A\uFF08\u6362\u4E86\u8BBE\u7F6E\u9875\u5C31\u4F1A\u88AB\u6536\u8D77\uFF09\u2014\u2014\u8FD9\u662F\u65E2\u6709\u7684\u6309\u9875\u4F5C\u7528\u57DF",
  imgDiagCovered: "\u26A0 \u88AB\u5BB9\u5668\u91CC\u7684\u5185\u5BB9\u76D6\u4F4F\u4E86\uFF1A\u5B83\u5728\u300C\u5185\u5BB9\u4E4B\u4E0B\u300D\uFF0C\u800C\u5BB9\u5668\u91CC\u4E0D\u900F\u660E\u7684\u5B50\u5143\u7D20\u6321\u4F4F\u4E86\u5B83\u2014\u2014\u628A\u300C\u5C42\u7EA7\u300D\u6539\u6210\u300C\u5185\u5BB9\u4E4B\u4E0A\u300D\u5373\u53EF",
  imgDiagClipped: "\u26A0 \u88AB\u5BB9\u5668\u88C1\u526A\uFF1A\u56FE\u7247\u6BD4\u5BB9\u5668\u5927\uFF08\u5BB9\u5668\u53EA\u6709\u5B83\u7684\u4E00\u90E8\u5206\uFF09\u2014\u2014\u628A\u300C\u5448\u73B0\u65B9\u5F0F\u300D\u6539\u6210\u7EC4\u4EF6\u951A\u5B9A\uFF0C\u6216\u8C03\u5C0F\u5C3A\u5BF8",
  imagePanelHint: "\u5C55\u5F00 / \u6536\u8D77\u8FD9\u5F20\u56FE\u81EA\u5DF1\u7684\u8BBE\u7F6E",
  selectImageHint: "\u9009\u4E2D\u8FD9\u5F20\u56FE\uFF08\u753B\u5E03\u4E0A\u53EA\u5269\u5B83\u7684\u6846\uFF0C\u9762\u677F\u9876\u90E8\u5207\u6210\u5B83\uFF09",
  deselect: "\u53D6\u6D88\u9009\u62E9",
  selectHostHint: "\u5728\u753B\u5E03\u4E0A\u9009\u4E2D\u8FD9\u5F20\u56FE\u6240\u5728\u7684\u5BB9\u5668\uFF08\u951A\u70B9\u5F53\u524D\u89E3\u6790\u4E0D\u5230\u65F6\u4E0D\u53EF\u7528\uFF09",
  blendLayerNote: "\u6DF7\u5408\u6A21\u5F0F\u8981\u548C\u80CC\u540E\u7684\u9875\u9762\u6DF7\uFF0C\u6240\u4EE5\u8FD9\u4E00\u5C42\u4F1A\u753B\u5230\u5185\u5BB9\u4E4B\u4E0A\uFF1Bnormal \u65F6\u753B\u5728\u5185\u5BB9\u4E4B\u4E0B\uFF08\u4E0D\u6321\u5DE5\u4F5C\u533A\u884C\u4E0E\u6309\u94AE\uFF09\u3002",
  imageAxisX: "X \u504F\u79FB\uFF08\u76F8\u5BF9\u5BB9\u5668\u5DE6\u4E0A\u89D2\uFF09",
  imageAxisY: "Y \u504F\u79FB",
  imageAxisW: "\u5BBD\u5EA6",
  imageAxisH: "\u9AD8\u5EA6",
  anchorKindElement: "\u5143\u7D20",
  anchorKindText: "\u6587\u5B57",
  anchorKindComponent: "\u5185\u7F6E\u7EC4\u4EF6",
  anchorKindGroup: "\u6574\u7EC4\uFF08\u540C\u7C7B\u7684\u6BCF\u4E00\u4E2A\uFF09",
  anchorUseSelected: "\u7528\u5F53\u524D\u9009\u4E2D",
  anchorUseText: "\u53D6\u9009\u4E2D\u6587\u5B57",
  anchorUseTextHint: "\u628A\u5F53\u524D\u9009\u4E2D\u5143\u7D20\u627F\u8F7D\u7684\u90A3\u6BB5\u6587\u5B57\u8BBE\u4E3A\u951A\u70B9\uFF08\u6539\u7248\u6362\u6587\u6848\u4E5F\u627E\u5F97\u5230\uFF09",
  anchorOk: "\u2713 \u5DF2\u951A\u5B9A",
  anchorMissing: "\u26A0 \u5F53\u524D\u9875\u9762\u4E0A\u627E\u4E0D\u5230\u8FD9\u4E2A\u951A\u70B9\uFF0C\u56FE\u7247\u4E0D\u4F1A\u663E\u793A",
  anchorHint: "\u951A\u5B9A\u51B3\u5B9A\u56FE\u7247\u8DDF\u968F\u8C01\uFF1A\u5143\u7D20\uFF08\u7ED3\u6784\u9009\u62E9\u5668\uFF09/ \u6587\u5B57\uFF08\u8DDF\u7740\u8FD9\u6BB5\u6587\u6848\uFF09/ \u5185\u7F6E\u7EC4\u4EF6\uFF08\u8F93\u5165\u533A\u3001\u4F1A\u8BDD\u5217\u7B49\u56FA\u5B9A\u90E8\u4F4D\uFF09",
  anchorTextHint: "\u56FE\u7247\u8DDF\u968F\u627F\u8F7D\u8FD9\u6BB5\u6587\u5B57\u7684\u5143\u7D20\uFF1B\u6587\u5B57\u6539\u4E86\u5C31\u91CD\u65B0\u53D6\u4E00\u6B21",
  anchorSelectorHint: "CSS \u9009\u62E9\u5668\uFF1B\u9875\u9762\u6539\u7248\u540E\u53EF\u80FD\u5931\u6548\uFF0C\u53EF\u76F4\u63A5\u6539\u7528\u300C\u6587\u5B57\u300D\u6216\u300C\u5185\u7F6E\u7EC4\u4EF6\u300D",
  anchorTextPlaceholder: "\u8981\u8DDF\u968F\u7684\u6587\u5B57",
  anchorSelectorPlaceholder: "CSS \u9009\u62E9\u5668",
  compApp: "\u6574\u4E2A\u5E94\u7528",
  compFrame: "\u5E94\u7528\u5916\u6846",
  compColumn: "\u5BF9\u8BDD\u4E3B\u5217",
  compSession: "\u4F1A\u8BDD\u5185\u5BB9\u533A",
  compView: "\u4F1A\u8BDD\u89C6\u56FE",
  compComposer: "\u8F93\u5165\u533A\uFF08\u5E95\u90E8\uFF09",
  compComposerInput: "\u8F93\u5165\u6846",
  compPlaceholder: "\u65B0\u5BF9\u8BDD\u5360\u4F4D\u6587\u5B57",
  compTree: "\u5DE5\u4F5C\u533A / \u4F1A\u8BDD\u6811",
  // —— 0.3.9 组块编辑 ——
  editScope: "\u7F16\u8F91\u8303\u56F4",
  scopeSingle: "\u4EC5\u6B64\u5143\u7D20",
  scopeGroup: "\u6574\u7EC4",
  scopeGroupHint: "\u6574\u7EC4\uFF1A\u6539\u4E00\u6B21\uFF0C\u540C\u7C7B\u7684\u5143\u7D20\u4E00\u8D77\u53D8\uFF08\u5305\u62EC\u4E4B\u540E\u65B0\u5EFA\u7684\uFF09",
  // —— 全站作用域（跨界面：对话 / 插件 / 设置） ——
  scopeSite: "\u5168\u7AD9",
  scopeSiteHint: "\u5168\u7AD9\uFF1A\u53EA\u7528\u5143\u7D20\u81EA\u8EAB\u7684\u6807\u8BC6\uFF08\u7C7B\u540D / data-* \u5C5E\u6027 / role\uFF09\u751F\u6210\u9009\u62E9\u5668\uFF0C\u4E0D\u5E26\u4EFB\u4F55\u7956\u5148\u8DEF\u5F84\u2014\u2014\u6240\u4EE5\u8FD9\u4E2A\u7EC4\u4EF6\u51FA\u73B0\u5728\u54EA\u4E2A\u754C\u9762\uFF08\u5BF9\u8BDD / \u63D2\u4EF6 / \u8BBE\u7F6E\uFF09\u90FD\u8DDF\u7740\u53D8\uFF0C\u4E4B\u540E\u65B0\u5EFA\u7684\u5B9E\u4F8B\u4E5F\u4E00\u6837",
  scopeSiteOne: "\u5F53\u524D\u53EA\u547D\u4E2D 1 \u5904\uFF1A\u8FD9\u662F\u201C\u8FD9\u4E2A\u7EC4\u4EF6\u201D\uFF0C\u4E0D\u662F\u201C\u53EA\u6709\u8FD9\u4E00\u4E2A\u201D\u2014\u2014\u5B83\u5728\u522B\u7684\u754C\u9762\u51FA\u73B0\u65F6\u4F1A\u7167\u6837\u5339\u914D",
  scopeSiteMany: "\u5F53\u524D\u547D\u4E2D {n} \u5904\uFF08\u753B\u5E03\u4E0A\u63CF\u4E86\u865A\u7EBF\u6846\uFF09\uFF1A\u5B83\u4EEC\u4F1A\u4E00\u8D77\u53D8\uFF0C\u4E4B\u540E\u65B0\u5EFA\u7684\u5B9E\u4F8B\u4E5F\u4E00\u6837",
  scopeSiteNoIdentity: "\u8FD9\u4E2A\u5143\u7D20\u6CA1\u6709\u53EF\u590D\u7528\u7684\u6807\u8BC6\uFF08\u6CA1\u6709\u7C7B\u540D\u3001\u6CA1\u6709\u53EF\u7528\u7684 data-*\u3001\u4E5F\u6CA1\u6709 role\uFF09\uFF0C\u5168\u7AD9\u6539\u4E0D\u4E86\u5B83\u2014\u2014\u6362\u4E00\u4E2A\u66F4\u201C\u5B8C\u6574\u201D\u7684\u5143\u7D20\u8BD5\u8BD5",
  scopeSiteTooGeneric: "\u8FD9\u4E2A\u5143\u7D20\u7684\u6807\u8BC6\u592A\u6CDB\u4E86\uFF08\u547D\u4E2D {n} \u5904\uFF09\uFF0C\u5168\u7AD9\u4F1A\u6539\u5230\u592A\u591A\u65E0\u5173\u7684\u4E1C\u897F\u2014\u2014\u6362\u4E00\u4E2A\u66F4\u5177\u4F53\u7684\u5143\u7D20\u8BD5\u8BD5",
  // —— 按界面显示 / 隐藏（对话 vs 设置·插件页） ——
  viewCard: "\u754C\u9762\u663E\u793A",
  viewHint: "\u6309\u754C\u9762\u5206\u5F00\u63A7\u5236\u8FD9\u4E2A\u7EC4\u4EF6\uFF1A\u9009\u300C\u4E0D\u663E\u793A\u300D\u5C31\u5728\u90A3\u4E2A\u754C\u9762\u91CC\u9690\u85CF\u5B83\u3002\u89C4\u5219\u662F body:has(<\u754C\u9762\u6807\u8BB0>) + \u7EC4\u4EF6\u6807\u8BC6\uFF0C\u6807\u8BB0\u53D6\u4E0A\u6E38\u81EA\u5DF1\u7684\u8BED\u4E49\u5C5E\u6027\uFF08\u8BBE\u7F6E\u5F39\u7A97\u7684 data-shortcut-modal\u3001\u63D2\u4EF6\u9875\u7684 data-plugin-panel\u2026\uFF09\uFF0C\u6240\u4EE5\u300C\u6BCF\u4E2A\u754C\u9762\u5404\u6E32\u67D3\u4E00\u4EFD\u300D\u548C\u300C\u4E00\u4E2A\u5168\u5C40\u8282\u70B9\u76D6\u5728\u6240\u6709\u754C\u9762\u4E0A\u300D\u4E24\u79CD\u63D2\u4EF6\u90FD\u7BA1\u5F97\u4F4F\u3002\u8BBF\u95EE\u8FC7\u7684\u9875\u9762\u4F1A\u88AB\u81EA\u52A8\u8BB0\u4F4F\uFF08\u6700\u591A 8 \u4E2A\uFF09\uFF0C\u4E0B\u6B21\u4E0D\u7528\u518D\u5207\u8FC7\u53BB\u3002",
  viewSettings: "\u8BBE\u7F6E\u5F39\u7A97",
  viewSettingsHint: "\u6253\u5F00\u8BBE\u7F6E\u5F39\u7A97\u65F6\u7B97\u8FD9\u4E2A\u754C\u9762\uFF08\u8BBE\u7F6E\u3001\u5FEB\u6377\u952E\u7F16\u8F91\u5668\uFF09\u3002\u63D2\u4EF6\u9875\u4E0D\u662F\u5F39\u7A97\u2014\u2014\u5B83\u662F\u4E3B\u533A\u57DF\u91CC\u7684\u53E6\u4E00\u4E2A\u9875\u9762\uFF0C\u7528\u4E0B\u9762\u90A3\u884C\u5355\u72EC\u63A7\u5236",
  viewThisPage: "\u672C\u9875\uFF1A",
  viewUnknown: "\u5F53\u524D\u9875\u9762\uFF08\u6CA1\u6709\u53EF\u8BC6\u522B\u7684\u6807\u8BB0\uFF09",
  viewNoPageMarker: "\u8FD9\u4E2A\u9875\u9762\u6CA1\u6709\u53EF\u8BC6\u522B\u7684\u8BED\u4E49\u6807\u8BB0\uFF08\u6CA1\u6709 data-slot / data-* \u5C5E\u6027\uFF09\uFF0C\u6CA1\u6CD5\u53EA\u5728\u8FD9\u91CC\u9690\u85CF\u2014\u2014\u8BF7\u7528\u6781\u5BA2\u6A21\u5F0F\u624B\u5199\u9009\u62E9\u5668\uFF0C\u6216\u6539\u5728\u522B\u7684\u754C\u9762\u4E0A\u9690\u85CF\u3002",
  viewCurrent: "\u5F53\u524D\u754C\u9762\uFF1A",
  viewShown: "\u663E\u793A",
  viewHidden: "\u4E0D\u663E\u793A",
  viewRules: "\u5DF2\u5199\u5165\u7684\u9690\u85CF\u89C4\u5219\uFF1A",
  viewRestoreAll: "\u5168\u90E8\u6062\u590D\u663E\u793A",
  viewRestoreAllHint: "\u5220\u6389\u6240\u6709\u9690\u85CF\u8FD9\u4E2A\u7EC4\u4EF6\u7684\u89C4\u5219\uFF08\u542B\u65E7\u7248\u672C\u5199\u4E0B\u7684\uFF09\u2014\u2014\u7B49\u4E8E\u628A\u6BCF\u4E2A\u754C\u9762\u90FD\u5207\u56DE\u300C\u663E\u793A\u300D",
  viewAllHidden: "\u6BCF\u4E2A\u754C\u9762\u90FD\u9690\u85CF\u4E86\uFF1A\u753B\u5E03\u4E0A\u5DF2\u7ECF\u70B9\u4E0D\u4E2D\u5B83\u3002\u7528\u8FD9\u4E2A\u6309\u94AE\u6062\u590D\uFF0C\u6216\u7528\u9762\u677F\u5E95\u90E8\u7684\u300C\u56DE\u6536\u7AD9\u300D\u3002",
  viewPresets: "\u5E38\u7528\uFF1A",
  viewOnlyHere: "\u53EA\u5728\u672C\u9875\u663E\u793A",
  viewOnlyHereHint: "\u6E05\u6389\u5176\u5B83\u754C\u9762\u7684\u9690\u85CF\u89C4\u5219\uFF0C\u53EA\u5199\u4E00\u6761\u300C\u4E0D\u5728\u672C\u9875\u5C31\u9690\u85CF\u300D\u2014\u2014\u8FDE\u8FD8\u6CA1\u6253\u5F00\u8FC7\u7684\u9875\u9762\u4E5F\u8986\u76D6\uFF08:not(:has(...))\uFF0C\u6BD4\u9010\u4E2A\u754C\u9762\u5199\u66F4\u5F7B\u5E95\uFF09",
  viewHideEverywhere: "\u5230\u5904\u90FD\u4E0D\u663E\u793A",
  viewHideEverywhereHint: "\u5728\u6BCF\u4E00\u4E2A\u754C\u9762\u90FD\u9690\u85CF\u5B83\uFF08\u89C4\u5219\u5199\u5728\u8FD9\u4E2A\u7EC4\u4EF6\u81EA\u5DF1\u7684\u6807\u8BC6\u4E0A\uFF0C\u4E0E\u754C\u9762\u65E0\u5173\uFF09",
  fieldZIndex: "\u5C42\u7EA7\uFF08z-index\uFF09",
  zIndexAuto: "auto",
  zIndexHint: "\u5C42\u53E0\u987A\u5E8F\uFF1A\u6570\u5B57\u8D8A\u5927\u8D8A\u9760\u4E0A\uFF1B\u7559\u7A7A\uFF1D\u4E0D\u5199\uFF08\u4FDD\u6301 auto\uFF09\u3002\u6EDA\u8F6E \xB11\uFF0CShift \xB110",
  zIndexPresetHint: "\u5E38\u7528\u5C42\u7EA7\u503C",
  zIndexStaticHint: "\u8FD9\u4E2A\u5143\u7D20\u662F static \u5B9A\u4F4D\uFF0Cz-index \u5BF9\u5B83\u901A\u5E38\u4E0D\u751F\u6548\uFF08\u9664\u975E\u5B83\u662F flex/grid \u5B50\u9879\uFF09\u3002",
  zIndexMakeRelative: "\u8BBE\u4E3A relative",
  zIndexNow: "\u73B0\u5728\uFF1A",
  zIndexContext: "\u5C42\u53E0\u4E0A\u4E0B\u6587\uFF1A",
  zIndexContextRoot: "\u6839\u4E0A\u4E0B\u6587\uFF08\u53EF\u4EE5\u4E00\u8DEF\u5347\u5230\u6700\u4E0A\u5C42\uFF09",
  zIndexTrapped: "\u26A0 \u5B83\u88AB\u4E0A\u9762\u90A3\u4E2A\u7956\u5148\u7684\u5C42\u53E0\u4E0A\u4E0B\u6587\u5173\u5728\u91CC\u9762\uFF08transform / opacity / \u5B83\u81EA\u5DF1\u7684 z-index\u2026\uFF09\uFF0Cz-index \u518D\u5927\u4E5F\u51FA\u4E0D\u53BB\u2014\u2014\u8981\u51FA\u5C42\u5F97\u5148\u52A8\u90A3\u4E2A\u7956\u5148\u3002",
  zIndexNoOverlap: "\u5C42\u7EA7\u53EA\u5728\u5143\u7D20\u91CD\u53E0\u65F6\u624D\u770B\u5F97\u51FA\u6765\uFF1A\u73B0\u5728\u6CA1\u6709\u4E0E\u5B83\u91CD\u53E0\u7684\u5143\u7D20\u2014\u2014\u6240\u4EE5\u6539\u6570\u5B57\u4E0D\u4F1A\u6709\u4EFB\u4F55\u53D8\u5316\uFF0C\u8FD9\u4E0D\u662F\u6CA1\u5199\u8FDB\u53BB\u3002",
  zIndexNeighbours: "\u4E0E\u5B83\u91CD\u53E0\u7684 {n} \u4E2A\uFF1A",
  zIndexTop: "\u7F6E\u9876\uFF08{n}\uFF09",
  zIndexBottom: "\u7F6E\u5E95\uFF08{n}\uFF09",
  zIndexTopHint: "\u6309\u5F53\u524D\u771F\u5B9E\u7ADE\u4E89\u8005\u7B97\u51FA\u7684\u6570\u5B57\uFF1A\u6BD4\u5B83\u4EEC\u90FD\u9AD8\u4E00\u5C42\uFF1B\u5143\u7D20\u662F static \u65F6\u4F1A\u987A\u624B\u8865\u4E0A position: relative",
  zIndexBottomHint: "\u6309\u5F53\u524D\u771F\u5B9E\u7ADE\u4E89\u8005\u7B97\u51FA\u7684\u6570\u5B57\uFF1A\u6BD4\u5B83\u4EEC\u90FD\u4F4E\u4E00\u5C42\uFF1B\u5143\u7D20\u662F static \u65F6\u4F1A\u987A\u624B\u8865\u4E0A position: relative",
  scopeUnavailable: "\u8FD9\u4E2A\u5143\u7D20\u6CA1\u6709\u53EF\u8BC6\u522B\u7684\u540C\u7C7B\u7EC4\uFF0C\u53EA\u80FD\u5355\u72EC\u7F16\u8F91",
  scopeWrites: "\u5C06\u5199\u5165",
  gap: "\u95F4\u9694",
  gapHint: "\u6574\u7EC4\u6210\u5458\u5F7C\u6B64\u4E4B\u95F4\u7684\u95F4\u8DDD\uFF1A\u6570\u5B57\u5373\u50CF\u7D20\uFF0C\u6EDA\u8F6E \xB11\uFF08Shift \xB110\uFF09\uFF0C\u4E5F\u53EF\u76F4\u63A5\u5199 0.5rem\uFF1B\u21BA \u6E05\u9664",
  gapClear: "\u6E05\u9664\u95F4\u9694",
  gapUnavailable: '\u8FD9\u4E00\u7EC4\u7684\u6210\u5458\u4E0D\u662F\u76F8\u90BB\u5144\u5F1F\u8282\u70B9\uFF08\u4F8B\u5982\u5206\u5C5E\u4E0D\u540C\u5DE5\u4F5C\u533A\u7684\u5BF9\u8BDD\u884C\uFF09\uFF0C"\u5F7C\u6B64\u4E4B\u95F4"\u6CA1\u6709\u5B9A\u4E49\uFF0C\u56E0\u6B64\u4E0D\u63D0\u4F9B\u95F4\u9694',
  textScopeNote: "\u6587\u5B57\u66FF\u6362\u4ECD\u53EA\u4F5C\u7528\u4E8E\u8FD9\u4E00\u4E2A\u5143\u7D20\uFF08\u6BCF\u884C\u7684\u540D\u5B57\u672C\u6765\u5C31\u4E0D\u540C\uFF09",
  groupWorkspace: "\u5DE5\u4F5C\u533A\u884C",
  groupSession: "\u5BF9\u8BDD\u884C",
  groupTree: "\u4FA7\u680F\u6811",
  groupPeers: "\u540C\u7C7B\u5143\u7D20",
  transformPinned: "\u62D6\u52A8\u7531\u753B\u5E03\u624B\u67C4\u63A5\u7BA1\uFF1A\u9762\u677F\u91CC\u7684\u6570\u503C\u662F\u5B9E\u65F6\u955C\u50CF\uFF0C\u6539\u52A8\u5B83\u4EEC\u5373\u53EF\u91CD\u65B0\u63A5\u7BA1"
};
var en = {
  nav: "Skin",
  title: "Skin Management",
  intro: "The DSH fully-compatible visual skin editing framework (dsh-myskin): manage, preview and customize your skin right here. A skin is a fully reversible overlay that never disturbs DSH itself.",
  enabled: "Enable skin",
  skinLabel: "Current skin",
  preset: "Preset themes",
  presetDefault: "Default",
  presetDeep: "Deep sea",
  presetWarm: "Warm",
  presetRose: "Blush",
  edit: "Draw mode",
  editMenu: "Edit menu",
  apply: "Apply",
  reset: "Restore default",
  saved: "Saved",
  disabled: "Disabled",
  enabledOn: "Enabled",
  enabledOff: "Disabled",
  compat: "Compatibility mode",
  compatOn: "On",
  compatOff: "Off",
  compatHint: "Compatibility mode: never takes the background over. Use it when something else paints the background (a wallpaper, glass, a desktop-shell effect): no wallpaper layer, no background-family tokens (--dsw-alias-bg-*, --dsw-specific-sidebar-fill), no region/panel fill, and no request for the wallpaper plugin to step aside. Colours, borders, blur, radius, buttons, rules, text and layers keep applying. All of it stays in the document \u2014 turn the mode off to get it back.",
  compatTokenTag: "compatibility mode: not written",
  compatPanelTag: "compatibility mode: no fill",
  compatAutoHint: "The dsh-plugin-wallpaper-engine plugin is loaded, so compatibility mode is on by itself (it owns the background). One click turns it off explicitly.",
  variantCompatHint: "Compatibility mode is on: variants write borders, blur, radius, shadow and typography only \u2014 panel fills are left to whoever owns the background.",
  compatBackgroundHint: "Compatibility mode is on: the wallpaper and its strength do nothing (turn the mode off in Skin Management).",
  none: "(no custom skin)",
  addImage: "Add image",
  editText: "Edit text",
  remove: "Remove",
  hide: "Hide control",
  exportSkin: "Export skin",
  importSkin: "Import skin",
  importError: "Import failed: ",
  importedOk: "\u2713 Skin package imported",
  exportedOk: "\u2713 Skin package exported (.dshframework)",
  assetsLabel: "assets",
  skinPackHint: "A skin package is a .dshframework (zip-like): manifest.json holds the full configuration, assets/ holds the raw image and font files (swap them and re-import); the older .dshskin and .json exports still import.",
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
  backgroundAnchor: "Anchor the wallpaper to the conversation",
  backgroundAnchorHint: "When the sidebar folds or unfolds, the wallpaper inside the conversation area re-centers itself (anchored to that column's own box \u2014 no script involved). The sidebar keeps the full-page copy, so the two are different crops: that is the price of centering on the conversation alone.",
  tabComponent: "Component",
  tabImage: "Images",
  tabText: "Text",
  tabMarkdown: "Markdown",
  tabLook: "Look",
  tabHint: "One tab per kind of edit, so different kinds stop sharing one scroll.",
  textPanelHint: "The copy this skin overrides. Edit it here, or use \u300CSelect host\u300D to take the canvas to it.",
  textEmpty: "No copy overridden yet: pick some text in \u300CComponent\u300D and edit its content.",
  textBefore: "Original",
  textAfter: "Becomes",
  textNew: "Add",
  tabRegion: "Regions",
  tabVariant: "Variant",
  variantTitle: "Variant (a whole look)",
  variantHint: "Pick a whole look, then tune one dimension at a time \u2014 or point \u4F5C\u7528\u5BF9\u8C61 at a single place and change only that. All by clicking, no CSS. It edits the skin document, and undo works like anywhere else.",
  variantResetHint: "Clear the region rules and tokens the variants wrote (other rules are untouched)",
  variantNote: "Variants write the same properties as the Region and Markdown tabs: the last change wins. The scope constrains region properties only.",
  variantScope: "Applies to",
  variantScopeAll: "All regions",
  variantScopeHint: "Pick a place and this click changes only it (radius / frame / fill / padding). Typography tokens and the accent colour have no per-region form in DSH, so they stay global.",
  variantGlobalHint: "typography and accent are always global",
  variantFrame: "Frame",
  variantFrameGlass: "Glass",
  variantFrameGlassHint: "Backdrop blur, a hairline light border and a soft shadow \u2014 no fill (that is the next axis)",
  variantFrameOutline: "Outline",
  variantFrameOutlineHint: "One border, no blur, no shadow",
  variantFrameNone: "None",
  variantFrameNoneHint: "Nothing added: no blur, no border, no shadow",
  variantFill: "Fill",
  variantFillGlass: "Glass white",
  variantFillGlassHint: "Translucent white (42%\u201372%, by surface size): the wallpaper shows through",
  variantFillCard: "Card",
  variantFillCardHint: "The theme card colour (--dsw-alias-bg-layer-1), opaque",
  variantFillNone: "Transparent",
  variantFillNoneHint: 'No fill: left to the wallpaper or another plugin. With the glass frame this is "glass edges that never cover the background"',
  variantRadius: "Radius",
  variantCorners: "Per-corner radius",
  variantCornersHint: "Open to pick each corner on its own; a corner you never touched follows the uniform radius above (both can coexist).",
  variantCornerFollow: "follows the uniform radius",
  variantRadiusSquare: "Square",
  variantRadiusSquareHint: "0: sharp and strict",
  variantRadiusS: "S",
  variantRadiusSHint: "8px",
  variantRadiusM: "M",
  variantRadiusMHint: "14px",
  variantRadiusL: "L",
  variantRadiusLHint: "20px: more card-like",
  variantRadiusPill: "Pill",
  variantRadiusPillHint: "28px: very round",
  variantDensity: "Density",
  variantDensityTight: "Tight",
  variantDensityTightHint: "13px body, 10px padding: more on screen",
  variantDensityNormal: "Normal",
  variantDensityNormalHint: "14px body, 14px padding",
  variantDensityLoose: "Loose",
  variantDensityLooseHint: "15px body, 20px padding: easier to read",
  variantAccent: "Accent",
  variantAccentTheme: "Theme",
  variantAccentThemeHint: "Use DSH's own brand colour (no token override)",
  variantAccentBlue: "Blue",
  variantAccentBlueHint: "A calm blue, one step per theme",
  variantAccentViolet: "Violet",
  variantAccentVioletHint: "A violet accent",
  variantAccentTeal: "Teal",
  variantAccentTealHint: "A cool teal",
  variantAccentRose: "Rose",
  variantAccentRoseHint: "A warm rose",
  variantLookGlass: "Glass",
  variantLookGlassHint: "Glass frame, glass-white fill, large radius, normal density",
  variantLookPaper: "Paper",
  variantLookPaperHint: "No frame, card-colour fill, medium radius, normal density",
  variantLookQuiet: "Quiet",
  variantLookQuietHint: "No frame and a transparent fill \u2014 gets out of the background\u2019s way \u2014 small radius, tight density",
  variantLookVivid: "Vivid",
  variantLookVividHint: "Glass frame, glass-white fill, pill radius, loose density, violet accent",
  regionTitle: "Region look",
  regionHint: "Shape a whole surface: conversation, sidebar, composer, settings dialog, message list. The anchors are the semantic half of a container class or a data-* hook, so a DSH upgrade cannot break them.",
  regionFound: "{n} element(s) matched on this page \u2014 edits preview live",
  regionMissing: "This region is not on the page (open a screen that has it, or this build renamed the anchor)",
  regionConversation: "Conversation",
  regionConversationHint: "The centre column the conversation lives in",
  regionSidebar: "Sidebar",
  regionSidebarHint: "The left rail (workspace and sessions)",
  regionRightSidebar: "Right sidebar",
  regionRightSidebarHint: "DSH's own right sidebar (document preview / files / browser / terminal panes live here). It is anchored on the [data-dockkit-pane] hook that package publishes \u2014 0 matches while the sidebar is closed is normal.",
  regionComposer: "Composer",
  regionComposerHint: "The bottom input card (data-composer-card / seat)",
  regionSettings: "Settings",
  regionSettingsHint: "The settings dialog itself",
  regionMessages: "Message list",
  regionMessagesHint: "The conversation scroll area (data-conversation-content)",
  regionBg: "Background",
  regionRadius: "Radius",
  regionRadiusTL: "Top left",
  regionRadiusTR: "Top right",
  regionRadiusBR: "Bottom right",
  regionRadiusBL: "Bottom left",
  regionCornersHint: "Radius: pick one uniform value above; leave a corner empty to follow it, or fill one in to change that corner only \u2014 the uniform value keeps governing the others.",
  regionRadiusDefault: "Default",
  regionRadiusS: "S 8",
  regionRadiusM: "M 14",
  regionRadiusL: "L 20",
  regionRadiusXL: "XL 28",
  regionShadow: "Shadow",
  regionShadowNone: "None",
  regionShadowSoft: "Soft",
  regionShadowMedium: "Medium",
  regionShadowStrong: "Strong",
  regionBlur: "Backdrop blur",
  regionBorderColor: "Border colour",
  regionBorderWidth: "Border width",
  regionBorderStyle: "Draw a border",
  regionPad: "Padding",
  regionGap: "Gap",
  regionOpacity: "Opacity",
  regionPresetGlass: "Glass",
  regionPresetGlassHint: "Translucent with a real backdrop blur, a large radius and a light shadow",
  regionPresetPaper: "Paper",
  regionPresetPaperHint: "Opaque, rounded, medium shadow, no border",
  regionPresetFlat: "Flat",
  regionPresetFlatHint: "Radius only: no border, no shadow, no blur",
  regionResetHint: "Remove every rule this card wrote (other rules are untouched)",
  mdTitle: "Markdown typography",
  mdHint: `Applies to the markdown DSH generates (replies, thinking, tool output). The anchor is the renderer's own root ([class*="_markdown"]), never a build hash, so a DSH upgrade cannot break it; the compact variant (tool previews) is left alone.`,
  mdFound: "This page shows {n} markdown blocks \u2014 edits preview live",
  mdEffective: "Grey placeholders are what the page is USING right now (from DSH, a variant or other rules) \u2014 typing a value overrides it.",
  mdMissing: "No markdown on this page (open a conversation to see the effect)",
  mdScopeConversation: "Replies only",
  mdScopeConversationHint: "Only the markdown inside the conversation area (data-conversation-content); tool and sidebar output keep DSH's own typography",
  mdTokensGroup: "Type scale (tokens)",
  mdTokensHint: "These write DSH's own --dsw-font-markdown-* component tokens, so size, line-height and weight move together \u2014 steadier than a hard-coded declaration. The value covers light and dark; use the token panel to split them.",
  mdTokenSplit: "Light and dark currently differ (set separately in the token panel)",
  mdTokBaseSize: "Body size",
  mdTokBaseLine: "Body line height",
  mdTokH1Size: "H1 size",
  mdTokH2Size: "H2 size",
  mdTokH3Size: "H3 size",
  mdTokH4Size: "H4\u2013H6 size",
  mdTokCodeSize: "Inline code size",
  mdTokCodeBlockSize: "Code block size",
  mdTokInlineCodeBg: "Inline code background",
  mdTokCodeBlockBg: "Code block background",
  mdTokCodeBannerBg: "Code block banner background",
  mdTokLink: "Link colour",
  mdHGapBottom: "Heading bottom margin",
  mdInlineCodePad: "Inline code padding",
  mdLinkWeight: "Link weight",
  mdHrHeight: "Divider thickness",
  mdScopeLabel: "Scope",
  mdScopeAll: "Everything",
  mdScopeAllHint: "Every markdown surface: replies, thinking and tool output",
  mdClear: "Clear this value",
  mdUnset: "unset",
  mdReset: "Reset",
  mdResetHint: "Remove every markdown rule this card wrote (hand-written rules are untouched)",
  mdPresetTight: "Tight",
  mdPresetNormal: "Normal",
  mdPresetLoose: "Loose",
  mdGroupText: "Body text",
  mdGroupHeading: "Headings",
  mdGroupList: "Lists",
  mdGroupQuote: "Quotes",
  mdGroupCode: "Code",
  mdGroupTable: "Tables",
  mdGroupMisc: "Links and the rest",
  mdParaGap: "Paragraph and list gap",
  mdHWeight: "Heading weight",
  mdHGap: "Heading top margin",
  mdLiGap: "Item gap",
  mdLiMarker: "Marker colour",
  mdListIndent: "List indent",
  mdQuoteBorder: "Left border colour",
  mdQuoteWidth: "Left border width",
  mdQuoteColor: "Text colour",
  mdQuoteBg: "Background",
  mdInlineCodeColor: "Inline code text",
  mdInlineCodeRadius: "Inline code radius",
  mdPreBg: "Code block background",
  mdPrePad: "Code block padding",
  mdTableBorder: "Border colour",
  mdTableHeadBg: "Header background",
  mdTablePad: "Cell padding",
  mdTableZebra: "Zebra stripes (even rows)",
  mdHrColor: "Divider colour",
  mdHrGap: "Divider spacing",
  mdImgRadius: "Image radius",
  mdImgMax: "Image max width",
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
  saveFailedCanvas: "the Host refused canvas. The usual reason: the Host schema is older than this client (a new version was installed without restarting DSH), which rejects the WHOLE canvas field as soon as it carries a new anchor kind (whole block) \u2014 re-point that image at \u5143\u7D20 to save now, or restart DSH (note: a restart ends the current session).",
  gifKept: "Animated GIF embedded as-is (animation kept) \xB7 {n} \u2014 heavier than a still, so saving is a little slower",
  gifStilled: "The animation is over the document budget (about 3 MB of base64), so it was embedded as a still: only the first frame survives",
  saveFailedCanvasLarge: "the canvas payload is about {n} KB (images are embedded as data URLs): if the Host caps settings size, use a smaller picture.",
  imageTooLarge: "The image is too large to save even after compression \u2014 pick a smaller one",
  imageCompressed: "Image auto-compressed so the document stays saveable",
  elementActions: "Element actions",
  // —— 0.3.8 draw-mode UI ——
  modeHint: "Select: clicking an element selects it. Interact: use the page normally (clicks never select).",
  undoHint: "Undo (Ctrl/Cmd+Z)",
  redoHint: "Redo (Ctrl/Cmd+Shift+Z)",
  embedImageHint: "Select a container first, then embed an image",
  panelLabel: "Panel",
  panelShowHint: "Show the panel (the page makes room for it)",
  panelHideHint: "Hide the panel to see the whole page (the page fills back in)",
  // —— 0.4.0 panel docking / occlusion diagnosis ——
  dockLeft: "Dock left",
  dockRight: "Dock right",
  dockLeftHint: "Move the panel and the page inset to the left. A plugin that pins its UI to the right edge of the window (position: fixed) does not move when the page is inset, so the right-docked panel sits on top of it \u2014 dock left and it becomes visible and clickable again",
  dockRightHint: "Dock the panel back on the right (the default)",
  occludedWarn: "{n} sits behind the panel",
  // {n} = the occluded element's label (e.g. button.icon_x · Send)
  occludedHint: "It is pinned to the window edge, so insetting the page does not move it out from under the panel. Click to dock the panel to the other side and it becomes visible and clickable",
  resetHint: "Restore default: clear the whole skin and go back to DSH\u2019s own look (skins saved in the library are kept)",
  resetConfirm: "Restore clears the whole skin, including the saved one \u2014 continue?",
  resetGo: "Restore now",
  resetDone: "\u2713 Restored to DSH\u2019s own look",
  applyHint: "Write, enable, then leave draw mode",
  saveDraft: "Save",
  saveHint: "Write the skin document and stay in draw mode (keeps the enabled state as it is)",
  savedHint: "\u2713 Skin document written \u2014 keep editing",
  closeHint: "Close and discard unsaved changes (use Save or Apply to write the skin)",
  shortcuts: "Esc clears the selection (again = leave, discarding) \xB7 Ctrl+Z undo \xB7 Alt+\u2191\u2193 walk the tree",
  emptyTitle: "Start drawing",
  emptySteps: "Click an element to select it \u2192 edit styles or text in the panel \u2192 press Apply to write the skin",
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
  fontTargetNote: "The local-font list writes into: ",
  fontRoles: "Whole-app fonts",
  roleUi: "UI",
  roleText: "Text",
  roleCode: "Code",
  roleUnset: "Inherit",
  rolePick: "Local",
  rolePickHint: "Pick a family from the local-font list into this role (a matching generic fallback is added so the skin travels)",
  roleApplied: "\u2713 Applied",
  fontRolesHint: "UI = the app-wide base (DSH\u2019s --dsw-font-family); Text = an override for conversation content and markdown; Code = code blocks, inline code and the code editors (--ds-font-family-code). Independent and individually clearable \u2014 and the text face never steals the code face.",
  fontHint: "Any family name works (system fonts included); a whole stack can be pasted as is",
  fontEmbedded: "\u2713 Font embedded and applied to this element",
  fontTooLarge: "Font file too large (30 MB cap)",
  fontHeavy: "\u26A0 Font embedded, but it rides in the skin document as base64: every save gets slower (the exported .dshframework keeps it as a real file)",
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
  scaleGripHint: "Drag to scale uniformly",
  // —— 0.3.9 recycle bin / local fonts / moving ——
  recycleBin: "Recycle bin",
  recycleEmpty: "Nothing removed",
  recycleHint: "Controls removed with \u201CRemove control\u201D wait here: they no longer take clicks on the page and cannot be picked on the canvas, so this is the only way back.",
  restore: "Restore",
  restoreAll: "Restore all",
  fontList: "Local fonts",
  fontListing: "Reading\u2026",
  fontListHint: "List the fonts installed on this machine (Chromium asks for permission the first time; browsers without the API fall back to probing common families)",
  fontSearch: "Search fonts",
  fontListEmpty: "No matching font",
  fontLocalCount: "Local fonts",
  fontProbeCount: "Common fonts detected (this browser cannot enumerate local fonts)",
  fontDenied: "Font access was refused \u2014 fell back to probing common families",
  // —— 0.3.9 image anchors ——
  imageMode: "Paint",
  imageModeEmbed: "Component embed (inside)",
  imageModeAnchor: "Component anchor (outside)",
  imageModeHint: "Embed paints inside the component and is clipped with it; Anchor paints on its own layer outside the component \u2014 it may stick out, and it never touches that component\u2019s own positioning or clipping",
  imageModeEmbedNote: "Painted inside the component (clipped with it)",
  imageModeAnchorNote: "Painted outside, on its own layer (never clipped; negative offsets stick out)",
  anchor: "Anchor",
  embedImages: "Embedded images",
  embedImagesHint: "One panel per image: unfold a title to edit that picture \u2014 no need to find where it was embedded.",
  selectHost: "Select host",
  imageSelected: "Image being edited",
  imageSelectedHint: "The canvas keeps exactly this one selection box (same level as selecting a component): drag to move, the corner handle resizes, and its settings are the unfolded panel below. Click another element or press Esc to leave.",
  selectImage: "Select",
  imageLayer: "Layer",
  imageLayerAuto: "Auto",
  imageLayerAutoHint: "Auto: a blend mode paints above the content (otherwise the blend shows nothing), normal stays below it",
  imageLayerBelow: "Below",
  imageLayerBelowHint: "Below: never covers the container's text or buttons \u2014 but an opaque child of the container will cover IT",
  imageLayerAbove: "Above",
  imageLayerAboveHint: "Above: always visible, at the cost of covering the container's own content \u2014 the right choice for a container whose children are opaque (settings cards)",
  imageFeather: "Edge feather",
  imageFeatherOff: "off",
  imageFeatherHint: "Feather width (px): 0 = off. The falloff grows the picture outwards, so the hard edge dissolves",
  imageFeatherSoft: "Soften",
  imageFeatherSoftHint: "Softness of the edge transition, 0\u2013100: 0 = linear ramp, 100 = S-curve (gentler at both ends). It changes the ramp only \u2014 the artwork is never blurred.",
  imageFeatherNote: "The feather dissolves about that many px of the picture edge and bleeds roughly a quarter of it outside (the box stays put, so the artwork looks slightly smaller). To escape the container clipping entirely, use \u300C\u7EC4\u4EF6\u951A\u5B9A\u300D.",
  imageLayerHint: "If the picture is invisible, try \u300CAbove\u300D first; to escape the container's clipping entirely, switch \u300CPresentation\u300D to the anchored layer.",
  imagePageScope: "Only on the settings page it was embedded on",
  imagePageScopeHint: "On by default: this picture was embedded inside a settings page, so other settings pages do not show it. Untick to show it on every settings page.",
  imgDiagOk: "\u2713 Should be visible (anchor resolved, layer and container size are fine)",
  imgDiagUnresolved: "\u26A0 The anchor resolves to nothing right now: the rule matches no element, so the picture cannot appear",
  imgDiagPageScope: "\u26A0 This image only shows on the settings page it was embedded on (any other settings page hides it) \u2014 that is the existing per-page scope",
  imgDiagCovered: "\u26A0 Covered by the container's content: it sits below, and an opaque child hides it \u2014 switch \u300CLayer\u300D to \u300CAbove\u300D",
  imgDiagClipped: "\u26A0 Clipped by the container: the picture is larger than it (the container shows only part of it) \u2014 use \u300CPresentation \u2192 anchored layer\u300D or shrink it",
  imagePanelHint: "Unfold this image's own settings",
  selectImageHint: "Select this image (the canvas keeps only its box, and the panel header switches to it)",
  deselect: "Deselect",
  selectHostHint: "Select the container this image lives in, on the canvas (disabled while its anchor cannot be resolved)",
  blendLayerNote: "A blend mode mixes with the page behind it, so that layer paints above the content; with normal it stays below (it never covers the rows and buttons).",
  imageAxisX: "X offset (from the container's top-left corner)",
  imageAxisY: "Y offset",
  imageAxisW: "Width",
  imageAxisH: "Height",
  anchorKindElement: "Element",
  anchorKindText: "Text",
  anchorKindComponent: "Built-in",
  anchorKindGroup: "Whole block (every one)",
  anchorUseSelected: "Use selection",
  anchorUseText: "Use its text",
  anchorUseTextHint: "Anchor to the copy the selected element carries (survives a reworded button)",
  anchorOk: "\u2713 Anchored",
  anchorMissing: "\u26A0 This anchor is not on the page right now, so the image stays hidden",
  anchorHint: "The anchor decides what the image follows: an element (structural selector), a piece of copy, or a built-in landmark (composer, column, \u2026)",
  anchorTextHint: "The image follows the element that carries this copy; re-pick it if the copy changes",
  anchorSelectorHint: "A CSS selector; it can go stale after a redesign \u2014 Text or Built-in are the sturdier choices",
  anchorTextPlaceholder: "Text to follow",
  anchorSelectorPlaceholder: "CSS selector",
  compApp: "Whole app",
  compFrame: "App frame",
  compColumn: "Conversation column",
  compSession: "Conversation content",
  compView: "Conversation view",
  compComposer: "Composer (bottom bar)",
  compComposerInput: "Composer input",
  compPlaceholder: "New-chat placeholder",
  compTree: "Workspace / session tree",
  // —— 0.3.9 block editing ——
  editScope: "Edit scope",
  scopeSingle: "This element",
  scopeGroup: "Whole block",
  scopeGroupHint: "Whole block: edit once, every element of the same kind follows \u2014 including ones created later",
  // —— 全站 scope (spans views: conversation / plugins / settings) ——
  scopeSite: "Everywhere",
  scopeSiteHint: "Everywhere: the selector is built from the element's OWN identity (classes / data-* attributes / role) with no ancestor path \u2014 so the component follows in every view (conversation, plugins, settings) and in instances created later",
  scopeSiteOne: `It matches 1 element right now: this is "the component", not "only this one" \u2014 the other views' instances match the moment they appear`,
  scopeSiteMany: "It matches {n} elements right now (each one outlined on the canvas): they change together, and so do instances created later",
  scopeSiteNoIdentity: "This element carries nothing reusable (no classes, no usable data-*, no role), so there is no selector that could follow it across views \u2014 try an element that carries more of its own identity",
  scopeSiteTooGeneric: `This element's identity is too common (it matches {n} elements), so "everywhere" would restyle unrelated parts of the app \u2014 pick a more specific element`,
  // —— per-view show / hide (conversation vs settings · plugins) ——
  viewCard: "Where it shows",
  viewHint: `Control this component per surface: pick "Hidden" and it disappears there. The rule written is body:has(<surface marker>) + <component identity>, and the marker is an upstream semantic attribute (the settings dialog's data-shortcut-modal, the plugins page's data-plugin-panel, \u2026) \u2014 so it covers both plugin shapes: one instance per surface, and one global node painted over everything. Pages you visit are remembered (up to 8), so you do not have to navigate back to them.`,
  viewSettings: "Settings dialog",
  viewSettingsHint: "The settings surface: the settings dialog is open (settings, shortcut editor). The plugins page is NOT a dialog \u2014 it is another page of the main area, controlled by the row below",
  viewThisPage: "This page: ",
  viewUnknown: "current page (no marker found)",
  viewNoPageMarker: "This page carries no semantic marker (no data-slot / data-*), so it cannot be targeted on its own \u2014 write a selector in geek mode instead, or hide the component on another surface.",
  viewCurrent: "You are in: ",
  viewShown: "Shown",
  viewHidden: "Hidden",
  viewRules: "Hide rules written:",
  viewRestoreAll: "Show it everywhere again",
  viewRestoreAllHint: "Drop every rule that hides this component (including ones written by an older build) \u2014 the same as switching every surface back to Shown",
  viewAllHidden: "Hidden on every surface: the page can no longer be clicked to select it. Use this button, or the recycle bin at the bottom of the panel.",
  viewPresets: "Presets:",
  viewOnlyHere: "Only on this page",
  viewOnlyHereHint: "Clear the other surfaces and write one inverted rule \u2014 hidden wherever this page is not, including pages you have never opened (:not(:has(...)) reaches further than one rule per surface)",
  viewHideEverywhere: "Nowhere at all",
  viewHideEverywhereHint: "Hide it on every surface (the rule targets the component's own identity, with no surface in it)",
  fieldZIndex: "Stacking (z-index)",
  zIndexAuto: "auto",
  zIndexHint: "Stacking order: higher wins; empty writes nothing (stays auto). Wheel \xB11, Shift \xB110",
  zIndexPresetHint: "Common stacking values",
  zIndexStaticHint: "This element is position: static, where z-index usually does nothing (unless it is a flex/grid item).",
  zIndexMakeRelative: "Make it relative",
  zIndexNow: "Now: ",
  zIndexContext: "stacking context: ",
  zIndexContextRoot: "the root context (it can go all the way up)",
  zIndexTrapped: "\u26A0 An ancestor above it starts a stacking context (transform / opacity / its own z-index\u2026), and that becomes a ceiling: no z-index can climb out of it. The ancestor has to move first.",
  zIndexNoOverlap: "Stacking only shows when elements overlap, and nothing overlaps this one right now \u2014 so the number cannot change anything (it was still written).",
  zIndexNeighbours: "Overlapping it: {n} \xB7",
  zIndexTop: "On top ({n})",
  zIndexBottom: "Behind ({n})",
  zIndexTopHint: "Computed from the real competitors: one step above all of them. Also positions the element when it is static",
  zIndexBottomHint: "Computed from the real competitors: one step below all of them. Also positions the element when it is static",
  scopeUnavailable: "No recognisable block for this element \u2014 single-element editing only",
  scopeWrites: "Writes",
  gap: "Gap",
  gapHint: "Space between block members: a plain number means pixels, the wheel steps \xB11 (Shift \xB110), and a unit like 0.5rem is written as typed; \u21BA clears",
  gapClear: "Clear the gap",
  gapUnavailable: 'These members are not adjacent siblings (sessions of different workspaces, say), so "between them" is undefined \u2014 no gap field rather than one that does nothing',
  textScopeNote: "Text replacement always stays on this one element (each row has its own name)",
  groupWorkspace: "Workspace row",
  groupSession: "Session row",
  groupTree: "Sidebar tree",
  groupPeers: "Same kind",
  transformPinned: "A canvas grip owns the move right now: these numbers mirror it live, and editing one takes over again"
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
    const offWallpaper = typeof document === "undefined" ? () => {
    } : observeWallpaperEngine(document, apply2);
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
      offWallpaper();
      offSnapshot();
      override?.dispose();
      override = void 0;
    };
  }), "dsh-myskin: settings-backed lifecycle");
}
return module.exports; } });
