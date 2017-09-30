var netpkg = {
    //读取包的大小
    readPkgSize: function (last_pkg, offset) {
        if (offset > last_pkg.length - 2) {
            return -1;
        }
        var len = last_pkg.readInt16LE(offset);
        return len;
    },
    //接收到数据
    onRecvData: function (data, client_sock) {
        var last_pkg = client_sock.last_pkg;
        if (last_pkg!= null) { //说明上次还有数据剩余
            var newbuf = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
            last_pkg = newbuf;
        } else {
            last_pkg = data;
        }
        var offset = 0;
        var pkglen = netpkg.readPkgSize(last_pkg,offset);
        if (pkglen < 0) {
			return;
		}
        while (offset + pkglen <= last_pkg.length) {//是否有一个完整的包
            var recv_data = Buffer.allocUnsafe(pkglen - 2);
            last_pkg.copy(recv_data, 0, offset + 2, offset + pkglen); //读取一个包
            console.log("收到一个完整的数据"+recv_data);
            console.log("原始数据转Utf8"+recv_data.toString("utf8"));
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
            console.log("1");
        }
        client_sock.last_pkg = last_pkg;
    },

    //发送数据打包
    packData: function (data) {
        var send_buf = Buffer.allocUnsafe(2 + data.length);
        send_buf.writeInt16LE(2 + data.length, 0);
        send_buf.fill(data, 2);
        return send_buf;
    },
    // 模拟底层TCP 粘包的问题
	test_pkg_two_action: function(action1, action2) {
		var buf = Buffer.allocUnsafe(2 + 2 + action1.length + action2.length);
		buf.writeInt16LE(2 + action1.length, 0);
		buf.fill(action1, 2);

		var offset = 2 + action1.length;
		buf.writeInt16LE(2 + action2.length, offset);
		buf.fill(action2, offset + 2);

		return buf
	},
	// 模拟的一个大的数据包，分两次发送到客户端;
	// one cmd half_cmd + half_cmd2
	test_pkg_two_slice: function(half_cmd1, half_cmd2) {
		// 
		var buf1 = Buffer.allocUnsafe(2 + half_cmd1.length);
		buf1.writeInt16LE(2 + half_cmd1.length +　half_cmd2.length, 0);
		buf1.fill(half_cmd1, 2);

		var buf2 = Buffer.allocUnsafe(half_cmd2.length);
		buf2.fill(half_cmd2, 0);

		return [buf1, buf2];
	}


};
module.exports = netpkg;