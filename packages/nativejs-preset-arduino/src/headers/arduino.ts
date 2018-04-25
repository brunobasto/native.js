import { INativeExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderType } from "nativejs-compiler";

export class ArduinoHeaderType implements HeaderType {
  public NAME: string = "ArduinoHeaderType";
  public UNIQUE: boolean = true;
}

export class ArduinoHeader implements Header {
  public getType() {
    return ArduinoHeaderType;
  }

  public getTemplate(): INativeExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <Arduino.h>
`)
class Template {}
