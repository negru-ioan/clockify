module.exports = {
	apps: [
		{
			name: "clockify",
			cwd: __dirname,
			script: "server/index.js",
			interpreter: process.execPath,
			instances: 1,
			exec_mode: "fork",
			autorestart: true,
			watch: false,
			env: { NODE_ENV: "production", PORT: "9999", HOST: "0.0.0.0" },
		},
	],
};
