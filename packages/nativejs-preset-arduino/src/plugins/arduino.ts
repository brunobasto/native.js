import { INativeExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { HeaderRegistry } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { Plugin } from "nativejs-compiler";
import * as ts from "typescript";
import { ArduinoHeaderType } from "../headers/arduino";

export class ArduinoPlugin implements Plugin {
  public execute(scope: IScope, node: ts.Node): INativeExpression {
    return null;
  }

  public processTypes(node: ts.Node) {}

  public matchesNode(node: ts.Node): boolean {
    HeaderRegistry.declareDependency(ArduinoHeaderType);

    return false;
  }
}
