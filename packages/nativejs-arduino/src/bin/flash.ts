#!/usr/bin/env node

const fs = require("fs");
const Serialport = require("serialport");

import { flash } from "../tools/flash";

const yargs = require("yargs")
  .usage("Usage: nativejs-arduino [options] <fileName>")
  .alias("t", "tail")
  .describe("tail", "Tails serial communiction after flash")
  .alias("b", "baud")
  .describe("baud", "Baud rate to use for serial communication")
  .alias("p", "port")
  .describe("port", "The port to use for serial communication")
  .alias("v", "version")
  .describe("version", "Prints current version")
  .help("h")
  .epilog("Copyright 2018")
  .version(true, require("../../package").version);

if (yargs.argv._.length === 0) {
  yargs.showHelp();
  process.exit();
}

let fileName = yargs.argv._[0];
const source = fs.readFileSync(fileName);

flash(source.toString("utf8"), ({ connection }) => {
  console.log("Done flashing.");
  if (yargs.argv["tail"]) {
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
        serialPort.update({ baudRate: yargs.argv["baud"] }, () => {
          listen();
          serialPort.on("readable", () => serialPort.read());
        });
      });
    };
    serialPort.close(() => open());
  }
});
