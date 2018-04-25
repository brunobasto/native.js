import { expect, use } from "chai";
import "mocha";
import { assertStringResult } from "../../utils/assert";
import { evaluator } from "../../utils/evaluator";

describe("Array Iterators", () => {
  describe("forEach", () => {
    it("should summ all elements in an Array", done => {
      const expression = `
        const array = [5, 10, 15, 20];
        let result = 0;
        array.forEach(item => {
          result += item;
        });
      `;
      assertStringResult(expression, done);
    });
  });
});
