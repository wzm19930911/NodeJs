/*
登录服务
2017/8/1 by 墨子
*/
var service = {
	stype: 1, //服务号
	name: "service login", //服务名称

	//初始化服务
	init: function () {
			
	},

	//接收玩家消息
	on_recv_player_cmd: function(session, ctype, body) {
	},

	//玩家掉线
	on_player_disconnect: function(session) {
	},
};

module.exports = service;