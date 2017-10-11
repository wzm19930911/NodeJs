/*
socket中转服务
2017/7/28 by 墨子
*/
var Log = require("./../utils/log");
var Net = require("net");
var Netpkg = require("./netpkg");
var ws = require("ws");
var Proto_man = require("./proto_man");
var Service_manager = require("./service_manager.js");
var netbus = {
	start_tcp_server: start_tcp_server,
	start_ws_server: start_ws_server,
	// session_send: session_send,
	session_close: session_close,
    connect_tcp_server: connect_tcp_server,
};
//全局保存session
var global_session_list = {};
//初始从1开始往上加
var global_session_key = 1;
//session进来了
function on_session_entry(session, proto_type, is_ws,is_encrypt) {
    if (is_ws) {
        Log.info("client connected!\n port:" + session._socket.remotePort + "\nhost:" + session._socket.remoteAddress);
    } else {
        Log.info("client connected!\n port:" + session.remotePort + "\nhost:" + session.remoteAddress);
    }
    session.last_pkg = null; // 表示我们存储的上一次没有处理完的TCP包;
    session.is_ws = is_ws;
    session.proto_type = proto_type; //协议类型
    session.is_connected = true;       //是否已经连接
    session.is_encrypt = is_encrypt; //是否属于加密通道
    //扩展session的方法
    session.send_encoded_cmd = session_send_encoded_cmd; //发送带加密的
    session.send_cmd = session_send_cmd;  //发送cmd
    // 加入到session列表里面
    global_session_list[global_session_key] = session;
    session.session_key = global_session_key;
    global_session_key++;
    // end 
};
//session退出了
function on_session_exit(session) {
    Log.info("session exit!");
    if (global_session_list[session.session_key]) {
        global_session_list[session.session_key] = null;
        delete global_session_list[session.session_key]; // 把这个key, value从{}里面删除
        session.session_key = null;
        session.is_connected = false;
    }
};
// 一定能够保证是一个整包;
// 如果是json协议 str_or_buf json字符串;
// 如果是buf协议 str_or_buf Buffer对象;
function on_session_recv_cmd(session, str_or_buf) {
    Log.info(str_or_buf);
    if(!Service_manager.on_recv_client_cmd(session,str_or_buf)){
        session_close(session);
    }
}
// 发送命令  修改成了session的结构体的方法
function session_send_cmd(stype, ctype, body, utag, proto_type) {  //服务器类型 对应的操作 内容
    if(!this.is_connected){
        return;
    }
    var cmd = null;
    cmd = Proto_man.encode_cmd(utag,proto_type, stype, ctype, body);
    if (cmd) {
        this.send_encoded_cmd(cmd);
    }
    
}
//发送带加密的命令
function session_send_encoded_cmd(cmd){
    if (!this.is_connected) {
        return;
    }
    if(this.is_encrypt) {
        cmd = Proto_man.encrypt_cmd(cmd);   
    }
    if (!session.is_ws) { //如果不是websocket的话要先进行封包
        var data = Netpkg.packData(cmd);
        session.write(data);
        return;
    }
    else {
        session.send(cmd);
    }
}
// 关闭一个session
function session_close(session) {
    if (!session.is_ws) {
        session.end();
        return;
    }
    else {
        session.close();
    }
}
//添加客户端的监听
function tcp_add_client_session_event(session, proto_type,is_encrypt) {
    // client_sock.setEncoding("utf8"); //设置接收的格式
    session.on("close", function () {
        console.log("client leave");
    });
    session.on("error", function (err) {
        console.log("error", err);
    });
    //连接进来的的socket接收到了数据
    session.on("data", function (data) {

        if (!Buffer.isBuffer(data)) { // 不合法的数据
            session_close(session);
            return;
        }

        var last_pkg = client_sock.last_pkg;
        if (last_pkg != null) { //说明上次还有数据剩余
            var newbuf = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
            last_pkg = newbuf;
        } else {
            last_pkg = data;
        }
        var offset = 0;
        var pkglen = netpkg.readPkgSize(last_pkg, offset);
        if (pkglen < 0) {
            return;
        }
        while (offset + pkglen <= last_pkg.length) {//是否有一个完整的包
            var cmd_buf;
            // 收到了一个完整的数据包
            cmd_buf = Buffer.allocUnsafe(pkg_len - 2); // 2个长度信息
            last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkglen);
            on_session_recv_cmd(session, cmd_buf);
  
            offset += pkglen; //偏移到下一个位置
            if (offset >= last_pkg.length) { //包刚好收完
                break;
            }
            pkglen = netpkg.readPkgSize(last_pkg, offset);
            if (pkglen < 0) {
                break;
            }
        }
        if (offset >= last_pkg.length) { //刚好收完包，剩下的为null
            last_pkg = null;
        } else { //剩下的存放进去下次处理
            var last_data = Buffer.allocUnsafe(last_pkg.length - offset);
            last_pkg.copy(last_data, 0, offset, last_pkg.length);
            last_pkg = last_data;
        }
        client_sock.last_pkg = last_pkg;
    });
    on_session_entry(session, proto_type, false,is_encrypt);
}
//开始一个tcp服务器
function start_tcp_server(ip, port, prototype,is_encrypt) {
    Log.info("start tcp server..", ip, port);
    var server = Net.createServer(function (session) {
        tcp_add_client_session_event(session, prototype,is_encrypt);//监听客户端事件
    });
    //监听在端口
    server.listen({  //option 对象集
        port: port,
        host: ip,
        exclusive: true,
    });
    //服务器出错
    server.on("error", function () {
        Log.error("server Listen error!");
    });
    //服务器关闭
    server.on("close", function () {
        Log.error("server close!");
    });
}
// -------------------------
function isString(obj){ //判断对象是否是字符串  
	return Object.prototype.toString.call(obj) === "[object String]";  
}  
//websocket监听
function ws_add_client_session_event(session, prototype,is_encrypt) {
	// close事件
	session.on("close", function() {
		on_session_exit(session);
	});
	// error事件
	session.on("error", function(err) {
	});
	// end 
	session.on("message", function(data) {
		if (session.proto_type == Proto_man.PROTO_JSON) {
			if (!isString(data)) {
				session_close(session);
				return;
			}
			on_session_recv_cmd(session, data);
		}
		else {
			if (!Buffer.isBuffer(data)) {
				session_close(session);
				return;
			}
			on_session_recv_cmd(session, data);	
		}	
	});
	// end
	on_session_entry(session, prototype, true,is_encrypt); 
}

