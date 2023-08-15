import { IOBuffer } from "../IOBuffer.js";
import { divides,gcd } from "../utils.js";

export interface Options {
	run: boolean,
	currScope: Scope|null
}
declare let MathJax: any;


class AST{
	name: string;
	args: AST[];

	constructor(name: string,args:AST[]=[]){
		this.name = name;
		this.args = args;
	}

	// deep copy of this AST
	copy(): AST{
		let newObj: AST = this.constructor(name);
		for(const arg of this.args)
			newObj.args.push(arg.copy());
		return newObj;
	}

	toString(): string{
		if(this.args.length==0)
			return this.name+"()";
		let str:string=`${this.name}(${this.args[0]}`;
		for(let i:number=1;i<this.args.length;i++)
			str+=","+this.args[i];
		return str+")";
	}

	applyBind(scope:Scope, buffer:IOBuffer):void{
		for(let child of this.args){
			child.applyBind(scope,buffer);
		}
	}

	applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		for(let child of this.args){
			child.applyType(buffer,expectedType);
		}
	}

	execute(buffer:IOBuffer):void{
		for(let child of this.args){
			child.execute(buffer);
		}
	}


	equals(other:AST):boolean{

		if(this.name!=other.name || this.args.length!=other.args.length)
			return false;

		for(let i:number=0;i<this.args.length;i++)
			if(!this.args[i].equals(other.args[i]))
				return false;

		return true;
	}
}











// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         PROGRAM  ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



export class Program extends AST{
	constructor(stmts:Statement[]=[]){
		super("Program",stmts);
	}


	toLongString():string{
		let str:string="";
		for(let i:number=0;i<this.args.length;i++){
			str+=`---\n${i}. ${this.args[i].toString()}\n`;
		}
		return str;
	}

}

class Statement extends AST{
	constructor(name: string,args:AST[]=[]){
		super(name,args);
	}
}

export class CommentStatement extends Statement{
	str: StringLiteral;
	constructor(str:string){
		let strlit:StringLiteral = new StringLiteral(str);
		super("CommentStmt",[strlit]);
		this.str=strlit;
	}
}

export class DeclarationStatement extends Statement{
	id: Id;
	type: TypeAST;

	constructor(id:Expr,type:TypeAST){
		super("DeclStmt",[id,type]);
		this.id = (id as IdExpr).id;

		this.type = type;
	}

	override applyBind(scope:Scope, buffer:IOBuffer):void{
		let name:string = this.id.idName;

		if(scope.lookup(name)){
			buffer.stderr(`id ${name} has already been defined.`);
			return;
		}

		let sym:IdSymbol = new IdSymbol(name);
		scope.symtab.set(name,sym);
		this.id.symbol=sym;
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{

		this.id.symbol!.type = this.type;
	}

}

export class AssignmentStatement extends Statement{
	id: Id;
	expr: Expr;

	constructor(id: Expr,expr: Expr){
		super("AssignStmt",[id,expr]);
		this.id=(id as IdExpr).id;
		this.expr=expr;
	}

	override applyBind(scope:Scope, buffer:IOBuffer):void{
		this.expr.applyBind(scope,buffer);

		let name:string = this.id.idName;
		let sym:IdSymbol|null = scope.lookup(name);

		if(!sym){
			buffer.stderr(`id ${name} has not been defined.`);
		}

		this.id.symbol=sym;
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		this.expr.applyType(buffer,this.id.symbol!.type);

	}


	override execute(buffer:IOBuffer):void{
		// TODO replace id with Expr, support lval
		let sym:IdSymbol = this.id.symbol!;
		sym.val = this.expr.rval(buffer);
	}

}

export class PrintStatement extends Statement{
	expr: Expr;
	isNewLine: boolean;

	constructor(expr:Expr,isNewLine:boolean=false){
		super("PrintStmt",[expr]);
		this.expr=expr;
		this.isNewLine=isNewLine;
	}

	override execute(buffer:IOBuffer):void{
		let term:string = this.isNewLine ? "\n" : "";

		let str:Expr = this.expr.rval(buffer);
		if(str instanceof StringLiteral){
			buffer.stdout(str.name+term);
		}else if(str instanceof NumberLiteral){
			buffer.stdout(str.val+term);
		}else{
			// TODO better comparison to string.
			buffer.stderr("Error");
		}
	}

}

export class PrettyPrintStatement extends Statement{
	expr: Expr;
	isNewLine: boolean;

