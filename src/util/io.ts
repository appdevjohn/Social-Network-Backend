import http from 'http';
import { Server } from 'socket.io';

import User from '../models/user';
import Conversation from '../models/conversation';
import Message from '../models/message';

/**
 * The object used to emit information to sockets.
 */
let io: Server;

/**
 * This function must be run as early as possible, or socket-based updates will not work.
 * @param server The Node http server which this socket.io Server instance will be attached.
 */
export const setupSocketIO = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: 'GET',
            preflightContinue: false,
            optionsSuccessStatus: 204
        }
    });

    io.on('connection', socket => {

        // Remove the socket ID from the user. We'll know the user is not online if the socket ID is null.
        socket.on('disconnect', () => {
            User.findBySocketId(socket.id).then(user => {
                if (user) {
                    user.socketId = null;
                    user.update();
                }
            }).catch(error => {
                console.error('On socket disconnect, there was an error.', error);
            });
        });

        // Add the socket ID to the user's account so we can send updates to their device.
        socket.on('subscribe', ({ userId }) => {
            if (userId) {
                User.findById(userId).then(user => {
                    user.socketId = socket.id
                    user.update();
                }).catch(error => {
                    console.error('On socket connect, there was an error', error);
                });
            }
        });

        // Store the id of the last read message.
        socket.on('read-message', ({ userId, convoId, messageId }) => {
            Conversation.updateLastReadMessage(messageId, convoId, userId);
        });
    });
}

/**
 * Sends an update to each participant in a conversation where a message was just sent.
 * @param convoId Participants of this conversation will be sent an update.
 * @param message The message content of the update.
 */
export const updateConversation = (convoId: string, message: Message) => {
    Conversation.findById(convoId).then(convo => {
        return convo.members();
    }).then(members => {
        members.forEach(member => {
            if (member.socketId && message.userId !== member.id) {
                io?.to(member.socketId).emit('message', message);
            }
        });
    });
}