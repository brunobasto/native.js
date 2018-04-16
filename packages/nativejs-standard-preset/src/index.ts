import {
  StandardArrayCreateHeader,
  StandardArrayInsertHeader,
  StandardArrayPopHeader,
  StandardArrayPushHeader,
  StandardArrayRemoveHeader,
  StandardArrayTypeHeader
} from "nativejs-header-standard-array";
import { StandardLimitsHeader } from "nativejs-header-standard-limits";
import { StandardAssertHeader } from "nativejs-header-standard-assert";
import { StandardBooleanHeader } from "nativejs-header-standard-boolean";
import { StandardDictCreateHeader } from "nativejs-header-standard-dict";
import { StandardInt16Header } from "nativejs-header-standard-int16_t";
import { StandardStdIoHeader } from "nativejs-header-standard-stdio";
import { StandardStdLibHeader } from "nativejs-header-standard-stdlib";
import { StandardMathHeader } from "nativejs-header-standard-math";
import { StandardStructHeader } from "nativejs-header-standard-struct";
import {
  StandardStringHeader,
  StandardSubStringHeader,
  StandardStringLengthHeader,
  StandardRegexMatchHeader,
  StandardStringPositionHeader,
  StandardStringRightPositionHeader,
  StandardStringAndIntCompareHeader,
  StandardStringAndIntBufferLengthHeader,
  StandardStringAndIntConcatHeader
} from "nativejs-header-standard-string";
import { StandardUint8Header } from "nativejs-header-standard-uint8_t";

import { ConsoleLogPlugin } from "nativejs-plugin-standard-console";
import { MathLogPlugin } from "nativejs-plugin-standard-math";

import { Plugin } from "nativejs-compiler";
import { Preset } from "nativejs-compiler";

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
