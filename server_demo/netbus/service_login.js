/*
登录服务
2017/8/1 by 墨子
*/
var service = {
	stype: 1, //服务号
	name: "service login", //服务名称
	is_transfer: false, // 是否为转发模块,
	//初始化服务
	init: function () {
			
	},

	// 每个服务收到数据的时候调用
	on_recv_player_cmd: function(session, ctype, body, raw_cmd) {
	},

	//玩家掉线
	on_player_disconnect: function(session) {
	},
};

module.exports = service;