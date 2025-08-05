import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // --- MODIFIED: State is now conversation-centric ---
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios, authUser } = useContext(AuthContext);

  // --- NEW: Function to get all conversations (groups and DMs) ---
  const getConversations = async () => {
    if (!authUser) return;
    try {
      const { data } = await axios.get("/api/messages/conversations");
      if (data.success) {
        setConversations(data.conversations);
        // You can also initialize unseenMessages counts here if needed
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // --- MODIFIED: Fetches messages for a conversation ---
  const getMessages = async (conversationId) => {
    try {
      const { data } = await axios.get(`/api/messages/${conversationId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // --- MODIFIED: Sends a message to a conversation ---
  const sendMessage = async (messageData) => {
    if (!selectedConversation) return;
    try {
      const { data } = await axios.post(`/api/messages/send/${selectedConversation._id}`, messageData);
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
        // Update the last message for the conversation list
        setConversations(prevConvos => 
          prevConvos.map(convo => 
            convo._id === selectedConversation._id 
              ? { ...convo, lastMessage: data.newMessage } 
              : convo
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch conversations when the user logs in
  useEffect(() => {
    getConversations();
  }, [authUser]);

  // Handle incoming real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // If the message is for the currently open conversation
      if (selectedConversation?._id === newMessage.conversationId) {
        setMessages((prev) => [...prev, newMessage]);
      }

      // Update the conversation list with the new last message and move it to the top
      setConversations((prevConvos) => {
        let conversationExists = false;
        const updatedConvos = prevConvos.map((convo) => {
          if (convo._id === newMessage.conversationId) {
            conversationExists = true;
            return { ...convo, lastMessage: newMessage };
          }
          return convo;
        });

        // If a new conversation was created, it might not be in the list yet
        if (!conversationExists) {
          // You might need to fetch the new conversation details here
          // For now, we'll just log it. A full implementation would fetch it.
          console.log("Received message for a new conversation. Refetching conversations.");
          getConversations(); // Simple solution: refetch all conversations
        }

        const convoIndex = updatedConvos.findIndex(c => c._id === newMessage.conversationId);
        if (convoIndex > -1) {
            const [convoToMove] = updatedConvos.splice(convoIndex, 1);
            return [convoToMove, ...updatedConvos];
        }
        return updatedConvos;
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedConversation, setConversations]);


  const value = {
    messages,
    setMessages,
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    unseenMessages,
    setUnseenMessages,
    getConversations,
    getMessages,
    sendMessage,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
