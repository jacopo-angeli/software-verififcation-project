export abstract class BinaryTree<T> {
  constructor(
    private _data: T,
  ) { }
  public get data() { return this._data };
  public set data(data: T) { this._data = data };
}

export class LeafNode<T> extends BinaryTree<T> {
  constructor(
    _data: T,
  ) {
    super(_data);
  }
}
export class VariableNode<T> extends LeafNode<T>{
  public get label(): string {
    return this._lable;
  }
  public set label(value: string) {
    this._lable = value;
  }
  constructor(
    _data: T,
    private _lable: string
  ) {
    super(_data);
  }
}
export class BinaryNode<T> extends BinaryTree<T> {
  public get operator(): string {
    return this._operator;
  }
  public set operator(value: string) {
    this._operator = value;
  }
  
  public get right(): BinaryTree<T> {
    return this._right;
  }
  public set right(value: BinaryTree<T>) {
    this._right = value;
  }
  public get left(): BinaryTree<T> {
    return this._left;
  }
  public set left(value: BinaryTree<T>) {
    this._left = value;
  }
  constructor(
    _data: T,
    private _left: BinaryTree<T>,
    private _right: BinaryTree<T>,
    private _operator: string,
  ) {
    super(_data);
  }
}
export class UnaryNode<T> extends BinaryTree<T> {
  constructor(
    _data: T,
    private _child: BinaryTree<T>,
  ) {
    super(_data);
  }
  public get child (){return this._child}
}