module.exports = {
    requireLogin: (req,res,next) => {   //สิทธิ์การเข้าถึง login ก่อน
        return next();
        // if (req.isAuthenticated()){
        //     return next();
        // }else{
        //     res.redirect('/');
        // }
    },
    ensureGuest: (req,res,next) =>{    //ไม่ต้อง login ก็เข้าถึงได้
        if (req.isAuthenticated()) {
            res.redirect('/profile');
        }else{
            return next();
        }
    }
};