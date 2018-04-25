import * as ts from "typescript";
import { HeaderRegistry } from "../../core/header";
import {
  CElementAccess,
  CSimpleElementAccess
} from "../../nodes/elementaccess";
import { CExpression, CSimpleBinaryExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import {
  ArrayType,
  IntegerType,
  StringType
} from "../../core/types/NativeTypes";
import { TypeVisitor } from "../../core/types/TypeVisitor";

@StandardCallResolver
class ArrayIndexOfResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() === "indexOf" && objType instanceof ArrayType
    );
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    return IntegerType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayIndexOf(scope, node);
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

@CodeTemplate(`
{#statements}
    {#if !topExpressionOfStatement && staticArraySize}
        {tempVarName} = -1;
        for ({iteratorVarName} = 0; {iteratorVarName} < {staticArraySize}; {iteratorVarName}++) {
            if ({comparison}) {
                {tempVarName} = {iteratorVarName};
                break;
            }
        }
    {#elseif !topExpressionOfStatement}
        {tempVarName} = -1;
        for ({iteratorVarName} = 0; {iteratorVarName} < {varAccess}->size; {iteratorVarName}++) {
            if ({comparison}) {
                {tempVarName} = {iteratorVarName};
                break;
            }
        }
    {/if}
{/statements}
{#if !topExpressionOfStatement}
    {tempVarName}
{/if}`)
class CArrayIndexOf {
  public topExpressionOfStatement: boolean;
  public tempVarName: string = "";
  public iteratorVarName: string;
  public comparison: CSimpleBinaryExpression;
  public staticArraySize: string = "";
  public varAccess: CElementAccess = null;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = scope.root.typeVisitor.inferNodeType(
      propAccess.expression
    ) as ArrayType;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    const args = call.arguments.map(a =>
      CodeTemplateFactory.createForNode(scope, a)
    );
    this.topExpressionOfStatement =
      call.parent.kind === ts.SyntaxKind.ExpressionStatement;

    if (!this.topExpressionOfStatement) {
      this.tempVarName = scope.root.temporaryVariables.addNewTemporaryVariable(
        propAccess,
        "arr_pos"
      );
      this.iteratorVarName = scope.root.temporaryVariables.addNewIteratorVariable(
        propAccess
      );
      this.staticArraySize = objType.isDynamicArray
        ? ""
        : objType.capacity + "";
      scope.variables.push(new CVariable(scope, this.tempVarName, IntegerType));
      scope.variables.push(
        new CVariable(scope, this.iteratorVarName, IntegerType)
      );
      const arrayElementAccess = new CSimpleElementAccess(
        scope,
        objType,
        this.varAccess,
        this.iteratorVarName
      );
      this.comparison = new CSimpleBinaryExpression(
        scope,
        arrayElementAccess,
        objType.elementType,
        args[0],
        objType.elementType,
        ts.SyntaxKind.EqualsEqualsToken,
        call
      );
    }
  }
}
