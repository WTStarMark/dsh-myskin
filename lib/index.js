// src/host-schema.ts
import z from "@deepseek-ai/schemastery";
var modes = z.object({
  light: z.string().default("#000000"),
  dark: z.string().default("#ffffff")
});
var cssRule = z.object({ selector: z.string().default(""), rule: z.string().default("") });
var textRule = z.object({
  selector: z.string().default(""),
  before: z.string().default(""),
  after: z.string().default("")
});
var blend = z.union(["normal", "multiply", "screen", "overlay"]).default("normal");
var embeddedImage = z.object({
  id: z.string().default(""),
  selector: z.string().default(""),
  url: z.string().default(""),
  x: z.number().default(0),
  y: z.number().default(0),
  w: z.number().default(0),
  h: z.number().default(0),
  opacity: z.number().default(1),
  blend,
  fallbackSelector: z.string().default(""),
  pageKey: z.string().default("")
});
var injectedLayer = z.object({
  id: z.string().default(""),
  kind: z.union(["img", "div"]).default("img"),
  url: z.string().default(""),
  selector: z.string().default(""),
  attach: z.union(["prepend", "append"]).default("append"),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  opacity: z.number(),
  blend: z.union(["normal", "multiply", "screen", "overlay"]),
  css: z.string().default(""),
  pageKey: z.string().default("")
});
var namedSkin = z.object({
  id: z.string().default(""),
  name: z.string().default(""),
  tokens: z.dict(modes).default({}),
  css: z.array(cssRule).default([]),
  text: z.array(textRule).default([]),
  canvas: z.object({ background: z.string(), backgroundOpacity: z.number().min(0.3).max(1).default(0.9), images: z.array(embeddedImage).default([]) }).default({}),
  layers: z.array(injectedLayer).default([])
});
var Config = z.object({
  enabled: z.boolean().default(false).volatile(),
  tokens: z.dict(modes).default({}).volatile(),
  css: z.array(cssRule).default([]).volatile(),
  text: z.array(textRule).default([]).volatile(),
  canvas: z.object({
    background: z.string(),
    backgroundOpacity: z.number().min(0.3).max(1).default(0.9),
    images: z.array(embeddedImage).default([])
  }).default({}).volatile(),
  layers: z.array(injectedLayer).default([]).volatile(),
  content: z.object({ workspaceTree: z.boolean().default(false) }).default({}).volatile(),
  library: z.array(namedSkin).default([]).volatile()
});

// src/skin-schema.ts
var SKIN_SETTINGS_NAMESPACE = "dsh-myskin";

// src/index.ts
var name = SKIN_SETTINGS_NAMESPACE;
function apply() {
}
export {
  Config,
  apply,
  name
};
