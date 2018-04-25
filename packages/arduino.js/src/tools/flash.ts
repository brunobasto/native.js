import * as Avrgirl from "avrgirl-arduino";
import * as boards from "avrgirl-arduino/boards";

const customUno = {
  ...boards.uno,
  baud: 19200
};

const flash = (hex, callback) => {
  let avrgirl = new Avrgirl({
    board: customUno
  });
  console.log(avrgirl);
  avrgirl.flash(hex, function(error) {
    if (error) {
      callback(error);
    } else {
      callback(null, avrgirl);
    }
  });
};

export { flash };
