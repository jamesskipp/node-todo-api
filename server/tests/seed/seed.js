const {ObjectId} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneId = new ObjectId();
const userTwoId = new ObjectId();
const users = [{
  _id: userOneId,
  email: 'userOne@example.com',
  password: 'userOnePass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneId, access: 'auth'}, 'secret').toString(),
  }]
}, {
  _id: userTwoId,
  email: 'userTwo@example.com',
  password: 'userTwoPass',
  tokens: []
}];

const todos = [{
  _id: new ObjectId(),
  text: 'first test todo'
}, {
  _id: new ObjectId(),
  text: 'second test todo',
  completed: true,
  completedAt: 333
}];

const populateTodos = (done) => {
  Todo.remove({}).then(() => {
    Todo.insertMany(todos)
  }).then(() => {
    done();
  }).catch(() => {});
};

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo])
  }).then(() => {
    done();
  }).catch(() => {});
};

module.exports = {
  todos,
  users,
  populateTodos,
  populateUsers,
}
