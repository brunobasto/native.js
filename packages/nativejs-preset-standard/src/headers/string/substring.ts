import {
  AssertHeaderType,
  CodeTemplate,
  Header,
  HeaderRegistry,
  INativeExpression,
  IScope,
  StdlibHeaderType,
  StringHeaderType,
  StringLengthHeaderType,
  SubStringHeaderType
} from "nativejs-compiler";

export class StandardSubStringHeader implements Header {
  public getType() {
    return SubStringHeaderType;
  }
  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(AssertHeaderType);
    HeaderRegistry.declareDependency(StdlibHeaderType);
    HeaderRegistry.declareDependency(StringHeaderType);
    HeaderRegistry.declareDependency(StringLengthHeaderType);

    return new Template();
  }
}

@CodeTemplate(`
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
`)
class Template {}
