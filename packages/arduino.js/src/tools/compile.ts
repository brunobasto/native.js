import * as fs from "fs";
import * as request from "request";
import debug from "debug";
import { exec } from "child_process";

const log = debug("cloud-gcc");

const endpoint = process.env["DEBUG"]
  ? "http://localhost:3000/"
  : "https://gcc-avr.wedeploy.io/";

const compile = (fileName, options, callback) => {
  const r = request.post(endpoint, (err, response) => {
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