	constructor(expr:Expr,isNewLine:boolean=false){
		super("PrettyPrintStmt",[expr]);
		this.expr=expr;
		this.isNewLine=isNewLine;
	}

	override execute(buffer:IOBuffer):void{
		// TODO handle latex
		let term:string = this.isNewLine ? "\n" : "";

		let str:Expr = this.expr.rval(buffer);
		if(str instanceof StringLiteral){
			buffer.stdout(str.name+term);
		}else if(str instanceof NumberLiteral){
			buffer.stdout(str.val+term);
		}else{
			// TODO better conversion to string.
			buffer.stderr("Error");
		}
	}

}

export class WhileLoop extends Statement{
	test: Expr;
	stmts: Statement[];

	constructor(test:Expr, stmts:Statement[]){
		let other: AST[] = [];
		other.push(test);
		for(let child of stmts)
			other.push(child);

		super("WhileLoop",other);
		this.test=test;
		this.stmts=stmts;
	}

	override applyBind(scope:Scope, buffer:IOBuffer):void{
		this.test.applyBind(scope,buffer);

		let childScope:Scope = new Scope(scope);

		for(let child of this.stmts){
			child.applyBind(childScope,buffer);
		}
	}

	override execute(buffer:IOBuffer):void{
		while(true){
			let compVal:NumberLiteral = this.test.rval(buffer) as NumberLiteral;

			if(compVal.val == 0)
				break;

			for(let child of this.stmts)
				child.execute(buffer);
		}

		
	}

}



export class ForLoop extends Statement{
	asg: Statement[];
	test: Expr;
	it: Statement[]; 
	stmts: Statement[];

	constructor(asg:Statement[], test:Expr, it:Statement[], stmts:Statement[]){
		let other: AST[] = [];
		for(let child of asg)
			other.push(child);
		other.push(test);
		for(let child of it)
			other.push(child);
		for(let child of stmts)
			other.push(child);

		super("ForLoop",other);
		this.asg=asg;
		this.test=test;
		this.it=it;
		this.stmts=stmts;
	}

	override applyBind(scope:Scope, buffer:IOBuffer):void{

		let mainScope:Scope = new Scope(scope);
		let childScope:Scope = new Scope(mainScope);


		for(let child of this.asg)
			child.applyBind(mainScope,buffer);

		this.test.applyBind(mainScope,buffer);

		for(let child of this.it)
			child.applyBind(mainScope,buffer);


		for(let child of this.stmts)
			child.applyBind(childScope,buffer);
		
	}

	override execute(buffer:IOBuffer):void{
		for(let child of this.asg)
			child.execute(buffer);

		while(true){
			let compVal:NumberLiteral = this.test.rval(buffer) as NumberLiteral;

			if(compVal.val == 0)
				break;

			for(let child of this.stmts)
				child.execute(buffer);

			for(let child of this.it)
				child.execute(buffer);
		}

		
	}

}





export class IfStmt extends Statement{
	test: Expr;
	stmts: Statement[];
	elseStmts: Statement[];

	constructor(test:Expr, stmts:Statement[], elseStmts:Statement[]){

		let other: AST[] = [];
		other.push(test);
		for(let child of stmts)
			other.push(child);
		for(let child of elseStmts)
			other.push(child);


		super("IfStmt",other);
		this.test=test;
		this.stmts=stmts;
		this.elseStmts=elseStmts;
	}

	override applyBind(scope:Scope, buffer:IOBuffer):void{
		this.test.applyBind(scope,buffer);

		let ifScope:Scope = new Scope(scope);
		let elseScope:Scope = new Scope(scope);

		for(let child of this.stmts)
			child.applyBind(ifScope,buffer);
		for(let child of this.elseStmts)
			child.applyBind(elseScope,buffer);
		
	}

	override execute(buffer:IOBuffer):void{
		let compVal:NumberLiteral = this.test.rval(buffer) as NumberLiteral;

		if(compVal.val != 0)
			for(let child of this.stmts)
				child.execute(buffer);
		else
			for(let child of this.elseStmts)
				child.execute(buffer);
		
	}

}







export const enum TypeEnum {
	OBJECT		= 1,
	FORMULA		= 2,
	REAL		= 2*2,
	RATIONAL	= 2*2*2,
	INTEGER		= 2*2*2*2,
	NATURAL		= 2*2*2*2*2,
	BOOLEAN		= 2*2*2*2*2*2,
	STRING		= 2*3,
	VOID		= 5,
	DUMMY		= 23456789,
}


export class TypeAST extends AST{
	type:TypeEnum;
	
