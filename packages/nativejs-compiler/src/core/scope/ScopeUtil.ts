import * as ts from "typescript";

export class ScopeUtil {
  public static findParentFunction(node: ts.Node): ts.FunctionDeclaration {
    let parentFunc = node;
    while (parentFunc && parentFunc.kind != ts.SyntaxKind.FunctionDeclaration) {
      parentFunc = parentFunc.parent;
    }
    return <ts.FunctionDeclaration>parentFunc;
  }

  public static findParentCallExpression(node: ts.Node): ts.CallExpression {
    let parentCall = node;
    while (parentCall && parentCall.kind != ts.SyntaxKind.CallExpression) {
      parentCall = parentCall.parent;
    }
    return <ts.CallExpression>parentCall;
  }

  public static isChildOfBitwiseOperation(node: ts.Node) {
    let parent = this.findParentWithKind(node, ts.SyntaxKind.BinaryExpression);
    while (parent) {
      const parentBinary = <ts.BinaryExpression>parent;
      if (parentBinary.operatorToken.kind === ts.SyntaxKind.AmpersandToken) {
        return true;
      }
      parent = this.findParentWithKind(
        parent.parent,
        ts.SyntaxKind.BinaryExpression
      );
    }
    return false;
  }

  public static findParentWithKind(node: ts.Node, kind: ts.SyntaxKind) {
    let parent = node;
    while (parent && parent.kind != kind) {
      parent = parent.parent;
    }
    return parent;
  }

  static isOutsideScope(scope: ts.Node, node: ts.Node) {
    let parent = node;
    while (parent) {
      if (parent.pos === scope.pos) {
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
      parent &&
      (parent.kind === ts.SyntaxKind.ForInStatement ||
        parent.kind === ts.SyntaxKind.ForOfStatement ||
        parent.kind === ts.SyntaxKind.ForStatement ||
        parent.kind === ts.SyntaxKind.WhileStatement ||
        parent.kind === ts.SyntaxKind.DoStatement)
    ) {
      parent = parent.parent;
    }
    return !!parent;
  }

  static getScopeNode(node: ts.Node): ts.Node {
    if (node === null) {
      return null;
    }
    let parent = node;
    while (
      parent &&
      parent.kind != ts.SyntaxKind.DoStatement &&
      parent.kind != ts.SyntaxKind.ForInStatement &&
      parent.kind != ts.SyntaxKind.ForOfStatement &&
      parent.kind != ts.SyntaxKind.ForStatement &&
      parent.kind != ts.SyntaxKind.FunctionDeclaration &&
      parent.kind != ts.SyntaxKind.IfStatement &&
      parent.kind != ts.SyntaxKind.WhileStatement
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
    return parent || null;
  }
}
