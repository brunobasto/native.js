import "mocha";
import { expect } from "chai";
import { evaluator } from "../../utils/evaluator";

describe("Numbers Expression Evaluator", () => {
  it("should be able to add two integers", done => {
    evaluator(
      `
  		const a = 3;
  		const b = 4;
  		console.log(a + b);
  	`,
      output => {
        expect(output).to.equal("7\n");
        done();
      }
    );
  });

  it("should be able to subtract two integers", done => {
    evaluator(
      `
  		const a = 3;
  		const b = 4;
  		console.log(a - b);
  	`,
      output => {
        expect(output).to.equal("-1\n");
        done();
      }
    );
  });
});
