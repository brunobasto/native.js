import * as ts from "typescript";
import { Header, Uint8HeaderType } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { IScope } from "../../program";
import { CodeTemplate } from "../../template";

export class StandardUint8Header implements Header {
  public getType() {
    return Uint8HeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
typedef unsigned char uint8_t;
`)
class Template {}
