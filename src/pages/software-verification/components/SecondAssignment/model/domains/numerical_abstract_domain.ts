import { ArithmeticExpression } from "../../../../model/while+/arithmetic_expression";
import { BooleanExpression } from "../../../../model/while+/boolean_expression";
import { Statement } from "../../../../model/while+/statement";
import { AbstractProgramState } from "../types/abstract_state";
import { StateAbstractDomain } from "./state_abstract_domain";

/**
 * Represents an abstract domain for abstract interpretation.
 * Defines operations for comparison, lattice operations, and abstract semantics.
 * 
 * @template AbsValue The type representing abstract values.
 */
export abstract class NumericalAbstractDomain<AbsValue> {

    /**
     * Abstract domain for managing abstract states in the system.
     * 
     * This is an abstract property representing the state domain of the system,
     * which holds abstract values used in computations and analysis.
     * The state is defined by an abstract state domain (StateAbstractDomain)
     * that maps state variables to abstract values (AbsValue).
     * 
     */
    protected abstract _AbstracStateDomain: StateAbstractDomain<AbsValue>;

    /**
     * Checks if two abstract values are equal.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {AbsValue} y The second abstract value.
     * @returns {boolean} True if x and y are equal, otherwise false.
     */
    protected abstract equals(x: AbsValue, y: AbsValue): boolean;

    /**
     * Checks if two abstract values are not equal.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {AbsValue} y The second abstract value.
     * @returns {boolean} True if x and y are not equal, otherwise false.
     */
    protected abstract notEquals(x: AbsValue, y: AbsValue): boolean;

    /**
     * Checks if the first abstract value is less than the second.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {AbsValue} y The second abstract value.
     * @returns {boolean} True if x < y, otherwise false.
     */
    protected abstract lessThan(x: AbsValue, y: AbsValue): boolean;

    /**
     * Checks if the first abstract value is less than or equal to the second.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {AbsValue} y The second abstract value.
     * @returns {boolean} True if x ≤ y, otherwise false.
     */
    protected abstract lessThanOrEqual(x: AbsValue, y: AbsValue): boolean;

    /**
     * Checks if the first abstract value is greater than the second.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {AbsValue} y The second abstract value.
     * @returns {boolean} True if x > y, otherwise false.
     */
    protected abstract greaterThan(x: AbsValue, y: AbsValue): boolean;

    /**
     * Checks if the first abstract value is greater than or equal to the second.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {AbsValue} y The second abstract value.
     * @returns {boolean} True if x ≥ y, otherwise false.
     */
    protected abstract greaterThanOrEqual(x: AbsValue, y: AbsValue): boolean;

    /**
     * Computes the least upper bound (lub) of two abstract values.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {AbsValue} y The second abstract value.
     * @returns {AbsValue} The least upper bound of x and y.
     */
    protected abstract lub(x: AbsValue, y: AbsValue): AbsValue;

    /**
     * Computes the greatest lower bound (glb) of two abstract values.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {AbsValue} y The second abstract value.
     * @returns {AbsValue} The greatest lower bound of x and y.
     */
    protected abstract glb(x: AbsValue, y: AbsValue): AbsValue;

    /**
     * Computes the widening operation between two abstract values.
     * Used to ensure termination of an abstract interpretation.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {AbsValue} y The second abstract value.
     * @returns {AbsValue} The result of the widening operation.
     */
    protected abstract widening(x: AbsValue, y: AbsValue): AbsValue;

    /**
     * Computes the narrowing operation between two abstract values.
     * Used to refine an abstract interpretation result.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {AbsValue} y The second abstract value.
     * @returns {AbsValue} The result of the narrowing operation.
     */
    protected abstract narrowing(x: AbsValue, y: AbsValue): AbsValue;

    /**
     * Lifts a concrete value to an abstract value in the domain.
     * 
     * @param {number} c The concrete number.
     * @returns {AbsValue} The corresponding abstract value.
     */
    protected abstract alpha(c: number): AbsValue;

    /**
     * Performs an abstract arithmetic operation between two abstract values.
     * 
     * @param {AbsValue} x The first abstract value.
     * @param {string} op The operator (e.g., "+", "-", "*", "/").
     * @param {AbsValue} y The second abstract value.
     * @returns {AbsValue} The result of the abstract operation.
     */
    protected abstract op(x: AbsValue, op: string, y: AbsValue): AbsValue;

    /**
     * Evaluates an arithmetic expression in the abstract domain.
     * 
     * @param {ArithmeticExpression} expr The arithmetic expression to evaluate.
     * @param {AbstractProgramState<AbsValue>} aState The current abstract program state.
     * @returns {{ state: AbstractProgramState<AbsValue>, value: AbsValue }} 
     *          The updated abstract state and the evaluated abstract value.
     */
    protected abstract aSharp(
        expr: ArithmeticExpression,
        aState: AbstractProgramState<AbsValue>
    ): { state: AbstractProgramState<AbsValue>, value: AbsValue };

    /**
     * Evaluates a Boolean expression in the abstract domain.
     * 
     * @param {BooleanExpression} expr The Boolean expression to evaluate.
     * @param {AbstractProgramState<AbsValue>} aState The current abstract program state.
     * @returns {AbstractProgramState<AbsValue>} The updated abstract state.
     */
    protected abstract bSharp(
        expr: BooleanExpression,
        aState: AbstractProgramState<AbsValue>
    ): AbstractProgramState<AbsValue>;

    /**
     * Performs abstract interpretation of a statement.
     * 
     * @param {Statement} stmt The statement to analyze.
     * @param {AbstractProgramState<AbsValue>} aState The current abstract program state.
     * @param {{ widening: boolean, narrowing: boolean }} flags Configuration flags for widening and narrowing.
     * @returns {AbstractProgramState<AbsValue>} The updated abstract state after executing the statement.
     */
    public abstract dSharp(
        stmt: Statement,
        aState: AbstractProgramState<AbsValue>,
        flags: { widening: boolean, narrowing: boolean }
    ): AbstractProgramState<AbsValue>;
}
