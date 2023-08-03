# compiles .pegjs files
# peggy --format es --trace .\src\js\parser\parser.pegjs
peggy --format es .\src\js\parser\parser.pegjs

$JSImport1 = 'import * as AST from "../ast/asts.js";'
$JSImport2 = 'import * as UTIL from "../utils.js";'

$Cont = Get-Content -Path .\src\js\parser\parser.js
Clear-Content -Path .\src\js\parser\parser.js
Add-Content -Path .\src\js\parser\parser.js -Value $JSImport1
Add-Content -Path .\src\js\parser\parser.js -Value $JSImport2
Add-Content -Path .\src\js\parser\parser.js -Value $Cont
