import * as ts from "typescript";
import { ArrayRemoveHeaderType, HeaderRegistry } from "../../core/header";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import {
  ArrayType,
  NumberVarType,
  StringVarType,
  TypeHelper
} from "../../core/types";

@StandardCallResolver
class ArrayShiftResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() == "shift" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    return NumberVarType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayShift(scope, node);
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

@CodeTemplate(`
{#statements}
    {tempVarName} = {varAccess}->data[0];
    ARRAY_REMOVE({varAccess}, 0, 1);
{/statements}
{#if !topExpressionOfStatement}
    {tempVarName}
{/if}`)
class CArrayShift {
  public topExpressionOfStatement: boolean;
  public tempVarName: string = "";
  public varAccess: CElementAccess = null;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    this.tempVarName = scope.root.typeHelper.addNewTemporaryVariable(
      propAccess,
      "value"
    );
    const type = scope.root.typeHelper.inferNodeType(
      propAccess.expression
    ) as ArrayType;
    scope.variables.push(
      new CVariable(scope, this.tempVarName, type.elementType)
    );
    this.topExpressionOfStatement =
      call.parent.kind == ts.SyntaxKind.ExpressionStatement;
    HeaderRegistry.declareDependency(ArrayRemoveHeaderType);
  }
}
