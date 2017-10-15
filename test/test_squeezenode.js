'use strict';
var _ = require('lodash'),
    chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    spies = require('chai-spies'),
    squeezenode = require('../'),
    config = require('../test.json');

chai.config.includeStack = true;
chai.use(spies);
chai.use(chaiAsPromised);

var expect = chai.expect,
    should = chai.should();

describe('Squeezenode', function () {

    var squeeze,
        url = config.url,
        port = config.port,
        username = config.username,
        password = config.password;

    beforeAll(function () {
        squeeze = new squeezenode(url, port, username, password);
    });

    describe('with a valid connection', function () {
        it('should emit register event', function () {
            return expect(squeeze.register()).to.be.fulfilled;
        });

        it('should get player count', function () {
            return expect(squeeze.getPlayerCount()).to.eventually.have.property("result");
        });

        it('should get players', function (done) {
            var players = [];
            squeeze.register().then(function () {
                expect(Promise.resolve(Object.keys(squeeze.players))).to.eventually.have.length.above(0).notify(done);
            });
        });
    });

    describe('playlist', function () {
        it('update', function () {
            var currentPlaylist = ['B', 'A', 'C', 'D', 'F', 'G'],
                updatePlaylist = ['A', 'B', 'C', 'D', 'E'],
                expected = updatePlaylist;

            var removes = [], adds = [];

            if (updatePlaylist.length < currentPlaylist.length) {
                currentPlaylist = _.dropRight(currentPlaylist, currentPlaylist.length - updatePlaylist.length);
            }

            _.forEach(updatePlaylist, function (value, index) {
                if (index > currentPlaylist.length - 1) {
                    adds.push({letter: value, index: index});
                } else if (value !== currentPlaylist[index]) {
                    removes.push({letter: currentPlaylist[index], index: index});
                    adds.push({letter: value, index: index});
                }
            });

            _.forEachRight(removes, function (value, index) {
                currentPlaylist.splice(value.index, 1);
            });
            _.forEach(adds, function (value, index) {
                currentPlaylist.splice(value.index, 0, value.letter);
            });

            expect(expected).to.have.ordered.members(currentPlaylist);
        });
    });


});

/*
describe('playlist', function () {
        it('update', function () {
            var currentPlaylist = ['B', 'A', 'C', 'D', 'F', 'G'],
                updatePlaylist = ['A', 'B', 'C', 'D', 'E'],
                expected = updatePlaylist;

            var removes = [], adds = [];

            if (updatePlaylist.length < currentPlaylist.length) {
                currentPlaylist = _.dropRight(currentPlaylist, currentPlaylist.length - updatePlaylist.length);
            }

            _.forEach(updatePlaylist, function (value, index) {
                if (index > currentPlaylist.length - 1) {
                    adds.push({letter: value, index: index});
                } else if (value !== currentPlaylist[index]) {
                    removes.push({letter: currentPlaylist[index], index: index});
                    adds.push({letter: value, index: index});
                }
            });

            _.forEachRight(removes, function (value, index) {
                currentPlaylist.splice(value.index, 1);
            });
            _.forEach(adds, function (value, index) {
                currentPlaylist.splice(value.index, 0, value.letter);
            });

            expect(expected).to.have.ordered.members(currentPlaylist);
        });
    });
 */

/*
"file:///mnt/usb/Arc/Arclight/Arc%20-%20Arclight%20-%20Arcadia.mp3"
"file:///mnt/usb/Arc/Arclight/Arc%20-%20Arclight%20-%20Arclight.mp3"
"file:///mnt/usb/Arc/Arclight/Arc%20-%20Arclight%20-%20Into%20Dust.mp3"
 */