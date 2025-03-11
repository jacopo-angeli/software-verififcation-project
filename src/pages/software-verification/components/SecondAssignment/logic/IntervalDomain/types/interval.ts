export class Interval {
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

    public get isBottom(): boolean{
        return isNaN(this._lower) && isNaN(this._upper);
    }

    public toString() {
        if (this.isBottom) return '⊥';
        return `[${this._lower === Number.MIN_SAFE_INTEGER ? "-∞" : this._lower}, ${this._upper === Number.MAX_SAFE_INTEGER ? "+∞" : this._upper}]`;
    }
}