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
        return self.request(playerId, ['playlist', 'clear']);
    };

    self.getMode = function () {
        return self.request(playerId, ['mode', '?']);
    };

    self.setName = function (name) {
        return self.request(playerId, ['name', name]);
    };

    self.getName = function () {
        return self.request(playerId, ['name', '?']);
    };

    self.getCurrentTitle = function () {
        return self.request(playerId, ['current_title', '?']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result._current_title;
                }
                return reply;
            });
    };

    self.getArtist = function () {
        return self.request(playerId, ['artist', '?']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result._artist;
                }
                return reply;
            });
    };

    self.getAlbum = function () {
        return self.request(playerId, ['album', '?']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result._album;
                }
                return reply;
            });
    };

    self.getCurrentRemoteMeta = function () {
        return self.request(playerId, ['status']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.remoteMeta;
                }
                return reply;
            });
    };

    self.getStatus = function () {
        return self.request(playerId, ['status']);
    };

    self.getStatusWithPlaylist = function (from, to) {
        return self.request(playerId, ['status', from, to]);
    };

    self.getPlaylist = function (from, to) {
        return self.request(playerId, ['status', from, to]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.playlist_loop;
                }
                return reply;
            });
    };

    self.play = function () {
        return self.request(playerId, ['play']);
    };

    self.playIndex = function (index) {
        return self.request(playerId, ['playlist', 'index', index]);
    };

    self.pause = function () {
        return self.request(playerId, ['pause']);
    };

    self.next = function () {
        return self.request(playerId, ['button', 'jump_rew']);
    };

    self.previous = function () {
        return self.request(playerId, ['button', 'jump_rew']);
    };

    self.next = function () {
        return self.request(playerId, ['button', 'jump_fwd']);
    };

    self.playlistDelete = function (index) {
        return self.request(playerId, ['playlist', 'delete', index]);
    };

    self.playlistMove = function (fromIndex, toIndex) {
        return self.request(playerId, ['playlist', 'move', fromIndex, toIndex]);
    };

    self.playlistSave = function (playlistName) {
        return self.request(playerId, ['playlist', 'save', playlistName]);
    };

    self.sync = function (syncTo) {
        return self.request(playerId, ['sync', syncTo]);
    };

    self.unSync = function () {
        return self.request(playerId, ['sync', '-']);
    };

    self.seek = function (seconds) {
        return self.request(playerId, ['time', seconds]);
    };

    self.setVolume = function (volume) {
        return self.request(playerId, ['mixer', 'volume', volume]);
    };

    self.getVolume = function () {
        return self.request(playerId, ['mixer', 'volume', '?']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result._volume;
                }
                return reply;
            });
    };

    self.randomPlay = function (target) {
        return self.request(playerId, ['randomplay', target]);
    };

    self.power = function (state) {
        return self.request(playerId, ['power', state]);
    };
}

inherits(SqueezePlayer, SqueezeRequest);

module.exports = SqueezePlayer;
