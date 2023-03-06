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
  username: String,
  description: String,
  duration: Number,
  date: String
});
const Exer = mongoose.model('Exer', exercise);

const registros = new mongoose.Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
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
        _id: data._id
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
      const exercises = new Exer({
        username: data.username,
        description: descPost,
        duration: durPostNum,
        date: dateOb.toDateString(),
      });
      exercises.save((err, obj) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Guardado exitoso');
          res.json(({
            username: obj.username,
            description: obj.description,
            duration: obj.duration,
            date: obj.date,
            _id: postId
          }));
        }
      });
    }
  });
});


//You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.
app.get('/api/users/:_id/logs', (req, res) => {
  const from = req.query;
  const to = req.query;
  const limit = req.query;
  const idPost = req.params._id;
  User.findById(idPost, (err, data) => {
    let logFilter = { username: data.username };
    if (from !== undefined && to !== undefined) {
      logFilter.date = { $gte: new Date(from), $lte: new Date(to) }
    }
    if (err) {
      console.log(err);
    } else {
      Exer.find(logFilter, null, { limit: limit }, (err, exerObj) => {
        let arrayRequest = [];
        if (err) {
          console.log(err);
        } else {
          let auxExerObj = exerObj;
          arrayRequest = auxExerObj.map((i) => {
            return {
              "description": i.description,
              "duration": i.duration,
              "date": i.date
            }
          })
          const logSave = new Log({
            "username": data.username,
            "count": arrayRequest.length,
            "log": arrayRequest
          });
          logSave.save((err, data) => {
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


/** ************** */
///api/users/:_id/exercises
/*app.post('/api/users/:_id/exercises', (req, res) =>{
  const postId = req.params._id;
  //buscar usuario en la base de datos
  const queryId = User.findById(postId, (err, data)=>{
    if(err){
      console.log(err);
    }else{
      //manejar description
      const descPost = req.body.description;
      //manejar duration
      const durPost = req.body.duration;
      const durPostNum = parseInt(durPost);
      //manejar date (is null use the current)
      let datePost = req.body.date;
      let dateOb = new Date(datePost);
      if(!datePost){
        dateOb = new Date();
      }
      const exercises = new Exer ({username: data.username,
                                    description:descPost,
                                    duration:durPostNum,
                                    date:dateOb.toDateString(),
                                  _id:postId});
      exercises.save((err, obj)=>{
        if(err){
          console.log(err);
        }else{
            res.json(({username: obj.username,
                    description: obj.description,
                    duration: obj.duration,
                    date: obj.date,
                    _id: obj._id}));
        }
      });
    }
  });
});*/


/*
app.get('/api/users/:_id/logs', (req, res)=>{
  const idPostLogs =  req.params._id;  
  Exer.findById(idPostLogs, (err, data)=>{
    if(err){
      console.log(err);
    }else{
      Exer.countDocuments({_id: idPostLogs},(err, count)=>{
        if(err){
          console.log(err);
        }else{
          const reg = new Log ({
            username: data.username,
            count: count,
            log:[{
              description: data.description,
              duration: data.duration,
              date: data.date
            }]
          });
          reg.save((err, logObj)=>{
            if(err){
              console.log(err);
            }else{
              res.json(logObj);
            }
          });
        }
      })
    }
  });
});*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
