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
}

//接收到消息进行分发
function on_recv_client_cmd(session, cmd_buf) {
	if (session.is_encrypt) {
		cmd_buf = Proto_man.decrypt_cmd(cmd_buf);	
	}
	var stype, ctype, body , utag , proto_type; 
	//解码解出对象
	var cmd = Proto_man.decode_cmd_header(cmd_buf);
	if (!cmd) {
		return false;
	}
	stype = cmd[0]; 
	ctype = cmd[1]; 
	utag = cmd[2];
	proto_type = cmd[3];
	if (!service_modules[stype]) {
		return false;
	}
	if (service_modules[stype].is_transfer) {
		service_modules[stype].on_recv_player_cmd(session,stype,ctype,null,utag,proto_type,cmd_buf);
		return true;
	}
	var cmd = Proto_man.decode_cmd(proto_type, stype, ctype, cmd_buf);
	if (!cmd) {
		return false;
	}
	// end 
	body = cmd[2];
	service_modules[stype].on_recv_player_cmd(session,stype,ctype,body,utag,proto_type,cmd_buf);
	return true;
}
//玩家掉线了
function on_client_lost_connect(session) {
	// 遍历所有的服务模块通知在这个服务上的这个玩家掉线了
	for (var key in service_modules) {
		service_modules[key].on_player_disconnect(session);
	}
}
function  on_recv_server_return (session, cmd_buf) {
	// 根据我们的收到的数据解码我们命令
	if (session.is_encrypt) {
		cmd_buf = Proto_man.decrypt_cmd(cmd_buf);	
	}
	var stype, ctype, body,utag , proto_type;   

	var cmd = Proto_man.decode_cmd_header(cmd_buf);
	if (!cmd) {
		return false;
	}
	stype = cmd[0]; 
	ctype = cmd[1]; 
	utag = cmd[2];
	proto_type = cmd[3];
	if (service_modules[stype].is_transfer) {
		service_modules[stype].on_recv_server_return(session, stype, ctype, null,utag,cmd_buf);
		return true;
	}
	var cmd = Proto_man.decode_cmd(proto_type, stype, ctype, cmd_buf);
	if (!cmd) {
		return false;
	}
	body = cmd[2];
	service_modules[stype].on_recv_server_return(session,stype,ctype,body,utag,proto_type,cmd_buf);
	return true;
}
var service_manager = {
	on_client_lost_connect: on_client_lost_connect,
	on_recv_client_cmd: on_recv_client_cmd,  //客户端返回
	on_recv_server_return: on_recv_server_return, //服务器返回
	register_service: register_service,
};
module.exports = service_manager;