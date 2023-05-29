const API = "http://localhost:4000"
let joinUser = {}

const sendMessageBtn = document.getElementById("send-msg")
const loginForm = document.getElementById("login-form")
const userName = document.querySelector(".user-name")
const messageList = document.querySelector(".message-list")

var socket;
let messages = []


function renderMessages(messages = []) {
    messageList.innerHTML = null
    messages.forEach(message => {
        let messageTemplate = `
                <div class="message">
                       <span>${message.message}</span>
                </div>
            `

        const messageElement = document.createElement("div")
        messageElement.innerHTML = messageTemplate
        messageList.appendChild(messageElement)
    })
}

window.addEventListener("DOMContentLoaded", function () {

    // current auth checking

    let chatUserAuth = window.localStorage.getItem("chatUserAuth") || ""
    if (chatUserAuth) {
        joinUser = JSON.parse(chatUserAuth)
        loginForm.style.display = "none"
        sendMessageBtn.style.display = "block"
        userName.innerHTML = `
                <h1 style="color: white">${joinUser.name}</h1>
                <button onclick="handleLogout()">Logout</button>
            `
    }

    // login controller
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault()
        let name = loginForm.name.value
        if (name) {
            joinUser.name = name
            joinUser.id = Math.floor(Math.random() * 100000).toString()
            loginForm.style.display = "none"
            sendMessageBtn.style.display = "block"
            userName.innerHTML = `
                <h1 style="color: white">${joinUser.name}</h1>
                <button onclick="handleLogout()">Logout</button>
            `
            localStorage.setItem("chatUserAuth", JSON.stringify(joinUser))
        }
    })

    // sendMessage
    sendMessageBtn.addEventListener("submit", sendMessage)

    socket = io(API);

    socket.on("connect", function (data) {
        socket.on("history-message", function (previousMessages) {
            try{
                messages = JSON.parse(previousMessages)
            } catch (ex){}
            renderMessages(messages)
        })

        socket.on("receive-msg", function (msg) {
            messages.push(msg)
            renderMessages(messages)
        })
    })
})


function sendMessage(e) {
    e.preventDefault();
    socket.emit("message", {roomId: "roomID", userId: joinUser.id, message: e.target.message.value})

}

function handleLogout() {
    joinUser = {}
    localStorage.removeItem("chatUserAuth")
}


