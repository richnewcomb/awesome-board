var express = require('express');
var env = process.env.NODE_ENV || 'development';
var router = express.Router();
var mongoose = require('mongoose');
var Team = mongoose.model('Team');
var Board = mongoose.model('Board');
var State = mongoose.model('State');
var Achievement = mongoose.model('Achievement');
var Mood = mongoose.model('Mood');

/** Moods **/

router.get('/moods', function(req, res, next) {
  Mood.find(function(err, moods) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    res.json(moods);
  });
});

router.post('/moods', function(req, res, next) {
  var mood = new Mood(req.body);

  mood.save(function(err, mood) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      if(err.code === 11000) {
        var newErr = new Error('Duplicate name not allowed');
        newErr.status = 400;
        return next(newErr);
      } else {
        return next(err);
      }
    }
    res.json(mood);
  });
});

router.get('/teams/:team/moods', function(req, res, next) {
  var query = Mood.find({"team":req.team});

  query.exec(function(err, moods) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!moods) {
      return [];
    }

    res.json(moods);
  });
});

router.post('/teams/:team/moods', function(req, res, next) {
  var mood = new Mood(req.body);
  mood.team = req.team._id;
  mood.save(function(err, mood) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      if(err.code === 11000) {
        var newErr = new Error('Duplicate name not allowed');
        newErr.status = 400;
        return next(newErr);
      } else {
        return next(err);
      }
    }
    res.json(mood);
  });
});

/** **/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.param('team', function(req, res, next, id) {
  var query = Team.findById(id);

  query.exec(function (err, team) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!team) {
      var newErr = new Error('Can\'t find team');
      newErr.status = 404;
      return next(newErr);
    }

    req.team = team;
    return next();
  });
});

router.param('board', function(req, res, next, id) {
  var query = Board.findById(id);

  query.exec(function (err, board) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!board) {
      var newErr = new Error('Can\'t find board');
      newErr.status = 404;
      return next(newErr);
    }

    req.board = board;
    return next();
  });
});

router.param('state', function(req, res, next, id) {
  var query = State.findById(id);

  query.exec(function (err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!state) {
      var newErr = new Error('Can\'t find state');
      newErr.status = 404;
      return next(newErr);
    }

    req.state = state;
    return next();
  });
});

router.param('achievement', function(req, res, next, id) {
  var query = Achievement.findById(id);

  query.exec(function (err, achievement) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!achievement) {
      var newErr = new Error('Can\'t find achievement');
      newErr.status = 404;
      return next(newErr);
    }

    req.achievement = achievement;
    return next();
  });
});

router.param('data', function(req, res, next, amount) {
  if('compact' === amount || 'full' === amount) {
    req.data = amount;
  } else {
    req.data = null;
  }
  return next();
});

router.get('/teams', function(req, res, next) {
  Team.find(function(err, teams) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    res.json(teams);
  });
});

router.post('/teams', function(req, res, next) {
  var team = new Team(req.body);

  team.save(function(err, team) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      if(err.code === 11000) {
        var newErr = new Error('Duplicate name not allowed');
        newErr.status = 400;
        return next(newErr);
      } else {
        return next(err);
      }
    }
    res.json(team);
  });
});

router.get('/teams/:team/', function(req, res, next) {
  res.json(req.team);
});

router.get('/teams/:team/full', function(req, res, next) {
  req.team.populate('boards', function(err, team) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }

    res.json(team);
  });
});

router.put('/teams/:team', function(req, res, next) {
  var update = new Team(req.body);
  if(update.name) {
    req.team.name = update.name;
  }
  req.team.save(function(err, team) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    res.json(team);
  });
});

router.delete('/teams/:team', function(req, res, next) {
  var achievementQuery = Achievement.find({"board":{$in:req.team.boards}});

  achievementQuery.remove(function(err, achievements) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    return achievements;
  }).then(function() {
    var stateQuery = State.find({"board":{$in:req.team.boards}});
    stateQuery.remove(function(err, states) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      return states;
    })
  }).then(function() {
    var boardQuery = Board.find({"team":req.team._id});
    boardQuery.remove(function(err, boards) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      return boards;
    });
  }).then(function() {
    req.team.remove(function(err, team) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      res.json(team);
    });
  });
});

router.get('/teams/:team/boards', function(req, res, next) {
  var query = Board.find({"team":req.team});

  query.exec(function(err, boards) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!boards) {
      return [];
    }

    res.json(boards);
  });
});

