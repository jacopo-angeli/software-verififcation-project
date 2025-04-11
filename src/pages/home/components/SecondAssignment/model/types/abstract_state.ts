import { AbstractValue } from "./abstract_value";

export class AbstractProgramState<T extends AbstractValue> {
    constructor(
        protected _state: Map<string, T> = new Map<string, T>()
    ) { }

    update(key: string, value: T): AbstractProgramState<T> {
        if (!this._state.has(key)) throw Error(`State update: ${key} not present in current state : ${this._state.toString()}.`);
        return this.clone({ v: key, val: value });
    };

    lookup(v: string): T {
        if (this._state.has(v)) return (this._state.get(v) as T);
        throw Error(`State lookup: ${v} not present in current state : ${this._state.toString()}.`)
    };

    toString(): string {
        if (this._state.size === 0) return "{ }";
        if (this.isBottom()) return `⊥: {${Array.from(this._state.keys()).map((k) => { return `${k}: ${this.lookup(k).toString()}`; }).join("; ")}}`;
        if (this.isTop()) return `T: {${Array.from(this._state.keys()).map((k) => { return `${k}: ${this.lookup(k).toString()}`; }).join("; ")}}`;
        return `{${Array.from(this._state.keys()).map((k) => { return `${k}: ${this.lookup(k).toString()}`; }).join("; ")}}`;
    };

    isBottom(): boolean { return Array.from(this._state.keys()).reduce((acc, k) => { return acc || (this._state.get(k as string) as T).isBottom()}, false); }
    isTop(): boolean { return Array.from(this._state.keys()).reduce((acc, k) => { return acc && (this._state.get(k as string) as T).isTop()}, true); }
    toBottom(): AbstractProgramState<T>{
        let ret =  new Map<string, T>();
        Array.from(this._state.keys()).forEach(e => ret.set(e, this.lookup(e).toBottom() as T));
        return new AbstractProgramState<T>(ret);
    }
    toTop<T extends AbstractValue>(): AbstractProgramState<T>{
        let ret =  new Map<string, T>();
        Array.from(this._state.keys()).forEach(e => ret.set(e, this.lookup(e).toTop() as T));
        return new AbstractProgramState<T>(ret);
    }
    
    variables(): Array<string> {
        return Array.from(this._state.keys());
    };


    // ---------------------------------------------------------------------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------------------------------------------------------------------

    public clone(wwhit?: { v: string, val: T }): AbstractProgramState<T> {
        var ret = new Map<string, T>();
        this._state.forEach((value, key) => {
            if (wwhit && key === wwhit.v) ret.set(key, wwhit.val);
            else ret.set(key, value);
        });
        return new AbstractProgramState<T>(ret);
    };
}
