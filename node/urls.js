const _ = require('underscore');
var fs = require('fs');

for(let i = 1; i <= 7; i++) {}

for(let i = 508; i > 0; i--) {
    const thread = _.random(1, 7);
    console.log(`http://n${thread}.radio-t.com/rtfiles/rt_podcast${i}.mp3`)
}
