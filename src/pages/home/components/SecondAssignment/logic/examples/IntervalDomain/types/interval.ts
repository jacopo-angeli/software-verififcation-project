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
        if(this._lower === this._meta.m && this._upper === this._meta.n) return "T";
        const l =  this._lower === this._meta.m ? "m" : this._lower === this._meta.n ? "n" : this._lower;
        const u =  this._upper === this._meta.m ? "m" : this._upper === this._meta.n ? "n" : this._upper;
        return `[${l}, ${u}]`;
    }
}

export class Bottom extends Interval {
    public toString() {
        return "⊥";
    }
}
export class Top extends Interval {
    constructor(
        meta: { m: number, n: number }
    ) { super(meta.m, meta.n, meta); };
    public toString() {
        return "T";
    }
}