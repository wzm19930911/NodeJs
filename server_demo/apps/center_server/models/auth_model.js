/*
账号验证模型
2017/10/12 by 墨子
*/
var Respones = require("../../Respones.js");
var Utils = require("../../../utils/Utils.js");
var mysql_center = require("../../../database/mysql_center");

//游客登录成功
function guest_login_success(data, ret_func) {
    var ret = {};
    ret.status = status;
    ret.uid = data.uid;
    ret.unick = data.unick;
    ret.usex = data.usex;
    ret.uface = data.uface;
    ret.uvip = data.uvip;
    ret.ukey = data.guest_key;
    ret_func(ret);
}
//输出一个错误
function write_err(status, ret_func) {
    var ret = {};
    ret.status = status;
    ret_func(ret);
}
function guest_login(ukey, ret_func) {
    var ret = {};
    var unick = "游客" + Utils.randomIntStr(5);
    var usex = Utils.randomInt(0, 1);
    var uface = 0;
    //写入数据库
    mysql_center.get_guest_uinfo_by_ukey(ukey, function (status, data) {
        if (status != Respones.OK) {
            write_err(status, ret_func);
            return;
        }
        if (data.length <= 0) { //没有查到ukey,注册一个
            mysql_center.insert_guest_user(unick, uface, usex, ukey, function (status) {
                if (status != Respones.OK) {
                    write_err(status, ret_func);
                    return;
                }
                //重新查询
               guest_login(ukey, ret_func);
            });
        } else {
            if (data.status != 0) {
                write_err(Respones.INVAILD_ACCOUNT, ret_func);
                return;
            }
            guest_login_success(data, ret_func);
        }
    })

    ret.status = Respones.OK;
    ret.unick = unick;
    ret.usex = usex;
    ret.ukey = ukey;
    return ret;
}
module.exports = {
    guest_login: guest_login,


}