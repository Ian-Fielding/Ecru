import { IOBuffer } from "../IOBuffer.js";

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

	getChildren(): AST[]{
		return this.args;
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

	applyType(buffer:IOBuffer,expectedType:Type = new DummyType()):void{
		for(let child of this.args){
			child.applyType(buffer,expectedType);
		}
	}

	execute(buffer:IOBuffer):void{
		for(let child of this.args){
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

	/*
	on(options:Options):Options {
		if(options.run)
			for(let child of this.args)
				options=child.run(options);
		return options;
	}*/
}

class Statement extends AST{
	constructor(name: string,args:AST[]=[]){
		super(name,args);
	}
}

export class CommentStatement extends Statement{
	str: string;
	constructor(str:string){
		super("CommentStmt_"+str);
		this.str=str;
	}
}

export class DeclarationStatement extends Statement{
	id: Id;
	type: Type;

	constructor(id:Id,type:Type){
		super("DeclStmt",[id,type]);
		this.id = id;
		this.type = type;
	}

	applyBind(scope:Scope, buffer:IOBuffer):void{
		let name:string = this.id.idName;

		if(scope.lookup(name)){
			buffer.stderr(`id ${name} has already been defined.`);
			return;
		}

		let sym:IdSymbol = new IdSymbol(name);
		scope.symtab.set(name,sym);
		this.id.symbol=sym;
	}

	applyType(buffer:IOBuffer,expectedType:Type = new DummyType()):void{

		this.id.symbol!.type = this.type;
	}

	/*
	on(options: Options): Options{
		if(options.currScope){
			let currScope:Scope=options.currScope;
			let name:string=this.id.idName;

			if(currScope.lookup(name)){
				//TODO Throw error
				//console.log(`Error! The variable ${name} has already been defined!`);
			}

			let sym:IdSymbol=new IdSymbol(name);
			currScope.symtab.set(name,sym);
			this.id.symbol=sym;
			sym._type=this.type;
		}
		return options;
	}*/
}

export class AssignmentStatement extends Statement{
	id: Id;
	expr: Expr;

	constructor(id: Id,expr: Expr){
		super("AssignStmt",[id,expr]);
		this.id=id;
		this.expr=expr;
	}

	applyBind(scope:Scope, buffer:IOBuffer):void{
		this.expr.applyBind(scope,buffer);

		let name:string = this.id.idName;
		let sym:IdSymbol|null = scope.lookup(name);

		if(!sym){
			buffer.stderr(`id ${name} has not been defined.`);
		}

		this.id.symbol=sym;
	}

	applyType(buffer:IOBuffer,expectedType:Type = new DummyType()):void{
		this.expr.applyType(buffer,this.id.symbol!.type);

	}


	execute(buffer:IOBuffer):void{
		// TODO replace id with Expr, support lval
		let sym:IdSymbol = this.id.symbol!;
		sym.val = this.expr.rval();
	}

	/*
	on(options: Options): Options{

		if(options.currScope){

			let currScope:Scope=options.currScope;
			let name:string=this.id.idName;
			let sym:IdSymbol|null=currScope.lookup(name);

			if(!sym){
				//TODO Throw error
				//console.log(`Error! The variable ${name} has not been defined!`);
			}
			this.id.symbol=sym;

			//TODO Typecheck
		}

		if(options.run){
			let sym:IdSymbol|null=this.id.symbol;

			if(sym==null){
				//TODO Throw error
				//console.log(`Error! The variable ${name} has not been defined!`);
				return options;
			}


			sym.val=this.expr.rval();
		}

		return options;
	}*/
}

export class PrintStatement extends Statement{
	expr: Expr;
	isNewLine: boolean;

	constructor(expr:Expr,isNewLine:boolean=false){
		super("PrintStmt",[expr]);
		this.expr=expr;
		this.isNewLine=isNewLine;
	}

	execute(buffer:IOBuffer):void{
		let term:string = this.isNewLine ? "\n" : "";

		let str:Expr = this.expr.rval();
		if(str instanceof StringLiteral){
			buffer.stdout(str.name+term);
		}else if(str instanceof NumberLiteral){
			buffer.stdout(str.val+term);
		}else{
			// TODO better comparison to string.
			buffer.stderr("Error");
		}
	}

	/*
	on(options:Options):Options{

		if(options.run){
			let str:string=this.expr.toString();

			let con:HTMLElement = document.getElementById("console")!;
			con.innerHTML+=str;

			if(this.isNewLine)
				con.innerHTML+="<hr>";
		}

		return options;
	}*/
}

export class PrettyPrintStatement extends Statement{
	expr: Expr;
	isNewLine: boolean;

	constructor(expr:Expr,isNewLine:boolean=false){
		super("PrettyPrintStmt",[expr]);
		this.expr=expr;
		this.isNewLine=isNewLine;
	}

	execute(buffer:IOBuffer):void{
		// TODO handle latex
		let term:string = this.isNewLine ? "\n" : "";

		let str:Expr = this.expr.rval();
		if(str instanceof StringLiteral){
			buffer.stdout(str.name+term);
		}else if(str instanceof NumberLiteral){
			buffer.stdout(str.val+term);
		}else{
			// TODO better conversion to string.
			buffer.stderr("Error");
		}
	}

	/*
	on(options:Options):Options{

		if(options.run){
			let str:string=this.expr.toLatex();
			
			let con:HTMLElement = document.getElementById("console")!;
			con.innerHTML+=`$${str}$`;

			if(this.isNewLine)
				con.innerHTML+="<hr>";

			MathJax.typeset();
		}

		return options;
	}*/
}

export class WhileLoop extends Statement{
	test: Expr;
	stmts: Statement[];

	constructor(test:Expr, stmts:Statement[]){
		let other: AST[] = new Array<AST>(stmts.length+1);
		other[0]=test;
		for(let i in stmts)
			other[i+1]=stmts[i];

		super("WhileLoop",other);
		this.test=test;
		this.stmts=stmts;
	}

	applyBind(scope:Scope, buffer:IOBuffer):void{
		this.test.applyBind(scope,buffer);

		let childScope:Scope = new Scope(scope);

		for(let child of this.args){
			child.applyBind(childScope,buffer);
		}
	}

	execute(buffer:IOBuffer):void{
		while(true){
			let compVal:Expr = this.test.rval();

			if(compVal instanceof NumberLiteral)
				if(compVal.val == 0)
					break;

			for(let child of this.stmts){
				child.execute(buffer);
			}
		}

		
	}


	/*
	on(options: Options): Options{
		if(options.currScope){
			options.currScope=new Scope(options.currScope);

			//TODO typecheck test
		}

		if(options.run){
			while(false){
				for(let child of this.stmts)
					options=child.run(options);
			}
		}

		return options;
	}*/
}







class Type extends AST{
	type:string;

	parentClasses:string[];

	constructor(name:string = "Type"){
		super(name);
		this.type=name;
		this.parentClasses = ["Type"];
	}

	instanceOf(otherType:Type):boolean{
		return this.parentClasses.includes(otherType.constructor.name)
	}
}
export class VoidType extends Type{
	constructor(name:string = "VoidType"){
		super(name);

		this.parentClasses.push("VoidType");

	}
}
export class DummyType extends Type{
	constructor(name:string = "DummyType"){
		super(name);
		this.parentClasses.push("DummyType");
	}
}
export class FormulaType extends Type{
	constructor(name:string = "FormulaType"){
		super(name);
		this.parentClasses.push("FormulaType");
	}
}
export class RealType extends FormulaType{
	constructor(name:string = "RealType"){
		super(name);
		this.parentClasses.push("RealType");
	}
}
export class RationalType extends RealType{
	constructor(name:string = "RationalType"){
		super(name);
		this.parentClasses.push("RationalType");
	}
}
export class IntegerType extends RationalType{
	constructor(name:string = "IntegerType"){
		super(name);
		this.parentClasses.push("IntegerType");
	}
}
export class StringType extends FormulaType{
	constructor(name:string = "StringType"){
		super(name);
		this.parentClasses.push("StringType");
	}
}







// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~           EXPR ASTS           ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Expr extends Statement{
	type:Type;

	constructor(name:string,args:AST[]=[]){
		super(name,args);
		this.type=new DummyType();
	}

	rval():Expr{
		return this;
	}

	applyType(buffer:IOBuffer,expectedType:Type = new DummyType()):void{
		throw new Error("Must override this method!");
	}

	toLatex():string{
		return `\\text{${this.name}}`;
	}
}

export class StringLiteral extends Expr{
	constructor(name:string){
		super(name);
		this.type=new StringType();
	}

	applyType(buffer:IOBuffer,expectedType:Type = new DummyType()):void{
		if(expectedType instanceof DummyType)
			return;

		if(!this.type.instanceOf(expectedType))
			buffer.stderr(`Cannot treat string "${this.name}" as type ${expectedType.type}`);
	}

}



export class IdExpr extends Expr{
	id: Id;

	constructor(id:Id){
		super("IdExpr",[id]);
		this.id=id;
	}

	rval():Expr{
		return this.id.rval();
	}

	applyType(buffer:IOBuffer,parentType:Type = new DummyType()):void{
		this.id.applyType(buffer,parentType);
		this.type = this.id.type;
	}

	toLatex():string{
		return this.id.toLatex();
	}

}


export class Id extends AST{
	symbol: IdSymbol|null;
	idName: string;
	type:Type;

	constructor(idName:string){
		super("Id_"+idName,[]);
		this.symbol=null;
		this.idName=idName;
		this.type=new DummyType();
	}

	rval():Expr{
		return this.symbol!.rval();
	}

	applyType(buffer:IOBuffer,expectedType:Type = new DummyType()):void{
		if(expectedType instanceof DummyType)
			return;

		this.type = this.symbol!.type;

		if(!this.type.instanceOf(expectedType))
			buffer.stderr(`Cannot treat ${this.idName} as type ${expectedType.type}`);
	}

	applyBind(scope:Scope, buffer:IOBuffer):void{
		let name:string = this.idName;
		let sym:IdSymbol|null = scope.lookup(name);

		if(!sym){
			buffer.stderr(`id ${name} has not been defined.`);
		}

		this.symbol=sym;
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


	toLatex():string{

		return this.symbol!.toLatex();
	}

	toString():string{
		return this.idName;
	}

}

export class IdSymbol extends AST{
	val:Expr|null;
	scope:Scope|null;
	type:Type;

	constructor(name:string){
		super("IdSymbol_"+name,[]);
		this.type=new DummyType();
		this.val=null;
		this.scope=null;
	}

	rval():Expr{
		return this.val!;
	}

	toLatex():string{
		if(this.val==null)
			return "\\text{UNDEFINED}";

		return this.val.toLatex();
	}

	toString():string{
		if(this.val==null)
			return `IdSymbol(${this.args[0]})`;

		return this.val.toString();
	}
}


export class ArrayAccess extends Expr{
	arr: Expr;
	ind: Expr;
	constructor(arr:Expr,ind:Expr){
		super("arr",[arr,ind]);
		this.arr=arr;
		this.ind=ind;
	}
}

export class FormulaFunc extends Expr{
	constructor(name:Expr,args:Expr[]){
		super("func",[name].concat(args));
	}
}

export class NumberLiteral extends Expr{
	val:number;
	constructor(name:string){
		super("NumberLiteral_"+name,[]);
		this.val=Number(name);
		this.type=new IntegerType();
	}

	applyType(buffer:IOBuffer,expectedType:Type = new DummyType()):void{
		if(expectedType instanceof DummyType)
			return;

		if(!this.type.instanceOf(expectedType))
			buffer.stderr(`Cannot treat number "${this.val}" as type ${expectedType.type}`);
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













// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         PATTERN  ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~




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