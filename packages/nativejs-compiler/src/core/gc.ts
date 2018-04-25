import * as ts from "typescript";
import { IScope } from "../core/program";
import { CodeTemplate } from "../core/template";
import { CElementAccess, CSimpleElementAccess } from "../nodes/elementaccess";
import { CVariable, CVariableDestructors } from "../nodes/variable";
import { ScopeUtil } from "./scope/ScopeUtil";
import {
  ArrayType,
  BooleanType,
  IntegerType,
  NativeType,
  PointerType,
  RegexType,
  StringType,
  StructType,
  UniversalType
} from "./types/NativeTypes";

import debug from "debug";
const log = debug("gc");

class TemporaryVariable {
  public escapeNode: ts.Node;
  public name: string;
  public scopeNode: ts.Node;
  public type: string;
  public disposeLater: boolean;

  constructor(scopeNode: ts.Node, name: string, type: string) {
    this.disposeLater = false;
    this.escapeNode = scopeNode;
    this.name = name;
    this.scopeNode = scopeNode;
    this.type = type;
  }

  public setDisposeLater(disposeLater: boolean) {
    this.disposeLater = disposeLater;
  }

  public escapeTo(node: ts.Node) {
    this.escapeNode = node;
  }
}

@CodeTemplate(`
{#statements}
// Destroy {name} here
{/statements}`)
export class TemporaryVariableDestructor {
  public name: string;
  constructor(scope: IScope, name: string) {
    this.name = name;
  }
}

export class GarbageCollector {
  private temporaryVariables: Map<ts.Node, TemporaryVariable> = new Map();
  private typeChecker;
  private uniqueCounter: number = 0;

  constructor(typeChecker) {
    this.typeChecker = typeChecker;
  }

  public createTemporaryVariable(node: ts.Node, type: string): string {
    if (this.temporaryVariables.has(node)) {
      return this.getTemporaryVariable(node).name;
    }
    const name = this.getUniqueName();
    const scopeNode = ScopeUtil.getScopeNode(node);
    const temporaryVariable = new TemporaryVariable(scopeNode, name, type);
    this.temporaryVariables.set(node, temporaryVariable);
    return name;
  }

  public addScopeTemporaries(scope: IScope, node: ts.Node) {
    const temporaryVariableDestructors = this.getTemporaryVariableDestructors(
      scope,
      node
    );
    scope.statements = scope.statements.concat(temporaryVariableDestructors);
    const temporaryVariableDeclarators = this.getTemporaryVariableDeclarators(
      scope,
      node
    );
    scope.variables = temporaryVariableDeclarators.concat(scope.variables);
  }

  public getUniqueName(): string {
    return `temporary${this.uniqueCounter++}`;
  }

  public getTemporaryVariable(node: ts.Node): TemporaryVariable {
    return this.temporaryVariables.get(node);
  }

  public getDeclaredScope(identifier: ts.Identifier) {
    const symbol: ts.Symbol = this.typeChecker.getSymbolAtLocation(identifier);
    for (const declaration of symbol.declarations) {
      return ScopeUtil.getScopeNode(declaration);
    }
  }

  public resolveToTemporaryVariable(node: ts.Node) {
    if (this.temporaryVariables.has(node)) {
      return this.getTemporaryVariable(node);
    }
    const symbol: ts.Symbol = this.typeChecker.getSymbolAtLocation(node);
    if (symbol) {
      for (const declaration of symbol.declarations) {
        const temporaryVariable = this.resolveToTemporaryVariable(declaration);
        if (temporaryVariable) {
          return temporaryVariable;
        }
      }
    }
    return null;
  }

