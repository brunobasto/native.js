import {
  CodeTemplate,
  Header,
  INativeExpression,
  StdlibHeaderType
} from "nativejs-compiler";

export class StandardStdLibHeader implements Header {
  public getType() {
    return StdlibHeaderType;
  }
  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <stdlib.h>
`)
class Template {}
