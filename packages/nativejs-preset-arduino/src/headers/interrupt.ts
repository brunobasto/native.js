import { INativeExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderType } from "nativejs-compiler";

export class InterruptHeaderType implements HeaderType {
  public NAME: string = "InterruptHeaderType";
  public UNIQUE: boolean = true;
}

export class InterruptHeader implements Header {
  public getType() {
    return InterruptHeaderType;
  }

  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <avr/interrupt.h>
`)
class Template {}
