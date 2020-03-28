// This is a barebones example of some of the functionality ease-lavalink can do.
// The majority of this code is copied from the README at https://github.com/briantanner/eris-lavalink.

const PlayerManager = require('../src/PlayerManager');
const Eris = require('eris');
const SuperAgent = require('superagent');

const client = new Eris.Client("token-here");
const prefix = '$';

let nodes = [
    { host: 'localhost', port: 8080, region: 'us', password: 'youshallnotpass' }
];

client.on("ready", () => {
     
    let regions = {
        eu: ['eu', 'amsterdam', 'frankfurt', 'russia', 'hongkong', 'singapore', 'sydney'],
        us: ['us', 'brazil'],
    };
    
    if (!(client.voiceConnections instanceof PlayerManager)) {
        client.voiceConnections = new PlayerManager(client, nodes, {
            numShards: client.shards.size, // number of shards
            userId: client.user.id, // the user id of the bot
            regions: regions,
            defaultRegion: 'us',
        });
    }

    console.log("Connected to Lavalink server!");
});

client.on("messageCreate", async m => {

    if(!m.channel.guild) return;

    var guild = client.guilds.get(m.channel.guild.id);

    const args = m.content.slice(prefix.length).split(' '); //from https://discordjs.guide/creating-your-bot/commands-with-user-input.html#basic-arguments
    const command = args.shift().toLowerCase();

    switch(command)
    {
        case "join":
        {
            var channel = guild.channels.get(args[0]);

            if (!channel) {
                return Promise.reject('Not a guild channel.');
            }
        
            let player = client.voiceConnections.get(channel.guild.id);
            if (player) {
                return Promise.resolve(player);
            }
        
            let options = {};
            if (channel.guild.region) {
                options.region = channel.guild.region;
            }
        
            return client.joinVoiceChannel(channel.id, options);
        }

        case "leave":
            return client.leaveVoiceChannel(args[0]);

        case "play":
        {
            try {
                var result = await SuperAgent.get(`http://${nodes[0].host}:8080/loadtracks?identifier=ytsearch:${args[0]}`)
                    .set('Authorization', nodes[0].password)
                    .set('Accept', 'application/json');
            } catch (err) {
                throw err;
            }
        
            if (!result) {
                throw 'Unable play that video.';
            }
        
            const player = client.voiceConnections.get(guild.id);

            if(!player) return;

            return player.play(result.body.tracks[0].track);
        }
    }
});

client.connect();
