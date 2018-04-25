import {
  CExpression,
  CodeTemplate,
  Header,
  StdlibHeaderType
} from "nativejs-compiler";

export class StandardStdLibHeader implements Header {
  public getType() {
    return StdlibHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <stdlib.h>
`)
class Template {}
