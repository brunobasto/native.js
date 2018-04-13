import { Header, StdioHeaderType } from "hardware-compiler";
import { CExpression } from "hardware-compiler";
import { CodeTemplate } from "hardware-compiler";

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
