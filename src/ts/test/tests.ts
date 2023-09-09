export interface Test {
	name: string;
	input: string;
	out: string;
	err: boolean;
	errmsg?: string;
}

/**
 * Runnable test cases
 */
export let tests: Test[] = [
	{
		name: `basic_test1`,
		input: ``,
		out: ``,
		err: false,
	},
	{
		name: `basic_test2`,
		input: 'print "hello world";',
		out: `hello world`,
		err: false,
	},
	{
		name: `basic_test3`,
		input: `print 1+2+3;`,
		out: `6`,
		err: false,
	},

	{
		name: `basic_test3.1`,
		input: `print 1+2;`,
		out: `3`,
		err: false,
	},

	{
		name: `basic_test3.2`,
		input: `print 2-1;`,
		out: `1`,
		err: false,
	},
	{
		name: `basic_test4`,
		input: `print 1+2-3;`,
		out: `0`,
		err: false,
	},
	{
		name: `basic_test5`,
		input: `print 1-2-3;`,
		out: `-4`,
		err: false,
	},
	{
		name: `basic_test6`,
		input: `print 1+2*3;`,
		out: `7`,
		err: false,
	},
	{
		name: `basic_test7`,
		input: `print 4/2+1;`,
		out: `3`,
		err: false,
	},
	{
		name: `basic_test8`,
		input: 'print "hello";\n\n print " world";',
		out: `hello world`,
		err: false,
	},
	{
		name: `basic_test9`,
		input: 'println "hello"; \n \n \n \t print "world";',
		out: `hello\nworld`,
		err: false,
	},
	{
		name: `basic_test10`,
		input: `x: Z = 3; y: Z = 4; print x+y;`,
		out: `7`,
		err: false,
	},

	{
		name: `basic_test10.1`,
		input: `x: Z = 3; y: Z = 4; print x*y;`,
		out: `12`,
		err: false,
	},

	{
		name: `basic_test10.2`,
		input: `print x*y; x: Z = 3; y: Z = 4; `,
		out: ``,
		err: true,
	},

	{
		name: `basic_test10.3`,
		input: `print 3*4; x: Z = 3; y: Z = 4; `,
		out: `12`,
		err: false,
	},

	{
		name: `basic_test10.4`,
		input: `print 3*4;`,
		out: `12`,
		err: false,
	},

	{
		name: `basic_test10.5`,
		input: `x:Z = 12; print x;`,
		out: `12`,
		err: false,
	},
	{
		name: `basic_test11`,
		input: `x: Z; y: Z = 3; x=y; print 2*x + y;`,
		out: `9`,
		err: false,
	},
	{
		name: `basic_test12`,
		input: `x: Z = 4; y: Z = 5; x=1; y=0; y=x; x=y; print x+y;`,
		out: `2`,
		err: false,
	},
	{
		name: `basic_test13`,
		input: `x=3;`,
		out: ``,
		err: true,
	},
	{
		name: `basic_test14`,
		input: `x: Z;`,
		out: ``,
		err: false,
	},
	{
		name: `basic_test15`,
		input: `x:Z = 3`,
		out: ``,
		err: true,
	},
	{
		name: `basic_test16`,
		input: `3;`,
		out: ``,
		err: false,
	},
	{
		name: `basic_test17`,
		input: 'x: Z = 10; y: Z = 20; print (x==y) + " " +(x+10==y);',
		out: `0 1`,
		err: false,
	},

	{
		name: `basic_test17.1`,
		input: 'print 3+"% milk";',
		out: `3% milk`,
		err: false,
	},

	{
		name: `basic_test17.2`,
		input: 'x: Z = 3; print x+"% milk";',
		out: `3% milk`,
		err: false,
	},
	{
		name: `basic_test18`,
		input: 'print " abc \n \t ";',
		out: ` abc \n \t `,
		err: false,
	},
	{
		name: `add1`,
		input: `print 1+(2+3);`,
		out: `6`,
		err: false,
	},
	{
		name: `add2`,
		input: ' print 1 + ( 2 + 3 ) + 4 + 5 ; print " " ; print ( 4 + 3 ) + ( 3 + 4 ) ; ',
		out: `15 14`,
		err: false,
	},
	{
		name: `add3`,
		input: `x: Z; y: Z; ans: Z; x=10; y=20; ans = x + y ; print ans;`,
		out: `30`,
		err: false,
	},
	{
		name: `add4`,
		input: `abc: Z = 100 + 70; print abc;`,
		out: `170`,
		err: false,
	},
	{
		name: `add4.1`,
		input: `abc: Z; abc=100+70; print abc;`,
		out: `170`,
		err: false,
	},

	{
		name: `add4.2`,
		input: `abc: Z; abc=100+70; print abc+2+abc;`,
		out: `342`,
		err: false,
	},
	{
		name: `add5`,
		input: `
			a: Z;
			ccv: Z;
			b: Z;
			c: Z;
			d: Z;
			e: Z;
			a = 10009;
		    b = a + 100000;
		    c = b + a + (100000 + 100000) + 200;
		    print a + " ~ " + b + " ~ " + c;
		`,
		out: `10009 ~ 110009 ~ 320218`,
		err: false,
	},
	{
		name: `func_test1`,
		input: `f(){}`,
		out: ``,
		err: true,
	},
	{
		name: `func_test2`,
		input: `f():void{}`,
		out: ``,
		err: false,
	},
	{
		name: `func_test3`,
		input: `f():Z {}`,
		out: ``,
		err: true,
	},
	{
		name: `func_test3.1`,
		input: `f():Z {} f();`,
		out: ``,
		err: true,
	},
	{
		name: `func_test4`,
		input: `f():Z {return 5;} \n print f();`,
		out: `5`,
		err: false,
	},
	{
		name: `func_test5`,
		input: 'f():Z {if 0 {return 3;} print "Uh oh";} print f();',
		out: ``,
		err: true,
	},
	{
		name: `func_test6`,
		input: `f(x:Z):void {} `,
		out: ``,
		err: false,
	},
	{
		name: `func_test7`,
		input: 'f():void {print "Cool test!"; return;} f();',
		out: `Cool test!`,
		err: false,
	},

	{
		name: `func_test7.1`,
		input: 'f(x:Z):void {print "Cool test!"; return;} f(3);',
		out: `Cool test!`,
		err: false,
	},
	{
		name: `func_test7.2`,
		input: 'f(x:Z):Z {print "Cool test!\n"; return x+1;} print f(3);',
		out: `Cool test!\n4`,
		err: false,
	},
	{
		name: `func_test8`,
		input: `f(); f():void {}`,
		out: ``,
		err: true,
	},
	{
		name: `func_test9`,
		input: `f(x:Z):Z{
					y:Z = 3;
					return x+y;
				}

				g(y:Z,x:Z):Z{
					return x*x+y*y;
				}

				h():Z {
					return 7;
				}

				print g(h(),f(h()));`,
		out: `149`,
		err: false,
	},
	{
		name: `func_test10`,
		input: `fgh(x:Z,y:Z,z:Z):void {return;} fgh(1,2,3);`,
		out: ``,
		err: false,
	},
	{
		name: `func_test11`,
		input: `fgh(x:Z,y:Z,z:Z):void {return;} fgh(1,2);`,
		out: ``,
		err: true,
	},
	{
		name: `func_test12`,
		input: `fgh(x:Z,y:Z,z:Z):void {return;} fgh();`,
		out: ``,
		err: true,
	},
	{
		name: `func_test13`,
		input: `fgh(x:Z):void {return;} fgh(1,2,3);`,
		out: ``,
		err: true,
	},
	{
		name: `func_test14`,
		input: `fgh(x:Z):void {return;} fgh();`,
		out: ``,
		err: true,
	},
	{
		name: `func_test15`,
		input: `fgh(x:Z):void {return;} fgh(1);`,
		out: ``,
		err: false,
	},
	{
		name: `func_test16`,
		input: `fgh():void {return;} fgh(1,2,3);`,
		out: ``,
		err: true,
	},
	{
		name: `func_test17`,
		input: `fgh(x:Z):void {return;} fgh(1);`,
		out: ``,
		err: false,
	},
	{
		name: `func_test18`,
		input: `fgh():void {return;} fgh();`,
		out: ``,
		err: false,
	},
	{
		name: `func_test19`,
		input: `fgh(x:Z,y:Z,z:Z):void {return;} x=3;`,
		out: ``,
		err: true,
	},

	{
		name: `func_test20`,
		input: `f(x:Z):Z {b:Z = 3; b=x; return b;} print f(4);`,
		out: `4`,
		err: false,
	},

	{
		name: `func_test21`,
		input: `f(x:Z):Z {return 2*x;} print f(f(f(3)));`,
		out: `24`,
		err: false,
	},

	{
		name: `func_test22`,
		input: `f(x:Z,y:Z):Z {return x+y;} x:Z = 4; print f(x,x);`,
		out: `8`,
		err: false,
	},

	{
		name: `func_test23`,
		input: `f(x:Z,y:Z):Z {return x+y;} x:Z = 2; print f(2*x,x+2);`,
		out: `8`,
		err: false,
	},

	{
		name: `func_test24`,
		input: `
f(x:Z):Z { 
	g(y:Z,z:Z):Z {
		a:Z = 3; 
		return a*(y+z);
	} 
	return x+g(x,2);
} 
print f(2);`,
		out: `14`,
		err: false,
	},

	{
		name: `func_test25`,
		input: `return;`,
		out: ``,
		err: false,
	},

	{
		name: `func_test26`,
		input: `return 3;`,
		out: ``,
		err: true,
	},

	{
		name: `type_test1`,
		input: ``,
		out: ``,
		err: false,
	},

	{
		name: `type_test2`,
		input: `print 1+2;`,
		out: `3`,
		err: false,
	},

	{
		name: `type_test3`,
		input: `print "1"+2;`,
		out: `12`,
		err: false,
	},

	{
		name: `type_test4`,
		input: `print 1+"2";`,
		out: `12`,
		err: false,
	},

	{
		name: `type_test5`,
		input: `print (1,2,3);`,
		out: `(1,2,3)`,
		err: false,
	},

	{
		name: `type_test6`,
		input: `print ("abc",1,2);`,
		out: `(abc,1,2)`,
		err: false,
	},

	{
		name: `type_test7`,
		input: `print "abc";`,
		out: `abc`,
		err: false,
	},

	{
		name: `type_test8`,
		input: `print (1,2,3) + (7,6,5);`,
		out: `(8,8,8)`,
		err: false,
	},

	{
		name: `type_test9`,
		input: `print ("abc","3d",4,5) + ("def",3,"dex",10-4);`,
		out: ``,
		err: true,
	},

	{
		name: `type_test10`,
		input: `print ("abc","3d",4*2,5) + ("def",3+"dex",1,10-4);`,
		out: `(abcdef,3d3dex,9,11)`,
		err: false,
	},

	{
		name: `type_test11`,
		input: `print (1,2,3,4) - (4,3,2,1);`,
		out: `(-3,-1,1,3)`,
		err: false,
	},

	{
		name: `type_test12`,
		input: `print (1,2,3,4) * (4,3,2,1);`,
		out: `(4,6,6,4)`,
		err: false,
	},

	{
		name: `type_test13`,
		input: `print (1,4,9,16) / (1,2,3,4);`,
		out: `(1,2,3,4)`,
		err: false,
	},
];
