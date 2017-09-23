var inherits = require('super'),
    Promise = require('bluebird'),
    _ = require('lodash'),
    SqueezeRequest = require('./squeezerequest'),
    SqueezePlayer = require('./squeezeplayer');

function SqueezeServer(address, port, username, password) {
    var self = this;

    SqueezeServer.super_.apply(self, arguments);

    self.players = {};

    /**
     * get the count of players known to the server
     * Note: player must be powered on
     */
    self.getPlayerCount = function () {
        return self.request(self.defaultPlayer, ['player', 'count', '?']);
    };

    /**
     * get player id at index
     * @param index {Number} 0-N
     */
    self.getPlayerId = function (index) {
        return self.request(self.defaultPlayer, ['player', 'id', index, '?']);
    };

    /**
     * get player ip address given player id
     * @param playerId {string} the unique player id
     */
    self.getPlayerIp = function (playerId) {
        return self.request(self.defaultPlayer, ['player', 'ip', playerId, '?']);
    };

    /**
     * get player name given player id
     * @param playerId {string} the unique player id
     */
    self.getPlayerName = function (playerId) {
        return self.request(self.defaultPlayer, ['player', 'name', playerId, '?']);
    };

    self.getSyncGroups = function () {
        return self.request(self.defaultPlayer, ['syncgroups', '?']);
    };

    /**
     * get the list of players known to the server
     * Note: player must be powered on
     * @return {Promise.<*>}
     */
    self.getPlayers = function () {
        return self.request(self.defaultPlayer, ['players', 0, 1000]).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, players: reply.result.players_loop});
                }
                return response;
            });
    };

    self.totals = function () {
        return Promise.all([
            self.request(self.defaultPlayer, ['info', 'total', 'artists', '?']),
            self.request(self.defaultPlayer, ['info', 'total', 'albums', '?']),
            self.request(self.defaultPlayer, ['info', 'total', 'songs', '?']),
            self.request(self.defaultPlayer, ['info', 'total', 'genres', '?'])])
            .spread(function (artists, albums, songs, genres) {
                var response = {ok: artists.ok};
                response.artists = (artists.ok) ? artists.result._artists : 0;
                response.albums = (albums.ok) ? albums.result._albums : 0;
                response.songs = (songs.ok) ? songs.result._songs : 0;
                response.genres = (genres.ok) ? genres.result._genres : 0;
                return response;
            });
    };

    /**
     * Search for artists given artist name
     * Returns {id, artist}
     * @param artistName {string} search criteria or all artists if null
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.artists = function (artistName, skip, take) {
        var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
            t = !_.isFinite(take) && take >= 1 ? take : '-',
            params = ['artists', s, t];
        if (!_.isNil(artistName)) {
            params.push('search:' + artistName);
        }
        return self.request(self.defaultPlayer, params).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, artists: reply.result.artists_loop});
                }
                return response;
            });
    };

    /**
     * Search for albums given album name
     * Returns {id, title, artist_id, artist_ids}
     * @param albumName {string} search criteria or all albums if null
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.albums = function (albumName, skip, take) {
        var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
            t = !_.isFinite(take) && take >= 1 ? take : '-',
            params = ['albums', s, t, 'tags:tSS'];
        if (!_.isNil(albumName)) {
            params.push('search:' + albumName);
        }
        return self.request(self.defaultPlayer, params).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, albums: reply.result.albums_loop});
                }
                return response;
            });
    };

    /**
     * Search for tracks given tracks name
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param trackName {string} search criteria or all tracks if null
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.tracks = function (trackName, skip, take) {
        var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
            t = !_.isFinite(take) && take >= 1 ? take : '-',
            params = ['tracks', s, t, 'tags:seuSp'];
        if (!_.isNil(trackName)) {
            params.push('search:' + trackName);
        }
        return self.request(self.defaultPlayer, params).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, tracks: reply.result.titles_loop});
                }
                return response;
            });
    };

    /**
     * Search for genres given genre name
     * Returns {id, genre}
     * @param genreName {string} search criteria or all genres if null
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.genres = function (genreName, skip, take) {
        var s = !_.isFinite(skip) && skip >= 0 ? skip : '_',
            t = !_.isFinite(take) && take >= 1 ? take : '_',
            params = ['genres', s, t];
        if (!_.isNil(genreName)) {
            params.push('search:' + genreName);
        }
        return self.request(self.defaultPlayer, params).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, genres: reply.result.genres_loop});
                }
                return response;
            });
    };

    /**
     * Search for playlists given playlist name
     * Returns {id, playlist, url}
     * @param playlistName {string} search criteria or all playlists if null
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.playlists = function (playlistName, skip, take) {
        var s = !_.isFinite(skip) && skip >= 0 ? skip : 0,
            t = !_.isFinite(take) && take >= 1 ? take : 1000,
            params = ['playlists', s, t, 'tags:u'];
        if (!_.isNil(playlistName)) {
            params.push('search:' + playlistName);
        }
        return self.request(self.defaultPlayer, params).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, playlists: reply.result.playlists_loop});
                }
                return response;
            });
    };

    /**
     * Search for albums given artist id
     * Returns {id, title, artist_id, artist_ids}
     * @param artistId {Number} only albums by this artist
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.albumsByArtistId = function (artistId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
                t = !_.isFinite(take) && take >= 1 ? take : '-',
                params = ['albums', s, t, 'tags:tSS'];
            if (_.isNil(artistId)) {
                throw new TypeError('artistId');
            }
            params.push('artist_id:' + artistId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, albums: reply.result.albums_loop});
                    }
                    return response;
                });
        });
    };

    /**
     * Search for songs given album id
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param albumId {Number} only songs on album
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.tracksByAlbumId = function (albumId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
                t = !_.isFinite(take) && take >= 1 ? take : '-',
                params = ['tracks', s, t, 'tags:seuSp'];
            if (_.isNil(albumId)) {
                throw new TypeError('albumId');
            }
            params.push('album_id:' + albumId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, tracks: reply.result.titles_loop});
                    }
                    return response;
                });
        });
    };

    /**
     * Search for songs given artist id
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param artistId {Number} only songs by artist
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.tracksByArtistId = function (artistId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
                t = !_.isFinite(take) && take >= 1 ? take : '-',
                params = ['tracks', s, t, 'tags:seuSp'];
            if (_.isNil(artistId)) {
                throw new TypeError('artistId');
            }
            params.push('artist_id:' + artistId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, tracks: reply.result.titles_loop});
                    }
                    return response;
                });
        });
    };

    /**
     * Search for songs given genre id
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param genreId {Number} only songs in genre
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.tracksByGenreId = function (genreId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
                t = !_.isFinite(take) && take >= 1 ? take : '-',
                params = ['tracks', s, t, 'tags:seuSp'];
            if (_.isNil(genreId)) {
                throw new TypeError('genreId');
            }
            params.push('genre_id:' + genreId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, tracks: reply.result.titles_loop});
                    }
                    return response;
                });
        });
    };

    /**
     * Search library for tracks, albums, artists
     * @param term {string} the search term
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {Promise.<*>}
     */
    self.search = function (term, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '0',
                t = !_.isFinite(take) && take >= 1 ? take : '5',
                params = ['search', s, t, 'extended:1'];
            if (_.isNil(term)) {
                throw new TypeError('term');
            }
            params.push('term:' + term);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {
                            count: reply.result.count,
                            tracks: reply.result.tracks_loop,
                            albums: reply.result.albums_loop,
                            contributors: reply.result.contributors_loop
                        });
                    }
                    return response;
                });
        });
    };

    self.register = function () {
        self.players = {};

        function setPlayers(reply) {
            if (reply && reply.players) {
                reply.players.forEach(function (player) {
                    if (!self.players[player.playerid]) {
                        self.players[player.playerid] = new SqueezePlayer(player.playerid,
                            player.name, self.address, self.port, self.username, self.password);
                    }
                });
            } else {
                throw new Error(reply);
            }
        }

        return self.getPlayers().then(setPlayers);
    };
}

inherits(SqueezeServer, SqueezeRequest);

module.exports = SqueezeServer;
