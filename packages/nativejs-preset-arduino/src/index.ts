import { Plugin, Preset } from "nativejs-compiler";
import { StandardPreset } from "nativejs-preset-standard";
import {
  AdcHeader,
  ArduinoHeader,
  Int16Header,
  InterruptHeader,
  IOHeader,
  MillisHeader,
  Timer0Header,
  UARTHeader
} from "./headers";
import { AnalogReadPlugin } from "./plugins/analog";
import { ArduinoPlugin } from "./plugins/arduino";
import {
  SerialConsoleLogPlugin,
  SerialConsoleReadPlugin
} from "./plugins/console";
import { DigitalWritePlugin } from "./plugins/digital";
import { MillisPlugin } from "./plugins/millis";
import { SetIntervalPlugin } from "./plugins/setInterval";
import { Timer0Plugin } from "./plugins/timer0";

export class ArduinoPreset extends StandardPreset {
  public getBlacklist() {
    return [""];
  }
  public getPlugins(): Plugin[] {
    const plugins = super.getPlugins();
    plugins.push(new ArduinoPlugin());
    plugins.push(new AnalogReadPlugin());
    plugins.push(new SerialConsoleLogPlugin());
    plugins.push(new DigitalWritePlugin());
    plugins.push(new MillisPlugin());
    plugins.push(new SetIntervalPlugin());
    plugins.push(new Timer0Plugin());
    plugins.push(new SerialConsoleReadPlugin());
    return plugins;
  }

  public getHeaders() {
    const headers = super.getHeaders();
    headers.push(new ArduinoHeader());
    headers.push(new AdcHeader());
    headers.push(new IOHeader());
    headers.push(new UARTHeader());
    headers.push(new Int16Header());
    headers.push(new MillisHeader());
    headers.push(new Timer0Header());
    headers.push(new InterruptHeader());
    return headers;
  }
}

export default ArduinoPreset;
