export abstract class AbstractValue {
    abstract equals(other: AbstractValue): boolean;
    abstract lub(other: AbstractValue): AbstractValue;
    abstract widening(other: AbstractValue) : AbstractValue;
}