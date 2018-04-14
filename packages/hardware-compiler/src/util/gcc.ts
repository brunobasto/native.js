import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { exec } from "child_process";
import { fileSync, tmpNameSync } from "tmp";

const gcc = (source, callback) => {
  const sourceTempFile = fileSync({ postfix: ".c" });
  let sourceFileName = sourceTempFile.name;
  fs.writeFileSync(sourceFileName, source);
  const template = path.join(os.tmpdir(), 'tmp-XXXXXX');
  console.log('template', template);
  const hexFileName = tmpNameSync({template});
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
