import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChatContainer = () => {
  const {
    messages,
    selectedConversation,
    setSelectedConversation,
    sendMessage,
    getMessages
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);
  const scrollEnd = useRef();
  const [input, setInput] = useState('');

  const getChatDetails = () => {
    if (!selectedConversation) return {};

    if (selectedConversation.isGroupChat) {
      return {
        name: selectedConversation.groupName,
        image: selectedConversation.groupIcon || assets.group_icon,
        isGroup: true
      };
    } else {
      const otherUser = selectedConversation.participants.find(
        (p) => p._id !== authUser?._id
      );
      return {
        name: otherUser?.fullName || 'Chat',
        image: otherUser?.profilePic || assets.avatar_icon,
        isGroup: false,
        otherUserId: otherUser?._id
      };
    }
  };

  const chatDetails = getChatDetails();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return null;
    await sendMessage({ text: input.trim() });
    setInput('');
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedConversation) {
      getMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return selectedConversation ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* ------- header ------- */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img src={chatDetails.image} alt="" className="w-8 h-8 rounded-full object-cover" />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {chatDetails.name}
          {!chatDetails.isGroup && onlineUsers.includes(chatDetails.otherUserId) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>
        <img
          onClick={() => setSelectedConversation(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>

      {/* ------- chat area ------- */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {messages.map((msg, index) => {
          const fromMe = msg.senderId._id === authUser._id;
          return (
            <div
              key={index}
              className={`flex items-end gap-2 my-2 ${fromMe ? 'justify-end' : 'justify-start'}`}
            >
              {!fromMe && (
                <img
                  src={msg.senderId.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-7 h-7 rounded-full self-end"
                />
              )}

              {msg.image ? (
                <img
                  src={msg.image}
                  alt=""
                  className="max-w-[230px] border border-gray-700 rounded-lg"
                />
              ) : (
                <div
                  className={`p-2 max-w-[250px] md:text-sm font-light rounded-lg break-words ${
                    fromMe
                      ? 'bg-violet-500/30 text-white rounded-br-none'
                      : 'bg-gray-500/30 text-white rounded-bl-none'
                  }`}
                >
                  {selectedConversation.isGroupChat && !fromMe && (
                    <p className="text-xs text-violet-300 font-semibold mb-1">
                      {msg.senderId.fullName}
                    </p>
                  )}
                  <p>{msg.text}</p>
                </div>
              )}

              {fromMe && (
                <img
                  src={authUser?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-7 h-7 rounded-full self-end"
                />
              )}
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* ------- bottom area ------- */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => (e.key === 'Enter' ? handleSendMessage(e) : null)}
            type="text"
            placeholder="Send a message"
            className="flex-1 text-sm p-3 bg-transparent border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png, image/jpeg"
            hidden
          />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" className="w-5 mr-2 cursor-pointer" />
          </label>
        </div>
        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} className="max-w-16" alt="" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
      <p className="text-sm">Select a chat to start messaging.</p>
    </div>
  );
};

export default ChatContainer;
