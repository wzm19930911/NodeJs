/*
游戏中心服务
2017/10/12 by 墨子
*/
require("../../init.js");
var Proto_man = require("../../netbus/proto_man.js");
var Netbus = require("../../netbus/netbus.js");
var Game_config = require("../game_config.js");
var Service_manager = require("../../netbus/service_manager.js");
var Stype = require("../Stype.js");
var Auth_service = require("./auth_service.js");
var Mysql_center = require("../../database/mysql_center.js");
var center  = Game_config.center_server;
Netbus.start_tcp_server(center.host,center.post, false);

Service_manager.register_service(Stype.Auth,Auth_service);
//连接中心数据库
Mysql_center.connect();

