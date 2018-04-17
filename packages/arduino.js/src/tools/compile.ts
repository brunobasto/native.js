import { compile as nativeCompile } from "nativejs-compiler/src/util/compile";
import { ArduinoPreset } from "nativejs-preset-arduino";

const compile = (source, callback) => {
  nativeCompile(
    source,
    {
      downTranspileToES3: true,
      presets: [ArduinoPreset]
    },
    callback
  );
};

export { compile };
