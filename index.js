/* eslint-disable camelcase */
const moment = require('moment');

/**
 * Transform the flat sets-data into a table
 *
 * @param {string} sar All sets and reps of the exercise
 * @param {number} totalSets Total number of sets
 * @returns {Array[]} Return a table of sets - an array of arrays
 */
function parseSetsAndReps (sar, totalSets) {
  const allEntries = sar.split(' ').filter(s => s !== '');
  const columnsPerRow = allEntries.length / totalSets;
  const rows = [];
  for (let set = 0; set < totalSets; set++) {
    const row = [];
    for (let i = 0; i < columnsPerRow; i++) {
      const column = allEntries[i + set * columnsPerRow];
      row.push(column);
    }
    rows.push(row);
  }
  return rows;
}

const setRegex = /Sets \d+/;

/**
 * Extract the number of sets from the given "Exercise Sets X" string.
 *
 * @param {String} exercise Raw exercise string
 * @returns {number} Number of sets
 */
function numberOfSets (exercise) {
  return parseInt(setRegex.exec(exercise)[0].replace('Sets', '').trim());
}

function renderSetWithoutWeight (reps, rpe, rpeMax) {
  let result = '';

  if (reps !== 'Null') {
    result += `${reps}`;
  }

  if (rpe !== 'Null') {
    result += ` @ ${rpe}${getPadding(rpe, rpeMax)}`;
  }

  return result;
}

function getPadding (actual, max) {
  let result = '';
  for (let i = 0; i < max - actual.length; i++) {
    result += ' ';
  }

  return result;
}

function renderSetWithWeight (weight, reps, rpe, weightMax, rpeMax) {
  let result = '';
  if (weight !== 'Null') {
    result += getPadding(weight, weightMax) + weight;
  }

  if (reps !== 'Null') {
    result += `${result === '' ? '' : ' x '}${reps}`;
  }

  if (rpe !== 'Null') {
    result += ` @ ${rpe}${getPadding(rpe, rpeMax)}`;
  }

  return result;
}

function setWithWeight (weight, reps, rpe) {
  return { weight, reps, rpe };
}

function setWithoutWeight (reps, rpe) {
  return { reps, rpe };
}

function parseSet (data) {
  const set = {};

  if (data.length === 6) {
    // workout with weight with planned
    set.planned = setWithWeight(...data.slice(0, 3));
    set.actual = setWithWeight(...data.slice(3));
  } else if (data.length === 3) {
    // workout with weight without planned
    // Can this even ocurr? My workouts always had a planned
    set.actual = setWithWeight(...data);
  } else if (data.length === 4) {
    // workout without weight with planned
    set.planned = setWithoutWeight(...data.slice(0, 2));
    set.actual = setWithoutWeight(...data.slice(2));
  } else if (data.length === 2) {
    // workout without weight without planned
    // Can this even ocurr? My workouts always had a planned
    set.actual = setWithoutWeight(...data);
  }

  return set;
}

function getLengths (sets) {
  let maxPlannedWeightLength = -1; let maxPlannedRPELength = -1; let maxActualWeightLength = -1; let maxActualRPELength = -1;
  sets.forEach(({ planned, actual }) => {
    if (planned) {
      const { weight, rpe } = planned;
      if (weight && weight !== 'Null' && weight.length > maxPlannedWeightLength) maxPlannedWeightLength = weight.length;
      if (rpe !== 'Null' && rpe.length > maxPlannedRPELength) maxPlannedRPELength = rpe.length;
    }

    if (actual) {
      const { weight, rpe } = actual;
      if (weight && weight !== 'Null' && weight.length > maxActualWeightLength) maxActualWeightLength = weight.length;
      if (rpe !== 'Null' && rpe.length > maxActualRPELength) maxActualRPELength = rpe.length;
    }
  });

  return { maxPlannedWeightLength, maxPlannedRPELength, maxActualWeightLength, maxActualRPELength };
}

