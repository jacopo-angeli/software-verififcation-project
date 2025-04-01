export abstract class BinaryTree<T> {
  constructor(
    private _data: T,
  ) { }
  
  public get data() { return this._data };
  public set data(data: T) { this._data = data };

  abstract clone(wwith?: T): BinaryTree<T>;

  // Implementing the iter function for tree traversal
  abstract iter(callback: (node: BinaryTree<T>) => void): void;

  abstract toString():string;
}

export class LeafNode<T> extends BinaryTree<T> {
  clone(wwith?: T): LeafNode<T> {
    if (wwith) return new LeafNode<T>(wwith);
    return new LeafNode<T>(this.data)
  }

  iter(callback: (node: BinaryTree<T>) => void): void {
    // Apply callback to the current node (LeafNode)
    callback(this);
  }
  toString():string{
    return `(data:${this.data})`;
  };
}

export class VariableNode<T> extends LeafNode<T> {
  public get label(): string {
    return this._label;
  }
  public set label(value: string) {
    this._label = value;
  }

  constructor(
    _data: T,
    private _label: string
  ) {
    super(_data);
  }

  clone(wwith?: T): VariableNode<T> {
    if (wwith) return new VariableNode<T>(wwith, this._label);
    return new VariableNode<T>(this.data, this._label)
  }

  iter(callback: (node: BinaryTree<T>) => void): void {
    // Apply callback to the current node (VariableNode)
    callback(this);
  }

  toString():string{
    return `[label:${this._label}, data:${this.data}]`;
  };
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

  clone(wwith?: T): BinaryNode<T> {
    if (wwith) return new BinaryNode<T>(wwith, this._left, this._right, this._operator)
    return new BinaryNode<T>(this.data, this._left.clone(), this._right.clone(), this._operator)
  }

  // Implementing in-order traversal
  iter(callback: (node: BinaryTree<T>) => void): void {
    // Traverse the left subtree
    this._left.iter(callback);
    // Apply callback to the current node (BinaryNode)
    callback(this);
    // Traverse the right subtree
    this._right.iter(callback);
  }
  toString():string{
    return `{{data:${this.data}, op:${this.operator} left:${this.left.toString()}, right: ${this.right.toString()}}}`;
  };
} 

export class UnaryNode<T> extends BinaryTree<T> {
  clone(wwith?: T): UnaryNode<T> {
    if (wwith) return new UnaryNode<T>(wwith, this._child);
    return new UnaryNode<T>(this.data, this._child.clone());
  }

  constructor(
    _data: T,
    private _child: BinaryTree<T>,
  ) {
    super(_data);
  }

  public get child() { return this._child }

  // Implementing unary node iter function
  iter(callback: (node: BinaryTree<T>) => void): void {
    // Apply callback to the current node (UnaryNode)
    callback(this);
    // Traverse the child subtree
    this._child.iter(callback);
  }
  toString():string{
    return `{data:${this.data}, child:${this._child.toString()}}`;
  };
}
