/// <reference path="../../../../node_modules/@types/node/index.d.ts" />

import * as ts from "typescript";
import { fileSync as createTempFile } from "tmp";
import * as fs from "fs";
import { CProgram } from "../core/program";
import { resolvePresets } from "./resolvePresets";

const compile = (source, options: any = {}) => {
  if (options.downTranspileToES3) {
    source = ts.transpileModule(source.toString("utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES3,
        noImplicitUseStrict: true
      }
    }).outputText;
  }

  const tmpobj = createTempFile({ postfix: ".ts" });
  let fileName = tmpobj.name;

  fs.writeFileSync(fileName, source);

  const program = ts.createProgram([fileName], {
    allowJs: false,
    noLib: true,
    pretty: true
  });

  const presets = resolvePresets(options.presets);

  return new CProgram(program, presets)["resolve"]();
};

export { compile };
