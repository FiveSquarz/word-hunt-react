import React from 'react';
import ReactDOM from 'react-dom/client'
import './index.css'
import wordListRaw from "./RIDYHEW.txt"
import newWordSound from './newWord.wav'

class Square extends React.Component {
  render() {
    return (
      <div className="square" style={{backgroundColor: this.props.color}}>
        <div className="detector" id={"detectorIndex" + this.props.index}>
          {this.props.letter}
        </div>
      </div>
    )
  }
}

class Board extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      pointerDown: false
    }
  }

  renderSquare(i) {
    let getSquareColor = (index) => {
      if (this.props.functions.isInAttempt(index)) {
        return this.props.functions.getAttemptColor()
      }
      return "transparent"
    }
    return <Square index={i} letter={this.props.tiles[i]} color={getSquareColor(i)} />
  }

  onMove(info) {
    if (this.state.pointerDown && this.getTarget(info).className == "detector") {
      const index = parseInt(this.getTarget(info).id.slice("detectorIndex".length))
      this.props.functions.tryUpdateSequence(index)
    }
  }

  onDown(info) {
    this.setState({
      pointerDown: true
    })
    if (this.getTarget(info).className == "detector") {
      const index = parseInt(this.getTarget(info).id.slice("detectorIndex".length))
      this.props.functions.tryUpdateSequence(index)
    }
  }

  onUpOrLeave(info) {
    this.setState({
      pointerDown: false
    })
    this.props.functions.submitAttempt()
  }

  getTarget(info) {
    return document.elementFromPoint(info.clientX, info.clientY)
  }

  render() {
    return (
      <div
        onPointerMove={this.onMove.bind(this)}
        onPointerDown={this.onDown.bind(this)}
        onPointerUp={this.onUpOrLeave.bind(this)}
        onPointerLeave={this.onUpOrLeave.bind(this)}
      >
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
          {this.renderSquare(3)}
        </div>
        <div className="board-row">
          {this.renderSquare(4)}
          {this.renderSquare(5)}
          {this.renderSquare(6)}
          {this.renderSquare(7)}
        </div>
        <div className="board-row">
          {this.renderSquare(8)}
          {this.renderSquare(9)}
          {this.renderSquare(10)}
          {this.renderSquare(11)}
        </div>
        <div className="board-row">
          {this.renderSquare(12)}
          {this.renderSquare(13)}
          {this.renderSquare(14)}
          {this.renderSquare(15)}
        </div>
      </div>
    )
  }
}

class Game extends React.Component {

  constructor(props) {
    super(props)

    this.startingTime = 60

    this.state = {
      tiles: Array(16).fill(null),
      sequence: [],
      timeRemaining: 0,
      usedWords: []
    }

    const weightedLetterDistribution = {
      "A": 12,
      "B": 1,
      "C": 5,
      "D": 6,
      "E": 19,
      "F": 4,
      "G": 3,
      "H": 5,
      "I": 11,
      "J": 1,
      "K": 1,
      "L": 5,
      "M": 4,
      "N": 11,
      "O": 11,
      "P": 4,
      "Q": 1,
      "R": 12,
      "S": 9,
      "T": 13,
      "U": 4,
      "V": 1,
      "W": 2,
      "X": 1,
      "Y": 3,
      "Z": 1,
    }
    var tempWeightedLetters = []
    for (const [key, value] of Object.entries(weightedLetterDistribution)) {
      tempWeightedLetters = tempWeightedLetters.concat(Array(value).fill(key))
    }
    this.weightedLetters = tempWeightedLetters

    let wordList = []
    fetch(wordListRaw)
      .then(r => r.text())
      .then(text => {
        wordList = text.toUpperCase().split("\n")
        while (wordList.includes("")) {
          wordList.splice(wordList.indexOf(""), 1)
        }
        this.wordList = wordList
      })
  }

  startNewGame() {
    this.generateTiles()
    this.setState({
      timeRemaining: this.startingTime,
      usedWords: []
    })
    this.handleTimer()
  }

