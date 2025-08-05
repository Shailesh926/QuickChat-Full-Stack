import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// ... (signup, login, checkAuth, updateProfile functions remain the same) ...
export const signup = async (req, res) => {
  const { fullName, username, email, password, bio } = req.body;

  try {
    if (!fullName || !username || !email || !password || !bio) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.json({ success: false, message: "An account with this email already exists." });
      }
      if (existingUser.username === username) {
        return res.json({ success: false, message: "This username is already taken." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser._id);

    res.json({
      success: true,
      userData: newUser,
      token,
      message: "Account created successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email })
      .populate("contacts", "-password")
      .lean();

    if (!userData) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      userData.password
    );

    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userData._id);

    res.json({
      success: true,
      userData,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("contacts", "-password")
      .lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log("Error in checkAuth controller: ", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;

    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      );
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


export const addContact = async (req, res) => {
  try {
    const { io, userSocketMap } = req;
    const { username } = req.body;
    const myId = req.user._id;

    if (!username) {
      return res
        .status(400)
        .json({ success: false, message: "Username is required." });
    }

    const contactToAdd = await User.findOne({ username });

    if (!contactToAdd) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (contactToAdd._id.equals(myId)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You cannot add yourself as a contact.",
        });
    }

    const me = await User.findById(myId);

    if (me.contacts.includes(contactToAdd._id)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "This user is already in your contacts.",
        });
    }

    await User.findByIdAndUpdate(myId, {
      $addToSet: { contacts: contactToAdd._id },
    });
    await User.findByIdAndUpdate(contactToAdd._id, {
      $addToSet: { contacts: myId },
    });

    let conversation = await Conversation.findOne({
      isGroupChat: false,
      participants: { $all: [myId, contactToAdd._id] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [myId, contactToAdd._id],
      });
    }

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "-password")
      .lean();

    const updatedUser = await User.findById(myId)
      .populate("contacts", "-password")
      .lean();

    const contactSocketId = userSocketMap[contactToAdd._id];
    if (contactSocketId) {
      // --- FIXED: Re-added the event to update the other user's contact list ---
      io.to(contactSocketId).emit("newContactAdded", {
        _id: me._id,
        fullName: me.fullName,
        username: me.username,
        profilePic: me.profilePic,
        bio: me.bio,
      });
      // --- This event adds the new chat window to their sidebar ---
      io.to(contactSocketId).emit("newConversation", populatedConversation);
    }

    res.json({
      success: true,
      message: "Contact added successfully!",
      user: updatedUser,
      conversation: populatedConversation,
    });
  } catch (error) {
    console.log("Error in addContact controller: ", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const addGroup = async (req, res) => {
  try {
    const { io, userSocketMap } = req;
    let { name, participants } = req.body;
    const myId = req.user._id;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Groupname is required." });
    }

    const me = await User.findById(myId);

    participants = [...participants, myId];

    let conversation = await Conversation.create({
      participants: participants,
      isGroupChat: true,
      groupName: name,
      groupAdmin: myId,
    });
    
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "-password")
      .lean();

    conversation.participants.forEach(participantId => {

          const participantSocketId = userSocketMap[participantId];
          if (participantSocketId) {
              io.to(participantSocketId).emit("newConversation", populatedConversation);
          }
    });

    res.json({
      success: true,
      message: "Contact added successfully!",
      conversation: populatedConversation,
    });
  } catch (error) {
    console.log("Error in addContact controller: ", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
