const octokit     = require('@octokit/rest')();
const Configstore = require('configstore');
const pkg         = require('../package.json');
const _           = require('lodash');
const CLI         = require('clui');
const Spinner     = CLI.Spinner;
const chalk       = require('chalk');

const inquirer    = require('./inquirer');

const conf = new Configstore(pkg.name);

module.exports = {

  getInstance: () => {
    return octokit;
  },

  setGithubCredentials : async () => {
    const credentials = await inquirer.getGithubCredentials();
    octokit.authenticate(
      _.extend(
        {
          type: 'basic',
        },
        credentials
      )
    );
  },

  registerNewToken : async () => {
    const status = new Spinner('Authenticating you, please wait...');
    status.start();

    try {
      const response = await octokit.authorization.create({
        scopes: ['user', 'public_repo', 'repo', 'repo:status'],
        note: 'gitt, initialize git, create repo and make initial commit'
      });
      const token = response.data.token;
      if(token) {
        conf.set('github.token', token);
        return token;
      } else {
        throw new Error("Missing Token","Github token was not found in the response");
      }
    } catch (err) {
      throw err;
    } finally {
      status.stop();
    }
  },

  githubAuth : (token) => {
    octokit.authenticate({
      type : 'oauth',
      token : token
    });
  },

  getStoredGithubToken : () => {
    return conf.get('github.token');
  },

  hasAccessToken : async () => {
    const status = new Spinner('Authenticating you, please wait...');
    status.start();

    try {
      const response = await octokit.authorization.getAll();
      const accessToken = _.find(response.data, (row) => {
        if(row.note) {
          return row.note.indexOf('gitt') !== -1;
        }
      });
      return accessToken;
    } catch (err) {
      throw err;m
    } finally {
      status.stop();
    }
  },

  regenerateNewToken : async (id) => {
    const tokenUrl = 'https://github.com/settings/tokens/' + id;
    console.log('Please visit ' + chalk.underline.blue.bold(tokenUrl) + ' and click the ' + chalk.red.bold('Regenerate Token Button.\n'));
    const input = await inquirer.getRegeneratedToken();
    if(input) {
      conf.set('github.token', input.token);
      return input.token;
    }
  }

};
