import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import debug from "debug";
import { exec } from "child_process";
import * as request from "request";

const log = debug("cloud-gcc");

const compile = (fileName, options, callback) => {
  const r = request.post("https://gcc-avr.wedeploy.io/", (err, response) => {
    if (err) {
      return console.error("upload failed:", err);
    }
    callback(response.body);
  });
  const form = r.form();
  form.append("BAUD", options.BAUD);
  form.append("F_CPU", options.F_CPU);
  form.append("MCU", options.MCU);
  form.append("sketch", fs.createReadStream(fileName));
};

export { compile };
