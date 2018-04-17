import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderType } from "nativejs-compiler";

export class InterruptHeaderType implements HeaderType {
  NAME: string = "InterruptHeaderType";
  UNIQUE: boolean = true;
}

export class InterruptHeader implements Header {
  getType() {
    return InterruptHeaderType;
  }

  getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <avr/interrupt.h>
`)
class Template {}
