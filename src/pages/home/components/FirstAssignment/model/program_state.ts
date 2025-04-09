import { InterpretationError } from "../../../model/errors";

export class ProgramState {
  state: Map<string, number> = new Map<string, number>();

  set(key: string, value: number, f: boolean = false): void {
    if (this.state.has(key) || f) {
      this.state.set(key, value);
    } else {
      throw new InterpretationError(
        `Runtime error: variable update failed (${key} not in the program state).`,
      );
    }
  }

  contains(variable: string): boolean { return this.state.has(variable) };

  size(): number { return this.state.size };

  get(key: string): number {
    if (this.state.has(key)) {
      return this.state.get(key) as number;
    }
    throw new InterpretationError(`Runtime error: variable lookup failed (${key} not in the program state).`);
  }

  toString(): string {
    if (this.state.size === 0) return "[ ]";
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

  eq(other: ProgramState): boolean {
    if (this.size() !== other.size()) return false;
    let keys = Array.from(this.state.keys());
    for (let i = 0; i < this.size(); i++) {
      if (!(other.contains(keys[i]))) return false;
      if (other.get(keys[i]) !== this.get(keys[i])) return false;
    }
    return true;
  }
}