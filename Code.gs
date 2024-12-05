/*
*=========================================
*       INSTALLATION INSTRUCTIONS
*=========================================
* 
* See https://github.com/RedWedgeX/scoutbook-gcal-sync for detailed use instructions
*
*=========================================
*               SETTINGS
*=========================================
*/

// Grab the Scoutbook calendar URL

var sourceCalendars = [  
  ["https://api.scouting.org/advancements/events/calendar/12345", // <------- SCOUTBOOK CALENDAR URL
   "Pack 00 Master Calendar"], // <------ GOOGLE CALENDAR NAME
  
];

var howFrequent = 15;                  // What interval (minutes) to run this script on to check for new events
var onlyFutureEvents = false;          // If you turn this to "true", past events will not be synced (this will also removed past events from the target calendar if removeEventsFromCalendar is true)
var addEventsToCalendar = true;        // If you turn this to "false", you can check the log (View > Logs) to make sure your events are being read correctly before turning this on
var modifyExistingEvents = true;       // If you turn this to "false", any event in the feed that was modified after being added to the calendar will not update
var removeEventsFromCalendar = true;   // If you turn this to "true", any event created by the script that is not found in the feed will be removed.
var addAlerts = "yes";                 // Whether to add the ics/ical alerts as notifications on the Google Calendar events or revert to the calendar's default reminders ("yes", "no", "default").
var addOrganizerToTitle = false;       // Whether to prefix the event name with the event organiser for further clarity
var descriptionAsTitles = false;       // Whether to use the ics/ical descriptions as titles (true) or to use the normal titles as titles (false)
var addCalToTitle = false;             // Whether to add the source calendar to title
var addAttendees = false;              // Whether to add the attendee list. If true, duplicate events will be automatically added to the attendees' calendar.
var defaultAllDayReminder = -1;        // Default reminder for all day events in minutes before the day of the event (-1 = no reminder, the value has to be between 0 and 40320)
var overrideVisibility = "";           // Changes the visibility of the event ("default", "public", "private", "confidential"). Anything else will revert to the class value of the ICAL event.
var addTasks = false;

var emailSummary = false;              // Will email you when an event is added/modified/removed to your calendar
var email = "";                        // OPTIONAL: If "emailSummary" is set to true or you want to receive update notifications, you will need to provide your email address


//=====================================================================================================
//!!!!!!!!!!!!!!!! DO NOT EDIT BELOW HERE UNLESS YOU REALLY KNOW WHAT YOU'RE DOING !!!!!!!!!!!!!!!!!!!!
//=====================================================================================================

var defaultMaxRetries = 10; // Maximum number of retries for api functions (with exponential backoff)

function install(){
  //Delete any already existing triggers so we don't create excessive triggers
  deleteAllTriggers();

  //Schedule sync routine to explicitly repeat and schedule the initial sync
  ScriptApp.newTrigger("startSync").timeBased().everyMinutes(getValidTriggerFrequency(howFrequent)).create();
  ScriptApp.newTrigger("startSync").timeBased().after(1000).create();
  
  //Schedule sync routine to look for update once per day
  ScriptApp.newTrigger("checkForUpdate").timeBased().everyDays(1).create();
}

function uninstall(){
  deleteAllTriggers();
}

var startUpdateTime;

// Per-calendar global variables (must be reset before processing each new calendar!)
var calendarEvents = [];
var calendarEventsIds = [];
var icsEventsIds = [];
var calendarEventsMD5s = [];
var recurringEvents = [];
var targetCalendarId;
var targetCalendarName;

// Per-session global variables (must NOT be reset before processing each new calendar!)
var addedEvents = [];
var modifiedEvents = [];
var removedEvents = [];

