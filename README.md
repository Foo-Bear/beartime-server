# Bearserver
A RESTful API to determine the current class and schedule. Supports special schedules, user data, and more.

The Bearserver backend is the API for the bearstatus web interface. Bearserver processes times, classes, and schedules for other applications to use.




## Usage

Using bearserver to get information is very simple.

`/today` returns the daily schedule

`/week` returns the weekly schedule

`/week/{date}` returns the weekly forcast for the week of that day.

## Authentication

More features of bearserver are behind an authentication layer. These are usually `POST` requests.

`/auth` will assign a JWT token based on the secret in `config.js`. It is IP based.

If authenticated with the above method, the following commands are avaliable

`/inputschedule` takes a JSON object like the following and adds it to the array of specials:

Example input schedule:
```json
{
  "name": "optional name for reference",
  "date": "2105-9-23",
  "schedule": [{
      "key_name":"1-050",
      "name":"Block 1",
      "shour":9,
      "smin":50,
      "ehour":10,
      "emin":55,
      "day":4
  }]
}

```


`/modifyschedule` is a direct write to the specials array. Use for deletions or other edits.



## Formatting

The schedule is an array of object `classes`, which contain the data for that class. Most notable is the `key_name`, which contains information on the ordering and priority of the class.

Example class object:
```json
{
  "key_name":"4-010",
  "name":"Block 1",
  "stime": "9:50",
  "etime": "10:55",
  "day":4
}
```

Info on key_name:

As of now, the only important thing in key_name is the last number, which determines the lunch splits.

```text

1 -> Day of the class, Monday is 1. Not used.
-
7 -> Class id. For block 7, would be 7
5 -> Class Number, in order. Not used.
2 -> Lunch split data.

```
Lunch split data can be 0, meaning no split, 1, for first schedule, and 2 for second schedule. All classes that are split should have the same split applied. See example database for example.



## License
Copyright (c) 2016 Saji Champlin


Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
