import { CExpression } from "nativejs-compiler";
import { CodeTemplate } from "nativejs-compiler";
import { Header, HeaderType, HeaderRegistry } from "nativejs-compiler";
import { MainRegistry, Main } from "nativejs-compiler";
import { IOHeaderType } from "./io";

export class AdcMainInitializer implements Main {
  getTemplate() {
    return new MainTemplate();
  }
}

export class AdcHeaderType implements HeaderType {
  NAME: string = "AdcHeaderType";
  UNIQUE: boolean = true;
}

export class AdcHeader implements Header {
  getType() {
    return AdcHeaderType;
  }

  getTemplate(): CExpression {
    HeaderRegistry.declareDependency(IOHeaderType);
    MainRegistry.declareDependency(AdcMainInitializer);

    return new Template();
  }
}

@CodeTemplate(`
int16_t ADCsingleREAD(uint8_t channel) {
  channel &= 0b00000111;
  ADMUX = (ADMUX & 0xF8)|channel;
  ADCSRA |= (1<<ADSC);
  while(ADCSRA & (1 << ADSC));
  return (ADC);
}
`)
class Template {}

@CodeTemplate(`
ADMUX = (1<<REFS0);
ADCSRA = (1<<ADEN)|(1<<ADPS2)|(1<<ADPS1)|(1<<ADPS0);
`)
class MainTemplate {}
