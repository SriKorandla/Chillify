//script.ts Sri Korandla


// Web App using the Spotify API to generate new playlist with a more relaxed sound from a user-selected playlist
//Uses 0Auth 2.0 framework for authentication 

const clientId = "e2b749af66674688b98091b4ee3cf19f"; //clientID 
const params = new URLSearchParams(window.location.search) 
const code = params.get("code"); // for accessToken provided by the API 
var width = 0; //variable for progress bar
localStorage.setItem('access_token', "0"); 

/* getStart kickstarts the script
 * calls functions to get authenticated, gather user profile data, and playlists, and populates the UI
 */

async function getStart(){ 
    if (!code) {
        redirectToAuthCodeFlow(clientId);
    } 
    else {
        const accessToken = await getAccessToken(clientId, code);
        const profile = await fetchProfile(accessToken);
        populateUI(profile);
        getUserPlaylists(accessToken);
    }
}
getStart(); 

/* redirectToAuthCodeFlow
 * Standard function recommended by the Spotify Development Team
 * Check out https://developer.spotify.com/documentation/web-api/howtos/web-app-profile for an in depth explanataion
 */

export async function redirectToAuthCodeFlow(clientId: string) { 
    //get verifier and challenge
    const verifier = generateCodeVerifier(128); 
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem("verifier", verifier); 
    
    // get all the parameters required for this app, and send them off
    const params = new URLSearchParams();
    params.append("client_id", clientId);   
    params.append("response_type", "code");
    //params.append("redirect_uri", "https://chil-lify.netlify.app"); //deployed app
    params.append("redirect_uri", "http://localhost:5173/callback"); //local runs
    params.append("scope", "user-read-private user-read-email user-top-read playlist-read-private playlist-modify-private playlist-modify-public"); // gives the script permissions to access certain data
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/* generates verifier for authentication*/
function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; //possible characters

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/* generates code challenge for redirectToAuthCodeFlow function */

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/* gets and returns valid access token to caller*/

export async function getAccessToken(clientId: string, code: any): Promise<string> {
    //get verifier from storage
    const verifier = localStorage.getItem("verifier");

    //make post request to API for the access token
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    //params.append("redirect_uri", "https://chil-lify.netlify.app");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });
    const { access_token } = await result.json();
    return access_token; //return the token 
}

/* function to fetch the user's profile data  */
async function fetchProfile(token: string): Promise<any> { 
    //make get request to API for user's profile data
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });
    return await result.json(); //return the data
}

/* gets up to 100 of the user's playlists*/
async function getUserPlaylists(token:string): Promise <any> {  
    //make get request to API for the users playlists
    const result = await fetch("https://api.spotify.com/v1/me/playlists", {
        method: "GET",  headers: { Authorization: `Bearer ${token}` }});
    const data = await result.json();       
  
    populateUIWithPlaylists(data.items, token); //calls function to display playlists to select
}


/* after playlists were retrieved, the UI is populated with buttons that correspond to the playlist */
async function populateUIWithPlaylists (playlists:any, token: any){ 

    if (playlists.length > 0){
        //remove prompt to tell the user to create a playlist/log in
        document.getElementById("noPlaylist")!.innerText = " ";
         for(let i = 0; i < playlists.length; i++){
            //for each playlist, new button is created, and added to the playlists part of the html 
            const myButtons = document.querySelector("#playlists");

            const listItem = document.createElement("li");
            const newButtonItem = document.createElement("button");
            //button's text is given the name of the playlist
            newButtonItem.textContent = playlists[i].name;
            //assigned the id 
            newButtonItem.id = "playlist" + (i);
            
            //when clicked, passes the button id, the array of entire playlists, the name of the playlist, and the accesstoken 
            newButtonItem.addEventListener("click", function () {getPlaylistDetails(newButtonItem.id, playlists, playlists[i].name, token);
            }) 
            listItem!.append(newButtonItem);
            myButtons!.append(listItem);
         } 
    }
    
    
   

}

/* after the playlist is selected, make a get request to get the full details on the playlist, and call generateRecommendations*/
async function getPlaylistDetails(buttonId: string, playlists: any, name: string, token:any ){
    
    //gets the index of the selected playlist in reference to the array of playlists
    const playlistId = buttonId.split("t").pop();
    //gets the playlists spotify url
    const selectedPlaylist = playlists[playlistId!].tracks.href;
    
    //api call to get full details of the playlist
    const result = await fetch(selectedPlaylist, {
        method: "GET",  headers: { Authorization: `Bearer ${token}` }});
    const fullDetailsPlaylist = await result.json();
    const playlistItems = fullDetailsPlaylist.items; 
    
    //clears ui of playlist buttons 
    afterDetailsSelected();
    
    //generates recommendations
    generateRecommendations(playlistItems, token, name);

}

