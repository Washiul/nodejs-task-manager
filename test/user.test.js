const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const userOneId = new mongoose.Types.ObjectId();
const testUser = {
	_id: userOneId,
	name: "Washi",
	email: 'washi@example.com',
	password: '12345',
	age: 30,
	tokens: [{
		token: jwt.sign({_id: userOneId.toString()}, 'mynameiswashiul')
	}]
}

beforeEach( async ()=>{
	await User.deleteMany();
	await new User(testUser).save();
});

test('Register new user', async ()=>{
	await request(app).post('/users').send({
		name: "test",
		email: 'test78@example.com',
		password: '12345',
		age: 30
	}).expect(201);
});

test('Login API', async ()=>{
	await request(app).post('/users/login').send({
		email: testUser.email,
		password: testUser.password,
	}).expect(200);
});

test('Get user profile', async ()=>{
	await request(app)
		  .get('/users/me')
		  .set('Authorization', `Bearer ${testUser.tokens[0].token}`)
		  .send()
		  .expect(200);
})