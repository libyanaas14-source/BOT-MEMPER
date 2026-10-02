const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`البوت شغال باسم ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (message.author.bot) return;

    if (message.content === 'هلا') {
        message.reply('هلا والله 👋');
    }
});

client.login(process.env.TOKEN);
