const express = require("express");
const app = express();
const port = 5000;
const path = require('path')
app.use('/projects/ecru', express.static(path.join(__dirname, 'src')));
app.use(express.json());

app.listen(port, function() {
    console.log(`App listening at http://localhost:${port}`);
});

app.get("/",function(req,res){
    res.sendFile(__dirname+"/src/index/index.html");
});

/*
[
    "style.css",
    "asts.js",
    "parser.js",
    "arithmetic.js"
].forEach(function(com){
    app.get(`/ecruHelpers/${com}`,function(req,res){
        res.sendFile(__dirname+`/ecruHelpers/${com}`);
    });
});*/