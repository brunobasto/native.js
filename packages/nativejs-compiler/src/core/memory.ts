import * as ts from "typescript";
import { StringMatchResolver } from "../standard/string/match";
import { StandardCallHelper } from "./resolver";
import { TemporaryVariables } from "./temporary/TemporaryVariables";
import {
  ArrayType,
  DictType,
  StringType,
  StructType
} from "./types/NativeTypes";
import { TypeVisitor } from "./types/TypeVisitor";

import debug from "debug";

const log = debug("memory");

interface VariableScopeInfo {
  node: ts.Node;
  simple: boolean;
  array: boolean;
  arrayWithContents: boolean;
  dict: boolean;
  varName: string;
  scopeId: string;
  used: boolean;
}

export class MemoryManager {
  private scopes: { [scopeId: string]: VariableScopeInfo[] } = {};
  private scopesOfVariables: { [key: string]: VariableScopeInfo } = {};
  private reusedVariables: { [key: string]: string } = {};
  private originalNodes: { [key: string]: ts.Node } = {};

  constructor(
    private typeChecker: ts.TypeChecker,
    private typeVisitor: TypeVisitor,
    private temporaryVariables: TemporaryVariables
  ) {}

  public preprocessVariables() {
    for (const k in this.typeVisitor.variables) {
      const v = this.typeVisitor.variables[k];
      if (v.requiresAllocation) {
        this.scheduleNodeDisposal(v.declaration, false);
      }
    }
  }

