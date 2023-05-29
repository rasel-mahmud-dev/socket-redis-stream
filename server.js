const express = require("express")
const {Server} = require("socket.io");
const {createAdapter} = require("@socket.io/redis-adapter");
const {createClient} = require("redis");
const http = require("http")

const app = express()

app.get("/", function (req, res) {
    res.send("hello")
})
const pubClient = createClient({url: "redis://127.0.0.1:6379"});
const subClient = pubClient.duplicate();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:63342",
        methods: ["GET", "POST"]
    }
});


async function getClient() {
    let client = createClient({url: "redis://127.0.0.1:6379"})
    await client.connect()
    return client
}


io.on("connection", async (socket) => {
    console.log(`${socket.id} connected`);

    await socket.join("roomID");

    // grab old all room messages and send back to joined user
    let client = await getClient()
    let [messages]  = (await client.hmGet("messages", "roomID"))
    socket.emit("history-message", messages)

    // upon disconnection
    socket.on("disconnect", (reason) => {
        console.log(`socket ${socket.id} disconnected due to ${reason}`);
    });


    socket.on("message", async function (message) {
        let [oldRoomMessage] = await client.hmGet("messages", message.roomId)
        let messages = JSON.parse(oldRoomMessage || "") || []
        messages.push(message)
        await client.hSet("messages", message.roomId, JSON.stringify(messages))
        socket.nsp.to(message.roomId).emit("receive-msg", message)
    })
})


Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));

    server.listen(4000, () => console.log("server is running on port 4000"))
});

// function addChatMessage(chatGroupId, message, client) {
//     const messageFields = {
//         message,
//         timestamp: Date.now().toString()
//     };
//
//     client.xadd(chatGroupId, '*', messageFields, (err, messageId) => {
//         if (err) {
//             console.error(err);
//         } else {
//             console.log('Chat message added to stream with ID:', messageId);
//         }
//     });
// }