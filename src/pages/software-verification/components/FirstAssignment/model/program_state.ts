import { InterpretationError } from "../../../model/errors";

export class ProgramState {
  state: Map<string, number> = new Map<string, number>();

  set(key: string, value: number, f: boolean = false): void {
    if (this.state.has(key) || f) {
      this.state.set(key, value);
    } else {
      throw new InterpretationError(
        `Variable ${key} not present in initial state.`,
      );
    }
  }

  contains(variable: string): boolean { return this.state.has(variable) };

  size(): number { return this.state.size };

  get(key: string): number {
    if (this.state.has(key)) {
      return this.state.get(key) as number;
    }
    throw new InterpretationError(`${key} is not present in initialState`);
  }

  toString(): string {
    if (this.state.size === 0) return "[ ⊥ ]";
    let ret: string = "[ ";
    let i: number = 0;
    this.state.forEach((value, key) => {
      ret += `${key} : ${value}`;
      i++;
      if (i < this.state.size) ret += ",";
    })
    ret += " ]";
    return ret;
  }

  copyWith(key: string, value: number): ProgramState {
    var ret: ProgramState = new ProgramState();
    this.state.forEach((value, key) => {
      ret.set(key, value, true);
    });
    ret.set(key, value, true);
    return ret;
  }

  copy(): ProgramState {
    var ret: ProgramState = new ProgramState();
    this.state.forEach((value, key) => {
      ret.set(key, value, true);
    });
    return ret;
  }
}