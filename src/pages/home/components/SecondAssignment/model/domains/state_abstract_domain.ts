import { AbstractProgramState } from "../types/abstract_state";
import { AbstractValue } from "../types/abstract_value";
import { NumericalAbstractDomain } from "./numerical_abstract_domain";

export class StateAbstractDomain<T extends AbstractValue> {

    constructor(protected _NumericalAbstractDomain: NumericalAbstractDomain<T>) { }

    public leq(X: AbstractProgramState<T>, Y: AbstractProgramState<T>): boolean {
        // * A possible improvement could be defining a sort of global instance V   *
        // * where to put all the program variable. Maybe merging the initial state *
        // * input into the program input where every status update is a sort of    *
        // * variable instantiation.                                                *
        // * The implementation soundness depends, since every variable in X are in *
        // * V, on the underlying operator leq' one                                 *
        return X.isBottom() ||
            (
                !X.isBottom() &&
                !Y.isBottom() &&
                X.variables().reduce((acc, x) => {
                    return acc && (!Y.variables().includes(x) || (Y.variables().includes(x) && this._NumericalAbstractDomain.leq(X.lookup(x), Y.lookup(x))));
                }, true)
            );
    }

    public eq(X: AbstractProgramState<T>, Y: AbstractProgramState<T>): boolean {
        return this.leq(X, Y) && this.leq(Y, X);
    }

    public widening(X: AbstractProgramState<T>, Y: AbstractProgramState<T>): AbstractProgramState<T> {
        if (X.isBottom()) return Y;
        if (Y.isBottom()) return X;
        return this.merge(X, Y, (x, y) => x && y ? this._NumericalAbstractDomain.widening(x, y) as T : (x ?? y)!);
    }

    public narrowing(X: AbstractProgramState<T>, Y: AbstractProgramState<T>): AbstractProgramState<T> {
        if (X.isBottom()) return Y;
        if (Y.isBottom()) return X;
        let ret = this.merge(X, Y, (x, y) => x && y ? this._NumericalAbstractDomain.narrowing(x, y) as T : (x ?? y)!);
        return ret
    }    

    public SetOperators = {
        union: (X: AbstractProgramState<T>, Y: AbstractProgramState<T>) => {
            if (X.isBottom()) return Y;
            if (Y.isBottom()) return X;
            return this.merge(X, Y, (x, y) => x && y ? this._NumericalAbstractDomain.SetOperators.union(x, y) as T : (x ?? y)!);
        },
        intersection: (X: AbstractProgramState<T>, Y: AbstractProgramState<T>) => {
            if (X.isBottom()) return Y;
            if (Y.isBottom()) return X;
            return this.merge(X, Y, (x, y) => x && y ? this._NumericalAbstractDomain.SetOperators.intersection(x, y) as T : (x ?? y)!);
        }
    }

    private merge(X: AbstractProgramState<T>, Y: AbstractProgramState<T>, mergeFn: (x: T | null, y: T | null) => T): AbstractProgramState<T> {
        const mappedState = new Map<string, T>();

        new Set([...X.variables(), ...Y.variables()]).forEach(variable => {
            const newValue = mergeFn(
                X.variables().includes(variable) ? X.lookup(variable) : null,
                Y.variables().includes(variable) ? Y.lookup(variable) : null
            );
            mappedState.set(variable, newValue);
        });

        return new AbstractProgramState<T>(mappedState);
    }
}