//开启一个ws服务器
function start_ws_server(ip, port, prototype,is_encrypt) {
    Log.info("start ws server..", ip, port);
    var server = new ws.Server({
        host: ip,
        port: port,
    });
    //客户端进入
    function on_server_client_comming(client_sock) {
        ws_add_client_session_event(client_sock, prototype,is_encrypt);
    }
    server.on("connection", on_server_client_comming);
    //监听出错
    function on_server_listen_error(err) {
        log.error("ws server listen error!!");
    }
    server.on("error", on_server_listen_error);
    //关闭
    function on_server_listen_close(err) {
        log.error("ws server listen close!!");
    }
    server.on("close", on_server_listen_close);
}
//-------------------------其他的服务器---------------------
// session成功接入服务器
var server_connect_list = {};
//成功连接
function on_session_connected(stype, session, proto_type, is_ws, is_encrypt) {
    if (is_ws) {
        Log.info("client connected!\n port:" + session._socket.remotePort + "\nhost:" + session._socket.remoteAddress);
    } else {
        Log.info("client connected!\n port:" + session.remotePort + "\nhost:" + session.remoteAddress);
    }
    session.last_pkg = null; // 表示我们存储的上一次没有处理完的TCP包;
    session.is_ws = is_ws;
    session.proto_type = proto_type; //协议类型
    session.is_connected = true;       //是否已经连接
    session.is_encrypt = is_encrypt; //是否属于加密通道
    //扩展session的方法
    session.send_encoded_cmd = session_send_encoded_cmd; //发送带加密的
    session.send_cmd = session_send_cmd;  //发送cmd
    // 加入到session列表里面
    server_connect_list[stype] = session;
    session.session_key = stype;
    // end 
}
//失去连接
function on_session_disconnect(session){
    Log.info("server session disconnect!");
    var stype = session.session_key;
    session.is_connected = false;
    session.last_pkg = null; 
    session.session_key = null;
    if (server_connect_list[stype]) {
        server_connect_list[stype] = null;
        delete server_connect_list[stype]; // 把这个key, value从{}里面删除
    }
}
function on_recv_cmd_server_return(session, str_or_buf) {
    if(!Service_manager.on_recv_server_return(session, str_or_buf)) {
        session_close(session);
    }
}
//连接到其他服务
function connect_tcp_server(stype,host,port,protopyte,is_encrypt){
    var session = Net.connect({
        port: port,
        host: host,
    });
    session.is_connected = false;
    session.on("connect",function() {
        on_session_connected(stype, session, protopyte, false, is_encrypt);
    });
    session.on("close", function() {
        if (session.is_connected === true) {
            on_session_disconnect(session); 
        }
        session.end();
        // 重新连接到服务器
        setTimeout(function() {
            Log.warn("reconnect: ", stype, host, port, protopyte, is_encrypt);
            connect_tcp_server(stype, host, port, protopyte, is_encrypt);
        }, 3000);
        // end 
    });
    session.on("data", function (data) {

        if (!Buffer.isBuffer(data)) { // 不合法的数据
            session_close(session);
            return;
        }

        var last_pkg = client_sock.last_pkg;
        if (last_pkg != null) { //说明上次还有数据剩余
            var newbuf = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
            last_pkg = newbuf;
        } else {
            last_pkg = data;
        }
        var offset = 0;
        var pkglen = netpkg.readPkgSize(last_pkg, offset);
        if (pkglen < 0) {
            return;
        }
        while (offset + pkglen <= last_pkg.length) {//是否有一个完整的包
            var cmd_buf;
            // 收到了一个完整的数据包
            cmd_buf = Buffer.allocUnsafe(pkg_len - 2); // 2个长度信息
            last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkglen);
            on_recv_cmd_server_return(session, cmd_buf);

            offset += pkglen; //偏移到下一个位置
            if (offset >= last_pkg.length) { //包刚好收完
                break;
            }
            pkglen = netpkg.readPkgSize(last_pkg, offset);
            if (pkglen < 0) {
                break;
            }
        }
        if (offset >= last_pkg.length) { //刚好收完包，剩下的为null
            last_pkg = null;
        } else { //剩下的存放进去下次处理
            var last_data = Buffer.allocUnsafe(last_pkg.length - offset);
            last_pkg.copy(last_data, 0, offset, last_pkg.length);
            last_pkg = last_data;
        }
        client_sock.last_pkg = last_pkg;
    });

    session.on("error", function(err) {
        
    });


}

module.exports = netbus;