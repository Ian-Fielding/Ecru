export interface BasicTest {
	name: string,
	input: string,
	out: string,
	err: boolean
}

export let basicTests: BasicTest[] = [
	{
		name: 'basic_test1',
		input: '',
		out: '',
		err: false,
	},{
		name: 'basic_test2',
		input: 'print "hello world";',
		out: 'hello world',
		err: false,
	},{
		name: 'basic_test3',
		input: 'print 1+2+3;',
		out: '6',
		err: false,
	},{
		name: 'basic_test4',
		input: 'print 1+2-3;',
		out: '0',
		err: false,
	},{
		name: 'basic_test5',
		input: 'print 1-2-3;',
		out: '-4',
		err: false,
	},{
		name: 'basic_test6',
		input: 'print 1+2*3;',
		out: '7',
		err: false,
	},{
		name: 'basic_test7',
		input: 'print 4/2+1;',
		out: '3',
		err: false,
	},{
		name: 'basic_test8',
		input: 'print "hello";\n\n print " world";',
		out: 'hello world',
		err: false,
	},{
		name: 'basic_test9',
		input: 'println "hello"; \n \n \n \t print "world";',
		out: 'hello\nworld',
		err: false,
	},{
		name: 'basic_test10',
		input: 'x: Z = 3; y: Z = 4; print x+y;',
		out: '7',
		err: false,
	},{
		name: 'basic_test11',
		input: 'x: Z; y: Z = 3; x=y; print 2*x + y;',
		out: '9',
		err: false,
	},{
		name: 'basic_test12',
		input: 'x: Z = 4; y: Z = 5; x=1; y=0; y=x; x=y; print x+y;',
		out: '2',
		err: false,
	},{
		name: 'basic_test13',
		input: 'x=3;',
		out: '',
		err: true,
	},
];