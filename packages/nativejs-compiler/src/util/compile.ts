import debug from "debug";
import * as fs from "fs";
import { fileSync as createTempFile } from "tmp";
import * as ts from "typescript";
import { CProgram } from "../core/program";
import { resolvePresets } from "./resolvePresets";

const log = debug("compile");

const compile = (source, options: any = {}, callback: () => void) => {
  if (options.downTranspileToES3) {
    source = ts.transpileModule(source.toString("utf8"), {
      compilerOptions: {
        noImplicitUseStrict: true,
        target: ts.ScriptTarget.ES3
      }
    }).outputText;
  }

  const tempFile = createTempFile({ postfix: ".ts" });
  const fileName = tempFile.name;

  fs.writeFile(fileName, source, () => {
    const program = ts.createProgram([fileName], {
      allowJs: false,
      noLib: true,
      pretty: true
    });
    const presets = resolvePresets(options.presets);
    const output = new CProgram(program, presets).resolve();

    log(output);
    callback(output);
  });
};

export { compile };
