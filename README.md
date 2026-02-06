# Dhumbaal Web Game

A premium web-based implementation of the traditional Nepalese card game **Dhumbaal**, rebuilt using modern web technologies with smooth gameplay, intelligent AI, and polished animations.

---

## 🃏 Features

- **One-Click Gameplay**  
  Streamlined throw-and-draw system that keeps turns fast and intuitive.

- **Smart Bot AI**  
  Strategic opponent that evaluates sets, sequences, and optimal draw decisions.

- **Statement Table (Activity Log)**  
  Persistent side-panel log that tracks every throw and draw in real time while preserving deck secrecy.

- **Premium Animations & Polish**  
  Staggered card dealing, smooth throw and draw transitions, 3D hover effects, floating indicators, and fade-in modals.

- **Infinite Deck System**  
  Automatically reshuffles discarded cards back into the deck when it becomes empty.

---

## 🎮 Gameplay Overview

- **Players:** 2 (User vs Bot)  
- **Deck:** Standard 52-card deck (no jokers)  
- **Starting Hand:** 7 cards each  
- **Target Score:** 40 points  

### 🧮 Card Values
- **Ace:** 1 point  
- **2–10:** Face value  
- **Jack:** 11 points  
- **Queen:** 12 points  
- **King:** 13 points  

---

## 📜 Rules Summary

- **Objective:** Finish a round with the **lowest total hand value**.
- **Turn Flow:** You must **throw cards first**, then **draw one card**.
- **Throws Allowed:**
  - Single card
  - **Sets:** 3 or more cards of the same rank
  - **Sequences:** 3 or more consecutive cards of the same suit
- **Draw Options:**
  - Draw from the deck
  - Pick up the opponent’s last discarded cards

### 🔔 Jhyap (Show)
- Can be called only if your hand value is **7 points or less**
- If you have the **lowest hand**, you win the round and score **0 points**
- If the opponent has **equal or fewer points**, you receive a **+20 penalty**

### 🏁 Game End
- A player who reaches **40 points** is eliminated
- The **last remaining player** wins the game

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (included with Node.js)

### Installation
```bash
cd web
npm install
```

### Running the Game (Development)
```bash
npm run dev
Go to http://localhost:5174/
```
### Building for Production
```bash
npm run build
```

---

If you want a **very minimal version**, a **GitHub badges version**, or a **live-demo-ready README**, I can do that in one pass.
