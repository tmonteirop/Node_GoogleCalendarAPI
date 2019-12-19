const { google } = require('googleapis');

const { parseISO } = require('date-fns');

//Google Credentials
const oAuth2Client = new google.auth.OAuth2(
    client_id = "",     //Insert your data
    client_secret = "", //Insert your data
    redirect_uris = ""  //Insert your data
);

google.options({
    auth: oAuth2Client
});

//Token
oAuth2Client.setCredentials({
    "access_token": "",         //Insert your data
    "refresh_token": "",        //Insert your data
    "scope": "",                //Insert your data: https://developers.google.com/identity/protocols/googlescopes#calendarv3
    "token_type": "",           //Insert your data
    "expiry_date": 123456123456 //Insert your date
});

//List Calendars
async function listCalendars(req, res, oAuth2Client) {

    const calendar = google.calendar({ version: 'v3', oAuth2Client });

    await calendar.calendarList.list(function (err, resp) {
        if (err) {
            return res.status(400).json('Error: ' + err);
        }
        if (resp.data.items.length) {
            resp.data.items.forEach(function (cal) {
                console.log("Calendar: " + cal.summary + " Id: " + cal.id);
            });
        }
        res.json(resp.data.items);
    });

}

//Principal Events
async function listEvents(req, res, oAuth2Client) {

    const calendar = google.calendar({ version: 'v3', oAuth2Client });

    const { selectedCalendar } = req.query;

    await calendar.events.list({
        calendarId: selectedCalendar,
        singleEvents: true
    }, (err, resp) => {
        if (err) {
            return res.status(400).json('Error: ' + err);
        }
        res.json(resp.data.items);
    });

}

//Principal Events and Repeated Events
function listRepEvent(req, res, oAuth2Client) {

    const calendar = google.calendar({ version: 'v3', oAuth2Client });

    const { selectedCalendar, eventId } = req.query;

    calendar.events.instances({
        calendarId: selectedCalendar,
        eventId: eventId
    }, (err, resp) => {
        if (err) return (
            console.log('The API returned an error: ' + err),
            res.json(err)
        );
        const events = resp.data.items;
        if (events.length > 0) {
            console.log('Recurring Events:');
            events.map((event, i) => {
                const start = event.start.dateTime || event.start.date;
                console.log(`${event.id} - ${start} - ${event.summary}`);
            });
        } else {
            console.log('No recurrent events found.');
            res.json('No recurrent events found.');
        }
        res.json(resp.data.items);
    });

}

//Create Event
async function createEvent(req, res, oAuth2Client) {

    const calendar = google.calendar({ version: 'v3', oAuth2Client });

    let {
        mySummary,
        myDescription,
        myDateIni,
        myDateEnd,
        myAuthor,
        myParamRep,
        myAttendees,
        myCalendarId,
    } = req.body;

    var event = {
        summary: mySummary,
        location: '', //your Location
        description: myDescription,
        start: {
            dateTime: myDateIni,
            timeZone: '' //your Timezone
        },
        end: {
            dateTime: myDateEnd,
            timeZone: '' //your Timezone
        },
        recurrence: [`RRULE:${myParamRep}`], // For recurrence Event. If a single event, comment this field.
        author: myAuthor,
        attendees: [{ email: myAttendees }],
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 10 }
            ]
        }
    };

    //Check if Room is avaliable before insert a Event
    const check = {
        resource: {
            timeMin: myDateIni,
            timeMax: myDateEnd,
            items: [{ id: myCalendarId }]
        }
    }

    await calendar.freebusy.query(check, (err, response) => {
        if (err) {
            return res.status(400).json('Erro: ' + err);
        } else if ((response.data.calendars[myCalendarId].busy[0]) == undefined) {
            calendar.events.insert(
                {
                    calendarId: myCalendarId,
                    resource: event
                },
                function (err, event) {
                    if (err) {
                        return res.status(400).json('Error: ' + err);
                    }
                    console.log('Event created: %s', event.data.htmlLink);
                    console.log('Id: ', event.data.id);
                    return res.json(event);
                }
            );
        } else {
            return res.status(400).json('Room not avaliable!');
        }
    });

}

//Update Event
async function updateEvent(req, res, oAuth2Client) {

    const calendar = google.calendar({ version: 'v3', oAuth2Client });

    const {
        myEventId,
        mySummary,
        myDescription,
        myDateIni,
        myDateEnd,
        myCalendarId
    } = req.body;

    var updateEvent = {
        summary: mySummary,
        description: myDescription,
        start: {
            dateTime: parseISO(myDateIni),
            timeZone: '' //your Timezone
        },
        end: {
            dateTime: parseISO(myDateEnd),
            timeZone: '' //your Timezone
        },
    };

    calendar.events.patch({
        calendarId: myCalendarId,
        eventId: myEventId,
        resource: updateEvent,
    },
        function (err, updateEvent) {
            if (err) {
                console.log('There was an error contacting the Calendar service: ' + err);
                return res.json(err);
            }
            console.log('Event created: %s', updateEvent.data.htmlLink);
            console.log('Id: ', updateEvent.data.id);
            return res.json(updateEvent);
        }
    );

}

//Delete Event
async function deleteEvent(req, res, oAuth2Client) {

    const calendar = google.calendar({ version: 'v3', oAuth2Client });
    const { calendarId, id } = req.params;

    await calendar.events.delete(
        {
            calendarId: calendarId,
            eventId: id,
            sendUpdates: "all"
        },
        function (err) {
            if (err) {
                console.log('There was an error contacting the Calendar service: ' + err);
                return res.json(err);
            }
            return res.status(200).json('Goodby Event!');
        }
    );

}

module.exports = {
    listCalendars,
    listEvents,
    listRepEvent,
    createEvent,
    updateEvent,
    deleteEvent
};