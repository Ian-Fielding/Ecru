export let parseTests = [
    {
        name: 'parse_test1',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test2',
        input: 'x: Integer;',
        expected: 'Program(DeclStmt(x,IntType()))',
    }, {
        name: 'parse_test3',
        input: 'x;',
        expected: 'Program(x)',
    }, {
        name: 'parse_test4',
        input: 'x;y;    \n \n \t \n z \t \t;  \t\t\t\t\t\t\t',
        expected: 'Program(x,y,z)',
    }, {
        name: 'parse_test5',
        input: 'x = 3;',
        expected: 'Program(AssignStmt(x,3))',
    }, {
        name: 'parse_test6',
        input: '\nxz : String\n   \t = 3+4;',
        expected: 'Program(DeclStmt(xz,StrType()),AssignStmt(xz,add(3,4)))',
    }, {
        name: 'parse_test7',
        input: 'x',
        expected: 'Error',
    }, {
        name: 'parse_test8',
        input: '3*x*x+4*y-3*x-4;',
        expected: 'Program(sub(sub(add(mul(mul(3,x),x),mul(4,y)),mul(3,x)),4))',
    }, {
        name: 'parse_test9',
        input: 'print\nx;',
        expected: 'Program(PrintStmt(x))',
    }, {
        name: 'parse_test10',
        input: '\n\n\npprint(x+x);',
        expected: 'Program(PrettyPrintStmt(add(x,x)))',
    }, {
        name: 'parse_test11',
        input: '\n  // This is a test \nx: Z;',
        expected: 'Program(CommentStmt("This is a test"),DeclStmt(x,IntType()))',
    }, {
        name: 'parse_test12',
        input: 'if(x){}',
        expected: 'Program(DeclStmt(x,IntType()),AssignStmt(x,3),IfStmt(x,PrintStmt("test")))',
    }, {
        name: 'parse_test13',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test14',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test15',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test16',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test17',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test18',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test19',
        input: '',
        expected: 'Program()',
    }, {
        name: 'parse_test20',
        input: '',
        expected: 'Program()',
    },
];
