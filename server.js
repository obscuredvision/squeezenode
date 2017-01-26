/*
 The MIT License (MIT)

 Copyright (c) 2013 Piotr Raczynski, pio[dot]raczynski[at]gmail[dot]com

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
    fs = require('fs'),
    SqueezeRequest = require('./squeezerequest'),
    SqueezePlayer = require('./squeezeplayer');

function SqueezeServer(address, port, username, password) {
    var self = this,
        defaultPlayer = '00:00:00:00:00:00',
        subs = {};

    SqueezeServer.super_.apply(self, arguments);

    self.players = {};
    self.apps = {};
    self.playerUpdateInterval = 2000;

    self.getPlayerCount = function () {
        return self.request(defaultPlayer, ['player', 'count', '?']);
    };

    self.getPlayerId = function (id) {
        return self.request(defaultPlayer, ['player', 'id', id, '?']);
    };

    self.getPlayerIp = function (playerId) {
        return self.request(defaultPlayer, ['player', 'ip', playerId, '?']);
    };

    self.getPlayerName = function (playerId) {
        return self.request(defaultPlayer, ['player', 'name', playerId, '?']);
    };

    self.getSyncGroups = function () {
        return self.request(defaultPlayer, ['syncgroups', '?']);
    };

    self.getApps = function () {
        return self.request(defaultPlayer, ['apps', 0, 100]);
    };

    self.getPlayers = function () {
        return self.request(defaultPlayer, ['players', 0, 100]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.players_loop;
                }
                return reply;
            });
    };

    /**
     * Search for artists given artist name
     * Returns {id, artist}
     * @param artistName
     * @return {*}
     */
    self.artistsByName = function (artistName) {
        return self.request(defaultPlayer, ['artists', "_", "_", "search:" + artistName]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.artists_loop;
                }
                return reply;
            });
    };

    /**
     * Search for albums given album name
     * Returns {id, title, artist_id, artist_ids}
     * @param albumName
     * @return {*}
     */
    self.albumsByName = function (albumName) {
        return self.request(defaultPlayer, ['albums', "_", "_", "search:" + albumName, "tags:tSS"]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.albums_loop;
                }
                return reply;
            });
    };

    /**
     * Search for albums given artist id
     * Returns {id, title, artist_id, artist_ids}
     * @param songName
     * @return {*}
     */
    self.albumsByArtist = function (artist_id) {
        return self.request(defaultPlayer, ['albums', "_", "_", "artist_id:" + artist_id, "tags:tSS"]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.albums_loop;
                }
                return reply;
            });
    };

    /**
     * Search for songs given song name
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param songName
     * @return {*}
     */
    self.songsByName = function (songName) {
        return self.request(defaultPlayer, ['songs', "_", "_", "search:" + songName, "tags:seuSp"]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.titles_loop;
                }
                return reply;
            });
    };

    /**
     * Search for songs given album id
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param songName
     * @return {*}
     */
    self.songsByAlbum = function (album_id) {
        return self.request(defaultPlayer, ['songs', "_", "_", "album_id:" + album_id, "tags:seuSp"]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.titles_loop;
                }
                return reply;
            });
    };

    /**
     * Search for songs given artist id
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param songName
     * @return {*}
     */
    self.songsByArtist = function (artist_id) {
        return self.request(defaultPlayer, ['songs', "_", "_", "artist_id:" + artist_id, "tags:seuSp"]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.titles_loop;
                }
                return reply;
            });
    };

    /**
     * Search for songs given genre id
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param songName
     * @return {*}
     */
    self.songsByGenre = function (genre_id) {
        return self.request(defaultPlayer, ['songs', "_", "_", "genre_id:" + genre_id, "tags:seuSp"]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.titles_loop;
                }
                return reply;
            });
    };

    /**
     * fetch all genres
     * Returns {id, genre}
     * @return {*}
     */
    self.genres = function () {
        return self.request(defaultPlayer, ['genres', "_", "_"]).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.titles_loop;
                }
                return reply;
            });
    };

    self.register = function () {
        return new Promise(function (resolve, reject) {
            self.getPlayers().then(function (reply) {
                var players = reply.result;

                // clear players and apps before filling
                self.players = {};
                self.apps = {};

                // set players
                if (reply.ok) {
                    players.forEach(function (player) {
                        if (!self.players[player.playerid]) {
                            // player not on the list, add it
                            self.players[player.playerid] = new SqueezePlayer(player.playerid,
                                player.name, self.address, self.port, self.username, self.password);
                        }
                    });

                    self.getApps().then(function (reply) {
                        // set apps
                        if (reply.ok) {
                            var apps = reply.result.appss_loop,
                                dir = __dirname + '/';
                            fs.readdir(dir, function (err, files) {
                                files.forEach(function (file) {
                                    var app,
                                        fil = file.substr(0, file.lastIndexOf('.'));

                                    apps.forEach(function (player) {
                                        if (fil === player.cmd) {
                                            app = require(dir + file);
                                            self.apps[player.cmd] = new app(defaultPlayer, player.name, player.cmd,
                                                self.address, self.port, self.username, self.password);
                                            /* workaround, app needs existing player id so first is used here */
                                        }
                                    });
                                });
                                resolve();
                            });
                        } else {
                            reject(reply);
                        }
                    });
                } else {
                    reject(reply);
                }
            });
        });
    };
}

inherits(SqueezeServer, SqueezeRequest);

module.exports = SqueezeServer;