router.post('/teams/:team/boards', function(req, res, next) {
  var board = new Board(req.body);
  board.team = req.team._id;
  board.save(function(err, board) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      if(err.code === 11000) {
        var newErr = new Error('Duplicate name not allowed');
        newErr.status = 400;
        return next(newErr);
      } else {
        return next(err);
      }
    }
    req.team.boards.push(board._id);
    req.team.save(function(err, team) {
      if(err) {
        return next(err);
      }
      return board;
    });
  })
  .then(function(board) {
    if(undefined === board.currentState) {
      board.currentState = new State({
        "title" : "Current State",
        "description" : "Describe the Current State"
      });
    }
    board.currentState.board = board._id;
    board.currentState.save(function(err, state) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      board.currentState = state._id;
    });
    return board;
  })
  .then(function(board) {
    if(undefined === board.targetState) {
      board.targetState = new State({
        "title" : "Target State",
        "description" : "Describe your Target State"
      });
    }
    board.targetState.board = board._id;
    board.targetState.save(function(err, state) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      board.targetState = state._id;
    });
    return board;
  })
  .then(function(board) {
    if(undefined === board.awesomeState) {
      board.awesomeState = new State({
        "title" : "Definition of Awesome",
        "description" : "Define Awesome"
      });
    }
    board.awesomeState.board = board._id;
    board.awesomeState.save(function(err, state) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      board.awesomeState = state._id;
      board.save(function(err, board) {
        if(err) {
          return next(err);
        }
        res.json(board);
      });
    });
  });
});

router.get('/teams/:team/boards/:board', function(req, res, next) {
  res.json(req.board);
});

router.get('/teams/:team/boards/:board/full', function(req, res, next) {
  req.board.populate('achievements', function(err, board) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    req.board.populate('currentState', function(err, board) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      req.board.populate('targetState', function(err, board) {
        if(err) {
          if('development'===env) {
            console.warn('ERROR: ' + err);
          }
          return next(err);
        }
        req.board.populate('awesomeState', function(err, board) {
          if(err) {
            if('development'===env) {
              console.warn('ERROR: ' + err);
            }
            return next(err);
          }
          res.json(board);
        });
      });
    });
  });
});

router.put('/teams/:team/boards/:board', function(req, res, next) {
  var update = new Board(req.body);
  if(update.name) {
    req.board.name = update.name;
  }
  req.board.save(function(err, board) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    res.json(board);
  });
});

router.delete('/teams/:team/boards/:board', function(req, res, next) {
  var achievementQuery = Achievement.find({"board":req.board});

  achievementQuery.remove(function(err, achievements) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    return achievements;
  }).then(function() {
    var stateQuery = State.find({"board":req.board});
    stateQuery.remove(function(err, states) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      return states;
    })
  }).then(function() {
    if('development'===env) {
      console.log(req.team.boards);
      console.log(req.board._id);
    }
    req.team.boards.splice(req.team.boards.indexOf(req.board._id), 1);
    if('development'===env) {
      console.log(req.team.boards);
    }
    req.team.save(function(err, team) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      return team;
    }).then(function() {
      req.board.remove(function(err, board) {
        if(err) {
          if('development'===env) {
            console.warn('ERROR: ' + err);
          }
          return next(err);
        }
        res.json(board);
      });
    });
  });
});

router.get('/teams/:team/boards/:board/states', function(req, res, next) {
  var query = State.find({"board":req.board});

  query.exec(function(err, states) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!states) {
      return [];
    }

    res.json(states);
  });
});

router.get('/teams/:team/boards/:board/currentState', function(req, res, next) {
  var query = State.findById(req.board.currentState);

  query.exec(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!state) {
      var newErr = new Error('Can\'t find current state');
      newErr.status = 404;
      return next(newErr);
    }

    res.json(state);
  });
});

router.get('/teams/:team/boards/:board/targetState', function(req, res, next) {
  var query = State.findById(req.board.targetState);

  query.exec(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!state) {
      var newErr = new Error('Can\'t find target state');
      newErr.status = 404;
      return next(newErr);
    }

    res.json(state);
  });
});

router.get('/teams/:team/boards/:board/awesomeState', function(req, res, next) {
  var query = State.findById(req.board.awesomeState);

  query.exec(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!state) {
      var newErr = new Error('Can\'t find awesome state');
      newErr.status = 404;
      return next(newErr);
    }

    res.json(state);
  });
});

router.post('/teams/:team/boards/:board/currentState', function(req, res, next) {
  var state = new State(req.body);
  state.board = req.board._id;
  if(!state.title || state.title === '') {
    state.title = 'Current State';
  }
  state.save(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    req.board.currentState = state._id;
    req.board.save(function(err, board) {
      if(err) {
        return next(err);
      }
      res.json(state);
    });
  });
});

router.post('/teams/:team/boards/:board/targetState', function(req, res, next) {
  var state = new State(req.body);
  state.board = req.board._id;
  if(!state.title || state.title === '') {
    state.title = 'Target State';
  }
  state.save(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    req.board.targetState = state._id;
    req.board.save(function(err, board) {
      if(err) {
        return next(err);
      }
      res.json(state);
    });
  });
});

