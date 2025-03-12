import { AbstractValue } from "../../../model/types/abstract_value";

export class Interval extends AbstractValue {
    private _lower: number;
    private _upper: number;
    
    constructor(l: number, u: number) {
        this._lower = l;
        this._upper = u;
    };
    
    public get lower(): number {
        return this._lower;
    }
    
    public get upper(): number {
        return this._upper;
    }
    
    isBottom(): boolean{
        return isNaN(this._lower) && isNaN(this._upper);
    }
    isTop(): boolean {
        throw new Error("Method not implemented.");
    }

    public toString() {
        if (this.isBottom) return '⊥';
        return `[${this._lower === Number.MIN_SAFE_INTEGER ? "-∞" : this._lower}, ${this._upper === Number.MAX_SAFE_INTEGER ? "+∞" : this._upper}]`;
    }
}