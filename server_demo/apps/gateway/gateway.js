/*
网关服务
2017/10/11 by 墨子
*/
require("../../init.js");

var Proto_man = require("../../netbus/proto_man.js");
var Netbus = require("../../netbus/netbus.js");
var Game_config = require("../game_config.js");
var Service_manager = require("../../netbus/service_manager.js");

var host = Game_config.gateway_config.host;
var posts = Game_config.gateway_config.posts;
//tcpsocket
Netbus.start_tcp_server(host, posts[0], Proto_man.PROTO_BUF, true);
Netbus.start_tcp_server(host, posts[1], Proto_man.PROTO_JSON, true);
//websocket
Netbus.start_ws_server(host, posts[2], Proto_man.PROTO_JSON, true);
Netbus.start_ws_server(host, posts[3], Proto_man.PROTO_BUF, true);

//连接我们的服务器
var game_server = Game_config.game_server;
for(var key in game_server){
	Netbus.connect_tcp_server(game_server[key].stype,game_server[key].host,game_server[key].port,Proto_man.PROTO_BUF,false);
}