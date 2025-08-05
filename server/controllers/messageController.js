import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";

// --- MODIFIED: Sends a message to a specific conversation ---
export const sendMessage = async (req, res) => {
    try {
        const { io, userSocketMap } = req;
        const { text, image } = req.body;
        const { id: conversationId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            conversationId,
            text,
            image: imageUrl,
            seenBy: [senderId] // The sender has seen the message
        });

        // Update the conversation's lastMessage
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: newMessage._id
        });
        
        // Populate sender details for the socket payload
        await newMessage.populate("senderId", "fullName profilePic");

        // Emit the new message to all participants in the conversation
        const conversation = await Conversation.findById(conversationId);
        conversation.participants.forEach(participantId => {
            // Don't send the message back to the sender's socket
            if (participantId.equals(senderId)) return;

            const participantSocketId = userSocketMap[participantId];
            if (participantSocketId) {
                io.to(participantSocketId).emit("newMessage", newMessage);
            }
        });

        res.status(201).json({ success: true, newMessage });

    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// --- MODIFIED: Gets all messages for a specific conversation ---
export const getMessages = async (req, res) => {
    try {
        const { id: conversationId } = req.params;
        const userId = req.user._id;

        const messages = await Message.find({ conversationId })
            .populate("senderId", "fullName profilePic")
            .lean();
        
        // Mark messages as seen by the current user
        await Message.updateMany(
            { conversationId: conversationId, seenBy: { $ne: userId } },
            { $addToSet: { seenBy: userId } }
        );

        res.json({ success: true, messages });

    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
