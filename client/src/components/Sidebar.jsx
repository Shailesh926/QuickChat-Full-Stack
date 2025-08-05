import React, { useContext, useEffect, useState } from 'react';
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import toast from 'react-hot-toast';
import CreateGroupModal from './CreateGroupModal'; // Make sure this component exists

const Sidebar = () => {
  const { 
    conversations, 
    setConversations,
    selectedConversation, 
    setSelectedConversation, 
    unseenMessages, 
    setUnseenMessages 
  } = useContext(ChatContext);
  
  const { logout, onlineUsers, authUser, setAuthUser, axios, socket } = useContext(AuthContext);

  const [input, setInput] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactUsername, setNewContactUsername] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const navigate = useNavigate();

  const getOneToOneChatDetails = (participants) => {
    const otherUser = participants.find(p => p._id !== authUser?._id);
    return {
      name: otherUser?.fullName || 'User',
      image: otherUser?.profilePic || assets.avatar_icon
    };
  };

  const filteredConversations = conversations
    ? input
      ? conversations.filter((convo) => {
          if (convo.isGroupChat) {
            return convo.groupName.toLowerCase().includes(input.toLowerCase());
          }
          const otherUser = convo.participants.find(p => p._id !== authUser?._id);
          return otherUser?.fullName.toLowerCase().includes(input.toLowerCase());
        })
      : conversations
    : [];

  useEffect(() => {
    if (socket) {
      const handleNewContact = (newContactData) => {
        setAuthUser(prevUser => {
          if (prevUser.contacts.find(c => c._id === newContactData._id)) {
            return prevUser;
          }
          return {
            ...prevUser,
            contacts: [...prevUser.contacts, newContactData]
          };
        });
        toast.success(`${newContactData.fullName} added you!`);
      };

      const handleNewConversation = (newConvo) => {
        setConversations(prev => [newConvo, ...prev]);
      };

      socket.on("newContactAdded", handleNewContact);
      socket.on("newConversation", handleNewConversation);

      return () => {
        socket.off("newContactAdded", handleNewContact);
        socket.off("newConversation", handleNewConversation);
      };
    }
  }, [socket, setAuthUser, setConversations]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactUsername.trim()) return;
    try {
      const { data } = await axios.post('/api/auth/add-contact', {
        username: newContactUsername,
      });
      if (data.success) {
        toast.success('Contact added successfully!');
        setAuthUser(data.user);
        if (data.conversation) {
          setConversations(prev => [data.conversation, ...prev]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    }
    setIsAddingContact(false);
    setNewContactUsername('');
  };

  return (
    <>
      {isCreatingGroup && <CreateGroupModal setIsCreatingGroup={setIsCreatingGroup} />}

      <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedConversation ? 'max-md:hidden' : ''}`}>
        <div className="pb-5">
          <div className="flex justify-between items-center">
            <img src={assets.logo} alt="logo" className="max-w-40" />
            <div className="relative py-2 group">
              <img src={assets.menu_icon} alt="Menu" className="max-h-5 cursor-pointer" />
              <div className="absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block">
                <p onClick={() => navigate('/profile')} className="cursor-pointer text-sm">Edit Profile</p>
                <hr className="my-2 border-t border-gray-500" />
                <p onClick={() => logout()} className="cursor-pointer text-sm">Logout</p>
              </div>
            </div>
          </div>

          <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
            <img src={assets.search_icon} alt="Search" className="w-3" />
            <input
              onChange={(e) => setInput(e.target.value)}
              type="text"
              className="bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1"
              placeholder="Search Chats..."
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            {!isAddingContact ? (
              <button onClick={() => setIsAddingContact(true)} className="flex-1 text-sm py-2 px-4 rounded-full bg-violet-500/30 hover:bg-violet-500/50 transition-colors">
                Add Contact
              </button>
            ) : (
              <form onSubmit={handleAddContact} className="flex items-center gap-2 w-full">
                <input
                  onChange={(e) => setNewContactUsername(e.target.value)}
                  value={newContactUsername}
                  type="text"
                  className="flex-1 bg-[#282142] text-xs border-none outline-none text-white placeholder-[#c8c8c8] py-2 px-4 rounded-full"
                  placeholder="Enter username..."
                  autoFocus
                />
                <button type="submit" className="bg-green-500/80 p-2 rounded-full">
                  <img src={assets.send_button} alt="Add" className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setIsAddingContact(false)} className="bg-red-500/80 p-2 rounded-full font-bold text-xs leading-none">X</button>
              </form>
            )}
            <button onClick={() => setIsCreatingGroup(true)} title="Create Group" className="p-2 rounded-full bg-violet-500/30 hover:bg-violet-500/50">
              <img src={assets.group_icon} alt="Create Group" className="w-10 h-10"/>
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          {filteredConversations.map((convo) => {
            const chatDetails = convo.isGroupChat
              ? { name: convo.groupName, image: convo.groupIcon || assets.group_icon }
              : getOneToOneChatDetails(convo.participants);
            
            const otherParticipant = !convo.isGroupChat ? convo.participants.find(p => p._id !== authUser?._id) : null;

            return (
              <div
                onClick={() => {
                  setSelectedConversation(convo);
                  setUnseenMessages((prev) => ({ ...prev, [convo._id]: 0 }));
                }}
                key={convo._id}
                className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${selectedConversation?._id === convo._id && 'bg-[#282142]/50'}`}
              >
                <img src={chatDetails.image} alt={chatDetails.name} className="w-[35px] aspect-[1/1] rounded-full object-cover"/>
                <div className="flex flex-col leading-5">
                  <p>{chatDetails.name}</p>
                  {!convo.isGroupChat && otherParticipant && (
                    onlineUsers.includes(otherParticipant._id) ? (
                      <span className="text-green-400 text-xs">Online</span>
                    ) : (
                      <span className="text-neutral-400 text-xs">Offline</span>
                    )
                  )}
                </div>
                {unseenMessages[convo._id] > 0 && (
                  <p className="absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50">
                    {unseenMessages[convo._id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Sidebar;