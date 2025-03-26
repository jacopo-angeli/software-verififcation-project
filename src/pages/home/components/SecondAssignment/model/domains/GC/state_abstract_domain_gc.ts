import { AbstractProgramState } from "../../types/abstract_state";
import { AbstractValue } from "../../types/abstract_value";
import { ConcreteValue } from "../../types/concrete_value";
import { StateAbstractDomain } from "../state_abstract_domain";

export abstract class StateAbstractDomainGC<T extends AbstractValue> extends StateAbstractDomain<T> {
    abstract alpha: (x: Set<ConcreteValue>) => AbstractProgramState<T>;
}