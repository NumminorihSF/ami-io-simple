/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 (NumminorihSF) Konstantine Petryaev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


function Client(config) {
    Client.super_.call(this, config);
    this.extensions = {};
    this.on('rawEvent.Newchannel', function(e){
        if (e.channelstate == '0') this.callStart(e);
    });
    this.on('rawEvent.Join', this.callJoin);
    this.on('rawEvent.QueueCallerAbandon', this.callAbandoned);
    this.on('rawEvent.Newstate', this.callNewState);
    this.on('rawEvent.Newexten', this.callNewExten);
    this.on('rawEvent.LocalBridge', this.callLocalBridge);
    this.on('rawEvent.Bridge', function(e){
        if (e.bridgestate === 'Link') this.callAnswer(e);
    });
    this.on('rawEvent.Hangup', this.callEnd);

    this.on('rawEvent.Join', this.queueJoin);
    this.on('rawEvent.Leave', this.queueLeave);

    this.on('rawEvent.QueueMemberAdded', this.queueMemberAdded);
    this.on('rawEvent.QueueMemberPaused', this.queueMemberPaused);
    this.on('rawEvent.QueueMemberStatus', this.queueMemberStatus);
    this.on('rawEvent.QueueMemberRemoved', this.queueMemberRemoved);

    return this;
}

(function() {
    var util = require('util');
    var Parent = require('ami-io').Client;
    util.inherits(Client, Parent);
})();

Client.prototype.callStart = function(e){
    if (!e.calleridnum) {
        var ind = e.channel.indexOf('/');
        if (ind != -1) e.channel = e.channel.slice(ind+1);
        ind = e.channel.indexOf('@');
        if (ind != -1) e.channel = e.channel.slice(0, ind);
        ind = e.channel.indexOf('-');
        if (ind != -1) e.channel = e.channel.slice(0, ind);
        e.calleridnum = e.channel;
    }
    this.emit('ais.CallStart', {
        callId: e.uniqueid,
        from: e.calleridnum,
        to: e.exten,
        startAt: new Date().getTime()
    });
};

Client.prototype.callJoin = function(e){
    this.emit('ais.CallAddInfo', {
        callId: e.uniqueid,
        queue: e.queue,
        client: e.calleridnum,
        origPos: Number(e.position),
        route: 1,
        joinAt: new Date().getTime()
    });
};

Client.prototype.callAbandoned = function(e){
    this.emit('ais.CallAddInfo', {
        callId: e.uniqueid,
        abanPos: Number(e.position)
    });
};

Client.prototype.callNewState = function(e){
    if (e.channelstate !== '5') return;
    e.channel = e.channel.slice(0, e.channel.indexOf('-'));
    var ind = e.channel.indexOf('@');
    if (ind != -1) e.channel = e.channel.slice(0, ind);
    e.channel = e.channel.slice(e.channel.indexOf('/')+1);
    this.emit('ais.CallAddInfo', {
        callId: e.uniqueid,
        from: e.connectedlinenum,
        ringTo: e.channel,
        ringAt: new Date().getTime()
    });
    this.emit('ais.CallRing', {
        callId: e.uniqueid,
        from: e.connectedlinenum,
        ringTo: e.channel,
        ringAt: new Date().getTime()
    });
};

Client.prototype.callNewExten = function(e){
    this.emit('ais.CallAddInfo', {
        callId: e.uniqueid,
        context: e.context
    });
};

Client.prototype.callAnswer = function(e){
    var op2 = e.channel2.slice(e.channel2.indexOf('/')+1, e.channel2.indexOf('-'));
    var ind2 = op2.indexOf('@');
    if (ind2 != -1) op2 = op2.slice(0, ind2);
    var op1 = e.channel1.slice(e.channel1.indexOf('/')+1, e.channel1.indexOf('-'));
    var ind1 = op1.indexOf('@');
    if (ind1 != -1) op1 = op1.slice(0, ind1);
    this.emit('ais.CallAnswer', {
        callId: e.uniqueid1,
        callId2: e.uniqueid2,
        channelFrom: e.channel1,
        channelNameFrom: op1,
        channelTo: e.channel2,
        channelToFrom: op2,
        from: e.callerid1,
        to: e.callerid2,
        answerAt: new Date().getTime()
    });
};

Client.prototype.callEnd = function(e) {
    e.channel = e.channel.slice(0, e.channel.indexOf('-'));
    var ind = e.channel.indexOf('@');
    if (ind != -1) e.channel = e.channel.slice(0, ind);
    e.channel = e.channel.slice(e.channel.indexOf('/') + 1);
    this.emit('ais.CallEnd', {
        callId: e.uniqueid,
        endAt: new Date().getTime(),
        cause: Number(e.cause)
    });
};

Client.prototype.callLocalBridge = function(e){
    this.emit('ais.CallAddInfo', {
        callId: e.uniqueid1,
        referTo: e.uniqueid2
    });
};

Client.prototype.queueLeave = function(e){
    this.emit('ais.QueueLeave', {
        callId: e.uniqueid,
        queue: e.queue,
        position: e.position});
};

