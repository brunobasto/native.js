import debug from "debug";
import * as ts from "typescript";
import { CProgram } from "../program";
import { StandardCallHelper } from "../resolver";
import { ScopeUtil } from "../scope/ScopeUtil";
import {
  ArrayType,
  BooleanType,
  DictType,
  FloatType,
  IntegerType,
  LongType,
  NativeType,
  PointerType,
  RegexType,
  SignedType,
  StringType,
  StructType,
  UniversalType
} from "./NativeTypes";
import { TypeRegistry } from "./TypeRegistry";
import { TypeVisitor } from "./TypeVisitor";

const log = debug("TypeInferencer");

export class TypeInferencer {
  private typeChecker: ts.TypeChecker;

  constructor(private program: CProgram) {
    this.typeChecker = program.typeChecker;
  }

  private getTypeVisitor() {
    return this.program.typeVisitor;
  }

  public isFloatExpression(binaryExpression: ts.BinaryExpression): boolean {
    // bitwise operators are excluded from this
    if (ScopeUtil.isChildOfBitwiseOperation(binaryExpression)) {
      return false;
    }
    // if expression is a division
    if (binaryExpression.operatorToken.kind === ts.SyntaxKind.SlashToken) {
      log(`Expression ${binaryExpression.getText()} evaluates to float`);
      return true;
    }
    // if left or right is float identifier
    if (
      binaryExpression.left.kind === ts.SyntaxKind.Identifier &&
      this.getTypeVisitor().getVariableInfo(
        binaryExpression.left as ts.Identifier
      ).type === FloatType
    ) {
      return true;
    }
    if (
      binaryExpression.left.kind === ts.SyntaxKind.Identifier &&
      this.getTypeVisitor().getVariableInfo(
        binaryExpression.left as ts.Identifier
      ).type === FloatType
    ) {
      return true;
    }
    // check for each binary expression inside the given expression
    if (
      binaryExpression.right.kind === ts.SyntaxKind.BinaryExpression &&
      this.isFloatExpression(binaryExpression.right as ts.BinaryExpression)
    ) {
      return true;
    }
    if (
      binaryExpression.left.kind === ts.SyntaxKind.BinaryExpression &&
      this.isFloatExpression(binaryExpression.left as ts.BinaryExpression)
    ) {
      return true;
    }
    // check if parenthesized expression
    if (binaryExpression.left.kind === ts.SyntaxKind.ParenthesizedExpression) {
      const parenthesizedExpression = binaryExpression.left as ts.ParenthesizedExpression;
      if (
        parenthesizedExpression.expression.kind ==
          ts.SyntaxKind.BinaryExpression &&
        this.isFloatExpression(
          parenthesizedExpression.expression as ts.BinaryExpression
        )
      ) {
        return true;
      }
    }
    if (binaryExpression.right.kind === ts.SyntaxKind.ParenthesizedExpression) {
      const parenthesizedExpression = binaryExpression.right as ts.ParenthesizedExpression;
      if (
        parenthesizedExpression.expression.kind ==
          ts.SyntaxKind.BinaryExpression &&
        this.isFloatExpression(
          parenthesizedExpression.expression as ts.BinaryExpression
        )
      ) {
        return true;
      }
    }
    if (
      binaryExpression.left.kind === ts.SyntaxKind.NumericLiteral &&
      this.isFloatLiteral(binaryExpression.left as ts.NumericLiteral)
    ) {
      return true;
    }
    if (
      binaryExpression.right.kind === ts.SyntaxKind.NumericLiteral &&
      this.isFloatLiteral(binaryExpression.right as ts.NumericLiteral)
    ) {
      return true;
    }
    return false;
  }

