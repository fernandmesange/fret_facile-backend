import { Admin, User } from "../models/Users.model.js";

export const getClient = async (req, res) => {

    const { id } = req.params;
      try{
        if(id){
          const user = await User.findById(id,{password:0});
            if(!user){
                return res.status(404).json({message: 'User not found'});
            }
          res.status(200).json({user});
        }else{
          const users = await User.find({},{password:0});
          res.status(200).json({users});
        }
      }catch(error){
          console.log(error);
          res.status(400).json({message: 'Failed to get user'});
      }
  }


export const getUser = async (req, res) => {
    const { id } = req.user;
    try{
      const user = await User.findById(id,{password:0,document:0});
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
      res.status(200).json({user});
    }catch(error){
        console.log(error);
        res.status(400).json({message: 'Failed to get user'});
    }
}



export const getUsers = async (req, res) => {
  const { id } = req.user;
  try{
    const user = await Admin.findById(id,{password:0});
      if(!user){
          return res.status(404).json({message: 'You are not an admin'});
      }

      const users = await User.find({},{password:0});
    res.status(200).json({users});
  }catch(error){
      console.log(error);
      res.status(400).json({message: 'Failed to get user'});
  }
}