  public preprocessTemporaryVariables(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.ArrayLiteralExpression:
        {
          if (node.parent.kind === ts.SyntaxKind.VariableDeclaration) {
            break;
          }

          if (
            node.parent.kind === ts.SyntaxKind.BinaryExpression &&
            node.parent.parent.kind === ts.SyntaxKind.ExpressionStatement
          ) {
            const binExpr = node.parent as ts.BinaryExpression;
            if (binExpr.left.kind === ts.SyntaxKind.Identifier) {
              break;
            }
          }

          const type = this.typeVisitor.inferNodeType(node);
          if (type && type instanceof ArrayType && type.isDynamicArray) {
            this.scheduleNodeDisposal(node, true);
          }
        }
        break;
      case ts.SyntaxKind.ObjectLiteralExpression:
        {
          if (node.parent.kind === ts.SyntaxKind.VariableDeclaration) {
            break;
          }

          if (
            node.parent.kind === ts.SyntaxKind.BinaryExpression &&
            node.parent.parent.kind === ts.SyntaxKind.ExpressionStatement
          ) {
            const binExpr = node.parent as ts.BinaryExpression;
            if (binExpr.left.kind === ts.SyntaxKind.Identifier) {
              break;
            }
          }

          const type = this.typeVisitor.inferNodeType(node);
          if (
            type &&
            (type instanceof StructType || type instanceof DictType)
          ) {
            this.scheduleNodeDisposal(node, true);
          }
        }
        break;
      case ts.SyntaxKind.BinaryExpression:
        {
          const binExpr = node as ts.BinaryExpression;
          if (
            binExpr.operatorToken.kind === ts.SyntaxKind.PlusToken ||
            binExpr.operatorToken.kind === ts.SyntaxKind.FirstCompoundAssignment
          ) {
            const leftType = this.typeVisitor.inferNodeType(binExpr.left);
            const rightType = this.typeVisitor.inferNodeType(binExpr.right);
            if (leftType === StringType || rightType === StringType) {
              this.scheduleNodeDisposal(binExpr, true);
            }

            if (binExpr.left.kind === ts.SyntaxKind.BinaryExpression) {
              this.preprocessTemporaryVariables(binExpr.left);
            }
            if (binExpr.right.kind === ts.SyntaxKind.BinaryExpression) {
              this.preprocessTemporaryVariables(binExpr.right);
            }

            return;
          }
        }
        break;
      case ts.SyntaxKind.CallExpression:
        {
          if (
            StandardCallHelper.needsDisposal(
              this.typeVisitor,
              node as ts.CallExpression
            )
          ) {
            const nodeToDispose = this.tryReuseExistingVariable(node) || node;
            const isTempVar = nodeToDispose === node;
            if (!isTempVar) {
              this.reusedVariables[node.pos + "_" + node.end] =
                nodeToDispose.pos + "_" + nodeToDispose.end;
              this.originalNodes[
                nodeToDispose.pos + "_" + nodeToDispose.end
              ] = node;
            }
            this.scheduleNodeDisposal(nodeToDispose, isTempVar);
          }
        }
        break;
    }
    node.getChildren().forEach(c => this.preprocessTemporaryVariables(c));
  }

  public getGCVariablesForScope(node: ts.Node) {
    const parentDecl = this.findParentFunctionNode(node);
    const scopeId: string = (parentDecl && parentDecl.pos + 1 + "") || "main";
    const realScopeId =
      this.scopes[scopeId] &&
      this.scopes[scopeId].length &&
      this.scopes[scopeId][0].scopeId;
    const gcVars = [];
    if (
      this.scopes[scopeId] &&
      this.scopes[scopeId].filter(
        v => !v.simple && !v.array && !v.dict && !v.arrayWithContents
      ).length
    ) {
      gcVars.push("gc_" + realScopeId);
    }
    if (
      this.scopes[scopeId] &&
      this.scopes[scopeId].filter(v => !v.simple && v.array).length
    ) {
      gcVars.push("gc_" + realScopeId + "_arrays");
    }
    if (
      this.scopes[scopeId] &&
      this.scopes[scopeId].filter(v => !v.simple && v.arrayWithContents).length
    ) {
      gcVars.push("gc_" + realScopeId + "_arrays_c");
    }
    if (
      this.scopes[scopeId] &&
      this.scopes[scopeId].filter(v => !v.simple && v.dict).length
    ) {
      gcVars.push("gc_" + realScopeId + "_dicts");
    }
    return gcVars;
  }

  public getGCVariableForNode(node: ts.Node) {
    const parentDecl = this.findParentFunctionNode(node);
    let key = node.pos + "_" + node.end;
    if (this.reusedVariables[key]) {
      key = this.reusedVariables[key];
    }

    if (this.scopesOfVariables[key] && !this.scopesOfVariables[key].simple) {
      if (this.scopesOfVariables[key].array) {
        return "gc_" + this.scopesOfVariables[key].scopeId + "_arrays";
      } else if (this.scopesOfVariables[key].arrayWithContents) {
        return "gc_" + this.scopesOfVariables[key].scopeId + "_arrays_c";
      } else if (this.scopesOfVariables[key].dict) {
        return "gc_" + this.scopesOfVariables[key].scopeId + "_dicts";
      } else {
        return "gc_" + this.scopesOfVariables[key].scopeId;
      }
    } else {
      return null;
    }
  }

  public getDestructorsForScope(node: ts.Node) {
    const parentDecl = this.findParentFunctionNode(node);
    const scopeId = (parentDecl && parentDecl.pos + 1) || "main";
    const destructors: Array<{
      varName: string;
      array: boolean;
      dict: boolean;
      string: boolean;
      arrayWithContents: boolean;
    }> = [];
    if (this.scopes[scopeId]) {
      // string match allocates array of strings, and each of those strings should be also disposed
      for (const simpleVarScopeInfo of this.scopes[scopeId].filter(
        v => v.simple && v.used
      )) {
        destructors.push({
          varName: simpleVarScopeInfo.varName,
          array: simpleVarScopeInfo.array,
          dict: simpleVarScopeInfo.dict,
          string:
            this.typeVisitor.inferNodeType(simpleVarScopeInfo.node) ==
            StringType,
          arrayWithContents: simpleVarScopeInfo.arrayWithContents
        });
      }
    }
    return destructors;
  }

  public variableWasReused(node: ts.Node) {
    const key = node.pos + "_" + node.end;
    return !!this.reusedVariables[key];
  }

  /** Variables that need to be disposed are tracked by memory manager */
  public getReservedTemporaryVarName(node: ts.Node) {
    let key = node.pos + "_" + node.end;
    if (this.reusedVariables[key]) {
      key = this.reusedVariables[key];
    }
    const scopeOfVar = this.scopesOfVariables[key];
    if (scopeOfVar) {
      scopeOfVar.used = true;
      return scopeOfVar.varName;
    } else {
      return null;
    }
  }

  /** Sometimes we can reuse existing variable instead of creating a temporary one. */
  public tryReuseExistingVariable(node: ts.Node) {
    if (node.parent.kind === ts.SyntaxKind.BinaryExpression) {
      const assignment = node.parent as ts.BinaryExpression;
      if (assignment.left.kind === ts.SyntaxKind.Identifier) {
        return assignment.left;
      }
    }
    if (node.parent.kind === ts.SyntaxKind.VariableDeclaration) {
      const assignment = node.parent as ts.VariableDeclaration;
      if (assignment.name.kind === ts.SyntaxKind.Identifier) {
        return assignment.name;
      }
    }
    return null;
  }

  private scheduleNodeDisposal(heapNode: ts.Node, isTemp: boolean) {
    const varFuncNode = this.findParentFunctionNode(heapNode);
    let topScope: number | "main" =
      (varFuncNode && varFuncNode.pos + 1) || "main";
    let isSimple = true;
    if (this.isInsideLoop(heapNode)) {
      isSimple = false;
    }

    const scopeTree = {};
    scopeTree[topScope] = true;

    const queue = [heapNode];
    queue.push();
    const visited = {};
    while (queue.length > 0) {
      const node = queue.shift();
      if (visited[node.pos + "_" + node.end]) {
        continue;
      }

      let refs = [node];
      if (node.kind === ts.SyntaxKind.Identifier) {
        const varIdent = node as ts.Identifier;
        const nodeVarInfo = this.typeVisitor.getVariableInfo(varIdent);
        if (!nodeVarInfo) {
          log("WARNING: Cannot find references for " + node.getText());
          continue;
        }
        refs = this.typeVisitor.getVariableInfo(varIdent).references;
      }
      let returned = false;
      for (const ref of refs) {
        visited[ref.pos + "_" + ref.end] = true;
        const parentNode = this.findParentFunctionNode(ref);
        if (!parentNode) {
          topScope = "main";
        }

        if (ref.kind === ts.SyntaxKind.PropertyAccessExpression) {
          let elemAccess = ref as ts.PropertyAccessExpression;
          while (
            elemAccess.expression.kind ===
            ts.SyntaxKind.PropertyAccessExpression
          ) {
            elemAccess = elemAccess.expression as ts.PropertyAccessExpression;
          }
          if (elemAccess.expression.kind === ts.SyntaxKind.Identifier) {
            log(
              heapNode.getText() +
                " -> Tracking parent variable: " +
                elemAccess.expression.getText() +
                "."
            );
            queue.push(elemAccess.expression);
          }
        }

        if (ref.parent && ref.parent.kind === ts.SyntaxKind.BinaryExpression) {
          const binaryExpr = ref.parent as ts.BinaryExpression;
          if (
            binaryExpr.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            binaryExpr.left.getText() === heapNode.getText()
          ) {
            log(
              heapNode.getText() +
                " -> Detected assignment: " +
                binaryExpr.getText() +
                "."
            );
            isSimple = false;
          }
        }

        if (
          ref.parent &&
          ref.parent.kind === ts.SyntaxKind.PropertyAssignment
        ) {
          log(
            heapNode.getText() +
              " -> Detected passing to object literal: " +
              ref.parent.getText() +
              "."
          );
          queue.push(ref.parent.parent);
        }
        if (
          ref.parent &&
          ref.parent.kind === ts.SyntaxKind.ArrayLiteralExpression
        ) {
          log(
            heapNode.getText() +
              " -> Detected passing to array literal: " +
              ref.parent.getText() +
              "."
          );
          queue.push(ref.parent);
        }

        if (ref.parent && ref.parent.kind === ts.SyntaxKind.CallExpression) {
          const call = ref.parent as ts.CallExpression;
          if (
            call.expression.kind === ts.SyntaxKind.Identifier &&
            call.expression.pos === ref.pos
          ) {
            log(heapNode.getText() + " -> Found function call!");
            if (topScope !== "main") {
              const funcNode = this.findParentFunctionNode(call);
              topScope = (funcNode && funcNode.pos + 1) || "main";
              const targetScope = node.parent.pos + 1 + "";
              isSimple = false;
              if (scopeTree[targetScope]) {
                delete scopeTree[targetScope];
              }
              scopeTree[topScope] = targetScope;
            }
            this.addIfFoundInAssignment(heapNode, call, queue);
          } else {
            const symbol = this.typeChecker.getSymbolAtLocation(
              call.expression
            );
            if (!symbol) {
              const isStandardCall =
                StandardCallHelper.isStandardCall(this.typeVisitor, call) ||
                call.expression.getText() === "log";

              if (isStandardCall) {
                const standardCallEscapeNode = StandardCallHelper.getEscapeNode(
                  this.typeVisitor,
                  call
                );
                if (standardCallEscapeNode) {
                  log(
                    heapNode.getText() +
                      " escapes to '" +
                      standardCallEscapeNode.getText() +
                      "' via standard call '" +
                      call.getText() +
                      "'."
                  );
                  queue.push(standardCallEscapeNode);
                }
              } else {
                log(
                  heapNode.getText() +
                    " -> Detected passing to external function " +
                    call.expression.getText() +
                    ". Scope changed to main."
                );
                topScope = "main";
                isSimple = false;
              }
            } else {
              const funcDecl = symbol.valueDeclaration as ts.FunctionDeclaration;
              for (let i = 0; i < call.arguments.length; i++) {
                if (
                  call.arguments[i].pos <= ref.pos &&
                  call.arguments[i].end >= ref.end
                ) {
                  if (funcDecl.pos + 1 === topScope) {
                    log(
                      heapNode.getText() +
                        " -> Found recursive call with parameter " +
                        funcDecl.parameters[i].name.getText()
                    );
                    queue.push(funcDecl.name);
                  } else {
                    log(
                      heapNode.getText() +
                        " -> Found passing to function " +
                        call.expression.getText() +
                        " as parameter " +
                        funcDecl.parameters[i].name.getText()
                    );
                    queue.push(funcDecl.parameters[i].name as ts.Identifier);
                  }
                  isSimple = false;
                }
              }
            }
          }
        } else if (
          ref.parent &&
          ref.parent.kind === ts.SyntaxKind.ReturnStatement &&
          !returned
        ) {
          returned = true;
          queue.push(parentNode.name);
          log(
            heapNode.getText() +
              " -> Found variable returned from the function!"
          );
          isSimple = false;
        } else {
          this.addIfFoundInAssignment(heapNode, ref, queue);
        }
      }
    }

    const type = this.typeVisitor.inferNodeType(heapNode);
    let varName: string;
    if (heapNode.kind === ts.SyntaxKind.ArrayLiteralExpression) {
      varName = this.temporaryVariables.addNewTemporaryVariable(
        heapNode,
        "tmp_array"
      );
    } else if (heapNode.kind === ts.SyntaxKind.ObjectLiteralExpression) {
      varName = this.temporaryVariables.addNewTemporaryVariable(
        heapNode,
        "tmp_obj"
      );
    } else if (heapNode.kind === ts.SyntaxKind.BinaryExpression) {
      varName = this.temporaryVariables.addNewTemporaryVariable(
        heapNode,
        "tmp_string"
      );
    } else if (heapNode.kind === ts.SyntaxKind.CallExpression) {
      varName = this.temporaryVariables.addNewTemporaryVariable(
        heapNode,
        StandardCallHelper.getTempVarName(this.typeVisitor, heapNode)
      );
    } else {
      varName = heapNode.getText().replace(/\./g, "->");
    }

    let vnode = heapNode;
    const key = vnode.pos + "_" + vnode.end;
    let arrayWithContents = false;
    if (this.originalNodes[key]) {
      vnode = this.originalNodes[key];
    }
    if (
      vnode.kind === ts.SyntaxKind.CallExpression &&
      new StringMatchResolver().matchesNode(
        this.typeVisitor,
        vnode as ts.CallExpression
      )
    ) {
      arrayWithContents = true;
    }

    const foundScopes =
      topScope === "main" ? [topScope] : Object.keys(scopeTree);
    const scopeInfo = {
      node: heapNode,
      simple: isSimple,
      arrayWithContents,
      array:
        !arrayWithContents &&
        type &&
        type instanceof ArrayType &&
        type.isDynamicArray,
      dict: type && type instanceof DictType,
      varName,
      scopeId: foundScopes.join("_"),
      used: !isTemp
    };
    this.scopesOfVariables[heapNode.pos + "_" + heapNode.end] = scopeInfo;

    for (const sc of foundScopes) {
      this.scopes[sc] = this.scopes[sc] || [];
      this.scopes[sc].push(scopeInfo);
    }
  }

  private addIfFoundInAssignment(
    varIdent: ts.Node,
    ref: ts.Node,
    queue: ts.Node[]
  ): boolean {
    if (ref.parent && ref.parent.kind === ts.SyntaxKind.VariableDeclaration) {
      const varDecl = ref.parent as ts.VariableDeclaration;
      if (varDecl.initializer && varDecl.initializer.pos === ref.pos) {
        queue.push(varDecl.name);
        log(
          varIdent.getText() +
            " -> Found initializer-assignment to variable " +
            varDecl.name.getText()
        );
        return true;
      }
    } else if (
      ref.parent &&
      ref.parent.kind === ts.SyntaxKind.BinaryExpression
    ) {
      const binaryExpr = ref.parent as ts.BinaryExpression;
      if (
        binaryExpr.operatorToken.kind === ts.SyntaxKind.FirstAssignment &&
        binaryExpr.right.pos === ref.pos
      ) {
        queue.push(binaryExpr.left);
        log(
          varIdent.getText() +
            " -> Found assignment to variable " +
            binaryExpr.left.getText()
        );
        return true;
      }
    }

    return false;
  }

  private findParentFunctionNode(node: ts.Node) {
    let parent = node;
    while (parent && parent.kind != ts.SyntaxKind.FunctionDeclaration) {
      parent = parent.parent;
    }
    return parent as ts.FunctionDeclaration;
  }

  private isInsideLoop(node: ts.Node) {
    let parent = node;
    while (
      parent &&
      parent.kind != ts.SyntaxKind.ForInStatement &&
      parent.kind != ts.SyntaxKind.ForOfStatement &&
      parent.kind != ts.SyntaxKind.ForStatement &&
      parent.kind != ts.SyntaxKind.WhileStatement &&
      parent.kind != ts.SyntaxKind.DoStatement
    ) {
      parent = parent.parent;
    }
    return !!parent;
  }

  private getSymbolId(node: ts.Node) {
    return this.typeChecker.getSymbolAtLocation(node).name;
  }
}
