import { spawn } from "child_process";
import { fileSync as createTempFile } from "tmp";
import * as fs from "fs";

const gcc = (source, callback) => {
  const sourceTempFile = createTempFile({ postfix: ".c" });
  let sourceFileName = sourceTempFile.name;

  fs.writeFileSync(sourceFileName, source);

  const hexTempFile = createTempFile({ mode: 0o777, postfix: ".hex" });
  let hexFileName = hexTempFile.name;

  const output = spawn("gcc", [
    sourceFileName,
    "-ansi",
    "-pedantic",
    "-Wall",
    "-g",
    "-o",
    hexFileName
  ]);

  output.stderr.on("data", data => console.log(data));
  output.on("close", code => {
    if (code > 0) {
      throw new Error("Program execution failed.");
    }
    callback(hexFileName);
  });
};

export { gcc };
