import { INativeExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderType } from "nativejs-compiler";

export class IOHeaderType implements HeaderType {
  public NAME: string = "IOHeaderType";
  public UNIQUE: boolean = true;
}

export class IOHeader implements Header {
  public getType() {
    return IOHeaderType;
  }

  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <avr/io.h>
`)
class Template {}
