# Bearserver
A RESTful API to determine the current class and schedule. Supports special schedules, user data, and more.

The Bearserver backend is the API for the bearstatus web interface. Bearserver processes times, classes, and schedules for other applications to use.




## Usage

Using bearserver to get information is very simple.

`/currentclass` returns the current class(es)

`/nextclass` returns the next class(es)

`/remainingtime` returns the remainingtime for each respective currentclass

`/today` returns the daily schedule

## Authentication

More features of bearserver are behind an authentication layer. These are usually `POST` requests.

`/authenticate` will assign a JWT token based on the secret in `config.js`. It is IP based.

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
key name
1-752
Monday, block 7
5th class of the day
part of second Lunch

```


`/deleteschedule` takes the date of a schedule and deletes all entries with a matching date.


## User Data (WIP)
Some user data is stored on the database. This data can be used to assign custom names to classes, e.g `Block 7` to `Science`.

To access this data, `/getuser` takes a user ID and returns any data associated with it. A User ID can be anything from an email address to a username. The server will respond with a JWT token used to authenticate when storing the data again (i.e. editing).

`/storeuser` is the follow up, taking a user ID, token, and schedule data.



## Formatting

The schedule is an array of objects `classes`, which contains the data for that class. Most notable is the `key_name`, which contains information on the ordering and priority of the class.

Example class object:
```json
{
  "key_name":"4-010",
  "name":"Block 1",
  "shour":9,
  "smin":50,
  "ehour":10,
  "emin":55,
  "day":4
}
```

Info on key_name:

```text

1 -> Day of the class, Monday is 1. Not used.
-
7 -> Class id. For block 7, would be 7
5 -> Class Number, in order. Not used.
2 -> Lunch split data.

```
Lunch split data can be 0, meaning no split, 1, for first schedule, and 2 for second schedule. All classes that are split should have the same split applied. See example database for example.

Userdata is used to assign custom names to classes. Currently it is done based on class name, but in the future the key_name may be used instead.

```json
{
  "Block 7": "Science",
  "Block 3": "Math"
}
```


## License

(The MIT License)

Copyright (c) 2016 Saji Champlin &lt;kschamplin19@blakeschool.org&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
