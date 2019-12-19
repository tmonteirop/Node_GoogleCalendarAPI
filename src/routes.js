const { Router } = require('express');
const routes = new Router();
const EventController = require('./app/controllers/EventController');

routes.get('/calendars', EventController.listCalendars);
routes.get('/events', EventController.listEvents);
routes.get('/repevent', EventController.listRepEvent);
routes.post('/event', EventController.createEvent);
routes.put('/event', EventController.updateEvent);
routes.delete('/event/:calendarId/:id', EventController.deleteEvent);

module.exports = routes;