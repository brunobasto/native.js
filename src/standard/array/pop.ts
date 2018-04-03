import * as ts from "typescript";
import { ArrayPopHeaderType, HeaderRegistry } from "../../core/header";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
import { CVariable } from "../../nodes/variable";
import { IScope } from "../../program";
import { IResolver, StandardCallResolver } from "../../resolver";
import { CodeTemplate, CodeTemplateFactory } from "../../template";
import {
  ArrayType,
  NumberVarType,
  StringVarType,
  TypeHelper
} from "../../types";

@StandardCallResolver
class ArrayPopResolver implements IResolver {
  public matchesNode(typeHelper: TypeHelper, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.getCType(propAccess.expression);
    return (
      propAccess.name.getText() == "pop" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeHelper: TypeHelper, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeHelper.getCType(propAccess.expression) as ArrayType;
    return objType.elementType;
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArrayPop(scope, node);
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

@CodeTemplate(`ARRAY_POP({varAccess})`)
class CArrayPop {
  public topExpressionOfStatement: boolean;
  public tempVarName: string = "";
  public varAccess: CElementAccess = null;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    HeaderRegistry.declareDependency(ArrayPopHeaderType);
  }
}
