import { INativeExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderRegistry, HeaderType } from "nativejs-compiler";
import { Main, MainRegistry } from "nativejs-compiler";
import { Bottom, BottomRegistry } from "nativejs-compiler";
import { Timer1OverflowBottom } from "../bottoms/bottom-timer1-overflow";
import { MillisMain } from "../mains/main-millis";
import { InterruptHeaderType } from "./interrupt";
import { IOHeaderType } from "./io";

export class MillisHeaderType implements HeaderType {
  public NAME: string = "MillisHeaderType";
  public UNIQUE: boolean = true;
}

export class MillisHeader implements Header {
  public getType() {
    return MillisHeaderType;
  }

  public getTemplate(): INativeExpression {
    HeaderRegistry.declareDependency(IOHeaderType);
    HeaderRegistry.declareDependency(InterruptHeaderType);
    MainRegistry.declareDependency(MillisMain);
    BottomRegistry.declareDependency(Timer1OverflowBottom);

    Timer1OverflowBottom.statements.push("timer1_millis++;");

    return new Template();
  }
}

@CodeTemplate(`
#include <util/atomic.h>
volatile unsigned long timer1_millis;
void init_millis(unsigned long f_cpu) {
  unsigned long ctc_match_overflow;
  ctc_match_overflow = ((f_cpu / 1000) / 8); //when timer1 is this value, 1ms has passed
  // (Set timer to clear when matching ctc_match_overflow) | (Set clock divisor to 8)
  TCCR1B |= (1 << WGM12) | (1 << CS11);
  // high byte first, then low byte
  OCR1AH = (ctc_match_overflow >> 8);
  OCR1AL = ctc_match_overflow;
  // Enable the compare match interrupt
  TIMSK1 |= (1 << OCIE1A);
  sei();
}
unsigned long millis() {
  unsigned long millis_return;
  // Ensure this cannot be disrupted
  ATOMIC_BLOCK(ATOMIC_FORCEON) {
    millis_return = timer1_millis;
  }
  return millis_return;
}
`)
class Template {}
