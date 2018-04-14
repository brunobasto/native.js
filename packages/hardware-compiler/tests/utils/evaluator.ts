import { spawnSync } from "child_process";
import { compile } from "../../src/util/compile";
import { gcc } from "../../src/util/gcc";

const compileToC = jsSource => {
  // returns c output code
  return compile(jsSource, {
    downTranspileToES3: false,
    presets: ["hardware-preset-standard"]
  });
};

const compileToExecutable = (cSource, callback) => {
  // executes gcc and returns path to executable
  gcc(cSource, callback);
};

const execute = executablePath => {
  const output = spawnSync(executablePath, []);
  if (output.error) {
    throw output.error;
  }
  return output.stdout.toString();
};

const evaluator = (jsSource, callback: Function) => {
  // compile source to c
  const cSource = compileToC(jsSource);
  // compile c to executable
  compileToExecutable(cSource, executablePath => {
    // execute
    const result = execute(executablePath);
    // return result
    callback(result);
  });
};

export { evaluator };
