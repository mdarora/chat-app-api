const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('./db/models/userSchema');

const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : process.env.MAIL,
        pass : process.env.MAIL_PASS
    }
});

let regUser = {}
let generatedOTP;
//////////////////////////-Functions-///////////////////////////////////

const sendOtpViaMail = email =>{
    const sendOTP = new Promise((resolve, reject) =>{
        const otp = Math.floor(Math.random() * 1000000);
        const mailOptions = {
            from : process.env.MAIL,
            to : email,
            subject : 'OTP Verification code for Chat-app',
            text : `Your 6 digit One Time Password (OTP) for Chat-app is\n${otp}`
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                reject({error : 'OTP sending failed'});
            } else {
                console.log(info.response);
                resolve({otp});
            }
        });
    });

    return sendOTP
}


///////////////////////////-Routes-/////////////////////////////////////

router.get("/", (req, res)=>{
    res.status(200).json({message : "home page of server"});
});

router.post("/register", async (req, res)=>{
    const {name, email, password, cpassword} = req.body;
    if (!name || !email || !password || !cpassword) {
        return res.status(422).json({error : "All fields are required"});
    } else if (password !== cpassword){
        return res.status(422).json({error : "Both passwords must be same"});
    }

    try {
        const findByEmail = await User.findOne({email});
        console.log('findByEmail : ',findByEmail);
        if (findByEmail){
            return res.status(422).json({error : "Email already registered"});
        }

        regUser = {name, email, password}
        generatedOTP = await sendOtpViaMail(email);

        if (generatedOTP.error){
            return res.status(500).json({error : "Something went wrong!"});
        } else {
            generatedOTP = generatedOTP.otp;
        }
        res.status(202).json({message: 'OTP sent to your E-mail'});

    } catch (error) {
        console.log(error);
        return res.status(500).json({error : "Something went wrong!"});
    }
});

router.post('/otpverification', async (req, res) => {
    if (req.body.enteredOtp !== generatedOTP) {
        return res.status(422).json({error : 'Invalid OTP'});
    }

    try {
        const hashedPassword = await bcrypt.hash(regUser.password, 12);
        const newUser = new User({
            name : regUser.name,
            email : regUser.email,
            password : hashedPassword
        });

        const result = await newUser.save();
        if (!result._id){
            console.log(result);
            return res.status(500).json({error : "Something went wrong!"});
        }
        regUser = {};
        generatedOTP = 0;
        res.status(201).json({message : 'Registered successfully'});

    } catch (error) {
        console.log(error);
        return res.status(500).json({error : "Something went wrong!"});
    }
});

module.exports = router;