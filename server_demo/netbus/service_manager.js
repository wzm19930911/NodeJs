/*
服务管理模块
2017/8/1 by 墨子
*/
var Log = require("../utils/log.js");
var Proto_man = require("./proto_man");

//保存所有的服务
var service_modules = {};
//注册服务
function register_service(stype, service) {
	if (service_modules[stype]) {
		Log.warn(service_modules[stype].name + " service is registed !!!!");
	}
	service_modules[stype] = service;
	service.init();
}
//接收到消息进行分发
function on_recv_client_cmd(session, str_or_buf) {
	//解码解出对象
	var cmd = Proto_man.decode_cmd(session.proto_type, str_or_buf);
	if (!cmd) {
		return false;
	}
	var stype, ctype, body;
	stype = cmd[0];
	ctype = cmd[1];
	body = cmd[2];
	if (service_modules[stype]) {
		service_modules[stype].on_recv_player_cmd(session, ctype, body);
	}
	return true;
}
//玩家掉线了
function on_client_lost_connect(session) {
	// 遍历所有的服务模块通知在这个服务上的这个玩家掉线了
	for (var key in service_modules) {
		service_modules[key].on_player_disconnect(session);
	}
}
var service_manager = {
	on_client_lost_connect: on_client_lost_connect,
	on_recv_client_cmd: on_recv_client_cmd,
	register_service: register_service,
};
module.exports = service_manager;