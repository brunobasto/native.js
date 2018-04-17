import { IOHeaderType } from "./io";
import {
  Header,
  MainRegistry,
  Main,
  HeaderRegistry,
  HeaderType,
  StdioHeaderType,
  CodeTemplate,
  CExpression
} from "nativejs-compiler";

export class UARTHeaderType implements HeaderType {
  NAME: string = "UARTHeaderType";
  UNIQUE: boolean = true;
}

export class UARTMainInitializer implements Main {
  getTemplate() {
    return new MainTemplate();
  }
}

export class UARTHeader implements Header {
  getType() {
    return UARTHeaderType;
  }

  getTemplate(): CExpression {
    HeaderRegistry.declareDependency(IOHeaderType);
    HeaderRegistry.declareDependency(StdioHeaderType);
    MainRegistry.declareDependency(UARTMainInitializer);

    return new HeaderTemplate();
  }
}

@CodeTemplate(`
void uart_putchar(char c, FILE *stream);
char uart_getchar(FILE *stream);
void uart_init(void);
FILE uart_output = FDEV_SETUP_STREAM(uart_putchar, NULL, _FDEV_SETUP_WRITE);
FILE uart_input = FDEV_SETUP_STREAM(NULL, uart_getchar, _FDEV_SETUP_READ);
#include <util/setbaud.h>
void uart_init(void) {
    UBRR0H = UBRRH_VALUE;
    UBRR0L = UBRRL_VALUE;
#if USE_2X
    UCSR0A |= _BV(U2X0);
#else
    UCSR0A &= ~(_BV(U2X0));
#endif
    UCSR0C = _BV(UCSZ01) | _BV(UCSZ00); /* 8-bit data */
    UCSR0B = _BV(RXEN0) | _BV(TXEN0);   /* Enable RX and TX */
}
void uart_putchar(char c, FILE *stream) {
    if (c == '\\n') {
        uart_putchar('\\r', stream);
    }
    loop_until_bit_is_set(UCSR0A, UDRE0);
    UDR0 = c;
}
char uart_getchar(FILE *stream) {
    loop_until_bit_is_set(UCSR0A, RXC0);
    return UDR0;
}
`)
class HeaderTemplate {}

@CodeTemplate(`
uart_init();
stdout = &uart_output;
stdin  = &uart_input;
`)
class MainTemplate {}
