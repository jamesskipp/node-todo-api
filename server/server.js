require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const { ObjectId } = require('mongodb');
const hbs = require('hbs');
const path = require('path');

const { mongoose } = require('./db/mongoose'); // eslint-disable-line no-unused-vars
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

hbs.registerPartials(`${__dirname}/../views/partials`);
app.set('view engine', 'hbs')
  .use(express.static(path.join(`${__dirname}/../public`)));

app.use(bodyParser.json());

// GET '/'
app.get('/', (req, res) => res.render('index.hbs'));

// POST /todos
app.post('/todos', authenticate, async (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    _creator: req.user._id,
  });

  try {
    const todoSave = await todo.save();

    return res.send(todoSave);
  } catch (err) {
    return res.status(400).send(err);
  }
});

// GET /todos
app.get('/todos', authenticate, async (req, res) => {
  try {
    const todos = await Todo.find({
      _creator: req.user._id,
    });

    return res.send({ todos });
  } catch (err) {
    return res.status(400).send(err);
  }
});

// GET /todos/:id
app.get('/todos/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) return res.status(404).send();

  try {
    const todo = await Todo.findOne({
      _id: id,
      _creator: req.user._id,
    });

    if (!todo) return res.status(404).send();

    return res.send({ todo });
  } catch (err) {
    return res.status(400).send();
  }
});

// DELETE /todos/:id
app.delete('/todos/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) return res.status(404).send();

  try {
    const todo = await Todo.findOneAndRemove({
      _id: id,
      _creator: req.user._id,
    });

    if (!todo) return res.status(404).send();

    return res.send({ todo });
  } catch (err) {
    return res.status(400).send();
  }
});

// PATCH /todos/:id
app.patch('/todos/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectId.isValid(id)) return res.status(404).send();

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  try {
    const todo = await Todo.findOneAndUpdate({
      _id: id,
      _creator: req.user._id,
    }, {
      $set: body,
    }, {
      new: true,
    });

    if (!todo) return res.status(404).send();

    return res.send({ todo });
  } catch (err) {
    return res.status(400).send();
  }
});

// POST /users
app.post('/users', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);
    await user.save();
    const token = await user.generateAuthToken();
    return res.header('x-auth', token).send(user);
  } catch (err) {
    return res.status(400).send(err);
  }
});

// GET /users/me
app.get('/users/me', authenticate, (req, res) => res.send(req.user));

// POST /users/login
app.post('/users/login', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = await User.findByCredentials(body.email, body.password);
    const token = await user.generateAuthToken();
    return res.header('x-auth', token).send(user);
  } catch (err) {
    return res.status(400).send();
  }
});

// DELETE /users/me/token
app.delete('/users/me/token', authenticate, async (req, res) => {
  try {
    await req.user.removeToken(req.token);
    return res.status(200).send();
  } catch (err) {
    return res.status(400).send();
  }
});

app.listen(port, () => {
  console.log(`Server Started on ${port}`);
});

module.exports = { app };
