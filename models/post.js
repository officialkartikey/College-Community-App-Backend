import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Artificial Intelligence (AI)",
        "Technical",
        "Machine Learning",
        "Data Science",
        "Python Programming",
        "Web Development",
       
        "AR / VR",
        "Cloud Computing",
        "Cyber Security",
        "Robotics",
        "Electronics",
        "Mechanical Design",
        "CAD / CAM",
        "Electrical Systems",
        "Embedded Systems",
        "Blockchain",
        "Quantum Computing",
        "Competitive Coding",
        "Hackathons",
        "Research & Innovation",
      ],
      required: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
    },

    mediaUrl: {
      type: String,
    },

    // ✅ Add this field to store Cloudinary file reference
    public_id: {
      type: String,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
