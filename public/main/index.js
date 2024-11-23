const urlparams = new URLSearchParams(document.location.search);
const roomidt = urlparams.get("roomid");
const nickt = urlparams.get("nick");
const nick = nickt.slice(0, 15);
const roomid = roomidt.slice(0, 10);
const msginp = document.getElementById("msgval");
const msgcont = document.querySelector(".msg-container");
const fileinp = document.querySelector("#fileinp");
const othbtn = document.querySelector("#othbtn");
const othcont = document.querySelector(".others-container");
const usersbtn = document.querySelector(".users-btn");
const maindiv = document.querySelector(".main");
const usersdiv = document.querySelector(".users");
const bottombtn = document.querySelector(".bottom-btn");
const loadingdiv = document.querySelector(".loading");
const menubar = document.querySelector(".menubar");
const errordiv = document.querySelector(".error");

let socket = 0;
let app = 0;
var displaymode = 0;
var displayOthersBox = false;
var sendMode = 0;
var msgNumber = 0;

class App {
    constructor(rid, name) {
        this.roomid = rid;
        this.name = name;
    }
    SendMsg() {
        //SEND MSG WITH ROOM ID
        var msg = msginp.value; //.replace(/<\/?[^>]+(>|$)/g, "");
        if(sendMode === 0) {
            if(msg !== "") {
                msginp.value = "";
                socket.emit("NEWMESSAGE", this.roomid, this.name, msg);
            
                msgcont.innerHTML += "<div class='message-own msg" + msgNumber + "'><div class='msgcont-own'>" + msg + "</div></div>";
                
                if(msgNumber !== 0) {
                    document.querySelector(".msg" + (msgNumber - 1)).style.animation = "none";
                }
            
                document.querySelector(".msg" + msgNumber).style.animation = "msg-anim 0.1s linear";

                msgNumber++;
                
                msgcont.scrollTop = msgcont.scrollHeight;
            }
        }
        else if(sendMode === 1) {
            if(fileinp.value !== "") {
                socket.emit("NEWFILE", this.roomid, this.name, fileinp.files[0].name,
                                fileinp.files[0].type,
                                fileinp.files[0]);

                msgcont.innerHTML += "<div class='message-own msg" + msgNumber + "'><div class='msgcont-own'>Dosya Gönderdin: " + fileinp.files[0].name + "</div></div>";
                
                if(msgNumber !== 0) {
                    document.querySelector(".msg" + (msgNumber - 1)).style.animation = "none";
                }
            
                document.querySelector(".msg" + msgNumber).style.animation = "msg-anim 0.1s linear";

                msgNumber++;

                msgcont.scrollTop = document.querySelector(".msg-container").scrollHeight;

                fileinp.value = "";
                fileinp.style.backgroundColor = "#84c2ff";
                fileinp.style.color = "black";
            }
        }
    }
};

window.addEventListener("submit", (e) => {
    e.preventDefault();
    if(app) {
        app.SendMsg();
        socket.emit("TYPING", false, roomid);
        msginp.style.width = "60%";
        othbtn.style.display = "inline";
    }
});

function TypingControl() {
    if(msginp.value === "") {
        socket.emit("TYPING", false, roomid);
        msginp.style.width = "60%";
        othbtn.style.display = "inline";
    }
    else {
        socket.emit("TYPING", true, roomid);
        msginp.style.width = "81%";
        othbtn.style.display = "none";
    }
};

function TypingOthControl() {
    othcont.style.display = "none";
    othbtn.value = "DİĞER";
    displayOthersBox = false;
}

function ChangeFileInput() {
    if(fileinp.value === "") {
        fileinp.style.backgroundColor = "#84c2ff";
        fileinp.style.color = "black";
    }
    else {
        fileinp.style.backgroundColor = "#6495C7";
        fileinp.style.color = "white";
    }
}

function OthersBoxControl() {
    if(displayOthersBox) {
        othcont.style.display = "none";
        msginp.style.display = "inline";
        fileinp.style.display = "none";
        fileinp.style.backgroundColor = "#84c2ff";
        fileinp.style.color = "black";
        fileinp.value = "";
        othbtn.value = "DİĞER";
        sendMode = 0;
        
        displayOthersBox = false;
    }
    else {
        othcont.style.display = "block";
        othbtn.value = "GERİ";
        displayOthersBox = true;
    }
}

function SendFileUnitDisplay() {
    othcont.style.display = "none";
    msginp.style.display = "none";
    fileinp.style.display = "inline";
    sendMode = 1;
}

usersbtn.addEventListener("click", (e) => {
    if(displaymode === 0) {
        document.querySelector(".msg" + (msgNumber - 1)).style.animation = "none";
        maindiv.style.display = "none";
        usersdiv.style.display = "block";
        usersbtn.innerHTML = "MESAJLAR";
        displaymode = 1;
    }
    else if(displaymode === 1) {
        maindiv.style.display = "block";
        usersdiv.style.display = "none";
        usersbtn.innerHTML = "BAĞLI OLANLAR";
        displaymode = 0;
    }
});

