const { Client, Intents } = require('discord.js')
const { addSpeechEvent } = require('discord-speech-recognition')
const {
    joinVoiceChannel,
    createAudioPlayer,
    AudioPlayerStatus,
    createAudioResource,
} = require('@discordjs/voice')
const ytdl = require('ytdl-core')
const auth = require('../auth.json')
const youtubeSearch = require('./youtube.api.wrapper.js')

const BotTrigger = { Text: 'geez, ', Voice: 'robot ' }

const Commands = {
    Play: 'play ',
    Stop: 'stop',
    Chum: 'chum',
}

const VoiceCommands = {
    Robot: 'robot ',
}

const state = {
    voiceConnection: null,
    subscription: null,
}

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.MESSAGE_CONTENT,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
})

addSpeechEvent(client)

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('speech', (message) => {
    console.log('Speech detected', message.content)

    const { content, member, guildId } = message
    const voiceChannel = member.voice.channel

    if (!content) {
        return
    }

    if (content.startsWith(VoiceCommands.Robot)) {
        console.log(content)
        const message = popProcessedKeyword(content, VoiceCommands.Robot)
        console.log(message)
        handleMessage(message, { voiceChannel, guildId, message })
    }

    message.author.send(content)
})

client.on('messageCreate', async (message) => {
    const { content, member, guildId } = message
    const voiceChannel = member.voice.channel

    if (content?.startsWith(BotTrigger.Text)) {
        const message = popProcessedKeyword(content, BotTrigger.Text)
        return handleMessage(message, { voiceChannel, guildId, message })
    }
})

client.login(auth.token)

const handleMessage = async (command, { voiceChannel }) => {
    console.log('command', command)
    if (command?.startsWith(Commands.Play)) {
        const songToPlay = await searchForSong(command.split(Commands.Play)[1])

        const stream = buildStream(songToPlay)

        const player = createAudioPlayer()
        const resource = createAudioResource(stream)

        state.voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        })

        player.play(resource)
        state.voiceConnection.subscribe(player)

        player.on(AudioPlayerStatus.Idle, () => state.voiceConnection.destroy())
    }

    if (command?.startsWith(Commands.Stop)) {
        state?.voiceConnection?.destroy?.()
    }

    if (command?.startsWith(Commands.Chum)) {
        state.voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        })
    }
}

const searchForSong = (query) => {
    return youtubeSearch.getYoutubeVideoURL(query)
}

const popProcessedKeyword = (command, keyword) => {
    return command.split(keyword)[1]
}

const buildStream = (url) => {
    return ytdl(url, {
        filter: 'audioonly',
        opusEncoded: false,
        fmt: 'mp3',
        encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200'],
    })
}

process.on('SIGINT', (code) => {
    console.log('Code ', code, 'killing connections..')
    state?.voiceConnection?.destroy?.()
    process.exit()
})
