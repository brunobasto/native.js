import * as ts from "typescript";
import {
  Header,
  HeaderRegistry,
  Int16HeaderType,
  RegexMatchHeaderType,
  ArrayCreateHeaderType,
  SubStringHeaderType
} from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { IScope } from "../../program";
import { CodeTemplate } from "../../template";

export class StandardRegexMatchHeader implements Header {
  public getType() {
    return RegexMatchHeaderType;
  }
  public getTemplate(): CExpression {
    HeaderRegistry.declareDependency(ArrayCreateHeaderType);
    HeaderRegistry.declareDependency(Int16HeaderType);
    HeaderRegistry.declareDependency(SubStringHeaderType);

    return new RegexMatchTemplate();
  }
}

@CodeTemplate(`
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
`)
class RegexMatchTemplate {}
