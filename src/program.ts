import * as ts from "typescript";
import { MemoryManager } from "./memory";
import { TypeHelper, ArrayType } from "./types";
import { CodeTemplate, CodeTemplateFactory } from "./template";
import { CFunction, CFunctionPrototype } from "./nodes/function";
import { CVariable, CVariableDestructors } from "./nodes/variable";
import { Preset } from "./core/preset";
import { Plugin, PluginRegistry } from "./core/plugin";
import { Header, HeaderRegistry } from "./core/header";
import { Main, MainRegistry } from "./core/main";
import { GarbageCollector } from "./core/gc";

// these imports are here only because it is necessary to run decorators
import "./nodes/statements";
import "./nodes/expressions";
import "./nodes/call";
import "./nodes/literals";

import "./standard/array/forEach";
import "./standard/array/push";
import "./standard/array/pop";
import "./standard/array/unshift";
import "./standard/array/shift";
import "./standard/array/splice";
import "./standard/array/slice";
import "./standard/array/concat";
import "./standard/array/join";
import "./standard/array/indexOf";
import "./standard/array/lastIndexOf";
import "./standard/array/sort";
import "./standard/array/reverse";

import "./standard/string/search";
import "./standard/string/charCodeAt";
import "./standard/string/charAt";
import "./standard/string/concat";
import "./standard/string/substring";
import "./standard/string/slice";
import "./standard/string/toString";
import "./standard/string/indexOf";
import "./standard/string/lastIndexOf";
import "./standard/string/match";

export interface IScope {
  parent: IScope;
  func: IScope;
  root: CProgram;
  variables: CVariable[];
  statements: any[];
}

class HeaderFlags {
  malloc: boolean = false;
  bool: boolean = false;
  js_var: boolean = false;
  array_int16_t_cmp: boolean = false;
  array_str_cmp: boolean = false;
  gc_iterator: boolean = false;
  gc_iterator2: boolean = false;
  str_int16_t_cmp: boolean = false;
  str_int16_t_cat: boolean = false;
  str_pos: boolean = false;
  str_rpos: boolean = false;
  str_len: boolean = false;
  str_char_code_at: boolean = false;
  str_substring: boolean = false;
  str_slice: boolean = false;
  atoi: boolean = false;
  parseInt: boolean = false;
  regex: boolean = false;
  regex_match: boolean = false;
}

@CodeTemplate(`
{headers}

{#if headerFlags.str_int16_t_cmp || headerFlags.str_int16_t_cat}
    #include <limits.h>
{/if}
{#if headerFlags.regex}
    struct regex_indices_struct_t {
        int16_t index;
        int16_t end;
    };
    struct regex_match_struct_t {
        int16_t index;
        int16_t end;
        struct regex_indices_struct_t *matches;
        int16_t matches_count;
    };
    typedef struct regex_match_struct_t regex_func_t(const char*, int16_t);
    struct regex_struct_t {
        const char * str;
        regex_func_t * func;
    };
{/if}
{#if headerFlags.js_var}
    enum js_var_type {JS_VAR_BOOL, JS_VAR_INT, JS_VAR_STRING, JS_VAR_ARRAY, JS_VAR_STRUCT, JS_VAR_DICT};
	struct js_var {
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
{#if headerFlags.str_int16_t_cmp || headerFlags.str_int16_t_cat}
    #define STR_INT16_T_BUFLEN ((CHAR_BIT * sizeof(int16_t) - 1) / 3 + 2)
{/if}
{#if headerFlags.str_int16_t_cmp}
    int str_int16_t_cmp(const char * str, int16_t num) {
        char numstr[STR_INT16_T_BUFLEN];
        sprintf(numstr, "%d", num);
        return strcmp(str, numstr);
    }
{/if}
{#if headerFlags.str_pos}
    int16_t str_pos(const char * str, const char *search) {
        int16_t i;
        const char * found = strstr(str, search);
        int16_t pos = 0;
        if (found == 0)
            return -1;
        while (*str && str < found) {
            i = 1;
            if ((*str & 0xE0) == 0xC0) i=2;
            else if ((*str & 0xF0) == 0xE0) i=3;
            else if ((*str & 0xF8) == 0xF0) i=4;
            str += i;
            pos += i == 4 ? 2 : 1;
        }
        return pos;
    }
{/if}
{#if headerFlags.str_rpos}
    int16_t str_rpos(const char * str, const char *search) {
        int16_t i;
        const char * found = strstr(str, search);
        int16_t pos = 0;
        const char * end = str + (strlen(str) - strlen(search));
        if (found == 0)
            return -1;
        found = 0;
        while (end > str && found == 0)
            found = strstr(end--, search);
        while (*str && str < found) {
            i = 1;
            if ((*str & 0xE0) == 0xC0) i=2;
            else if ((*str & 0xF0) == 0xE0) i=3;
            else if ((*str & 0xF8) == 0xF0) i=4;
            str += i;
            pos += i == 4 ? 2 : 1;
        }
        return pos;
    }
{/if}
{#if headerFlags.str_len || headerFlags.str_substring || headerFlags.str_slice}
    int16_t str_len(const char * str) {
        int16_t len = 0;
        int16_t i = 0;
        while (*str) {
            i = 1;
            if ((*str & 0xE0) == 0xC0) i=2;
            else if ((*str & 0xF0) == 0xE0) i=3;
            else if ((*str & 0xF8) == 0xF0) i=4;
            str += i;
            len += i == 4 ? 2 : 1;
        }
        return len;
    }
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
{#if headerFlags.str_substring || headerFlags.str_slice}
    const char * str_substring(const char * str, int16_t start, int16_t end) {
        int16_t i, tmp, pos, len = str_len(str), byte_start = -1;
        char *p, *buf;
        start = start < 0 ? 0 : (start > len ? len : start);
        end = end < 0 ? 0 : (end > len ? len : end);
        if (end < start) {
            tmp = start;
            start = end;
            end = tmp;
        }
        i = 0;
        pos = 0;
        p = (char *)str;
        while (*p) {
            if (start == pos)
                byte_start = p - str;
            if (end == pos)
                break;
            i = 1;
            if ((*p & 0xE0) == 0xC0) i=2;
            else if ((*p & 0xF0) == 0xE0) i=3;
            else if ((*p & 0xF8) == 0xF0) i=4;
            p += i;
            pos += i == 4 ? 2 : 1;
        }
        len = byte_start == -1 ? 0 : p - str - byte_start;
        buf = malloc(len + 1);
        assert(buf != NULL);
        memcpy(buf, str + byte_start, len);
        buf[len] = '\\0';
        return buf;
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
{#if headerFlags.str_int16_t_cat}
    void str_int16_t_cat(char *str, int16_t num) {
        char numstr[STR_INT16_T_BUFLEN];
        sprintf(numstr, "%d", num);
        strcat(str, numstr);
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

{userStructs => struct {name} {\n    {properties {    }=> {this};\n}};\n}

{#if headerFlags.regex}
    void regex_clear_matches(struct regex_match_struct_t *match_info, int16_t groupN) {
        int16_t i;
        for (i = 0; i < groupN; i++) {
            match_info->matches[i].index = -1;
            match_info->matches[i].end = -1;
        }
    }
{/if}
{#if headerFlags.regex_match}
    struct array_string_t *regex_match(struct regex_struct_t regex, const char * s) {
        struct regex_match_struct_t match_info;
        struct array_string_t *match_array = NULL;
        int16_t i;

        match_info = regex.func(s, TRUE);
        if (match_info.index != -1) {
            ARRAY_CREATE(match_array, match_info.matches_count + 1, match_info.matches_count + 1);
            match_array->data[0] = str_substring(s, match_info.index, match_info.end);
            for (i = 0;i < match_info.matches_count; i++) {
                if (match_info.matches[i].index != -1 && match_info.matches[i].end != -1)
                    match_array->data[i + 1] = str_substring(s, match_info.matches[i].index, match_info.matches[i].end);
                else
                    match_array->data[i + 1] = str_substring(s, 0, 0);
            }
        }
        if (match_info.matches_count)
            free(match_info.matches);

        return match_array;
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
`)
export class CProgram implements IScope {
  public destructors: CVariableDestructors;
  public func = this;
  public functionPrototypes: CFunctionPrototype[] = [];
  public functions: any[] = [];
  public gcVarNames: string[];
  public headerFlags = new HeaderFlags();
  public headers : any[] = [];
  public mains : any[] = [];
  public memoryManager: MemoryManager;
  public parent: IScope = null;
  public root = this;
  public statements: any[] = [];
  public typeChecker: ts.TypeChecker;
  public typeHelper: TypeHelper;
  public userStructs: { name: string; properties: CVariable[] }[];
  public variables: CVariable[] = [];
  public gc: GarbageCollector;
  public experimentalGCDestructors: any[] = null;
  public experimentalGCVariables: CVariable[] = [];

