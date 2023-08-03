class AST {
    constructor(name, args = []) {
        this.name = name;
        this.args = args;
    }
    // deep copy of this AST
    copy() {
        let newObj = this.constructor(name);
        for (const arg of this.args)
            newObj.args.push(arg.copy());
        return newObj;
    }
    getChildren() {
        return this.args;
    }
    toString() {
        if (this.args.length == 0)
            return this.name + "()";
        let str = `${this.name}(${this.args[0]}`;
        for (let i = 1; i < this.args.length; i++)
            str += "," + this.args[i];
        return str + ")";
    }
    applyBind(scope, buffer) {
        for (let child of this.args) {
            child.applyBind(scope, buffer);
        }
    }
    applyType(buffer, expectedType = new DummyType()) {
        for (let child of this.args) {
            child.applyType(buffer, expectedType);
        }
    }
    execute(buffer) {
        for (let child of this.args) {
            child.execute(buffer);
        }
    }
    /*
    on(options: Options): Options{
        return options;
    }

    run(options: Options): Options{
        let scope:Scope|null = options.currScope;
        options=this.on(options);

        if(!options.run)
            for(let child of this.args)
                options=child.run(options);

        options.currScope=scope;
        return options;
    }*/
    equals(other) {
        if (this.name != other.name || this.args.length != other.args.length)
            return false;
        for (let i = 0; i < this.args.length; i++)
            if (!this.args[i].equals(other.args[i]))
                return false;
        return true;
    }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         PROGRAM  ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Program extends AST {
    constructor(stmts = []) {
        super("Program", stmts);
    }
    toLongString() {
        let str = "";
        for (let i = 0; i < this.args.length; i++) {
            str += `---\n${i}. ${this.args[i].toString()}\n`;
        }
        return str;
    }
}
class Statement extends AST {
    constructor(name, args = []) {
        super(name, args);
    }
}
export class CommentStatement extends Statement {
    constructor(str) {
        super("CommentStmt_" + str);
        this.str = str;
    }
}
export class DeclarationStatement extends Statement {
    constructor(id, type) {
        super("DeclStmt", [id, type]);
        this.id = id;
        this.type = type;
    }
    applyBind(scope, buffer) {
        let name = this.id.idName;
        if (scope.lookup(name)) {
            buffer.stderr(`id ${name} has already been defined.`);
            return;
        }
        let sym = new IdSymbol(name);
        scope.symtab.set(name, sym);
        this.id.symbol = sym;
    }
    applyType(buffer, expectedType = new DummyType()) {
        this.id.symbol.type = this.type;
    }
}
export class AssignmentStatement extends Statement {
    constructor(id, expr) {
        super("AssignStmt", [id, expr]);
        this.id = id;
        this.expr = expr;
    }
    applyBind(scope, buffer) {
        this.expr.applyBind(scope, buffer);
        let name = this.id.idName;
        let sym = scope.lookup(name);
        if (!sym) {
            buffer.stderr(`id ${name} has not been defined.`);
        }
        this.id.symbol = sym;
    }
    applyType(buffer, expectedType = new DummyType()) {
        this.expr.applyType(buffer, this.id.symbol.type);
    }
    execute(buffer) {
        // TODO replace id with Expr, support lval
        let sym = this.id.symbol;
        sym.val = this.expr.rval();
    }
}
export class PrintStatement extends Statement {
    constructor(expr, isNewLine = false) {
        super("PrintStmt", [expr]);
        this.expr = expr;
        this.isNewLine = isNewLine;
    }
    execute(buffer) {
        let term = this.isNewLine ? "\n" : "";
        let str = this.expr.rval();
        if (str instanceof StringLiteral) {
            buffer.stdout(str.name + term);
        }
        else if (str instanceof NumberLiteral) {
            buffer.stdout(str.val + term);
        }
        else {
            // TODO better comparison to string.
            buffer.stderr("Error");
        }
    }
}
export class PrettyPrintStatement extends Statement {
    constructor(expr, isNewLine = false) {
        super("PrettyPrintStmt", [expr]);
        this.expr = expr;
        this.isNewLine = isNewLine;
    }
    execute(buffer) {
        // TODO handle latex
        let term = this.isNewLine ? "\n" : "";
        let str = this.expr.rval();
        if (str instanceof StringLiteral) {
            buffer.stdout(str.name + term);
        }
        else if (str instanceof NumberLiteral) {
            buffer.stdout(str.val + term);
        }
        else {
            // TODO better conversion to string.
            buffer.stderr("Error");
        }
    }
}
export class WhileLoop extends Statement {
    constructor(test, stmts) {
        let other = new Array(stmts.length + 1);
        other[0] = test;
        for (let i in stmts)
            other[i + 1] = stmts[i];
        super("WhileLoop", other);
        this.test = test;
        this.stmts = stmts;
    }
    applyBind(scope, buffer) {
        this.test.applyBind(scope, buffer);
        let childScope = new Scope(scope);
        for (let child of this.args) {
            child.applyBind(childScope, buffer);
        }
    }
    execute(buffer) {
        while (true) {
            let compVal = this.test.rval();
            if (compVal instanceof NumberLiteral)
                if (compVal.val == 0)
                    break;
            for (let child of this.stmts) {
                child.execute(buffer);
            }
        }
    }
}
class Type extends AST {
    constructor(name = "Type") {
        super(name);
        this.type = name;
        this.parentClasses = ["Type"];
    }
    instanceOf(otherType) {
        return this.parentClasses.includes(otherType.constructor.name);
    }
}
export class VoidType extends Type {
    constructor(name = "VoidType") {
        super(name);
        this.parentClasses.push("VoidType");
    }
}
export class DummyType extends Type {
    constructor(name = "DummyType") {
        super(name);
        this.parentClasses.push("DummyType");
    }
}
export class FormulaType extends Type {
    constructor(name = "FormulaType") {
        super(name);
        this.parentClasses.push("FormulaType");
    }
}
export class RealType extends FormulaType {
    constructor(name = "RealType") {
        super(name);
        this.parentClasses.push("RealType");
    }
}
export class RationalType extends RealType {
    constructor(name = "RationalType") {
        super(name);
        this.parentClasses.push("RationalType");
    }
}
export class IntegerType extends RationalType {
    constructor(name = "IntegerType") {
        super(name);
        this.parentClasses.push("IntegerType");
    }
}
export class StringType extends FormulaType {
    constructor(name = "StringType") {
        super(name);
        this.parentClasses.push("StringType");
    }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~           EXPR ASTS           ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Expr extends Statement {
    constructor(name, args = []) {
        super(name, args);
        this.type = new DummyType();
    }
    rval() {
        return this;
    }
    applyType(buffer, expectedType = new DummyType()) {
        throw new Error("Must override this method!");
    }
    toLatex() {
        return `\\text{${this.name}}`;
    }
}
export class StringLiteral extends Expr {
    constructor(name) {
        super(name);
        this.type = new StringType();
    }
    applyType(buffer, expectedType = new DummyType()) {
        if (expectedType instanceof DummyType)
            return;
        if (!this.type.instanceOf(expectedType))
            buffer.stderr(`Cannot treat string "${this.name}" as type ${expectedType.type}`);
    }
}
export class IdExpr extends Expr {
    constructor(id) {
        super("IdExpr", [id]);
        this.id = id;
    }
    rval() {
        return this.id.rval();
    }
    applyType(buffer, parentType = new DummyType()) {
        this.id.applyType(buffer, parentType);
        this.type = this.id.type;
    }
    toLatex() {
        return this.id.toLatex();
    }
}
export class Id extends AST {
    constructor(idName) {
        super("Id_" + idName, []);
        this.symbol = null;
        this.idName = idName;
        this.type = new DummyType();
    }
    rval() {
        return this.symbol.rval();
    }
    applyType(buffer, expectedType = new DummyType()) {
        if (expectedType instanceof DummyType)
            return;
        this.type = this.symbol.type;
        if (!this.type.instanceOf(expectedType))
            buffer.stderr(`Cannot treat ${this.idName} as type ${expectedType.type}`);
    }
    applyBind(scope, buffer) {
        let name = this.idName;
        let sym = scope.lookup(name);
        if (!sym) {
            buffer.stderr(`id ${name} has not been defined.`);
        }
        this.symbol = sym;
    }
    /*
    on(options:Options):Options{

        if(options.currScope){

            let currScope:Scope=options.currScope;
            let name:string=this.idName;
            let sym:IdSymbol|null=currScope.lookup(name);

            if(sym==null){
                //TODO Throw error
                //console.log(`Error! The variable ${name} has not been defined!`);
            }

            this.symbol=sym;
        }
        return options;
    }*/
    toLatex() {
        return this.symbol.toLatex();
    }
    toString() {
        return this.idName;
    }
}
export class IdSymbol extends AST {
    constructor(name) {
        super("IdSymbol_" + name, []);
        this.type = new DummyType();
        this.val = null;
        this.scope = null;
    }
    rval() {
        return this.val;
    }
    toLatex() {
        if (this.val == null)
            return "\\text{UNDEFINED}";
        return this.val.toLatex();
    }
    toString() {
        if (this.val == null)
            return `IdSymbol(${this.args[0]})`;
        return this.val.toString();
    }
}
export class ArrayAccess extends Expr {
    constructor(arr, ind) {
        super("arr", [arr, ind]);
        this.arr = arr;
        this.ind = ind;
    }
}
export class FormulaFunc extends Expr {
    constructor(name, args) {
        super("func", [name].concat(args));
    }
}
export class NumberLiteral extends Expr {
    constructor(name) {
        super("NumberLiteral_" + name, []);
        this.val = Number(name);
        this.type = new IntegerType();
    }
    applyType(buffer, expectedType = new DummyType()) {
        if (expectedType instanceof DummyType)
            return;
        if (!this.type.instanceOf(expectedType))
            buffer.stderr(`Cannot treat number "${this.val}" as type ${expectedType.type}`);
    }
    toString() {
        return this.val + "";
    }
    toLatex() {
        return this.val + "";
    }
    equals(other) {
        return this.val == other.val;
    }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         PATTERN  ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Scope {
    constructor(parent = null) {
        this.parent = parent;
        this.symtab = new Map();
    }
    depth() {
        if (this.parent == null)
            return 0;
        return 1 + this.parent.depth();
    }
    lookup(name) {
        let val = this.symtab.get(name);
        if (val)
            return val;
        if (this.parent != null)
            return this.parent.lookup(name);
        return null;
    }
}