	constructor(name:string|number){
		super("UncertainType");

		if(typeof name == "number"){
			this.type=<TypeEnum>name;
			return;
		}

		switch(<string>name){
		case "Object":
		case "Obj":
			this.type=TypeEnum.OBJECT;
			this.name="ObjType";
			break;
		case "Formula":
		case "Form":
			this.type=TypeEnum.FORMULA;
			this.name="FormType";
			break;
		case "Real":
		case "R":
			this.type=TypeEnum.REAL;
			this.name="RealType";
			break;
		case "Rational":
		case "Q":
			this.type=TypeEnum.RATIONAL;
			this.name="RatType";
			break;
		case "Integer":
		case "Int":
		case "Z":
			this.type=TypeEnum.INTEGER;
			this.name="IntType";
			break;
		case "Natural":
		case "N":
			this.type=TypeEnum.NATURAL;
			this.name="NatType";
			break;
		case "Boolean":
		case "Bool":
			this.type=TypeEnum.BOOLEAN;
			this.name="BoolType";
			break;
		case "String":
		case "Str":
			this.type=TypeEnum.STRING;
			this.name="StrType";
			break;
		case "void":
			this.type=TypeEnum.VOID;
			this.name="VoidType";
			break;
		default:
			this.type=TypeEnum.DUMMY;
			this.name="DummyType";
			break;
		}
	}

	instanceOf(t:TypeAST|number):boolean{
		if(t instanceof TypeAST)
			return divides(t.type,this.type);

		return divides(t,this.type);
	}

	closestParent(t:TypeAST|number):TypeAST{
		if(t instanceof TypeAST)
			return new TypeAST(gcd(this.type,t.type));
		return new TypeAST(gcd(this.type,t));
	}

	isMathType():boolean{
		return this.type%TypeEnum.REAL==0;
	}
}






// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~           EXPR ASTS           ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Expr extends Statement{
	type:TypeAST;

	constructor(name:string,args:Expr[]=[],type:TypeAST = new TypeAST("Dummy")){
		super(name,args);
		this.type=type;
	}

	rval(buffer:IOBuffer):Expr{
		return this;
	}

	getChildrenRVals(buffer:IOBuffer):Expr[]{
		let childRVals:Expr[] = [];
		for(let child of this.args){
			childRVals.push((child as Expr).rval(buffer));
		}
		return childRVals;
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		throw new Error("Must override this method!");
	}

	toLatex():string{
		return `\\text{${this.name}}`;
	}

	builtinToString():string{
		return this.toString();
	}
}


export class TypeCast extends Expr {
	constructor(name:string,args:Expr[]=[],type:TypeAST = new TypeAST("Dummy")){
		super(name,args);
		// TODO
	}
}



export class StringLiteral extends Expr{
	constructor(name:string){
		super(name,[],new TypeAST("String"));
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		if(expectedType.instanceOf(TypeEnum.DUMMY))
			return;

		if(!this.type.instanceOf(expectedType))
			buffer.stderr(`Cannot treat string "${this.name}" as type ${expectedType.type}`);
	}

	override builtinToString():string{
		return this.name;
	}

	override toString():string{
		return `"${this.name}"`;
	}

}



export class IdExpr extends Expr{
	id: Id;

	constructor(id:Id){
		super("IdExpr",[id]);
		this.id=id;
	}

	override rval(buffer:IOBuffer):Expr{
		return this.id.rval(buffer);
	}

	override applyType(buffer:IOBuffer,parentType:TypeAST = new TypeAST("Dummy")):void{
		this.id.applyType(buffer,parentType);
		this.type = this.id.type;
	}

	override toString():string{
		return this.id.toString();
	}

	override toLatex():string{
		return this.id.toLatex();
	}

	override builtinToString():string{
		return this.id.builtinToString();
	}
}


export class Id extends Expr{
	symbol: IdSymbol|null;
	idName: string;

	constructor(idName:string){
		super("Id_"+idName,[],new TypeAST("Dummy"));
		this.symbol=null;
		this.idName=idName;
	}

