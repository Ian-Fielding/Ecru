export function collapseArray(arr:string[]):string{
	return arr.reduce(
		(accumulator, currentValue) => accumulator + currentValue
	,"");
}

export function gcd(a:number, b:number):number{
	return b==0 ? a : gcd(b,a%b);
}

export function divides(a:number, b:number):boolean{
	if(a==0)
		return false;

	if(a<0)
		return divides(-a,b);

	if(b<0)
		return divides(a,-b);

	return b%a==0;
}