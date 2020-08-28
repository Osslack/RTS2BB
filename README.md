# RTS2BB
Convert a workout copied from RTS to a format for BB forums. This is based on the formatter found on [Exodus Strength](https://www.exodus-strength.com/tools/?tool=rtstobb), which seems to be broken at the moment.

I've tested this with node v14.8.0.

# Setup

```
git clone https://github.com/Osslack/RTS2BB.git;
cd RTS2BB;
npm i;
npm run test;
```

# Usage

Copy a RTS workout as described on the Exodus page and paste it into a file. Then call the script like `node index.js <file>`.

For example, given the following input:
```
Friday, Oct 25th, 2019
I am the workout

With Weigth With Planned Sets 4
Target
Reps RPE
 
Actual
Reps RPE
 100 kgs 2 8 100 kgs 2 8 100 kgs 2 8 100 kgs 2 Null 100 kgs 2 8 100 kgs 2 Null 100kg 2 8 90 kgs 2 8
Notes: I am the notes

With Weigth Without Planned Sets 4
Target
Reps RPE
 
Actual
Reps RPE
 100 kgs 2 8 100 kgs 2 Null 100 kgs 2 Null 90 kgs 2 8
Notes: I am the notes

Without Weight With Planned Sets 4
Target
Reps RPE
 
Actual
Reps RPE
 2 8 2 8 2 8 2 Null 2 8 2 Null 2 9 2 8
Notes: I am the notes

Without Weight Without Planned Sets 4
Target
Reps RPE
 
Actual
Reps RPE
 2 8 2 Null 2 Null 2 8
Notes: I am the notes
```

This would be the output:
```
[h1]2019-10-25[/h1]

I am the workout

With Weigth With Planned
100kgs x 2 @ 8 / 100kgs x 2 @ 8
100kgs x 2 @ 8 / 100kgs x 2
100kgs x 2 @ 8 / 100kgs x 2
100kg x 2 @ 8 / 90kgs x 2 @ 8
Notes: I am the notes

With Weigth Without Planned
100kgs @ 2
100kgs @ 2
100kgs @ 2
90kgs @ 2
Notes: I am the notes

Without Weight With Planned
2 @ 8 / 2 @ 8
2 @ 8 / 2
2 @ 8 / 2
2 @ 9 / 2 @ 8
Notes: I am the notes

Without Weight Without Planned
2 @ 8
2
2
2 @ 8
Notes: I am the notes
```
