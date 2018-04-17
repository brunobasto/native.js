import * as Avrgirl from "avrgirl-arduino";
import * as boards from "avrgirl-arduino/boards";
import { compile } from "./compile";
import { gcc } from "./avr-gcc";

const customUno = {
  ...boards.uno,
  baud: 19200
};

const flash = (source, callback) => {
  compile(source, cSource => {
    gcc(cSource, hex => {
      var avrgirl = new Avrgirl({
        board: customUno
      });
      console.log("Flashing...");
      avrgirl.flash(hex, function(error) {
        if (error) {
          callback(error);
        } else {
          callback(avrgirl);
        }
      });
    });
  });
};

export { flash };