bottombtn.addEventListener("click", (e) => {
    msgcont.scrollTop = msgcont.scrollHeight;
});

function ScrollCheck() {
    var scrolledToEnd = Math.ceil(msgcont.scrollHeight - msgcont.scrollTop) <= msgcont.clientHeight + 20;

    if (scrolledToEnd) {
        bottombtn.style.display = "none";
    }
    else {
        bottombtn.style.display = "block";
    }
}

window.onload = () => {
    if (roomid !== "" && nick !== "" && roomid !== null && nick !== null) {
        socket = io.connect(window.location.origin);
        socket.on("WELCOME", (msg) => {
            socket.emit("JOINROOM", roomid, nick);
        });
        socket.on("RESULTJOIN", (msg) => {
            app = new App(roomid, nick);
            loadingdiv.style.display = "none";
            maindiv.style.display = "block";
            menubar.style.display = "block";
            document.querySelector(".roomidcont").innerHTML = "Oda İsmi: " + roomid;
        });
        socket.on("RECVMESSAGE", (nick, msg) => {
            var scrolledToEnd = Math.ceil(msgcont.scrollHeight - msgcont.scrollTop) <= msgcont.clientHeight + 20;

            msgcont.innerHTML += "<div class='message msg" + msgNumber + "'><div class='msgnick'>" + nick + "</div><div class='msgcont'>" + msg + "</div></div>";
            
            if(msgNumber !== 0) {
                document.querySelector(".msg" + (msgNumber - 1)).style.animation = "none";
            }
        
            document.querySelector(".msg" + msgNumber).style.animation = "msg-anim 0.1s linear";

            msgNumber++;

            if(scrolledToEnd) {
                msgcont.scrollTop = msgcont.scrollHeight;
            }
        });
        socket.on("RECVFILE", (nick, filename, filetype, file) => {
            var scrolledToEnd = Math.ceil(msgcont.scrollHeight - msgcont.scrollTop) <= msgcont.clientHeight + 20;

            var fileblob = new Blob([file]);

            msgcont.innerHTML += "<div class='message msg" + msgNumber + "'><div class='msgnick'>" + nick + 
                                "</div><div class='msgcont filecont'>Dosya - İndirmek için tıklayın: <a href='"
                                + window.URL.createObjectURL(fileblob) + "' download='" + filename + "'>"
                                + filename + "</a></div>";

            if(msgNumber !== 0) {
                document.querySelector(".msg" + (msgNumber - 1)).style.animation = "none";
            }
            
            document.querySelector(".msg" + msgNumber).style.animation = "msg-anim 0.1s linear";

            msgNumber++;

            if(scrolledToEnd) {
                msgcont.scrollTop = msgcont.scrollHeight;
            }
        });
        socket.on("USERS_UPDATE", (users) => {
            usersdiv.innerHTML = "";
            users.forEach(user => {
                usersdiv.innerHTML += "<div class='user'>" + user + "</div>";
            });
        });
        socket.on("NEW_USER_MESSAGE", (user) => {
            var scrolledToEnd = Math.ceil(msgcont.scrollHeight - msgcont.scrollTop) <= msgcont.clientHeight + 20;

            msgcont.innerHTML += "<div class='infocont msg" + msgNumber + "'><div class='infomsg'>" + user + " Bağlandı" + "</div></div>";

            if(msgNumber !== 0) {
                document.querySelector(".msg" + (msgNumber - 1)).style.animation = "none";
            }
            
            document.querySelector(".msg" + msgNumber).style.animation = "msg-anim 0.1s linear";

            msgNumber++;
            
            if(scrolledToEnd) {
                msgcont.scrollTop = msgcont.scrollHeight;
            }
        });
        socket.on("DISC_USER_MESSAGE", (user) => {
            var scrolledToEnd = Math.ceil(msgcont.scrollHeight - msgcont.scrollTop) <= msgcont.clientHeight + 20;

            msgcont.innerHTML += "<div class='infocont msg" + msgNumber + "'><div class='infomsg'>" + user + " Ayrıldı" + "</div></div>";

            if(msgNumber !== 0) {
                document.querySelector(".msg" + (msgNumber - 1)).style.animation = "none";
            }
            
            document.querySelector(".msg" + msgNumber).style.animation = "msg-anim 0.1s linear";

            msgNumber++;

            if(scrolledToEnd) {
                msgcont.scrollTop = msgcont.scrollHeight;
            }
        });
        socket.on("TYPING_UPDATE", (users) => {
            var typingText = "";
            if(users.length === 0) {
                document.querySelector(".typing-cont").style.display = "none";
            }
            else {
                for (let useri = 0; useri < users.length; useri++) {
                    typingText += users[useri];
                    if(useri !== users.length - 1) {
                        typingText += ", ";
                    }
                };
                document.querySelector(".typing-cont").style.display = "block";
            }

            typingText += " yazıyor...";
            
            document.querySelector(".typing-cont").innerHTML = typingText;
        });
    }
    else {
        loadingdiv.style.display = "none";
        errordiv.style.display = "flex";
    }
};