/*
消息转发服务
2017/10/12 by 墨子
*/
var Netbus = require("../../netbus/netbus.js");
var Proto_tools = require("../../netbus/proto_tools.js");
var Proto_man = require("../../netbus/proto_man.js");
var Log = require("../../utils/log.js");
var Respones = require("../Respones.js");
var Cmd = require("../Cmd.js");
var Stype = require("../Stype.js");

function is_login_cmd(stype, ctype) {
	if (stype == Stype.Auth && ctype == Cmd.Auth.GUEST_LOGIN) {
		return true;
	}
	return false;
}
var uid_session_map = {}; //session容器
//获取session By uid
function get_session_by_uid(uid) {
	return uid_session_map[uid];
}
//保存session
function save_session_with_uid(uid, session, proto_type) {
	uid_session_map[uid] = session;
	session.proto_type = proto_type;
}
//清除session
function clear_session_with_uid(uid) {
	uid_session_map[uid] = null;
	delete uid_session_map[uid];
}
var service = {
	name: "gw_service", // 服务名称
	is_transfer: true, // 是否为转发模块,

	// 收到客户端给我们发来的数据
	on_recv_player_cmd: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
		Log.info(raw_cmd);
		var server_session = Netbus.get_server_session(stype);
		if (!server_session) {
			return;
		}
		// 打入能够标识client的utag, uid, session.session_key,
		if(is_login_cmd(stype, ctype)) {
			utag = session.session_key;	
		}else{
			if(session.uid === 0) { // 没有登陆，发送了非法的命令
				return;
			}
			utag = session.uid;
		}
		Proto_tools.write_utag_inbuf(raw_cmd, utag);
		// end 
		server_session.send_encoded_cmd(raw_cmd);
	},

	// 收到我们连接的服务给我们发过来的数据;
	on_recv_server_return: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
		Log.info(raw_cmd);
		var client_session;
		if (is_login_cmd(stype, ctype)) {
			client_session = Netbus.get_client_session(utag);
			if (!client_session) {
				return;
			}
			var cmd_ret = Proto_man.decode_cmd(proto_type, stype, ctype, raw_cmd);
			body = cmd_ret[2];
			if (body.status == Respones.OK) {
				// 以前你登陆过,发送一个命令给这个客户端，告诉它说以前有人登陆
				var prev_session = get_session_by_uid(body.uid);
				if (prev_session) {
					prev_session.send_cmd(stype, Cmd.Auth.RELOGIN, null, 0, prev_session.proto_type);
					prev_session.uid = 0; // 可能回有隐患，是否通知其它的服务
					Netbus.session_close(prev_session);
				}
				client_session.uid = body.uid;
				save_session_with_uid(body.uid, client_session, proto_type);
				body.uid = 0;
				raw_cmd = Proto_man.encode_cmd(utag, proto_type, stype, ctype, body);
			}
		}
		else { // utag is uid
			client_session = get_session_by_uid(utag);
			if (!client_session) {
				return;
			}
		}
		Proto_tools.clear_utag_inbuf(raw_cmd);
		client_session.send_encoded_cmd(raw_cmd);
	},

	// 收到客户端断开连接;
	on_player_disconnect: function (stype, session) {
		if (stype == Stype.Auth) { // 由Auth服务保存的，那么我们就由Auth清空
			clear_session_with_uid(uid);
		}
		var server_session = Netbus.get_server_session(stype);
		if (!server_session) {
			return;
		}

		var utag = session.session_key;
		server_session.send_cmd(stype, Cmd.USER_DISCONNECT, null, utag, Proto_man.PROTO_JSON);
	},
};

module.exports = service;
