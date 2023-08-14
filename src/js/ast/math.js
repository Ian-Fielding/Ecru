import { Expr, TypeAST, NumberLiteral, StringLiteral } from "./asts.js";
class BuiltinFunc extends Expr {
    constructor(name, args, type = new TypeAST("Dummy")) {
        super(name, args, type);
    }
}
export class Add extends BuiltinFunc {
    constructor(args) {
        super("add", args);
        this.params = args;
        //TODO better error
        if (args.length < 2)
            throw new Error("Need at least two arguments for 'add'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        let childTypes = this.params.map(function (c) {
            c.applyType(buffer);
            return c.type;
        });
        // updates types for all math ops
        let gcdType = childTypes.reduce((t1, t2) => t1.closestParent(t2));
        if (gcdType.isMathType()) {
            this.type = gcdType;
            return;
        }
        // handles string concat
        let containsString = false;
        for (let t of childTypes) {
            if (t.instanceOf(6 /* TypeEnum.STRING */)) {
                containsString = true;
                break;
            }
        }
        if (containsString) {
            this.type = new TypeAST("String");
            return;
        }
        buffer.stderr("Unknown add type");
    }
    rval(buffer) {
        let childRVals = [];
        for (let child of this.params) {
            childRVals.push(child.rval(buffer));
        }
        if (this.type.isMathType()) {
            let out = new NumberLiteral("0");
            for (let i in childRVals) {
                let child = childRVals[i];
                out.val += child.val;
                out.name = "NumberLiteral_" + out.val;
            }
            return out;
        }
        let str = "";
        for (let r of childRVals) {
            str += r.builtinToString();
        }
        return new StringLiteral(str);
    }
}
export class Mul extends BuiltinFunc {
    constructor(args) {
        super("mul", args);
        this.params = args;
        //TODO better error
        if (args.length < 2)
            throw new Error("Need at least two arguments for 'mul'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        let childTypes = this.params.map(function (c) {
            c.applyType(buffer);
            return c.type;
        });
        // updates types for all math ops
        let gcdType = childTypes.reduce((t1, t2) => t1.closestParent(t2));
        if (gcdType.isMathType()) {
            this.type = gcdType;
            return;
        }
        // handles string multiplication
        let containsString = false;
        for (let t of childTypes) {
            if (t.instanceOf(6 /* TypeEnum.STRING */)) {
                containsString = true;
                break;
            }
        }
        if (containsString) {
            this.type = new TypeAST("String");
            return;
        }
        buffer.stderr("Unknown mul type");
    }
    rval(buffer) {
        let childRVals = [];
        for (let child of this.params) {
            childRVals.push(child.rval(buffer));
        }
        if (this.type.isMathType()) {
            let out = new NumberLiteral("1");
            for (let i in childRVals) {
                let child = childRVals[i];
                out.val *= child.val;
                out.name = "NumberLiteral_" + out.val;
            }
            return out;
        }
        let str = "";
        let count = childRVals[1].val;
        let dup = childRVals[0].name;
        for (let i = 0; i < count; i++)
            str += dup;
        return new StringLiteral(str);
    }
}
export class Sub extends BuiltinFunc {
    constructor(args) {
        super("sub", args);
        this.params = args;
        //TODO better error
        if (args.length != 2)
            throw new Error("Need exactly two arguments for 'sub'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        let childTypes = this.params.map(function (c) {
            c.applyType(buffer);
            return c.type;
        });
        // updates types for all math ops
        let gcdType = childTypes.reduce((t1, t2) => t1.closestParent(t2));
        if (gcdType.isMathType()) {
            this.type = gcdType;
            return;
        }
        buffer.stderr("Unknown sub type");
    }
    rval(buffer) {
        let childRVals = [this.params[0].rval(buffer), this.params[1].rval(buffer)];
        let v1 = childRVals[0].val;
        let v2 = childRVals[1].val;
        return new NumberLiteral("" + (v1 - v2));
    }
}
export class Div extends BuiltinFunc {
    constructor(args) {
        super("div", args);
        this.params = args;
        //TODO better error
        if (args.length != 2)
            throw new Error("Need exactly two arguments for 'div'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        let childTypes = this.params.map(function (c) {
            c.applyType(buffer);
            return c.type;
        });
        // updates types for all math ops
        let gcdType = childTypes.reduce((t1, t2) => t1.closestParent(t2));
        if (gcdType.isMathType()) {
            this.type = gcdType;
            return;
        }
        buffer.stderr("Unknown div type");
    }
    rval(buffer) {
        let childRVals = [this.params[0].rval(buffer), this.params[1].rval(buffer)];
        let v1 = childRVals[0].val;
        let v2 = childRVals[1].val;
        return new NumberLiteral("" + (v1 / v2));
    }
}
export class LogicalNot extends BuiltinFunc {
    constructor(args) {
        super("not", args);
        this.params = args;
        //TODO better error
        if (args.length != 1)
            throw new Error("Need exactly one arguments for 'not'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        this.type = new TypeAST("Integer");
        if (!expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */) && !this.type.instanceOf(expectedType)) {
            buffer.stderr(`Cannot treat "${this.name}" as type ${expectedType.type} in ~`);
            return;
        }
        this.params[0].applyType(buffer, this.type);
    }
    rval(buffer) {
        let childRVals = [this.params[0].rval(buffer)];
        let v1 = childRVals[0].val;
        if (v1 != 0)
            v1 = 1;
        return new NumberLiteral(v1 == 1 ? "0" : "1");
    }
}
export class LogicalOr extends BuiltinFunc {
    constructor(args) {
        super("or", args);
        this.params = args;
        //TODO better error
        if (args.length != 2)
            throw new Error("Need exactly two arguments for 'or'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        this.type = new TypeAST("Integer");
        if (!expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */) && !this.type.instanceOf(expectedType)) {
            buffer.stderr(`Cannot treat "${this.name}" as type ${expectedType.type} in ||`);
            return;
        }
        this.params[0].applyType(buffer, this.type);
        this.params[1].applyType(buffer, this.type);
    }
    rval(buffer) {
        let childRVals = [this.params[0].rval(buffer), this.params[1].rval(buffer)];
        let v1 = childRVals[0].val;
        let v2 = childRVals[1].val;
        if (v1 != 0)
            v1 = 1;
        if (v2 != 0)
            v2 = 1;
        return new NumberLiteral("" + Math.max(v1, v2));
    }
}
export class LogicalAnd extends BuiltinFunc {
    constructor(args) {
        super("and", args);
        this.params = args;
        //TODO better error
        if (args.length != 2)
            throw new Error("Need exactly two arguments for 'or'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        this.type = new TypeAST("Integer");
        if (!expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */) && !this.type.instanceOf(expectedType)) {
            buffer.stderr(`Cannot treat "${this.name}" as type ${expectedType.type} in &&`);
            return;
        }
        this.params[0].applyType(buffer, this.type);
        this.params[1].applyType(buffer, this.type);
    }
    rval(buffer) {
        let childRVals = [this.params[0].rval(buffer), this.params[1].rval(buffer)];
        let v1 = childRVals[0].val;
        let v2 = childRVals[1].val;
        if (v1 != 0)
            v1 = 1;
        if (v2 != 0)
            v2 = 1;
        return new NumberLiteral("" + (v1 * v2));
    }
}
export class LogicalEq extends BuiltinFunc {
    constructor(args) {
        super("equals", args);
        this.params = args;
        //TODO better error
        if (args.length != 2)
            throw new Error("Need exactly two arguments for 'equals'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        this.type = new TypeAST("Integer");
        if (!expectedType.instanceOf(23456789 /* TypeEnum.DUMMY */) && !this.type.instanceOf(expectedType)) {
            buffer.stderr(`Cannot treat "${this.name}" as type ${expectedType.type} in ==`);
            return;
        }
        this.params[0].applyType(buffer);
        this.params[1].applyType(buffer);
        if (!this.params[0].type.instanceOf(this.params[1].type)) {
            buffer.stderr(`Cannot treat "${this.params[0].toString()}" as type ${this.params[1].type} in ==`);
            return;
        }
        if (!this.params[1].type.instanceOf(this.params[0].type)) {
            buffer.stderr(`Cannot treat "${this.params[1].toString()}" as type ${this.params[0].type} in ==`);
            return;
        }
    }
    rval(buffer) {
        let childRVals = [this.params[0].rval(buffer), this.params[1].rval(buffer)];
        let v1;
        let v2;
        if (childRVals[0].type.instanceOf(6 /* TypeEnum.STRING */)) {
            v1 = childRVals[0].name;
            v2 = childRVals[1].name;
        }
        else {
            v1 = childRVals[0].val;
            v2 = childRVals[1].val;
        }
        return new NumberLiteral(v1 == v2 ? "1" : "0");
    }
}
