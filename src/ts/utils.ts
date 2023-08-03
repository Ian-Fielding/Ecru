export function collapseArray(arr:string[]):string{
	return arr.reduce(
		(accumulator, currentValue) => accumulator + currentValue
	,"");
}