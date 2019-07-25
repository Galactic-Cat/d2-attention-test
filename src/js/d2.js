/* global $, correctslider, Gaussian, topslider, bottomslider, letters, switchMain, Image, pyro */

function progressbar (p) {
  $('#progress-bar').css('width', p + '%')
}

function generateTest (info) {
  // Gather screen-info
  let screens = parseInt($('#screennumber').val(), 10)
  let rows = parseInt($('#rownumber').val(), 10)
  let columns = parseInt($('#columnnumber').val(), 10)
  let topStripes = topslider.value
  let bottomStripes = bottomslider.value
  let ratio = correctslider.value
  if (isNaN(screens) || isNaN(rows) || isNaN(columns) || isNaN(ratio)) {
    console.error('Could not generate test with this information:\n', {screens: screens, rows: rows, columns: columns, ratio: ratio})
    return false
  }

  // Generate Letterbox
  let letterbox = {
    correct: {},
    incorrect: {}
  }
  Object.keys(letters).forEach((idx) => {
    if (letters[idx].enabled) {
      let key = letters[idx].letter
      if (letters[idx].correct) {
        letterbox.correct[key] = letters[idx].stripes
      } else {
        letterbox.incorrect[key] = letters[idx].stripes
      }
    }
  })
  if (Object.keys(letterbox.correct).length < 1 || Object.keys(letterbox.incorrect).length < 1) {
    console.error('Could not generate test with this letterbox:\n', letterbox)
    return false
  }

  // Generate CorrectList
  let correctList = []
  let correctval = Math.round(columns * (correctslider.value / 100))
  console.debug('<d2.js>\nCorrectval is', correctval)
  for (let s = 0; s < screens * rows; s++) {
    let rawlist = []
    for (let c = 0; c < correctval; c++) {
      rawlist.push(true)
    }
    for (let f = 0; f < columns - correctval; f++) {
      rawlist.push(false)
    }
    for (let i = rawlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawlist[i], rawlist[j]] = [rawlist[j], rawlist[i]]
    }
    correctList = correctList.concat(rawlist)
  }
  console.debug('<d2.js>\nCorrectList is', correctList)

  // Generate final data array
  let fin = []
  for (let s = 0; s < screens; s++) {
    fin.push([])
    for (let r = 0; r < rows; r++) {
      fin[s].push([])
      for (let c = 0; c < columns; c++) {
        let correctIndex = s * rows * columns + r * columns + c
        // console.debug('CorrectList returned', correctList[correctIndex], 'for index', correctIndex, '(s:', s + '; r:', r + '; c:', c + ')')
        if (correctList[correctIndex]) {
          let letter = Object.keys(letterbox.correct)[Math.floor(Math.random() * Object.keys(letterbox.correct).length)]
          let top = Math.floor(Math.random() * (topStripes + 1))
          let bottom = Math.floor(Math.random() * (bottomStripes + 1))
          while (top + bottom !== letterbox.correct[letter]) {
            let topOrBottom = Math.floor(Math.random() * 2)
            if (top + bottom < letterbox.correct[letter]) {
              topOrBottom === 1 ? top++ : bottom++
            } else {
              topOrBottom === 1 ? top-- : bottom--
            }
            if (top > topStripes) {
              if (bottom < bottomStripes) {
                top--
                bottom++
              } else {
                console.error('Could not generate test with these stripe settings:\n', {letter: letter, top: top, bottom: bottom, stripes: letterbox.correct[letter]})
                return false
              }
            } else if (bottom > bottomStripes) {
              if (top < topStripes) {
                top++
                bottom--
              } else {
                console.error('Could not generate test with these stripe settings:\n', {letter: letter, top: top, bottom: bottom, stripes: letterbox.correct[letter]})
                return false
              }
            } else if (top < 0) {
              if (bottom > 0) {
                top++
                bottom--
              } else {
                console.error('Could not generate test with these stripe settings:\n', {letter: letter, top: top, bottom: bottom, stripes: letterbox.correct[letter]})
                return false
              }
            } else if (bottom < 0) {
              if (top > 0) {
                top--
                bottom++
              } else {
                console.error('Could not generate test with these stripe settings:\n', {letter: letter, top: top, bottom: bottom, stripes: letterbox.correct[letter]})
                return false
              }
            }
          }
          fin[s][r][c] = [top, letter, bottom, true]
        } else {
          let letter = Math.floor(Math.random() * (Object.keys(letterbox.correct).length + Object.keys(letterbox.incorrect).length)) + 1
          let inCorrect = false
          if (letter <= Object.keys(letterbox.correct).length) {
            letter = Object.keys(letterbox.correct)[letter - 1]
            inCorrect = true
          } else {
            letter = Object.keys(letterbox.incorrect)[letter - Object.keys(letterbox.correct).length - 1]
          }
          let top = Math.floor(Math.random() * (topStripes + 1))
          let bottom = Math.floor(Math.random() * (bottomStripes + 1))
          if (inCorrect && top + bottom === letterbox.correct[letter]) {
            let topOrBottom = Math.floor(Math.random() * 2)
            topOrBottom === 1 ? top++ : bottom++
            if (top > topStripes) top = 0
            if (bottom > bottomStripes) bottom = 0
          }
          fin[s][r][c] = [top, letter, bottom, false]
        }
      }
    }
  }
  return {screens: screens, rows: rows, columns: columns, test: fin}
}

