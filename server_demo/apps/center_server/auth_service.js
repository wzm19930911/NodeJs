/*
账号验证
2017/10/12 by 墨子
*/
var Log = require("../../utils/log.js");
var Cmd = require("../Cmd.js");
var Stype = require("../Stype.js");
var Respones = require("../Respones.js");
var Auth_model = require("./models/auth_model.js");
function guest_login(session, body, utag, proto_type) {
	if (!body) {
		session.send_cmd(Stype.Auth, Cmd.Auth.GUEST_LOGIN, Respones.INVAILD_PARAMS, utag, proto_type);
		return;
	}
	Log.info("转发2");
	var ukey = body;
	Log.info("转发2+"+ukey);
	Auth_model.guest_login(ukey, function (ret) {
		Log.info(ret);
		session.send_cmd(Stype.Auth, Cmd.Auth.GUEST_LOGIN, ret, utag, proto_type);
		return;
	});
	Log.info("转发3");
}


var service = {
	name: "auth_service", // 服务名称
	is_transfer: false, // 是否为转发模块,

	// 收到客户端给我们发来的数据
	on_recv_player_cmd: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
		Log.info(stype, ctype, body);
		switch (ctype) {
			case Cmd.Auth.GUEST_LOGIN: {
				Log.info("转发");
				guest_login(session, body, utag, proto_type);
				break;
			}
		}
	},

	// 收到我们连接的服务给我们发过来的数据;
	on_recv_server_return: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
		Log.info(stype, ctype, body);
	},

	// 收到客户端断开连接;
	on_player_disconnect: function(stype, session) {
	},
};

module.exports = service;
