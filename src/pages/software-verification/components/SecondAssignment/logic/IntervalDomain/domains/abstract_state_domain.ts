import { StateAbstractDomain } from "../../../model/domains/state_abstract_domain";
import { IntervalDomain } from "../../examples/IntervalDomain/Domains/interval_domain";
import { Interval } from "../../examples/IntervalDomain/types/interval";
import { IntervalAbstractProgramState } from "../types/state";


export class IntervalAbstractStateDomain extends StateAbstractDomain<Interval> {
    private _IntervalDomain = this._NumericalAbstractDomain as IntervalDomain;
    public equal(x: IntervalAbstractProgramState, y: IntervalAbstractProgramState): boolean {
        let xVar: Array<string> = x.variables();
        let yVar: Array<string> = y.variables();
        if (xVar.length !== yVar.length) return false;
        for (let v of xVar) {
            if (y.lookup(v).lower !== x.lookup(v).lower) return false;
            if (y.lookup(v).upper !== x.lookup(v).upper) return false;
        }
        return true;
    }
    public lub(x: IntervalAbstractProgramState, y: IntervalAbstractProgramState): IntervalAbstractProgramState {
        let states = [x, y];

        const lubState = new Map<string, Interval>();
        const allKeys = new Set<string>();

        // Collect all keys
        states.forEach(state => {
            for (var v of state.variables()) {
                allKeys.add(v);
            }
        });

        // Compute the lub for each key
        allKeys.forEach(key => {
            let lub: Interval | null = null;
            states.forEach(state => {
                if (state.has(key)) {
                    const interval = state.lookup(key);
                    lub = lub === null ? interval : this._IntervalDomain.SetOperators.union(lub, interval);
                }
            });
            if (lub !== null) {
                lubState.set(key, lub as Interval); // Assuming lub is always an Interval
            }
        });


        return new IntervalAbstractProgramState(lubState);
    }
    public glb(x: IntervalAbstractProgramState, y: IntervalAbstractProgramState): IntervalAbstractProgramState {
        let states = [x, y];

        const glbState = new Map<string, Interval>();
        const allKeys = new Set<string>();

        // Collect all keys
        states.forEach(state => {
            for (var v of state.variables()) {
                allKeys.add(v);
            }
        });

        // Compute the glb for each key
        allKeys.forEach(key => {
            let glb: Interval | null = null;
            states.forEach(state => {
                if (state.has(key)) {
                    const interval = state.lookup(key) as Interval;
                    glb = glb === null ? interval : this._IntervalDomain.SetOperators.intersection(glb, interval);
                }
            });
            if (glb !== null) {
                glbState.set(key, glb as Interval); // Assuming glb is always an Interval
            }
        });

        return new IntervalAbstractProgramState(glbState);
    }
    public widening(x: IntervalAbstractProgramState, y: IntervalAbstractProgramState): IntervalAbstractProgramState {
        let widenedState = new Map<string, Interval>();

        // Process variables in the previous state (x)
        x.variables().forEach((variable) => {
            if (y.has(variable)) {
                // Get the intervals for the common variable
                let prevInterval = x.lookup(variable);
                let currentInterval = y.lookup(variable);
                // Apply the widening operator
                let widenedInterval = this._IntervalDomain.widening(prevInterval, currentInterval);
                // Set the widened interval in the new state
                widenedState.set(variable, widenedInterval);
            } else {
                // Keep the variable from x if it's not in y
                widenedState.set(variable, x.lookup(variable));
            }
        });

        // Process variables in the current state (y) that are not in x
        y.variables().forEach((variable) => {
            if (!x.has(variable)) {
                // Keep the variable from y if it's not in x
                widenedState.set(variable, y.lookup(variable));
            }
        });

        // Return the new widened state
        return new IntervalAbstractProgramState(widenedState);
    }
    public narrowing(x: IntervalAbstractProgramState, y: IntervalAbstractProgramState): IntervalAbstractProgramState {
        let narrowedState = new Map<string, Interval>();

        // Process variables in the previous state (x)
        x.variables().forEach((variable) => {
            if (y.has(variable)) {
                // Get the intervals for the common variable
                let prevInterval = x.lookup(variable);
                let currentInterval = y.lookup(variable);
                // Apply the narrowing operator
                let narrowedInterval = this._IntervalDomain.narrowing(prevInterval, currentInterval);
                // Set the narrowed interval in the new state
                narrowedState.set(variable, narrowedInterval);
            } else {
                // Keep the variable from x if it's not in y
                narrowedState.set(variable, x.lookup(variable));
            }
        });

        // Process variables in the current state (y) that are not in x
        y.variables().forEach((variable) => {
            if (!x.has(variable)) {
                // Keep the variable from y if it's not in x
                narrowedState.set(variable, y.lookup(variable));
            }
        });

        // Return the new narrowed state
        return new IntervalAbstractProgramState(narrowedState);
    }
    public toString(state: IntervalAbstractProgramState): string {
        throw new Error("Method not implemented.");
    }
    public copy(): IntervalAbstractProgramState {
        throw new Error("Method not implemented.");
    }
    public variables(): Array<string> {
        throw new Error("Method not implemented.");
    }

}