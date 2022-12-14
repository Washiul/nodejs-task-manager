const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/tasks', auth, async (req, res)=>{
	// const task = new Task(req.body);

	try{
		const task = new Task({
			...req.body,
			owner: req.user._id
		});
		await task.save();
		res.status(201).send(task)
	}catch(e){
		res.status(400).send(e);
	}
});

router.get('/tasks', auth, async (req, res)=>{
	
	const match = {};
	const sort = {};

	if( req.query.completed ){
		match.completed = req.query.completed==='true';
	}

	if( req.query.sortBy ){
		const part = req.query.sortBy.split(':');
		sort[part[0]] = part[1] === 'desc' ? -1 : 1;
	}

	try{
		await req.user.populate({
			path: 'tasks',
			match,
			options:{
				limit: parseInt(req.query.limit?req.query.limit:10),
				skip: parseInt(req.query.skip?req.query.skip:0),
				sort
			}
		});
		res.status(200).send(req.user.tasks);
	}catch(e){
		res.status(500).send(e);
	}

});

router.get('/tasks/:id', auth, async (req, res)=>{
	try{
		const _id = req.params.id;
		const task = await Task.findOne({_id, owner: req.user._id});
		if( !task ){
			return res.status(404).send();
		}
		res.status(200).send(task);
	}catch(e){
		res.status(500).send(e);
	}
});

module.exports = router;