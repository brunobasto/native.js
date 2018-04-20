import * as ts from "typescript";
import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { HeaderRegistry } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { Plugin } from "nativejs-compiler";
import { ArduinoHeaderType } from "../headers/arduino";

export class ArduinoPlugin implements Plugin {
  execute(scope: IScope, node: ts.Node, handler: Object): CExpression {
    return null;
  }

  processTypes(node: ts.Node) {}

  matchesNode(node: ts.Node): boolean {
    HeaderRegistry.declareDependency(ArduinoHeaderType);

    return false;
  }
}
