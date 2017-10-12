/*
游戏配置
2017/10/11 by 墨子
*/
var Stype = require("./Stype.js");
var game_config = {
    gateway_config:{
    	host: "127.0.0.1",
		posts: [6080, 6081],
    },
    center_server: {
        host: "127.0.0.1",
        post: 6084,
        stypes: [Stype.Auth],
    },
    center_database:{
        host: "127.0.0.1",
        port: 3306,
        dbname: "hg_center",
        uname: "root",
        upwd: "15606056961"
    },
    game_server: {
        0: {
        	stype: Stype.Auth,
        	host: "127.0.0.1",
        	port: 6084,
        },
    }

}
module.exports = game_config;