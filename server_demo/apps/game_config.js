/*
游戏配置
2017/10/11 by 墨子
*/
var Stype = require("./Stype.js");
var game_config = {
    gateway_config:{
    	host: "127.0.0.1",
    	posts: [6080,6081,6082,6083],
    },
    game_server: {
        0: {
        	stype: Stype.Auth,
        	host: "127.0.0.1",
        	port: 6084,
        },
        1: {
        	stype: Stype.System,
        	host: "127.0.0.1",
        	port: 6085,
        },
        2: {
        	stype: Stype.TalkRoom,
        	host: "127.0.0.1",
        	port: 6086,
        },

    }

}
module.exports = game_config;