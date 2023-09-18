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
		out: `false true`,
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
		name: `basic_test19`,
		input: "print 3/2;",
		out: `1`,
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
		name: `func_test9.1`,
		input: `f(x:N):N{
					y:N = 3;
					return x+y;
				}

				g(y:N,x:N):N{
					return x*x+y*y;
				}

				h():N {
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
		name: `func_test10.1`,
		input: `fgh(x:N,y:N,z:N):void {return;} fgh(1,2,3);`,
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
		name: `func_test20.1`,
		input: `f(x:Z/3Z):Z/3Z {b:Z = 3; b=x; return b;} print f(4);`,
		out: `1`,
		err: false,
	},

	{
		name: `func_test20.2`,
		input: `f(x:Z/3Z):Z {b:Z = 3; b=x; return b;} print f(4);`,
		out: `1`,
		err: false,
	},

	{
		name: `func_test20.3`,
		input: `f(x:Z):Z/3Z {return x;} print f(5);`,
		out: `2`,
		err: false,
	},

	{
		name: `func_test21`,
		input: `f(x:Z):Z {return 2*x;} print f(f(f(3)));`,
		out: `24`,
		err: false,
	},

	{
		name: `func_test21.1`,
		input: `f(x:Z):N {return 2*x;} print f(f(f(3)));`,
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
			print f(2);
		`,
		out: `14`,
		err: false,
	},
	{
		name: `func_test24.1`,
		input: `
			f(x:N):N { 
				g(y:N,z:N):N {
					a:N = 3; 
					return a*(y+z);
				} 
				return x+g(x,2);
			} 
			print f(2);
		`,
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
		name: `tuple_test1`,
		input: `print "abc"+"abc";`,
		out: `abcabc`,
		err: false,
	},

	{
		name: `tuple_test2`,
		input: `print 1+2;`,
		out: `3`,
		err: false,
	},

	{
		name: `tuple_test3`,
		input: `print "1"+2;`,
		out: `12`,
		err: false,
	},

	{
		name: `tuple_test4`,
		input: `print 1+"2";`,
		out: `12`,
		err: false,
	},

	{
		name: `tuple_test5`,
		input: `print (1,2,3);`,
		out: `(1,2,3)`,
		err: false,
	},

	{
		name: `tuple_test6`,
		input: `print ("abc",1,2);`,
		out: `(abc,1,2)`,
		err: false,
	},

	{
		name: `tuple_test7`,
		input: `print "abc";`,
		out: `abc`,
		err: false,
	},

	{
		name: `tuple_test8`,
		input: `print (1,2,3) + (7,6,5);`,
		out: `(8,8,8)`,
		err: false,
	},

	{
		name: `tuple_test9`,
		input: `print ("abc","3d",4,5) + ("def",3,"dex",10-4);`,
		out: `(abcdef,3d3,4dex,11)`,
		err: false,
	},

	{
		name: `tuple_test10`,
		input: `print ("abc","3d",4*2,5) + ("def",3+"dex",1,10-4);`,
		out: `(abcdef,3d3dex,9,11)`,
		err: false,
	},

	{
		name: `tuple_test11`,
		input: `print (1,2,3,4) - (4,3,2,1);`,
		out: `(-3,-1,1,3)`,
		err: false,
	},

	{
		name: `tuple_test12`,
		input: `print (1,2,3,4) * (4,3,2,1);`,
		out: `(4,6,6,4)`,
		err: false,
	},

	{
		name: `tuple_test13`,
		input: `print (1,4,9,16) / (1,2,3,4);`,
		out: `(1,2,3,4)`,
		err: false,
	},

	{
		name: `tuple_test14`,
		input: `x: Z*Z = (2,3);`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test15`,
		input: `x: Z*Str = (2,3);`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test16`,
		input: `x: Str = 2; y:Str = 3; print x+y;`,
		out: `23`,
		err: false,
	},

	{
		name: `tuple_test17`,
		input: `x: Str*Z = (2,3);`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test18`,
		input: `x: Z*Z = (2,"abc");`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test19`,
		input: `x: Z*Z = (2,3,4);`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test20`,
		input: `x: Z*Z = (2);`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test21`,
		input: `x: Z*Str = (2,"3");`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test22`,
		input: `x: Z*Z*Str = (2,3,"test");`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test23`,
		input: `x: Z*Str = (2,3);`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test24`,
		input: `x: Z*Z*Z = (2,3,4); x = (4,2,0); print x;`,
		out: `(4,2,0)`,
		err: false,
	},

	{
		name: `tuple_test25`,
		input: `x: Z*Str*Z = (2,"abc",4); x = (4,"two",0); print x;`,
		out: `(4,two,0)`,
		err: false,
	},

	{
		name: `tuple_test26`,
		input: `x: Z*Z*Z = (2,3,4); x = ("four",2,0);`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test27`,
		input: `
			auto_add_tups(
				x:Z*Z*Z, 
				y:Str*Str*Str):Str*Str*Str { 
					return y+x+y;
			} 
			print auto_add_tups(
				(1,2,3)*(29,15,2),
				("a",13,"a")+(14,"b",15)
			);`,
		out: `(a1429a14,13b3013b,a156a15)`,
		err: false,
	},
	{
		name: `tuple_test28`,
		input: `print (1,2,3)+("a","b","c");`,
		out: `(1a,2b,3c)`,
		err: false,
	},

	{
		name: `tuple_test29`,
		input: `print ("1","2","3")+("a","b","c");`,
		out: `(1a,2b,3c)`,
		err: false,
	},
	{
		name: `tuple_test30`,
		input: `
			auto_add_tups(
				x:Z*Z*Z, 
				y:Str*Str*Str):Str*Str*Str { 
					return y+x+y;
			} 
			print auto_add_tups((1,2,3),("a","b","c"));`,
		out: `(a1a,b2b,c3c)`,
		err: false,
	},
	{
		name: `tuple_test30.1`,
		input: `
			auto_add_tups(
				x:Z^3, 
				y:Str^3):Str^3 { 
					return y+x+y;
			} 
			print auto_add_tups((1,2,3),("a","b","c"));`,
		out: `(a1a,b2b,c3c)`,
		err: false,
	},
	{
		name: `tuple_test30.2`,
		input: `
			auto_add_tups(
				x:Z*Z*Z, 
				y:Str^3):Str*Str*Str { 
					return y+x+y;
			} 
			print auto_add_tups((1,2,3),("a","b","c"));`,
		out: `(a1a,b2b,c3c)`,
		err: false,
	},
	{
		name: `tuple_test30.3`,
		input: `
			auto_add_tups(
				x:Z*Z*Z, 
				y:Str*Str*Str):Str^3 { 
					return y+x+y;
			} 
			print auto_add_tups((1,2,3),("a","b","c"));`,
		out: `(a1a,b2b,c3c)`,
		err: false,
	},

	{
		name: `tuple_test31`,
		input: `
			f():Str*Str*Str { 
					return ("a","b","c");
			} 
			print f();`,
		out: `(a,b,c)`,
		err: false,
	},

	{
		name: `tuple_test32`,
		input: `
			f():Str*Str*Z { 
					return ("a","b",3);
			} 
			print f()+f();`,
		out: `(aa,bb,6)`,
		err: false,
	},

	{
		name: `tuple_test33`,
		input: `
			f(x:Z):Str { 
					return "a"+x;
			} 
			print (f(1),f(2),f(3));`,
		out: `(a1,a2,a3)`,
		err: false,
	},

	{
		name: `tuple_test34`,
		input: `
			f(a:Str,x:Z):Str { 
					return a+x;
			} 
			print (f("a",1),f("b",2),f("c",3));`,
		out: `(a1,b2,c3)`,
		err: false,
	},
	{
		name: `tuple_test35`,
		input: `
			auto_add_tups(
				x:Z*Z*Z, 
				y:Str*Str*Str):Str*Str*Str { 
					return y;
			} 
			print auto_add_tups((1,2,3),("a","b","c"));`,
		out: `(a,b,c)`,
		err: false,
	},

	{
		name: `tuple_test36`,
		input: `
			auto_add_tups(
				x:Z*Z*Z, 
				y:Str*Str*Str):Str { 
					return "test";
			} 
			print auto_add_tups((1,2,3),("a","b","c"));`,
		out: `test`,
		err: false,
	},

	{
		name: `tuple_test37`,
		input: `x: Z*Z = ("3","4"); print x+(1,2);`,
		out: `(4,6)`,
		err: false,
	},

	{
		name: `tuple_test38`,
		input: `x: Z = "3";`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test39`,
		input: `x: Z = "a";`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test40`,
		input: `x: (Z*Z)*Z = ((1,2),3);`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test41`,
		input: `x: Z*Z*Z = ((1,2),3);`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test41.1`,
		input: `x: Z^3 = ((1,2),3);`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test42`,
		input: `x: (Z*Z)*Z = (1,2,3);`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test42.1`,
		input: `x: Z^2 * Z = (1,2,3);`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test43`,
		input: `x: (Z*Z) = (1,2);`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test43.1`,
		input: `x: Z^2 = (1,2);`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test44`,
		input: `x: Z = (3);`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test45`,
		input: `x: (Z*Z)*(Z*Z) = ((1,2),(3,4));`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test45.1`,
		input: `x: Z^2 * Z^2 = ((1,2),(3,4));`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test46`,
		input: `x: (Z*Z)*Z = ((1,"hi"),3);`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test46.1`,
		input: `x: Z^2 * Z = ((1,"hi"),3);`,
		out: ``,
		err: true,
	},

	{
		name: `tuple_test46.2`,
		input: `x: Z^2 * Z = ((1,2),3);`,
		out: ``,
		err: false,
	},

	{
		name: `tuple_test47`,
		input: `x: (Z*String)*(String*Z) = ((1,"hi"),("there",4)); print x;`,
		out: `((1,hi),(there,4))`,
		err: false,
	},

	{
		name: `array_test1`,
		input: `x:Z*Z*Z = (1,2,3); print x[3];`,
		out: ``,
		err: true,
	},

	{
		name: `array_test1.1`,
		input: `x:Z^3 = (1,2,3); print x[3];`,
		out: ``,
		err: true,
	},

	{
		name: `array_test2`,
		input: `x:Z*Z*Z = (1,2,3); print x[2];`,
		out: `3`,
		err: false,
	},

	{
		name: `array_test3`,
		input: `x:Z*Z*Z = (1,2,3); print x[1];`,
		out: `2`,
		err: false,
	},

	{
		name: `array_test4`,
		input: `x:Z*Z*Z = (1,2,3); print x[0];`,
		out: `1`,
		err: false,
	},

	{
		name: `array_test5`,
		input: `x:Z*Z*Z = (1,2,3); print x[-1];`,
		out: `3`,
		err: false,
	},

	{
		name: `array_test6`,
		input: `x:Z*Z*Z = (1,2,3); print x[-2];`,
		out: `2`,
		err: false,
	},

	{
		name: `array_test7`,
		input: `x:Z*Z*Z = (1,2,3); print x[-3];`,
		out: `1`,
		err: false,
	},

	{
		name: `array_test8`,
		input: `x:Z*Z*Z = (1,2,3); print x[-4];`,
		out: ``,
		err: true,
	},

	{
		name: `array_test9`,
		input: `x:Z*Z = (3,5); print x[0]+x[1];`,
		out: `8`,
		err: false,
	},

	{
		name: `array_test10`,
		input: `dot(x:Z*Z,y:Z*Z):Z { return x[0]*y[0]+x[1]*y[1]; } print dot((2,4),(1,3));`,
		out: `14`,
		err: false,
	},

	{
		name: `array_test11`,
		input: `x: Z*Z*Z*String = (3,0,1,"testing!"); print x[x[x[x[2]]]];`,
		out: `testing!`,
		err: false,
	},

	{
		name: `array_test12`,
		input: `x: Z = 1; print x[0];`,
		out: ``,
		err: true,
	},

	{
		name: `array_test13`,
		input: `x: String*String = ("a","b"); print x["hi"];`,
		out: ``,
		err: true,
	},

	{
		name: `array_test14`,
		input: `x: String*String*String = ("a","b","c"); print x[1+1];`,
		out: `c`,
		err: false,
	},

	{
		name: `array_test15`,
		input: `cross_product(a:Z*Z*Z, b:Z*Z*Z): Z*Z*Z {
			x1: Z = a[1]*b[2]-a[2]*b[1];
			x2: Z = a[2]*b[0] - a[0]*b[2];
			x3: Z = a[0]*b[1] - a[1]*b[0];
			return (x1,x2,x3);
		} 
		
		print cross_product(
			(5,3,2),
			(4,2,10)
		);`,
		out: `(26,-42,-2)`,
		err: false,
	},

	{
		name: `array_test16`,
		input: `cross_product(a:Z*Z*Z, b:Z*Z*Z): Z*Z*Z {
			x1: Z = a[1]*b[2]-a[2]*b[1];
			x2: Z = a[2]*b[0] - a[0]*b[2];
			x3: Z = a[0]*b[1] - a[1]*b[0];
			return (x1,x2,x3);
		}

		sum(a:Z*Z*Z):Z { return a[0]+a[1]+a[2]; } 
		
		print sum(cross_product(
			(5,3,2),
			(4,2,10)
		));`,

		out: `-18`,
		err: false,
	},

	{
		name: `array_test17`,
		input: `print "xyzabc"[0];`,
		out: `x`,
		err: false,
	},

	{
		name: `array_test18`,
		input: `x: String = "abc"; print x[1]+x[-1];`,
		out: `bc`,
		err: false,
	},

	{
		name: `array_test19`,
		input: `
			x: String = "abc";
			y: String = x[0]+x[2]+x[1];
			z: String = x[0]+y[0]+x[2]+y[2];
			print z[0]+z[1]+z[-2]+z[-1];`,
		out: `aacb`,
		err: false,
	},

	{
		name: `array_test20`,
		input: `first_last(x:String):String {return x[0]+x+x[-1];} print first_last(first_last("abc"+"def"));`,
		out: `aaabcdefff`,
		err: false,
	},

	{
		name: `if_test1`,
		input: `x:Z = 0; if x print "hello "; print "there";`,
		out: `there`,
		err: false,
	},

	{
		name: `if_test2`,
		input: `x:Z = 1; if x print "hello"; print " there";`,
		out: `hello there`,
		err: false,
	},

	{
		name: `if_test3`,
		input: `
			x:String = "morning";
			print "A good ";
			if x=="morning" 
				print "morning"; 
			else 
				print "evening";
			
			print " to you.";	`,
		out: `A good morning to you.`,
		err: false,
	},

	{
		name: `if_test4`,
		input: `
			x:String = "evening";
			print "A good ";
			if x=="morning" 
				print "morning"; 
			else 
				print "evening";
			
			print " to you.";	`,
		out: `A good evening to you.`,
		err: false,
	},

	{
		name: `if_test5`,
		input: `x: Z = 3;
			if(x+5==3+5){
				y: String = "My number is ";
				print y+x;
			} else {
				y: Z = 5;
				print "My output is "+(x+y);
			}

			print " and that's that.";
		`,
		out: `My number is 3 and that's that.`,
		err: false,
	},

	{
		name: `if_test6`,
		input: `x: Z = 5;
			if(x+5~=3+5){
				y: String = "My number is ";
				print y+x;
			} else {
				y: Z = 5;
				print "My output is "+(x+y);
			}

			y:String = " and that's that.";
			print y;
		`,
		out: `My output is 10 and that's that.`,
		err: false,
	},

	{
		name: `if_test7`,
		input: `
			x: Z = 3;
			if x {
				y: Z = 1;
				x = 1;

				if x-y {
					z: Z = 3;
					x=z;
					print x;
				} else {
					y = 4;
					x=y;
					print x;
				}
			} else{
				y: Z = 1;
				x = 4;

				if x-y {
					z: Z = 3;
					x=z;
					print x;
				} else {
					y = 4;
					x=y;
					print x;
				}
			}
		`,
		out: `4`,
		err: false,
	},

	{
		name: `if_test8`,
		input: `
			factorial(x:Z):Z{
				if x==0 return 1;
				return x*factorial(x-1);
			}

			print factorial(5);
		`,
		out: `120`,
		err: false,
	},

	{
		name: `if_test9`,
		input: `
			sumTuple_helper(x:Z^100, ind:Z):Z {
				if ind==100 return 0;
				return x[ind]+sumTuple_helper(x,ind+1);
			}

			sumTuple(x:Z^100):Z {
				return sumTuple_helper(x,0);
			}

			print sumTuple((
				155,499,368,713,272,527,719,43,761,751,488,520,168,
				236,839,968,696,260,160,298,302,625,290,89,163,524,
				103,87,205,658,897,860,857,946,34,374,782,554,107,
				500,323,760,296,795,796,842,303,366,125,390,553,678,
				960,484,166,94,22,18,772,930,749,241,493,64,234,611,
				938,281,137,601,759,498,798,535,608,285,115,533,741,
				729,764,406,248,10,794,705,616,662,818,651,328,304,
				233,698,47,363,896,585,16,216
			));


		`,
		out: `47381`,
		err: false,
	},

	{
		name: `if_test10`,
		input: `if 0 x:Z; x=3;`,
		out: ``,
		err: true,
	},

	{
		name: `if_test11`,
		input: `if 1 x:Z; x=3;`,
		out: ``,
		err: true,
	},

	{
		name: `math_type_test1`,
		input: `x: N = 1; print x;`,
		out: `1`,
		err: false,
	},

	{
		name: `math_type_test2`,
		input: `x: N = 0;`,
		out: ``,
		err: true,
	},

	{
		name: `math_type_test3`,
		input: `x: N = -1;`,
		out: ``,
		err: true,
	},

	{
		name: `math_type_test4`,
		input: `x: N = 3; y: Z = 4; print x+y;`,
		out: `7`,
		err: false,
	},

	{
		name: `math_type_test5`,
		input: `x: N = 3; y: Z = 4; print x-y;`,
		out: `-1`,
		err: false,
	},

	{
		name: `math_type_test6`,
		input: `x: N = 3; y: N = 4; print x+y;`,
		out: `7`,
		err: false,
	},

	{
		name: `math_type_test6.1`,
		input: `x: N = 4; y: N = 3; print x+y;`,
		out: `7`,
		err: false,
	},

	{
		name: `math_type_test6.2`,
		input: `x: N = 1; y: N = 1; print x+y;`,
		out: `2`,
		err: false,
	},

	{
		name: `math_type_test6.3`,
		input: `x: N = 1; y: N = 2; print x+" - "+y;`,
		out: `1 - 2`,
		err: false,
	},

	{
		name: `math_type_test6.4`,
		input: `x: Z = 4; y: Z = 3; print x+y;`,
		out: `7`,
		err: false,
	},

	{
		name: `math_type_test7`,
		input: `x: N = 3; y: N = 4; print x-y;`,
		out: ``,
		err: true,
	},

	{
		name: `math_type_test7.1`,
		input: `x: N = 3; y: N = 3; print x-y;`,
		out: ``,
		err: true,
	},

	{
		name: `math_type_test7.2`,
		input: `x: N = 3; y: N = 2; print x-y;`,
		out: `1`,
		err: false,
	},

	{
		name: `math_type_test8`,
		input: `x: N = 4; print x; x=5; print x;`,
		out: `45`,
		err: false,
	},

	{
		name: `math_type_test9`,
		input: `x: N = 3; x = x+x; print x;`,
		out: `6`,
		err: false,
	},

	{
		name: `math_type_test10`,
		input: `x: N = 3; x=x-x;`,
		out: ``,
		err: true,
	},

	{
		name: `math_type_test11`,
		input: `x: Z/2Z = 0; print x;`,
		out: `false`,
		err: false,
	},

	{
		name: `math_type_test12`,
		input: `x: Z/2Z = 1; print x;`,
		out: `true`,
		err: false,
	},

	{
		name: `math_type_test13`,
		input: `x: Z/2Z = 2; print x;`,
		out: `false`,
		err: false,
	},

	{
		name: `math_type_test14`,
		input: `x: Z/3Z = 2; y: Z/2Z = 1; print x+y;`,
		out: `3`,
		err: false,
	},

	{
		name: `math_type_test14.1`,
		input: `x: Z/3Z = 2; y: Z/2Z = 1; print x;`,
		out: `2`,
		err: false,
	},

	{
		name: `math_type_test15`,
		input: `x: Z/0Z;`,
		out: ``,
		err: true,
	},

	{
		name: `math_type_test16`,
		input: `x: Z/5Z = 3; y: Z/5Z = 4; print x+y;`,
		out: `2`,
		err: false,
	},

	{
		name: `math_type_test17`,
		input: `x: Z/5Z = 3; y: Z/5Z = 4; print x*y;`,
		out: `2`,
		err: false,
	},

	{
		name: `math_type_test18`,
		input: `tup: Z/5Z * Z/10Z = (3,9); print tup+tup;`,
		out: `(1,8)`,
		err: false,
	},

	{
		name: `math_type_test19`,
		input: `x: (Z/4Z)^3 = (1,2,3); print x+x;`,
		out: `(2,0,2)`,
		err: false,
	},

	{
		name: `math_type_test20`,
		input: `x: Z/3N = 4;`,
		out: ``,
		err: true,
	},

	{
		name: `math_type_test21`,
		input: `x: Z/3Z * Z/4Z = (2,3); print x*x;`,
		out: `(1,1)`,
		err: false,
	},

	{
		name: `math_type_test22`,
		input: `tup: Z/3Z^2*Z/14Z = ((3,5),24); print tup;`,
		out: `((0,2),10)`,
		err: false,
	},

	{
		name: `math_type_test23`,
		input: `x: Bool = true; print x;`,
		out: `true`,
		err: false,
	},

	{
		name: `math_type_test24`,
		input: `print true && false;`,
		out: `false`,
		err: false,
	},

	{
		name: `math_type_test25`,
		input: `print true || false;`,
		out: `true`,
		err: false,
	},

	{
		name: `math_type_test26`,
		input: `x: Bool = true; y: Bool = true; print x==y;`,
		out: `true`,
		err: false,
	},

	{
		name: `math_type_test27`,
		input: `x: Bool = true; y: Bool = false; print x==y;`,
		out: `false`,
		err: false,
	},

	{
		name: `math_type_test28`,
		input: `print true+false;`,
		out: `true`,
		err: false,
	},
	{
		name: `math_type_test28.1`,
		input: `print true*false;`,
		out: `false`,
		err: false,
	},

	{
		name: `math_type_test29`,
		input: `print true+true;`,
		out: `false`,
		err: false,
	},
	{
		name: `math_type_test29.1`,
		input: `print true*true;`,
		out: `true`,
		err: false,
	},

	{
		name: `math_type_test30`,
		input: `print false+true;`,
		out: `true`,
		err: false,
	},
	{
		name: `math_type_test30.1`,
		input: `print false*true;`,
		out: `false`,
		err: false,
	},

	{
		name: `math_type_test31`,
		input: `print false+false;`,
		out: `false`,
		err: false,
	},

	{
		name: `math_type_test31.1`,
		input: `print false*false;`,
		out: `false`,
		err: false,
	},
];
