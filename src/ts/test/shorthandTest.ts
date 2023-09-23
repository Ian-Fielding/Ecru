export interface ShorthandTest {
	input: number;
	output: number[];
}

export let shorthandTests: ShorthandTest[] = [
	{
		input: 1,
		output: [],
	},
	{
		input: 2,
		output: [2, 1],
	},
	{
		input: 3,
		output: [3, 1],
	},
	{
		input: 4,
		output: [2, 2],
	},
	{
		input: 5,
		output: [5, 1],
	},
	{
		input: 6,
		output: [2, 1, 3, 1],
	},
	{
		input: 7,
		output: [7, 1],
	},
	{
		input: 8,
		output: [2, 3],
	},
	{
		input: 9,
		output: [3, 2],
	},
	{
		input: 10,
		output: [2, 1, 5, 1],
	},
	{
		input: 11,
		output: [11, 1],
	},
	{
		input: 12,
		output: [2, 2, 3, 1],
	},
	{
		input: 13,
		output: [13, 1],
	},
	{
		input: 14,
		output: [2, 1, 7, 1],
	},
	{
		input: 15,
		output: [3, 1, 5, 1],
	},
	{
		input: 16,
		output: [2, 4],
	},
	{
		input: 17,
		output: [17, 1],
	},
	{
		input: 18,
		output: [2, 1, 3, 2],
	},
	{
		input: 19,
		output: [19, 1],
	},
	{
		input: 20,
		output: [2, 2, 5, 1],
	},
	{
		input: 21,
		output: [3, 1, 7, 1],
	},
	{
		input: 22,
		output: [2, 1, 11, 1],
	},
	{
		input: 23,
		output: [23, 1],
	},
	{
		input: 24,
		output: [2, 3, 3, 1],
	},
	{
		input: 25,
		output: [5, 2],
	},
	{
		input: 14452663,
		output: [151, 1, 95713, 1],
	},
	{
		input: 79229528,
		output: [2, 3, 7, 1, 73, 1, 19381, 1],
	},
	{
		input: 971900853,
		output: [3, 1, 7, 1, 11, 1, 797, 1, 5279, 1],
	},
	{
		input: 171039600000,
		output: [2, 7, 3, 4, 5, 5, 5279, 1],
	},
	{
		input: 36116721936,
		output: [2, 4, 3, 4, 5279, 2],
	},
];
