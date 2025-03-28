import { Interval } from "./interval";
import { Set } from "./set";

export class IntervalFactory {
    public get meta(): { m: number; n: number; } {
        return this._meta;
    }
    public set meta(value: { m: number; n: number; }) {
        this._meta = value;
    }
    /*-----------------------------------------------------------
    To keep interval operation 
    -----------------------------------------------------------*/

    constructor(
        private _meta: { m: number; n: number; },
    ) { }

    public new(l: number, u: number): Interval {
        if (l > u) throw Error(`Interval creation: invalid bounds [${l}, ${u}]`);
        return new Interval(Math.max(...[this._meta.m, l]), Math.min(...[this._meta.n, u]), this._meta);
    }

    public get Top(): Interval { return this.new(this._meta.m, this._meta.n); }
    public get Bottom(): Interval { return this.new(Number.NaN, Number.NaN); }

    public getLessThan(max: number) {
        return this.new(this._meta.m, max - 1);
    }
    public getLessThanOrEqual(max: number) {
        return this.new(this._meta.m, max);
    }
    public getMoreThan(min: number) {
        return this.new(min + 1, this._meta.n);
    }
    public getMoreThanOrEqual(min: number) {
        return this.new(min, this._meta.n);
    }

    public intersect(i1: Interval, i2: Interval): Interval {
        const lower = Math.max(i1.lower, i2.lower);
        const upper = Math.min(i1.upper, i2.upper);
        return this.new(lower, upper);

    }
    public union(i1: Interval, i2: Interval): Interval {
        const lower = Math.min(i1.lower, i2.lower);
        const upper = Math.max(i1.upper, i2.upper);
        return this.new(lower, upper);
    }
    public fromSet(x: Set): Interval {
        return this.new(x.l, x.u)
    }
}