const express = require("express");
const path = require("path");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socketIO = require("socket.io");
// EKMEK //
const { isFunction } = require("util");
const notes = require("./api/notes");
const io = socketIO(server);

/* TO DO: v1.2
    bağlı olanlar sayfasının tasarımı değişti +
*/

const port = process.env.PORT || 3000;
var notesends = [];

for (let notei = 0; notei < notes.length; notei++) {
    const note = notes[notei];
    if(notei === 0) {
        notesends.push({
            "title": note.title,
            "version": note.version,
            "content": note.content
        });
    }
    else {
        notesends.push({
            "title": note.title,
            "version": note.version
        });
    }
}

app.use("/", express.static(path.join(__dirname, "public/menu")));
app.use("/room", express.static(path.join(__dirname, "public/main")));
app.use("/updatenotes", express.static(path.join(__dirname, "public/updatenotes")));
app.use("/updatenotes/:title", express.static(path.join(__dirname, "public/updatenote")));
app.use("/creators", express.static(path.join(__dirname, "public/creators")));

app.get("/api/lastversion", (req, res) => {
    res.status(200).send(notes[0].version);
});

app.get("/api/updatenotes", (req, res) => {
    res.status(200).send(JSON.stringify(notesends));
});

app.get("/api/updatenotes/:title", (req, res) => {
    const note = notes.find(note => note.title === req.params.title);
    if(note) {
        res.status(200).send(JSON.stringify(note));
    }
    else {
        res.status(404).send("Belki Gelecekte Bu Sayfa Mevcut Olur...");
    }
});

app.use("/*", express.static(path.join(__dirname, "public/404page")));

server.listen(port, () => {
    console.log(`App started on ${port}`);
});

class User {
    constructor(socket, name) {
        this.name = name;
        this.socket = socket;
    }
}

class Room {
    constructor(id) {
        this.id = id;
        this.roomStarted = false;
        this.users = [];
        this.typing = [];
        this.typingNames = [];
    }
    SendMsg(nick, msg, sendersocket) {
        this.users.forEach(user => {
            if(user.socket !== sendersocket) {
                user.socket.emit("RECVMESSAGE", nick, msg);
            }
        });
    }
    SendFile(nick, filename, filetype, file, sendersocket) {
        this.users.forEach(user => {
            if(user.socket !== sendersocket) {
                user.socket.emit("RECVFILE", nick, filename, filetype, file);
            }
        });
    }
    SendTyping() {
        this.users.forEach(user => {
            user.socket.emit("TYPING_UPDATE", this.typingNames);
        });
    }
    AddUser(socket, name) {
        this.users.push(new User(socket, name));
        this.users.forEach(user => {
            var nicks = [];
            this.users.forEach(nuser => {
                var username = nuser.name;
                if(user.socket.id === nuser.socket.id) {
                    username += ": Siz";
                }
                nicks.push(username);
            });
            user.socket.emit("USERS_UPDATE", nicks);
            user.socket.emit("NEW_USER_MESSAGE", name);
            user.socket.emit("TYPING_UPDATE", this.typingNames);
        });
    }
    RemoveUser(socket) {
        const usertmp = this.users.find(user => user.socket === socket);
        this.users = this.users.filter(user => user.socket !== socket);
        var nicks = [];
        this.users.forEach(user => {
            nicks.push(user.name);
        });
        this.users.forEach(user => {
            user.socket.emit("USERS_UPDATE", nicks);
            user.socket.emit("DISC_USER_MESSAGE", usertmp.name);
        });
    }
}

class App {
    constructor() {
        this.rooms = [];
    }
    AddRoom(roomid) {
        this.rooms.push(new Room(roomid));
    }
    RemoveRoom(roomid) {
        this.rooms = this.rooms.filter(room => room.id !== roomid);
    }
};

var appc = new App();

setInterval(() => {
    for (let roomi = 0; roomi < appc.rooms.length; roomi++) {
        const room = appc.rooms[roomi];
        if(room.roomStarted === true) {
            if(room.users.length === 0) {
                appc.RemoveRoom(room.id);
                console.log("ROOM DELETED " + appc.rooms.length);
            }
        }
    }
}, 1000);

io.on("connection", (socket) => {
    socket.emit("WELCOME", 1);
    socket.on("JOINROOM", (roomid, nick) => {
        var room = appc.rooms.find(room => room.id === roomid);
        if(room === undefined) {
            appc.AddRoom(roomid);
            room = appc.rooms.find(room => room.id === roomid);
            console.log("Room Created " + roomid);
        }
        room.AddUser(socket, nick);
        room.roomStarted = true;
        socket.emit("RESULTJOIN", true);
    });
    socket.on("NEWMESSAGE", (roomid, nick, msg) => {
        const room = appc.rooms.find(room => room.id === roomid);
        room.SendMsg(nick, msg, socket);
    });
    socket.on("NEWFILE", (roomid, nick, filename, filetype, file) => {
        const room = appc.rooms.find(room => room.id === roomid);
        room.SendFile(nick, filename, filetype, file, socket);
    });
    socket.on("TYPING", (msg, roomid) => {
        const room = appc.rooms.find(room => room.id === roomid);
        if (msg === false) {
            room.typing = room.typing.filter(typ => typ !== socket);
        }
        else if(msg === true) {
            var i = false;
            room.typing.forEach(typ => {
                if(typ === socket) {
                    i = true;
                }
            });
            if(i === false) {
                room.typing.push(socket);
            }
        }
        
        room.typingNames = [];
        
        room.typing.forEach(typ => {
            room.users.forEach(user => {
                if(typ === user.socket) {
                    room.typingNames.push(user.name);
                }
            });
        });

        room.SendTyping();
    });
    socket.on("disconnect", (msg) => {
        appc.rooms.forEach(room => {
            room.users.forEach(user => {
                if(socket === user.socket) {
                    room.typing = room.typing.filter(typ => typ !== socket);
                    room.typingNames = [];
        
                    room.typing.forEach(typ => {
                        room.users.forEach(user => {
                            if(typ === user.socket) {
                                room.typingNames.push(user.name);
                            }
                        });
                    });

                    room.SendTyping();
                    room.RemoveUser(user.socket);
                }
            });
        });
        console.log("USER DISCONNECTED!");
    })
    console.log("USER CONNECTED!");
})