import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderType, HeaderRegistry } from "nativejs-compiler";
import { BottomRegistry, Bottom } from "nativejs-compiler";

export class Timer0OverflowBottom implements Bottom {
  static statements = [];

  getTemplate() {
    return new BottomTemplate();
  }
}

@CodeTemplate(`
ISR(TIMER0_COMPA_vect) {
  {statements {    }=> {this}}
}
`)
class BottomTemplate {
  private statements: any[];

  constructor() {
    this.statements = Timer0OverflowBottom.statements;
  }
}
