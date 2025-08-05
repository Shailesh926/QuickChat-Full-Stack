import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

// --- NEW: Gets all conversations for the logged-in user ---
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({ participants: userId })
            .populate("participants", "-password")
            .populate("lastMessage")
            .sort({ updatedAt: -1 })
            .lean();
        
        // Populate the sender details for the last message
        for (let convo of conversations) {
            if (convo.lastMessage) {
                await User.populate(convo.lastMessage, { path: "senderId", select: "fullName profilePic" });
            }
        }

        res.json({ success: true, conversations });
    } catch (error) {
        console.log("Error in getConversations controller: ", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// --- NEW: Creates a new group conversation ---
export const createGroup = async (req, res) => {
    try {
        const { name, participants } = req.body;
        const admin = req.user._id;

        if (!name || !participants || participants.length < 1) {
            return res.status(400).json({ success: false, message: "Please provide a group name and at least one participant." });
        }

        // Add the admin to the participants list
        const allParticipants = [...participants, admin];

        const newConversation = await Conversation.create({
            isGroupChat: true,
            groupName: name,
            participants: allParticipants,
            groupAdmin: admin
        });

        const fullConversation = await Conversation.findById(newConversation._id)
            .populate("participants", "-password")
            .lean();

        // You can also emit a socket event here to notify all participants

        res.status(201).json({ success: true, conversation: fullConversation });

    } catch (error) {
        console.log("Error in createGroup controller: ", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
