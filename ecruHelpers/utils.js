export function collapseArray(arr){
	return arr.reduce(
		(accumulator, currentValue) => accumulator + currentValue
	,"");
}