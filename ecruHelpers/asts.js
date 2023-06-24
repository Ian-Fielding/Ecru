let PRINT=true;




class AST{
	constructor(name){
		this.name=name;
		this.args=[];
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
		return this.name;
	}

	toLatex(){
		return this.name;
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

export class Func extends AST{
	constructor(name,args){
		super(name);
		this.args=args;
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

			return new NumberLiteral(sum);
		case "eval_multiply":
			let prod=1;
			for(let i=0;i<this.args.length;i++){
				let k=this.args[i].evaluate();
				if(k)
					prod*=k.val;
			}
			return new NumberLiteral(prod);
		case "eval_negate":
			return new NumberLiteral(-this.args[0].evaluate().val);
		case "eval_pow":
			let pow=this.args[1].evaluate().val;
			if(!Number.isInteger(pow))
				return new NumberLiteral(Math.pow(this.args[0],this.args[1]));


			function getPow(a,b){
				if(b==0)
					return 1;

				if(b<0)
					return 0;

				return a*getPow(b-1);
			}

			return new NumberLiteral(getPow(this.args[0],this.args[1]));

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

		return new Func(this.name,newArr);
	}

	applyBind(bind){
		let newArr=new Array(this.args.length);
		for(let i=0;i<this.args.length;i++){
			newArr[i]=this.args[i].applyBind(bind);
		}
		return new Func(this.name,newArr);
	}


	toString(){
		if(this.args.length==0)
			return this.name+"()";
		let str=`${this.name}(${this.args[0]}`;
		for(let i=1;i<this.args.length;i++)
			str+=","+this.args[i];
		return str+")";
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

		if(other == null || !other instanceof Func)
			return false;

		if(this.name!=other.name || this.args.length!=other.args.length)
			return false;

		for(let i=0;i<this.args.length;i++)
			if(!this.args[i].equals(other.args[i]))
				return false;

		return true;
	}

	checkPattern(pattern,bind){
		if(PRINT)
			console.log(`Checking if ${this.toString()} matches pattern ${pattern}`)

		if(pattern instanceof Func && pattern.name==this.name){
			if(PRINT)
				console.log("names match, checking args");
			let check=this.args;
			let pat=pattern.args;


			let allArgsMatch=true;
			if(check.length==pat.length){

				for(let i=0;i<check.length;i++){
					let matches=pat[i].bind(check[i],bind);
					if(!matches){
						if(PRINT)
							console.log(`args ${pat[i]} and ${check[i]} do not match!`);
						allArgsMatch=false;
						break;
					}
				}


				if(allArgsMatch){
					if(PRINT)
						console.log("args match!");

					return true;
				}
				
			}

		}

		if(PRINT)
			console.log(`checking children for ${this.toString()}...`);

		for(let i=0;i<this.args.length;i++){
			let matches=this.args[i].checkPattern(pattern,bind);
			if(matches){
				return true;
			}
		}


		if(PRINT)
			console.log(`no matches for ${this.toString()}.`);
		return false;
	}

	bind(node,bind){
		if(!node instanceof Func || this.name!=node.name || this.args.length!=node.args.length)
			return false;

		for(let i=0;i<this.args.length;i++){
			if(!this.args[i].bind(node.args[i],bind)){
				if(PRINT)
					console.log(`args ${this.args[i]} and ${node.args[i]} do not match!`);
				return false;
			}
		}

		return true;
	}

}

export class NumberLiteral extends AST{
	constructor(val){
		super("NUM_"+val);
		this.val=Number(val);
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
		if(other == null || !other instanceof NumberLiteral)
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

export class Id extends AST{
	constructor(name){
		super(name);
	}

	


	equals(other){
		if(!other instanceof Id)
			return false;

		return this.name==other.name;
	}
}

class Pattern extends AST{
	constructor(name){
		super(name);
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
		console.log(bind);

		if(bind.containsKey(this.name))
			return bind.get(this.name);
		return this;
	}

}

export class PatternExpression extends Pattern{
	constructor(name){
		super(`E_{${name}}`);
	}


	bind(node,bind){
		if(bind.containsKey(this.name) && !bind.get(this.name).equals(node))
			return false;

		bind.set(this.name,node);


		return true;
	}
}

export class PatternInteger extends Pattern{
	constructor(name){
		super(`k_{${name}}`);
	}


	bind(node,bind){
		if(bind.containsKey(this.name) && !node.equals(bind.get(this.name)))
			return false;

		let expr=node instanceof NumberLiteral;

		if(!expr){
			return false;
		}else{	
			return bind.set(this.name,node);
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
		if(PRINT)
			console.log(`set key ${key} to value ${value}`);

		if(!key in this.vars)
			return false;

		if(this.map[key]!=null)
			return false;

		this.map[key]=value;

		if(this.isComplete()){
			console.log("CHECKING FOR PRINTOUT")
			console.log(this);
			console.log(this.history);
			for(let i=0;i<this.history.length;i++){
				if(this.history[i].equals(this)){
					this.clear();
					console.log("CLEARED")
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