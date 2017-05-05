const express = require('express');
const { CasparCG, ConnectionOptions, AMCP } = require("casparcg-connection");
const os = require("os");

const app = express();
app.use(express.static('public'))
app.set('view engine', 'pug')

const port = 3030;

const interfaces = os.networkInterfaces();
const addresses = [];
for (let k in interfaces) {
	for (let addr of interfaces[k]) {
		if (addr.family === 'IPv4' && !addr.internal && addr.address.indexOf("169.254") != 0) {
			addresses.push(addr.address);
		}
	}
}

let info = {};
let decklinks = {};
const server = {
	hostname: os.hostname(),
	address: addresses.join(", "),
};

const connection = new CasparCG(new ConnectionOptions ({
	autoReconnect: true,
	autoReconnectInterval: 10000,

	//debug: true,
	onConnected: loadInfo,
}));

let loaded = 0;

if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", function () {
	console.log("Terminating!");

	for(let i of Object.keys(info)){
		const ch = info[i];
		connection.stop(ch.id, 1);
	}
	process.exit(0);
});

function showCard(){
	if (++loaded != 2)
		return;

	console.log("Showing Template on channels!");
	for(let i of Object.keys(info)){
		const ch = info[i];
		connection.playHtmlPage(ch.id, 1, "http://127.0.0.1:"+port+"/channel/"+ch.id);
	}

	console.log(" ");
	console.log('Press Ctrl-C to clear');
}

function ensureArray(orig){
	return Array.isArray(orig) ? orig : [orig];
}

function loadInfo(){
	console.log("LOAD INFO");

  info = {};
  decklinks = {};

	connection.infoServer().then(res => {
		for (let data of ensureArray(res.response.data.channel)) {
			const id = data.index;
			
			if (info[id] === undefined)
				info[id] = {};

			info[id].id = data.index;
			info[id].format = data['video-mode'];

			if (data.output === undefined || data.output.consumers === undefined || data.output.consumers.consumer === undefined)
				continue;

			const consumers = [];
			for(let cons of ensureArray(data.output.consumers.consumer)){
				if (cons.type == "ogl-consumer")
					consumers.push("Screen");
				if (cons.type == "decklink-consumer")
					consumers.push("decklink" + cons.device);
			}
			if (consumers.length > 0)
				info[id].consumers = consumers;
		}

		showCard();
	});

	connection.infoSystem().then(res => {
		const data = res.response.data;
		if (data.caspar === undefined || data.caspar.decklink === undefined)
			return showCard();

		const decklink = data.caspar.decklink;
		if (decklink === undefined || decklink.device === undefined)
			return showCard();

		const devices = ensureArray(decklink.device);
		for(let id in devices){
			decklinks[parseInt(id)+1] = devices[id];
		}

		showCard();
	})
}

function compileChannelInfo(id){
	const channelInfo = info[id];
	if (channelInfo === undefined)
		return null;

	const consumers = [];
	if (channelInfo.consumers !== undefined){
		for(let cons of channelInfo.consumers){
			if (cons.indexOf("decklink") != 0){
				consumers.push(cons)
				continue;
			}

			const id = cons.substring(8);
			const decklink = decklinks[id];
			if (decklink === undefined)
				consumers.push("Decklink");
			else
				consumers.push(decklink);
		}
	}

	if (consumers.length == 0)
		consumers.push("none");

	const channel = Object.assign({}, channelInfo);
	return Object.assign(channel, { consumers: consumers.join(", ") });
}

app.get('/channel/:id', function (req, res) {
	const id = req.params.id;
	const channel = compileChannelInfo(id);

	if (channel === null)
		res.status(404).send('Not found');

  res.render('index', { server, channel});
});

app.get('/', function (req, res) {
	const allChannels = [];

	for (let k of Object.keys(info)){
		allChannels.push(compileChannelInfo(k));
	}

  res.render('info', { server, allChannels});
});

app.listen(port, function () {
  console.log('WhoAmI app listening on port '+port+'!');
});

console.log('Press Ctrl-C to clear');