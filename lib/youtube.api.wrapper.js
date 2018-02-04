'use strict';

const axios = require('axios');
const config = require('../config.js');

function getYoutubeVideoURL(query) {
    
    // TODO: make function with type: 'playlist' for easy playlist functionality
    const options = { 
        q: query, 
        maxResults: 1, 
        part: 'snippet',
        type: 'video',
        key: config.YOUTUBE_API_KEY
    };
    
    return _makeRequest(config.YOUTUBE_SEARCH_API_BASE, 'get', options)
        .then(res => {
            console.log(res.data.items[0])
            return `https://youtube.com/watch?v=${res.data.items[0].id.videoId}`;
        });
    
}

function _makeRequest(url, method, data = null) {

    return axios({
        method: method,
        url: url,
        params: data
    });

}

module.exports = { getYoutubeVideoURL: getYoutubeVideoURL };
