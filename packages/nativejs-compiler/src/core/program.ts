import * as ts from "typescript";
import { MemoryManager } from "./memory";
import { ArrayType, StructType } from "./types/NativeTypes";
import { TypeRegistry } from "./types/TypeRegistry";
import { TypeVisitor } from "./types/TypeVisitor";
import { TypeInferencer } from "./types/TypeInferencer";
import { CodeTemplate, CodeTemplateFactory } from "./template";
import { CFunction, CFunctionPrototype } from "../nodes/function";
import { CVariable, CVariableDestructors } from "../nodes/variable";
import { Preset } from "./preset";
import { Plugin, PluginRegistry } from "./PluginRegistry";
import {
  Header,
  HeaderRegistry,
  BooleanHeaderType,
  Uint8HeaderType,
  StructHeaderType
} from "./header";
import { Main, MainRegistry } from "./main";
import { Bottom, BottomRegistry } from "./bottom";
import { GarbageCollector } from "./gc";
import { TemporaryVariables } from "./temporary/TemporaryVariables";

// these imports are here only because it is necessary to run decorators
import "../nodes/statements";
import "../nodes/expressions";
import "../nodes/call";
import "../nodes/literals";

import "../standard/array/forEach";
import "../standard/array/push";
import "../standard/array/pop";
import "../standard/array/unshift";
import "../standard/array/shift";
import "../standard/array/splice";
import "../standard/array/slice";
import "../standard/array/concat";
import "../standard/array/join";
import "../standard/array/indexOf";
import "../standard/array/lastIndexOf";
import "../standard/array/sort";
import "../standard/array/reverse";

import "../standard/string/search";
import "../standard/string/charCodeAt";
import "../standard/string/charAt";
import "../standard/string/concat";
import "../standard/string/substring";
import "../standard/string/slice";
import "../standard/string/toString";
import "../standard/string/indexOf";
import "../standard/string/lastIndexOf";
import "../standard/string/match";

export interface IScope {
  parent: IScope;
  func: IScope;
  root: CProgram;
  variables: CVariable[];
  statements: any[];
}

class HeaderFlags {
  js_var: boolean = false;
  array_int16_t_cmp: boolean = false;
  array_str_cmp: boolean = false;
  gc_iterator: boolean = false;
  gc_iterator2: boolean = false;
  str_char_code_at: boolean = false;
  str_slice: boolean = false;
  atoi: boolean = false;
  parseInt: boolean = false;
}

@CodeTemplate(`
{headers}

{#if headerFlags.js_var}
    enum js_var_type {JS_VAR_BOOL, JS_VAR_INT, JS_VAR_STRING, JS_VAR_ARRAY, JS_VAR_STRUCT, JS_VAR_DICT};
	struct js_let {
	    enum js_var_type type;
	    uint8_t bool;
	    int16_t number;
	    const char *string;
	    void *obj;
	};
{/if}
{#if headerFlags.gc_iterator || headerFlags.dict}
    #define ARRAY(T) struct {\\
        int16_t size;\\
        int16_t capacity;\\
        T *data;\\
    } *
{/if}
{#if headerFlags.str_char_code_at}
    int16_t str_char_code_at(const char * str, int16_t pos) {
        int16_t i, res = 0;
        while (*str) {
            i = 1;
            if ((*str & 0xE0) == 0xC0) i=2;
            else if ((*str & 0xF0) == 0xE0) i=3;
            else if ((*str & 0xF8) == 0xF0) i=4;
            if (pos == 0) {
                res += (unsigned char)*str++;
                if (i > 1) {
                    res <<= 6; res -= 0x3080;
                    res += (unsigned char)*str++;
                }
                return res;
            }
            str += i;
            pos -= i == 4 ? 2 : 1;
        }
        return -1;
    }
{/if}
{#if headerFlags.str_slice}
    const char * str_slice(const char * str, int16_t start, int16_t end) {
        int16_t len = str_len(str);
        start = start < 0 ? len + start : start;
        end = end < 0 ? len + end : end;
        if (end - start < 0)
            end = start;
        return str_substring(str, start, end);
    }
{/if}
{#if headerFlags.array_int16_t_cmp}
    int array_int16_t_cmp(const void* a, const void* b) {
        return ( *(int16_t*)a - *(int16_t*)b );
    }
{/if}
{#if headerFlags.array_str_cmp}
    int array_str_cmp(const void* a, const void* b) {
        return strcmp(*(const char **)a, *(const char **)b);
    }
{/if}
{#if headerFlags.parseInt}
    int16_t parseInt(const char * str) {
        int r;
        sscanf(str, "%d", &r);
        return (int16_t) r;
    }
{/if}

{#if headerFlags.gc_iterator}
    int16_t gc_i;
{/if}
{#if headerFlags.gc_iterator2}
    int16_t gc_j;
{/if}

{experimentalGCVariables => {this};\n}

{variables => {this};\n}

{functionPrototypes => {this}\n}

{functions => {this}\n}

int main(void) {
  {mains}
  {statements {    }=> {this}}
  return 0;
}

{bottoms}
`)
export class CProgram implements IScope {
  public bottoms: any[] = [];
  public destructors: CVariableDestructors;
  public experimentalGCDestructors: any[] = null;
  public experimentalGCVariables: CVariable[] = [];
  public func = this;
  public functionPrototypes: CFunctionPrototype[] = [];
  public functions: any[] = [];
  public gc: GarbageCollector;
  public gcVarNames: string[];
  public headerFlags = new HeaderFlags();
  public headers: any[] = [];
  public mains: any[] = [];
  public memoryManager: MemoryManager;
  public parent: IScope = null;
  public root = this;
  public statements: any[] = [];
  public typeChecker: ts.TypeChecker;
  public typeVisitor: TypeVisitor;
  public variables: CVariable[] = [];
  public temporaryVariables: TemporaryVariables;
  public typeInferencer: TypeInferencer;

