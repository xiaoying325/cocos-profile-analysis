var game_config = require("../game_config.js");
var express = require("express");
var path = require("path");
var fs = require("fs");
var util = require('util')


var log = require("../../utils/log.js");
// 连接中心redis


var app = express();
//设置跨域访问
// app.all('*', function (req, res, next) {
// 	res.header("Access-Control-Allow-Origin", "*");
// 	res.header("Access-Control-Allow-Headers", "X-Requested-With");
// 	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
// 	res.header("X-Powered-By", ' 3.2.1');
// 	res.header("Content-Type", "application/json;charset=utf-8");
// 	//OPTIONS 请求是浏览器在发起跨域请求之前发送的预检请求，用于检查服务器是否支持跨域请求
// 	//如果是预检请求，那就快点结束它，直接发200，表示预检成功
// 	if (req.method.toLowerCase() == 'options')
// 		res.send(200);
// 	else
// 		next();
// });


app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", '3.2.1');

    // 只对 API 设置 json 类型，静态资源交给 express.static 处理
    if (req.path.startsWith("/api")) {
        res.header("Content-Type", "application/json;charset=utf-8");
    }
    if (req.method.toLowerCase() == 'options')
        res.sendStatus(200);
    else
        next();
});

// end

var host = game_config.webserver.host;
var port = game_config.webserver.port;

// process.chdir("./apps/webserver");
// console.log(process.cwd());

//创建webserver的根目录
//www_root webserver的静态网页目录
if (fs.existsSync("www_root")) {
	app.use(express.static(path.join(process.cwd(), "www_root")));
}
else {
	log.warn("www_root is not exists!!!!!!!!!!!");
}


log.info("webserver started at port ", host, port);

//先用本地测试
app.get("/:action", function (request, response) {
	var action = request.params.action;
	switch (action) {
		case "server_info":
			//获取socket地址
			var data = {
				host: game_config.GATEWAY_CONNECT_IP,
				tcp_port: game_config.gateway_config.ports[0],
				ws_port: game_config.gateway_config.ports[1],
			};

			var str_data = JSON.stringify(data);
			response.send(str_data);
			break;
		case "get_system_notice":
			// 处理获取系统通知请求的逻辑
			var uid = parseInt(req.query.uid);
			var score = parseInt(req.query.score);
			var sql = "insert into user_score(`uid`, `score`) values(%d, %d)";
			sql = util.format(sql, uid, score);
			console.log(sql);
			//调用数据库查询，一般先走redis，可能有四种  内存，redis ，数据库

			break;
		case "get_server_list":
			// 处理获取服务器列表请求的逻辑

			var str_data = JSON.stringify({ ret: "hello world" });

			response.send(str_data);

			break;
		case "platform_user_login":
			// 处理平台用户登录请求的逻辑
			break;
		default:
			// 如果请求的 action 不匹配任何已知操作，返回错误信息
			response.status(404).json({ error: "Unknown action" });
			break;
	}
});

app.listen(port); //监听端口


