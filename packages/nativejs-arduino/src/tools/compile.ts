import { compile as nativeCompile } from "nativejs-compiler/src/util/compile";
import { AVRPreset } from "../presets";

const compile = (source, callback) => {
  nativeCompile(
    source,
    {
      downTranspileToES3: true,
      presets: [AVRPreset]
    },
    callback
  );
};

export { compile };
