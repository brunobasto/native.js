import {
  StandardArrayCreateHeader,
  StandardArrayInsertHeader,
  StandardArrayPopHeader,
  StandardArrayPushHeader,
  StandardArrayRemoveHeader,
  StandardArrayTypeHeader
} from "../headers/ts2c-header-standard-array";
import { StandardAssertHeader } from "../headers/ts2c-header-standard-assert";
import { StandardBooleanHeader } from "../headers/ts2c-header-standard-boolean";
import { StandardDictCreateHeader } from "../headers/ts2c-header-standard-dict";
import { StandardInt16Header } from "../headers/ts2c-header-standard-int16_t";
import { StandardStdIoHeader } from "../headers/ts2c-header-standard-stdio";
import { StandardStdLibHeader } from "../headers/ts2c-header-standard-stdlib";
import { StandardStringHeader } from "../headers/ts2c-header-standard-string";
import { StandardUint8Header } from "../headers/ts2c-header-standard-uint8_t";

import { ConsoleLogPlugin } from "../plugins/ts2c-plugin-standard-console";

import { Plugin } from "../core/plugin";
import { Preset } from "../core/preset";

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
      new StandardStdLibHeader()
    ];
  }

  public getPlugins(): Plugin[] {
    return [new ConsoleLogPlugin()];
  }

  public getPresets() {
    return [];
  }
}

export default StandardPreset;