  public isLongExpression(binaryExpression: ts.BinaryExpression) {
    // bitwise operators are excluded from this
    if (ScopeUtil.isChildOfBitwiseOperation(binaryExpression)) {
      return false;
    }
    // if left or right is float identifier
    if (
      binaryExpression.left.kind === ts.SyntaxKind.Identifier &&
      this.getTypeVisitor().getVariableInfo(
        binaryExpression.left as ts.Identifier
      ).type === LongType
    ) {
      return true;
    }
    if (
      binaryExpression.left.kind === ts.SyntaxKind.Identifier &&
      this.getTypeVisitor().getVariableInfo(
        binaryExpression.left as ts.Identifier
      ).type === LongType
    ) {
      return true;
    }
    // check for each binary expression inside the given expression
    if (
      binaryExpression.right.kind === ts.SyntaxKind.BinaryExpression &&
      this.isLongExpression(binaryExpression.right as ts.BinaryExpression)
    ) {
      return true;
    }
    if (
      binaryExpression.left.kind === ts.SyntaxKind.BinaryExpression &&
      this.isLongExpression(binaryExpression.left as ts.BinaryExpression)
    ) {
      return true;
    }
    // check if parenthesized expression
    if (binaryExpression.left.kind === ts.SyntaxKind.ParenthesizedExpression) {
      const parenthesizedExpression = binaryExpression.left as ts.ParenthesizedExpression;
      if (
        parenthesizedExpression.expression.kind ==
          ts.SyntaxKind.BinaryExpression &&
        this.isLongExpression(
          parenthesizedExpression.expression as ts.BinaryExpression
        )
      ) {
        return true;
      }
    }
    if (binaryExpression.right.kind === ts.SyntaxKind.ParenthesizedExpression) {
      const parenthesizedExpression = binaryExpression.right as ts.ParenthesizedExpression;
      if (
        parenthesizedExpression.expression.kind ==
          ts.SyntaxKind.BinaryExpression &&
        this.isLongExpression(
          parenthesizedExpression.expression as ts.BinaryExpression
        )
      ) {
        return true;
      }
    }
    return false;
  }

  public isFloatLiteral(node: ts.NumericLiteral): boolean {
    // if it contains a floating point, return true
    const literalText = node.getText();
    if (literalText.indexOf(".") > -1) {
      return true;
    }
    // if it's a variable declaration
    const parent = ScopeUtil.findParentWithKind(
      node,
      ts.SyntaxKind.VariableDeclaration
    );
    if (parent) {
      const declaration = parent as ts.VariableDeclaration;
      const varInfo = this.getTypeVisitor().getVariableInfo(declaration.name);
      for (const ref of varInfo.references) {
        // and one of its references is a binary expression
        const binary = ScopeUtil.findParentWithKind(
          ref,
          ts.SyntaxKind.BinaryExpression
        );
        if (binary) {
          if (this.isFloatExpression(binary as ts.BinaryExpression)) {
            log(`so [${declaration.name.getText()}] evaluates to float`);
            return true;
          }
        }
      }
    }

    return false;
  }

  private inferNumericLiteral(node: ts.NumericLiteral) {
    // if it's. a float, return float
    if (this.isFloatLiteral(node)) {
      return FloatType;
    }
    // if it's a big number, return long
    const literalText = node.getText();
    if (literalText.indexOf("-") === 0) {
      return SignedType;
    }
    if (parseInt(literalText, 10) > 1023) {
      return LongType;
    }
    // else return int
    return IntegerType;
  }

  private inferBinaryExpression(node: ts.BinaryExpression) {
    const parentBinary = ScopeUtil.findParentWithKind(
      node,
      ts.SyntaxKind.BinaryExpression
    );
    log(
      parentBinary.getText(),
      this.isFloatExpression(parentBinary as ts.BinaryExpression)
    );
    if (this.isFloatExpression(parentBinary as ts.BinaryExpression)) {
      return FloatType;
    } else if (this.isLongExpression(parentBinary as ts.BinaryExpression)) {
      return LongType;
    } else {
      const tsType = this.typeChecker.getTypeAtLocation(node);
      const type = tsType && this.getTypeVisitor().convertType(tsType);
      if (type != UniversalType && type != PointerType) {
        return type;
      }
    }
  }

  private inferIdentifier(node: ts.Identifier) {
    // is parameter of a function
    if (node.parent.kind === ts.SyntaxKind.Parameter) {
      const parentCall = ScopeUtil.findParentCallExpression(node);
      // the function is inside a call expression
      if (parentCall) {
        const propAccess = parentCall.expression as ts.PropertyAccessExpression;
        const parentObjectType = this.inferNodeType(propAccess.expression);
        // the call expression is on an Array
        if (parentObjectType instanceof ArrayType) {
          // return the type of the Array
          return parentObjectType.elementType;
        }
      }
    }
    const varInfo = this.getTypeVisitor().getVariableInfo(node as ts.Identifier);
    return (varInfo && varInfo.type) || null;
  }

