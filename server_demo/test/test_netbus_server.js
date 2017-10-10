require("../init.js");

var proto_man = require("../netbus/proto_man.js");
var netbus = require("../netbus/netbus.js");
var service_manager = require("../netbus/service_manager.js");
//var talk_room = require("./talk_room");

netbus.start_tcp_server("127.0.0.1", 6080, proto_man.PROTO_BUF, false);
netbus.start_tcp_server("127.0.0.1", 6081, proto_man.PROTO_JSON, false);

netbus.start_ws_server("127.0.0.1", 6082, proto_man.PROTO_JSON, false);
netbus.start_ws_server("127.0.0.1", 6083, proto_man.PROTO_BUF, false);

//service_manager.register_service(1, talk_room);

