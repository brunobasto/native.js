import "mocha";
import { assertArrayResult } from "../../utils/assert";

describe("Real World Application - Gray", () => {
  xit("should gray an image", done => {
    const expression = `
    function gray(imageSrc) {
      let imageDst = {
        data: [],
        height: imageSrc.height,
        width: imageSrc.width
      };
      for (let i = 0; i < imageSrc.data.length; i += 4)
        imageDst.data.push(
          ((imageSrc.data[i] * 299 +
            imageSrc.data[i + 1] * 587 +
            imageSrc.data[i + 2] * 114 +
            500) /
            1000) &
            0xff
        );
      return imageDst;
    }
    let colorImage = {
      height: 10,
      width: 1,
      data: [
        227,
        219,
        4,
        255,
        227,
        220,
        4,
        255,
        227,
        219,
        4,
        255,
        227,
        220,
        4,
        255,
        227,
        219,
        4,
        255,
        227,
        220,
        4,
        255,
        227,
        219,
        4,
        255,
        227,
        220,
        4,
        255,
        227,
        219,
        4,
        255,
        0,
        0,
        0,
        0
      ]
    };
    let grayImage = gray(colorImage);
    const result = grayImage.data;
    `;
    assertArrayResult(expression, done);
  });
});
