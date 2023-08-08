import { Expr, TypeAST, TypeEnum, NumberLiteral, StringLiteral } from "./asts.js";
import { IOBuffer } from "../IOBuffer.js";

class BuiltinFunc extends Expr {
	constructor(name:string,args:Expr[],type:TypeAST=new TypeAST("Dummy")){
		super(name,args,type);
	}
}


export class Add extends BuiltinFunc {
	params:Expr[];

	constructor(args:Expr[]){
		super("add",args);
		this.params=args;

		//TODO better error
		if(args.length<2)
			throw new Error("Need at least two arguments for 'add'");
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		let childTypes:TypeAST[] = this.params.map(function(c:Expr):TypeAST{
			c.applyType(buffer);
			return c.type;
		});

	
		// updates types for all math ops
		let gcdType:TypeAST = childTypes.reduce((t1,t2) => t1.closestParent(t2));
		if(gcdType.isMathType()){
			this.type = gcdType;

			for(let c of this.params)
				c.applyType(buffer,gcdType);

			return;
		}

		// handles string concat
		let containsString:boolean=false;
		for(let t of childTypes){
			if(t.instanceOf(TypeEnum.STRING)){
				containsString=true;
				break;
			}
		}
		if(containsString){
			for(let c of this.params)
				c.applyType(buffer,new TypeAST("String"));
			this.type=new TypeAST("String");


			return;
		}

		buffer.stderr("Unknown add type");
	}

	override rval():Expr{
		let childRVals:Expr[] = [];
		for(let child of this.params){
			childRVals.push(child.rval());
		}

		if(this.type.isMathType()){
			let out: NumberLiteral = new NumberLiteral("0");
			for(let i in childRVals){

				let child:NumberLiteral = childRVals[i] as NumberLiteral;

				out.val += child.val;
				out.name="NumberLiteral_"+out.val;
			}
			return out;
		}


		let str:string="";
		for(let r of childRVals){
			str+=r.builtinToString();
		}
			
			
		return new StringLiteral(str);

	}
}

export class Mul extends BuiltinFunc {
	params:Expr[];

	constructor(args:Expr[]){
		super("mul",args);
		this.params=args;

		//TODO better error
		if(args.length<2)
			throw new Error("Need at least two arguments for 'mul'");
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		let childTypes:TypeAST[] = this.params.map(function(c:Expr):TypeAST{
			c.applyType(buffer);
			return c.type;
		});

	
		// updates types for all math ops
		let gcdType:TypeAST = childTypes.reduce((t1,t2) => t1.closestParent(t2));
		if(gcdType.isMathType()){
			this.type = gcdType;

			for(let c of this.params)
				c.applyType(buffer,gcdType);

			return;
		}

		// handles string multiplication
		let containsString:boolean=false;
		for(let t of childTypes){
			if(t.instanceOf(TypeEnum.STRING)){
				containsString=true;
				break;
			}
		}
		if(containsString){
			for(let c of this.params)
				c.applyType(buffer,new TypeAST("String"));
			this.type=new TypeAST("String");


			return;
		}

		buffer.stderr("Unknown mul type");
	}

	override rval():Expr{
		let childRVals:Expr[] = [];
		for(let child of this.params){
			childRVals.push(child.rval());
		}

		if(this.type.isMathType()){
			let out: NumberLiteral = new NumberLiteral("1");
			for(let i in childRVals){

				let child:NumberLiteral = childRVals[i] as NumberLiteral;

				out.val *= child.val;
				out.name="NumberLiteral_"+out.val;
			}
			return out;
		}


		let str:string="";
		let count:number=(childRVals[1] as NumberLiteral).val;
		let dup:string = (childRVals[0] as StringLiteral).name;
		for(let i=0;i<count;i++)
			str+=dup;
			
		return new StringLiteral(str);

	}
}


export class Sub extends BuiltinFunc {
	params:Expr[];

	constructor(args:Expr[]){
		super("sub",args);
		this.params=args;

		//TODO better error
		if(args.length!=2)
			throw new Error("Need exactly two arguments for 'sub'");
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		let childTypes:TypeAST[] = this.params.map(function(c:Expr):TypeAST{
			c.applyType(buffer);
			return c.type;
		});

	
		// updates types for all math ops
		let gcdType:TypeAST = childTypes.reduce((t1,t2) => t1.closestParent(t2));
		if(gcdType.isMathType()){
			this.type = gcdType;

			for(let c of this.params)
				c.applyType(buffer,gcdType);

			return;
		}

		buffer.stderr("Unknown sub type");
	}

	override rval():Expr{
		let childRVals:Expr[] = [this.params[0].rval(),this.params[1].rval()];

		let v1:number = (childRVals[0] as NumberLiteral).val;
		let v2:number = (childRVals[1] as NumberLiteral).val;
		return new NumberLiteral(""+(v1-v2));
	}
}


export class Div extends BuiltinFunc {
	params:Expr[];

	constructor(args:Expr[]){
		super("div",args);
		this.params=args;

		//TODO better error
		if(args.length!=2)
			throw new Error("Need exactly two arguments for 'div'");
	}

	override applyType(buffer:IOBuffer,expectedType:TypeAST = new TypeAST("Dummy")):void{
		let childTypes:TypeAST[] = this.params.map(function(c:Expr):TypeAST{
			c.applyType(buffer);
			return c.type;
		});

	
		// updates types for all math ops
		let gcdType:TypeAST = childTypes.reduce((t1,t2) => t1.closestParent(t2));
		if(gcdType.isMathType()){
			this.type = gcdType;

			for(let c of this.params)
				c.applyType(buffer,gcdType);

			return;
		}

		buffer.stderr("Unknown div type");
	}

	override rval():Expr{
		let childRVals:Expr[] = [this.params[0].rval(),this.params[1].rval()];

		let v1:number = (childRVals[0] as NumberLiteral).val;
		let v2:number = (childRVals[1] as NumberLiteral).val;
		return new NumberLiteral(""+(v1/v2));
	}
}