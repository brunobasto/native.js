import * as ts from "typescript";
import { IScope } from "./program";
import { NativeType } from "./types/NativeTypes";
import { TypeVisitor } from "./types/TypeVisitor";

export interface IResolver {
  matchesNode(s: TypeVisitor, n: ts.Node): boolean;
  returnType(s: TypeVisitor, n: ts.Node): NativeType;
  needsDisposal(s: TypeVisitor, n: ts.Node): boolean;
  getTempVarName(s: TypeVisitor, n: ts.Node): string;
  createTemplate(s: IScope, n: ts.Node): any;
  getEscapeNode(s: TypeVisitor, n: ts.Node): ts.Node;
}

let standardCallResolvers: IResolver[] = [];
export function StandardCallResolver(target: any) {
  standardCallResolvers.push(new target());
}
export class StandardCallHelper {
  public static isStandardCall(typeVisitor: TypeVisitor, node: ts.Node) {
    for (let resolver of standardCallResolvers)
      if (resolver.matchesNode(typeVisitor, node)) return true;

    return false;
  }
  public static createTemplate(scope: IScope, node: ts.Node) {
    for (let resolver of standardCallResolvers)
      if (resolver.matchesNode(scope.root.typeVisitor, node))
        return resolver.createTemplate(scope, node);

    return null;
  }
  public static getReturnType(typeVisitor: TypeVisitor, node: ts.Node) {
    for (let resolver of standardCallResolvers)
      if (resolver.matchesNode(typeVisitor, node))
        return resolver.returnType(typeVisitor, node);
    return null;
  }
  public static needsDisposal(typeVisitor: TypeVisitor, node: ts.Node) {
    for (let resolver of standardCallResolvers)
      if (resolver.matchesNode(typeVisitor, node))
        return resolver.needsDisposal(typeVisitor, node);
    return false;
  }
  public static getTempVarName(typeVisitor: TypeVisitor, node: ts.Node) {
    for (let resolver of standardCallResolvers)
      if (resolver.matchesNode(typeVisitor, node))
        return resolver.getTempVarName(typeVisitor, node);
    console.log(
      "Internal error: cannot find matching resolver for node '" +
        node.getText() +
        "' in StandardCallHelper.getTempVarName"
    );
    return "tmp";
  }
  public static getEscapeNode(typeVisitor: TypeVisitor, node: ts.Node) {
    for (let resolver of standardCallResolvers)
      if (resolver.matchesNode(typeVisitor, node))
        return resolver.getEscapeNode(typeVisitor, node);

    return null;
  }
}
