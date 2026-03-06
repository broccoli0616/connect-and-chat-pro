export interface Checkpoint {
  id: string;
  mascotPrompt: string;
  hintPrompt: string;
  keywords: string[];
  successResponse: string;
  extractField?: string;
}

export const airportCheckInScenario: Checkpoint[] = [
  {
    id: "greeting",
    mascotPrompt: "Hello! Welcome to the airport check-in counter. Where is your destination today?",
    hintPrompt: "Try saying the name of a city or country, like 'I'm going to London' or 'Tokyo'.",
    keywords: [],
    successResponse: "Great choice! Let me look that up for you.",
    extractField: "destination",
  },
  {
    id: "passengers",
    mascotPrompt: "How many passengers are travelling today?",
    hintPrompt: "Tell me how many people — for example, 'just me' or 'two passengers'.",
    keywords: ["one", "1", "two", "2", "three", "3", "four", "4", "just me", "myself"],
    successResponse: "Got it, I've noted that down.",
    extractField: "passengers",
  },
  {
    id: "luggage",
    mascotPrompt: "Do you have any luggage to check in today?",
    hintPrompt: "You can say 'yes, one bag' or 'no luggage' or 'I have a suitcase'.",
    keywords: ["yes", "no", "bag", "suitcase", "luggage", "carry", "none"],
    successResponse: "Alright, I've recorded your luggage information.",
    extractField: "luggage",
  },
  {
    id: "passport",
    mascotPrompt: "May I see your passport or ID please? Just say 'here you go' when you're ready.",
    hintPrompt: "Try saying 'Here you go' or 'Here is my passport'.",
    keywords: ["here", "passport", "id", "sure", "yes", "okay"],
    successResponse: "Thank you! Everything looks good.",
  },
  {
    id: "complete",
    mascotPrompt: "You're all checked in! Here's your boarding pass. Have a wonderful flight! ✈️",
    hintPrompt: "",
    keywords: [],
    successResponse: "",
  },
];
