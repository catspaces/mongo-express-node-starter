const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const cheerio = require('cheerio');
const GitHub = require('github');
const Twit = require('twit');
/**
 * GET /api
 * List of API examples.
 */
exports.getApi = (req, res) => {
  res.render('api/index', {
    title: 'API Examples'
  });
};

/**
 * GET /api/github
 * GitHub API Example.
 */
exports.getGithub = (req, res, next) => {
  const github = new GitHub();
  github.repos.get({ owner: 'sahat', repo: 'hackathon-starter' }, (err, repo) => {
    if (err) { return next(err); }
    res.render('api/github', {
      title: 'GitHub API',
      repo
    });
  });
};

/**
 * GET /api/twitter
 * Twitter API example.
 */
exports.getTwitter = (req, res, next) => {
  const token = req.user.tokens.find(token => token.kind === 'twitter');
  const T = new Twit({
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
    access_token: token.accessToken,
    access_token_secret: token.tokenSecret
  });
  T.get('search/tweets', { q: 'nodejs since:2013-01-01', geocode: '40.71448,-74.00598,5mi', count: 10 }, (err, reply) => {
    if (err) { return next(err); }
    res.render('api/twitter', {
      title: 'Twitter API',
      tweets: reply.statuses
    });
  });
};




/**
 * POST /api/twitter
 * Post a tweet.
 */
exports.postTwitter = (req, res, next) => {
  req.assert('tweet', 'Tweet cannot be empty').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/twitter');
  }

  const token = req.user.tokens.find(token => token.kind === 'twitter');
  const T = new Twit({
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
    access_token: token.accessToken,
    access_token_secret: token.tokenSecret
  });
  T.post('statuses/update', { status: req.body.tweet }, (err) => {
    if (err) { return next(err); }
    req.flash('success', { msg: 'Your tweet has been posted.' });
    res.redirect('/api/twitter');
  });
};

/**
 * GET /api/steam
 * Steam API example.
 */
exports.getSteam = (req, res, next) => {
  const steamId = '76561197982488301';
  const params = { l: 'english', steamid: steamId, key: process.env.STEAM_KEY };
  const playerAchievements = () => {
    params.appid = '49520';
    return request.getAsync({ url: 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/', qs: params, json: true })
      .then(([request, body]) => {
        if (request.statusCode === 401) {
          throw new Error('Invalid Steam API Key');
        }
        return body;
      });
  };
  const playerSummaries = () => {
    params.steamids = steamId;
    return request.getAsync({ url: 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', qs: params, json: true })
      .then(([request, body]) => {
        if (request.statusCode === 401) {
          throw Error('Missing or Invalid Steam API Key');
        }
        return body;
      });
  };
  const ownedGames = () => {
    params.include_appinfo = 1;
    params.include_played_free_games = 1;
    return request.getAsync({ url: 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', qs: params, json: true })
      .then(([request, body]) => {
        if (request.statusCode === 401) {
          throw new Error('Missing or Invalid Steam API Key');
        }
        return body;
      });
  };
  Promise.all([
    playerAchievements(),
    playerSummaries(),
    ownedGames()
  ])
  .then(([playerAchievements, playerSummaries, ownedGames]) => {
    res.render('api/steam', {
      title: 'Steam Web API',
      ownedGames: ownedGames.response.games,
      playerAchievemments: playerAchievements.playerstats,
      playerSummary: playerSummaries.response.players[0]
    });
  })
  .catch(next);
};

/**
 * GET /api/upload
 * File Upload API example.
 */

exports.getFileUpload = (req, res) => {
  res.render('api/upload', {
    title: 'File Upload'
  });
};

exports.postFileUpload = (req, res) => {
  req.flash('success', { msg: 'File was uploaded successfully.' });
  res.redirect('/api/upload');
};