router.post('/teams/:team/boards/:board/awesomeState', function(req, res, next) {
  var state = new State(req.body);
  state.board = req.board._id;
  if(!state.title || state.title === '') {
    state.title = 'Definition of Awesome';
  }
  state.save(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    req.board.awesomeState = state._id;
    req.board.save(function(err, board) {
      if(err) {
        return next(err);
      }
      res.json(state);
    });
  });
});

router.put('/teams/:team/boards/:board/currentState', function(req, res, next) {
  var query = State.findById(req.board.currentState);

  query.exec(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!state) {
      return next(new Error('Can\'t find Current State'));
    }

    req.state = state;
  }).then(function() {
    var update = new State(req.body);
    if(update.title) {
      req.state.title = update.title;
    }
    if(update.description) {
      req.state.description = update.description;
    }
    if(update.date) {
      req.state.date = update.date;
    }
    req.state.save(function(err, state) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      res.json(state);
    });
  });
});

router.put('/teams/:team/boards/:board/targetState', function(req, res, next) {
  var query = State.findById(req.board.targetState);

  query.exec(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!state) {
      return next(new Error('Can\'t find Target State'));
    }

    req.state = state;
  }).then(function() {
    var update = new State(req.body);
    if(update.title) {
      req.state.title = update.title;
    }
    if(update.description) {
      req.state.description = update.description;
    }
    if(update.date) {
      req.state.date = update.date;
    }
    req.state.save(function(err, state) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      res.json(state);
    });
  });
});

router.put('/teams/:team/boards/:board/awesomeState', function(req, res, next) {
  var query = State.findById(req.board.awesomeState);

  query.exec(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!state) {
      return next(new Error('Can\'t find Awesome State'));
    }

    req.state = state;
  }).then(function() {
    var update = new State(req.body);
    if(update.title) {
      req.state.title = update.title;
    }
    if(update.description) {
      req.state.description = update.description;
    }
    if(update.date) {
      req.state.date = update.date;
    }
    req.state.save(function(err, state) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      res.json(state);
    });
  });
});

router.get('/teams/:team/boards/:board/states/:state', function(req, res, next) {
  req.state.populate(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }

    res.json(state);
  });
});

router.put('/teams/:team/boards/:board/states/:state', function(req, res, next) {
  var update = new State(req.body);
  if(update.title) {
    req.state.title = update.title;
  }
  if(update.description) {
    req.state.description = update.description;
  }
  if(update.date) {
    req.state.date = update.date;
  }
  req.state.save(function(err, state) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    res.json(state);
  });
});

router.get('/teams/:team/boards/:board/achievements', function(req, res, next) {
  var query = Achievement.find({"board":req.board});

  query.exec(function(err, achievements) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    if(!achievements) {
      return [];
    }

    res.json(achievements);
  });
});

router.post('/teams/:team/boards/:board/achievements', function(req, res, next) {
  var achievement = new Achievement(req.body);
  achievement.board = req.board._id;
  if(!achievement.date && !Date.parse(achievement.date)) {
    achievement.date = Date.now();
  }
  achievement.save(function(err, achievement) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    req.board.achievements.push(achievement._id);
    req.board.save(function(err, board) {
      if(err) {
        return next(err);
      }
      res.json(achievement);
    });
  });
});

router.delete('/teams/:team/boards/:board/achievements', function(req, res, next) {
  var query = Achievement.find({"board":req.board});

  query.remove(function(err, achievements) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    req.board.achievements = [];
    req.board.save(function(err, board) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      res.json(achievements);
    });
  });
});

router.get('/teams/:team/boards/:board/achievements/:achievement', function(req, res, next) {
    req.achievement.populate(function(err, achievement) {
        if(err) {
            if('development'===env) {
              console.warn('ERROR: ' + err);
            }
            return next(err);
        }

        res.json(achievement);
    });
});

router.put('/teams/:team/boards/:board/achievements/:achievement', function(req, res, next) {
  var update = new Achievement(req.body);
  if(update.title) {
    req.achievement.title = update.title;
  }
  if(update.description) {
    req.achievement.description = update.description;
  }
  if(update.date) {
    req.achievement.date = update.date;
  }
  req.achievement.save(function(err, achievement) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    res.json(achievement);
  });
});

router.delete('/teams/:team/boards/:board/achievements/:achievement', function(req, res, next) {
  req.achievement.remove(function(err, achievement) {
    if(err) {
      if('development'===env) {
        console.warn('ERROR: ' + err);
      }
      return next(err);
    }
    req.board.achievements.pull(achievement);
    req.board.save(function(err, board) {
      if(err) {
        if('development'===env) {
          console.warn('ERROR: ' + err);
        }
        return next(err);
      }
      res.json(achievement);
    })
  });
});

module.exports = router;