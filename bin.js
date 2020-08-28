#!/usr/bin/env node
const format = require('./index');
const fs = require('fs');

const helptext = 'node index.js <file> [option]+ [--help]\n\n' +
                  'Available options are:\n' +
                  '- underlined_exercise\n' +
                  '- bold_exercise\n' +
                  '- italic_exercise\n' +
                  '- underlined_notes\n' +
                  '- bold_notes\n' +
                  '- italic_notes\n' +
                  '- ignore_intended_reps\n';

function parseCLIOptions (argv) {
  const options = {};
  for (let i = 3; i < process.argv.length; i++) {
    if (process.argv[i] === '--help') {
      console.log(helptext);
      process.exit(0);
    }
    options[process.argv[i]] = true;
  }

  return options;
}

if (process.argv.length === 2) {
  console.log('File argument is missing.');
  process.exit(1);
} else if (process.argv[2] === '--help') {
  console.log(helptext);
  process.exit(0);
}

const options = parseCLIOptions(process.argv);

console.log(format(fs.readFileSync(process.argv[2], { encoding: 'utf8' }), options));
