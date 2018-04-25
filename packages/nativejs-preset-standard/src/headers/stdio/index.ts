import {
  CodeTemplate,
  Header,
  INativeExpression,
  StdioHeaderType
} from "nativejs-compiler";

export class StandardStdIoHeader implements Header {
  public getType() {
    return StdioHeaderType;
  }
  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <stdio.h>
`)
class Template {}
