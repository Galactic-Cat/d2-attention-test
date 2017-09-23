/* global $, firebase */

// Initialize Firebase
var config = {
    apiKey: "AIzaSyBTKT_HvqS9uUgpEBcb2QAYfEyk_5Sfs0s",
    authDomain: "d2-attention-test.firebaseapp.com",
    databaseURL: "https://d2-attention-test.firebaseio.com",
    projectId: "d2-attention-test",
    storageBucket: "d2-attention-test.appspot.com",
    messagingSenderId: "539033228501"
};
firebase.initializeApp(config);

let database = firebase.database()
let auth = firebase.auth()

function signIn (credentials) {
    if (credentials) {
        // auth.signInWith
    } else {
        auth.signInAnonymously().catch((error) => {
            alert('Could not establish connection to database.')
            console.error('Error while trying to sign in to firebase:\n', error.code, '\n', error.message)
        })
    }
}

function signOut () {
    auth.signOut().catch((error) => {
        console.error('Error while trying to sign out of firebase:\n', error.code, '\n', error.message)
    })
}

function genResults (result) {}

function postResult (result) {
    let resultString = genResults(result)
    database.ref('results/')
}

auth.onAuthStateChanged((user) => {
    $('#firebase-status').trigger('authstatechanged', user)
    if (user) {
        $('#firebase-status').text('cloud_queue')
    } else {
        $('#firebase-status').text('cloud_off')
    }
})