function startSync(){

  if (PropertiesService.getUserProperties().getProperty('LastRun') > 0 && (new Date().getTime() - PropertiesService.getUserProperties().getProperty('LastRun')) < 360000) {
    Logger.log("Another iteration is currently running! Exiting...");
    return;
  }
  
  PropertiesService.getUserProperties().setProperty('LastRun', new Date().getTime());
  
  if (onlyFutureEvents)
    startUpdateTime = new ICAL.Time.fromJSDate(new Date());
  
  //Disable email notification if no mail adress is provided 
  emailSummary = emailSummary && email != "";
  
  sourceCalendars = condenseCalendarMap(sourceCalendars);
  for (var calendar of sourceCalendars){
    //------------------------ Reset globals ------------------------
    calendarEvents = [];
    calendarEventsIds = [];
    icsEventsIds = [];
    calendarEventsMD5s = [];
    recurringEvents = [];

    targetCalendarName = calendar[0];
    var sourceCalendarURLs = calendar[1];
    var vevents;

    //------------------------ Fetch URL items ------------------------
    var responses = fetchSourceCalendars(sourceCalendarURLs);
    Logger.log("Syncing " + responses.length + " calendars to " + targetCalendarName);
    
    //------------------------ Get target calendar information------------------------
        var targetCalendar = setupTargetCalendar(targetCalendarName);
        targetCalendarId = targetCalendar.id;
        Logger.log("Working on calendar: " + targetCalendarId);
    
    //------------------------ Parse existing events --------------------------
    if(addEventsToCalendar || modifyExistingEvents || removeEventsFromCalendar){
      var eventList =
        callWithBackoff(function(){
            return Calendar.Events.list(targetCalendarId, {showDeleted: false, privateExtendedProperty: "fromGAS=true", maxResults: 2500});
        }, defaultMaxRetries);
      calendarEvents = [].concat(calendarEvents, eventList.items);
      //loop until we received all events
      while(typeof eventList.nextPageToken !== 'undefined'){
        eventList = callWithBackoff(function(){
          return Calendar.Events.list(targetCalendarId, {showDeleted: false, privateExtendedProperty: "fromGAS=true", maxResults: 2500, pageToken: eventList.nextPageToken});
        }, defaultMaxRetries);

        if (eventList != null)
          calendarEvents = [].concat(calendarEvents, eventList.items);
      }
      Logger.log("Fetched " + calendarEvents.length + " existing events from " + targetCalendarName);
      for (var i = 0; i < calendarEvents.length; i++){
        if (calendarEvents[i].extendedProperties != null){
          calendarEventsIds[i] = calendarEvents[i].extendedProperties.private["rec-id"] || calendarEvents[i].extendedProperties.private["id"];
          calendarEventsMD5s[i] = calendarEvents[i].extendedProperties.private["MD5"];
        }
      }

      //------------------------ Parse ical events --------------------------
      vevents = parseResponses(responses, icsEventsIds);
      Logger.log("Parsed " + vevents.length + " events from ical sources");
    }
    
    //------------------------ Process ical events ------------------------
    if (addEventsToCalendar || modifyExistingEvents){
      Logger.log("Processing " + vevents.length + " events");
      var calendarTz =
        callWithBackoff(function(){
          return Calendar.Settings.get("timezone").value;
        }, defaultMaxRetries);
      
      vevents.forEach(function(e){
        processEvent(e, calendarTz);
      });

      Logger.log("Done processing events");
    }
    
    //------------------------ Remove old events from calendar ------------------------
    if(removeEventsFromCalendar){
      Logger.log("Checking " + calendarEvents.length + " events for removal");
      processEventCleanup();
      Logger.log("Done checking events for removal");
    }

    //------------------------ Process Tasks ------------------------
    if (addTasks){
      processTasks(responses);
    }

    //------------------------ Add Recurring Event Instances ------------------------
    Logger.log("Processing " + recurringEvents.length + " Recurrence Instances!");
    for (var recEvent of recurringEvents){
      processEventInstance(recEvent);
    }
  }

  if ((addedEvents.length + modifiedEvents.length + removedEvents.length) > 0 && emailSummary){
    sendSummary();
  }
  Logger.log("Sync finished!");
  PropertiesService.getUserProperties().setProperty('LastRun', 0);

}

/*
*=========================================
*              CREDITS 
*=========================================
* Modded for Scoutbook Use by RedWedgeX (https://github.com/redwedgex | bsky: @redwedgex.wtf)
*
* Forked from https://github.com/derekantrican/GAS-ICS-Sync
* by Derek Antrican https://github.com/derekantrican
*
* with contributors:
* Andrew Brothers https://github.com/agentd00nut
* Joel Balmer https://github.com/JoelBalmer
* Blackwind https://github.com/blackwind
*Jonas Geissler https://github.com/jonas0b1011001
*/

