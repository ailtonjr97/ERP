//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose')
var findOrCreate = require('mongoose-findorcreate')
require('dotenv').config()

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.PASSWORD,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGOSTRING);


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  setor: Array,
  cargo: Array,
  dadosPessoais: Array,
  unidade: Array
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done){
  done(null, user.id)
})

passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err, user);
  })
});


////////////////////////////////////////////////////////////
app.get('/', function(req, res){
  res.render('home');
})

///////////////////////////////////////////////////////////////

app.get('/login', function(req, res){
  res.render('login');
})

app.post('/login', function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err){
      res.send('Erro')
    } else{
      passport.authenticate('local')(req, res, function(){
        if(user){
          res.redirect('/inicio')
        } else{
          res.send('Negative')
        }
      })
    }
  })

});

///////////////////////////////////////////////////////////////
app.get('/register', function(req, res){
  if(req.isAuthenticated()){
    res.render('register');
  }else{
    res.redirect('/login')
  }
});

app.post('/register', function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      res.send(err)
    } else{
      User.updateMany(
        {"username": req.body.username },
        {$set: {
          'dadosPessoais': [{nome: req.body.nome}, {nascimento: req.body.data}, {cpf: req.body.cpf}, {rg: req.body.rg}],
          'setor': [{setorId: req.body.setores}, {setorDescri: req.body.setorDescri}],
          'cargo': [{cargoId: req.body.cargos}, {cargoDescri: req.body.cargoDescri}],
          'unidade': [{unidadeId: req.body.unidade}, {unidadeDescri: req.body.unidadeDescri}]
        }
        },
        {
            returnNewDocument: true
        }
    , function( error, result){
      if(error){
        res.send('erro1')
      } else{
        passport.authenticate('local')(req, res, function(){
          res.redirect('/inicio')
        })
      }
    });
    }
  })

  })

///////////////////////////////////////////////////////////////
app.get('/inicio', function(req, res){
  if(req.isAuthenticated()){
    res.render('inicio');
  }else{
    res.redirect('/login')
  }
});

///////////////////////////////////////////////////////////////
app.get('/submit', function(req, res){
  res.render('submit');
});

///////////////////////////////////////////////////////////////
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
})

/////////////////////////////////////////////////////////
app.get('/ativos', function(req, res){
  if(req.isAuthenticated()){
    User.find({}, function(err, usuario){
     res.render("ativos", {
       usuario: usuario,
     });
   });
  }else{
    res.redirect('/login')
  }
})

/////////////////////////////////////////////////////////
app.get("/dados/:dadosId", function(req, res){
  User.findOne({_id: req.params.dadosId}, function(err, usuario){
    res.render('dados', {
      userId: usuario._id,
      username: usuario.username
    })
  })
})

app.post("/dados", function(req, res){
  User.findOneAndUpdate(
    {"username": req.body.username },
    {
        $set: {"setor": req.body.setores}
    },
    {
        returnNewDocument: true
    }
, function( error, result){
  if(error){
    res.send('erro1')
  } else{
    res.send('deu')
  }
});
})



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
