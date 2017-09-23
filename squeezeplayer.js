var inherits = require('super'),
    Promise = require('bluebird'),
    _ = require('lodash'),
    SqueezeRequest = require('./squeezerequest');

function SqueezePlayer(playerId, playerName, address, port, username, password) {
    var self = this;
    self.playerId = playerId;
    self.playerName = playerName;

    SqueezePlayer.super_.apply(self, [address, port, username, password]);

    /**
     * complete status about a given player, including the current playlist
     */
    self.status = function () {
        return self.request(self.playerId, ['status', '-', 1, 'tags:aAsSelgGpPcdtyuJ']).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, reply.result);
                }
                return response;
            });
    };

    /**
     * seek to a position within a track
     * @param seconds {Number} the pos/neg number to seek to
     * @return {Promise.<*>}
     */
    self.seek = function (seconds) {
        var time = _.isNil(seconds) || !_.isFinite(seconds) ? '?' : seconds.toString();
        return self.request(self.playerId, ['time', time]).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    if (time === '?') {
                        response.time = reply.result._time;
                    }
                }

                return response;
            });
    };

    /**
     * get the url (path) of the current song
     * @return {Promise.<*>}
     */
    self.path = function () {
        return self.request(self.playerId, ['path', '?']).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    response.path = reply.result._path;
                }
                return response;
            });
    };

    /**
     * set the player mode
     * @param mode {string} player mode see: constants.PlayerMode
     * @param state {Number} 0/1
     * @return {*}
     */
    self.mode = function (mode, state) {
        return Promise.try(function () {
            var params = self.playerModeToParams(mode);
            if (util.isNullOrEmpty(params) || util.isNullOrEmpty(state) || util.isNaN(state)) {
                throw new TypeError('mode or state');
            }
            params.push((state >= 1) ? 1 : 0);
            return self.request(self.playerId, params);
        });
    };

    /**
     * (un)Pause the player
     * @param pause {Number} 0/1
     */
    self.pause = function (pause) {
        return Promise.try(function () {
            if (!_.isFinite(pause)) {
                throw new TypeError('pause');
            }
            pause = (pause >= 1 || !!pause) ? 1 : 0;
            return self.request(self.playerId, ['pause', pause]);
        });
    };

    /**
     * (un)mute the player
     * @param mute {Number} 0/1
     * @return {Promise.<*>}
     */
    self.mute = function (mute) {
        var muting = _.isNil(mute) || !_.isFinite(mute) ? '?' : mute.toString();
        return self.request(self.playerId, ['mixer', 'muting', muting]).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    if (muting === '?') {
                        response.mute = reply.result._muting;
                    }
                }
                return response;
            });
    };

    /**
     * stop the player
     */
    self.stop = function () {
        return self.request(self.playerId, ['stop']);
    };

    /**
     * power on/off the player or report state
     * @param state {Number} 0/1
     * @return {Promise.<*>}
     */
    self.power = function (state) {
        var pwr = _.isNil(state) || !_.isFinite(state) ? '?' : state.toString();
        return self.request(self.playerId, ['power', pwr]).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    if (pwr === '?') {
                        response.mute = reply.result._power;
                    }
                }
                return response;
            });
    };

    /**
     * move to the previous track
     */
    self.previous = function () {
        return self.request(self.playerId, ['button', 'jump_rew']);
    };

    /**
     * move the the next track
     */
    self.next = function () {
        return self.request(self.playerId, ['button', 'jump_fwd']);
    };

    /**
     * set the volume of the player
     * @param volume {Number} 0-100
     * @return {Promise.<*>}
     */
    self.volume = function (volume) {
        var vol = _.isNil(volume) || !_.isFinite(volume) ? '?' : volume.toString();
        return self.request(self.playerId, ['mixer', 'volume', vol]).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    response.volume = reply.result._volume;
                }
                return response;
            });
    };

    /**
     * get Currently playing song information
     * @return {*} song information with cover url if any
     */
    self.getCurrentlyPlaying = function () {
        return self.getPath().then(
            function (path) {
                if (path && path.result) {
                    return self.songInfo(path.result).then(
                        function (songinfo) {
                            var response = {};
                            if (songinfo && songinfo.result) {
                                _.assign(response, songinfo);
                                if (!response.coverid) {
                                    response.coverid = 'unknown';
                                }
                                response.coverurl = '/music/' + response.coverid + '/cover.jpg';
                            }
                            return response;
                        });
                }
            });
    };

    /**
     * Play a song, given its path (url) or
     * a list of songs matching any combination of: genre, artist, album names (NOT ids!!!)
     * @param url {string} path to the song
     * @param genre {string} genre name
     * @param artist {string} artist name
     * @param album {string} album name
     */
    self.play = function (url, genre, artist, album) {
        return Promise.try(function () {
            var params,
                murl = (_.isNil(url)) ? '*' : url,
                mgenre = (_.isNil(genre)) ? '*' : genre,
                martist = (_.isNil(artist)) ? '*' : artist,
                malbum = (_.isNil(album)) ? '*' : album;

            if (_.every([murl, mgenre, martist, malbum], function (v) {
                    return v === '*'
                })) {
                throw new TypeError('url, genre, artist, album');
            }

            if (url && url !== '*') {
                params = ['playlist', 'play', url];
            } else {
                params = ['playlist', 'loadalbum', mgenre, martist, malbum]
            }

            return self.request(self.playerId, params);
        });
    };

    /**
     * get the player name by player id or index
     * @param nameOrIndex {string} the player id or index
     */
    self.name = function (nameOrIndex) {
        return Promise.try(function () {
            if (_.isNil(nameOrIndex)) {
                throw new TypeError('nameOrIndex');
            }
            return self.request(self.playerId, ['name', nameOrIndex, '?']).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        response.name = reply.result._value;
                    }
                    return response;
                });
        });
    };

    /**
     * get the currently playing title
     * @return {Promise.<*>}
     */
    self.getCurrentTitle = function () {
        return self.request(self.playerId, ['current_title', '?']).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    response.title = reply.result._current_title;
                }
                return response;
            });
    };

    /**
     * get the currently playing artist
     * @return {Promise.<*>}
     */
    self.getArtist = function () {
        return self.request(self.playerId, ['artist', '?']).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    response.artist = reply.result._artist;
                }
                return response;
            });
    };

    /**
     * get the currently playing album
     * @return {Promise.<*>}
     */
    self.getAlbum = function () {
        return self.request(self.playerId, ['album', '?']).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    response.album = reply.result._album;
                }
                return response;
            });
    };

    /**
     * play song at specified index on the current playlist
     * @param index {Number} the index to play
     */
    self.playIndex = function (index) {
        return self.request(self.playerId, ['playlist', 'index', index]);
    };

    /**
     * Get the tracks for a specific playlist
     * @param playlistId {string} the playlist id to look up
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {Promise.<*>}
     */
    self.getPlaylist = function (playlistId, skip, take) {
        return Promise.try(function () {
            var s = _.isFinite(skip) && skip >= 0 ? skip : 0,
                t = _.isFinite(take) && take >= 1 ? take : 100000,
                params = ['playlists', 'tracks', s, t, 'tags:aAsSelgGpPcdtyuJ'];
            if (_.isNil(playlistId)) {
                throw new TypeError('playlistId');
            }
            params.push('playlist_id:' + playlistId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        response.count = reply.result.count;
                        response.title = reply.result.__playlistTitle;
                        response.tracks = reply.result.playlisttracks_loop;
                    }
                    return response;
                });
        });
    };

    /**
     * create a new empty playlist
     * @param name {string} the new playlist name
     * @return {Promise.<*>}
     */
    self.newPlaylist = function (name) {
        return Promise.try(function () {
            var params = ['playlists', 'new'];
            if (_.isNil(name)) {
                throw new TypeError('name');
            }
            params.push('name' + name);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    if (reply && reply.result) {
                        var response = {};
                        // playlist not created if property overwritten_playlist_id exists
                        if (reply.result.overwritten_playlist_id) {
                            throw new Error({
                                message: 'a playlist with that name already exists.',
                                meta: reply.result.overwritten_playlist_id
                            });
                        }
                        response.id = reply.result.playlist_id
                    }
                    return response;
                });
        });
    };

    /**
     * create a new playlist with tracks
     * @param payload {*} the new playlist object with schema:
     * {name: string, tracks: [url: string]}
     * @return {Promise.<*>}
     */
    self.createPlaylist = function (payload) {
        return Promise.try(function () {
            if (_.isNil(payload) || !_.isPlainObject(payload) || !_.has(payload, 'name')) {
                throw new TypeError('payload');
            }

            // we need to create playlist first
            return newPlaylist(payload.name).then(function (response) {
                if (_.has(response, 'id')) {
                    // playlist created now add tracks
                    return Promise.map(payload.tracks, function (track) {
                        return addTrackToPlaylistByTrackUrl(response.id, track);
                    });
                } else {
                    throw new Error({
                        message: 'Playlist "' + payload.name + '" was not created and tracks could not be added.',
                        meta: payload
                    });
                }
            });
        });
    };

    /**
     * rename playlist
     * @param playlistId {string} the playlist id
     * @param name {string} the new playlist name
     * @param dryRun {Boolean} true is dryrun
     */
    self.renamePlaylist = function (playlistId, name, dryRun) {
        return Promise.try(function () {
            var _dryRun = (_.isNil(dryRun) || _.isBoolean(dryRun) && dryRun) ? 1 : 0,
                params = ['playlists', 'rename'];
            if (_.isNil(playlistId) || _.isNil(name)) {
                throw new TypeError('playlistId or name');
            }
            params.push('playlist_id:' + playlistId);
            params.push('newname:' + name);
            // playlist not renamed when dry_run:1 and property 'overwritten_playlist_id' exists
            params.push('dry_run:' + _dryRun);
            self.request(self.defaultPlayer, params).then(
                function (reply) {
                    if (reply && reply.result) {
                        if (reply.result.overwritten_playlist_id) {
                            throw new Error({
                                message: 'a playlist with that name already exists.',
                                meta: {
                                    overwrittenPlaylistId: reply.result.overwritten_playlist_id,
                                }
                            })
                        }
                    }
                });
        });
    };

    /**
     * delete playlist
     * @param playlistId {string} the playlist id
     */
    self.deletePlaylist = function (playlistId) {
        return Promise.try(function () {
            var params = ['playlists', 'delete'];
            if (_.isNil(playlistId)) {
                throw new TypeError('playlistId');
            }
            params.push('playlist_id:' + playlistId);
            return self.request(self.defaultPlayer, params);
        });
    };

    /**
     * add a track to the specified playlist by the track url
     * @param playlistId {string} the playlist id
     * @param url {string} the track url (ex: file:///...file.mp3)
     */
    self.addTrackToPlaylistByTrackUrl = function (playlistId, url) {
        return Promise.try(function () {
            var params = ['playlists', 'edit', 'cmd:add'];
            if (_.isNil(url) || _.isNil(playlistId)) {
                throw new TypeError('url, playlistId');
            }
            params.push('playlist_id:' + playlistId);
            params.push('url:' + url);
            return self.request(self.playerId, params);
        });
    };

    /**
     * add a track to current playlist by the track url
     * @param url {string} the track url
     */
    self.addTrackToCurrentPlaylistByTrackUrl = function (url) {
        return Promise.try(function () {
            var params = ['playlist', 'add'];
            if (_.isNil(url)) {
                throw new TypeError('url');
            }
            params.push(url);
            return self.request(self.playerId, params);
        });
    };

    /**
     * add track(s) to current playlist by track id(s)
     * @param ids {Array|string} either an array of ids or a single id
     * @return {Promise.<*>}
     */
    self.addTracksToCurrentPlaylistByTrackIds = function (ids) {
        return Promise.try(function () {
            var params = ['playlistcontrol', 'cmd:add'],
                csv = function (i) {
                    return _.isArray(i) ? _.join(i, ',') : i;
                };
            if (_.isNil(ids)) {
                throw new TypeError('ids');
            }
            params.push('track_id:' + csv(ids));
            return self.request(self.playerId, params).then(
                function (reply) {
                    if (reply && _.has(reply, 'result.count') && reply.result.count > 0) {
                        return {count: reply.result.count};
                    } else {
                        throw new Error({
                            message: 'track(s) not added to current playlist.',
                            meta: {ids: ids}
                        })
                    }
                });
        });
    };

    /**
     * add track(s) to current playlist by artistId
     * @param artistId {Number} the artist id
     * @return {*}
     */
    self.addTracksToCurrentPlaylistByArtistId = function (artistId) {
        return Promise.try(function () {
            var params = ['playlistcontrol', 'cmd:add'];
            if (_.isNil(artistId)) {
                throw new TypeError('artistId');
            }
            params.push('artist_id:' + artistId);
            return self.request(self.playerId, params).then(
                function (reply) {
                    if (reply && _.has(reply, 'result.count') && reply.result.count > 0) {
                        return {count: reply.result.count};
                    } else {
                        throw new Error({
                            message: 'track(s) not added to current playlist.',
                            meta: {id: artistId}
                        })
                    }
                });
        });
    };

    /**
     * add track(s) to current playlist by albumId
     * @param albumId {Number} the album id
     * @return {*}
     */
    self.addTracksToCurrentPlaylistByAlbumId = function (albumId) {
        return Promise.try(function () {
            var params = ['playlistcontrol', 'cmd:add'];
            if (_.isNil(albumId)) {
                throw new TypeError('albumId');
            }
            params.push('album_id:' + albumId);
            return self.request(self.playerId, params).then(
                function (reply) {
                    if (reply && _.has(reply, 'result.count') && reply.result.count > 0) {
                        return {count: reply.result.count};
                    } else {
                        throw new Error({
                            message: 'track(s) not added to current playlist.',
                            meta: {id: albumId}
                        })
                    }
                });
        });
    };

    /**
     * add track(s) to current playlist by genreId
     * @param genreId {Number} the genre id
     * @return {*}
     */
    self.addTracksToCurrentPlaylistByGenreId = function (genreId) {
        return Promise.try(function () {
            var params = ['playlistcontrol', 'cmd:add'];
            if (_.isNil(genreId)) {
                throw new TypeError('genreId');
            }
            params.push('genre_id:' + genreId);
            return self.request(self.playerId, params).then(
                function (reply) {
                    if (reply && _.has(reply, 'result.count') && reply.result.count > 0) {
                        return {count: reply.result.count};
                    } else {
                        throw new Error({
                            message: 'track(s) not added to current playlist.',
                            meta: {id: genreId}
                        })
                    }
                });
        });
    };

    /**
     * appends all songs matching the specified criteria onto the end of the playlist
     * NOTE: null will be replaced with '*'.  Must have at least one search term
     * @param genre {string} genre name
     * @param artist {string} artist name
     * @param album {string} album name
     * @return {*}
     */
    self.addTracksToCurrentPlaylistByName = function (genre, artist, album) {
        return Promise.try(function () {
            var mgenre = (_.isNil(genre)) ? '*' : genre,
                martist = (_.isNil(artist)) ? '*' : artist,
                malbum = (_.isNil(album)) ? '*' : album;
            if (_.every([mgenre, martist, malbum], function (v) {
                    return v === '*'
                })) {
                throw new TypeError('genre, artist, album');
            }
            return self.request(self.playerId, ['playlist', 'addalbum', mgenre, martist, malbum]);
        });
    };

    /**
     * Removes tracks that match the specified genre artist and album criteria from the playlist
     * NOTE: null will be replaced with '*'.  Must have at least one search term
     * @param genre {string} genre name
     * @param artist {string} artist name
     * @param album {string} album name
     * @return {*}
     */
    self.removeTracksFromCurrentPlaylistByName = function (genre, artist, album) {
        return Promise.try(function () {
            var mgenre = (_.isNil(genre)) ? '*' : genre,
                martist = (_.isNil(artist)) ? '*' : artist,
                malbum = (_.isNil(album)) ? '*' : album;
            if (_.every([mgenre, martist, malbum], function (v) {
                    return v === '*'
                })) {
                throw new TypeError('genre, artist, album');
            }
            return self.request(self.playerId, ['playlist', 'deletealbum', mgenre, martist, malbum]);
        });
    };

    /**
     * remove track from current playlist by the index of the track in the playlist
     * @param index {Number} the track index
     */
    self.removeTrackFromCurrentPlaylistByIndex = function (index) {
        return Promise.try(function () {
            var params = ['playlist', 'delete'];
            if (_.isNil(index) || !_.isFinite(index)) {
                throw new TypeError('index');
            }
            params.push(index);
            return self.request(self.playerId, params);
        });
    };

    /**
     * remove track from current playlist by track url
     * @param url {string} the track url
     */
    self.removeTrackFromCurrentPlaylistByTrackUrl = function (url) {
        return Promise.try(function () {
            var params = ['playlist', 'deleteitem'];
            if (_.isNil(url)) {
                throw new TypeError('url');
            }
            params.push(url);
            return self.request(self.playerId, params);
        });
    };

    /**
     * clear the current playlist
     */
    self.clearPlayList = function () {
        return self.request(self.playerId, ['playlist', 'clear']);
    };

    /**
     * load the playlist
     * NOTE: this will replace current playlist and start playing
     * @param playlistId {Number} the playlist id
     * @return {*}
     */
    self.loadPlaylist = function (playlistId) {
        return Promise.try(function () {
            var params = ['playlistcontrol', 'cmd:load'];
            if (_.isNil(playlistId)) {
                throw new TypeError('playlistId');
            }
            params.push('playlist_id:' + playlistId);
            return self.request(self.playerId, params).then(
                function (reply) {
                    if (reply && reply.result) {
                        if (reply.result.count === 0) {
                            throw new Error({message: 'unable to load playlist.', meta: playlistId})
                        }
                        return reply;
                    }
                });
        });
    };

    /**
     * load a playlist then issue a stop command so it will not play
     * @param playlistId {string} the playlist id
     * @return {*}
     */
    self.loadPlaylistAndStop = function (playlistId) {
        return loadPlaylist(playlistId).then(function () {
            return mode('stop', 1);
        });
    };

    /**
     * inserts the specified song URL to be played immediately after the current song in the current playlist
     * @param url {string} the track url
     * @return {*}
     */
    self.insertTrackIntoCurrentPlaylist = function (url) {
        return Promise.try(function () {
            var params = ['playlist', 'insert'];
            if (_.isNil(url)) {
                throw new TypeError('url');
            }
            params.push(url);
            return self.request(self.playerId, params);
        });
    };

    /**
     * Play the playlist by playlist id
     * @param playlistId {Number} the playlist id
     */
    self.playPlaylist = function (playlistId) {
        return Promise.try(function () {
            var params = ['playlistcontrol', 'cmd:load'];
            if (_.isNil(playlistId)) {
                throw new TypeError('playlistId');
            }
            params.push('playlist_id:' + playlistId);
            return self.request(self.playerId, params);
        });
    };

    /**
     * Move a track from index to index in current playlist
     * @param fromIndex {Number} 0-N
     * @param toIndex {Number} 0-N
     * @return {*}
     */
    self.moveTracksInCurrentPlaylist = function (fromIndex, toIndex) {
        return Promise.try(function () {
            if (!_.isFinite(fromIndex) || !_.isFinite(toIndex)) {
                throw new TypeError('fromIndex or toIndex');
            }
            return self.request(self.playerId, ['playlist', 'move', fromIndex, toIndex]);
        });
    };

    /**
     * saves playlist file in the saved playlists directory.  accepts a playlist filename (without .m3u suffix)
     * @param playlistName
     */
    self.playlistSave = function (playlistName) {
        return Promise.try(function () {
            if (_.isNil(playlistName)) {
                throw new TypeError('playlistName');
            }
            return self.request(self.playerId, ['playlist', 'save', playlistName]);
        });
    };
}

inherits(SqueezePlayer, SqueezeRequest);

module.exports = SqueezePlayer;
