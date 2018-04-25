import { INativeExpression } from "../nodes/expressions";

const declaredMains = new Set<new () => Main>();

export interface Main {
  getTemplate(): INativeExpression;
}

export class MainRegistry {
  public static getDeclaredDependencies(): INativeExpression[] {
    return [...declaredMains].map(main => new main().getTemplate());
  }

  public static declareDependency(type: new () => Main) {
    declaredMains.add(type);
  }
}
