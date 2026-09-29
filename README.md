# HindsightSupport

## AI-Powered Customer Support Agent

HindsightSupport is an AI-powered customer support application that remembers previous customer interactions and uses that context to provide more personalized and relevant support responses.

## Problem

Traditional customer support systems often treat every conversation as a new interaction. Support agents may need to manually search through previous conversations to understand a customer's history, preferences, and issues.

## Solution

HindsightSupport uses Hindsight memory to maintain customer context across interactions.

The system can:

- Remember previous customer interactions
- Retrieve relevant customer context
- Generate personalized AI responses
- View customer conversation history
- Switch between different customers
- Maintain conversation history locally
- Provide a mobile-first support experience

## Key Features

- 🤖 AI-powered customer support
- 🧠 Long-term customer memory using Hindsight
- 👤 Multiple customer profiles
- 💬 Context-aware responses
- 📜 Customer interaction history
- 📱 React Native mobile application
- 💾 Local history persistence
- 🌐 Cloud-connected backend

## Technology Stack

### Frontend
- React Native
- Expo
- TypeScript
- Expo Router
- AsyncStorage

### Backend
- Python
- FastAPI
- Hindsight

### Deployment
- Expo / EAS
- Render

## Project Architecture

```text
Customer
   ↓
React Native Mobile App
   ↓
FastAPI Backend
   ↓
Hindsight Memory
   ↓
Relevant Customer Context
   ↓
AI-Generated Support Response
   ↓
Customer
