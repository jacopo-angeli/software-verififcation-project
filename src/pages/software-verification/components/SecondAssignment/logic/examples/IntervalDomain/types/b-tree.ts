export abstract class BTree<T> {
  constructor(
    private _data: T,
  ) { }
  public get data() { return this._data };
  public set data(data: T) { this._data = data };
}
export class VNode<T> extends BTree<T> {
  constructor(
    _data: T,
    private _id: string
  ) {
    super(_data);
  }
}
export class BNode<T> extends BTree<T> {
  public get label(): string {
    return this._label;
  }
  public set label(value: string) {
    this._label = value;
  }
  public get right(): BTree<T> {
    return this._right;
  }
  public set right(value: BTree<T>) {
    this._right = value;
  }
  public get left(): BTree<T> {
    return this._left;
  }
  public set left(value: BTree<T>) {
    this._left = value;
  }
  constructor(
    _data: T,
    private _left: BTree<T>,
    private _right: BTree<T>,
    private _label: string,
  ) {
    super(_data);
  }
  


}
export class UNode<T> extends BTree<T> {
  constructor(
    _data: T,
    private _child: BTree<T>,
  ) {
    super(_data);
  }
  public get child (){return this._child}
}
export class LNode<T> extends BTree<T> {
  constructor(
    _data: T,
    private _label: string,
  ) {
    super(_data);
  }
}