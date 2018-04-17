import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderType, HeaderRegistry } from "nativejs-compiler";
import { MainRegistry, Main } from "nativejs-compiler";
import { BottomRegistry, Bottom } from "nativejs-compiler";
import { IOHeaderType } from "./io";
import { InterruptHeaderType } from "./interrupt";
import { Timer1OverflowBottom } from "../bottoms/bottom-timer1-overflow";
import { MillisMain } from "../mains/main-millis";

export class MillisHeaderType implements HeaderType {
  NAME: string = "MillisHeaderType";
  UNIQUE: boolean = true;
}

export class MillisHeader implements Header {
  getType() {
    return MillisHeaderType;
  }

  getTemplate(): CExpression {
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
