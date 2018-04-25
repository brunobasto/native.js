import * as path from "path";

const resolvePresets = presets => {
  return presets.map(presetPath => {
    if (typeof presetPath === "string") {
      let preset;
      if (presetPath.indexOf(".") === 0) {
        preset = require(path.resolve(process.cwd(), "../", presetPath));
      } else {
        preset = require(presetPath);
      }
      return new preset.default();
    }
    return new presetPath();
  });
};

export { resolvePresets };