function renderSet (maxPlannedWeightLength, maxPlannedRPELength, maxActualWeightLength, maxActualRPELength, ignore_intended_reps) {
  return function ({ planned, actual }) {
    let result = '';
    let renderedPlanned;

    if (planned) {
      if (planned.weight) renderedPlanned = renderSetWithWeight(planned.weight, planned.reps, planned.rpe, maxPlannedWeightLength, maxPlannedRPELength);
      else if (planned.reps) renderedPlanned = renderSetWithoutWeight(planned.reps, planned.rpe, maxPlannedRPELength);
    }

    if (renderedPlanned && renderedPlanned !== '' && !ignore_intended_reps) {
      result += renderedPlanned + ' / ';
    }

    if (actual) {
      if (!planned && maxPlannedWeightLength > -1 && maxPlannedRPELength > -1) {

      }

      if (actual.weight) result += renderSetWithWeight(actual.weight, actual.reps, actual.rpe, maxActualWeightLength, maxActualRPELength);
      else if (actual.reps) result += renderSetWithoutWeight(actual.reps, actual.rpe, maxActualRPELength);
    }

    return result;
  };
}

function renderSets (sets, ignore_intended_reps) {
  const { maxPlannedWeightLength, maxPlannedRPELength, maxActualWeightLength, maxActualRPELength } = getLengths(sets);

  return sets.map(renderSet(maxPlannedWeightLength, maxPlannedRPELength, maxActualWeightLength, maxActualRPELength, ignore_intended_reps)).join('\n');
}

function getDateAndWorkoutName (lines) {
  let date; let name;
  // Where to look for the workout name
  let workoutnameSearchIndex = 0;
  // Where to continue looking afterwards for exercises
  let startIndex = 0;
  const exerciseRegex = / *(.*) Sets \d* *$/;

  if (lines[0] && lines[0].match(/\[h1\]\d\d\d\d-\d\d-\d\d\[\/h1\]/)) {
    workoutnameSearchIndex++;
    startIndex++;
    date = lines[0];
  }

  if (lines[workoutnameSearchIndex] && !lines[workoutnameSearchIndex].match(exerciseRegex)) {
    startIndex++;
    name = lines[workoutnameSearchIndex];
  }

  return { date, name, startIndex };
}

/**
 * Parse a given raw day into the different exercises with notes
 *
 * @param {String} day
 * @returns {Object} {date: date of the workout, workoutData: [<exercise>, <setsAndReps>, <notes>]}
 */
function parseWorkoutDay (day) {
  const rawData = day.split('\n').filter(l => l.trim() !== '');

  if (rawData.length === 0) {
    return { date: undefined, name: undefined, workoutdata: [] };
  }

  const { date, name, startIndex } = getDateAndWorkoutName(rawData);

  const workoutdata = []; let exercise; let setsAndReps; let notes;
  const exerciseRegex = / *(.*) Sets \d* *$/;
  for (let i = startIndex; i < rawData.length; i++) {
    const line = rawData[i];
    if (line.match(exerciseRegex)) {
      // When we read a new exercise, we know that the last one is done
      if (exercise) {
        if (notes) {
          workoutdata.push({ exercise, setsAndReps, notes });
        } else {
          workoutdata.push({ exercise, setsAndReps });
        }
        // Re-initialize our helpers
        setsAndReps = undefined;
        notes = undefined;
      }
      // Start a fresh exercise
      exercise = line;
    } else if (line !== '' && line !== ' ') {
      // Not a date and not an exercise - sets/reps/notes
      if (line.startsWith('Notes:')) {
        notes = line;
      } else {
        // Make the unit stick to the number of weight so that we can easily split at each whitespace later on
        setsAndReps = line.replace(/ lbs/g, 'lbs').replace(/ kgs/g, 'kgs');
      }
    }
  }

  // When we are done processing the day, we still need to add the last exercise
  if (exercise) {
    if (notes) {
      workoutdata.push({ exercise, setsAndReps, notes });
    } else {
      workoutdata.push({ exercise, setsAndReps });
    }
  }

  return { date, name, workoutdata };
}

