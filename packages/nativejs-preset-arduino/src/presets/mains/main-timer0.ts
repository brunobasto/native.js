import { CodeTemplate } from "nativejs-compiler";
import { Main } from "nativejs-compiler";

export class Timer0Main implements Main {
  getTemplate() {
    return new MainTemplate();
  }
}

@CodeTemplate(`timer0_init();`)
class MainTemplate {}
