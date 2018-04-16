/// <reference path="../../../../node_modules/@types/node/index.d.ts" />

import * as path from "path";

const resolvePresets = presets => {
  return presets.map(presetPath => {
    let preset;
    if (presetPath.indexOf(".") === 0) {
      preset = require(path.resolve(process.cwd(), "../", presetPath));
    } else {
      preset = require(presetPath);
    }
    return new preset.default();
  });
};

export { resolvePresets };
