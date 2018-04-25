import {
  CodeTemplate,
  Header,
  INativeExpression,
  IScope,
  LimitsHeaderType
} from "nativejs-compiler";

export class StandardLimitsHeader implements Header {
  public getType() {
    return LimitsHeaderType;
  }
  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <limits.h>
`)
class Template {}
