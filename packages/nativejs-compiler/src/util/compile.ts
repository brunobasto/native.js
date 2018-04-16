/// <reference path="../../../../node_modules/@types/node/index.d.ts" />

import * as fs from "fs";
import * as ts from "typescript";
import debug from "debug";
import { CProgram } from "../core/program";
import { fileSync as createTempFile } from "tmp";
import { resolvePresets } from "./resolvePresets";

const log = debug("compile");

const compile = (source, options: any = {}, callback: Function) => {
  if (options.downTranspileToES3) {
    source = ts.transpileModule(source.toString("utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES3,
        noImplicitUseStrict: true
      }
    }).outputText;
  }

  const tempFile = createTempFile({ postfix: ".ts" });
  let fileName = tempFile.name;

  fs.writeFile(fileName, source, () => {
    const program = ts.createProgram([fileName], {
      allowJs: false,
      noLib: true,
      pretty: true
    });
    const presets = resolvePresets(options.presets);
    const output = new CProgram(program, presets)["resolve"]();

    log(output);
    callback(output);
  });
};

export { compile };
