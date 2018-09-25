import { execFile } from "child_process";
import { compile } from "../../src/util/compile";
import { gcc } from "../../src/util/gcc";
import debug from "debug";

const log = debug("assert");

const compileToC = (jsSource, callback) => {
  // returns c output code
  compile(
    jsSource,
    {
      downTranspileToES3: true,
      presets: ["nativejs-preset-standard"]
    },
    callback
  );
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

const evaluator = (jsSource, callback: (result) => void) => {
  // compile source to c
  compileToC(jsSource, cSource => {
    // // compile c to executable
    compileToExecutable(cSource, executablePath => {
      // execute and return result
      execute(executablePath, result => {
        callback(result);
      });
    });
  });
};

export { evaluator };
