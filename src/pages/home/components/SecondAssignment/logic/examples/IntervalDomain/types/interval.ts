import { AbstractValue, BottomValue, TopValue } from "../../../../model/types/abstract_value";

export class Interval extends AbstractValue {
    
    isTop(): boolean {
        return this._lower === this._meta.m && this._upper === this._meta.n;
    }
    isBottom(): boolean {
        return isNaN(this._lower) && isNaN(this._upper);
    }
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
        if (this._lower === this._meta.m && this._upper === this._meta.n) return "T";
        const l = this._lower === this._meta.m ? "m" : this._lower === this._meta.n ? "n" : this._lower;
        const u = this._upper === this._meta.m ? "m" : this._upper === this._meta.n ? "n" : this._upper;
        return `[${l}, ${u}]`;
    }
}

export class Bottom extends Interval {
    constructor(){
        super(NaN, NaN, {m: Number.NaN, n: Number.NaN})
    }
    public toString() {
        return "⊥";
    }
}