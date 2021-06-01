const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

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

const sendOtpViaMail = (email, subject, text) =>{
    const sendOTP = new Promise((resolve, reject) =>{
        const otp = Math.floor(Math.random() * 1000000);
        const mailOptions = {
            from : process.env.MAIL,
            to : email,
            subject : subject,
            text : `${text}\n${otp}`
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

router.post('/login', async (req, res) =>{
    const {email, password} = req.body;
    if (!email || !password){
        return res.status(422).json({error: 'All fields are required'});
    }

    try {
        
        const findByEmail = await User.findOne({email}, {password: 1});
        if (!findByEmail){
            return res.status(422).json({error: 'Invalid details'});
        }

        const matchPass = await bcrypt.compare(password, findByEmail.password);
        if(!matchPass){
            return res.status(422).json({error: 'Invalid details'});
        }

        const token = jwt.sign({_id : findByEmail._id}, process.env.SECRET_KEY);
        res.cookie('jwtoken', token);
        return res.status(200).json({message: 'login successful'});

    } catch (error) {
        console.log(error);
        return res.status(500).json({error: 'Something went wrong!'});
    }
});

router.post("/register", async (req, res)=>{

    regUser = {};
    generatedOTP = 0;
    const {name, email, password, cpassword} = req.body;

    if (!name || !email || !password || !cpassword) {
        return res.status(422).json({error : "All fields are required"});
    } else if (password !== cpassword){
        return res.status(422).json({error : "Both passwords must be same"});
    }

    try {
        const findByEmail = await User.findOne({email});
        if (findByEmail){
            return res.status(422).json({error : "Email already registered"});
        }

        regUser = {name, email, password}
        generatedOTP = await sendOtpViaMail(email, 'OTP Verification code for Chat-app', 'Your One Time Password (OTP) for Chat-app is');

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
    if (parseInt(req.body.enteredOtp) !== generatedOTP) {
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
        // Todo : send mail of Registeration
        res.status(201).json({message : 'Registered successfully'});

    } catch (error) {
        console.log(error);
        return res.status(500).json({error : "Something went wrong!"});
    }
});


let generatedresetOTP = 0;
let resetId;
router.post('/reset-password', async (req, res) => {
    const resetEmail = req.body.resetEmail;
    if (!resetEmail) {
        return res.status(422).json({error: 'Please provide a valid input'});
    }

    try {
        const findByEmail = await User.findOne({email: resetEmail}, {_id : 1});
        if (!findByEmail){
            return res.status(404).json({error: 'Invalid E-mail'});
        }
        generatedresetOTP = await sendOtpViaMail(resetEmail,'OTP code to reset Password Chat-app', 'Your One Time Password (OTP) to reset your account\'s password is');

        if (generatedresetOTP.error){
            return res.status(500).json({error : "Something went wrong!"});
        } else {
            generatedresetOTP = generatedresetOTP.otp;
            resetId = findByEmail._id;
        }
        res.status(202).json({message: 'OTP sent to your E-mail'});

    } catch (error) {
        console.log(error);
        return res.status(500).json({error: 'Something went wrong'});
    }
});

router.put('/reset-password', async (req, res) => {
    if(generatedresetOTP == 0 || !resetId){
        return res.status(401).json({error: 'not allowed'});
    }

    const enteredResetOtp = req.body.enteredResetOtp;
    const newPassword = req.body.newPassword;
    const newCPassword = req.body.newCPassword;

    if (!enteredResetOtp || !newPassword || !newCPassword){
        return res.status(422).json({error: 'All fields are required'});
    } else if (newPassword !== newCPassword){
        return res.status(422).json({error: 'Both passwords must be same'});
    } else if (parseInt(enteredResetOtp) !== generatedresetOTP){
        return res.status(422).json({error: 'Invalid OTP'});
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const updatePass = await User.updateOne({_id:resetId}, {
            $set: {
                password: hashedPassword
            }
        });
        if (updatePass.ok){
            generatedresetOTP = 0;
            resetId = '';
            // Todo : send mail of password reseting
            return res.status(200).json({message: 'Password updated'});
        } else {
            console.log(updatePass);
            return res.status(500).json({error: 'Something went wrong!'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: 'Something went wrong!'});
    }
});

module.exports = router;;