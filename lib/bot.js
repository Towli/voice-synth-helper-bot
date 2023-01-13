'use strict'

const fs = require('fs')
const discord = require('discord.js')
const sentiment = require('sentiment')
// const watsonTts = require('watson-developer-cloud/text-to-speech/v1')
const ytdl = require('ytdl-core')
const youtubeSearch = require('./youtube.api.wrapper.js')

const auth = require('../auth.json')
const responses = require('../store/responses.json')
const jokes = require('../store/jokes.json')

const watsonTtsCreds = auth.watsonTTS

// const textToSpeech = new watsonTts({
//     username: watsonTtsCreds.username,
//     password: watsonTtsCreds.password,
// })

const bot = new discord.Client()

/**
 * Login to discord server
 */
bot.login(auth.token)

bot.on('ready', () => {
    console.log('Logged in as %s - %s\n', bot.user.tag)
})

/**
 * On text message event.
 * 1) Determines the imperative of the message (branch based on how the message starts)
 * 2) Determines sentiment of message (nn, n, np, p, pp)
 * 3) Processed reply is sent to watson API for voice synth
 * 4) Returned audio stream written to file them streamed to discord voice channel
 */
bot.on('message', (message) => {
    let voiceChannel = null
    let reply = null

    console.log('msg received: ', message.content)

    if (message.content.startsWith('teach geez,')) {
        return _teachResponse(message.content.split('geez,')[1])
    }

    if (message.content.startsWith('geez, joke')) {
        return _makeJoke(message)
    }

    if (message.content.startsWith('geez, play')) {
        return _playYoutubeStream(message)
    }

    if (message.content.startsWith('geez, fuck off')) {
        return _leave(message)
    }

    if (!message.content.startsWith('geez,')) {
        return
    }

    if (!message.member.voiceChannel) {
        console.log(new Error('No voice channel.'))
        return
    }

    voiceChannel = message.member.voiceChannel

    reply = _generateTextResponse(message.content.split('geez,')[1])

    _makeVoiceSynth(reply)
        .then(() => {
            return voiceChannel.join().then((connection) => {
                return connection.playFile(
                    './hello_world.mp3',
                    { volume: 1 },
                    (err, player) => {
                        if (err) console.log(err)
                        console.log(player)
                    }
                )
            })
        })
        .catch(console.log)
})

function _makeVoiceSynth(text) {
    return new Promise((resolve, reject) => {
        const params = {
            text: text,
            voice: 'en-GB_KateVoice',
            accept: 'audio/mp3',
        }

        const audioStream = fs.createWriteStream('./hello_world.mp3')

        // textToSpeech
        //     .synthesize(params)
        //     .on('error', function (error) {
        //         return reject(error)
        //     })
        //     .pipe(audioStream)

        audioStream.on('error', (error) => {
            console.log('ERROR:', error)
            return reject(error)
        })

        audioStream.on('finish', () => {
            console.log('FINISH: Write filestream finished.')
            return resolve(null)
        })

        audioStream.on('close', () => {
            console.log('CLOSE: Write filestream finished.')
            return resolve(null)
        })
    })
}

function _generateTextResponse(text) {
    const sentimentScore = sentiment(text).score
    let reply = responses.pn[_getRandomInt(responses.pn.length)]

    console.log('sentiment score: ' + sentimentScore)

    if (_isPositive(sentimentScore)) {
        if (sentimentScore >= 2 && sentimentScore < 5) {
            reply = responses.p[_getRandomInt(responses.p.length)]
        }

        if (sentimentScore >= 5) {
            reply = responses.pp[_getRandomInt(responses.pp.length)]
        }
    } else {
        if (sentimentScore <= -2 && sentimentScore > -5) {
            reply = responses.n[_getRandomInt(responses.n.length)]
        }

        if (sentimentScore <= -5) {
            reply = responses.nn[_getRandomInt(responses.nn.length)]
        }
    }

    console.log(reply)

    return reply
}

function _teachResponse(text) {
    const sentimentScore = sentiment(text).score
    let responseIndex = 'pn'

    if (_isPositive(sentimentScore)) {
        if (sentimentScore <= 2 && sentimentScore > 5) {
            responseIndex = 'p'
        }

        if (sentimentScore <= 5) {
            responseIndex = 'pp'
        }
    } else {
        if (sentimentScore <= -2 && sentimentScore > -5) {
            responseIndex = 'n'
        }

        if (sentimentScore <= -5) {
            responseIndex = 'nn'
        }
    }

    return _updateResponses(responseIndex, text)
}

function _leave(message) {
    const voiceChannel = message.member.voiceChannel

    return voiceChannel.leave()
}

function _playYoutubeStream(message) {
    const url = message.content.split('geez, play ')[1]
    const voiceChannel = message.member.voiceChannel

    return voiceChannel
        .join()
        .then((connection) => {
            return youtubeSearch.getYoutubeVideoURL(url).then((resolvedURL) => {
                ytdl.getInfo(resolvedURL, (err, info) => {
                    if (err) throw err
                    message.channel.send(`Now playing ${info.title}`)
                })

                return connection.playStream(
                    ytdl(resolvedURL, {
                        audioonly: true,
                        quality: 'highestaudio',
                    })
                )
            })
        })
        .then((dispatcher) => {
            return dispatcher.on('end', () => {
                voiceChannel.leave()
            })
        })
        .catch(console.log)
}

function _makeJoke(message) {
    return message.channel.send(jokes[_getRandomInt(jokes.length)], (err) => {
        if (err) console.log(err)
    })
}

function _updateResponses(index, content) {
    responses[index].push(content)
    return fs.writeFileSync('./responses.json', JSON.stringify(responses))
}

function _getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max))
}

function _isPositive(number) {
    return number > 0 && number !== 0
}

/**
 * /**
{
  "apikey": "PXde0fNUXIi-Lg4BffOjUkckNy106FwlK2PKR8lW9PxB",
  "iam_apikey_description": "Auto-generated for key crn:v1:bluemix:public:text-to-speech:eu-gb:a/dc367d3795d0b112d76b6c81ec3aa5ca:02c98251-aa98-490c-9712-7d9f26b433e9:resource-key:7b138c06-b09d-45c4-8487-0b5d93b40a56",
  "iam_apikey_name": "Auto-generated service credentials",
  "iam_role_crn": "crn:v1:bluemix:public:iam::::serviceRole:Manager",
  "iam_serviceid_crn": "crn:v1:bluemix:public:iam-identity::a/dc367d3795d0b112d76b6c81ec3aa5ca::serviceid:ServiceId-391fb180-4483-4fad-afbd-0874937dd95c",
  "url": "https://api.eu-gb.text-to-speech.watson.cloud.ibm.com/instances/02c98251-aa98-490c-9712-7d9f26b433e9"
}
 */
