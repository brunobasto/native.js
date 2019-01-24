import * as ts from "typescript";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import { StringType } from "../../core/types/NativeTypes";
import { TypeVisitor } from "../../core/types/TypeVisitor";

@StandardCallResolver
class StringToStringResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return (
      ["toString", "valueOf"].indexOf(propAccess.name.getText()) > -1 &&
      objType === StringType
    );
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    return StringType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return CodeTemplateFactory.createForNode(
      scope,
      node.expression as ts.PropertyAccessExpression
    );
  }
  public needsDisposal(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return false;
  }
  public getTempVarName(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return null;
  }
  public getEscapeNode(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return null;
  }
}
