import {
  CExpression,
  CodeTemplate,
  Header,
  HeaderRegistry,
  Int16HeaderType,
  IScope,
  StringHeaderType,
  StringAndIntCompareHeaderType,
  StringAndIntBufferLengthHeaderType,
  StdioHeaderType
} from "nativejs-compiler";

export class StandardStringAndIntCompareHeader implements Header {
  public getType() {
    return StringAndIntCompareHeaderType;
  }
  public getTemplate(): CExpression {
    HeaderRegistry.declareDependency(StringAndIntBufferLengthHeaderType);
    HeaderRegistry.declareDependency(Int16HeaderType);
    HeaderRegistry.declareDependency(StdioHeaderType);
    HeaderRegistry.declareDependency(StringHeaderType);

    return new Template();
  }
}

@CodeTemplate(`
int str_int16_t_cmp(const char * str, int16_t num) {
    char numstr[STR_INT16_T_BUFLEN];
    sprintf(numstr, "%d", num);
    return strcmp(str, numstr);
}
`)
class Template {}
