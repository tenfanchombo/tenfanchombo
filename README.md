# Ten Fan Chombo
Ten Fan Chombo is a real time riichi game. Rules, yakus, and scoring are based on the EMA's [Richi Competition Rules](http://mahjong-europe.org/portal/images/docs/Riichi-rules-2016-EN.pdf).

This repository is an [NX mono-repo](https://nx.dev/) consisiting of several packages.

## Applications

### [test-harness](/apps/test-harness)
An angular application for testing. This app contains an in memory game server, and allows you to interactively play as all players

### [scorer](/apps/scorer)
An angular application for scoring, checking tenpai, and calculating waits

## Libraries

### [@tenfanchombo/common](/libs/common)
This package contains definitions for tiles, yakus, scoring alrogrithms, and common helper functions

### [@tenfanchombo/components](/libs/components)
A collection of reusable angular components

### [@tenfanchombo/game-core](/libs/game-core)
Core library containing models for a game, player, list of possible moves, and services

### [@tenfanchombo/server-core](/libs/server-core)
Core server side library containing logic on how to manipulate and maintain the game state.
