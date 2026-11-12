# Saludablex - AI assisted health tracking
This is a project I made thanks to Claude Code. It tracks macro and micro nutrients by analyzing photos you take of your food, where it then stores all the values in a local Pocketbase database.

> [!CAUTION]
> Do not use this tool as definitive guidance, AI can make mistakes. Daily intakes have been verified by me and self-verification is recommended.

## FEATURES
- Calorie tracking
- Macronutrient tracking (fats, carbs, protein)
- Vitamin tracking
- Food recognition by Claude
- Wdight tracking

## Self hosting
### Requirements
You will need Docker, npm to build the app, and a Claude API key (https://platform.claude.com/dashboard).
5 dollars is good to start on and will give you thousands of requests for now.

In order to build the app, you can use `npm install`, and `npm run build` afterwards. This will create a dist folder with static files, which you can then run on nginx or any webserver of your liking.
