import * as ts from "typescript";
import { IScope } from "./program";
import { NativeType } from "./types/NativeTypes";
import { TypeHelper } from "./types/TypeHelper";

export interface IResolver {
  matchesNode(s: TypeHelper, n: ts.Node): boolean;
  returnType(s: TypeHelper, n: ts.Node): NativeType;
  needsDisposal(s: TypeHelper, n: ts.Node): boolean;
  getTempVarName(s: TypeHelper, n: ts.Node): string;
  createTemplate(s: IScope, n: ts.Node): any;
  getEscapeNode(s: TypeHelper, n: ts.Node): ts.Node;
}

var standardCallResolvers: IResolver[] = [];
export function StandardCallResolver(target: any) {
  standardCallResolvers.push(new target());
}
export class StandardCallHelper {
  public static isStandardCall(typeHelper: TypeHelper, node: ts.Node) {
    for (var resolver of standardCallResolvers)
      if (resolver.matchesNode(typeHelper, node)) return true;

    return false;
  }
  public static createTemplate(scope: IScope, node: ts.Node) {
    for (var resolver of standardCallResolvers)
      if (resolver.matchesNode(scope.root.typeHelper, node))
        return resolver.createTemplate(scope, node);

    return null;
  }
  public static getReturnType(typeHelper: TypeHelper, node: ts.Node) {
    for (var resolver of standardCallResolvers)
      if (resolver.matchesNode(typeHelper, node))
        return resolver.returnType(typeHelper, node);
    return null;
  }
  public static needsDisposal(typeHelper: TypeHelper, node: ts.Node) {
    for (var resolver of standardCallResolvers)
      if (resolver.matchesNode(typeHelper, node))
        return resolver.needsDisposal(typeHelper, node);
    return false;
  }
  public static getTempVarName(typeHelper: TypeHelper, node: ts.Node) {
    for (var resolver of standardCallResolvers)
      if (resolver.matchesNode(typeHelper, node))
        return resolver.getTempVarName(typeHelper, node);
    console.log(
      "Internal error: cannot find matching resolver for node '" +
        node.getText() +
        "' in StandardCallHelper.getTempVarName"
    );
    return "tmp";
  }
  public static getEscapeNode(typeHelper: TypeHelper, node: ts.Node) {
    for (var resolver of standardCallResolvers)
      if (resolver.matchesNode(typeHelper, node))
        return resolver.getEscapeNode(typeHelper, node);

    return null;
  }
}
