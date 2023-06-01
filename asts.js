export class Func{
	constructor(name,args){
		this.name=name;
		this.args=args;
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
		if(this.name=="add")
			return `${this.args[0].toLatex()}+${this.args[1].toLatex()}`;
		if(this.name=="sub")
			return `${this.args[0].toLatex()}-${this.args[1].toLatex()}`;
		if(this.name=="mul")
			return `(${this.args[0].toLatex()})(${this.args[1].toLatex()})`;
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
}

export class NumberLiteral{
	constructor(val){
		this.val=val;
	}

	toString(){
		return this.val;
	}

	toLatex(){
		return this.val;
	}
}

export class Id{
	constructor(name){
		this.name=name;
	}

	toString(){
		return this.name;
	}

	toLatex(){
		return this.name;
	}


}