import {
  CExpression,
  CodeTemplate,
  Header,
  HeaderRegistry,
  Int16HeaderType,
  IScope,
  StringHeaderType,
  StringAndIntBufferLengthHeaderType,
  LimitsHeaderType
} from "nativejs-compiler";

export class StandardStringAndIntBufferLengthHeader implements Header {
  public getType() {
    return StringAndIntBufferLengthHeaderType;
  }
  public getTemplate(): CExpression {
    HeaderRegistry.declareDependency(LimitsHeaderType);
    HeaderRegistry.declareDependency(Int16HeaderType);

    return new Template();
  }
}

@CodeTemplate(`
#define STR_INT16_T_BUFLEN ((CHAR_BIT * sizeof(int16_t) - 1) / 3 + 2)
`)
class Template {}
