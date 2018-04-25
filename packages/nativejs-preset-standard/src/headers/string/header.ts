import {
  CExpression,
  CodeTemplate,
  Header,
  IScope,
  StringHeaderType
} from "nativejs-compiler";

export class StandardStringHeader implements Header {
  public getType() {
    return StringHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <string.h>
`)
class Template {}
