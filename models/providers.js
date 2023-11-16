const mongoose=require('mongoose')

const providerSchema=mongoose.Schema({
    user_name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required: true
    },
    service_provider:{
        type:String,
        required:true
    }
})


const Provider=mongoose.model('Provider',providerSchema)
module.exports=Provider