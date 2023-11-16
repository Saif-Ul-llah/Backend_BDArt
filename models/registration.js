
const mongoose=require('mongoose')

const userSchema=mongoose.Schema({
    user_name:{
        type:String     
    },
    email:{
        type:String      
    },
    password:{
        type:String
    }
})

userSchema.statics.emailExists= async function(email){
    try{
       // console.log(typeof email)
        const user=await this.findOne({email})
        if(user) return false
    
        return true
    }
    catch(error){
        console.log(`error from emailExists: ${error.message}`)
        return false
    }
} 


const Registration = mongoose.model('Registration',userSchema)

module.exports=Registration