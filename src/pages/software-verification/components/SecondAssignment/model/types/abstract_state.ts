import { AbstractValue } from "./abstract_value";

export abstract class AbstractProgramState<T extends AbstractValue> {

    constructor(
        protected _state: Map<string, T> = new Map<string, T>()
    ) { }

    /**
     * Updates the value of a specific variable in the current state.
     * 
     * This method updates the state by assigning a new value to the variable
     * identified by `key`. After updating the variable, a new instance of the state
     * (with the updated value) is returned to ensure immutability.
     * 
     * @param key - The key (or name) of the variable to update.
     * @param value - The new value to assign to the variable.
     * 
     * @returns A new `AbstractProgramState<T>` instance with the updated state.
     */
    public abstract update(key: string, value: T): AbstractProgramState<T>;

    /**
     * Retrieves the value of a specific variable from the state.
     * 
     * This method looks up the value of the variable identified by `v` in the current state.
     * If the variable does not exist in the state, a default or random value of type `T` 
     * may be returned based on the implementation.
     * 
     * @param v - The key (or name) of the variable to look up.
     * 
     * @returns The value of the variable if it exists in the state, otherwise a default or random value.
     */
    public abstract lookup(v: string): T;

    /**
     * Returns a string representation of the current state.
     * 
     * This method provides a human-readable format of the state, which can be useful for 
     * debugging, logging, or displaying the current state in a user interface.
     * 
     * @returns A string representation of the current state.
     */
    abstract toString(): string;

    /**
     * Creates a copy of the current program state, with an optional modification.
     * 
     * This method returns a new instance of the program state, which is a deep copy
     * of the current state. Optionally, a specific variable's value can be updated during
     * the copy process by passing an object `{v: string, int: T}` where `v` is the variable
     * name (key) and `int` is the new value to assign to that variable.
     * 
     * @param change - An optional parameter that specifies the variable to update and
     * the new value to assign to it. If not provided, the state is copied as-is.
     * 
     * @returns A new `AbstractProgramState<T>` instance, with the updated state (if `change` is provided).
     */
    public abstract copy(change?: { v: string, int: T }): AbstractProgramState<T>;

    /**
     * Retrieves all variable names (keys) present in the current state.
     * 
     * This method returns an array of strings representing the keys (or variable names)
     * that are currently stored in the program state. It is typically used when you need to
     * perform operations on all variables in the state or when you need to know the set of
     * variables that are being tracked.
     * 
     * @returns An array of strings, each representing the name of a variable in the state.
     */
    public abstract variables(): Array<string>;

    public has(v: string): boolean {
        return this._state.has(v);
    }

    // DOMAIN


    static equal<T extends AbstractValue>(x: AbstractProgramState<T>, y: AbstractProgramState<T>): boolean {
        let _x = x.variables(), _y = y.variables();

        // If the variables length is different, they're not equal
        if (_x.length !== _y.length) return false;

        // Compare the variables in both states
        return _x.every((variable) => {
            // Ensure both states have the variable and compare the values using the equals method
            return y.has(variable) && x.lookup(variable).equals(y.lookup(variable));
        });
    }

    public lub<T extends AbstractValue>(x: AbstractProgramState<T>, y: AbstractProgramState<T>): AbstractProgramState<T> {
        let states = [x, y];

        const lubState = new Map<string, T>();
        const allKeys = new Set<string>();

        // Collect all keys
        states.forEach(state => {
            for (var v of state.variables()) {
                allKeys.add(v);
            }
        });

        // Compute the lub for each key
        allKeys.forEach(key => {
            let lubValue: T | null = null;
            states.forEach(state => {
                if (state.has(key)) {
                    const value: T = state.lookup(key);
                    // Assuming T has a lub method or using its lub functionality directly
                    if (lubValue === null) {
                        lubValue = value;
                    } else {
                        // Here we assume lub is a method in T that merges values
                        lubValue = lubValue.lub(value) as T; // Assuming lub is implemented in T
                    }
                }
            });

            // Set the lub for the key if it's not null
            if (lubValue !== null) {
                lubState.set(key, lubValue);
            }
        });

        return (this.constructor(lubState));
    };
    public glb<T extends AbstractValue>(x: AbstractProgramState<T>, y: AbstractProgramState<T>): AbstractProgramState<T>{
        let states = [x, y];

        const glbState = new Map<string, T>();
        const allKeys = new Set<string>();

        // Collect all keys
        states.forEach(state => {
            for (var v of state.variables()) {
                allKeys.add(v);
            }
        });

        // Compute the glb for each key
        allKeys.forEach(key => {
            let glbValue: T | null = null;
            states.forEach(state => {
                if (state.has(key)) {
                    const value: T = state.lookup(key);
                    // Assuming T has a lub method or using its lub functionality directly
                    if (glbValue === null) {
                        glbValue = value;
                    } else {
                        // Here we assume lub is a method in T that merges values
                        glbValue = glbValue.lub(value) as T; // Assuming lub is implemented in T
                    }
                }
            });
            if (glbValue !== null) {
                glbState.set(key, glbValue); // Assuming glb is always an Interval
            }
        });

        return this.constructor(glbState);
    };
    public widening<T extends AbstractValue>(x: AbstractProgramState<T>, y: AbstractProgramState<T>): AbstractProgramState<T> {
        let widenedState = new Map<string, T>();

        // Process variables in the previous state (x)
        x.variables().forEach((variable) => {
            if (y.has(variable)) {
                // Get the intervals for the common variable
                let prevInterval = x.lookup(variable);
                let currentInterval = y.lookup(variable);
                // Apply the widening operator
                let widenedInterval = prevInterval.widening;
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
    };
    public abstract narrowing(x: AbstractProgramState<T>, y: AbstractProgramState<T>): AbstractProgramState<T>;
}
