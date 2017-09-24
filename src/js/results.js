/* global $, firebase, alert */

// Initialize Firebase
var config = {
  apiKey: 'AIzaSyBTKT_HvqS9uUgpEBcb2QAYfEyk_5Sfs0s',
  authDomain: 'd2-attention-test.firebaseapp.com',
  databaseURL: 'https://d2-attention-test.firebaseio.com',
  projectId: 'd2-attention-test',
  storageBucket: 'd2-attention-test.appspot.com',
  messagingSenderId: '539033228501'
}
firebase.initializeApp(config)

let database = firebase.database()
let auth = firebase.auth()
let providerGoogle = new firebase.auth.GoogleAuthProvider()

function signIn (agent) {
  if (agent === 'google') {
    auth.signInWithPopup(providerGoogle).then((result) => {
      let user = result.user
      database.ref('users/' + user.uid).once('value').then((val) => {
        if (val.val() == null) {
          database.ref('users/' + user.uid).set({
            uid: user.uid,
            provider: 'google'
          })
        }
      })
    }).catch((error) => {
      alert('Logging in failed.')
      console.error('Error while trying to sign in via google:\n', error.code, '\n', error.message)
    })
  } else if (agent === 'anon') {
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
  database.ref('results/' + auth.currentUser.uid).set(resultString)
}

auth.onAuthStateChanged((user) => {
  $('.firebase-console').fadeOut(200, _ => {
    if (user) {
      $('.firebase-status').text('cloud')
      $('.firebase-userpanel').show()
      $('.firebase-signinpanel').hide()
      if (user.isAnonymous) {
        $('.firebase-email').text('Anonymous')
      } else {
        $('.firebase-email').text(user.email)
      }
      $('.firebase-uid').text(user.uid)
    } else {
      $('.firebase-status').text('cloud_queue')
      $('.firebase-email, .firebase-uid').text('')
      $('.firebase-userpanel').hide()
      $('.firebase-signinpanel').show()
    }
  })
})

$('button[signin]').click(function () { signIn($(this).attr('signin')) })
$('#signOut').click(_ => signOut())

$('.firebase-status').click(_ => $('.firebase-console').fadeToggle(200))
