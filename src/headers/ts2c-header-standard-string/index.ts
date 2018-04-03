import * as ts from "typescript";
import { Header, StringHeaderType } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { IScope } from "../../program";
import { CodeTemplate } from "../../template";

export class StandardStringHeader implements Header {
  public getType() {
    return StringHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <string.h>
`)
class Template {}
