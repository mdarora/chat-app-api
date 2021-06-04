const jwt = require('jsonwebtoken');

const loginAuth = (req, res, next) =>{
    const jwtoken = req.cookies.jwtoken;
    if (!jwtoken){
        return res.status(401).json({loginError: 'Login first'});
    }

    try {
        const verifyJwtoken = jwt.verify(jwtoken, process.env.SECRET_KEY);
        req.id = verifyJwtoken._id;
        req.name = verifyJwtoken.name;
        next();
        
    } catch (error) {
        console.log(error);
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({loginError: error.message});
        }
        return res.status(401).json({loginError: 'Something went wrong!',error});
    }
}

module.exports = loginAuth;