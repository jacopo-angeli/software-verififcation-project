import { Interval } from "../logic/IntDomain/interval_factory";

export class AbstractProgramState {
    constructor(
        private _state = new Map<string, Interval>(),
    ) { }
    
    public set(key: string, value: Interval, f: boolean = false): void {
        if (this._state.has(key) || f) {
            this._state.set(key, value);
        } else {
            throw new Error(
                `Runtime error: Abstract state update failed (${key} not present in current state : ${this._state.toString()}).`,
            );
        }
    }
    
    public get(v: string): Interval {
        if (this._state.has(v)) return (this._state.get(v) as Interval);
        else throw Error(`Runtime error: Abstract state lookup failed (${v} not present in current state : ${this._state.toString()})`);
    }
    
    toString(): string {
        if (this._state.size === 0) return "{ }";
        
        let ret: string = "{ ";
        let first: boolean = true;
        
        for(let key of this.variables()){
            let el = this.get(key);
            if(isNaN(el.lower) && isNaN(el.upper)) return "⊥";
            if (!first) {
                ret += ", ";
            }
            first = !first;
            ret += `${key} : ${el.toString()}`;
        }
        
        return ret += " }";
    }

    public copy(): AbstractProgramState {
        var ret: AbstractProgramState = new AbstractProgramState();
        this._state.forEach((value, key) => {
            ret.set(key, value, true);
        });
        return ret;
    }

    public copyWith(v: string, int: Interval) {
        var ret: AbstractProgramState = new AbstractProgramState();
        this._state.forEach((value, key) => {
            if (key === v) ret.set(key, int, true);
            else ret.set(key, value, true);
        });
        return ret;
    }

    public variables(): Array<string> {
        let ret: Array<string> = [];
        this._state.forEach((value, key) => {
            ret.push(key);
        });

        return ret;
    };

    public has(v: string): boolean {
        return this._state.has(v);
    }

    public isEmpty(): boolean { return this._state.size === 0 };

    static empty() { return new AbstractProgramState() };

    

    public isEqualTo(other: AbstractProgramState): boolean {
        let mine: Array<string> = this.variables();
        let others: Array<string> = other.variables();

        // Lenght check
        if (mine.length !== others.length) return false;

        // Equal lenght AND every var is in the other with same value --> elements are equal
        for (let v of mine) {
            if (!other.has(v)) return false;
            if (other.get(v).lower !== this.get(v).lower) return false;
            if (other.get(v).upper !== this.get(v).upper) return false;
        }
        return true;
    }

    public isBottom(): boolean { return this._state.size > 0 };

    public static createState(variables: { [key: string]: [number, number] }): AbstractProgramState {
        let state = new AbstractProgramState();
        Object.keys(variables).forEach(key => {
            state.set(key, new Interval(variables[key][0], variables[key][1]), true);
        });
        return state;
    }
}