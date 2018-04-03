import * as ts from "typescript";
import { BooleanHeaderType, Header } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { IScope } from "../../program";
import { CodeTemplate } from "../../template";

export class StandardBooleanHeader implements Header {
  public getType() {
    return BooleanHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#define TRUE 1
#define FALSE 0
`)
class Template {}
