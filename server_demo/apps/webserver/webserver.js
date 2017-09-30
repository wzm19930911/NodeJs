var Express = require("express");
var path = require("path");

if (process.argv.length < 3) {
	console.log("input webserver.js port");
	return;
}
var app = Express();
var port = parseInt(process.argv[2]);
//变更你nodejs当前进程的工作路径
process.chdir("./apps/webserver");
console.log(process.cwd());
//添加指定的地址
app.use(Express.static(path.join(process.cwd(), "www_root")));
app.listen(port);

console.log("webserver started at port " + port);