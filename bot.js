'use strict';

const fs = require('fs');
const discord = require('discord.js');
const sentiment = require('sentiment');
const watsonTts = require('watson-developer-cloud/text-to-speech/v1');
const auth = require('./auth.json');
const responses = require('./responses.json');

const watsonTtsCreds = auth.watsonTTS;

const textToSpeech = new watsonTts({ 
    username: watsonTtsCreds.username, 
    password: watsonTtsCreds.password
})

const bot = new discord.Client();

/**
 * Login to discord server
 */
bot.login(auth.token);

bot.on('ready', () => {
    console.log('Logged in as %s - %s\n', bot.user.tag);
});

/**
 * On text message event.
 * 1) Determines the imperative of the message (branch based on how the message starts)
 * 2) Determines sentiment of message (nn, n, np, p, pp)
 * 3) Processed reply is sent to watson API for voice synth
 * 4) Returned audio stream written to file them streamed to discord voice channel
 */
bot.on('message', message => {
    
    let voiceChannel = null;
    let reply = null;
    
    if (message.content.startsWith('teach ale slave,')) {
        return _teachResponse(message.content.split('ale slave,')[1]);
    }
    
    if (!message.content.startsWith('ale slave,')) {
        return;
    }
    
    if (!message.member.voiceChannel) {
        console.log(new Error('No voice channel.'))
        return;
    }
    
    voiceChannel = message.member.voiceChannel;

    reply = _generateTextResponse(message.content.split('ale slave,')[1]);
    
    _makeVoiceSynth(reply)
        .then(() => {
            voiceChannel.join()
                .then(connection => {
                    return connection.playFile('./hello_world.mp3');
                })
                .then(dispatcher => {
                    dispatcher.on('error', console.log);
                    dispatcher.on('finish', () => { console.log('Finished playing!'); });
                })
                .catch(console.log);
        })
        .catch(console.log);
    
});

function _makeVoiceSynth(text) {
    
    return new Promise((resolve, reject) => {
        
        const params = {
            text: text,
            voice: 'en-US_MichaelVoice',
            accept: 'audio/mp3'
        };
        
        const audioStream = fs.createWriteStream('hello_world.mp3');
        
        textToSpeech.synthesize(params)
            .on('error', function(error) {
                reject(error);
            })
            .pipe(audioStream);
            
            audioStream.on('close', () => {
                console.log('Write filestream finished.');
                resolve(null);
            });
            
    });
    
}

function _generateTextResponse(text) {
    
    const sentimentScore = sentiment(text).score;
    let reply = responses.pn[_getRandomInt(responses.pn.length-1)];
    
    console.log('sentiment score: ' + sentimentScore);
    
    if (_isPositive(sentimentScore)) {
        
        if (sentimentScore >= 2 && sentimentScore < 5) {
            reply = responses.p[_getRandomInt(responses.p.length-1)];
        }
        
        if (sentimentScore >= 5) {
            reply = responses.pp[_getRandomInt(responses.pp.length-1)];
        }
        
    } else {
        
        if (sentimentScore <= -2 && sentimentScore < -5) { 
            reply = responses.n[_getRandomInt(responses.n.length-1)]; 
        }
        
        if (sentimentScore <= -5) { 
            reply = responses.nn[_getRandomInt(responses.nn.length-1)]; 
        }
        
    }
    
    return reply;
    
}

function _teachResponse(text) {
    
    const sentimentScore = sentiment(text).score;
    console.log('sentiment score: ' + sentimentScore);
    let responseIndex = 'pn';
    
    if (_isPositive(sentimentScore)) {
        
        if (sentimentScore >= 2 && sentimentScore < 5) {
            responseIndex = 'p';
        }
        
        if (sentimentScore >= 5) {
            responseIndex = 'pp';
        }
        
    } else {
        
        if (sentimentScore >= -2 && sentimentScore < -5) { 
            responseIndex = 'n';
        }
        
        if (sentimentScore >= -5) { 
            responseIndex = 'nn';
        }
        
    }
    
    return _updateResponses(responseIndex, content);
    
}

function _updateResponses(index, content) {
    
    // Currently updating global var - bad bad not good.
    responses[responseIndex].push(content);
    return fs.writeFileSync('./responses.json', JSON.stringify(responses));
    
}

function _getRandomInt(max) {
    
  return Math.floor(Math.random() * Math.floor(max));
  
}

function _isPositive(number) {
    
    return Math.sign(number);
    
}
