
var game_config = null;
var HOST_IP = "127.0.0.1";

game_config = {
	GATEWAY_CONNECT_IP: "127.0.0.1",


	gateway_config: {
		host: HOST_IP,
		ports: [6080, 6081],
	},

	//--[[web服务器端口]]
	webserver: {
		host: HOST_IP,
		port: 10001,
	},

	//系统服务
	game_system_server: {
		host: HOST_IP,
		port: 6087,
	
	},

	//游戏服务
	game_server: {
		host: HOST_IP,
		port: 6088,
	
	},

	game_database: {
		host: HOST_IP,
		port: 3306,
		db_name: "h5_game",

		uname: "root",
		upwd: "root",
	},

	center_server: {
		host: HOST_IP,
		port: 6086,
		
	},

	center_database: {
		host: HOST_IP,
		port: 3306,
		db_name: "h5_center",

		uname: "root",
		upwd: "root",
	},

	center_redis: {
		host: HOST_IP,
		port: 6379,
		db_index: 0,
	},

	game_redis: {
		host: HOST_IP,
		port: 6379,
		db_index: 1,
	},

	// 代码来生成
	gw_connect_servers: {
		/*0: {
			stype: Stype.TalkRoom,
			host: "127.0.0.1",
			port: 6084, 
		},*/

		1: {
	
			host: HOST_IP,
			port: 6086,
		},

		2: {
		
			host: HOST_IP,
			port: 6087,
		},

		3: {
		
			host: HOST_IP,
			port: 6088,
		},
	},

	// 游戏注册时候的一些数据;
	game_data: {
		first_uexp: 1000,
		first_uchip: 1000,

		login_bonues_config: {
			clear_login_straight: false, // 是否清除连续登录	
			bonues: [100, 200, 300, 400, 500], // 后面都是最多奖励500，
		},

		// 离线生成: 

	},

};

module.exports = game_config;