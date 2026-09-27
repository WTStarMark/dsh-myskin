// src/skin-schema.ts
var SKIN_SETTINGS_NAMESPACE = "myskin";

// src/host-schema.ts
function defaultSkin() {
  return { enabled: false, tokens: {}, css: [], text: [], canvas: { images: [] }, library: [] };
}
function normalize(value) {
  const section = value ?? {};
  return {
    enabled: section.enabled === true,
    tokens: section.tokens ?? {},
    css: section.css ?? [],
    text: section.text ?? [],
    canvas: section.canvas ?? { images: [] },
    layers: section.layers ?? [],
    content: section.content,
    library: section.library ?? []
  };
}
var SkinSettingsSchema = Object.assign(
  (value) => normalize(value),
  {
    toJSON() {
      return {
        type: "object",
        fields: ["enabled", "tokens", "css", "text", "canvas", "layers", "library"]
      };
    }
  }
);
var DEFAULT_SKIN = defaultSkin();

// src/index.ts
function settingsNamespace(value) {
  return value;
}
var SKIN_NAMESPACE = settingsNamespace(SKIN_SETTINGS_NAMESPACE);
function apply(ctx) {
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(SKIN_NAMESPACE, SkinSettingsSchema);
  });
}
export {
  apply
};