  private resolvePreset(preset: Preset, collectedHeaders: Header[], collectedPlugins: Plugin[]) {
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

  constructor(tsProgram: ts.Program, presets = []) {
    this.typeChecker = tsProgram.getTypeChecker();
    this.typeHelper = new TypeHelper(this.typeChecker);
    this.memoryManager = new MemoryManager(this.typeChecker, this.typeHelper);
    this.gc = new GarbageCollector(this.typeChecker);

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

    this.typeHelper.figureOutVariablesAndTypes(tsProgram.getSourceFiles());

    this.memoryManager.preprocessVariables();

    for (let source of tsProgram.getSourceFiles()) {
        this.memoryManager.preprocessTemporaryVariables(source);
    }

    // this.gcVarNames = this.memoryManager.getGCVariablesForScope(null);
    // for (let gcVarName of this.gcVarNames) {
    //   let gcType = "ARRAY(void *)";
    //   if (gcVarName.indexOf("_arrays") > -1) gcType = "ARRAY(ARRAY(void *))";
    //   if (gcVarName.indexOf("_arrays_c") > -1)
    //     gcType = "ARRAY(ARRAY(ARRAY(void *)))";
    //   this.variables.push(new CVariable(this, gcVarName, gcType));
    // }

    for (let source of tsProgram.getSourceFiles()) {
      for (let s of source.statements) {
        if (s.kind == ts.SyntaxKind.FunctionDeclaration)
          this.functions.push(new CFunction(this, <any>s));
        else this.statements.push(CodeTemplateFactory.createForNode(this, s));
      }
    }

    let [
      structs,
      functionPrototypes
    ] = this.typeHelper.getStructsAndFunctionPrototypes();

    this.userStructs = structs.map(s => {
      return {
        name: s.name,
        properties: s.properties.map(
          p =>
            new CVariable(this, p.name, p.type, {
              removeStorageSpecifier: true
            })
        )
      };
    });

    this.functionPrototypes = functionPrototypes.map(
      fp => new CFunctionPrototype(this, fp)
    );

    this.headers = HeaderRegistry.getDeclaredDependencies();

    this.mains = MainRegistry.getDeclaredDependencies();

    this.experimentalGCVariables = this.gc.getTemporaryVariableDeclarators(this, null);

    this.experimentalGCDestructors = this.gc.getTemporaryVariableDestructors(this, null);
  }
}