/**
 * @typedef {Object} FormattingOptions
 * @property {boolean} underlined_exercises
 * @property {boolean} bold_exercises
 * @property {boolean} italic_exercises
 * @property {boolean} underlined_notes
 * @property {boolean} bold_notes
 * @property {boolean} italic_notes
 * @property {boolean} ignore_intended_reps
 */

// eslint-disable-next-line no-unused-vars
function getOptions (document) {
  const optionNames = ['underlined_exercises', 'bold_exercises', 'italic_exercises', 'underlined_notes', 'bold_notes', 'italic_notes', 'ignore_intended_reps'];
  const options = {};
  for (let i = 0; i < optionNames.length; i++) {
    const option = optionNames[i];
    options[option] = document.getElementById(`checkbox_${option}`).checked;
  }
  return options;
}
/**
 * Get pre/post for exercise and notes rendering
 *
 * @param {FormattingOptions} options
 * @returns {Object} Object with all the pre/postfixes
 */
function getPrePost (options) {
  let exercise_pre = '';
  let exercise_post = '';
  if (options.underlined_exercise) {
    exercise_pre += '[u]';
    exercise_post = '[/u]' + exercise_post;
  }
  if (options.bold_exercise) {
    exercise_pre += '[b]';
    exercise_post = '[/b]' + exercise_post;
  }
  if (options.italic_exercise) {
    exercise_pre += '[i]';
    exercise_post = '[/i]' + exercise_post;
  }

  let notes_pre = '';
  let notes_post = '';
  if (options.underlined_notes) {
    notes_pre += '[u]';
    notes_post = '[/u]' + notes_post;
  }
  if (options.bold_notes) {
    notes_pre += '[b]';
    notes_post = '[/b]' + notes_post;
  }
  if (options.italic_notes) {
    notes_pre += '[i]';
    notes_post = '[/i]' + notes_post;
  }

  return { exercise_pre, exercise_post, notes_pre, notes_post };
}
/**
 * Nicely format the RTS input for BB
 *
 * @param {String} input Raw RTS input
 * @param {FormattingOptions} options Options for formatting
 * @returns {String} BB formatted RTS input
 */
function format (input, options = {}) {
  const { exercise_pre, exercise_post, notes_pre, notes_post } = getPrePost(options);

  input = input.replace(/^Target.*\n/gm, '');
  input = input.replace(/^Actual.*\n/gm, '');
  input = input.replace(/^Weight Reps RPE.*\n/gm, '');
  input = input.replace(/^Reps RPE.*\n/gm, '');
  input = input.replace(/^Daily Workout\n/gm, '');

  input = input.replace(/^\w+, (\w+) (\w+), (\d\d\d\d)\n/gm, function (nothing, month, rawData, year) {
    // return month + " " + rawData + " (" + year + ")\n";
    return '[h1]' + moment(month + ' ' + rawData + ' ' + year, 'MMM Do YYYY').format('YYYY-MM-DD') + '[/h1]\n';
  });

  // split into date and exeif(planned.reps) cises
  const { date, name, workoutdata } = parseWorkoutDay(input);
  if (date || name || workoutdata.length > 0) {
    const renderedWorkoutData = workoutdata.map(({ exercise, setsAndReps, notes }) => {
      let result = '';
      const renderedExercise = exercise_pre + exercise.replace(/Sets \d+.*/, '').trim() + exercise_post;
      result += renderedExercise + '\n';
      const renderedSets = renderSets(parseSetsAndReps(setsAndReps, numberOfSets(exercise)).map(parseSet), options.ignore_intended_reps);
      result += renderedSets + '\n';
      if (notes) {
        const renderedNotes = notes_pre + notes.trim() + notes_post;
        result += renderedNotes;
      }
      return result + '\n';
    }).join('\n');

    let result = '';

    if (date) {
      result += `${date}` + '\n\n';
    }

    if (name) {
      result += `${name}` + '\n\n';
    }

    if (renderedWorkoutData) {
      result += renderedWorkoutData;
    }

    return result;
  } else {
    return 'No workout found!';
  }
}

module.exports = format;
