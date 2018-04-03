import { Header, StdioHeaderType } from "../../core/header";
import { CExpression } from "../../nodes/expressions";
import { CodeTemplate } from "../../template";

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
