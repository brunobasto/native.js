import { Header } from "./header";
import { Main } from "./main";
import { Plugin } from "./PluginRegistry";

export interface Preset {
  getHeaders(): Header[];
  getPlugins(): Plugin[];
  getPresets(): Preset[];
}
