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

const chalkAnimation = require("chalk-animation");

const tempFileTemplate = path.join(os.tmpdir(), "tmp-XXXXXX");

const yargs = require("yargs")
  .usage("Usage: nativejs-arduino [options] <fileName>")
  .alias("b", "baud")
  .alias("f", "flash")
  .alias("o", "output")
  .alias("p", "port")
  .alias("t", "tail")
  .alias("v", "version")
  .describe("baud", "Baud rate to use for serial communication.")
  .describe("board", "The arduino board you want to target.")
  .describe("upload-baud", "The baud rate to use for programming your chip.")
  .describe("f_cpu", "The frequency your chip will be running at.")
  .describe("mcu", "The target chip name.")
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

const logPrefix = "[arduino.js]";

let fileName = yargs.argv._[0];
const source = fs.readFileSync(fileName);

const tailConnection = (connection, baudRate) => {
  console.log(logPrefix, "Openning serial communication...");
  const { serialPort } = connection;
  const listen = () => {
    console.log(logPrefix, "Ready");
    process.stdin.on("data", chunk => {
      setTimeout(() => serialPort.write(chunk), 100);
    });
    serialPort.on("data", data => console.log(data.toString("utf8")));
  };
  const open = () => {
    serialPort.open(error => {
      if (error) {
        console.error(logPrefix, "Error openning serial communication:", error);
      }
      serialPort.update({ baudRate }, () => {
        listen();
        serialPort.on("readable", () => serialPort.read());
      });
    });
  };
  serialPort.close(() => open());
};

const displayLoading = text => {
  const animation = chalkAnimation.karaoke(text);
  const interval = setInterval(() => {
    animation.replace((text += "."));
  }, 1000);
  animation.start();
  return {
    stop: () => {
      animation.stop();
      clearInterval(interval);
    }
  };
};

transpile(source, cSource => {
  let cFileName = tmpNameSync({ tempFileTemplate });
  if (yargs.argv["output"]) {
    cFileName = yargs.argv["output"];
  }
  fs.writeFileSync(path.resolve(process.cwd(), cFileName), cSource);
  console.log(logPrefix, `${fileName} -> ${cFileName}`);
  if (yargs.argv["flash"]) {
    const compiling = displayLoading(logPrefix + " Compiling");
    let boardName = "uno";
    if (yargs.argv["board"]) {
      boardName = yargs.argv["board"];
    }

    let board = boards[boardName];
    if (yargs.argv["upload-baud"]) {
      board = {
        ...board,
        baud: yargs.argv["upload-baud"]
      };
    }

    const avrgirl = new Avrgirl({ board });

    const flash = (hex, callback) => {
      const f = avrgirl.flash(hex, function(error) {
        if (error) {
          callback(error);
        } else {
          callback(null, avrgirl);
        }
      });
    };

    const compileOptions = {
      BAUD: yargs.argv["baud"] || avrgirl.connection.board.baud,
      MCU: yargs.argv["mcu"] || "atmega168",
      F_CPU: yargs.argv["f_cpu"] || 16000000
    };

    compile(cFileName, compileOptions, hex => {
      compiling.stop();
      const flashing = displayLoading(logPrefix + " Flashing");
      const hexFileName = tmpNameSync({ tempFileTemplate });
      fs.writeFileSync(hexFileName, hex);
      flash(hexFileName, (error, response) => {
        flashing.stop();
        if (error) {
          console.log(
            logPrefix,
            "Sorry, there was an error trying to upload your sketch:"
          );
          console.log(logPrefix, error.message);
        } else {
          console.log(logPrefix, "Done flashing");
          if (yargs.argv["tail"]) {
            tailConnection(response.connection, compileOptions.BAUD);
          }
        }
      });
    });
  }
});
