import { AbstractValue } from "../types/abstract_value";
import { PowerSet_I } from "../types/set";

export abstract class NumericalAbstractDomain<T extends AbstractValue> {
    abstract leq: (X: T, Y: T) => boolean;
    abstract gamma: (X: T) => PowerSet_I;
    abstract Bottom: T;
    abstract Top: T;
    abstract UnaryOperators: {
        neg: (X: T) => T;
    };
    abstract BinaryOperators: {
        add: (X: T, Y: T) => T,
        subtract: (X: T, Y: T) => T,
        multiply: (X: T, Y: T) => T,
        divide: (X: T, Y: T) => T,
    };
    abstract SetOperators: {
        union: (X: T, Y: T) => T;
        intersection: (X: T, Y: T) => T;
    };
    abstract widening: (X: T, Y: T) => T;
}
