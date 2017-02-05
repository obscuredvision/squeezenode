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

var Promise = require('bluebird'),
    jayson = require('jayson');

function SqueezeRequest(address, port, username, password) {
    var jsonrpc, client,
        self = this;

    self.address = (address !== undefined) ? address : 'localhost';
    self.port = (port !== undefined) ? port : 9000;
    self.username = username;
    self.password = password;
    self.defaultPlayer = '00:00:00:00:00:00';

    jsonrpc = self.address + ':' + self.port + '/jsonrpc.js';
    client = jayson.client.http(jsonrpc);
    client.options.version = 1;

    // Function to format the header for basic authentication.
    self.formatBasicHeader = function (username, password) {
        var tok = username + ':' + password;
        var hash = new Buffer(tok).toString('base64');
        return 'Basic ' + hash;
    };

    // Add a header for basic authentication if a username and password are given
    if (username && password) {
        if (!client.options.headers) {
            client.options.headers = {};
        }
        client.options.headers['Authorization'] = self.formatBasicHeader(username, password);
    }

    self.request = function (player, params) {
        return new Promise(function (resolve, reject) {
            var finalParams = [];
            finalParams.push(player);
            finalParams.push(params);
            client.request('slim.request', finalParams, null, function (error, reply) {
                var result = {};
                if (error) {
                    result = error;
                    result.ok = false;
                    reject(result);
                } else {
                    result = reply;
                    result.ok = true;
                    resolve(result);
                }
            });

        });
    };
}

module.exports = SqueezeRequest;
