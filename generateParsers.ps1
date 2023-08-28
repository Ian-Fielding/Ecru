# compiles .pegjs files
# peggy --format es --trace .\src\js\parser\parser.pegjs
if(Test-Path .\src\js\parser.js){
    Remove-Item .\src\js\parser.js
}

peggy --format es .\src\ts\parser.pegjs

Move-Item -Path .\src\ts\parser.js -Destination .\src\js\parser.js

$JSImport1 = 'import * as AST from "./ast/asts.js";'
$JSImport2 = 'import * as UTIL from "./utils.js";'
$JSImport3 = 'import * as MATH from "./ast/math.js";'

$Cont = Get-Content -Path .\src\js\parser.js
Clear-Content -Path .\src\js\parser.js
Add-Content -Path .\src\js\parser.js -Value $JSImport1
Add-Content -Path .\src\js\parser.js -Value $JSImport2
Add-Content -Path .\src\js\parser.js -Value $JSImport3
Add-Content -Path .\src\js\parser.js -Value $Cont
