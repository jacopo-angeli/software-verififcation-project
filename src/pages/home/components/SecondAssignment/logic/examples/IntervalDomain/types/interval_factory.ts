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

    private clamp(n: number): number {
        if (n <= this._meta.m)
            return this._meta.m;
        else if (n >= this._meta.n)
            return this._meta.n;
        else
            return n;
    }

    public new(l: number, u: number): Interval {
        if (l > u) throw Error(`Interval creation: invalid bounds [${l}, ${u}]`);
        if (l === this._meta.m && u === this._meta.n) return this.Top;
        return new Interval(this.clamp(l), this.clamp(u), this._meta);
    }

    public get Top(): Interval { return new Interval(this._meta.m, this._meta.n, this._meta); }
    public get Bottom(): Interval { return new Interval(Number.NaN, Number.NaN, this._meta); }

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
        if (i1.isBottom() || i2.isBottom()) return this.Bottom;
        const l = Math.max(i1.lower, i2.lower);
        const u = Math.min(i1.upper, i2.upper);
        if (l <= u) return this.new(l, u);
        else return this.Bottom;
    }
    public union(i1: Interval, i2: Interval): Interval {
        const l = Math.min(i1.lower, i2.lower);
        const u = Math.max(i1.upper, i2.upper);
        return this.new(l, u);
    }
    public Operators = {
        negate: (x: Interval): Interval => {
            return this.new(-x.upper, -x.lower)
        },
        add: (x: Interval, y: Interval): Interval => {
            if (x.isBottom() || y.isBottom()) return this.Bottom;
            const l = x.lower + y.lower;
            const u = x.upper + y.upper;
            return this.new(l, u);
        },
        subtract: (x: Interval, y: Interval): Interval => {
            if (x.isBottom() || y.isBottom()) return this.Bottom;
            const l = x.lower - y.upper;
            const u = x.upper - y.lower;
            return this.new(l, u);
        },
        multiply: (x: Interval, y: Interval): Interval => {
            if (x.isBottom() || y.isBottom()) return this.Bottom;
            const products: Array<number> = [
                x.lower * y.lower, x.lower * y.upper,
                x.upper * y.lower, x.upper * y.upper
            ];
            return this.new(Math.min(...products), Math.max(...products));
        },
        divide: (x: Interval, y: Interval): Interval => {
            if (x.isBottom() || y.isBottom()) return this.Bottom;
            if (1 <= y.lower) {
                const l = Math.min(x.lower / y.lower, x.lower / y.upper);
                const u = Math.max(x.upper / y.lower, x.upper / y.upper)
                return this.new(l, u);
            } else if (y.upper <= -1) {
                const l = Math.min(x.upper / y.lower, x.upper / y.upper);
                const u = Math.max(x.lower / y.lower, x.lower / y.upper);
                return this.new(l, u);
            } return this.union(
                this.Operators.divide(x, this.intersect(y, this.getMoreThan(0))),
                this.Operators.divide(x, this.intersect(y, this.getLessThan(0)))
            )
        }
    };

    public fromSet(x: Set): Interval {
        return this.new(x.l, x.u)
    }
}