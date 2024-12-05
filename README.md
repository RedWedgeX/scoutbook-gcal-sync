# Scoutbook to Google Calendar Sync

This script allows for regular syncs between Scoutbook and a Google Calender. It was forked from https://github.com/derekantrican/GAS-ICS-Sync and modified slightly to make it easier for scouting units to use.

## Instructions for Use

It's assumed you already have a Google Calendar set up for use. No specific permissions need to be changed, but you do need to know the name of the calendar.

### 1. Copy the Script
- Make sure you're logged into the Google account that owns the calendar.
- Click this link to access the script.
- Click the "*copy* icon on the top right. ![image](https://github.com/user-attachments/assets/8f78903a-b509-4970-a31c-9a2b9b77986d)


### 2. Gather Calendar URL

- Log in to [Scoutbook](https://scoutbook.scouting.org)
- Click on "Upcoming Events" to pull up the Internet Advancement calendar
 ![image](https://github.com/user-attachments/assets/5a3cc0a6-f440-4210-91f3-ec78094e738c)
- Scroll all the way to the bottom and press the *copy* button next to the calendar you wish to sync, for example:
  ![image](https://github.com/user-attachments/assets/9d849982-97c9-4edf-8a90-798294a9f7aa)

### 3. Update Calendar URL and Name
- On the script page, paste the Scoutbook calendar link from step 2 over the red text labeled "SCOUTBOOK CALENDAR URL". Make sure it's in quotation marks!
- Replace "Google Calendar Name" with the name of the calendar as shown on Google. For example, "Pack 27 Calendar".
![image](https://github.com/user-attachments/assets/7aa78f13-1db8-4857-812b-0a5b8d85f903)
- Press the "Save" button on the script toolbar
![image](https://github.com/user-attachments/assets/2e23ca1d-e339-421e-b6ba-96dafbaae7f7)


### 4. Deploy the Script
- Ensure the function *Install* is selected in the dropdown
![image](https://github.com/user-attachments/assets/514f8b7a-7f7d-44e2-b926-1de5c04f5b71)
- Press *Run*
![image](https://github.com/user-attachments/assets/6fa11ebc-16c1-4df6-9f97-abfab5c24d9c)
- You'll get a popup message that additional permissions are needed. Click "Review Permissions"
- Ensure the correct Google account is selected.
- You may see an error that the app is not signed/certified. Click "Advanced" then "Go to Scoutbook GCal Sync (Unsafe)
- This video (not mine) shows the process: https://www.youtube.com/watch?v=0fKq_cGAOR0

  That's it! The script is now configured to pull the calendar from Scoutbook every 15 minutes and make updates! No need to touch ANYTHING in the Google Calendar. This will add new events, update changed events, and delete cancelled events automatically!

  ## Manual Sync
  If you want to push changes manually (say, you just make a change and need it to update immediately), just change the "Install" dropdown to "StartSync", press "Run", and watch it work!

## Need Help?
Submit an [issue](https://github.com/RedWedgeX/scoutbook-gcal-sync/issues) and I'll do the best I can to help!

## Credit 

Updated for Scoutbook use by [RedWedgeX](https://bsky.app/profile/redwedgex.wtf)

### Orignal Author
[Derek Antrican](https://github.com/derekantrican) 

### Additional Contributors to original project
[Andrew Brothers](https://github.com/agentd00nut)

[Joel Balmer](https://github.com/JoelBalmer)

[Blackwind](https://github.com/blackwind)

[Jonas Geissler](https://github.com/jonas0b1011001)
