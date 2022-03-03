function adminAuth(req,res,next){
    if(req.header('X-Api-Key')===process.env.ADMIN_AUTH_KEY){
      next();
    }else{
      res.status(401).send("Unauthorized");
    }
  }



  module.exports = {adminAuth}