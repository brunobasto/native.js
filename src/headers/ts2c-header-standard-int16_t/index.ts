import * as ts from "typescript";
import { Header, Int16HeaderType } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { IScope } from "../../program";
import { CodeTemplate } from "../../template";

export class StandardInt16Header implements Header {
  public getType() {
    return Int16HeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
typedef short int16_t;
`)
class Template {}
