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

var userdata = {
  post: _ => {
    if (userdata.gender === undefined || userdata.age === undefined) {
      if (userdata.gender === undefined && $('#gender-male, #gender-female').is(':checked') === false) {
        alert('Please reselect your gender.')
      } else {
        if ($('#gender-male').is(':checked')) userdata.gender = 'male'
        if ($('#gender-female').is(':checked')) userdata.gender = 'female'
      }
      if (userdata.age === undefined && $('#age').val() === '') {
        alert('Please re-enter your age.')
      } else {
        userdata.age = parseInt($('#age').val(), 10)
      }
    } else {
      database.ref('users/' + auth.currentUser.uid).update({
        gender: userdata.gender,
        age: userdata.age
      })
    }
  }
}

function Result (opts) {
  this.uid = auth.currentUser.uid
  this.state = {
    core: opts.state || 'normal',
    set: (nstate) => {
      if (nstate !== 'normal' && nstate !== 'hard') {
        return false
      } else {
        this.state.core = nstate
        this.ref = database.ref('results/' + this.state.core).push()
        return nstate
      }
    }
  }
  this.ref = database.ref('results/' + this.state.core).push()
  this.result = {
    core: undefined,
    set: (res) => {
      this.result.core = res[0] + '::' + res[1] + '::' + res[2]
    }
  }
  this.post = _ => {
    database.ref('results/' + this.state.core + '/' + this.ref).set(this.result).then(_ => {
      database.ref('users/' + this.uid + '/results/' + this.ref).set(this.state.core)
      console.debug('Results posted to firebase, under', this.state.core, 'with ref', this.ref)
    }).catch((err) => {
      alert('Results failed to save.')
      console.error('Could not post results to firebase:\n', err.message)
    })
  }
}

auth.onAuthStateChanged((user) => {
  $('.firebase-console').fadeOut(200, _ => {
    if (user) {
      $('.firebase-status').text('cloud')
      $('.firebase-userpanel').show()
      $('.firebase-signinpanel').hide()
      if (user.isAnonymous) {
        $('.firebase-email').text('Anonymous')
        $('#newUser').show()
      } else {
        $('.firebase-email').text(user.email)
        $('#newUser').hide()
      }
      $('.firebase-uid').text(user.uid)
      database.ref('users/' + auth.currentUser.uid).once('value').then((data) => {
        data = data.val()
        if (data != null) {
          let check = 0
          if (data.gender === 'male') {
            $('#gender-female').prop('checked', false)
            $('#gender-male').prop('checked', true)
            check++
          } else if (data.gender === 'female') {
            $('#gender-male').prop('checked', false)
            $('#gender-female').prop('checked', true)
            check++
          }
          if (typeof data.age === 'number') {
            $('#age').val(data.age)
            check++
          }
          if (check >= 2) $('#startButton').prop('disabled', false)
        }
      })
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

if (Result) {}
