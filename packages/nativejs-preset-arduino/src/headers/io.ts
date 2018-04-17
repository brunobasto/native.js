import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderType } from "nativejs-compiler";

export class IOHeaderType implements HeaderType {
  NAME: string = "IOHeaderType";
  UNIQUE: boolean = true;
}

export class IOHeader implements Header {
  getType() {
    return IOHeaderType;
  }

  getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <avr/io.h>
`)
class Template {}
