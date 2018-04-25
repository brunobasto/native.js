import {
  CodeTemplate,
  Header,
  HeaderRegistry,
  HeaderType,
  INativeExpression
} from "nativejs-compiler";
import { InterruptHeaderType } from "./interrupt";
import { IOHeaderType } from "./io";

export class Timer0HeaderType implements HeaderType {
  public NAME: string = "Timer0HeaderType";
  public UNIQUE: boolean = true;
}

export class Timer0Header implements Header {
  public getType() {
    return Timer0HeaderType;
  }

  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(InterruptHeaderType);
    HeaderRegistry.declareDependency(IOHeaderType);

    return new Template();
  }
}

/* tslint:disable:max-line-length */
@CodeTemplate(`
void timer0_init(int16_t value) {
  TIMSK0 = _BV(OCIE0A);  // Enable Interrupt TimerCounter0 Compare Match A (SIG_OUTPUT_COMPARE0A)
  TCCR0A |= (1 << COM0A1);
  // set none-inverting mode
  TCCR0A |= (1 << WGM01) | (1 << WGM00);
  // set fast PWM Mode
  TCCR0B |= (1 << CS01);
  // set prescaler to 8 and starts PWM
  OCR0A = value;          // 0.001024*244 ~= .25 SIG_OUTPUT_COMPARE0A will be triggered 4 times per second.
  sei();
}
`)
/* tslint:enable:max-line-length */
class Template {}