function printi (n) {
  let ret = ''
  for (var i = 0; i < n; i++) {
    ret += 'I'
  }
  if (ret === '') ret = '&nbsp;'
  return ret
}

function Test () {
  this.info = generateTest()
  this.canvas = {
    canvas: $('#resultCanvas')[0],
    image: new Image(),
    positionX: (score) => {
      return (39 + (score - 20) * 6.65) - 2
    },
    positionY: (score) => {
      return (400 - (score - 20) * 6.65) - 2
    }
  }
  this.canvas.ctx = this.canvas.canvas.getContext('2d')
  this.canvas.image.src = './src/img/graph.png'
  $(this.canvas.image).attr('width', false)
  this.canvas.image.onload = _ => {
    this.canvas.canvas.width = this.canvas.image.width
    this.canvas.canvas.height = this.canvas.image.height
    this.canvas.ctx.drawImage(this.canvas.image, 0, 0)
  }

  this.core = {
    calcid: (s, r, c) => {
      if (typeof s === 'undefined') {
        return null
      } else if (typeof r === 'undefined') {
        return 'screen-' + s
      } else if (typeof c === 'undefined') {
        return 'row-' + (s * this.info.rows + r)
      } else {
        return 'cell-' + (s * this.info.rows * this.info.columns + r * this.info.columns + c)
      }
    },
    calculateResult: (result) => {
      // let all = this.info.screens * this.info.rows * this.info.columns
      if (typeof result[0] === 'undefined') {
        let cs = result.correct - (result.wrong.total + result.missed.total)
        let ps = result.correct
        let er = Math.round(result.correct / (result.wrong.total + result.missed.total) * 10) / 10
        if (isNaN(er) || er === Infinity) er = 100
        return [cs, ps, er]
      } else if (typeof result === 'object') {
        let overAll = {cs: 0, ps: 0, er: 0}
        result.forEach((res, i) => {
          overAll.cs += res[0]
          overAll.ps += res[1]
        })
        overAll.wrong = overAll.ps - overAll.cs
        console.debug('Overall wrong:', overAll.wrong + '. Overall right:')
        overAll.er = Math.round(overAll.ps / overAll.wrong * 10) / 10
        if (isNaN(overAll.er) || overAll.er === Infinity) overAll.er = 100
        return [overAll.cs, overAll.ps, overAll.er]
      } else {
        console.error('Could not calculate result for this result:\n', result)
        return false
      }
    },
    calculateScore: (type, input) => {
      let scale = new Gaussian(50, 100)
      let mean
      switch (type) {
        case 'cs':
          mean = 185.57692
          break
        case 'ps':
          mean = 204.166666666667
          break
        case 'er':
          mean = 1.201923
      }
      let vari = (mean / 5) * (mean / 5)
      let ndis = new Gaussian(mean, vari)
      console.debug('Normal Distribution for', type, '=', ndis)
      let area = ndis.cdf(input)
      console.debug('Area for', type, 'is', area)
      console.debug('Final score for', type, 'is', Math.round(scale.ppf(area)))
      return Math.round(scale.ppf(area))
    },
    gatherResults: _ => {
      let counter = []
      this.info.test.forEach((scr, s) => {
        counter.push({correct: 0, wrong: {beflast: 0, total: 0}, missed: {beflast: 0, total: 0}, last: 0})
        console.debug('Plotting last for screen', s)
        let last = $('#' + this.core.calcid(s) + ' td[sel="true"]')
        let lastn
        if (last[0] === undefined) {
          last = 0
        } else {
          last = last[last.length - 1]
          lastn = parseInt($(last).attr('id').split('-')[1], 10)
          last = parseInt($(last).attr('id').split('-')[1], 10) - (s * this.info.rows * this.info.columns)
        }
        counter[s].last = last
        scr.forEach((row, r) => {
          row.forEach((col, c) => {
            let sel = ($('#' + this.core.calcid(s, r, c)).attr('sel') === 'true')
            if (col[3]) {
              if (sel) {
                counter[s].correct++
              } else {
                if (lastn >= parseInt($('#' + this.core.calcid(s, r, c)).attr('id').split('-')[1], 10)) {
                  counter[s].missed.beflast++
                }
                counter[s].missed.total++
              }
            } else {
              if (sel) {
                if (lastn >= parseInt($('#' + this.core.calcid(s, r, c)).attr('id').split('-')[1], 10)) {
                  counter[s].wrong.beflast++
                }
                counter[s].wrong.total++
              }
            }
          })
        })
      })
      return counter
    },
    present: (s) => {
      $('#' + this.core.calcid(s - 1)).fadeOut(100)
      setTimeout(_ => $('#' + this.core.calcid(s)).fadeIn(100), 800)
    },
    run: _ => {
      console.debug('Starting test, presenting screen', 1)
      this.core.present(this.core.screen)
      this.core.interval = setInterval(_ => {
        this.core.screen++
        if (!(this.core.screen < this.info.screens)) {
          clearInterval(this.core.interval)
          console.debug('Test endend, interval cleared.')
          this.end()
        } else {
          console.debug('Running test, moving on to screen', this.core.screen + 1)
          this.core.present(this.core.screen)
        }
      }, 21000)
    },
    screen: 0
  }

  this.start = _ => {
    $('.firebase-status').fadeOut(200)
    document.documentElement.webkitRequestFullscreen()
    for (var s = 0; s < this.info.screens; s++) {
      $('.testbox').append('<table id="' + this.core.calcid(s) + '" style="margin: 20px auto; display: none;"></table>')
      for (var r = 0; r < this.info.rows; r++) {
        $('#screen-' + s).append('<tr id="' + this.core.calcid(s, r) + '"></tr>')
        for (var c = 0; c < this.info.columns; c++) {
          $('#' + this.core.calcid(s, r)).append('<td id="' + this.core.calcid(s, r, c) + '">' + printi(this.info.test[s][r][c][0]) + '<br>' + this.info.test[s][r][c][1] + '<br>' + printi(this.info.test[s][r][c][2]) + '</td>')
        }
      }
    }
    $('.testbox td').on('click', (e) => {
      let t = !($(e.target).attr('sel') === 'true')
      $(e.target).attr('sel', t)
    })
    this.core.run()
  }

  this.end = (forceScore) => {
    document.webkitCancelFullScreen()
    $('.firebase-status').fadeIn(200)
    switchMain('testend')
    let results = this.core.gatherResults()
    let resl = []
    results.forEach((result, s) => {
      let res = this.core.calculateResult(result)
      resl.push(res)
      $('#resultstable').append('<tr><td>Screen ' + (s + 1) + '</td><td>' + res[0] + '</td><td>' + res[1] + '</td><td>' + res[2] + '</td></tr>')
    })
    let res = forceScore || this.core.calculateResult(resl)
    let fin = ''
    resl.forEach((ris, i) => {
      fin += (ris[0] + '=' + ris[1] + '=' + ris[2])
      fin += '::'
    })
    //pyro.result.core = fin
    //pyro.post()
    $('#resultstable').append('<tr><td>Over All</td><td>' + res[0] + '</td><td>' + res[1] + '</td><td>' + res[2] + '</td></tr>')
    let score = [this.core.calculateScore('cs', res[0]), this.core.calculateScore('ps', res[1]), this.core.calculateScore('er', res[2])]
    let x = this.canvas.positionX(score[1])
    let y = this.canvas.positionY(score[2])
    console.debug('Drawing a lovely rectangle at', x, y)
    this.canvas.ctx.fillStyle = '#FF0000'
    this.canvas.ctx.fillRect(x, y, 4, 4)
    $('#score-cs').text(Math.round(score[0]))
    $('#score-ps').text(Math.round(score[1]))
    $('#score-er').text(Math.round(score[2]))
  }
}

if (generateTest && Test && progressbar) {}
