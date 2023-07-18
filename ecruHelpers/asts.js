let PRINT=true;





class AST{
	constructor(name,args=[]){
		this.name=name;
		this.args=args;
	}

	copy(){
		let newObj=this.constructor(name);
		for(const arg in this.args)
			newObj.args.push(arg.copy());
	}

	getChildren(){
		return this.args;
	}

	toString(){
		if(this.args.length==0)
			return this.name+"()";
		let str=`${this.name}(${this.args[0]}`;
		for(let i=1;i<this.args.length;i++)
			str+=","+this.args[i];
		return str+")";
	}


	on(options){

		return options;
	}

	run(options){
		options=this.on(options);
		for(let child of this.args){

			if(child.run)
				options=child.run(options);
		}
		return options;
	}
}












// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         PROGRAM  ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



export class Program extends AST{
	constructor(stmts){
		super("Program",stmts);
	}

	toString(){
		return "Program(...)";
	}

	toLongString(){
		let str="";
		for(let i=0;i<this.args.length;i++){
			str+=`---\n${i}. ${this.args[i].toString()}\n`;
		}
		return str;
	}
}

export class CommentStatement extends AST{
	constructor(str){
		super("CommentStmt",[str]);
	}
}

export class DeclarationStatement extends AST{
	constructor(id,type){
		super("DeclStmt",[id,type]);
		this.id=id;
		this.type=type;
	}

	on(options){
		if("currScope" in options){
			let currScope=options["currScope"];
			let name=this.id.args[0];

			if(currScope.lookup(name)){
				//TODO Throw error
				console.log(`Error! The variable ${name} has already been defined!`);
			}

			let sym=new IdSymbol(name);
			currScope.symtab.set(name,sym);
			this.id.symbol=sym;
			sym.type=this.type;
		}
		return options;
	}
}

export class AssignmentStatement extends AST{
	constructor(id,expr){
		super("AssignStmt",[id,expr]);
		this.id=id;
		this.expr=expr;
	}

	on(options){

		if("currScope" in options){

			let currScope=options["currScope"];
			let name=this.id.args[0];
			let sym=currScope.lookup(name);

			if(sym==null){
				//TODO Throw error
				console.log(`Error! The variable ${name} has not been defined!`);
			}
			this.id.symbol=sym;

			//TODO Typecheck
		}

		if(options.run){
			console.log("important!")
			console.log(this.id.sym);

			this.id.symbol.val=this.expr.getVal();
		}
		return options;
	}
}



export class Scope{
	constructor(parent=null){
		this.parent=parent;
		this.symtab=new Map();
	}

	depth(){
		if(this.parent==null)
			return 0;

		return 1+this.parent.depth();
	}

	lookup(name){
		if(this.symtab.has(name))
			return this.symtab.get(name);
		if(this.parent!=null)
			return this.parent.lookup(name);
		return null;
	}
}

// ID
// TypeAST
// DECL
// STATEMENTS
// EXPRS
// CONSTANTS
// SYMBOLS
// SCOPES


export class PrintStatement extends AST{
	constructor(expr,isNewLine=false){
		super("PrintStmt",[expr]);
		this.expr=expr;
		this.isNewLine=isNewLine;
	}

	on(options){

		if(options.run){
			let str=this.expr.toString();
			document.getElementById("console").innerHTML+=str;

			if(this.isNewLine)
				document.getElementById("console").innerHTML+="<hr>";
		}

		return options;
	}
}

export class PrettyPrintStatement extends AST{
	constructor(expr,isNewLine=false){
		super("PrettyPrintStmt",[expr]);
		this.expr=expr;
		this.isNewLine=isNewLine;
	}

	on(options){

		if(options.run){
			console.log("HERE")
			console.log(this.expr);
			let str=this.expr.toLatex();
			document.getElementById("console").innerHTML+=`$${str}$`;

			if(this.isNewLine)
				document.getElementById("console").innerHTML+="<hr>";

			MathJax.typeset();
		}

		return options;
	}
}



class Type{
	constructor(type){
		this.type=type;
	}

	toString(){
		return this.type;
	}
}
export class FormulaType extends Type{
	constructor(){
		super("FormulaType");
	}
}
export class StringType extends Type{
	constructor(){
		super("StringType");
	}
}
export class IntegerType extends Type{
	constructor(){
		super("IntegerType");
	}
}
export class RationalType extends Type{
	constructor(){
		super("RationalType");
	}
}
export class RealType extends Type{
	constructor(){
		super("RealType");
	}
}




export class Expr extends AST{
	constructor(name,args=[]){
		super(name,args);
	}

	getVal(){
		return this;
	}
}



// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~          STRING ASTS          ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Str extends Expr{
	constructor(name){
		super(name);
	}

	toLatex(){
		return `\\text{${this.name}}`;
	}

	toString(){
		return this.name;
	}
}

