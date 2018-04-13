import {
  StandardArrayCreateHeader,
  StandardArrayInsertHeader,
  StandardArrayPopHeader,
  StandardArrayPushHeader,
  StandardArrayRemoveHeader,
  StandardArrayTypeHeader
} from "hardware-header-standard-array";
import { StandardAssertHeader } from "hardware-header-standard-assert";
import { StandardBooleanHeader } from "hardware-header-standard-boolean";
import { StandardDictCreateHeader } from "hardware-header-standard-dict";
import { StandardInt16Header } from "hardware-header-standard-int16_t";
import { StandardStdIoHeader } from "hardware-header-standard-stdio";
import { StandardStdLibHeader } from "hardware-header-standard-stdlib";
import { StandardMathHeader } from "hardware-header-standard-math";
import {
  StandardStringHeader,
  StandardSubStringHeader,
  StandardStringLengthHeader,
  StandardRegexMatchHeader
} from "hardware-header-standard-string";
import { StandardUint8Header } from "hardware-header-standard-uint8_t";

import { ConsoleLogPlugin } from "hardware-plugin-standard-console";
import { MathLogPlugin } from "hardware-plugin-standard-math";

import { Plugin } from "hardware-compiler";
import { Preset } from "hardware-compiler";

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
      new StandardMathHeader()
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