  public trackAssignmentToDict(scope: IScope, left: ts.Node, right: ts.Node) {
    log("trackAssignmentToDict", left.getText(), right.getText());
    const elementAccess = left as ts.ElementAccessExpression;

    const argument = elementAccess.argumentExpression as ts.Expression;
    if (
      // if either the key of the map
      (argument && this.resolveToTemporaryVariable(argument)) ||
      // or the value assigned to it
      this.resolveToTemporaryVariable(right)
      // are resolved to a temporary variable (dynamically allocated)
    ) {
      // then we should know if this map is declared outside of the scope of this assignment
      // if so, we should say that that temporary variable escapes the scope of this assignment
      if (elementAccess.expression.kind === ts.SyntaxKind.Identifier) {
        const declaredScope = this.getDeclaredScope(
          elementAccess.expression as ts.Identifier
        );

        const argumentTempVar = this.resolveToTemporaryVariable(argument);
        if (
          argumentTempVar &&
          ScopeUtil.isOutsideScope(argumentTempVar.scopeNode, declaredScope)
        ) {
          const isInsideLoop = ScopeUtil.isInsideLoop(argument);
          if (isInsideLoop) {
            // scope.statements.push(`ARRAY_PUSH(gc_global, ${argumentTempVar.name})`);
          }
          // argumentTempVar.escapeTo(declaredScope);
          // argumentTempVar.setDisposeLater(isInsideLoop);
        }
        const valueTempVar = this.resolveToTemporaryVariable(right);
        if (
          valueTempVar &&
          ScopeUtil.isOutsideScope(valueTempVar.scopeNode, declaredScope)
        ) {
          const isInsideLoop = ScopeUtil.isInsideLoop(right);
          if (isInsideLoop) {
            // scope.statements.push(`ARRAY_PUSH(gc_global, ${valueTempVar.name})`);
          }
          log("dic value escapes");
          // valueTempVar.escapeTo(declaredScope);
          // valueTempVar.setDisposeLater(isInsideLoop);
        }
      }
    }
  }

  public trackAssignmentToTemporaryVariable(left: ts.Node, right: ts.Node) {
    log("trackAssignmentToTemporaryVariable", left.getText(), right.getText());
    const declaredScope = this.getDeclaredScope(right as ts.Identifier);
    const temporaryVariable = this.resolveToTemporaryVariable(right);
    if (
      temporaryVariable &&
      ScopeUtil.isOutsideScope(temporaryVariable.scopeNode, declaredScope)
    ) {
      this.temporaryVariables.set(left, this.getTemporaryVariable(right));
    }
  }

  public trackAssignmentToVariable(left: ts.Node, right: ts.Node) {
    log("trackAssignmentToVariable", left.getText(), right.getText());
    if (this.resolveToTemporaryVariable(right)) {
      this.temporaryVariables.set(left, this.getTemporaryVariable(right));
    }
  }

  public getTemporaryVariableDeclarators(scope: IScope, node: ts.Node) {
    const variables = Array.from(this.temporaryVariables.values()).filter(
      (variable, index, list) => {
        return list.indexOf(variable) === index;
      }
    );
    const scopeNode = ScopeUtil.getScopeNode(node);
    const simpleInitializers = variables
      .filter(variable => variable.scopeNode === scopeNode)
      .map((variable: TemporaryVariable) => {
        let typeString = "char *";
        if (variable.type === IntegerType) {
          typeString = `${IntegerType} *`;
        }
        return new CVariable(scope, variable.name, typeString, {});
      });
    const loopInitializers = variables
      .filter(variable => variable.escapeNode === node)
      .filter(variable => variable.disposeLater === true)
      .map((variable: TemporaryVariable) => {
        const typeString = `ARRAY(void *)`;
        const name = `gc_${(node && node.pos) || "global"}`;
        return new CVariable(scope, name, typeString, {});
      });
    return simpleInitializers;
  }

  public getTemporaryVariableDestructors(scope: IScope, node: ts.Node): any[] {
    const variables = Array.from(this.temporaryVariables.values()).filter(
      (variable, index, list) => {
        return list.indexOf(variable) === index;
      }
    );
    const simpleDestructors = variables
      .filter(variable => variable.scopeNode === ScopeUtil.getScopeNode(node))
      .map((variable: TemporaryVariable) => `free(${variable.name});`);
    const loopInitializers = variables
      .filter(variable => variable.disposeLater === true)
      .map((variable: TemporaryVariable) => {
        const typeString = `ARRAY(void *)`;
        const name = `gc_${variable.name}`;
        return new CVariable(scope, name, typeString, {});
      });
    return simpleDestructors;
  }
}
