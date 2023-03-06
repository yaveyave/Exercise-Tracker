const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');


mongoose.connect('mongodb+srv://yave:CHb8GOQnUO64qcWD@cluster0.xagm8aw.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });



app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const tracker = new mongoose.Schema({ username: String });
const User = mongoose.model('User', tracker);

const exercise = new mongoose.Schema({
  "username": String,
  "date": Date,
  "duration": Number,
  "description": String,
});
const Exer = mongoose.model('Exer', exercise);

const registros = new mongoose.Schema({
  "username": String,
  "count": Number,
  "log": Array,
});
const Log = mongoose.model('Log', registros);

app.post('/api/users', (req, res) => {

  const userRequest = req.body.username;
  const user = new User({ username: userRequest });
  user.save((err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.json({
        username: data.username,
        _id: data.id
      });
    }
  })
});



//You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.

app.post('/api/users/:_id/exercises', (req, res) => {
  const postId = req.params._id;
  const descPost = req.body.description;
  //manejar duration
  const durPost = req.body.duration;
  const durPostNum = parseInt(durPost);
  //manejar date (is null use the current)
  let datePost = req.body.date;
  let dateOb = new Date(datePost);
  if (!datePost) {
    dateOb = new Date();
  }
  User.findById(postId, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      const user = new Exer({
        "username": data.username,
        "description": descPost,
        "duration": durPostNum,
        "date": dateOb,
      });
      user.save((err, obj) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Guardado exitoso');
          res.json(({
            "_id": postId,
            "username": obj.username,
            "description": obj.description,
            "duration": obj.duration,
            "date": obj.date.toDateString(),
          }));
        }
      });
    }
  });
});


//You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.
app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  const idPost = req.params._id;

  User.findById(idPost, (err, data) => {

    let logFilter = { username: data.username };

    if (from !== undefined && to === undefined) {
      logFilter.date = { $gte: new Date(from) }
    } else if (from === undefined && to !== undefined) {
      logFilter.date = { $lte: new Date(to) }
    } else if (from !== undefined && to !== undefined) {
      logFilter.date = { $gte: new Date(from), $lte: new Date(to) }
    }

    let limitByDefault = (limit) => {
      let defau = 100;
      if (limit) {
        return limit;
      } else {
        return defau;
      }
    }

    if (err) {
      console.log(err);
    } else {
      Exer.find((logFilter), null, { limit: limitByDefault(+limit) }, (err, exerObj) => {
        let arrayRequest = [];
        if (err) {
          console.log(err);
        } else {
          let auxExerObj = exerObj;
          let arrayRequest = auxExerObj.map((i) => {
            return {
              "description": i.description,
              "duration": i.duration,
              "date": i.date.toDateString(),
            }
          })
          const user = new Log({
            "username": data.username,
            "count": arrayRequest.length,
            "log": arrayRequest,
          });
          user.save((err, data) => {
            if (err) {
              console.log(err);
            } else {
              res.json({
                "_id": idPost,
                "username": data.username,
                "count": data.count,
                "log": arrayRequest
              });
            }
          })
        }
      });
    }
  })
});

app.get('/api/users', (req, res) => {
  const query = User.find({});
  query.exec((err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.json(data);
    }
  })
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
console.log(new Date());

