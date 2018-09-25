import * as ts from "typescript";
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
// import { RegexBuilder, RegexMachine, RegexState } from "../../util/regex";

@StandardCallResolver
class StringCharCodeAtResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return propAccess.name.getText() === "charCodeAt" && objType === StringType;
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    return IntegerType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CStringSearch(scope, node);
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
    str_char_code_at({strAccess}, {position})
{/if}`)
class CStringSearch {
  public topExpressionOfStatement: boolean;
  public strAccess: CElementAccess;
  public position: INativeExpression;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.topExpressionOfStatement =
      call.parent.kind === ts.SyntaxKind.ExpressionStatement;
    if (!this.topExpressionOfStatement) {
      if (call.arguments.length === 1) {
        this.strAccess = new CElementAccess(scope, propAccess.expression);
        this.position = CodeTemplateFactory.createForNode(
          scope,
          call.arguments[0]
        );
        scope.root.headerFlags.str_char_code_at = true;
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
