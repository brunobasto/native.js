import {
  CodeTemplate,
  Header,
  HeaderRegistry,
  INativeExpression,
  Int16HeaderType,
  IScope,
  StdioHeaderType,
  StringAndIntBufferLengthHeaderType,
  StringAndIntConcatHeaderType,
  StringHeaderType
} from "nativejs-compiler";

export class StandardStringAndIntConcatHeader implements Header {
  public getType() {
    return StringAndIntConcatHeaderType;
  }
  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(StringAndIntBufferLengthHeaderType);
    HeaderRegistry.declareDependency(Int16HeaderType);
    HeaderRegistry.declareDependency(StdioHeaderType);
    HeaderRegistry.declareDependency(StringHeaderType);

    return new Template();
  }
}

@CodeTemplate(`
void str_int16_t_cat(char *str, int16_t num) {
      char numstr[STR_INT16_T_BUFLEN];
      sprintf(numstr, "%d", num);
      strcat(str, numstr);
  }
`)
class Template {}
