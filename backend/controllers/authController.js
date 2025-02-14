import res from "express/lib/response.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/tokens.js";

export const signupUser = async (req, res) => {
    try {
        const {fullName, username, password, confirmPassword, gender} = req.body; 
        if(password !== confirmPassword)
        {
            return res.status(400).json({error: "Passwords do not match!"})
        }

        const user = await User.findOne({username});
        if(user) {
            return res.status(400).json({error: "Username already exists!"});
        }

        //PASSWORD HASH
        const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

        const boyRandomDP = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const girlRandomDP = `https://avatar.iran.liara.run/public/girl?username=${username}`;

        const newUser = new User({
            fullName,
            username,
            password:hashedPassword,
            gender,
            profilePic: gender === "male" ? boyRandomDP : girlRandomDP
        });

        if(newUser) {
            generateTokenAndSetCookie(newUser._id, res);
        await newUser.save();

        res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            password: newUser.password,
            profilePic: newUser.profilePic,
        });
        } else {
            res.status(400).json({ error: "Invalid user data" });
        }

    } catch(error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
};

export const loginUser = async (req, res) => {
    try {
        const { username, password} = req.body;
        const user = await User.findOne({ username });
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if(!user || !isPasswordCorrect) {
            return res.status(400).json({error: "Invalid user data"});
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            profilePic: user.profilePic,
        });
    } catch(error) {
        console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logoutUser = (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge: 0});
        res.status(200).json({ message: "Logged out successfully"});
    } catch (error) {
        console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
    }
};