import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";


export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.user._id, userId] },
  })
    .populate("users", "-password")
    .populate("latestMessage");

  if (chat) return res.status(200).json(chat);

  
  const newChat = await Chat.create({
    chatName: "Direct Chat",
    isGroupChat: false,
    users: [req.user._id, userId],
  });

  const fullChat = await Chat.findById(newChat._id).populate("users", "-password");
  res.status(200).json(fullChat);
};


export const fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const createGroupChat = async (req, res) => {
  const { name, users } = req.body;  

  if (!name || !users) {
    return res.status(400).json({ message: "Please provide name & users" });
  }

  if (users.length < 2) {
    return res.status(400).json({ message: "Group must have at least 2 members" });
  }

  users.push(req.user._id); 

  const groupChat = await Chat.create({
    chatName: name,
    users,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json(fullGroupChat);
};


export const renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json(chat);
};


export const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json(chat);
};


export const removeFromGroup = async (req, res) => {
  try {
    // ✅ Support both body or params (depending on Flutter call)
    const chatId = req.body.chatId || req.params.chatId;
    const userId = req.body.userId || req.params.userId;

    console.log(`🗑 Removing user ${userId} from chat ${chatId}`);

    if (!chatId || !userId) {
      return res.status(400).json({ message: "chatId and userId are required" });
    }

    // ✅ Remove user using $pull
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "name email profileImage")
      .populate("groupAdmin", "name email");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found or user not removed" });
    }

    res.status(200).json({
      message: "✅ User removed successfully",
      group: updatedChat,
      membersCount: updatedChat.users.length,
    });
  } catch (error) {
    console.error("❌ Error removing user:", error);
    res.status(500).json({
      message: "Failed to remove user",
      error: error.message,
    });
  }
};



export const leaveGroup = async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.user._id;

    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!chat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    res.status(200).json({
      success: true,
      message: "You have left the group",
      chat,
    });

  } catch (error) {
    console.error("Error leaving group:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getGroupMembers = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    const chat = await Chat.findById(chatId).populate("users", "name email profilePic");

    if (!chat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    res.status(200).json({
      success: true,
      chatName: chat.chatName,
      members: chat.users,
      groupAdmin: chat.groupAdmin,
    });
  } catch (error) {
    console.error("Error fetching group members:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
