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


	on(options: Options): Options{

		return options;
	}

	run(options: Options): Options{
		options=this.on(options);
		for(let child of this.args){
			options=child.run(options);
		}
		return options;
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
	constructor(stmts:Statement[]){
		super("Program",stmts);
	}

	toString():string{
		return "Program(...)";
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

	on(options: Options): Options{
		if(options.currScope){
			let currScope:Scope=options.currScope;
			let name:string=this.id.idName;

			if(currScope.lookup(name)){
				//TODO Throw error
				console.log(`Error! The variable ${name} has already been defined!`);
			}

			let sym:IdSymbol=new IdSymbol(name);
			currScope.symtab.set(name,sym);
			this.id.symbol=sym;
			sym.type=this.type;
		}
		return options;
	}
}

export class AssignmentStatement extends Statement{
	id: Id;
	expr: Expr;

	constructor(id: Id,expr: Expr){
		super("AssignStmt",[id,expr]);
		this.id=id;
		this.expr=expr;
	}

	on(options: Options): Options{

		if(options.currScope){

			let currScope:Scope=options.currScope;
			let name:string=this.id.idName;
			let sym:IdSymbol|null=currScope.lookup(name);

			if(!sym){
				//TODO Throw error
				console.log(`Error! The variable ${name} has not been defined!`);
			}
			this.id.symbol=sym;

			//TODO Typecheck
		}

		if(options.run){
			let sym:IdSymbol|null=this.id.symbol;

			if(sym==null){
				//TODO Throw error
				console.log(`Error! The variable ${name} has not been defined!`);
				return options;
			}


			sym.val=this.expr.getVal();
		}

		return options;
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

	on(options:Options):Options{

		if(options.run){
			let str:string=this.expr.toString();

			let con:HTMLElement = document.getElementById("console")!;
			con.innerHTML+=str;

			if(this.isNewLine)
				con.innerHTML+="<hr>";
		}

		return options;
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
	}
}






class Type extends AST{
	type:string;

	constructor(type:string){
		super(type);
		this.type=type;
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








// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~           EXPR ASTS           ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export class Expr extends AST{
	constructor(name:string,args:AST[]=[]){
		super(name,args);
	}

	getVal():Expr|null{
		return this;
	}

	toLatex():string{
		return `\\text{${this.name}}`;
	}

	toString():string{
		return this.name;
	}
}

export class Str extends Expr{
	constructor(name:string){
		super(name);
	}

	
}



export class IdExpr extends Expr{
	id: Id;

	constructor(id:Id){
		super("IdExpr",[id]);
		this.id=id;
	}

	getVal():Expr|null{
		return this.id.getVal();
	}

	toLatex():string{
		return this.id.toLatex();
	}

	toString():string{
		return this.id.toString();
	}
}


export class Id extends AST{
	symbol: IdSymbol|null;
	idName: string;

	constructor(idName:string){
		super("Id_"+idName,[]);
		this.symbol=null;
		this.idName=idName;
	}

	getVal():Expr|null{
		if(this.symbol==null)
			return null;

		return this.symbol.getVal();
	}

	on(options:Options):Options{

		if(options.currScope){

			let currScope:Scope=options.currScope;
			let name:string=this.idName;
			let sym:IdSymbol|null=currScope.lookup(name);

			if(sym==null){
				//TODO Throw error
				console.log(`Error! The variable ${name} has not been defined!`);
			}

			//TODO Typecheck
			this.symbol=sym;
		}
		return options;
	}


	toLatex():string{
		if(this.symbol==null)
			return this.idName;

		return this.symbol.toLatex();
	}

	toString():string{
		if(this.symbol==null)
			return this.idName;

		return this.symbol.toString();
	}
}

export class IdSymbol extends AST{
	type:Type|null;
	val:Expr|null;
	scope:Scope|null;

	constructor(name:string){
		super("IdSymbol_"+name,[]);
		this.type=null;
		this.val=null;
		this.scope=null;
	}

	getVal():Expr|null{
		return this.val;
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




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         FORMULAE ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

abstract class Formula extends Expr {
	formulaArgs:Formula[];

	constructor(name:string,args:Formula[]=[]){
		super(name,args);
		this.formulaArgs=args;
	}

	checkPattern(pattern:Pattern,bind:Binding):boolean{

		if(pattern.constructor === this.constructor)
			return this.equals(pattern);

		return pattern.bind(this,bind);
	}

	applyBind(bind:Binding):Formula{
		return this;
	}

	applyPattern(match:Pattern,other:Formula):Formula{
		if(this.equals(match))
			return other;
		return this;
	}

	evaluate():FormulaNumberLiteral|null{
		return null;
	}
}

export class FormulaFunc extends Formula{
	constructor(name:string,args:Formula[]){
		super(name,args);
	}

	evaluate():FormulaNumberLiteral|null{
		let k:FormulaNumberLiteral, j:FormulaNumberLiteral;

		switch(this.name){
		case "eval_add":
			let sum:number=0;
			for(let i:number=0;i<this.formulaArgs.length;i++){
				k=this.formulaArgs[i].evaluate()!;
				sum+=k.val;
			}

			return new FormulaNumberLiteral(sum+"");
		case "eval_multiply":
			let prod:number=1;
			for(let i:number=0;i<this.formulaArgs.length;i++){
				k=this.formulaArgs[i].evaluate()!;
				prod*=k.val;
			}
			return new FormulaNumberLiteral(prod+"");
		case "eval_negate":
			k = this.formulaArgs[0].evaluate()!;
			return new FormulaNumberLiteral((-k.val)+"");
		case "eval_pow":
			if(this.formulaArgs.length!=2)
				throw new Error("TODO");

			k = this.formulaArgs[0].evaluate()!;
			j = this.formulaArgs[1].evaluate()!;
			let base:number=k.val;
			let pow:number=j.val;
			if(!Number.isInteger(pow))
				return new FormulaNumberLiteral(Math.pow(base,pow)+"");

			function getPow(a:number,b:number):number{
				if(b==0)
					return 1;

				if(b<0)
					return 0;

				return a*getPow(a,b-1);
			}

			return new FormulaNumberLiteral(getPow(base,pow)+"");

		default:
			return null;
		}
	}

	

	/*
	applyPattern(match:Pattern,other:Formula){

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
	}*/

}

export class FormulaNumberLiteral extends Formula{
	val:number;
	constructor(name:string){
		super("FormulaNumberLiteral_"+name,[]);
		this.val=Number(name);
	}

	getChildren(): Formula[]{
		return [];
	}

	toString():string{
		return this.val+"";
	}

	toLatex():string{
		return this.val+"";
	}

	equals(other:Formula){
		if(!(other instanceof FormulaNumberLiteral))
			return false;

		return this.val==other.val;
	}

	evaluate():FormulaNumberLiteral{
		return this;
	}	

	bind(node:Formula,bind:Binding):boolean{
		if(this.equals(node)){
			return true;
		}
		return false;
	}
}

export class FormulaId extends Formula{
	val:string;

	constructor(name:string){
		super("FormulaId_"+name,[]);
		this.val=name;
	}

	toLatex():string{
		return this.val;
	}

	toString():string{
		return this.val;
	}

	equals(other:Formula):boolean{
		if(!(other instanceof FormulaId))
			return false;

		return this.name==other.name;
	}
}













// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~         PATTERN  ASTS         ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



abstract class Pattern extends Formula{
	abstract patternName:string;

	constructor(name:string,args:Pattern[]=[]){
		super(name,args);
	}

	equals(other:Pattern):boolean{

		return this.name == other.name;
	}

	abstract bind(node:Formula,bind:Binding):boolean;

	applyBind(bind:Binding):Formula{
		let out: Formula|null = bind.get(this.name);

		return out==null?this:out;
	}

}

export class PatternExpression extends Pattern{
	patternName:string;

	constructor(name:string){
		super(`E_{${name}}`,[]);
		this.patternName=`E_{${name}}`;
	}


	bind(node:Formula,bind:Binding):boolean{
		let out: Formula|null = bind.get(this.patternName);

		if(out!=null && !node.equals(out))
			return false;

		bind.set(this.patternName,node);


		return true;
	}
}

export class PatternInteger extends Pattern{
	patternName:string;

	constructor(name:string){
		super(`k_{${name}}`,[]);
		this.patternName=`k_{${name}}`;
	}


	bind(node:Formula,bind:Binding):boolean{
		let out: Formula|null = bind.get(this.patternName);

		if(out!=null && !node.equals(out))
			return false;

		let expr:boolean=node instanceof FormulaNumberLiteral;

		if(!expr){
			return false;
		}else{	
			return bind.set(this.patternName,node);
		}
		
	}
}



// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~             UTIL              ~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export class Binding{
	vars: string[];
	map: Map<string,Formula|null>;
	history: Binding[]

	constructor(vars:string[],history:Binding[]=[]){
		this.vars=vars;
		this.map=new Map();
		this.history=history;

		for(let key of this.vars)
			this.map.set(key,null);
	}

	
	toLatex():string{
		return this.toString();
	}

	isComplete():boolean{
		for(let key of this.vars)
			if(this.map.get(key)==null)
				return false;
		return true;
	}

	equals(other:Binding):boolean{

		for(let key of this.vars){
			let obj1:Formula|null|undefined=this.map.get(key);
			let obj2:Formula|null|undefined=other.map.get(key);

			if(obj1==undefined || obj2==undefined)
				return false;

			if(obj1==null)
				return obj2==null;

			return obj1.equals(obj2);
		}

		return true;
	}

	containsKey(key:string):boolean{
		return this.map.has(key) && this.map.get(key)!=null;
	}

	get(key:string):Formula|null{
		let obj:Formula|null|undefined = this.map.get(key);
		return obj==undefined? null : obj;
	}

	set(key:string,value:Formula):boolean{
		for(let i:number=0;i<this.vars.length;i++){
			let test:string = this.vars[i];
			if(key==test)
				return false;
		}


		if(this.map.get(key)!=null)
			return false;

		this.map.set(key,value);

		if(this.isComplete()){
			for(let i:number=0;i<this.history.length;i++){
				if(this.history[i].equals(this)){
					this.clear();
					return false;
				}
			}

		}
		return true;
	}

	clear():void{
		for(let key of this.vars)
			this.map.set(key,null);
	}

	toString():string{
		let str:string="";
		for(let obj of this.vars){
			let out:Formula|null = this.get(obj);

			str+=`$$${obj}: ${out?out.toString() : "null"}$$`;
		}
		return str;
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