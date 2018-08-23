const { Client, Util, RichEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const YouTube = require("simple-youtube-api");
const config = require("./config.js");
const { TOKEN, PREFIX, Youtube_Api_Key } = config;
const youtube = new YouTube(Youtube_Api_Key);

const bot = new Client({ disableEveryone: true });

const queue = new Map();

bot.on("ready", () => {
    console.log("|▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬|")
    console.log("|   #####   #       #  #        #######  #       #  #######  |");
    console.log("|  #     #  # #     #  #           #     # #     #  #        |");
    console.log("|  #     #  #  #    #  #           #     #  #    #  #        |");
    console.log("|  #     #  #   #   #  #           #     #   #   #  ####     |");
    console.log("|  #     #  #    #  #  #           #     #    #  #  #        |");
    console.log("|  #     #  #     # #  #           #     #     # #  #        |");
    console.log("|   #####   #       #  #######  #######  #       #  #######  |");
    console.log("|▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬| ")
    
});

bot.on("message", async msg => {

    if(msg.author.bot) return undefined;

    let args = msg.content.split(" ");
    let searchString = args.splice(1).join(' ')
    let url = args[1] ? args[1].replace(/<(.+)>/, `$1`) : '';
    let voiceChannel = msg.member.voiceChannel;
    let serverQueue = queue.get(msg.guild.id);


    if(msg.content.startsWith(PREFIX + "play")) {

        if(!voiceChannel) return msg.reply("Please join a VoiceChannel.");
        let permissions = voiceChannel.permissionsFor(msg.guild.id);
        if(!permissions.has("CONNECT")) return msg.channel.send("I don't have the correct permisson to Connect.");
        if(!permissions.has("SPEAK")) return msg.channel.send("I don't have the correct permission to Speak.");

        try {
            var video = await youtube.getVideo(url);
        } catch (error) {
            try {
                var videos = await youtube.searchVideos(searchString, 1);
                var video = await youtube.getVideoByID(videos[0].id);
            } catch (err) {
                console.error(err);
                msg.channel.send("No search results found");
            }
        }

        let serverQueue = queue.get(msg.guild.id);

        //let songInfo = await ytdl.getInfo(args[1]);
    
        console.log(video);
    
        let song = {
            id: video.id,
            title: video.title,
            url: `https://www.youtube.com/watch?v=${video.id}`,
            requestedBy: msg.member
        }
        console.log(song);
    
        if(!serverQueue) {
            let queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 100,
                playing: true
            };
            queue.set(msg.guild.id, queueConstruct);
    
            queueConstruct.songs.push(song);
    
            try {
                var connection = await voiceChannel.join();
    
                queueConstruct.connection = connection;
    
                play(msg.guild, queueConstruct.songs[0]);                
            } catch (error) {
                console.error("Couldn't join VoiceChannel " + error);
                msg.channel.send("Couldn't join VoiceChannel " + error);
                queue.delete(msg.guild.id);
            }
        }else {
            serverQueue.songs.push(song);
    
            msg.channel.send(`**${song.title}** has been added to the queue.`)
        }
        return undefined;

    }else if (msg.content.startsWith(PREFIX + "queue")) {
        if(!voiceChannel) return msg.reply(`Please Join the Voice Channel.`);
        if(!serverQueue.songs[0]) return msg.reply("There is nothing playing.");
    
        msg.channel.send(serverQueue.songs);
    }
});

function play(guild, song) {

    let serverQueue = queue.get(guild.id);

    if(!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url));

    dispatcher.on("end", () => {
        console.log("Song Ended");
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    });

    dispatcher.on("error", err => console.log(err));

    dispatcher.setVolumeLogarithmic(serverQueue.volume/100);

    serverQueue.textChannel.send(`Now playing **${song.title}**`)
}
bot.login(TOKEN);