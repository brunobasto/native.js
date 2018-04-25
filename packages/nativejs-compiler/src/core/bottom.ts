import { INativeExpression } from "../nodes/expressions";

const declaredBottoms = new Set<new () => Bottom>();

export interface Bottom {
  getTemplate(): INativeExpression;
}

export class BottomRegistry {
  public static getDeclaredDependencies(): Array<new () => Bottom> {
    return Array.from(declaredBottoms);
  }

  public static declareDependency(type: new () => Bottom) {
    declaredBottoms.add(type);
  }
}
