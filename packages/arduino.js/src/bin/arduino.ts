#!/usr/bin/env node

const fs = require("fs");
import * as path from "path";
const Serialport = require("serialport");
const os = require("os");

import { transpile } from "../tools/transpile";
import { compile } from "../tools/compile";
const { tmpNameSync } = require("tmp");

import * as Avrgirl from "avrgirl-arduino";
import * as boards from "avrgirl-arduino/boards";

const yargs = require("yargs")
  .usage("Usage: nativejs-arduino [options] <fileName>")
  .alias("b", "baud")
  .alias("f", "flash")
  .alias("o", "output")
  .alias("p", "port")
  .alias("t", "tail")
  .alias("v", "version")
  .describe("baud", "Baud rate to use for serial communication.")
  .describe(
    "f_cpu",
    "The CPU frequency your microcontroller will be running at."
  )
  .describe("mcu", "The target microcontroller.")
  .describe("flash", "Wether or not to upload to arduino after compile.")
  .describe("output", "Compiled output file name.")
  .describe("port", "The port to use for serial communication.")
  .describe("tail", "Tails serial communiction after flash.")
  .describe("version", "Prints current version.")
  .help("h")
  .epilog("Copyright 2018")
  .version(true, require("../../package").version);

if (yargs.argv._.length === 0) {
  yargs.showHelp();
  process.exit();
}

let fileName = yargs.argv._[0];
const source = fs.readFileSync(fileName);

const tailConnection = (connection, baudRate) => {
  console.log("Openning serial communication...");
  const { serialPort } = connection;
  const listen = () => {
    console.log("Ready");
    process.stdin.on("data", chunk => {
      setTimeout(() => serialPort.write(chunk), 100);
    });
    serialPort.on("data", data => console.log(data.toString("utf8")));
  };
  const open = () => {
    serialPort.open(error => {
      if (error) {
        console.log("Error openning serial communication:", error);
      }
      serialPort.update({ baudRate }, () => {
        listen();
        serialPort.on("readable", () => serialPort.read());
      });
    });
  };
  serialPort.close(() => open());
};

transpile(source, cSource => {
  const template = path.join(os.tmpdir(), "tmp-XXXXXX");
  let cFileName = tmpNameSync({ template });
  if (yargs.argv["output"]) {
    cFileName = yargs.argv["output"];
  }
  fs.writeFileSync(path.resolve(process.cwd(), cFileName), cSource);
  console.log(`${fileName} -> ${cFileName}`);
  if (yargs.argv["flash"]) {
    console.log("Compiling...");

    const customUno = {
      ...boards.uno,
      baud: 19200
    };

    var avrgirl = new Avrgirl({
      board: customUno
    });

    const flash = (hex, callback) => {
      avrgirl.flash(hex, function(error) {
        if (error) {
          callback(error);
        } else {
          callback(null, avrgirl);
        }
      });
    };

    const compileOptions = {
      BAUD: yargs.argv["baud"] || customUno.baud,
      MCU: yargs.argv["mcu"] || "atmega168",
      F_CPU: yargs.argv["f_cpu"] || 16000000
    };

    compile(cFileName, compileOptions, hex => {
      console.log("Done compiling");
      console.log("Flashing...");
      const template = path.join(os.tmpdir(), "tmp-XXXXXX");
      const hexFileName = tmpNameSync({ template });
      fs.writeFileSync(hexFileName, hex);
      flash(hexFileName, (error, { connection }) => {
        if (error) {
          console.log(
            "Sorry, there was an error trying to upload your sketch."
          );
          console.log(
            "Please make sure you have your Arduino device connected."
          );
        } else {
          console.log("Done flashing");
          if (yargs.argv["tail"]) {
            tailConnection(connection, compileOptions.BAUD);
          }
        }
      });
    });
  }
});