/* From the selected playlist, generate recommendations on each track, then add to a new playlist */
async function generateRecommendations(selectedPlaylist: any, token: string, name: string ){ //function to generate recommendations

  //playlist name 
  const playlistname = "Chillified: " + name;

  //new private playlist is created
  const newPlaylist = await fetch("https://api.spotify.com/v1/me/playlists", {method: "POST", headers :{Authorization: `Bearer ${token}`}, body:JSON.stringify({
    "name": playlistname ,
    "description": "Playlist created by Chillify",
    "public": false })} );

  //gets the playlist id , so that tracks can be added later 
  const jsonData = await newPlaylist.json();
  const playlistId = jsonData.id;
    
    //for each song, generate a recommendation 
    for(let i = 0; i < selectedPlaylist.length; i++){ 
        const total = selectedPlaylist.length;
        const song = selectedPlaylist[i].track.id; //song in the original playlist's id 
        const fullSongDetails = await fetch("https://api.spotify.com/v1/audio-features/" + song, {method: "GET", headers : {Authorization: `Bearer ${token}`} });
        const songValues = await fullSongDetails.json();
        
        //get the energy, loudness, and tempo values for the track. these will be used to generate the best recommendations 
        const energy = songValues.energy;
        const loudness = songValues.loudness;
        const tempo =  songValues.tempo;
        
        //calculate target values
        const targetEnergy = energy*0.75
        const targetLoudness = loudness*1.15;
        const targetTempo =  tempo*0.75;
        
        //api call with these target values to get the 5 most similar tracks 
        const data = await fetch(`https://api.spotify.com/v1/recommendations?limit=5&seed_tracks=${song}&max_energy=${energy}&target_energy=${targetEnergy}&max_loudness=${loudness}&target_loudness=${targetLoudness}&max_tempo=${tempo}&target_tempo=${targetTempo}`,{ method: "GET", headers :{Authorization: `Bearer ${token}`}}); // array of 5 songs 
        const recommended = await data.json();
        const recommendedSongs = await recommended.tracks;
        const selectedSong = recommendedSongs[Math.floor(Math.random()*recommendedSongs.length)]; //select one of the tracks from the 5 randomly 
        
        //get the track's uri, and add to the generated playlist
        const selectedTrack = selectedSong.uri;
        await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {method: "POST", headers: {Authorization: `Bearer ${token}`}, body:JSON.stringify({"uris": [selectedTrack]})});
        moveProgressBar(total); // updates the progress bar
    }
    onCompletion(); //once successfully completed, the UI is cleared 
}

/* visually shows progress to the User */

async function moveProgressBar(barSize: number){ 
    const increment = 100/barSize; //assign the increment 

    //update the width of the green part of the bar
    const elem = document.getElementById("bar");
    width = width + increment;
    elem!.style.width = width + "%"
    
}

async function afterDetailsSelected(){

    //get rid of prompter 
    const prompter = document.getElementById("playlistSelectPrompter");
    prompter!.innerHTML = " ";

    //updates the status 
    const status = document.getElementById("status");
    status!.innerHTML = "Working On It! This Can Take a Minute, Especially With Larger Playlists";
    
    //removes the playlist buttons 
    const display = document.getElementById("playlistdisplay");
    display!.remove();
}

/* After done, remove the progress bar and update the UI to inform the user that playlist was fully created */

async function onCompletion(){ 
    
    const status = document.getElementById("status")
    status!.innerHTML = ("Completed! Check Your Spotify For the New Playlist. Thanks for using Chillify!");
    //remove progress bar
    const bar = document.getElementById("progress");
    bar!.innerHTML = " ";
}

/* Populates the UI with the user's name, and prompts the user to select a playlist */
function populateUI(profile: any) { 

    document.getElementById("displayName")!.innerText = profile.display_name;
    //if profile successfully retrieved, add prompt 
    if(profile.display_name != null){
        document.getElementById("playlistSelectPrompter")!.innerText = "Which Playlist do you Want to Select?";
    }
}