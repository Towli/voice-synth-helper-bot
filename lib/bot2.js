const { Client, GatewayIntentBits, Partials } = require('discord.js')
const {
    joinVoiceChannel,
    createAudioPlayer,
    NoSubscriberBehavior,
    AudioPlayerStatus,
    createAudioResource,
} = require('@discordjs/voice')
// const { ytdl } = require('discord-ytdl-core')
const ytdl = require('ytdl-core')
const auth = require('../auth.json')
const youtubeSearch = require('./youtube.api.wrapper.js')

const Commands = {
    Play: 'play ',
    Stop: 'stop',
}

const state = {
    voiceConnection: null,
    subscription: null,
}

// player.on('error', console.log)

const client = new Client({
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
})

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', async (message) => {
    const keywordToProcess = 'geez, '
    const { content, member, guildId } = message
    const voiceChannel = member.voice.channel

    if (content?.startsWith(keywordToProcess)) {
        const message = popProcessedKeyword(content, keywordToProcess)
        return handleMessage(message, { voiceChannel, guildId, message })
    }
})

client.on('guildMemberSpeaking', (payload) => {
    console.log(payload)
})

client.login(auth.token)

const handleMessage = async (command, { voiceChannel, guildId, message }) => {
    if (command.startsWith(Commands.Play)) {
        const songToPlay = await searchForSong(command.split(Commands.Play)[1])
        console.log('songToPlay', songToPlay)
        // ytdl('https://youtube.com/watch?v=nJ6A6GC_ki4', {
        //     filter: 'audioonly',
        // }).pipe(fs.createWriteStream('test.mp3'))

        const stream = buildStream(songToPlay)
        // const stream = ytdl(url, {
        //     filter: 'audioonly',
        // })

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

    if (command.startsWith(Commands.Stop)) {
        state?.voiceConnection?.destroy?.()
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
    // player?.stop()
    process.exit()
})
