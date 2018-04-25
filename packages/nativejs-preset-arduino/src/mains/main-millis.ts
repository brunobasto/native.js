import { CodeTemplate } from "nativejs-compiler";
import { Main } from "nativejs-compiler";

export class MillisMain implements Main {
  public getTemplate() {
    return new MainTemplate();
  }
}

@CodeTemplate(`init_millis(F_CPU);`)
class MainTemplate {}
