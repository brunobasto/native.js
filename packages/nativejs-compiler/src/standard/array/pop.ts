import * as ts from "typescript";
import { ArrayPopHeaderType, HeaderRegistry } from "../../core/header";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { ScopeUtil } from "../../core/scope/ScopeUtil";
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
class ArrayPopResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() == "pop" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(
      propAccess.expression
    ) as ArrayType;
    return objType.elementType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayPop(scope, node);
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
{#if useReturnValue}
  ARRAY_POP_WITH_RETURN({varAccess})
{#else}
  ARRAY_POP({varAccess})
{/if}
`)
class CArrayPop {
  public useReturnValue: boolean = true;
  public varAccess: CElementAccess = null;

  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    call.parent.kind == ts.SyntaxKind.Block;
    // do not use returned value if it's a direct statement
    if (call.parent.kind === ts.SyntaxKind.ExpressionStatement) {
      this.useReturnValue = false;
    }
    HeaderRegistry.declareDependency(ArrayPopHeaderType);
  }
}
