import * as ts from "typescript";
import {
  ArrayType,
  IntegerType,
  NativeType,
  PointerType,
  StructType
} from "./NativeTypes";
import { TypeVisitor } from "./TypeVisitor";
import { PropertiesDictionary } from "./PropertiesDictionary";

type StructData = { [name: string]: StructType };

export class Structures {
  private declaredStructs: StructData = {};

  constructor(
    private typeChecker: ts.TypeChecker,
    private typeVisitor: TypeVisitor
  ) {}

  public declare(name: string, struct: StructType) {
    this.declaredStructs[name] = struct;
  }

  private getStructureBodyString(properties: PropertiesDictionary) {
    let userStructCode = "{\n";
    for (let propName in properties) {
      let propType = properties[propName];
      if (typeof propType === "string") {
        userStructCode += "    " + propType + " " + propName + ";\n";
      } else if (propType instanceof ArrayType) {
        let propTypeText = propType.getText();
        if (propTypeText.indexOf("{var}") > -1)
          userStructCode +=
            "    " +
            propTypeText.replace(/^static /, "").replace("{var}", propName) +
            ";\n";
        else userStructCode += "    " + propTypeText + " " + propName + ";\n";
      } else {
        userStructCode += "    " + propType.getText() + " " + propName + ";\n";
      }
    }
    userStructCode += "};\n";
    return userStructCode;
  }

  public generateStructure(tsType: ts.Type, ident?: ts.Identifier): StructType {
    var structName =
      "struct_" + Object.keys(this.declaredStructs).length + "_t";
    var varName = ident && ident.getText();
    if (varName) {
      if (this.declaredStructs[varName + "_t"] == null)
        structName = varName + "_t";
      else {
        let i = 2;
        while (this.declaredStructs[varName + "_" + i + "_t"] != null) i++;
        structName = varName + "_" + i + "_t";
      }
    }
    let userStructInfo: PropertiesDictionary = {};
    for (let prop of tsType.getProperties()) {
      let propTsType = this.typeChecker.getTypeOfSymbolAtLocation(
        prop,
        prop.valueDeclaration
      );
      let propType = this.typeVisitor.convertType(
        propTsType,
        <ts.Identifier>prop.valueDeclaration.name
      );
      if (
        propType == PointerType &&
        prop.valueDeclaration.kind == ts.SyntaxKind.PropertyAssignment
      ) {
        let propAssignment = <ts.PropertyAssignment>prop.valueDeclaration;
        if (
          propAssignment.initializer &&
          propAssignment.initializer.kind ==
            ts.SyntaxKind.ArrayLiteralExpression
        )
          propType = this.typeVisitor.determineArrayType(
            <ts.ArrayLiteralExpression>propAssignment.initializer
          );
      }
      userStructInfo[prop.name] = propType;
    }

    let userStructCode = this.getStructureBodyString(userStructInfo);

    var found = false;
    if (Object.keys(userStructInfo).length > 0) {
      for (var s in this.declaredStructs) {
        if (
          this.getStructureBodyString(this.declaredStructs[s].properties) ==
          userStructCode
        ) {
          structName = s;
          found = true;
          break;
        }
      }
    }

    if (!found)
      this.declaredStructs[structName] = new StructType(
        "struct " + structName + " *",
        userStructInfo
      );
    return this.declaredStructs[structName];
  }

  public getDeclaredStructs() {
    return Object.keys(this.declaredStructs)
      .filter(k => Object.keys(this.declaredStructs[k].properties).length > 0)
      .map(k => {
        return {
          name: k,
          properties: Object.keys(this.declaredStructs[k].properties).map(
            pk => {
              return {
                name: pk,
                type: this.declaredStructs[k].properties[pk]
              };
            }
          )
        };
      });
  }
}
