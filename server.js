const express = require("express");
const app = express();
const port = 5000;
const path = require('path')
app.use('/static', express.static(path.join(__dirname, 'homepage')));
app.use(express.json());

app.listen(port, function() {
    console.log(`App listening at http://localhost:${port}`);
});

app.get("/",function(req,res){
    res.sendFile(__dirname+"/index.html");
});

[
    "style.css",
    "asts.js",
    "parser.js"
].forEach(function(com){
    app.get(`/ecruHelpers/${com}`,function(req,res){
        res.sendFile(__dirname+`/ecruHelpers/${com}`);
    });
});