'use strict';

const discord = require('discord.js');
const auth = require('./auth.json');

const bot = new discord.Client();

bot.login(auth.token);

bot.on('ready', () => {
    console.log('Logged in as %s - %s\n', bot.user.tag);
});

bot.on('voiceStateUpdate', (oldMember, newMember) => {
    const voiceChannelId = newMember.voiceChannelID;
   //  console.log
   // //  guild: 
   // // Guild {
   // //   members: 
   // //    Collection {
    // console.log(newMember.guild.channels.find('id', voiceChannelId));
});

bot.on('message', msg => {
    
    switch (msg.content) {
        case 'ping':
            msg.channel.send('Pong!', { tts: true });
            break;
        case `who's ale?`:
            msg.channel.send("Master", { tts: true });
            break;
        case `who's josh?`:
            msg.channel.send("Professional fella", { tts: true });
            break;
        default:
            break;
    }
  // msg.reply("sorry only talk to those with jobs");
  
});

// bot.on('message', function(user, userId, channelId, message, event) {
// 
//     // listen for messages that start with ~
//     if (message.startsWith('~')) {
// 
//         const args = message.substring(1).split(' ');
//         const cmd = args[0];
// 
//         args = args.splice(1);
// 
//         console.log(args);
// 
//         bot.sendMessage({
//             to: channelId,
//             message: 'Ale\'s slave ready to roll.'
//         });
// 
//     }
// 
// });
