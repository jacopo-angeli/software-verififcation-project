import { AbstractValue } from "../../../../model/types/abstract_value";

export class Interval extends AbstractValue {
    constructor(
        private _lower: number,
        private _upper: number,
        private _meta: { m: number, n: number }
    ) { super(); };

    public get lower(): number {
        return this._lower;
    }

    public get upper(): number {
        return this._upper;
    }
    public toString() {
        return `[${this._lower === this._meta.m ? "-∞" : this._lower}, ${this._upper === this._meta.n ? "+∞" : this._upper}]`;
    }
}

export class Bottom extends Interval{
    constructor(
        _lower: number,
        _upper: number,
        _meta: { m: number, n: number }
    ) { super(_lower, _upper, _meta); };
    public toString() {
        return "⊥ : " + super.toString();
    }
}
export class Top extends Interval{
    constructor(
        _lower: number,
        _upper: number,
        _meta: { m: number, n: number }
    ) { super(_lower, _upper, _meta); };
    public toString() {
        return "T : " + super.toString();
    }
}