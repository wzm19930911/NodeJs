/*
消息转发服务
2017/10/12 by 墨子
*/
var Netbus = require("../../netbus/netbus.js");
var Proto_tools = require("../../netbus/proto_tools.js");
var Proto_man = require("../../netbus/proto_man.js");
var Log = require("../../utils/log.js");

var Cmd = require("../Cmd.js");

var service = {
	name: "gw_service", // 服务名称
	is_transfer: true, // 是否为转发模块,

	// 收到客户端给我们发来的数据
	on_recv_player_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd) {
		Log.info(raw_cmd);
		var server_session = Netbus.get_server_session(stype);
		if (!server_session) {
			return;
		}
		// 打入能够标识client的utag, uid, session.session_key,
		utag = session.session_key;
		Proto_tools.write_utag_inbuf(raw_cmd, utag);
		// end 
		server_session.send_encoded_cmd(raw_cmd);
	},

	// 收到我们连接的服务给我们发过来的数据;
	on_recv_server_return: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
		Log.info(raw_cmd);
		var client_session = Netbus.get_client_session(utag);
		if (!client_session) {
			return;
		}

		Proto_tools.clear_utag_inbuf(raw_cmd);
		client_session.send_encoded_cmd(raw_cmd);
	}, 

	// 收到客户端断开连接;
	on_player_disconnect: function(stype, session) {
		var server_session = Netbus.get_server_session(stype);
		if (!server_session) {
			return;
		}

		var utag = session.session_key;
		server_session.send_cmd(stype, Cmd.USER_DISCONNECT, null, utag, Proto_man.PROTO_JSON);
	},
};

module.exports = service;
