import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^[a-zA-Z0-9._%+-]+@akgec\.ac\.in$/.test(email);
        },
        message: "Only AKGEC email addresses are allowed (@akgec.ac.in)",
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },

    branch: {
      type: String,
      enum: [
        "IT",
        "CSE",
        "CS",
        "CSIT",
        "EN",
        "ECE",
        "CIVIL",
        "AIML",
        "CSE(DS)",
        "CSE(AIML)",
        "ME",
        "CS(HINDI)",
      ],
      required: [true, "Branch is required"],
    },

    interests: [
      {
        type: String,
        enum: [
          "Artificial Intelligence (AI)",
          "Machine Learning",
          "Data Science",
          "Python Programming",
          "Web Development",
          "App Development",
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
      },
    ],

    year: {
      type: String,
      enum: ["1st", "2nd", "3rd", "4th"],
      required: [true, "Year is required"],
    },

   
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
  
  if (!this.isModified("password")) return next();


  const salt = await bcrypt.genSalt(10);


  this.password = await bcrypt.hash(this.password, salt);

  next();
});


userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
