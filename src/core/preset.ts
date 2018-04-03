import { Header } from "./header";
import { Main } from "./main";
import { Plugin } from "./plugin";

export interface Preset {
	getHeaders(): Header[];
	getPlugins(): Plugin[];
	getPresets(): Preset[];
}