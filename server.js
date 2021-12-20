import geckos from '@geckos.io/server';
import http from 'http'
import express from 'express'
import _ from 'lodash';

const PORT = 8081;
const app = express();
const server = http.createServer(app);
const io = geckos();
const cors=require("cors");
const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}

app.use(cors(corsOptions)) 
let counter = 0;
io.addServer(server);
let onlineUsers = [{
    id: 1,
    name: "Jos",
    role: 'student',
    points: 0
}, {
    id: 2,
    name: "Jan",
    role: 'student',
    points: 0
}, {
    id: 3,
    name: "Bert",
    role: 'student',
    points: 0
}];
let rewards = [{
    name: "Jan",
    reward: "Starbucks coffe"
},{
    name: "Bert",
    reward: "USB Stick"
}];

io.listen(PORT); // default port is 9208

io.onConnection(channel => {
    channel.on('add user', data => {
        console.log('adding user');
        if (data.role === 'admin') {
            counter ++;
            if (counter === 1) {
                onlineUsers.push(data);
                io.room(channel.roomId).emit('get users', onlineUsers);
            } else {
                io.room(channel.roomId).emit('get users', onlineUsers);
            }
        }
        else {
            onlineUsers.push(data);
            io.room(channel.roomId).emit('get users', onlineUsers);
        }
    })

    channel.on('admin point update', data => {
        let index = _.findIndex(onlineUsers, function(o) { return o.name === data.name; });
        onlineUsers[index].points += data.points;
        let name = data.name;
        let points = onlineUsers[index].points;
        io.room(channel.roomId).emit('point update', {name, points})
    })

    channel.on('brought friend', data => {
        io.room(channel.roomId).emit('admin friend', data);
    })

    channel.on('get rewards', data => {
        io.room(channel.roomId).emit('give rewards', rewards);
    })

    channel.on('add reward', data => {
        let index = _.findIndex(onlineUsers, function(o) { return o.name === data.prizeObject.name; });
        if (onlineUsers[index].points >= data.points){
            onlineUsers[index].points = onlineUsers[index].points - data.points
            rewards.push(data.prizeObject);
            io.room(channel.roomId).emit('give rewards', rewards);
            let name = data.prizeObject.name;
            let points = onlineUsers[index].points;
            io.room(channel.roomId).emit('point update', {name, points})
        }        
    })

    channel.on('remove reward', data => {
        let tempArray = _.remove(rewards, function(n) {
            return n.id === data
        })
        io.room(channel.roomId).emit('give rewards', rewards);
    })

    channel.on('server message', data => {
        console.log(`got ${data} from "chat message"`);
        // emit the "chat message" data to all channels in the same room
        io.room(channel.roomId).emit('chat message', data);
    })

    channel.emit('admin message', 'hello from server');
})