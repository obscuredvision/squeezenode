'use strict';
var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    spies = require('chai-spies'),
    squeezenode = require('../');

chai.config.includeStack = true;
chai.use(spies);
chai.use(chaiAsPromised);

var expect = chai.expect,
    should = chai.should();

describe('Squeezenode', function () {

    var squeeze,
        url = '',
        port = '',
        username = '',
        password = '@';

    beforeEach(function () {
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
});