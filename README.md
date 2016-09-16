# Bearserver
A RESTful API to determine the current class and schedule. Supports special schedules, user data, and more.

The Bearserver backend is the API for the bearstatus web interface. Bearserver processes times, classes, and schedules for other applications to use.




## Usage

Using bearserver to get information is very simple.

`/day` returns today's schedule

`/day/{date}` returns the schedule of that day.

`/week` returns the weekly schedule

`/week/{date}` returns the weekly forcast for the week of that day.

All `{date}` blocks are optional, but must take a day format of 'YYYY-MM-DD'

## Authentication

More features of bearserver are behind an authentication layer. These are usually `POST` requests.

`/auth` will assign a JWT token based on the secret in `config.js`. It is IP based.

If authenticated with the above method, the following commands are avaliable

POST `/day/:date` creates a special for that day.

Example input schedule:
```json
{
  "schedule": [{
      "name": "Advisory",
      "start": "8:00am",
      "end": "8:05am",
      "duration": 5
    }]
}

```

DEL and PUT also work, deleting and updating respectively. 



## Formatting

The schedule is an array of object `classes`, which contain the data for that class.

Example class object:

Note: a class has *either* a name or a number, not both. They are both here for example.

```js
{
  "name": "Advisory", // for non-class blocks.
  "number": 1, // for class blocks. 1 = Block 1
  "lunch": 1, // for lunches only
  "start": "8:00am",
  "end": "8:05am",
  "duration": 5
}
```



## License
Copyright (c) 2016 Saji Champlin


Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
