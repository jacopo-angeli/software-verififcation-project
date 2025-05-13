import { AbstractValue } from "../../../../model/types/abstract_value";

export class Interval extends AbstractValue {

    constructor(
        private _lower: number,
        private _upper: number,
        private _meta: { m: number, n: number }
    ) { super(); };

    get lower(): number {
        return this._lower;
    }

    get upper(): number {
        return this._upper;
    }
    toTop(): Interval {
        return new Interval(this._meta.m, this._meta.n, this._meta);
    }
    toBottom(): Interval {
        return new Interval(NaN, NaN, this._meta);
    }
    isTop(): boolean {
        return this._lower === this._meta.m && this._upper === this._meta.n;
    }
    isBottom(): boolean {
        if (isNaN(this._lower) || isNaN(this._upper))
            if (isNaN(this._lower) && isNaN(this._upper)) return true;
            else throw Error("Invalid interval.")
        return false;
    }
    toString() {
        if (this._lower === this._meta.m && this._upper === this._meta.n) return "T";
        if (isNaN(this._lower) && isNaN(this._upper)) return "⊥";
        const l = this._lower === this._meta.m ? "m" : this._lower === this._meta.n ? "n" : this._lower;
        const u = this._upper === this._meta.m ? "m" : this._upper === this._meta.n ? "n" : this._upper;
        return `[${l}, ${u}]`;
    }
}