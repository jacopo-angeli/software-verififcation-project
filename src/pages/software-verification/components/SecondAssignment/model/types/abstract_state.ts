import { AbstractValue } from "./abstract_value";

export class AbstractProgramState<T extends AbstractValue> {
    constructor(
        protected _state: Map<string, T> = new Map<string, T>()
    ) { }

    update(key: string, value: T): AbstractProgramState<T> {
        if (!this._state.has(key)) throw Error(`State update: ${key} not present in current state : ${this._state.toString()}.`);
        return this.copy({ v: key, int: value });
    };

    lookup(v: string): T {
        if (this._state.has(v)) return (this._state.get(v) as T);
        throw Error(`State lookup: ${v} not present in current state : ${this._state.toString()}.`)
    };

    toString(): string {
        if (this._state.size === 0) return "{ }";
        if (this.isBottom()) return `⊥ : { ${this._state.keys().map((k) => { return `${k} : ${this.lookup(k).toString()}`; }).toArray().join(", ")} }`;
        if (this.isTop()) return `T : { ${this._state.keys().map((k) => { return `${k} : ${this.lookup(k).toString()}`; }).toArray().join(", ")} }`;
        return `{ ${this._state.keys().map((k) => { return `${k} : ${this.lookup(k).toString()}`; }).toArray().join(", ")} }`;
    };

    isBottom(): boolean { return this._state.keys().reduce((acc, k) => { return acc || (this._state.get(k) as T).isBottom() }, false); }
    isTop(): boolean { return this._state.keys().reduce((acc, k) => { return acc && (this._state.get(k) as T).isTop() }, true); }

    
    variables(): Array<string> {
        return Array.from(this._state.keys());
    };

    // ---------------------------------------------------------------------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------------------------------------------------------------------

    private copy(wwhit?: { v: string, int: T }): AbstractProgramState<T> {
        var ret = new Map<string, T>();
        this._state.forEach((value, key) => {
            if (wwhit && key === wwhit.v) ret.set(key, wwhit.int);
            else ret.set(key, value);
        });
        return this.constructor(ret);
    };
}
