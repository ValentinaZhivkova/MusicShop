let messagesController =  (() => {
    function getMessagesPage(ctx) {
        ctx.isLoggedIn = authenticator.isAuth();
        ctx.isAdmin = authenticator.isAdmin();
        ctx.username = sessionStorage.getItem("username");
        ctx.loadPartials({
            header: './templates/common/header.hbs',
            footer: './templates/common/footer.hbs'
        }).then(function()  {
            this.partial('./templates/messages/messages.hbs');
        });
    }

    function getComposeMessagePage(ctx) {
        let recieverId = ctx.params.id.substring(1);

        ctx.recieverId = recieverId;
        ctx.isLoggedIn = authenticator.isAuth();
        ctx.isAdmin = authenticator.isAdmin();
        ctx.username = sessionStorage.getItem("username");
        ctx.loadPartials({
            header: './templates/common/header.hbs',
            footer: './templates/common/footer.hbs'
        }).then(function()  {
            this.partial('./templates/messages/composeMessage.hbs');
        });
    }

    function sendMessage(ctx) {
        let recieverId = ctx.params.id.substring(1);

        let message = {
            topic: ctx.params.topic,
            description: ctx.params.description,
            senderId: sessionStorage.getItem("userId"),
            recieverId: recieverId,
            senderName: sessionStorage.getItem("name"),
            senderUsername: sessionStorage.getItem("username"),
            datePosted: Date.now()
        };

        ctx.recieverId = recieverId;
        ctx.isLoggedIn = authenticator.isAuth();
        ctx.isAdmin = authenticator.isAdmin();
        ctx.username = sessionStorage.getItem("username");

        requester.get("user", recieverId, "kinvey")
            .then(function (userInfo) {
                message.recieverName = userInfo.name;
                message.recieverUsername = userInfo.username;

                requester.post("appdata", "messages", "kinvey", message)
                    .then(createSuccess)
                    .catch(authenticator.handleError);
            }).catch(authenticator.handleError);

        function createSuccess() {
            ctx.redirect("#/messages");
            authenticator.showInfo("Message sent!");
        }
    }

    function getRecievedMessages(ctx) {
        ctx.isLoggedIn = authenticator.isAuth();
        ctx.isAdmin = authenticator.isAdmin();
        ctx.username = sessionStorage.getItem("username");
        ctx.showingRecieved = true;

        loadSentOrRecievedMessages(ctx, "reciever");
    }

    function getSentMessages(ctx) {
        ctx.isLoggedIn = authenticator.isAuth();
        ctx.isAdmin = authenticator.isAdmin();
        ctx.username = sessionStorage.getItem("username");

        loadSentOrRecievedMessages(ctx, "sender");
    }

    function loadSentOrRecievedMessages(ctx, type) {
        let typeId = type + "Id";

        let endPoint = `messages?query={"${typeId}":"${sessionStorage.getItem("userId")}"}`;
        requester.get("appdata", endPoint, "kinvey")
            .then(loadSuccess)
            .catch(authenticator.handleError);

        function loadSuccess(data) {
            ctx.messageHasPartial = true;
            data.forEach(msg => {
                msg.combinedName = msg[type + 'Username'] + `(${msg[type + 'Name']})`;
            });

            ctx.messages = data;

            ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    messagesTable: './templates/messages/messagesTable.hbs',
                    shortRowMessage: "./templates/messages/shortRowMessage.hbs"
                }).then(function () {
                this.partial("./templates/messages/messages.hbs");
            });
        }
    }

    function loadDetailedMessagePage(ctx) {
        ctx.isLoggedIn = authenticator.isAuth();
        ctx.isAdmin = authenticator.isAdmin();
        ctx.username = sessionStorage.getItem("username");

        let msgId = ctx.params.id.substring(1);

        requester.get('appdata', "messages/" + msgId, 'kinvey')
            .then(loadSuccess).catch(authenticator.handleError);

        function loadSuccess(msgData) {
            console.log(msgData)
            ctx.date = new Date(Number(msgData.datePosted)).toDateString();
            ctx.topic = msgData.topic;
            ctx.description = msgData.description;
            ctx.senderName = msgData.senderName;
            ctx.recieverName = msgData.recieverName;
            ctx.senderId = msgData.senderId;
            ctx.recieverId = msgData.recieverId;
            let remessageId = '';
            if(msgData.senderId === sessionStorage.getItem('userId')){
                remessageId = msgData.recieverId;
            } else {
                remessageId = msgData.senderId;
            }

            ctx.remessageId = remessageId;

            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function () {
                this.partial("./templates/messages/detailedMessage.hbs");
            });
        }
    }


    return { getMessagesPage, getComposeMessagePage, sendMessage, getSentMessages, getRecievedMessages, loadDetailedMessagePage }
})();