  private inferElementAccessExpression(node: ts.ElementAccessExpression) {
    const elemAccess = node as ts.ElementAccessExpression;
    const parentObjectType = this.inferNodeType(elemAccess.expression);
    if (parentObjectType instanceof ArrayType) {
      return parentObjectType.elementType;
    } else if (parentObjectType instanceof StructType) {
      return parentObjectType.properties[
        elemAccess.argumentExpression.getText().slice(1, -1)
      ];
         } else if (parentObjectType instanceof DictType) {
      return parentObjectType.elementType;
         }
    return null;
  }

  private inferPropertyAccessExpression(node: ts.PropertyAccessExpression) {
    const propAccess = node as ts.PropertyAccessExpression;
    const parentObjectType = this.inferNodeType(propAccess.expression);
    if (parentObjectType instanceof StructType) {
      return parentObjectType.properties[propAccess.name.getText()];
    } else if (
      parentObjectType instanceof ArrayType &&
      propAccess.name.getText() === "length"
    ) {
      return IntegerType;
         } else if (
      parentObjectType === StringType &&
      propAccess.name.getText() === "length"
    ) {
      return IntegerType;
         }
    return null;
  }

  private inferCallExpression(node: ts.CallExpression) {
    const call = node as ts.CallExpression;
    const retType = StandardCallHelper.getReturnType(this.getTypeVisitor(), call);
    if (retType) { return retType; }

    if (call.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
      const propAccess = call.expression as ts.PropertyAccessExpression;
      const propName = propAccess.name.getText();
      if (
        (propName === "indexOf" || propName === "lastIndexOf") &&
        call.arguments.length === 1
      ) {
        const exprType = this.inferNodeType(propAccess.expression);
        if (exprType && exprType === StringType) { return IntegerType; }
      }
    } else if (call.expression.kind === ts.SyntaxKind.Identifier) {
      if (call.expression.getText() === "parseInt") {
        return IntegerType;
      }
      const funcSymbol = this.typeChecker.getSymbolAtLocation(call.expression);
      if (funcSymbol != null) {
        const funcDeclPos = funcSymbol.valueDeclaration.pos;
        return this.getTypeVisitor().getVariableType(funcDeclPos);
      }
    }
    return null;
  }

  public inferNodeType(node: ts.Node): NativeType {
    const typeVisitor = this.getTypeVisitor();

    if (!node.kind) { return null; }
    // Look for known registered types
    const nodeType = TypeRegistry.getNodeType(node);
    if (nodeType) {
      return nodeType;
    }
    switch (node.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return this.inferNumericLiteral(node as ts.NumericLiteral);
      case ts.SyntaxKind.BinaryExpression: {
        return this.inferBinaryExpression(node as ts.BinaryExpression);
      }
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        return BooleanType;
      case ts.SyntaxKind.StringLiteral:
        return StringType;
      case ts.SyntaxKind.Identifier: {
        return this.inferIdentifier(node as ts.Identifier);
      }
      case ts.SyntaxKind.ElementAccessExpression: {
        return this.inferElementAccessExpression(
          node as ts.ElementAccessExpression
        );
      }
      case ts.SyntaxKind.PropertyAccessExpression: {
        return this.inferPropertyAccessExpression(
          node as ts.PropertyAccessExpression
        );
      }
      case ts.SyntaxKind.CallExpression: {
        return this.inferCallExpression(node as ts.CallExpression);
      }
      case ts.SyntaxKind.PropertyAssignment:
        const propertyAssignment = node as ts.PropertyAssignment;
        return this.inferNodeType(propertyAssignment.initializer);
      case ts.SyntaxKind.FunctionExpression:
        // TODO - Actually infer function return type
        return IntegerType;
      case ts.SyntaxKind.RegularExpressionLiteral:
        return RegexType;
      case ts.SyntaxKind.ArrayLiteralExpression:
        return typeVisitor.getArrayLiteralType(node.pos);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return typeVisitor.getObjectLiteralType(node.pos);
      case ts.SyntaxKind.FunctionDeclaration: {
        return typeVisitor.getVariableType(node.pos);
      }
      default:
        {
          const tsType = this.typeChecker.getTypeAtLocation(node);
          const type = tsType && this.getTypeVisitor().convertType(tsType);
          if (type != UniversalType && type != PointerType) { return type; }
        }
        return null;
    }
  }
}