  private resolvePreset(
    preset: Preset,
    collectedHeaders: Header[],
    collectedPlugins: Plugin[]
  ) {
    for (let plugin of preset.getPlugins()) {
      collectedPlugins.push(plugin);
    }

    for (let header of preset.getHeaders()) {
      collectedHeaders.push(header);
    }

    for (let p of preset.getPresets()) {
      this.resolvePreset(p, collectedHeaders, collectedPlugins);
    }
  }

  constructor(tsProgram: ts.Program, presets: Preset[] = []) {
    this.typeChecker = tsProgram.getTypeChecker();
    this.gc = new GarbageCollector(this.typeChecker);
    this.temporaryVariables = new TemporaryVariables(this.typeChecker);

    this.typeInferencer = new TypeInferencer(this);
    this.typeVisitor = new TypeVisitor(this);

    this.memoryManager = new MemoryManager(
      this.typeChecker,
      this.typeVisitor,
      this.temporaryVariables
    );

    TypeRegistry.init();
    HeaderRegistry.init();
    HeaderRegistry.setProgramScope(this);

    const collectedPlugins: Plugin[] = [];
    const collectedHeaders: Header[] = [];

    for (let preset of presets) {
      this.resolvePreset(preset, collectedHeaders, collectedPlugins);
    }

    for (let header of collectedHeaders) {
      HeaderRegistry.registerHeader(header.getType(), header);
    }

    for (let plugin of collectedPlugins) {
      PluginRegistry.registerPlugin(plugin);
    }

    const sourceFiles = [];
    for (const sourceFile of tsProgram.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        sourceFiles.push(sourceFile);
      }
    }

    this.typeVisitor.visit(sourceFiles);

    this.memoryManager.preprocessVariables();

    HeaderRegistry.declareDependency(BooleanHeaderType);
    HeaderRegistry.declareDependency(Uint8HeaderType);

    for (let source of sourceFiles) {
      this.memoryManager.preprocessTemporaryVariables(source);
    }

    for (let source of sourceFiles) {
      for (let s of source.statements) {
        if (s.kind === ts.SyntaxKind.FunctionDeclaration)
          this.functions.push(new CFunction(this, <any>s));
        else this.statements.push(CodeTemplateFactory.createForNode(this, s));
      }
    }

    let structs = this.typeVisitor.getDeclaredStructs();

    structs.forEach((s: any) => {
      HeaderRegistry.declareDependency(StructHeaderType, {
        name: s.name,
        properties: s.properties
      });
    });

    let functionPrototypes = this.typeVisitor.getFunctionPrototypes();

    this.functionPrototypes = functionPrototypes.map(
      fp => new CFunctionPrototype(this, fp)
    );

    this.headers = HeaderRegistry.getDeclaredDependencies();

    this.mains = MainRegistry.getDeclaredDependencies();

    this.bottoms = BottomRegistry.getDeclaredDependencies().map(bottom => {
      return new bottom().getTemplate();
    });

    this.experimentalGCVariables = this.gc.getTemporaryVariableDeclarators(
      this,
      null
    );

    this.experimentalGCDestructors = this.gc.getTemporaryVariableDestructors(
      this,
      null
    );
  }
}
