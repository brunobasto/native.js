import {
  StandardArrayCreateHeader,
  StandardArrayInsertHeader,
  StandardArrayPopHeader,
  StandardArrayPushHeader,
  StandardArrayRemoveHeader,
  StandardArrayTypeHeader
} from "./headers/array";
import { StandardAssertHeader } from "./headers/assert";
import { StandardBooleanHeader } from "./headers/boolean";
import { StandardDictCreateHeader } from "./headers/dict";
import { StandardInt16Header } from "./headers/int16_t";
import { StandardLimitsHeader } from "./headers/limits";
import { StandardMathHeader } from "./headers/math";
import { StandardStdIoHeader } from "./headers/stdio";
import { StandardStdLibHeader } from "./headers/stdlib";
import {
  StandardRegexMatchHeader,
  StandardStringAndIntBufferLengthHeader,
  StandardStringAndIntCompareHeader,
  StandardStringAndIntConcatHeader,
  StandardStringHeader,
  StandardStringLengthHeader,
  StandardStringPositionHeader,
  StandardStringRightPositionHeader,
  StandardSubStringHeader
} from "./headers/string";
import { StandardStructHeader } from "./headers/struct";
import { StandardUint8Header } from "./headers/uint8_t";

import { ConsoleLogPlugin } from "./plugins/console";
import { MathLogPlugin } from "./plugins/math";

import { Plugin, Preset } from "nativejs-compiler";

export class StandardPreset implements Preset {
  public getHeaders() {
    return [
      new StandardStdIoHeader(),
      new StandardStringHeader(),
      new StandardArrayCreateHeader(),
      new StandardArrayInsertHeader(),
      new StandardArrayPopHeader(),
      new StandardArrayPushHeader(),
      new StandardArrayRemoveHeader(),
      new StandardBooleanHeader(),
      new StandardDictCreateHeader(),
      new StandardUint8Header(),
      new StandardInt16Header(),
      new StandardArrayTypeHeader(),
      new StandardAssertHeader(),
      new StandardStdLibHeader(),
      new StandardSubStringHeader(),
      new StandardStringLengthHeader(),
      new StandardRegexMatchHeader(),
      new StandardMathHeader(),
      new StandardStructHeader(),
      new StandardStringPositionHeader(),
      new StandardStringRightPositionHeader(),
      new StandardStringAndIntCompareHeader(),
      new StandardStringAndIntBufferLengthHeader(),
      new StandardLimitsHeader(),
      new StandardStringAndIntConcatHeader()
    ];
  }

  public getPlugins(): Plugin[] {
    return [new ConsoleLogPlugin(), new MathLogPlugin()];
  }

  public getPresets() {
    return [];
  }
}

export default StandardPreset;
