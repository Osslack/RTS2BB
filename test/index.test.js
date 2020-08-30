/* eslint-env jest */

const format = require('../index');
const fs = require('fs');

const testFiles = fs.readdirSync('./test/').filter(p => p.endsWith('.test'));

testFiles.forEach(test);

function test (filename) {
  const refFile = filename.slice(0, -5) + '.ref';
  const refPath = './test/' + refFile;
  const testPath = './test/' + filename;

  it(`${filename} should match ${refFile}`, () => {
    const source = fs.readFileSync(testPath, { encoding: 'utf8' });
    if (process.env.REFS) {
      fs.writeFileSync(refPath, format(source, {}));
    } else {
      expect(format(source, {})).toEqual(fs.readFileSync(refPath, { encoding: 'utf8' }));
    }
  });
}
