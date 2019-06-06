const fs = require('fs');
const process = require('process');
const {spawnSync} = require('child_process');

const {TOKEN, USERNAME} = process.env;

function runCommand(commandString, options) {
  const [command, ...args] = commandString.match(/(".*?")|(\S+)/g);
  const cmd = spawnSync(command, args, options);

  const errorString = cmd.stderr.toString();
  if (errorString) {
    console.log(errorString)
  }
  if (cmd.status !== 0) {
    throw new Error("Unsuccessful cmd: " + commandString + "\n" + errorString);
  }
  return errorString;
}

function sync(service) {
  var name = service.name;
  var maintainer = service.maintainer;

  // change the cwd to /tmp
  process.chdir('/tmp');

  // remove the dir if it's already in tmp
  const dest = `/tmp/${name}`;
  runCommand(`rm -rf ${dest}`);

  // clone the repository and set it as the cwd
  const gitRepositoryURL = `https://${USERNAME}:${TOKEN}@console.transposit.com/git/${maintainer}/${name}`;
  runCommand(`git clone ${gitRepositoryURL}`);
  process.chdir(dest);

  return JSON.parse(fs.readFileSync('manifest.json').toString());
}

exports.handler = async function (event, context, callback) {
  // install git binary
  await require('lambda-git')();

  let manifest = sync(event.service);
  callback(null, {
    manifest: manifest
  });
}
