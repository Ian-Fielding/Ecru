const express = require("express");
const app = express();
const port = 5000;
app.use(express.json());
const path = require('path');

app.use('/projects/ecru', express.static(path.join(__dirname, '/')));
app.use('/node', express.static(path.join(__dirname, 'node_modules')));

app.get("/",function(req,res){
    res.sendFile(__dirname+"/index.html");
});


app.get('*', function(req, res){
    res.status(404).send("404 Error! You aren't supposed to be here :)");
});

app.listen(port, function() {
    console.log(`App listening at http://localhost:${port}`);
});