export class IdExpr extends Expr{
	constructor(id){
		super("IdExpr",[id]);
		this.id=id;
	}

	getVal(){
		return this.id.getVal();
	}

	toLatex(){
		return this.id.toLatex();
	}

	toString(){
		return this.id.toString();
	}
}
export class Id extends AST{
	constructor(idName){
		super("Id",[idName]);
		this.symbol=null;
		this.idName=idName;
	}

	getVal(){
		if(this.symbol==null)
			return null;

		return this.symbol.getVal();
	}

	on(options){

		if("currScope" in options){

			let currScope=options["currScope"];
			let name=this.idName;
			let sym=currScope.lookup(name);

			if(sym==null){
				//TODO Throw error
				console.log(`Error! The variable ${name} has not been defined!`);
			}

			//TODO Typecheck
			this.symbol=sym;
		}
		return options;
	}


	toLatex(){
		if(this.symbol==null)
			return this.idName;

		return this.symbol.toLatex();
	}

	toString(){
		if(this.symbol==null)
			return this.idName;

		return this.symbol.toString();
	}
}

export class IdSymbol extends AST{
	constructor(name){
		super("IdSymbol",[name]);
		this.type=null;
		this.val=null;
		this.scope=null;
	}

	getVal(){
		return this.val;
	}

	toLatex(){
		if(this.val==null)
			return "\\text{UNDEFINED}";

		return this.val.toLatex();
	}

	toString(){
		if(this.val==null)
			return `IdSymbol(${this.args[0]})`;

		return this.val.toString();
	}
}




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         FORMULAE ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

class Formula extends Expr {
	constructor(name,args=[]){
		super(name,args);
	}

	checkPattern(pattern,bind){

		if(pattern.constructor === this.constructor)
			return this.equals(pattern);

		if(!pattern instanceof Pattern)
			return false;

		return pattern.bind(this,bind);
	}

	applyBind(bind){
		return this;
	}

	applyPattern(match,other){
		if(this.equals(match))
			return other;
		return this;
	}

	evaluate(){
		return null;
	}
}

export class FormulaFunc extends Formula{
	constructor(name,args){
		super(name,args);
	}

	evaluate(){
		switch(this.name){
		case "eval_add":
			let sum=0;
			for(let i=0;i<this.args.length;i++){
				let k=this.args[i].evaluate();
				if(k)
					sum+=k.val;
			}

			return new FormulaNumberLiteral(sum);
		case "eval_multiply":
			let prod=1;
			for(let i=0;i<this.args.length;i++){
				let k=this.args[i].evaluate();
				if(k)
					prod*=k.val;
			}
			return new FormulaNumberLiteral(prod);
		case "eval_negate":
			return new FormulaNumberLiteral(-this.args[0].evaluate().val);
		case "eval_pow":
			let pow=this.args[1].evaluate().val;
			if(!Number.isInteger(pow))
				return new FormulaNumberLiteral(Math.pow(this.args[0],this.args[1]));


			function getPow(a,b){
				if(b==0)
					return 1;

				if(b<0)
					return 0;

				return a*getPow(b-1);
			}

			return new FormulaNumberLiteral(getPow(this.args[0],this.args[1]));

		default:
			return this;
		}
	}

	applyPattern(match,other){

		if(this.equals(match)){
			if(other.name.substring(0,4)=="eval")
				return other.evaluate();

			return other;
		}

		let newArr=new Array(this.args.length);
		for(let i=0;i<this.args.length;i++)
			newArr[i]=this.args[i].applyPattern(match,other);

		return new FormulaFunc(this.name,newArr);
	}

	applyBind(bind){
		let newArr=new Array(this.args.length);
		for(let i=0;i<this.args.length;i++){
			newArr[i]=this.args[i].applyBind(bind);
		}
		return new FormulaFunc(this.name,newArr);
	}

	toLatex(){
		if(["add","sub","mul"].includes(this.name)){
			let sym="";
			switch(this.name){
			case "add":
				sym="+";
				break;
			case "sub":
				sym="-";
				break;
			case "mul":
				sym="*";
				break;
			}

			let str="("+this.args[0].toLatex();
			for(let i=1;i<this.args.length;i++)
				str+=sym+this.args[i].toLatex();
			return str+")";
		}

		if(this.name=="div")
			return `\\frac{${this.args[0].toLatex()}}{${this.args[1].toLatex()}}`;
		if(this.name=="pow")
			return `{${this.args[0].toLatex()}}^{${this.args[1].toLatex()}}`;

		if(this.args.length==0)
			return `\\this.name()`;
		let str=`\\${this.name}{\\left(${this.args[0].toLatex()}`;
		for(let i=1;i<this.args.length;i++)
			str+=","+this.args[i].toLatex();
		return str+"\\right)}";	
	}

