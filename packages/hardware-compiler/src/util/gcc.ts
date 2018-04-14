import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { fileSync as createTempFile } from "tmp";

const gcc = (source, callback) => {
  const sourceTempFile = createTempFile({ postfix: ".c" });
  let sourceFileName = sourceTempFile.name;

  fs.writeFileSync(sourceFileName, source);

  const tempDir = fs.mkdtempSync(path.resolve(process.cwd(), "temp"));

  const hexTempFile = createTempFile({
    dir: tempDir,
    keep: true,
    mode: 0o775,
    postfix: ".out"
  });
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
