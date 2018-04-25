import { INativeExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderRegistry, HeaderType } from "nativejs-compiler";
import { Bottom, BottomRegistry } from "nativejs-compiler";

export class Timer0OverflowBottom implements Bottom {
  public static statements = [];

  public getTemplate() {
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
