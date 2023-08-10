const express = require("express");
const { exec } = require('child_process');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');


const app = express();
const port = 5000;
let srcDir = path.join(__dirname, 'src');

app.use('/projects/ecru', express.static(srcDir));
app.use(express.json());

// set up rate limiter: maximum of twenty requests per minute
app.use(rateLimit({
	windowMs: 1*60*1000, // 1 minute
	max: 20
}));

app.listen(port, function() {
	console.log(`App listening at http://localhost:${port}`);
});



app.get("/",function(req,res){
	res.sendFile(__dirname+"/src/index/index.html");
});


function onCompile(error,stdout,stderr){
	if(error || stderr.length!=0){
		console.error(`Error! ${error ? error.message : ""}\n${stderr}\n${stdout}`);

	}else
		console.log("Success!");
	
}


let time=Date.now();
fs.watch(srcDir, { recursive: true }, function(eventType, filename){
	let newTime=Date.now();
	let diff=newTime-time;
	time=newTime;

	if (diff>300 && eventType == "change") {

		if(filename.endsWith(".ts")){
			console.log(`Starting compilation of ${filename}...`);
			exec(`tsc`, onCompile);
		}else if(filename.endsWith(".pegjs")){
			console.log(`Starting compilation of ${filename}...`);
			exec(`.\\generateParsers.ps1`, {'shell':'powershell.exe'}, onCompile);
		}
	}
});
