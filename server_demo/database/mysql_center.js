/*
游戏中心数据库连接
2017/10/11 by 墨子
*/
var Mysql = require("mysql");

var conn_pool = null;
function connect_to_center(host, port, db_name, uname, upwd) {
	var conn_pool = Mysql.createPool({
		host: host, // 数据库服务器的IP地址
		port: port, // my.cnf指定了端口，默认的mysql的端口是3306,
		database: db_name, // 要连接的数据库
		user: uname,
		password: upwd,
	});
}

module.exports = {
	connect: connect_to_center,
};