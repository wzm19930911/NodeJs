var Netbus = require("../netbus/netbus");
var Proto_man = require("../netbus/proto_man");
var Service_manager = require("./service_manager.js");

//创建一个websocket服务器
Netbus.start_ws_server("127.0.0.1",8080,Proto_man.PROTO_JSON);

