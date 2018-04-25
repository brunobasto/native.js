import {
  CExpression,
  CodeTemplate,
  Header,
  IScope,
  LimitsHeaderType
} from "nativejs-compiler";

export class StandardLimitsHeader implements Header {
  public getType() {
    return LimitsHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <limits.h>
`)
class Template {}
