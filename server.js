// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public'), {followSymlinks: true}));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/api/movies', (req, res) => {
    const fs = require('fs')
    const query = req.query.q;
    const paths = fs.readdirSync("./public/Movies");
    const ext = ["mp4", "mkv", "avi", "flv", "mov"];
    let movies = paths.filter(i => ext.includes(i.split('.').pop()));
    if (query) {
        // fuzzy search through the movies
        const Fuse = require('fuse.js');
        const fuse = new Fuse(movies.map(i => {
            return {name: i}
        }), {
            keys: ['name'],
        });
        movies = fuse.search(query).map(i => i.item.name);
    }
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(movies))
    res.end();
})

let currentTimeArray = [];
let isTimeoutRunning = false;
io.on('connection', socket => {
    socket.on('pause', () => {
        io.emit('pause');
    });
    socket.on('play', () => {
        io.emit('play');
    });
    socket.on('seek', (time) => {
        io.emit('seek', time);
    });

    socket.on('requestResync', () => {
        io.emit('pause');
        io.emit('resync');
    });

    socket.on('sendCurrentTime', (time, id) => {
        currentTimeArray.push({time, id});
        if (!isTimeoutRunning) {
            isTimeoutRunning = true;
            setTimeout(() => {
                let highestTimeEntry = currentTimeArray.reduce((prev, current) => prev.time > current.time ? prev : current);
                io.emit('setCurrentTime', highestTimeEntry.time);
                currentTimeArray = [];
                isTimeoutRunning = false;
            }, 500);
        }
    });
});

server.listen(25565, () => {
    console.log('Listening on port 25565');
});
