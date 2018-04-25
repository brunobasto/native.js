import {
  AssertHeaderType,
  CExpression,
  CodeTemplate,
  Header,
  IScope
} from "nativejs-compiler";

export class StandardAssertHeader implements Header {
  public getType() {
    return AssertHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <assert.h>
`)
class Template {}
