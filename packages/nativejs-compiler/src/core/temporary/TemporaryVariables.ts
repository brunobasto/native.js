import * as ts from "typescript";
import { ScopeUtil } from "../scope/ScopeUtil";

export class TemporaryVariables {
  private temporaryVariables: { [scopeId: string]: string[] } = {};
  private iteratorVarNames = ["i", "j", "k", "l", "m", "n"];

  constructor(private typeChecker: ts.TypeChecker) {}
  /** Generate name for a new iterator variable and register it in temporaryVariables table.
   * Generated name is guarantied not to conflict with any existing names in specified scope.
   */
  public addNewIteratorVariable(scopeNode: ts.Node): string {
    let parentFunc = ScopeUtil.findParentFunction(scopeNode);
    let scopeId = (parentFunc && parentFunc.pos + 1) || "main";
    let existingSymbolNames = this.typeChecker
      .getSymbolsInScope(scopeNode, ts.SymbolFlags.Variable)
      .map(s => s.name);
    if (!this.temporaryVariables[scopeId])
      this.temporaryVariables[scopeId] = [];
    existingSymbolNames = existingSymbolNames.concat(
      this.temporaryVariables[scopeId]
    );
    let i = 0;
    while (
      i < this.iteratorVarNames.length &&
      existingSymbolNames.indexOf(this.iteratorVarNames[i]) > -1
    )
      i++;
    let iteratorVarName;
    if (i === this.iteratorVarNames.length) {
      i = 2;
      while (existingSymbolNames.indexOf("i_" + i) > -1) i++;
      iteratorVarName = "i_" + i;
    } else iteratorVarName = this.iteratorVarNames[i];

    this.temporaryVariables[scopeId].push(iteratorVarName);
    return iteratorVarName;
  }

  /** Generate name for a new temporary variable and register it in temporaryVariables table.
   * Generated name is guarantied not to conflict with any existing names in specified scope.
   */
  public addNewTemporaryVariable(
    scopeNode: ts.Node,
    proposedName: string
  ): string {
    let parentFunc = ScopeUtil.findParentFunction(scopeNode);
    let scopeId = (parentFunc && parentFunc.pos + 1) || "main";
    let existingSymbolNames =
      scopeNode === null
        ? []
        : this.typeChecker
            .getSymbolsInScope(scopeNode, ts.SymbolFlags.Variable)
            .map(s => s.name);
    if (!this.temporaryVariables[scopeId])
      this.temporaryVariables[scopeId] = [];
    existingSymbolNames = existingSymbolNames.concat(
      this.temporaryVariables[scopeId]
    );
    if (existingSymbolNames.indexOf(proposedName) > -1) {
      let i = 2;
      while (existingSymbolNames.indexOf(proposedName + "_" + i) > -1) i++;
      proposedName = proposedName + "_" + i;
    }

    this.temporaryVariables[scopeId].push(proposedName);
    return proposedName;
  }
}