Client.prototype.queueJoin = function(e){
    this.emit('ais.CallAddInfo', {
        callId: e.uniqueid,
        queue: e.queue,
        client: e.calleridnum,
        origPos: Number(e.position),
        route: 1
    });
    this.emit('ais.QueueJoin', {
        callId: e.uniqueid,
        queue: e.queue,
        client: e.calleridnum,
        origPos: Number(e.position),
        route: 1,
        joinAt: new Date().getTime()
    });
};

Client.prototype.queueMemberPaused = function(e){
    var exten = e.location.slice(e.location.indexOf('/')+1);
    var ind = exten.indexOf('@');
    if (ind != -1) exten = exten.slice(0, ind);
    ind = exten.indexOf('-');
    if (ind != -1) exten = exten.slice(0, ind);
    ind = e.membername.indexOf('$');

    var paused = 0;
    if (e.paused) {
        if (e.reason) {
            if (e.reason == 'Scenario-Pause') paused = 3;
            else if (e.reason == 'Service-Pause') paused = 4;
            else if (e.reason == 'Auto-Pause') paused = 2;
        }
        else paused = 1;
    }
    this.extensions[exten] = this.extensions[exten] || {};
    this.extensions[exten][e.queue] = this.extensions[exten][e.queue] || {
            status: 1
        };
    this.extensions[exten][e.queue].paused = paused;

    this.emit('ais.QueueMemberStatus', {
        queue: e.queue,
        device: exten,
        user: (ind === -1) ? e.membername : e.membername.slice(0, ind),
        appId: (ind === -1) ? 0 : e.membername.slice(ind + 1),
        penalty: Number(e.penalty),
        paused: this.extensions[exten][e.queue].paused,
        status: this.extensions[exten][e.queue].status,
        extenState: this.extensions[exten],
        reason: e.reason || null
    });
};

Client.prototype.queueMemberStatus = function (e) {
    var exten = e.location.slice(e.location.indexOf('/')+1);
    var ind = exten.indexOf('@');
    if (ind != -1) exten = exten.slice(0, ind);
    ind = exten.indexOf('-');
    if (ind != -1) exten = exten.slice(0, ind);
    ind = e.membername.indexOf('$');

    this.extensions[exten] = this.extensions[exten] || {};
    this.extensions[exten][e.queue] = this.extensions[exten][e.queue] || {
            paused: Number(e.paused)
        };
    this.extensions[exten][e.queue].status = Number(e.status);
    this.emit('ais.QueueMemberStatus', {
        queue: e.queue,
        device: exten,
        user: (ind === -1) ? e.membername : e.membername.slice(0, ind),
        appId: (ind === -1) ? 0 : e.membername.slice(ind + 1),
        penalty: Number(e.penalty),
        paused: this.extensions[exten][e.queue].paused,
        status: this.extensions[exten][e.queue].status,
        extenState: this.extensions[exten],
        reason: null
    });
};

Client.prototype.queueMemberAdded = function(e){
    var exten = e.location.slice(e.location.indexOf('/')+1);
    var ind = exten.indexOf('@');
    if (ind != -1) exten = exten.slice(0, ind);
    ind = exten.indexOf('-');
    if (ind != -1) exten = exten.slice(0, ind);
    e.membername = e.membername || e.name;
    ind = e.membername.indexOf('$');
    if (e.paused) {
        var paused = Number (e.paused);
    }
    paused = paused || 0;

    this.extensions[exten] = this.extensions[exten] || {};
    this.extensions[exten][e.queue] = {
        status: 1,
        paused: paused
    };

    this.emit('ais.QueueMemberAdded', {
        queue: e.queue,
        device: exten,
        user: (ind === -1) ? e.membername : e.membername.slice(0, ind),
        appId: (ind === -1) ? 0 : e.membername.slice(ind + 1),
        penalty: Number(e.penalty),
        paused: this.extensions[exten][e.queue].paused,
        status: this.extensions[exten][e.queue].status,
        extenState: this.extensions[exten]
    });
};

Client.prototype.queueMemberRemoved = function(e){
    var exten = e.location.slice(e.location.indexOf('/')+1);
    var ind = exten.indexOf('@');
    if (ind != -1) exten = exten.slice(0, ind);
    ind = exten.indexOf('-');
    if (ind != -1) exten = exten.slice(0, ind);
    e.membername = e.membername || e.name;
    ind = e.membername.indexOf('$');

    if (this.extensions[exten]) {
        if (this.extensions[exten][e.queue]){
            delete this.extensions[exten][e.queue];
        }
        var shouldDelete = true;

        for(var i in this.extensions[exten]){
            shouldDelete = false;
            break;
        }

        if (shouldDelete) delete this.extensions[exten];

    }

    this.emit('ais.QueueMemberRemoved', {
        queue: e.queue,
        device: exten,
        user: (ind === -1) ? e.membername : e.membername.slice(0, ind),
        appId: (ind === -1) ? 0 : e.membername.slice(ind + 1)
    });
};




(function(){
    var forExport = require('ami-io');
    forExport.Client = Client;
    module.exports = forExport;
})();
