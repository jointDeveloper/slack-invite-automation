var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');

router.get('/', function(req, res) {
  res.setLocale(config.locale);
  res.render('index', {
    community: config.community,
    tokenRequired: !!config.inviteToken
  });
});

router.post('/invite', function(req, res) {
  if (
    req.body.email &&
    (!config.inviteToken ||
      (!!config.inviteToken && req.body.token === config.inviteToken))
  ) {
    request.post(
      {
        url: 'https://' + config.slackUrl + '/api/users.admin.invite',
        form: {
          email: req.body.email,
          token: config.slacktoken,
          set_active: true
        }
      },
      function(err, httpResponse, body) {
        // body looks like:
        //   {"ok":true}
        //       or
        //   {"ok":false,"error":"already_invited"}
        if (err) {
          return res.send('Error:' + err);
        }
        body = JSON.parse(body);
        if (body.ok) {
          res.render('result', {
            community: config.community,
            message: `Correcto! Revisa en <i>${req.body.email}</i> una invitación de Slack.`
          });
        } else {
          var error = body.error;
          if (error === 'already_invited') {
            res.render('result', {
              community: config.community,
              message: `Tienes una invitación pendiente.<br />
               Revisa en <i>${req.body.email}</i> una invitación de Slack.`
            });
            return;
          } else if (error === 'already_in_team') {
            res.render('result', {
              community: config.community,
              message: `Ya perteneces a nuetro equipo.<br />Visita <a href="https://${config.slackUrl}">Slack ${config.community}</a>. Inicia sesión con <i>${req.body.email}</i>`
            });
            return;
          } else if (error === 'invalid_email') {
            error = 'Correo Electrónico no válido.';
          } else if (error === 'invalid_auth') {
            error = 'Algo anda mal :(. Por favor contacta al Administrador.';
          }

          res.render('result', {
            community: config.community,
            message: 'Error! ' + error,
            isFailed: true
          });
        }
      }
    );
  } else {
    var errMsg = [];
    if (!req.body.email) {
      errMsg.push('Se requiere un Corro Electrónico');
    }

    if (!!config.inviteToken) {
      if (!req.body.token) {
        errMsg.push('Se requiere la palabra clave');
      }

      if (req.body.token && req.body.token !== config.inviteToken) {
        errMsg.push('La palabra clave es incorrecta');
      }
    }

    res.render('result', {
      community: config.community,
      message: 'Error! ' + errMsg.join(' and ') + '.',
      isFailed: true
    });
  }
});

module.exports = router;
