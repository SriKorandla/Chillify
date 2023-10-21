# Chillify Web App
## Sri Korandla

This is a Code Sample for my 24W DALI Application. It is a web app built with HTML, CSS, TypeScript, and Vite that utilizes the Spotify API. The app allows the user to select a playlist, and the app will then generate a playlist with similar music, except with a more laid back vibe overall. It is a single page application that utilizes 0Auth2.0 authentication. The important code was written in script.ts, so check that out!


## Video Link:
https://drive.google.com/file/d/1EVRkMORGI3Aa1nHN13ALkg_JAMdsSMOG/view?usp=share_link

## RUNNING THE APP

NOTE: THIS APP WILL NOT WORK WITH YOUR PERSONAL SPOTIFY PROFILE AS OF NOW (Waiting on full approval from the Spotify Team). As of now, this app only works on accounts validated on the App's dashboard, so use the account below:

Username: cchillify@gmail.com
Password: Chillifytest

### Running the deployed app:
To run the deployed app, first visit chil-lify.netlify.app
Then, when prompted, Login with the credentials listed above, and select an available playlist
To see the output, go log-in to spotify with the credentials, and see the new playlist with "Chillifed:" in the name

### Running Locally:
The code has already been slightly altered to run locally:
The redirect URI's have been changed to http://localhost:5173/callback, which will allow local runs.
The original URI's have been commented out, and are on the line above the local URIs.

Download the Files, and then use Vite run the app in developer's mode. It is very important that http://localhost:5173/ is used, as redirect URIs must be listed on the App's Dashboard in Spotify Developer Mode, and 5173 was listed. If there are any problems running this app, please let me know!

