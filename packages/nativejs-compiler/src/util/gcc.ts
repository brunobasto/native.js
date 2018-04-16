import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import debug from "debug";
import { exec } from "child_process";
import { fileSync, tmpNameSync } from "tmp";

const log = debug("gcc");

const gcc = (source, callback) => {
  const sourceTempFile = fileSync({
    keep: process.env["DEBUG"],
    postfix: ".c"
  });
  let sourceFileName = sourceTempFile.name;
  fs.writeFile(sourceFileName, source, () => {
    log("compiling file", sourceFileName);
    const template = path.join(os.tmpdir(), "tmp-XXXXXX");
    const hexFileName = tmpNameSync({ template });
    const args = [
      sourceFileName,
      "-ansi",
      "-pedantic",
      "-Wall",
      "-g",
      "-o",
      hexFileName
    ];
    exec(`gcc ${args.join(" ")}`, (error, stdout, stderr) => {
      if (error) {
        throw error;
      }
      const gccWarns = stdout.toString();
      if (gccWarns) {
        throw new Error(`GCC has warnings ${gccWarns}`);
      }
      const gccErrors = stderr.toString();
      if (gccErrors) {
        throw new Error(`GCC has errors ${gccErrors}`);
      }
      callback(hexFileName);
    });
  });
};

export { gcc };