  generateTiles() {
    const maxRepeats = 2

    let occurances = {}
    let getRandomLetter = () => {
      let letter = ""
      do {
        letter = this.weightedLetters[Math.floor(Math.random() * this.weightedLetters.length)]
      } while ((occurances[letter] ?? -1) >= maxRepeats) //parentheses matter here
      occurances[letter] = (occurances[letter] ?? 0) + 1
      return letter
    }

    let tiles = Array(16).fill(null)
    let emptyPositions = [...Array(16).keys()]
    for (let i = 0; i < 16; i++) {
      const letter = getRandomLetter()
      const position = emptyPositions[Math.floor(Math.random() * emptyPositions.length)]
      emptyPositions.splice(emptyPositions.indexOf(position), 1)
      tiles[position] = letter
    }
    this.setState({
      tiles: tiles
    })
  }

  handleTimer() {
    if (this.intervalId != null) {
      clearInterval(this.intervalId)
    }
    this.intervalId = setInterval(() => {
      if (this.state.timeRemaining == 1) {
        this.submitAttempt()
      }
      this.setState({
        timeRemaining: this.state.timeRemaining - 1
      }, () => {
        if (this.state.timeRemaining == 0) {
          clearInterval(this.intervalId)
        }
      })
    }, 1000);
  }

  getTotalScore() {
    let result = 0
    for (const word of this.state.usedWords) {
      result += this.getWordScore(word)
    }
    return result
  }

  getWordScore(word) {
    switch (word.length) {
      case 1:
        return 1
      case 2:
        return 50
      case 3:
        return 100
      default:
        return (word.length - 3) * 400
    }
  }

  getAttempt() {
    let result = ""
    for (const index of this.state.sequence) {
      result += this.state.tiles[index]
    }
    return result
  }

  getAttemptColor() {
    if (this.state.usedWords.includes(this.getAttempt())) {
      return "red"
    }
    if (this.getAttempt().length >= 3 && this.wordList.includes(this.getAttempt())) {
      return "limegreen"
    }
    return "gray"
  }

  isInAttempt(index) {
    //console.log(this.state.tiles)
    return this.state.sequence.includes(index)
  }

  tryUpdateSequence(index) {
    if (this.state.timeRemaining == 0 || this.state.sequence.includes(index)) {
      return
    }
    const previousIndex = this.state.sequence[this.state.sequence.length - 1]
    if (this.state.sequence.length == 0
      || Math.abs(index - previousIndex) == 1 && Math.floor(index / 4) == Math.floor(previousIndex / 4)
      || Math.abs(index - (previousIndex - 4)) <= 1 && Math.floor(index / 4) == Math.floor(previousIndex / 4) - 1
      || Math.abs(index - (previousIndex + 4)) <= 1 && Math.floor(index / 4) == Math.floor(previousIndex / 4) + 1
    ) {
      this.setState({
        sequence: this.state.sequence.concat(index)
      })
    }
  }

  submitAttempt() {
    const attempt = this.getAttempt()
    this.setState({
      sequence: []
    })
    if (this.state.timeRemaining == 0 || attempt.length < 3) {
      return
    }
    if (!this.state.usedWords.includes(attempt) && this.wordList.includes(attempt)) {
      this.setState({
        usedWords: this.state.usedWords.concat(attempt)
      })
      this.newWordSound.currentTime = 0
      this.newWordSound.play()
    }
  }

  getFunctions() {
    return {
      getAttemptColor: this.getAttemptColor.bind(this),
      isInAttempt: this.isInAttempt.bind(this),
      tryUpdateSequence: this.tryUpdateSequence.bind(this),
      submitAttempt: this.submitAttempt.bind(this)
    }
  }

  render() {
    return (
      <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div style={{position: "absolute", top: "50%", transform: "translate(0%, -50%)"}}>
          <div className="game" style={{fontSize: "5vmin"}}>
            Score: {this.getTotalScore()}
          </div>
          <div className="game" style={{fontSize: "3vmin"}}>
            Time Remaining: {this.state.timeRemaining}
          </div>
          <div className="game">
            <div className="game">
              <div className="game-board">
                <Board tiles={this.state.tiles} functions={this.getFunctions()} />
              </div>
            </div>
          </div>
          <div className="game">
            <button onClick={() => {
              this.newWordSound = new Audio(newWordSound)
              this.newWordSound.play()
              this.newWordSound.pause()
              this.startNewGame()
              }} style={{fontSize: "5vmin"}}>Start New Game</button>
          </div>
        </div>
      </div>
    )
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<Game />)
