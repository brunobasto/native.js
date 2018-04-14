import { execFile } from "child_process";
import { compile } from "../../src/util/compile";
import { gcc } from "../../src/util/gcc";

const compileToC = jsSource => {
  // returns c output code
  return compile(jsSource, {
    downTranspileToES3: true,
    presets: ["hardware-preset-standard"]
  });
};

const compileToExecutable = (cSource, callback) => {
  // executes gcc and returns path to executable
  gcc(cSource, callback);
};

const execute = (executablePath, callback) => {
  execFile(executablePath, [], (error, stdout) => {
    if (error) {
      throw error;
    }
    callback(stdout.toString());
  });
};

const evaluator = (jsSource, callback: Function) => {
  // compile source to c
  const cSource = compileToC(jsSource);
  // compile c to executable
  compileToExecutable(cSource, executablePath => {
    // execute and return result
    execute(executablePath, result => callback(result));
  });
};

export { evaluator };
