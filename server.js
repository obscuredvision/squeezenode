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
        defaultPlayer = '00:00:00:00:00:00';

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
        return self.request(defaultPlayer, ['apps', 0, 100000]);
    };

    self.getPlayers = function () {
        return self.request(defaultPlayer, ['players', 0, 100000]).then(
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
     * @param artistName String search criteria or all artists if null
     * @param skip Number start at
     * @param take Number take this many
     * @return {*}
     */
    self.artists = function (artistName, skip, take) {
        var s = !Number.isNaN(skip) && skip >= 0 ? skip : '_',
            t = !Number.isNaN(take) && take >= 1 ? take : '_',
            params = ['artists', s, t];
        if (!!artistName) {
            params.push('search:' + artistName);
        }
        return self.request(defaultPlayer, params).then(
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
     * @param albumName String search criteria or all albums if null
     * @param skip Number start at
     * @param take Number take this many
     * @return {*}
     */
    self.albums = function (albumName, skip, take) {
        var s = !Number.isNaN(skip) && skip >= 0 ? skip : '_',
            t = !Number.isNaN(take) && take >= 1 ? take : '_',
            params = ['albums', s, t, 'tags:tSS'];
        if (!!albumName) {
            params.push('search:' + albumName);
        }
        return self.request(defaultPlayer, params).then(
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
     * @param songName String search criteria or all songs if null
     * @param skip Number start at
     * @param take Number take this many
     * @return {*}
     */
    self.songs = function (songName, skip, take) {
        var s = !Number.isNaN(skip) && skip >= 0 ? skip : '_',
            t = !Number.isNaN(take) && take >= 1 ? take : '_',
            params = ['albums', s, t, 'tags:seuSp'];
        if (!!songName) {
            params.push('search:' + songName);
        }
        return self.request(defaultPlayer, params).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.titles_loop;
                }
                return reply;
            });
    };

    /**
     * Search for genres given genre name
     * Returns {id, genre}
     * @param genreName String search criteria or all genres if null
     * @param skip Number start at
     * @param take Number take this many
     * @return {*}
     */
    self.genres = function (genreName, skip, take) {
        var s = !Number.isNaN(skip) && skip >= 0 ? skip : '_',
            t = !Number.isNaN(take) && take >= 1 ? take : '_',
            params = ['genres', s, t];
        if (!!genreName) {
            params.push('search:' + genreName);
        }
        return self.request(defaultPlayer, params).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.genres_loop;
                }
                return reply;
            });
    };

    /**
     * Search for playlists given playlist name
     * Returns {id, playlist, url}
     * @param playlistName String search criteria or all playlists if null
     * @param skip Number start at
     * @param take Number take this many
     * @return {*}
     */
    self.playlists = function (playlistName, skip, take) {
        var s = !Number.isNaN(skip) && skip >= 0 ? skip : 0,
            t = !Number.isNaN(take) && take >= 1 ? take : 100000,
            params = ['playlists', s, t, 'tags:u'];
        if (!!playlistName) {
            params.push('search:' + playlistName);
        }
        return self.request(defaultPlayer, params).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.playlists_loop;
                }
                return reply;
            });
    };

    /**
     * Search for albums given artist id
     * Returns {id, title, artist_id, artist_ids}
     * @param artist_id
     * @param skip
     * @param take
     * @return {*}
     */
    self.albumsByArtist = function (artist_id, skip, take) {
        skip = !Number.isNaN(skip) && skip >= 0 ? skip : '_';
        take = !Number.isNaN(take) && take >= 1 ? take : '_';
        return self.request(defaultPlayer, ['albums', skip, take, 'artist_id:' + artist_id, 'tags:tSS']).then(
            function (reply) {
                if (reply.ok) {
                    reply.result = reply.result.albums_loop;
                }
                return reply;
            });
    };

    /**
     * Search for songs given album id
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param album_id
     * @param skip
     * @param take
     * @return {*}
     */
    self.songsByAlbum = function (album_id, skip, take) {
        skip = !Number.isNaN(skip) && skip >= 0 ? skip : '_';
        take = !Number.isNaN(take) && take >= 1 ? take : '_';
        return self.request(defaultPlayer, ['songs', skip, take, 'album_id:' + album_id, 'tags:seuSp']).then(
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
     * @param artist_id
     * @param skip
     * @param take
     * @return {*}
     */
    self.songsByArtist = function (artist_id, skip, take) {
        skip = !Number.isNaN(skip) && skip >= 0 ? skip : '_';
        take = !Number.isNaN(take) && take >= 1 ? take : '_';
        return self.request(defaultPlayer, ['songs', skip, take, 'artist_id:' + artist_id, 'tags:seuSp']).then(
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
     * @param genre_id
     * @param skip
     * @param take
     * @return {*}
     */
    self.songsByGenre = function (genre_id, skip, take) {
        skip = !Number.isNaN(skip) && skip >= 0 ? skip : '_';
        take = !Number.isNaN(take) && take >= 1 ? take : '_';
        return self.request(defaultPlayer, ['songs', skip, take, 'genre_id:' + genre_id, 'tags:seuSp']).then(
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
