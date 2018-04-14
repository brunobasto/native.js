import { exec } from "child_process";
import { fileSync as createTempFile } from "tmp";
import * as fs from "fs";

const gcc = (source, callback) => {
  const sourceTempFile = createTempFile({ postfix: ".c" });
  let sourceFileName = sourceTempFile.name;

  fs.writeFileSync(sourceFileName, source);

  const hexTempFile = createTempFile({ keep: true, mode: 0o777, postfix: ".hex" });
  let hexFileName = hexTempFile.name;
  const args = [
    sourceFileName,
    "-ansi",
    "-pedantic",
    "-Wall",
    "-g",
    "-o",
    hexFileName
  ];
  exec(`gcc ${args.join(" ")}`, (error, stdout) => {
    if (error) {
      throw error;
    }
    callback(hexFileName);
  });
};

export { gcc };
