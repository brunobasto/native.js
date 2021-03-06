import * as ts from "typescript";
import {
  HeaderRegistry,
  StringHeaderType,
  StringPositionHeaderType
} from "../../core/header";
import { IScope } from "../../core/program";
import { IResolver, StandardCallResolver } from "../../core/resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../core/template";
import {
  ArrayType,
  IntegerType,
  StringType
} from "../../core/types/NativeTypes";
import { TypeVisitor } from "../../core/types/TypeVisitor";
import { CElementAccess } from "../../nodes/elementaccess";
import { INativeExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";

@StandardCallResolver
class StringIndexOfResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return propAccess.name.getText() === "indexOf" && objType === StringType;
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    return IntegerType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CStringIndexOf(scope, node);
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
{#if !topExpressionOfStatement}
    str_pos({stringAccess}, {arg1})
{/if}`)
class CStringIndexOf {
  public topExpressionOfStatement: boolean;
  public arg1: INativeExpression;
  public stringAccess: CElementAccess;
  constructor(scope: IScope, call: ts.CallExpression) {
    HeaderRegistry.declareDependency(StringHeaderType);
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.topExpressionOfStatement =
      call.parent.kind === ts.SyntaxKind.ExpressionStatement;
    if (!this.topExpressionOfStatement) {
      if (call.arguments.length === 1) {
        this.stringAccess = new CElementAccess(scope, propAccess.expression);
        this.arg1 = CodeTemplateFactory.createForNode(scope, call.arguments[0]);
        HeaderRegistry.declareDependency(StringPositionHeaderType);
      } else {
        console.log(
          "Unsupported number of parameters in " +
            call.getText() +
            ". Expected one parameter."
        );
      }
    }
  }
}
