export abstract class AST {
    abstract map(fn: (node: AST) => AST): AST;
    abstract iter(fn: (node: AST) => void): void;
    abstract clone() : AST;
}