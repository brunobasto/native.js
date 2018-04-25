import * as ts from "typescript";
import { CFunction, CFunctionPrototype } from "../nodes/function";
import { CVariable, CVariableDestructors } from "../nodes/variable";
import { Bottom, BottomRegistry } from "./bottom";
import { GarbageCollector } from "./gc";
import {
  BooleanHeaderType,
  Header,
  HeaderRegistry,
  StructHeaderType,
  Uint8HeaderType
} from "./header";
import { Main, MainRegistry } from "./main";
import { MemoryManager } from "./memory";
import { Plugin, PluginRegistry } from "./PluginRegistry";
import { Preset } from "./preset";
import { CodeTemplate, CodeTemplateFactory } from "./template";
import { TemporaryVariables } from "./temporary/TemporaryVariables";
import { ArrayType, StructType } from "./types/NativeTypes";
import { TypeInferencer } from "./types/TypeInferencer";
import { TypeRegistry } from "./types/TypeRegistry";
import { TypeVisitor } from "./types/TypeVisitor";

// these imports are here only because it is necessary to run decorators
import "../nodes/call";
import "../nodes/expressions";
import "../nodes/literals";
import "../nodes/statements";

import "../standard/array/concat";
import "../standard/array/forEach";
import "../standard/array/indexOf";
import "../standard/array/join";
import "../standard/array/lastIndexOf";
import "../standard/array/pop";
import "../standard/array/push";
import "../standard/array/reverse";
import "../standard/array/shift";
import "../standard/array/slice";
import "../standard/array/sort";
import "../standard/array/splice";
import "../standard/array/unshift";

import "../standard/string/charAt";
import "../standard/string/charCodeAt";
import "../standard/string/concat";
import "../standard/string/indexOf";
import "../standard/string/lastIndexOf";
import "../standard/string/match";
import "../standard/string/search";
import "../standard/string/slice";
import "../standard/string/substring";
import "../standard/string/toString";

export interface IScope {
  parent: IScope;
  func: IScope;
  root: CProgram;
  variables: CVariable[];
  statements: any[];
}

class HeaderFlags {
  public js_var: boolean = false;
  public array_int16_t_cmp: boolean = false;
  public array_str_cmp: boolean = false;
  public gc_iterator: boolean = false;
  public gc_iterator2: boolean = false;
  public str_char_code_at: boolean = false;
  public str_slice: boolean = false;
  public atoi: boolean = false;
  public parseInt: boolean = false;
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
    for (const plugin of preset.getPlugins()) {
      collectedPlugins.push(plugin);
    }

    for (const header of preset.getHeaders()) {
      collectedHeaders.push(header);
    }

    for (const p of preset.getPresets()) {
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

    for (const preset of presets) {
      this.resolvePreset(preset, collectedHeaders, collectedPlugins);
    }

    for (const header of collectedHeaders) {
      HeaderRegistry.registerHeader(header.getType(), header);
    }

    for (const plugin of collectedPlugins) {
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

    for (const source of sourceFiles) {
      this.memoryManager.preprocessTemporaryVariables(source);
    }

    for (const source of sourceFiles) {
      for (const s of source.statements) {
        if (s.kind === ts.SyntaxKind.FunctionDeclaration) {
          this.functions.push(new CFunction(this, s as any));
        } else { this.statements.push(CodeTemplateFactory.createForNode(this, s)); }
      }
    }

    const structs = this.typeVisitor.getDeclaredStructs();

    structs.forEach((s: any) => {
      HeaderRegistry.declareDependency(StructHeaderType, {
        name: s.name,
        properties: s.properties
      });
    });

    const functionPrototypes = this.typeVisitor.getFunctionPrototypes();

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
