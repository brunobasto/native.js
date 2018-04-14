import { spawnSync } from "child_process";
import { fileSync as createTempFile } from "tmp";
import * as fs from "fs";

const gcc = source => {
  const sourceTempFile = createTempFile({ postfix: ".c" });
  let sourceFileName = sourceTempFile.name;

  fs.writeFileSync(sourceFileName, source);

  const hexTempFile = createTempFile({ postfix: ".hex" });
  let hexFileName = hexTempFile.name;

  const output = spawnSync("gcc", [
    sourceFileName,
    "-ansi",
    "-pedantic",
    "-Wall",
    "-g",
    "-o",
    hexFileName
  ]);

  if (output.error) {
    throw output.error;
  }

  return hexFileName;
};

export { gcc };
