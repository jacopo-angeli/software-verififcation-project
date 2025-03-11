import { Interval } from "../types/interval";

export class IntervalFactory{
    /*-----------------------------------------------------------
    To keep interval operation 
    -----------------------------------------------------------*/

    constructor(
        private min: number = Number.MIN_SAFE_INTEGER,
        private max: number = Number.MAX_SAFE_INTEGER
    ) { }

    public getInterval(l: number, u: number): Interval {
        if (l > u) throw Error(`Interval creation: invalid bounds [${l}, ${u}]`);
        return new Interval(Math.max(...[this.min, l]), Math.max(...[this.min, Math.min(...[this.max, u])]));
    }

    public isTop(i: Interval): boolean { return i.lower === this.min && i.upper === this.max };
    public isBottom(i: Interval): boolean { return isNaN(i.lower) && isNaN(i.upper) }

    public get Top(): Interval { return this.getInterval(this.min, this.max); }
    public get Bottom(): Interval { return this.getInterval(Number.NaN, Number.NaN); }

    public getLessThan(max: number) {
        return new Interval(this.min, max - 1);
    }
    public getLessThanOrEqual(max: number) {
        return new Interval(this.min, max);
    }
    public getMoreThan(min: number) {
        return new Interval(min + 1, this.max);
    }
    public getMoreThanOrEqual(min: number) {
        return new Interval(min, this.max);
    }

    public intersect(i1: Interval, i2: Interval): Interval {
        const lower = Math.max(i1.lower, i2.lower);
        const upper = Math.min(i1.upper, i2.upper);
        return new Interval(lower, upper);

    }
    public union(i1: Interval, i2: Interval): Interval {
        const lower = Math.min(i1.lower, i2.lower);
        const upper = Math.max(i1.upper, i2.upper);
        return new Interval(lower, upper);
    }
    public randomInterval(): Interval {
        const gen = [Math.random() * (this.max - this.min) + this.min, Math.random() * (this.max - this.min) + this.min].sort();
        return new Interval(gen[0], gen[1]);
    }
    public get getMax(): number { return this.max; }
    public get getMin(): number { return this.min; }
}