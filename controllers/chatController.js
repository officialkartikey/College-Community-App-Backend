import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

// ✅ Create or Get One-to-One Chat
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

  // If chat doesn't exist → create new chat
  const newChat = await Chat.create({
    chatName: "Direct Chat",
    isGroupChat: false,
    users: [req.user._id, userId],
  });

  const fullChat = await Chat.findById(newChat._id).populate("users", "-password");
  res.status(200).json(fullChat);
};

// ✅ Fetch all chats of logged user
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

// ✅ Create Group Chat
export const createGroupChat = async (req, res) => {
  const { name, users } = req.body;  // users should be array

  if (!name || !users) {
    return res.status(400).json({ message: "Please provide name & users" });
  }

  if (users.length < 2) {
    return res.status(400).json({ message: "Group must have at least 2 members" });
  }

  users.push(req.user._id); // include creator

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

// ✅ Rename Group
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

// ✅ Add User to Group
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

// ✅ Remove User from Group
export const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json(chat);
};
