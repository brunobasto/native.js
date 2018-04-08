import * as ts from "typescript";

export class ScopeUtil {
  static isOutsideScope(scope: ts.Node, node: ts.Node) {
    let parent = node;
    while (parent) {
      if (parent.pos == scope.pos) {
        return false;
      }
      parent = parent.parent;
    }
    return true;
  }

  static isInsideScope(scope: ts.Node, node: ts.Node) {
    let parent = node;
    while (parent) {
      if (parent === scope) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  static isInsideLoop(node: ts.Node) {
    let parent = node;
    while (
      (parent && parent.kind == ts.SyntaxKind.ForInStatement) ||
      parent.kind == ts.SyntaxKind.ForOfStatement ||
      parent.kind == ts.SyntaxKind.ForStatement ||
      parent.kind == ts.SyntaxKind.WhileStatement ||
      parent.kind == ts.SyntaxKind.DoStatement
    ) {
      parent = parent.parent;
    }
    return !!parent;
  }

  static getScopeNode(node: ts.Node): ts.Node {
    let parent = node;
    while (
      parent &&
      parent.kind != ts.SyntaxKind.FunctionDeclaration &&
      parent.kind != ts.SyntaxKind.ForInStatement &&
      parent.kind != ts.SyntaxKind.ForOfStatement &&
      parent.kind != ts.SyntaxKind.ForStatement &&
      parent.kind != ts.SyntaxKind.WhileStatement &&
      parent.kind != ts.SyntaxKind.DoStatement &&
      parent.kind != ts.SyntaxKind.IfStatement
    ) {
      parent = parent.parent;
    }
    if (parent && parent.kind === ts.SyntaxKind.IfStatement) {
      const ifStatement = <ts.IfStatement>parent;

      if (this.isInsideScope(ifStatement.thenStatement, node)) {
        return ifStatement.thenStatement;
      } else if (ifStatement.elseStatement) {
        return ifStatement.elseStatement;
      }
    }
    return parent;
  }
}
