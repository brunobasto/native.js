import {
  AssertHeaderType,
  CodeTemplate,
  Header,
  INativeExpression,
  IScope
} from "nativejs-compiler";

export class StandardAssertHeader implements Header {
  public getType() {
    return AssertHeaderType;
  }
  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <assert.h>
`)
class Template {}
