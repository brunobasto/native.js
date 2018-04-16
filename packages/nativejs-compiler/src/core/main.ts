import { CExpression } from "../nodes/expressions";

const declaredMains = new Set<new () => Main>();

export interface Main {
  getTemplate(): CExpression;
}

export class MainRegistry {
  public static getDeclaredDependencies(): CExpression[] {
    return [...declaredMains].map(main => new main().getTemplate());
  }

  public static declareDependency(type: new () => Main) {
    declaredMains.add(type);
  }
}
