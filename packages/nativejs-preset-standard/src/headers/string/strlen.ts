import {
  CodeTemplate,
  Header,
  HeaderRegistry,
  INativeExpression,
  Int16HeaderType,
  IScope,
  StringLengthHeaderType
} from "nativejs-compiler";

export class StandardStringLengthHeader implements Header {
  public getType() {
    return StringLengthHeaderType;
  }
  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(Int16HeaderType);

    return new Template();
  }
}

@CodeTemplate(`
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
`)
class Template {}
