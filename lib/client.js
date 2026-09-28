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
var CENTER_COLUMN_SELECTOR = '[class*="_centerCol"], [class~="centerCol"]';
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
function textHostOf(el) {
  const direct = (node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE && child.data.trim() !== "") return child;
    }
    return void 0;
  };
  if (direct(el) !== void 0) return el;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return el;
  for (const child of Array.from(el.querySelectorAll("*"))) {
    if (direct(child) !== void 0) return child;
  }
  return void 0;
}
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
  if (!readDesktopShell(doc).desktop) return rules;
  const fmt = (value) => String(Math.round(value * 100) / 100);
  const layers = tint === void 0 ? 'url("' + url + '")' : "linear-gradient(rgba(" + tint.rgb + ", " + fmt(tint.base) + "), rgba(" + tint.rgb + ", " + fmt(tint.base) + ')), url("' + url + '")';
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
  return rules;
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
    if (img.selector !== "" && img.url !== "") {
      rules.push(img.selector + " { position: relative; }");
      const blendCss = img.blend !== void 0 && img.blend !== "normal" ? " mix-blend-mode: " + img.blend + ";" : "";
      rules.push(img.selector + `::after { content: ''; position: absolute; inset: 0; background-image: url("` + img.url + '"); background-repeat: no-repeat; background-position: ' + img.x + "px " + img.y + "px; background-size: " + img.w + "px " + img.h + "px; opacity: " + (img.opacity ?? 1) + "; pointer-events: none; z-index: 1;" + blendCss + " }");
    }
  }
  if (embedTargets.length > 0 && typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    const retag = () => {
      if (disposed) return;
      const curKey = currentSettingsPageKey(document);
      for (const img of embedTargets) {
        const scoped = img.pageKey !== void 0 && img.pageKey !== "";
        try {
          const els = document.querySelectorAll(img.fallbackSelector);
          const target = els.length === 1 ? els[0] : void 0;
          if (scoped && img.pageKey !== curKey) {
            const tagged = document.querySelector('[data-dsh-myskin-embed="' + img.id + '"]');
            if (tagged !== null) tagged.removeAttribute("data-dsh-myskin-embed");
            continue;
          }
          if (target !== void 0 && target.getAttribute("data-dsh-myskin-embed") !== img.id) {
            target.setAttribute("data-dsh-myskin-embed", img.id);
          }
        } catch {
        }
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
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-current"] });
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
  bgOverlay: "var(--dsw-alias-bg-overlay)",
  bgBase: "var(--dsw-alias-bg-base)",
  brand: "var(--dsw-alias-brand-primary)",
  success: "var(--dsw-alias-state-success-primary)"
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkinCanvas, { initial, t, onPersistStrength, onCommit: async (next) => {
      const report = await onCommit(next);
      if (report.ok) closeSkinEditor();
      return report;
    }, onClose: () => {
      onClose();
      closeSkinEditor();
    } })
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
    const blob = new Blob([JSON.stringify(skin, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dsh-myskin.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const onImportFile = (e) => {
    const file = e.target.files?.[0];
    if (file === void 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? ""));
        update(parseSkin(parsed));
        setNotice(t("saved"));
      } catch {
        setNotice(t("importError"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: importRef, type: "file", accept: "application/json", style: { display: "none" }, onChange: onImportFile })
    ] }),
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
function SkinCanvas({ initial, onClose, onCommit, onPersistStrength, t }) {
  const [draft, setDraft] = (0, import_react.useState)(() => parseSkin(initial));
  const [selected, setSelected] = (0, import_react.useState)(void 0);
  const [mode, setMode] = (0, import_react.useState)("edit");
  const [showTokens, setShowTokens] = (0, import_react.useState)(false);
  const [hint, setHint] = (0, import_react.useState)(void 0);
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
    const onMove = () => bump((n) => n + 1);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, []);
  (0, import_react.useEffect)(() => {
    if (mode !== "edit") return;
    const own = (target) => target instanceof Element && target.closest('[data-dsh-myskin-ui="1"]') !== null;
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
      tag.remove();
      if (priorStyle === null) root.removeAttribute("style");
      else root.setAttribute("style", priorStyle);
      pulseWindowDragRecall(document);
    };
  }, []);
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
  const hitTest = (clientX, clientY) => {
    const d = document;
    const excluded = (el) => el.getAttribute("data-dsh-myskin-ui") === "1" || el.closest('[data-dsh-myskin-ui="1"]') !== null || el === d.body || el === d.documentElement || el === d.getElementById("root");
    for (const el of d.elementsFromPoint(clientX, clientY)) {
      if (excluded(el)) continue;
      const interactive2 = el.closest('button, a, input, textarea, select, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="menuitemcheckbox"], [role="checkbox"], [role="switch"]');
      if (interactive2 !== null && !excluded(interactive2)) return interactive2;
      return el;
    }
    return void 0;
  };
  const applyStyle = (selector, declaration) => {
    snapshot();
    const rules = draft.css.filter((r) => r.selector !== selector);
    setDraft({ ...draft, css: [...rules, { selector, rule: declaration }] });
  };
  const liveApplyRef = (0, import_react.useRef)(false);
  const liveApply = (selector, declaration) => {
    if (!liveApplyRef.current) {
      snapshot();
      liveApplyRef.current = true;
    }
    const rules = draft.css.filter((r) => r.selector !== selector);
    setDraft({ ...draft, css: [...rules, { selector, rule: declaration }] });
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
  const onApply = () => {
    setHint(void 0);
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
  const toggleMode = () => {
    setMode(mode === "edit" ? "interact" : "edit");
  };
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { "data-dsh-myskin-ui": "1", "data-dsh-myskin-canvas": "1", style: { position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", color: tok.labelPrimary }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: barRef, "data-dsh-myskin-ui": "1", style: { pointerEvents: "auto", position: "absolute", top: "var(--dsh-myskin-chrome-top, 0px)", left: 0, right: 0, minHeight: 48, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "6px 16px 6px var(--dsh-myskin-leading, 16px)", background: tok.bgOverlay, borderBottom: "1px solid var(--dsw-alias-border-l1)", zIndex: 10005, color: tok.labelPrimary }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPersonalization, { size: 16 }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 14, lineHeight: "22px", fontWeight: 500 }, children: [
        t("title"),
        " \u2014 ",
        t("edit")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: mode === "edit" ? "primary" : "ghost", onClick: toggleMode, children: mode === "edit" ? t("interactMode") : t("selectMode") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: undo, disabled: pastRef.current.length === 0, children: t("undo") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: redo, disabled: futureRef.current.length === 0, children: t("redo") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: showTokens ? "primary" : "ghost", onClick: () => {
        setShowTokens(!showTokens);
      }, children: t("tokenPanel") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlus, { size: 16 }), onClick: () => {
        if (selected === void 0) setHint(t("selectFirst"));
        else embedBgRef.current?.click();
      }, children: t("embedImage") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlus, { size: 16 }), onClick: () => {
        pageBgRef.current?.click();
      }, children: t("backgroundImage") }),
      draft.canvas.background !== void 0 && draft.canvas.background !== "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: clearPageBg, children: t("clearBackground") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelTertiary }, children: mode === "edit" ? t("editHint") : t("interactHint") }),
      hint !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: "var(--dsw-alias-state-warn-primary)" }, children: hint }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: save.state === "failed" ? "var(--dsw-alias-state-error-primary)" : save.state === "dirty" ? "var(--dsw-alias-state-warn-primary)" : tok.labelTertiary }, children: save.state === "dirty" ? t("unsaved") : save.state === "saving" ? t("saving") : save.state === "failed" ? save.detail ?? t("saveFailed") : t("savedOk") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, onClick: onApply, children: t("apply") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 16 }), onClick: resetDraft, children: t("reset") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClose, { size: 16 }), onClick: onCloseOrSave, children: t("close") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: panelRef, "data-dsh-myskin-ui": "1", style: { pointerEvents: "auto", position: "absolute", top: "calc(var(--dsh-myskin-chrome-top, 0px) + var(--dsh-myskin-inset-top, 48px))", right: 0, bottom: 0, width: 340, display: "flex", flexDirection: "column", gap: 12, overflow: "auto", padding: 12, background: tok.bgOverlay, borderLeft: "1px solid " + tok.borderL2, zIndex: 10004 }, children: [
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
          onText: addText,
          onRemoveText: removeText,
          onRemove: removeSelector,
          onEmbedOpacity: (id, v) => updateEmbed(id, { opacity: clampNum(v, 0, 1) }),
          onEmbedBlend: (id, v) => updateEmbed(id, { blend: v }),
          onRemoveEmbed: removeEmbed,
          onHide: hideElement,
          onUnhide: unhideElement,
          onRemoveControl: removeControl,
          onRestoreControl: restoreControl,
          t
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelTertiary }, children: t("noSelection") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelTertiary }, children: t("interactHint") }),
      mode === "edit" && showTokens ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TokenPanel, { tokens: draft.tokens, onToggle: toggleToken, onChange: setToken, t }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: embedBgRef, type: "file", accept: "image/*", multiple: false, style: { display: "none" }, onChange: onEmbedBgFile }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: pageBgRef, type: "file", accept: "image/*", multiple: false, style: { display: "none" }, onChange: onPageBgFile }),
    mode === "edit" && selRect !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { "data-dsh-myskin-ui": "1", style: { position: "fixed", left: selRect.left, top: selRect.top, width: selRect.width, height: selRect.height, border: "2px solid " + tok.brand, boxShadow: "0 0 0 1px var(--dsw-alias-bg-overlay)", borderRadius: 2, pointerEvents: "none", zIndex: 10001 } }) : null,
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
function Inspector({ target, draft, onSample, onText, onRemoveText, onRemove, onEmbedOpacity, onEmbedBlend, onRemoveEmbed, onHide, onUnhide, onRemoveControl, onRestoreControl, t }) {
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
  const [touched, setTouched] = (0, import_react.useState)({});
  const [geek, setGeek] = (0, import_react.useState)(false);
  const [geekCss, setGeekCss] = (0, import_react.useState)("");
  const [geekSel, setGeekSel] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    setGeekSel(selectorOf(target));
  }, [target]);
  const applyGeek = () => {
    if (geekSel.trim() !== "" && geekCss.trim() !== "") onSample(geekSel, geekCss.trim());
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
        textAlign: d["text-align"] !== void 0
      });
    } else {
      const css = getComputedStyle(target);
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
  const touch = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };
  const used = (field) => touched[field] === true;
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
  const applySample = () => {
    const decl = [
      used("fontSize") ? "font-size: " + fontSize : "",
      used("color") ? "color: " + color : "",
      used("bg") ? "background-color: " + bg : "",
      used("bgImage") ? "background-image: " + bgImage + "; background-size: cover; background-position: center;" : "",
      used("weight") ? "font-weight: " + weight : "",
      used("radius") ? "border-radius: " + radius : "",
      used("borderColor") ? "border-color: " + borderColor : "",
      used("borderWidth") ? "border-width: " + borderWidth : "",
      used("padding") ? "padding: " + padding : "",
      used("width") ? "width: " + width : "",
      used("height") ? "height: " + height : "",
      used("margin") ? "margin: " + margin : "",
      used("lineHeight") ? "line-height: " + lineHeight : "",
      used("opacity") ? "opacity: " + opacity : "",
      used("shadow") ? "box-shadow: " + shadow : "",
      used("textAlign") ? "text-align: " + textAlign : ""
    ].filter((s) => s !== "").join("; ");
    if (decl !== "") onSample(selectorOf(target), decl);
  };
  (0, import_react.useEffect)(() => {
    const decl = [
      used("fontSize") ? "font-size: " + fontSize + " !important" : "",
      used("color") ? "color: " + color + " !important" : "",
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
    if (decl !== "") onSample(selectorOf(target), decl);
  }, [fontSize, color, bg, bgImage, weight, radius, borderColor, borderWidth, padding, width, height, margin, lineHeight, opacity, shadow, textAlign, touched]);
  const applyText = () => {
    const host = hostRef.current;
    const desired = text.trim();
    if (host === void 0 || desired === "") {
      setTextIssue(t("noEditableText"));
      return;
    }
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 4, borderBottom: "1px solid " + tok.borderL2, paddingBottom: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, lineHeight: "18px", color: tok.labelTertiary }, children: t("target") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelSecondary, fontFamily: "var(--ds-font-family-code, monospace)", wordBreak: "break-all" }, children: target.tagName.toLowerCase() }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 11, lineHeight: "16px", color: tok.labelTertiary, fontFamily: "var(--ds-font-family-code, monospace)", wordBreak: "break-all" }, children: selectorOf(target) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: geek ? "primary" : "ghost", onClick: () => {
      setGeek(!geek);
    }, children: t("geekMode") }) }),
    geek ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 8, borderBottom: "1px solid " + tok.borderL2, paddingBottom: 8, marginBottom: 2 }, children: [
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u5B57\u53F7",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: fontSize, onChange: (e) => {
          setFontSize(e.target.value);
          touch("fontSize");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u989C\u8272",
        colorType(color, setColor, "color"),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: color, onChange: (e) => {
          setColor(e.target.value);
          touch("color");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u80CC\u666F\u8272",
        colorType(bg, setBg, "bg"),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: bg, onChange: (e) => {
          setBg(e.target.value);
          touch("bg");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u80CC\u666F\u56FE",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: bgImage, placeholder: "url(...)/gradient", onChange: (e) => {
          setBgImage(e.target.value);
          touch("bgImage");
        } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", onClick: () => {
          bgImageRef.current?.click();
        }, children: t("embedBg") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: bgImageRef, type: "file", accept: "image/*", multiple: false, style: { display: "none" }, onChange: onEmbedBg }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u5B57\u91CD",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: weight, onChange: (e) => {
          setWeight(e.target.value);
          touch("weight");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u5706\u89D2",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: radius, onChange: (e) => {
          setRadius(e.target.value);
          touch("radius");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u8FB9\u6846\u5BBD",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: borderWidth, placeholder: "width", onChange: (e) => {
          setBorderWidth(e.target.value);
          touch("borderWidth");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u8FB9\u6846\u8272",
        colorType(borderColor, setBorderColor, "borderColor"),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: borderColor, placeholder: "color", onChange: (e) => {
          setBorderColor(e.target.value);
          touch("borderColor");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u5185\u8FB9\u8DDD",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: padding, onChange: (e) => {
          setPadding(e.target.value);
          touch("padding");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u5BBD",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: width, onChange: (e) => {
          setWidth(e.target.value);
          touch("width");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u9AD8",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: height, onChange: (e) => {
          setHeight(e.target.value);
          touch("height");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u5916\u8FB9\u8DDD",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: margin, onChange: (e) => {
          setMargin(e.target.value);
          touch("margin");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u884C\u9AD8",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: lineHeight, onChange: (e) => {
          setLineHeight(e.target.value);
          touch("lineHeight");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u4E0D\u900F\u660E\u5EA6",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: opacity, onChange: (e) => {
          setOpacity(e.target.value);
          touch("opacity");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u9634\u5F71",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: shadow, onChange: (e) => {
          setShadow(e.target.value);
          touch("shadow");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        "\u6587\u5B57\u5BF9\u9F50",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: textAlign, onChange: (e) => {
          setTextAlign(e.target.value);
          touch("textAlign");
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { style: { fontSize: 13, lineHeight: "20px", fontWeight: 500, color: tok.labelSecondary }, children: t("elementActions") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: fieldLabel, children: [
        t("editText"),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: text, placeholder: beforeRef.current !== "" ? beforeRef.current : t("noEditableText"), onChange: (e) => {
          setText(e.target.value);
          touch("text");
        } })
      ] }),
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, variant: "outline", onClick: applyText, children: t("editText") }),
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
    ] }),
    draft.canvas.images.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, lineHeight: "18px", borderTop: "1px solid " + tok.borderL2, paddingTop: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12, color: tok.labelTertiary }, children: t("embedBg") }),
      draft.canvas.images.map((img) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary }, children: t("opacity") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "range", min: 0, max: 100, value: Math.round((img.opacity ?? 1) * 100), onChange: (e) => {
          onEmbedOpacity(img.id, Number(e.target.value) / 100);
        }, style: { width: 90 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: tok.labelTertiary }, children: t("blend") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "select",
          {
            value: img.blend ?? "normal",
            onChange: (e) => {
              onEmbedBlend(img.id, e.target.value);
            },
            style: { background: tok.bgBase, color: tok.labelPrimary, border: "1px solid " + tok.borderL2, borderRadius: 4, fontSize: 12, lineHeight: "18px", padding: "2px 4px" },
            children: BLEND_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: o.value, children: t(o.labelKey) }, o.value))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { style: btnBase, size: "sm", variant: "ghost", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, { size: 14 }), onClick: () => {
          onRemoveEmbed(img.id);
        }, children: t("remove") })
      ] }, img.id))
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
    width: 340,
    maxHeight: "calc(100vh - 120px)",
    overflow: "auto",
    background: tok.bgOverlay,
    border: "1px solid " + tok.borderL2,
    borderRadius: 12,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    color: tok.labelPrimary,
    fontSize: 12
  };
  const groupStyle = { fontSize: 12, lineHeight: "18px", fontWeight: 600, color: tok.labelTertiary, marginTop: 4 };
  const rowStyle2 = { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" };
  const nameStyle = { fontSize: 11, lineHeight: "16px", fontFamily: "var(--ds-font-family-code, monospace)", color: tok.labelSecondary, minWidth: 150, flex: 1 };
  const pick2 = (v) => toHex(v) ?? "#000000";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: panelStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { style: { fontSize: 14, lineHeight: "22px", fontWeight: 500 }, children: t("tokenPanel") }),
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
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle2, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: on, onChange: (e) => {
              onToggle(item.name, e.target.checked);
            } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: 14, height: 14, borderRadius: 3, border: "1px solid " + tok.borderL2, background: on ? cur : "var(--dsw-alias-bg-layer-2)", flex: "none" } }),
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
  intro: "\u5728\u8FD9\u91CC\u7BA1\u7406\u3001\u9884\u89C8\u5E76\u53EF\u89C6\u5316\u81EA\u5B9A\u4E49 DSH Web \u76AE\u80A4\u3002\u76AE\u80A4\u662F\u5B8C\u5168\u53EF\u9006\u7684\u8986\u76D6\u5C42\uFF0C\u4E0D\u5F71\u54CD DSH \u6B63\u5E38\u8FD0\u884C\u3002",
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
  importError: "\u5BFC\u5165\u5931\u8D25\uFF1A\u6587\u4EF6\u4E0D\u662F\u6709\u6548\u7684\u76AE\u80A4 JSON",
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
  noEditableText: "\u8FD9\u4E2A\u5143\u7D20\u91CC\u6CA1\u6709\u53EF\u76F4\u63A5\u7F16\u8F91\u7684\u6587\u5B57\uFF1A\u8BF7\u9009\u4E2D\u5305\u542B\u6587\u5B57\u7684\u8282\u70B9\uFF0C\u6216\u6539\u7528\u300C\u9690\u85CF/\u79FB\u9664\u63A7\u4EF6\u300D",
  textRevert: "\u8FD8\u539F\u6587\u5B57",
  textApplied: "\u2713 \u6587\u5B57\u5DF2\u66FF\u6362",
  unsaved: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539",
  saving: "\u4FDD\u5B58\u4E2D\u2026",
  savedOk: "\u5DF2\u4FDD\u5B58",
  saveFailed: "\u4FDD\u5B58\u5931\u8D25\uFF1A",
  imageTooLarge: "\u56FE\u7247\u8FC7\u5927\u4E14\u538B\u7F29\u540E\u4ECD\u65E0\u6CD5\u4FDD\u5B58\uFF0C\u8BF7\u6362\u4E00\u5F20\u66F4\u5C0F\u7684\u56FE",
  imageCompressed: "\u56FE\u7247\u5DF2\u81EA\u52A8\u538B\u7F29\uFF0C\u4FDD\u8BC1\u4FDD\u5B58\u4F53\u79EF\u53EF\u63A7",
  elementActions: "\u5143\u7D20\u64CD\u4F5C"
};
var en = {
  nav: "Skin",
  title: "Skin Management",
  intro: "Manage, preview, and visually customize your DSH Web skin. A skin is a fully reversible overlay that never disturbs DSH itself.",
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
  importError: "Import failed: not a valid skin JSON",
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
  noEditableText: "This element has no directly editable text \u2014 select the node that holds it, or use Hide / Remove control.",
  textRevert: "Revert text",
  textApplied: "Text replaced",
  unsaved: "Unsaved changes",
  saving: "Saving\u2026",
  savedOk: "Saved",
  saveFailed: "Save failed: ",
  imageTooLarge: "The image is too large to save even after compression \u2014 pick a smaller one",
  imageCompressed: "Image auto-compressed so the document stays saveable",
  elementActions: "Element actions"
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
