import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Card as CardType, LogEntry } from './types';
import { createDeck, shuffleDeck, isValidSequence, isValidSet, calculateHandValue } from './engine';
import { getBotThrow, getBotDraw } from './bot';
import { Card } from './components/Card';
import { HelpCircle } from 'lucide-react';

const INITIAL_CARDS = 7;
const TARGET_SCORE = 40;

const SUIT_EMOJI: Record<string, string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣',
};

const App: React.FC = () => {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [botHand, setBotHand] = useState<CardType[]>([]);
  const [playerLastThrown, setPlayerLastThrown] = useState<CardType[]>([]); // Bot picks from here
  const [botLastThrown, setBotLastThrown] = useState<CardType[]>([]); // Player picks from here
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [turn, setTurn] = useState<'player' | 'bot'>('player');
  const [gameState, setGameState] = useState<'drawing' | 'throwing'>('throwing');
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [jhyapResult, setJhyapResult] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
  const [discardPile, setDiscardPile] = useState<CardType[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const startNewRound = useCallback(() => {
    const fullDeck = shuffleDeck(createDeck());
    const pHand = fullDeck.splice(0, INITIAL_CARDS);
    const bHand = fullDeck.splice(0, INITIAL_CARDS);

    setDeck(fullDeck);
    setPlayerHand(pHand.sort((a, b) => a.value - b.value));
    setBotHand(bHand);
    setPlayerLastThrown([]);
    setBotLastThrown([]);
    setSelectedCards([]);
    setTurn('player');
    setGameState('throwing');
    setJhyapResult(null);
    setDiscardPile([]);
  }, []);


  const addLogEntry = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setActivityLog(prev => [...prev, {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLog]);

  const fullReset = (goToHome: boolean) => {
    setPlayerScore(0);
    setBotScore(0);
    setGameOver(false);
    setWinner(null);
    setJhyapResult(null);
    setActivityLog([]);
    if (goToHome) {
      setGameStarted(false);
    } else {
      startNewRound();
    }
  };

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const toggleCardSelection = (id: string) => {
    if (turn !== 'player' || gameState !== 'throwing') return;
    setSelectedCards(prev =>
      prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
    );
  };

  const handlePlayerDraw = (from: 'deck' | CardType) => {
    if (turn !== 'player') return;

    const cardsToThrow = playerHand.filter(c => selectedCards.includes(c.id));
    const isValid = cardsToThrow.length > 0 && (cardsToThrow.length === 1 || isValidSet(cardsToThrow) || isValidSequence(cardsToThrow));

    if (!isValid) {
      alert("Please select a valid set or sequence to throw first!");
      return;
    }

    let drawnCard: CardType | undefined;
    let newDeck = deck;

    if (from === 'deck') {
      if (deck.length === 0) {
        if (discardPile.length > 0) {
          const shuffledDiscards = shuffleDeck([...discardPile]);
          drawnCard = shuffledDiscards[0];
          setDeck(shuffledDiscards.slice(1));
          setDiscardPile([]);
        } else {
          alert("No cards left in the deck or discard pile!");
          return;
        }
      } else {
        drawnCard = deck[0];
        newDeck = deck.slice(1);
        setDeck(newDeck);
      }
    } else {
      drawnCard = from;
    }

    if (drawnCard) {
      // Move previous last throwns to discard pile
      if (from === 'deck') {
        setDiscardPile(prev => [...prev, ...botLastThrown]);
      } else {
        // If drawing from discard, the other cards in that throw group go to discard pile
        setDiscardPile(prev => [...prev, ...botLastThrown.filter(c => c.id !== (from as CardType).id)]);
      }

      // 1. Throw
      setPlayerHand(prev => prev.filter(c => !selectedCards.includes(c.id)));
      setPlayerLastThrown(cardsToThrow);
      addLogEntry({ player: 'Player', action: 'throw', cards: cardsToThrow });

      // 2. Draw
      setPlayerHand(prev => {
        const newHand = [...prev.filter(c => !selectedCards.includes(c.id)), drawnCard!];
        return newHand.sort((a, b) => a.value - b.value);
      });
      if (from === 'deck') {
        setDeck(newDeck);
        addLogEntry({ player: 'Player', action: 'draw', source: 'deck' });
      } else {
        setBotLastThrown([]);
        addLogEntry({ player: 'Player', action: 'draw', source: 'discard', cards: [from] });
      }

      // 3. Cleanup & Next Turn
      setSelectedCards([]);
      setTurn('bot');
      setGameState('throwing');
    }
  };

  const handleJhyap = () => {
    const pVal = calculateHandValue(playerHand);
    const bVal = calculateHandValue(botHand);
    if (pVal > 7) {
      alert("You can only call Jhyap with 7 points or less!");
      return;
    }
    if (pVal < bVal) {
      setBotScore(prev => prev + bVal);
      setJhyapResult(`Victory! You had ${pVal}, Bot had ${bVal}.`);
      addLogEntry({ player: 'Player', action: 'jhyap' });
    } else {
      setPlayerScore(prev => prev + pVal + 20);
      setJhyapResult(`Oops! You had ${pVal}, Bot had ${bVal}. Penalty +20!`);
      addLogEntry({ player: 'Player', action: 'jhyap' });
    }
  };

  useEffect(() => {
    if ((playerScore >= TARGET_SCORE || botScore >= TARGET_SCORE) && !gameOver) {
      setGameOver(true);
      // Winner is the one who DID NOT cross the limit (lower score)
      setWinner(playerScore < botScore ? 'Player' : 'Bot');
    }
  }, [playerScore, botScore, gameOver]);

  useEffect(() => {
    if (turn === 'bot' && !gameOver && !jhyapResult) {
      const timer = setTimeout(() => {
        const bVal = calculateHandValue(botHand);
        const pVal = calculateHandValue(playerHand);
        if (bVal <= 7 && Math.random() > 0.3) {
          addLogEntry({ player: 'Bot', action: 'jhyap' });
          if (bVal < pVal) {
            setPlayerScore(prev => prev + pVal);
            setJhyapResult(`Bot called Jhyap and won! Bot: ${bVal}, You: ${pVal}`);
          } else {
            setBotScore(prev => prev + bVal + 20);
            setJhyapResult(`Bot called Jhyap and FAILED! Bot: ${bVal}, You: ${pVal}`);
          }
          return;
        }

        const cardsToThrow = getBotThrow(botHand);
        const handAfterThrow = botHand.filter(c => !cardsToThrow.some(tc => tc.id === c.id));
        const pick = getBotDraw(handAfterThrow, playerLastThrown);

        let drawnCard: CardType | undefined;
        let finalDeck = deck;
        let finalDiscard = discardPile;

        if (pick === 'deck') {
          if (deck.length > 0) {
            drawnCard = deck[0];
            finalDeck = deck.slice(1);
          } else if (discardPile.length > 0) {
            const shuffled = shuffleDeck([...discardPile]);
            drawnCard = shuffled[0];
            finalDeck = shuffled.slice(1);
            finalDiscard = [];
          }
        } else if (typeof pick !== 'string') {
          drawnCard = pick;
        }

        // Apply updates
        setDeck(finalDeck);
        if (pick === 'deck') {
          setDiscardPile([...finalDiscard, ...playerLastThrown]);
        } else {
          setDiscardPile([...finalDiscard, ...playerLastThrown.filter(c => c.id !== (pick as CardType).id)]);
        }

        setPlayerLastThrown([]);
        setBotLastThrown(cardsToThrow);
        setBotHand([...handAfterThrow, ...(drawnCard ? [drawnCard] : [])]);

        // Log actions (Outside updaters to prevent duplicates)
        addLogEntry({ player: 'Bot', action: 'throw', cards: cardsToThrow });
        if (pick === 'deck') {
          addLogEntry({ player: 'Bot', action: 'draw', source: 'deck' });
        } else {
          addLogEntry({ player: 'Bot', action: 'draw', source: 'discard', cards: [pick] });
        }

        setTurn('player');
        setGameState('throwing');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, botHand, playerHand, deck, playerLastThrown, gameOver, jhyapResult, playerScore, botScore]);

  const handleStartGame = () => {
    setGameStarted(true);
    startNewRound();
  };

  if (!gameStarted) {
    return (
      <div className="game-container menu-bg">
        <div className="main-menu">
          <h1 className="game-title">DHUMBAAL</h1>
          <div className="menu-options">
            <button className="menu-btn primary" onClick={handleStartGame}>NEW GAME</button>
            <button className="menu-btn" onClick={() => setShowAbout(true)}>ABOUT GAME</button>
            <button className="menu-btn" onClick={() => setShowHelp(true)}>HOW TO PLAY</button>
          </div>
          <div className="menu-footer">Experience the classic Nepalese card game</div>
        </div>

        {showAbout && (
          <div className="modal-overlay" onClick={() => setShowAbout(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>About Dhumbaal</h2>
              <p className="about-text">
                Dhumbaal is a popular and strategic card game from Nepal, traditionally played with 2 to 6 players.
                It's a game of skill, calculation, and a bit of luck, where the goal is to minimize the points in your hand.
              </p>
              <p className="about-text">
                This digital version brings the classic experience to your browser with a challenging Bot AI,
                premium visuals, and the standard 7-card ruleset.
              </p>
              <button className="close-btn" onClick={() => setShowAbout(false)}>Close</button>
            </div>
          </div>
        )}

        {showHelp && (
          <div className="modal-overlay" onClick={() => setShowHelp(false)}>
            <div className="modal help-modal" onClick={e => e.stopPropagation()}>
              <h2>How To Play Dhumbaal</h2>
              <div className="help-content">
                <section>
                  <h3>Objective</h3>
                  <p>Have the <strong>lowest</strong> total hand value. The game ends when someone reaches <strong>40 points</strong>; that player loses!</p>
                </section>
                <section>
                  <h3>Card Values</h3>
                  <ul>
                    <li><strong>Ace:</strong> 1 Point</li>
                    <li><strong>2-10:</strong> Face Value</li>
                    <li><strong>J, Q, K:</strong> 10 Points Each</li>
                  </ul>
                </section>
                <section>
                  <h3>Gameplay</h3>
                  <p>On your turn, you must <strong>Select</strong> cards first, then click on pile or bot's thrown cards to <strong>Draw</strong> one card.</p>
                  <ul>
                    <li><strong>Throw:</strong> Single card, Set (3+ same rank), or Sequence (3+ same suit consecutive).</li>
                    <li><strong>Pick Up:</strong> One card from the <strong>Deck</strong> or the <strong>Bot's last throw</strong>.</li>
                  </ul>
                </section>
                <section>
                  <h3>Calling JHYAAP</h3>
                  <p>If your hand value is <strong>7 or less</strong>, you can call Jhyap during your throw phase.</p>
                  <ul>
                    <li>If you have less than the bot: <strong>Victory!</strong> You get 0 pts, Bot gets their hand value.</li>
                    <li>If the bot has less or equal: <strong>Failure!</strong> You get your hand value + 20 penalty points.</li>
                  </ul>
                </section>
              </div>
              <button className="close-btn" onClick={() => setShowHelp(false)}>Got It!</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="side-panel">
        <div className="stats">
          <div className="stat-item"><span className="stat-label">You</span><span className="stat-value">{playerScore}</span></div>
          <div className="stat-item"><span className="stat-label">Bot</span><span className="stat-value">{botScore}</span></div>
          <div className="stat-item"><span className="stat-label">Goal</span><span className="stat-value">{TARGET_SCORE}</span></div>
        </div>
        <button className="jhyap-btn" disabled={turn !== 'player' || gameState !== 'throwing' || calculateHandValue(playerHand) > 7} onClick={handleJhyap}>JHYAAP</button>

        <div className="statement-table">
          <h3>Activity Log</h3>
          <div className="log-list">
            {activityLog.length === 0 && <div className="log-empty">No moves yet...</div>}
            {activityLog.map(log => (
              <div key={log.id} className={`log-entry ${log.player.toLowerCase()}`}>
                <span className="log-player">{log.player}:</span>
                <span className="log-action">
                  {log.action === 'throw' && ` Threw ${log.cards?.map(c => `${c.rank}${SUIT_EMOJI[c.suit] || ''}`).join(', ')}`}
                  {log.action === 'draw' && (log.source === 'deck' ? ' Drew from Pile' : ` Picked up ${log.cards?.[0]?.rank}${SUIT_EMOJI[log.cards?.[0]?.suit || ''] || ''}`)}
                  {log.action === 'jhyap' && ' Called JHYAAP!'}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
      <button className="help-btn" onClick={() => setShowHelp(true)}><HelpCircle size={20} /> HOW TO PLAY</button>


      <div className="table">
        <div className="turn-indicator">
          {turn === 'player' ? "SELECT CARDS & CLICK PILE or bot's thrown card TO THROW" : "BOT IS THINKING..."}
        </div>
        <div className="bot-area">
          <div className="hand">
            {botHand.map((c) => (
              <Card key={c.id} card={c} isBack noHover />
            ))}
          </div>
          <div className="player-label bot">BOT</div>
        </div>

        <div className="center-table">
          <div className="deck-actions">
            <div className={`deck-pile ${turn === 'player' ? 'active' : ''}`} onClick={() => handlePlayerDraw('deck')}>
              {deck.length > 0 && <Card card={deck[0]} isBack noHover />}
              <div className="deck-count">{deck.length} LEFT</div>
            </div>
          </div>

          <div className="discard-area">
            <div className="throw-group">
              <div className="throw-cards">
                {playerLastThrown.map((c) => (
                  <Card key={c.id} card={c} noHover style={{ opacity: 0.7 }} />
                ))}
              </div>
              {playerLastThrown.length > 0 && <div className="throw-label">Your Last Throw</div>}
            </div>

            <div className="throw-group">
              <div className="throw-cards">
                {botLastThrown.map((c) => (
                  <Card
                    key={c.id}
                    card={c}
                    onClick={() => turn === 'player' && handlePlayerDraw(c)}
                    style={{
                      border: turn === 'player' ? '2px solid var(--accent-color)' : 'none',
                      cursor: turn === 'player' ? 'pointer' : 'default',
                      boxShadow: turn === 'player' ? '0 0 20px var(--accent-color)' : 'none'
                    }}
                  />
                ))}
              </div>
              {botLastThrown.length > 0 && <div className="throw-label pickable">Bot's Throw (Pickable)</div>}
            </div>
          </div>
        </div>

        <div className="player-area">
          <div className="hand">
            {playerHand.map((c) => (
              <Card
                key={c.id}
                card={c}
                selected={selectedCards.includes(c.id)}
                onClick={() => toggleCardSelection(c.id)}
              />
            ))}
          </div>
          <div className="hand-value">Hand Value: {calculateHandValue(playerHand)}</div>
          <div className="player-label user">YOU</div>
        </div>
      </div>



      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal help-modal" onClick={e => e.stopPropagation()}>
            <h2>How To Play Dhumbaal</h2>

            <div className="help-content">
              <section>
                <h3>Objective</h3>
                <p>Have the <strong>lowest</strong> total hand value. The game ends when someone reaches <strong>40 points</strong>; that player loses!</p>
              </section>
              <section>
                <h3>Card Values</h3>
                <ul>
                  <li><strong>Ace:</strong> 1 Point</li>
                  <li><strong>2-10:</strong> Face Value</li>
                  <li><strong>J, Q, K:</strong> 10 Points Each</li>
                </ul>
              </section>
              <section>
                <h3>Gameplay</h3>
                <p>On your turn, you must <strong>Throw</strong> cards first, then <strong>Draw</strong> one card.</p>
                <ul>
                  <li><strong>Throw:</strong> Single card, Set (3+ same rank), or Sequence (3+ same suit consecutive).</li>
                  <li><strong>Pick Up:</strong> One card from the <strong>Deck</strong> or the <strong>Bot's last throw</strong>.</li>
                </ul>
              </section>
              <section>
                <h3>Calling JHYAAP</h3>
                <p>If your hand value is <strong>7 or less</strong>, you can call Jhyap during your throw phase.</p>
                <ul>
                  <li>If you have less than the bot: <strong>Victory!</strong> You get 0 pts, Bot gets their hand value.</li>
                  <li>If the bot has less or equal: <strong>Failure!</strong> You get your hand value + 20 penalty points.</li>
                </ul>
              </section>
            </div>

            <button className="close-btn" onClick={() => setShowHelp(false)}>
              Got It!
            </button>
          </div>
        </div>
      )}


      {jhyapResult && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Round Result</h2>
            <p>{jhyapResult}</p>
            <button onClick={startNewRound}>Next Round</button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="modal-overlay">
          <div className="modal game-over-modal">
            {winner === 'Player' ? (
              <>
                <div className="win-icon">🏆</div>
                <h2 className="win-text">YOU WIN!</h2>
              </>
            ) : (
              <>
                <div className="lose-icon">😞</div>
                <h2 className="lose-text">YOU LOSE!</h2>
              </>
            )}
            <div className="final-stats">
              <div className="score-row">
                <span>YOU</span>
                <span>{playerScore}</span>
              </div>
              <div className="score-row">
                <span>BOT</span>
                <span>{botScore}</span>
              </div>
            </div>
            <p className="game-over-reason">
              {playerScore >= TARGET_SCORE
                ? "You crossed the 40-point limit."
                : "The Bot crossed the 40-point limit."}
            </p>
            <div className="game-over-actions">
              <button className="replay-btn" onClick={() => fullReset(false)}>NEW GAME</button>
              <button className="home-btn" onClick={() => fullReset(true)}>HOME PAGE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
