# Bearserver
A server backend for bearstatus.


The Bearserver backend is the API for the bearstatus web interface. Bearserver processes times, classes, and schedules for other applications to use.




## Usage

Using bearserver to get information is very simple.

`/currentclass` returns the current class(es)

`/nextclass` returns the next class(es)

`/remainingtime` returns the remainingtime for each respective currentclass

`/today` returns the daily schedule

## Authentication

More features of bearserver are behind an authentication layer. These are usually `POST` requests.

`/authenticate` will assign a JWT token based on the secret in `config.js` it is IP based.

If authenticated with the above method, the following commands are avaliable

`/inputschedule` takes a JSON object like the following and adds it to the array of specials:

Example input schedule
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


`/deleteschedule` takes the date of a schedule and deletes all entries with that Date


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

1 -> Day of the class, Monday is 1
-
0
5 -> Class Number, in order. Same for above.
2 -> Lunch split data. 0 means no split, 1 means first lunch, 2 means second lunch.

```

Userdata is used to assign custom names to classes. Currently it is done based on class name, but in the future the key_name may be used instead.

```json
{
  "Block 7": "Science",
  "Block 3": "Math"
}
```
