/*
游戏中心数据库连接
2017/10/11 by 墨子
*/
var Mysql = require("mysql");
var util = require('util')
var Respones = require("../apps/Respones.js");
var conn_pool = null;
var Log = require("../utils/log.js")
function connect_to_center(host, port, db_name, uname, upwd) {
	conn_pool = Mysql.createPool({
		host: host, // 数据库服务器的IP地址
		port: port, // my.cnf指定了端口，默认的mysql的端口是3306,
		database: db_name, // 要连接的数据库
		user: uname,
		password: upwd,
	});
}
function mysql_exec(sql, callback) {
	conn_pool.getConnection(function (err, conn) {
		if (err) { // 如果有错误信息
			if (callback) {
				Log.error(err);
				callback(err, null, null);
			}
			return;
		}
		conn.query(sql, function (sql_err, sql_result, fields_desic) {
			conn.release(); // 忘记加了
			if (sql_err) {
				if (callback) {
					Log.error(sql_err);
					callback(sql_err, null, null);

				}
				return;
			}
			if (callback) {
				callback(null, sql_result, fields_desic);
			}
		});
	});
}
//获取游客信息通过unkey
function get_guest_uinfo_by_ukey(ukey, callback) {
	var sql = "select uid,unick,usex,uface,uvip,status from uinfo where guest_key =\"%s\"";
	var sql_cmd = util.format(sql, ukey);
	mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR, null);
			return;
		}
		callback(Respones.OK, sql_ret);
	})
}
//插入一条游客信息
function insert_guest_user(unick, uface, usex, ukey, callback) {
	var sql = "insert into uinfo(`uface`,`unick`,`usex`,`guest_key`,`is_guest`)values(%d,\"%s\",%d,\"%s\",1)";
	var sql_cmd = util.format(sql,uface,unick,usex,ukey);
	Log.info(sql_cmd);
	mysql_exec(sql_cmd, function (err, sql_ret, fields_desic) {
		if (err) {
			callback(Respones.SYSTEM_ERR);
			return;
		}
		callback(Respones.OK);
	})
}
module.exports = {
	connect: connect_to_center,
	get_guest_uinfo_by_ukey: get_guest_uinfo_by_ukey,
	insert_guest_user: insert_guest_user,
};