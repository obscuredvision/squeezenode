/*
 The MIT License (MIT)

 Copyright (c) 2013-2015 Piotr Raczynski, pio[dot]raczynski[at]gmail[dot]com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the 'Software'), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

var inherits = require('super'),
    SqueezeRequest = require('./squeezerequest');

function SqueezePlayer(playerId, name, address, port, username, password) {
    var self = this;
    self.playerId = playerId;
    self.name = name;

    SqueezePlayer.super_.apply(self, [address, port, username, password]);

    self.clearPlayList = function () {
        return self.request(self.playerId, ['playlist', 'clear']);
    };

    self.getMode = function () {
        return self.request(self.playerId, ['mode', '?']);
    };

    self.setName = function (name) {
        return self.request(self.playerId, ['name', name]);
    };

    self.getName = function () {
        return self.request(self.playerId, ['name', '?']);
    };

    self.getCurrentTitle = function () {
        return self.request(self.playerId, ['current_title', '?']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result._current_title;
                }
                return reply;
            });
    };

    self.getArtist = function () {
        return self.request(self.playerId, ['artist', '?']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result._artist;
                }
                return reply;
            });
    };

    self.getAlbum = function () {
        return self.request(self.playerId, ['album', '?']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result._album;
                }
                return reply;
            });
    };

    self.getCurrentRemoteMeta = function () {
        return self.request(self.playerId, ['status']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.remoteMeta;
                }
                return reply;
            });
    };

    self.getStatus = function () {
        return self.request(self.playerId, ['status']);
    };

    self.getStatusWithPlaylist = function (from, to) {
        return self.request(self.playerId, ['status', from, to]);
    };

    self.getPlaylist = function (from, to) {
        return self.request(self.playerId, ['status', from, to]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.playlist_loop;
                }
                return reply;
            });
    };

    /**
     * Play a song, given its path (url) or
     * a list of songs matching any combination of:
     * genre, artist, album names (NOT ids!!!)
     * @param url the path to the song
     * @param genre the genre name or *
     * @param artist the artist name or *
     * @param album the album name or *
     */
    self.play = function (url, genre, artist, album) {
        var params,
            mgenre = (!genre) ? '*' : genre,
            martist = (!artist) ? '*' : artist,
            malbum = (!album) ? '*' : album;

        if (!url && !genre && !artist && !album) {
            params = ['play'];
        } else if (url) {
            params = ['playlist', 'play', url];
        } else {
            params = ['playlist', 'loadalbum', mgenre, martist, malbum]
        }

        return self.request(self.playerId, params);
    };

    /**
     * Play current playlist at index
     * @param index
     */
    self.playIndex = function (index) {
        return self.request(self.playerId, ['playlist', 'index', index]);
    };

    self.pause = function (pause) {
        pause = (pause === 1 || !!pause) ? 1 : 0;
        return self.request(self.playerId, ['pause', pause]);
    };

    self.mute = function (mute) {
        mute = (mute === 1 || !!mute) ? 1 : 0;
        return self.request(self.playerId, ['mixer', 'muting', mute]);
    };

    self.stop = function () {
        return self.request(self.playerId, ['stop']);
    };

    self.next = function () {
        return self.request(self.playerId, ['button', 'jump_rew']);
    };

    self.previous = function () {
        return self.request(self.playerId, ['button', 'jump_rew']);
    };

    self.next = function () {
        return self.request(self.playerId, ['button', 'jump_fwd']);
    };

    self.playlistAdd = function (item) {
        return self.request(self.playerId, ['playlist', 'add', item]);
    };

    self.playlistInsert = function (item) {
        return self.request(self.playerId, ['playlist', 'insert', item]);
    };

    self.playlistAddAlbum = function (genre, artist, album) {
        var mgenre = (!genre) ? '*' : genre,
            martist = (!artist) ? '*' : artist,
            malbum = (!album) ? '*' : album
        return self.request(self.playerId, ['playlist', 'addalbum', mgenre, martist, malbum]);
    };

    self.playlistDelete = function (index) {
        return self.request(self.playerId, ['playlist', 'delete', index]);
    };

    self.playlistMove = function (fromIndex, toIndex) {
        return self.request(self.playerId, ['playlist', 'move', fromIndex, toIndex]);
    };

    self.playlistSave = function (playlistName) {
        return self.request(self.playerId, ['playlist', 'save', playlistName]);
    };

    self.sync = function (syncTo) {
        return self.request(self.playerId, ['sync', syncTo]);
    };

    self.unSync = function () {
        return self.request(self.playerId, ['sync', '-']);
    };

    self.seek = function (seconds) {
        return self.request(self.playerId, ['time', seconds]);
    };

    self.setVolume = function (volume) {
        return self.request(self.playerId, ['mixer', 'volume', volume]);
    };

    self.getVolume = function () {
        return self.request(self.playerId, ['mixer', 'volume', '?']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result._volume;
                }
                return reply;
            });
    };

    self.randomPlay = function (target) {
        return self.request(self.playerId, ['randomplay', target]);
    };

    self.power = function (state) {
        return self.request(self.playerId, ['power', state]);
    };
}

inherits(SqueezePlayer, SqueezeRequest);

module.exports = SqueezePlayer;
