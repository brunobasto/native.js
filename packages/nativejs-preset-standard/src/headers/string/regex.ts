import * as ts from "typescript";
import {
  ArrayCreateHeaderType,
  BooleanHeaderType,
  Header,
  HeaderRegistry,
  Int16HeaderType,
  RegexMatchHeaderType,
  SubStringHeaderType,
  StructHeaderType,
  ArrayType,
  StringType,
  IntegerType
} from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";

const regexClearMatches = `
void regex_clear_matches(struct regex_match_struct_t *match_info, int16_t groupN) {
    int16_t i;
    for (i = 0; i < groupN; i++) {
        match_info->matches[i].index = -1;
        match_info->matches[i].end = -1;
    }
}
`;
const regexMatch = `
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
`;

export class StandardRegexMatchHeader implements Header {
  public getType() {
    return RegexMatchHeaderType;
  }

  public getTemplate(): CExpression {
    HeaderRegistry.declareDependency(ArrayCreateHeaderType);
    HeaderRegistry.declareDependency(BooleanHeaderType);
    HeaderRegistry.declareDependency(Int16HeaderType);
    HeaderRegistry.declareDependency(SubStringHeaderType);

    const scope: IScope = HeaderRegistry.getProgramScope();

    scope.root.functions.push(regexClearMatches);
    scope.root.functions.push(regexMatch);

    scope.root.typeHelper.ensureArrayStruct(StringType);

    return new RegexMatchTemplate();
  }
}

@CodeTemplate(`
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
`)
class RegexMatchTemplate {}
