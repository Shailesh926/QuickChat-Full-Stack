import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import toast from 'react-hot-toast';
import assets from '../assets/assets';

const CreateGroupModal = ({ setIsCreatingGroup }) => {
  const { authUser, axios } = useContext(AuthContext);
  const { setConversations } = useContext(ChatContext);

  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);

  const handleContactToggle = (contactId) => {
    setSelectedContacts((prevSelected) =>
      prevSelected.includes(contactId)
        ? prevSelected.filter((id) => id !== contactId)
        : [...prevSelected, contactId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedContacts.length < 1) {
      toast.error('Please name the group and select at least one contact.');
      return;
    }

    try {
      // You will need to create this backend endpoint
      const { data } = await axios.post('/api/auth/create-group', {
        name: groupName,
        participants: selectedContacts,
      });

      if (data.success) {
        toast.success('Group created successfully!');
        setIsCreatingGroup(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to create group.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#282142] text-white p-6 rounded-lg w-full max-w-md border border-gray-600">
        <h2 className="text-xl font-medium mb-4">Create New Group</h2>
        
        <form onSubmit={handleCreateGroup}>
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-light mb-2">Group Name</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-[#8185B2]/10 p-2 rounded border border-gray-500 outline-none"
              placeholder="Enter group name..."
            />
          </div>

          <div className="mb-4">
            <p className="block text-sm font-light mb-2">Select Members</p>
            <div className="max-h-48 overflow-y-auto p-2 border border-gray-500 rounded">
              {authUser?.contacts?.map((contact) => (
                <div key={contact._id} className="flex items-center justify-between p-2 rounded hover:bg-[#8185B2]/10">
                  <div className="flex items-center gap-3">
                    <img src={contact.profilePic || assets.avatar_icon} alt={contact.fullName} className="w-8 h-8 rounded-full" />
                    <span>{contact.fullName}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact._id)}
                    onChange={() => handleContactToggle(contact._id)}
                    className="w-5 h-5 accent-violet-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIsCreatingGroup(false)}
              className="py-2 px-5 rounded bg-gray-500/50 hover:bg-gray-500/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded bg-violet-600 hover:bg-violet-700"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
