import { AbstractProgramState } from "../../../model/types/abstract_state";

export class IntervalAbstractProgramState extends AbstractProgramState<Interval> {

    constructor(
        protected _state: Map<string, Interval> = new Map<string, Interval>()
    ) { super() }

    public update(key: string, value: Interval): IntervalAbstractProgramState {
        if (!this._state.has(key)) throw Error(`State update: ${key} not present in current state : ${this._state.toString()}.`);
        return this.copy({ v: key, int: value });
    }

    public lookup(v: string): Interval {
        if (this._state.has(v)) return (this._state.get(v) as Interval);
        throw Error(`State lookup: ${v} not present in current state : ${this._state.toString()}.`)
    }

    public toString(): string {
        if (this._state.size === 0) return "{ }";

        let ret: string = "{ ";
        let first: boolean = true;

        for (let key of this.variables()) {
            let el = this.lookup(key);
            if (isNaN(el.lower) && isNaN(el.upper)) return "⊥";
            if (!first) {
                ret += ", ";
            }
            first = !first;
            ret += `${key} : ${el.toString()}`;
        }

        return ret += " }";
    }

    public copy(change?: { v: string, int: Interval }): IntervalAbstractProgramState {
        var ret = new Map<string, Interval>();
        this._state.forEach((value, key) => {
            if (change && key === change.v) ret.set(key, change.int);
            else ret.set(key, value);
        });
        return new IntervalAbstractProgramState(ret);
    }

    public variables(): Array<string> {
        let ret: Array<string> = [];
        this._state.forEach((value, key) => {
            ret.push(key);
        });

        return ret;
    };

    public has(key: string): boolean {
        return this._state.has(key);
    }

}