	rval(buffer:IOBuffer):Expr{
		return this.symbol!.rval(buffer);
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		this.type = this.symbol!.type;

		if(expectedType.instanceOf(TypeEnum.DUMMY))
			return;

		if(expectedType.instanceOf(TypeEnum.STRING)){
			this.type=expectedType;
			return;
		}

		if(!this.type.instanceOf(expectedType))
			buffer.stderr(`Cannot treat ${this.idName} as type ${expectedType.type}`);
	}

	override applyBind(scope:Scope, buffer:IOBuffer):void{
		let name:string = this.idName;
		let sym:IdSymbol|null = scope.lookup(name);

		if(!sym){
			buffer.stderr(`id ${name} has not been defined.`);
		}

		this.symbol=sym;
	}



	override toLatex():string{//TODO sucks

		return this.symbol!.toLatex();
	}

	toString():string{
		return this.idName;
	}

	override builtinToString():string{
		return this.symbol!.builtinToString();
	}
}

export class IdSymbol{
	val:Expr|null;
	scope:Scope|null;
	type:TypeAST;
	name:string;

	constructor(name:string){
		this.name=name;
		this.type=new TypeAST("Dummy");
		this.val=null;
		this.scope=null;
	}

	rval(buffer:IOBuffer):Expr{
		return this.val!;
	}

	toLatex():string{
		if(this.val==null)
			return "\\text{UNDEFINED}";

		return this.val.toLatex();
	}

	toString():string{
		if(this.val==null)
			return `IdSymbol(${this.name})`;

		return this.val.toString();
	}

	builtinToString():string{
		return this.val!.builtinToString();
	}
}


export class ArrayAccess extends Expr{
	arr: Expr;
	ind: Expr;
	constructor(arr:Expr,ind:Expr){// TODO
		super("arr",[arr,ind]);
		this.arr=arr;
		this.ind=ind;
	}
}


export class NumberLiteral extends Expr{
	val:number;
	constructor(name:string){
		super("NumberLiteral_"+name,[],new TypeAST("Int"));
		this.val=Number(name);
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		if(expectedType.instanceOf(TypeEnum.DUMMY))
			return;

		if(expectedType.instanceOf(TypeEnum.STRING)){
			this.type=expectedType;
			return;
		}


		if(!this.type.instanceOf(expectedType))
			buffer.stderr(`Cannot treat number "${this.val}" as type ${expectedType.type}`);
	}

	override rval(buffer:IOBuffer):Expr{
		if(this.type.instanceOf(TypeEnum.STRING))
			return new StringLiteral(""+this.val);

		return this;
	}

	toString():string{
		return this.val+"";
	}

	toLatex():string{
		return this.val+"";
	}

	equals(other:NumberLiteral){
		return this.val==other.val;
	}
}



export class IntegerLiteral extends Expr{
	val:number;
	constructor(name:string){
		super("IntegerLiteral_"+name,[],new TypeAST("Int"));
		this.val=Number(name);
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		if(expectedType.instanceOf(TypeEnum.DUMMY))
			return;

		if(expectedType.instanceOf(TypeEnum.STRING)){
			this.type=expectedType;
			return;
		}


		if(!this.type.instanceOf(expectedType))
			buffer.stderr(`Cannot treat number "${this.val}" as type ${expectedType.type}`);
	}

	override rval(buffer:IOBuffer):Expr{
		if(this.type.instanceOf(TypeEnum.STRING))
			return new StringLiteral(""+this.val);

		return this;
	}

	toLongString(){
		return this.val+"";
	}

	toString():string{
		return this.val+"";
	}

	toLatex():string{
		return this.val+"";
	}

	equals(other:NumberLiteral){
		return this.val==other.val;
	}
}














export class Scope{
	parent:Scope|null;
	symtab: Map<string,IdSymbol>;

	constructor(parent:Scope|null=null){
		this.parent=parent;
		this.symtab=new Map();
	}

	depth():number{
		if(this.parent==null)
			return 0;

		return 1+this.parent.depth();
	}

	lookup(name:string): IdSymbol|null{
		let val: IdSymbol|undefined = this.symtab.get(name);
		
		if(val)
			return val;
		if(this.parent!=null)
			return this.parent.lookup(name);
		return null;
	}
}