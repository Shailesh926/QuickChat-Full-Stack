import React, { useContext, useEffect, useState } from 'react';
import assets from '../assets/assets';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';

const RightSidebar = () => {
  const { selectedConversation, messages } = useContext(ChatContext);
  const { logout, authUser } = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);

  useEffect(() => {
    setMsgImages(messages.filter(msg => msg.image).map(msg => msg.image));
  }, [messages]);

  const getOtherUser = () => {
    if (!selectedConversation || selectedConversation.isGroupChat) return null;
    return selectedConversation.participants.find(p => p._id !== authUser._id);
  };

  const otherUser = getOtherUser();

  return selectedConversation && (
    <div className="bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll max-md:hidden">
      {selectedConversation.isGroupChat ? (
        <>
          <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto text-center">
            <img
              src={selectedConversation.groupIcon || assets.group_icon}
              alt="Group Icon"
              className="w-20 h-20 aspect-[1/1] rounded-full object-cover"
            />
            <h1 className="px-10 text-xl font-medium mx-auto">
              {selectedConversation.groupName}
            </h1>
            <p>{selectedConversation.participants.length} members</p>
          </div>
          <hr className="border-[#ffffff50] my-4" />
          <div className="px-5 text-xs">
            <p>Members</p>
            <div className="mt-2 max-h-[150px] overflow-y-scroll flex flex-col gap-2">
              {selectedConversation.participants.map(participant => (
                <div key={participant._id} className="flex items-center gap-3 p-1">
                  <img
                    src={participant.profilePic || assets.avatar_icon}
                    alt={participant.fullName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{participant.fullName}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto text-center">
            <img
              src={otherUser?.profilePic || assets.avatar_icon}
              alt="Profile Pic"
              className="w-20 h-20 aspect-[1/1] rounded-full object-cover"
            />
            <h1 className="px-10 text-xl font-medium mx-auto">
              {otherUser?.fullName}
            </h1>
            <p className="px-10 mx-auto">{otherUser?.bio}</p>
          </div>
        </>
      )}

      <hr className="border-[#ffffff50] my-4" />

      <div className="px-5 text-xs">
        <p>Media</p>
        <div className="mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">
          {msgImages.map((url, index) => (
            <div
              key={index}
              onClick={() => window.open(url)}
              className="cursor-pointer rounded"
            >
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover rounded-md"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => logout()}
        className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;
