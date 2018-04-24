import * as ts from "typescript";
import { CodeTemplate, CodeTemplateFactory } from "../core/template";
import { IScope } from "../core/program";
import {
  ArrayType,
  StructType,
  DictType,
  StringType,
  IntegerType,
  BooleanType,
  NativeType
} from "../core/types/NativeTypes";
import { AssignmentHelper, CAssignment } from "./assignment";
import { CElementAccess, CSimpleElementAccess } from "./elementaccess";
import {
  HeaderRegistry,
  Uint8HeaderType,
  Int16HeaderType,
  ArrayCreateHeaderType,
  ArrayPushHeaderType,
  DictCreateHeaderType,
  StdlibHeaderType,
  AssertHeaderType
} from "../core/header";

@CodeTemplate(`{declarations}`, ts.SyntaxKind.VariableStatement)
export class CVariableStatement {
  public declarations: CVariableDeclaration[];
  constructor(scope: IScope, node: ts.VariableStatement) {
    this.declarations = node.declarationList.declarations.map(d =>
      CodeTemplateFactory.createForNode(scope, d)
    );
  }
}

@CodeTemplate(`{declarations}`, ts.SyntaxKind.VariableDeclarationList)
export class CVariableDeclarationList {
  public declarations: CVariableDeclaration[];
  constructor(scope: IScope, node: ts.VariableDeclarationList) {
    this.declarations = node.declarations.map(d =>
      CodeTemplateFactory.createForNode(scope, d)
    );
  }
}

@CodeTemplate(
  `
{allocator}
{initializer}`,
  ts.SyntaxKind.VariableDeclaration
)
export class CVariableDeclaration {
  public allocator: CVariableAllocation | string = "";
  public initializer: CAssignment | string = "";

  constructor(scope: IScope, varDecl: ts.VariableDeclaration) {
    let varInfo = scope.root.typeHelper.getVariableInfo(
      <ts.Identifier>varDecl.name
    );
    scope.variables.push(new CVariable(scope, varInfo.name, varInfo.type));
    if (varInfo.requiresAllocation)
      this.allocator = new CVariableAllocation(
        scope,
        varInfo.name,
        varInfo.type,
        varDecl.name
      );
    if (varDecl.initializer)
      this.initializer = AssignmentHelper.create(
        scope,
        varDecl.name,
        varDecl.initializer
      );
  }
}

@CodeTemplate(`
{#if needAllocateArray}
    ARRAY_CREATE({varName}, {initialCapacity}, {size});
{#elseif needAllocateDict}
    DICT_CREATE({varName}, {initialCapacity});
{#elseif needAllocateStruct}
    {varName} = malloc(sizeof(*{varName}));
    assert({varName} != NULL);
{/if}
`)
export class CVariableAllocation {
  public isArray: boolean;
  public needAllocateArray: boolean;
  public initialCapacity: number;
  public size: number;
  public needAllocateStruct: boolean;
  public needAllocateDict: boolean;
  public gcVarName: string;
  constructor(
    scope: IScope,
    public varName: CElementAccess | CSimpleElementAccess | string,
    varType: NativeType,
    refNode: ts.Node
  ) {
    this.needAllocateArray =
      varType instanceof ArrayType && varType.isDynamicArray;
    this.needAllocateStruct = varType instanceof StructType;
    this.needAllocateDict = varType instanceof DictType;
    this.initialCapacity = 4;

    if (varType instanceof ArrayType) {
      this.initialCapacity = Math.max(varType.capacity * 2, 4);
      this.size = varType.capacity;
    }

    if (
      this.needAllocateStruct ||
      this.needAllocateArray ||
      this.needAllocateDict
    ) {
      HeaderRegistry.declareDependency(AssertHeaderType);
      HeaderRegistry.declareDependency(StdlibHeaderType);
    }

    if (this.needAllocateArray) {
      HeaderRegistry.declareDependency(ArrayCreateHeaderType);
    }
    if (this.needAllocateDict) {
      HeaderRegistry.declareDependency(DictCreateHeaderType);
    }
  }
}

