import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // --- MODIFIED: A message now belongs to a conversation ---
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    // --- MODIFIED: Tracks an array of users who have seen the message ---
    seenBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;
