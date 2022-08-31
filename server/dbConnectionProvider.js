var mysql = require('mysql2');
var dbConnectionProvider = {

	getMysqlConnection: function () {
		// console.log(process.env.HOST)
		// console.log(process.env.USER1)
		// console.log(process.env.PASSWORD)
		// console.log(process.env.DATABASE)
        var connection = mysql.createConnection({
                                                host: process.env.HOST,
                                                user: process.env.USER1,
                                                password: process.env.PASSWORD,
                                                database: process.env.DATABASE,
                                                dateStrings: true
                                                });
		connection.connect(function (err) {
			if (err) { throw err; }

		});
		return connection;
	},
	closeMysqlConnection: function (currentConnection) {

		if (currentConnection) {
			currentConnection.end(function (err) {
				if (err) { throw err; }

			})
		}

	}

}

module.exports.dbConnectionProvider = dbConnectionProvider;
