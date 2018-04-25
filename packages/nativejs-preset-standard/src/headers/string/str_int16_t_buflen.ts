import {
  CodeTemplate,
  Header,
  HeaderRegistry,
  INativeExpression,
  Int16HeaderType,
  IScope,
  LimitsHeaderType,
  StringAndIntBufferLengthHeaderType,
  StringHeaderType
} from "nativejs-compiler";

export class StandardStringAndIntBufferLengthHeader implements Header {
  public getType() {
    return StringAndIntBufferLengthHeaderType;
  }
  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(LimitsHeaderType);
    HeaderRegistry.declareDependency(Int16HeaderType);

    return new Template();
  }
}

@CodeTemplate(`
#define STR_INT16_T_BUFLEN ((CHAR_BIT * sizeof(int16_t) - 1) / 3 + 2)
`)
class Template {}
