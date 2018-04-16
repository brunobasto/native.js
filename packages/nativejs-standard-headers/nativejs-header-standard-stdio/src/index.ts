import { Header, StdioHeaderType } from "nativejs-compiler";
import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";

export class StandardStdIoHeader implements Header {
  public getType() {
    return StdioHeaderType;
  }
  public getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <stdio.h>
`)
class Template {}
