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

const compileToExecutable = cSource => {
  // executes gcc and returns path to executable
  return gcc(cSource);
};

const execute = executablePath => {
  const output = spawnSync(executablePath, []);
  return output.stdout.toString();
};

const evaluator = jsSource => {
  // compile source to c
  const cSource = compileToC(jsSource);
  // compile c to executable
  const executablePath = compileToExecutable(cSource);
  // execute
  const result = execute(executablePath);
  // return result
  return result;
};

export { evaluator };
