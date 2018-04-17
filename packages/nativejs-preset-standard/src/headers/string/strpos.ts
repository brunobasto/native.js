import {
  Header,
  HeaderRegistry,
  Int16HeaderType,
  StringPositionHeaderType
} from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { IScope } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";

export class StandardStringPositionHeader implements Header {
  public getType() {
    return StringPositionHeaderType;
  }
  public getTemplate(): CExpression {
    HeaderRegistry.declareDependency(Int16HeaderType);

    return new Template();
  }
}

@CodeTemplate(`
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
`)
class Template {}
