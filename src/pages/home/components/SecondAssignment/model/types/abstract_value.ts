
export abstract class AbstractValue {
    abstract isTop() : boolean;
    abstract isBottom() : boolean;
    abstract toTop() : AbstractValue;
    abstract toBottom() : AbstractValue;
}
