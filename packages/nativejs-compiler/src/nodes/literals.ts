import * as ts from "typescript";
import { CodeTemplate, CodeTemplateFactory } from "../core/template";
import { IScope } from "../core/program";
import { ArrayType, StructType, DictType } from "../core/types/NativeTypes";
import { CVariable, CVariableAllocation } from "./variable";
import { AssignmentHelper, CAssignment } from "./assignment";
import { CRegexSearchFunction } from "./regexfunc";
import {
  HeaderRegistry,
  ArrayCreateHeaderType,
  ArrayPushHeaderType,
  BooleanHeaderType,
  RegexMatchHeaderType
} from "../core/header";
import { ScopeUtil } from "../core/scope/ScopeUtil";

import debug from "debug";

const log = debug("nodes");

@CodeTemplate(`{expression}`, ts.SyntaxKind.ArrayLiteralExpression)
class CArrayLiteralExpression {
  public expression: string;
  constructor(scope: IScope, node: ts.ArrayLiteralExpression) {
    let arrSize = node.elements.length;
    let type = scope.root.typeVisitor.inferNodeType(node);
    if (type instanceof ArrayType) {
      let varName: string;
      let canUseInitializerList = node.elements.every(
        e =>
          e.kind == ts.SyntaxKind.NumericLiteral ||
          e.kind == ts.SyntaxKind.StringLiteral
      );
      if (!type.isDynamicArray && canUseInitializerList) {
        varName = scope.root.temporaryVariables.addNewTemporaryVariable(
          node,
          "tmp_array"
        );
        let s = "{ ";
        for (let i = 0; i < arrSize; i++) {
          if (i != 0) s += ", ";
          let cExpr = CodeTemplateFactory.createForNode(
            scope,
            node.elements[i]
          );
          s += typeof cExpr === "string" ? cExpr : (<any>cExpr).resolve();
        }
        s += " }";
        scope.variables.push(
          new CVariable(scope, varName, type, { initializer: s })
        );
      } else {
        if (type.isDynamicArray) {
          varName = scope.root.memoryManager.getReservedTemporaryVarName(node);
          scope.func.variables.push(
            new CVariable(scope, varName, type, { initializer: "NULL" })
          );
          HeaderRegistry.declareDependency(ArrayCreateHeaderType);
          scope.statements.push(
            "ARRAY_CREATE(" +
              varName +
              ", " +
              Math.max(arrSize, 2) +
              ", " +
              arrSize +
              ");\n"
          );
        } else {
          varName = scope.root.temporaryVariables.addNewTemporaryVariable(
            node,
            "tmp_array"
          );
          scope.variables.push(new CVariable(scope, varName, type));
        }

        for (let i = 0; i < arrSize; i++) {
          let assignment = new CAssignment(
            scope,
            varName,
            i + "",
            type,
            node,
            node.elements[i]
          );
          scope.statements.push(assignment);
        }
      }
      this.expression = type.isDynamicArray
        ? "((void *)" + varName + ")"
        : varName;
    } else
      this.expression = "/* Unsupported use of array literal expression */";
  }
}

@CodeTemplate(
  `
{#statements}
    {#if isStruct || isDict}
        {allocator}
        {initializers}
    {/if}
{/statements}
{expression}`,
  ts.SyntaxKind.ObjectLiteralExpression
)
class CObjectLiteralExpression {
  public expression: string = "";
  public isStruct: boolean;
  public isDict: boolean;
  public allocator: CVariableAllocation;
  public initializers: CAssignment[];
  constructor(scope: IScope, node: ts.ObjectLiteralExpression) {
    let type = scope.root.typeVisitor.inferNodeType(node);
    this.isStruct = type instanceof StructType;
    this.isDict = type instanceof DictType;
    if (this.isStruct || this.isDict) {
      let varName = scope.root.memoryManager.getReservedTemporaryVarName(node);

      scope.func.variables.push(
        new CVariable(scope, varName, type, { initializer: "NULL" })
      );

      this.allocator = new CVariableAllocation(scope, varName, type, node);
      this.initializers = node.properties
        .filter(p => p.kind == ts.SyntaxKind.PropertyAssignment)
        .map(p => <ts.PropertyAssignment>p)
        .map(
          p =>
            new CAssignment(
              scope,
              varName,
              this.isDict ? '"' + p.name.getText() + '"' : p.name.getText(),
              type,
              node,
              p.initializer
            )
        );

      this.expression = varName;
    } else
      this.expression = "/* Unsupported use of object literal expression */";
  }
}

var regexNames = {};

@CodeTemplate(`{expression}`, ts.SyntaxKind.RegularExpressionLiteral)
class CRegexLiteralExpression {
  public expression: string = "";
  constructor(scope: IScope, node: ts.RegularExpressionLiteral) {
    let template = node.text;
    if (!regexNames[template]) {
      regexNames[
        template
      ] = scope.root.temporaryVariables.addNewTemporaryVariable(null, "regex");
      scope.root.functions.splice(
        scope.parent ? -2 : -1,
        0,
        new CRegexSearchFunction(scope, template, regexNames[template])
      );
    }
    this.expression = regexNames[template];
    HeaderRegistry.declareDependency(RegexMatchHeaderType);
  }
}

@CodeTemplate(`{value}`, ts.SyntaxKind.StringLiteral)
export class CString {
  public value: string;
  constructor(scope: IScope, value: ts.StringLiteral | string) {
    let s = typeof value === "string" ? '"' + value + '"' : value.getText();
    s = s.replace(/\\u([A-Fa-f0-9]{4})/g, (match, g1) =>
      String.fromCharCode(parseInt(g1, 16))
    );
    if (s.indexOf("'") == 0)
      this.value =
        '"' +
        s
          .replace(/"/g, '\\"')
          .replace(/([^\\])\\'/g, "$1'")
          .slice(1, -1) +
        '"';
    else this.value = s;
  }
}

@CodeTemplate(`{value}`, ts.SyntaxKind.NumericLiteral)
export class CNumber {
  public value: string;
  constructor(scope: IScope, value: ts.Node) {
    const { typeVisitor } = scope.root;
    // look for parent binary expressions
    let parent = ScopeUtil.findParentWithKind(
      value,
      ts.SyntaxKind.BinaryExpression
    );
    // if it's inside a float expression
    if (
      parent &&
      scope.root.typeInferencer.isFloatExpression(<ts.BinaryExpression>parent)
    ) {
      this.value = `((float)${value.getText()})`;
    } else {
      this.value = value.getText();
    }
  }
}

@CodeTemplate(`{value}`, [
  ts.SyntaxKind.TrueKeyword,
  ts.SyntaxKind.FalseKeyword
])
export class CBoolean {
  public value: string;
  constructor(scope: IScope, value: ts.Node) {
    this.value = value.kind == ts.SyntaxKind.TrueKeyword ? "TRUE" : "FALSE";
    HeaderRegistry.declareDependency(BooleanHeaderType);
  }
}

@CodeTemplate(`NULL`, ts.SyntaxKind.NullKeyword)
export class CNull {
  constructor(scope: IScope, value: ts.Node) {}
}
