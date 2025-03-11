import { AbstractProgramState } from "../types/abstract_state";
import { NumericalAbstractDomain } from "./numerical_abstract_domain";

export abstract class StateAbstractDomain<AbsValue> {

    constructor(
        protected _NumericalAbstractDomain: NumericalAbstractDomain<AbsValue>,
    ) { super(); }

    /**
     * Deeply compares two program states for equality.
     *
     * @param x - The first program state to compare.
     * @param y - The second program state to compare.
     * @returns `true` if both states are equal, `false` otherwise.
     */
    public abstract equal(x: AbstractProgramState<AbsValue>, y: AbstractProgramState<AbsValue>): boolean;

    /**
     * Computes the least upper bound (LUB) of two program states.
     *
     * The LUB is a concept from abstract interpretation and domain theory.
     * It represents the smallest abstract state that is greater than or equal to both input states.
     * 
     * @param x - The first program state to compute the LUB with.
     * @param y - The second program state to compute the LUB with.
     * @returns A new program state representing the LUB of the two input states.
     */
    public abstract lub(x: AbstractProgramState<AbsValue>, y: AbstractProgramState<AbsValue>): AbstractProgramState<AbsValue>;

    /**
     * Computes the greatest lower bound (GLB) of two program states.
     *
     * The GLB is a concept from abstract interpretation and domain theory.
     * It represents the largest abstract state that is less than or equal to both input states.
     *
     * @param x - The first program state to compute the GLB with.
     * @param y - The second program state to compute the GLB with.
     * @returns A new program state representing the GLB of the two input states.
     */
    public abstract glb(x: AbstractProgramState<AbsValue>, y: AbstractProgramState<AbsValue>): AbstractProgramState<AbsValue>;

    /**
     * Computes the widening of two program states.
     *
     * The widening operator is used to compute an approximation of the program states.
     * It ensures that we don'AbsValue get an infinite or excessively precise sequence of states during abstract interpretation.
     * 
     * @param x - The first program state to widen.
     * @param y - The second program state to widen.
     * @returns A new program state representing the widening of the two input states.
     */
    public abstract widening(x: AbstractProgramState<AbsValue>, y: AbstractProgramState<AbsValue>): AbstractProgramState<AbsValue>;

    /**
     * Computes the narrowing of two program states.
     *
     * The narrowing operator is used after widening to refine the abstract states. It is typically used to get a more precise result
     * after an initial approximation (widening) has been made.
     *
     * @param x - The first program state to narrow.
     * @param y - The second program state to narrow.
     * @returns A new program state representing the narrowing of the two input states.
     */
    private narrowing(x: AbstractProgramState<AbsValue>, y: AbstractProgramState<AbsValue>): AbstractProgramState<AbsValue> {
        let narrowedState = new Map<string, AbsValue>();

        // Process variables in the previous state (x)
        x.variables().forEach((variable) => {
            if (y.has(variable)) {
                // Apply the narrowing operator
                    // Set the narrowed interval in the new state
                    narrowedState.set(variable, this._NumericalAbstractDomain.narrowing(x.lookup(variable), y.lookup(variable)));
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
    };


    /**
     * Converts the given state into a string representation.
     *
     * @param state - The state to be converted to a string.
     * @returns A string representation of the provided state.
     */
    public abstract toString(state: AbstractProgramState<AbsValue>): string;


}
