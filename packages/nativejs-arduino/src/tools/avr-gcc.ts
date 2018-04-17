import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import debug from "debug";
import { exec } from "child_process";
import { fileSync, tmpNameSync } from "tmp";

const log = debug("avr-gcc");

const BAUD = 115200;
const F_CPU = 16000000;
const MCU = "atmega168";

const GCC = "avr-gcc";
const OBJCOPY = "avr-objcopy";

// 1. Compile with
// avr-gcc -std=gnu99 -DF_CPU=16000000 -DBAUD=115200 -funsigned-char -funsigned-bitfields -fpack-struct -fshort-enums -ffunction-sections -fdata-sections -mmcu=atmega168 -Os -lm -lprintf_flt -Wl,-u,vfprintf -Wl,-Map=main.map firmware/src/main.c -o main.elf
// 2. avr-strip main.elf
// 3. avr-objcopy -R .eeprom -O ihex "main.elf" "main.hex"

const generateObject = (source, callback) => {
  const sourceTempFile = fileSync({
    postfix: ".c"
  });
  let sourceFileName = sourceTempFile.name;
  fs.writeFile(sourceFileName, source, () => {
    log("compiling file", sourceFileName);
    const template = path.join(os.tmpdir(), "tmp-XXXXXX");
    const objectTempFile = fileSync();
    const CFLAGS = [
      `-DBAUD=${BAUD}`,
      `-DF_CPU=${F_CPU}`,
      `-mmcu=${MCU}`,
      "-std=gnu99",
      "-fdata-sections",
      "-ffunction-sections",
      "-fpack-struct",
      "-fshort-enums",
      "-funsigned-bitfields",
      "-funsigned-char",
      "-lm",
      "-lprintf_flt",
      "-Os",
      `-Wl,-Map=${objectTempFile.name}.map`,
      "-Wl,-u,vfprintf"
    ];
    exec(
      `${GCC} ${CFLAGS.join(" ")} ${sourceFileName} -o ${
        objectTempFile.name
      }.elf`,
      (error, stdout, stderr) => {
        if (error) {
          throw error;
        }
        const gccOut = stdout.toString();
        if (gccOut) {
          console.log(gccOut);
        }
        const gccErrors = stderr.toString();
        if (gccErrors) {
          console.error(gccErrors);
        }
        callback(`${objectTempFile.name}.elf`);
      }
    );
  });
};

const generateHex = (objectFileName, callback) => {
  log("generating hex for", objectFileName);
  const template = path.join(os.tmpdir(), "tmp-XXXXXX");
  const hexTempFile = fileSync({ postfix: ".elf" });
  const args = [
    "-R .eeprom",
    `-O ihex "${objectFileName}"`,
    `"${hexTempFile.name}"`
  ];
  exec(`${OBJCOPY} ${args.join(" ")}`, (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
    const gccWarns = stdout.toString();
    if (gccWarns) {
      console.log(gccWarns);
    }
    const gccErrors = stderr.toString();
    if (gccErrors) {
      throw new Error(gccErrors);
    }
    callback(hexTempFile.name);
  });
};

const gcc = (source, callback) => {
  generateObject(source, obj => generateHex(obj, callback));
};

export { gcc };
