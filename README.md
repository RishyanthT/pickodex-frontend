# Pickodex 🎯

Pickodex is a live, interactive full-stack web application that lets you and your friends create custom rooms, rank items, and compete in prediction-style games or make group decisions together. 

> 👋 **Note to Recruiters & Testers:** > Because Pickodex is a live multiplayer game, the best way to experience it is with multiple players! To test out the live synchronization and room management by yourself:
> 1. Open the live site in your standard browser window and create a room.
> 2. Open an **Incognito / Private Browsing tab**, go to the live site, create a different user, and join the room using the 6-digit code.
> 3. You can now interact with the game as two separate players in real-time!

## 🎮 Game Modes

* **🎯 Prediction:** Lock in your team rankings and compete against your friends to see who comes out on top based on our custom scoring system.
* **📈 Friend's Choice:** Can't make up your mind on what to do (e.g., where to eat, what movie to watch)? Put in your choices, have everyone rank them, and let the app calculate the group consensus!
* **🏆 Custom:** Use both game modes to their full potential. Make your own rooms with your own choices and topics. 

## 🚀 How to Play

1. **Enter the Lobby:** Choose a nickname to get started. You can create a new room or join a friend's active room using a 6-digit code.
2. **Rank Your Picks:** Use the intuitive drag-and-drop interface to move items from the "Available" pool into your "Official Ranking" list. 
3. **Lock It In:** Once you are happy with your list, lock in your predictions.
4. **Host Controls:** Once all players in the room have locked their picks, the Room Host can lock the room to reveal everyone's choices.
5. **The Reveal:** For *Prediction* mode, the host sets the official real-world results, and the app calculates the leaderboard. For *Friend's Choice*, the app immediately reveals the highest-averaged winner!

## 💻 Tech Stack

**Frontend:**
* **Angular:** Component-driven UI and service-oriented architecture.
* **TypeScript & RxJS:** For managing asynchronous API calls, state, and complex prediction workflows.
* **Angular CDK:** Powering the smooth, mobile-friendly drag-and-drop ranking boards.
* **HTML/SCSS:** Custom styling with a modern, glassmorphism-inspired UI.

**Backend:**
* **Java & Spring Boot:** Robust RESTful API handling room management, game states, and scoring logic.
* **PostgreSQL (Supabase):** Secure and reliable database for persistent user sessions and room data.

## 🔗 Links
* **Live Site: https://pickodex.netlify.app/
* **Backend Repository:** I would like to not share my backend source code for privacy reasons, but if anyone would like to check it out, contact me.
