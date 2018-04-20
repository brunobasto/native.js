import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderType } from "nativejs-compiler";

export class ArduinoHeaderType implements HeaderType {
  NAME: string = "ArduinoHeaderType";
  UNIQUE: boolean = true;
}

export class ArduinoHeader implements Header {
  getType() {
    return ArduinoHeaderType;
  }

  getTemplate(): CExpression {
    return new Template();
  }
}

@CodeTemplate(`
#include <Arduino.h>
`)
class Template {}
