const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');

const router = new express.Router();

router.post('/users', async (req, res)=>{
	
	const user = new User( req.body );

	try{
		await user.save();
		const token = await user.generateAuthToken();
		res.status(201).send({user, token});
	}catch(e){
		res.status(400).send(e);
	}
	
});

router.post('/users/login', async (req, res)=>{
	try{
		const user = await User.findByCredentials(req.body.email, req.body.password);
		const token = await user.generateAuthToken();
		//Method 1
		// res.send({user: user.getPublicProfile(), token});
		//Method 2
		res.send({user, token});
	}catch(e){
		res.status(400).send(e);
	}
});

router.post('/users/logout', auth, async (req, res)=>{
	try{
		req.user.tokens = req.user.tokens.filter((token)=>{
			return token.token!==req.token;
		})
		await req.user.save();
		res.send();
	}catch(e){
		res.status(500).send();
	}
})

router.get('/users', async (req, res)=>{
	try{
		const users = await User.find({});
		res.status(200).send(users);
	}catch(e){
		res.status(500).send(e);
	}
});

router.get('/users/me', auth, async (req, res)=>{
	const userData = await req.user.getPublicProfile();
	res.status(200).send({user: userData});
});

router.patch('/users/me', auth, async (req, res)=>{
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'email', 'password', 'age'];
	const isValidOperation = updates.every((update)=> allowedUpdates.includes(update));
	
	if( !isValidOperation ){
		return res.status(400).send({error: 'invalid format!'});
	}

	try{
		// const user = await User.findById(req.params.id);
		updates.forEach((update)=> req.user[update] = req.body[update]);
		await req.user.save();
		//Schema middleware does not work with findByIdAndUpdate
		// const user = await User.findByIdAndUpdate( req.params.id, req.body, { new: true, runValidators: true});
		// if(!user ){
		// 	return res.status(404).send();
		// }
		res.status(200).send(req.user);
	}catch(e){
		res.status(400).send(e);
	}
});

router.delete('/users/me', auth, async (req, res)=>{
	try{

		//Method 1
		// const user = await User.findByIdAndDelete(req.params.id);
		// if(!user){
		// 	return res.status(404).send();
		// }
		// res.send(user);

		// Method 2

		await req.user.remove();
		res.send(req.user);

	}catch(e){
		res.status(500).send();
	}
});

const upload = multer({
	limits:{
		fileSize: 1000000
	},
	fileFilter(req, file, cb){
		if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
			return cb(new Error('Please upload an image'));
		}
		
		cb(undefined, true);
	}
});

router.post('/users/me/avater', auth, upload.single('avater'), async (req, res)=>{
	const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
	req.user.avater = buffer;
	await req.user.save();
	res.send();

}, (err, req, res, next)=>{
	res.status(400).send({error: err.message});
});

router.delete('/users/me/avater', auth, async (req, res)=>{
	req.user.avater = undefined;
	await req.user.save();
	res.send();

}, (err, req, res, next)=>{
	res.status(400).send({error: err.message});
});

router.get('/users/:id/avater', async (req, res)=>{
	try{
		const user = await User.findById(req.params.id);
		if(!user || !user.avater){
			throw new Error();
		}
		res.set('Content-Type', 'image/jpg');
		res.send(user.avater);
	}catch(e){
		res.status(400).send();
	}

}, (err, req, res, next)=>{
	res.status(400).send({error: err.message});
});

module.exports = router;