import {
  CodeTemplate,
  Header,
  INativeExpression,
  IScope,
  StringHeaderType
} from "nativejs-compiler";

export class StandardStringHeader implements Header {
  public getType() {
    return StringHeaderType;
  }
  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <string.h>
`)
class Template {}