@CodeTemplate(`
{#statements}
    {arrayDestructors => for (gc_i = 0; gc_i < ({this} ? {this}->size : 0); gc_i++) free((void*){this}->data[gc_i]);\n}
    {destructors => free({this});\n}
    {#if gcArraysCVarName}
        for (gc_i = 0; gc_i < {gcArraysCVarName}->size; gc_i++) {
            for (gc_j = 0; gc_j < ({gcArraysCVarName}->data[gc_i] ? {gcArraysCVarName}->data[gc_i]->size : 0); gc_j++)
                free((void*){gcArraysCVarName}->data[gc_i]->data[gc_j]);\n
            free({gcArraysCVarName}->data[gc_i] ? {gcArraysCVarName}->data[gc_i]->data : NULL);
            free({gcArraysCVarName}->data[gc_i]);
        }
        free({gcArraysCVarName}->data);
        free({gcArraysCVarName});
    {/if}
    {#if gcArraysVarName}
        for (gc_i = 0; gc_i < {gcArraysVarName}->size; gc_i++) {
            free({gcArraysVarName}->data[gc_i]->data);
            free({gcArraysVarName}->data[gc_i]);
        }
        free({gcArraysVarName}->data);
        free({gcArraysVarName});
    {/if}
    {#if gcDictsVarName}
        for (gc_i = 0; gc_i < {gcDictsVarName}->size; gc_i++) {
            free({gcDictsVarName}->data[gc_i]);
        }
        free({gcDictsVarName}->data);
        free({gcDictsVarName});
    {/if}
    {#if gcVarName}
        for (gc_i = 0; gc_i < {gcVarName}->size; gc_i++)
            free({gcVarName}->data[gc_i]);
        free({gcVarName}->data);
        free({gcVarName});
    {/if}
{/statements}`)
export class CVariableDestructors {
  public gcVarName: string = null;
  public gcArraysVarName: string = null;
  public gcArraysCVarName: string = null;
  public gcDictsVarName: string = null;
  public destructors: string[];
  public arrayDestructors: string[] = [];
  constructor(scope: IScope, node: ts.Node) {
    // let gcVarNames = scope.root.memoryManager.getGCVariablesForScope(node);
    // for (let gc of gcVarNames) {
    //   if (gc.indexOf("_arrays_c") > -1) this.gcArraysCVarName = gc;
    //   else if (gc.indexOf("_dicts") > -1) this.gcDictsVarName = gc;
    //   else if (gc.indexOf("_arrays") > -1) this.gcArraysVarName = gc;
    //   else this.gcVarName = gc;
    // }

    this.destructors = [];
    // scope.root.memoryManager.getDestructorsForScope(node).forEach(r => {
    //   if (r.array) {
    //     this.destructors.push(r.varName + "->data");
    //     this.destructors.push(r.varName);
    //   } else if (r.arrayWithContents) {
    //     scope.root.headerFlags.gc_iterator2 = true;
    //     this.arrayDestructors.push(r.varName);
    //     this.destructors.push(r.varName + " ? " + r.varName + "->data : NULL");
    //     this.destructors.push(r.varName);
    //   } else if (r.dict) {
    //     this.destructors.push(r.varName + "->index->data");
    //     this.destructors.push(r.varName + "->index");
    //     this.destructors.push(r.varName + "->values->data");
    //     this.destructors.push(r.varName + "->values");
    //     this.destructors.push(r.varName);
    //   } else if (r.string) {
    //     this.destructors.push("(char *)" + r.varName);
    //   } else this.destructors.push(r.varName);
    // });
  }
}

interface CVariableOptions {
  removeStorageSpecifier?: boolean;
  initializer?: string;
}

export class CVariable {
  private varString: string;
  constructor(
    scope: IScope,
    public name: string,
    private typeSource,
    options?: CVariableOptions
  ) {
    let typeString = scope.root.typeHelper.getTypeString(typeSource);

    if (typeString == IntegerType) {
      HeaderRegistry.declareDependency(Int16HeaderType);
    } else if (typeString == BooleanType) {
      HeaderRegistry.declareDependency(Uint8HeaderType);
    }
    if (typeString.indexOf("{var}") > -1)
      this.varString = typeString.replace("{var}", name);
    else this.varString = typeString + " " + name;

    // root scope, make variables file-scoped by default
    if (scope.parent == null && this.varString.indexOf("static") != 0)
      this.varString = "static " + this.varString;

    if (options && options.removeStorageSpecifier)
      this.varString = this.varString.replace(/^static /, "");
    if (options && options.initializer)
      this.varString += " = " + options.initializer;
  }
  resolve() {
    return this.varString;
  }
}
