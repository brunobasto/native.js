import * as ts from "typescript";
import { ArrayCreateHeaderType, HeaderRegistry } from "../../core/header";
import { CElementAccess } from "../../nodes/elementaccess";
import { CExpression } from "../../nodes/expressions";
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
class ArraySliceResolver implements IResolver {
  public matchesNode(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    if (call.expression.kind != ts.SyntaxKind.PropertyAccessExpression) {
      return false;
    }
    const propAccess = call.expression as ts.PropertyAccessExpression;
    const objType = typeVisitor.inferNodeType(propAccess.expression);
    return (
      propAccess.name.getText() === "slice" &&
      objType instanceof ArrayType &&
      objType.isDynamicArray
    );
  }
  public returnType(typeVisitor: TypeVisitor, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    return typeVisitor.inferNodeType(propAccess.expression);
  }
  public createTemplate(scope: IScope, node: ts.CallExpression) {
    return new CArraySlice(scope, node);
  }
  public needsDisposal(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    // if parent is expression statement, then this is the top expression
    // and thus return value is not used, so the temporary variable will not be created
    return node.parent.kind != ts.SyntaxKind.ExpressionStatement;
  }
  public getTempVarName(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return "tmp_slice";
  }
  public getEscapeNode(typeVisitor: TypeVisitor, node: ts.CallExpression) {
    return null;
  }
}

@CodeTemplate(`
{#statements}
    {#if !topExpressionOfStatement && !endIndexArg}
        {sizeVarName} = ({startIndexArg}) < 0 ? -({startIndexArg}) : {varAccess}->size - ({startIndexArg});
        {startVarName} = ({startIndexArg}) < 0 ? {varAccess}->size + ({startIndexArg}) : ({startIndexArg});
        ARRAY_CREATE({tempVarName}, {sizeVarName}, {sizeVarName});
        for ({iteratorVarName} = 0; {iteratorVarName} < {sizeVarName}; {iteratorVarName}++)
            {tempVarName}->data[{iteratorVarName}] = {varAccess}->data[{iteratorVarName} + {startVarName}];
    {#elseif !topExpressionOfStatement && endIndexArg}
        {startVarName} = ({startIndexArg}) < 0 ? {varAccess}->size + ({startIndexArg}) : ({startIndexArg});
        {endVarName} = ({endIndexArg}) < 0 ? {varAccess}->size + ({endIndexArg}) : ({endIndexArg});
        {sizeVarName} = {endVarName} - {startVarName};
        ARRAY_CREATE({tempVarName}, {sizeVarName}, {sizeVarName});
        for ({iteratorVarName} = 0; {iteratorVarName} < {sizeVarName}; {iteratorVarName}++)
            {tempVarName}->data[{iteratorVarName}] = {varAccess}->data[{iteratorVarName} + {startVarName}];
    {/if}
{/statements}
{#if topExpressionOfStatement}
    /* slice doesn't have side effects, skipping */
{#else}
    {tempVarName}
{/if}`)
class CArraySlice {
  public topExpressionOfStatement: boolean;
  public tempVarName: string = "";
  public iteratorVarName: string = "";
  public sizeVarName: string = "";
  public startVarName: string = "";
  public endVarName: string = "";
  public varAccess: CElementAccess;
  public startIndexArg: CExpression;
  public endIndexArg: CExpression;
  constructor(scope: IScope, call: ts.CallExpression) {
    const propAccess = call.expression as ts.PropertyAccessExpression;
    this.varAccess = new CElementAccess(scope, propAccess.expression);
    const args = call.arguments.map(a =>
      CodeTemplateFactory.createForNode(scope, a)
    );
    this.startIndexArg = args[0];
    this.endIndexArg = args.length === 2 ? args[1] : null;
    this.topExpressionOfStatement =
      call.parent.kind === ts.SyntaxKind.ExpressionStatement;
    if (!this.topExpressionOfStatement) {
      this.tempVarName = scope.root.memoryManager.getReservedTemporaryVarName(
        call
      );
      const type = scope.root.typeVisitor.inferNodeType(propAccess.expression);
      if (!scope.root.memoryManager.variableWasReused(call)) {
        scope.variables.push(new CVariable(scope, this.tempVarName, type));
      }
      this.iteratorVarName = scope.root.temporaryVariables.addNewIteratorVariable(
        propAccess
      );
      scope.variables.push(
        new CVariable(scope, this.iteratorVarName, IntegerType)
      );
      this.sizeVarName = scope.root.temporaryVariables.addNewTemporaryVariable(
        propAccess,
        "slice_size"
      );
      scope.variables.push(new CVariable(scope, this.sizeVarName, IntegerType));
      this.startVarName = scope.root.temporaryVariables.addNewTemporaryVariable(
        propAccess,
        "slice_start"
      );
      scope.variables.push(
        new CVariable(scope, this.startVarName, IntegerType)
      );
      if (args.length === 2) {
        this.endVarName = scope.root.temporaryVariables.addNewTemporaryVariable(
          propAccess,
          "slice_end"
        );
        scope.variables.push(
          new CVariable(scope, this.endVarName, IntegerType)
        );
      }
    }
    HeaderRegistry.declareDependency(ArrayCreateHeaderType);
  }
}
