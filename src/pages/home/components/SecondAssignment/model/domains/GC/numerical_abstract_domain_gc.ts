import { AbstractValue } from "../../types/abstract_value";
import { NumericalAbstractDomain } from "../numerical_abstract_domain";

export abstract class NumericalAbstractDomainGC<T extends AbstractValue> extends NumericalAbstractDomain<T> {
    // ----------------------------------------------------------------------------
    //      As for memory state domains, the Galois connection, if it exists, 
    //      can be used to derive the best abstraction of each operator; 
    // 
    //      for instance:
    //      BinaryOperators = {
    //          add: (x: T, y: T) => this.alpha({this.gamma(X) + this.gamma(Y)}),
    //      };
    //      but is otherwise optional.
    // ----------------------------------------------------------------------------
    // * A possible improvement could be defining a hierarchy that formally  *
    // * represents P(I), where I = {Z, Q, R}, and use it as x type in alpha *
    // * to achieve the best possible abstraction.                           *
    // * However, this is entirely beyond the project's scope.               *
    abstract alpha(x: any):T;
}
