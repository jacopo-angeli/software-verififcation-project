import { PowerSet_I } from "../../../../model/types/power_set";

export class Set implements PowerSet_I {
    constructor(
        private _l: number,
        private _u: number,
    ) { }
    public get l() { return this._l };
    public get u () { return this._u };
    toString() { return `{x ∈ I: ${this._l} ≤ x ≤ ${this._u}}` };
}
export class EmptySet extends Set {
    toString() { return "∅" };
    constructor() {
        super(NaN, NaN);
    }
};