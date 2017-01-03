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

    self.players = [];
    self.apps = [];
    self.playerUpdateInterval = 2000;

    self.on = function (channel, sub) {
        subs[channel] = subs[channel] || [];
        subs[channel].push(sub);
    };

    self.emit = function (channel) {
        var args = [].slice.call(arguments, 1);
        for (var sub in subs[channel]) {
            subs[channel][sub].apply(void 0, args);
        }
    };

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

    function register() {
        self.getPlayers().then(function (reply) { // TODO refactor this
            var players = reply.result;
            for (var player in players) {
                if (!self.players[players[player].playerid]) { // player not on the list
                    self.players[players[player].playerid] = new SqueezePlayer(players[player].playerid,
                        players[player].name, self.address, self.port, self.username, self.password);
                }
            }
            self.emit('registerPlayers');
        });

        self.on('registerPlayers', function () {
            self.getApps().then(function (reply) { // TODO refactor this
                if (reply.ok) {
                    var apps = reply.result.appss_loop;
                    var dir = __dirname + '/';
                    fs.readdir(dir, function (err, files) {
                        files.forEach(function (file) {
                            var fil = file.substr(0, file.lastIndexOf('.'));
                            for (var player in apps) {
                                if (fil === apps[player].cmd) {
                                    var app = require(dir + file);
                                    self.apps[apps[player].cmd] = new app(defaultPlayer, apps[player].name,
                                        apps[player].cmd, self.address, self.port, self.username, self.password);
                                    /* workaround, app needs existing player id so first is used here */
                                }
                            }
                        });
                        self.emit('register');
                    });
                } else
                    self.emit('register');
            });
        });
    }

    register();
}

inherits(SqueezeServer, SqueezeRequest);

module.exports = SqueezeServer;
