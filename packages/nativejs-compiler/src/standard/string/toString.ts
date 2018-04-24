import * as ts from "typescript";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../core/program";
import { RegexBuilder, RegexMachine, RegexState } from "../../util/regex";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import {
  ArrayType,
  NumberVarType,
  StringVarType,
  TypeHelper
} from "../../core/types";

@StandardCallResolver
class StringToStringResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.inferNodeType(propAccess.expression);
    return (
      ["toString", "valueOf"].indexOf(propAccess.name.getText()) > -1 &&
      objType == StringVarType
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return StringVarType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return CodeTemplateFactory.createForNode(
      scope,
      node.expression as ts.PropertyAccessExpression
    );
  }
  public needsDisposal(typeHelper: TypeHelper, node: ts.CallExpression) {
    return false;
  }
  public getTempVarName(typeHelper: TypeHelper, node: ts.CallExpression) {
    return null;
  }
  public getEscapeNode(typeHelper: TypeHelper, node: ts.CallExpression) {
    return null;
  }
}
