import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderType, HeaderRegistry } from "nativejs-compiler";
import { IOHeaderType } from "./io";
import { InterruptHeaderType } from "./interrupt";

export class Timer0HeaderType implements HeaderType {
  NAME: string = "Timer0HeaderType";
  UNIQUE: boolean = true;
}

export class Timer0Header implements Header {
  getType() {
    return Timer0HeaderType;
  }

  getTemplate(): CExpression {
    HeaderRegistry.declareDependency(InterruptHeaderType);
    HeaderRegistry.declareDependency(IOHeaderType);

    return new Template();
  }
}

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
class Template {}
