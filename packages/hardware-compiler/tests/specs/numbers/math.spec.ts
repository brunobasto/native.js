import "mocha";
import { expect } from "chai";
import { evaluator } from "../../utils/evaluator";

describe("Numbers Expression Evaluator", () => {
  it("should be able to add two integers", () => {
    const output = evaluator(`
  		const a = 3;
  		const b = 4;
  		console.log(a + b);
  	`);
    expect(output).to.equal("7\n");
  });

  it("should be able to subtract two integers", () => {
    const output = evaluator(`
  		const a = 3;
  		const b = 4;
  		console.log(a - b);
  	`);
    expect(output).to.equal("-1\n");
  });
});