	equals(other){

		if(other == null || !other instanceof FormulaFunc)
			return false;

		if(this.name!=other.name || this.args.length!=other.args.length)
			return false;

		for(let i=0;i<this.args.length;i++)
			if(!this.args[i].equals(other.args[i]))
				return false;

		return true;
	}

	checkPattern(pattern,bind){

		if(pattern instanceof FormulaFunc && pattern.name==this.name){

			let check=this.args;
			let pat=pattern.args;


			let allArgsMatch=true;
			if(check.length==pat.length){

				for(let i=0;i<check.length;i++){
					let matches=pat[i].bind(check[i],bind);
					if(!matches){
						allArgsMatch=false;
						break;
					}
				}


				if(allArgsMatch){

					return true;
				}
				
			}

		}


		for(let i=0;i<this.args.length;i++){
			let matches=this.args[i].checkPattern(pattern,bind);
			if(matches){
				return true;
			}
		}


		return false;
	}

	bind(node,bind){
		if(!node instanceof FormulaFunc || this.name!=node.name || this.args.length!=node.args.length)
			return false;

		for(let i=0;i<this.args.length;i++){
			if(!this.args[i].bind(node.args[i],bind)){
				return false;
			}
		}

		return true;
	}

}

export class FormulaNumberLiteral extends Formula{
	constructor(name){
		super("FormulaNumberLiteral",[name]);
		this.val=Number(name);
	}

	getChildren(){
		return [];
	}

	toString(){
		return this.val;
	}

	toLatex(){
		return this.val;
	}

	equals(other){
		if(other == null || !other instanceof FormulaNumberLiteral)
			return false;

		return this.val==other.val;
	}

	evaluate(){
		return this;
	}	

	bind(node,bind){
		if(this.equals(node)){
			return true;
		}
		return false;
	}
}

export class FormulaId extends Formula{
	constructor(name){
		super("FormulaId",[name]);
		this.val=name;
	}

	toLatex(){
		return this.val;
	}

	toString(){
		return this.val;
	}

	equals(other){
		if(!other instanceof FormulaId)
			return false;

		return this.name==other.name;
	}
}













// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         PATTERN  ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



class Pattern extends Formula{
	constructor(name,args){
		super(name,args);
	}

	equals(other){
		if(!other instanceof Pattern)
			return false;

		return this.name == other.name;
	}

	bind(node,bind){
		throw new Error("Not Implemented!");
	}

	applyBind(bind){

		if(bind.containsKey(this.name))
			return bind.get(this.name);
		return this;
	}

}

export class PatternExpression extends Pattern{
	constructor(name){
		super("pat_E",[name]);
		this.patternName=`E_{${name}}`;
	}


	bind(node,bind){
		if(bind.containsKey(this.patternName) && !bind.get(this.patternName).equals(node))
			return false;

		bind.set(this.patternName,node);


		return true;
	}
}

export class PatternInteger extends Pattern{
	constructor(name){
		super("pat_k",[name]);
		this.patternName=`k_{${name}}`;
	}


	bind(node,bind){
		if(bind.containsKey(this.patternName) && !node.equals(bind.get(this.patternName)))
			return false;

		let expr=node instanceof NumberLiteral;

		if(!expr){
			return false;
		}else{	
			return bind.set(this.patternName,node);
		}
		
	}
}

export class Binding{
	constructor(vars,history=[]){
		this.vars=vars;
		this.map={};
		this.history=history;
		for(let key of this.vars)
			this.map[key]=null;
	}

	toLatex(){
		let processMap=(s) => s==null? "\\texttt{none}" : s.toLatex();
		let vars=[...this.vars];
		let str=`${vars[0]} = ${processMap(this.get(vars[0]))}`;
		for(let i=1;i<vars.length;i++)
			str+=`,\\;\\;\\;${vars[i]} = ${processMap(this.get(vars[i]))}`;
		return str;
	}

	isComplete(){
		for(let key of this.vars)
			if(this.map[key]==null)
				return false;
		return true;
	}

	equals(other){
		if(!other instanceof Binding)
			return false;


		for(let key of this.vars)
			if(!this.map[key].equals(other.map[key]))
				return false;

		return true;
	}

	containsKey(key){
		return key in this.map && this.map[key]!=null;
	}

	get(key){
		return this.map[key];
	}

	set(key,value){

		if(!key in this.vars)
			return false;

		if(this.map[key]!=null)
			return false;

		this.map[key]=value;

		if(this.isComplete()){
			for(let i=0;i<this.history.length;i++){
				if(this.history[i].equals(this)){
					this.clear();
					return false;
				}
			}

		}
		return true;
	}

	clear(){
		for(let key of this.vars)
			this.map[key]=null;
	}

	toString(){
		let str="";
		for(let obj of this.vars){
			str+=`$$${obj}: ${this.get(obj).toLatex()}$$`;
		}
		return str;
	}

}