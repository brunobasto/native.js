import { compile as nativeCompile } from "nativejs-compiler/src/util/compile";
import { ArduinoPreset } from "nativejs-preset-arduino";

const transpile = (source, callback) => {
  nativeCompile(
    source,
    {
      downTranspileToES3: true,
      presets: [ArduinoPreset]
    },
    callback
  );
};

export { transpile };
