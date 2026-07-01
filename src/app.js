const DATA_URL = "./data/questions.json";
const PROGRESS_KEY = "interview-question-cards:progress:v1";
const SETTINGS_KEY = "interview-question-cards:settings:v1";

const state = {
  topics: [],
  cards: [],
  selectedTopicId: "all",
  mode: "ordered",
  deck: [],
  cursor: 0,
  isFlipped: false,
  progress: {},
};

const els = {
  answerText: document.querySelector("#answerText"),
  cardMark: document.querySelector("#cardMark"),
  cardPosition: document.querySelector("#cardPosition"),
  clearProgressBtn: document.querySelector("#clearProgressBtn"),
  currentTopic: document.querySelector("#currentTopic"),
  deckSummary: document.querySelector("#deckSummary"),
  errorState: document.querySelector("#errorState"),
  flashcard: document.querySelector("#flashcard"),
  knownBtn: document.querySelector("#knownBtn"),
  knownCount: document.querySelector("#knownCount"),
  newCount: document.querySelector("#newCount"),
  nextBtn: document.querySelector("#nextBtn"),
  prevBtn: document.querySelector("#prevBtn"),
  progressFill: document.querySelector("#progressFill"),
  progressLabel: document.querySelector("#progressLabel"),
  questionText: document.querySelector("#questionText"),
  reviewBtn: document.querySelector("#reviewBtn"),
  reviewCount: document.querySelector("#reviewCount"),
  topicTabs: document.querySelector("#topicTabs"),
};

init();

async function init() {
  bindEvents();
  loadProgress();
  loadSettings();

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Question database responded with ${response.status}.`);
    }

    const data = await response.json();
    state.topics = Array.isArray(data.topics) ? data.topics : [];
    state.cards = flattenCards(state.topics);

    if (!state.topics.some((topic) => topic.id === state.selectedTopicId)) {
      state.selectedTopicId = "all";
    }

    rebuildDeck();
    render();
  } catch (error) {
    showError(
      "Could not load data/questions.json. Run this app through a local server or GitHub Pages."
    );
    console.error(error);
  }
}

function bindEvents() {
  els.flashcard.addEventListener("click", flipCard);
  els.flashcard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      flipCard();
    }
  });

  els.nextBtn.addEventListener("click", () => moveCard(1));
  els.prevBtn.addEventListener("click", () => moveCard(-1));
  els.knownBtn.addEventListener("click", () => setCardProgress("known"));
  els.reviewBtn.addEventListener("click", () => setCardProgress("review"));
  els.clearProgressBtn.addEventListener("click", clearFilteredProgress);

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const currentCardId = getCurrentCard()?.id;
      state.mode = button.dataset.mode;
      state.isFlipped = false;
      rebuildDeck(currentCardId);
      saveSettings();
      render();
    });
  });

  document.addEventListener("keydown", (event) => {
    const tagName = document.activeElement?.tagName;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(tagName)) {
      return;
    }

    if (event.key === "ArrowRight") {
      moveCard(1);
    }

    if (event.key === "ArrowLeft") {
      moveCard(-1);
    }

    if (event.key.toLowerCase() === "k") {
      setCardProgress("known");
    }

    if (event.key.toLowerCase() === "r") {
      setCardProgress("review");
    }
  });
}

function flattenCards(topics) {
  return topics.flatMap((topic) =>
    (topic.cards || []).map((card, index) => ({
      ...card,
      id: card.id || `${topic.id}-${index + 1}`,
      topicId: topic.id,
      topicName: topic.name,
      topicIndex: index + 1,
    }))
  );
}

function loadProgress() {
  try {
    state.progress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    state.progress = {};
  }
}

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
}

function loadSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    state.selectedTopicId = settings.selectedTopicId || "all";
    state.mode = settings.mode === "random" ? "random" : "ordered";
  } catch {
    state.selectedTopicId = "all";
    state.mode = "ordered";
  }
}

function saveSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      mode: state.mode,
      selectedTopicId: state.selectedTopicId,
    })
  );
}

function getFilteredCards() {
  if (state.selectedTopicId === "all") {
    return [...state.cards];
  }

  return state.cards.filter((card) => card.topicId === state.selectedTopicId);
}

function rebuildDeck(preferredCardId) {
  const filteredCards = getFilteredCards();
  state.deck = state.mode === "random" ? shuffle(filteredCards) : filteredCards;

  const preferredIndex = state.deck.findIndex((card) => card.id === preferredCardId);
  state.cursor = preferredIndex >= 0 ? preferredIndex : 0;
  state.isFlipped = false;
}

function shuffle(cards) {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function getCurrentCard() {
  return state.deck[state.cursor] || null;
}

function flipCard() {
  if (!getCurrentCard()) {
    return;
  }

  state.isFlipped = !state.isFlipped;
  renderCard();
}

function moveCard(direction) {
  if (state.deck.length === 0) {
    return;
  }

  if (state.mode === "random" && direction > 0 && state.cursor === state.deck.length - 1) {
    state.deck = shuffle(getFilteredCards());
    state.cursor = 0;
  } else {
    state.cursor = (state.cursor + direction + state.deck.length) % state.deck.length;
  }

  state.isFlipped = false;
  render();
}

function setCardProgress(mark) {
  const card = getCurrentCard();
  if (!card) {
    return;
  }

  if (state.progress[card.id] === mark) {
    delete state.progress[card.id];
  } else {
    state.progress[card.id] = mark;
  }

  saveProgress();
  render();
}

function clearFilteredProgress() {
  const filteredCards = getFilteredCards();
  if (filteredCards.length === 0) {
    return;
  }

  const confirmed = window.confirm("Clear progress for the current topic selection?");
  if (!confirmed) {
    return;
  }

  filteredCards.forEach((card) => {
    delete state.progress[card.id];
  });

  saveProgress();
  render();
}

function setSelectedTopic(topicId) {
  state.selectedTopicId = topicId;
  rebuildDeck();
  saveSettings();
  render();
}

function render() {
  renderTopics();
  renderMode();
  renderStats();
  renderCard();
}

function renderTopics() {
  const topicsWithAll = [
    {
      id: "all",
      name: "All Topics",
      cards: state.cards,
    },
    ...state.topics,
  ];

  els.topicTabs.replaceChildren(
    ...topicsWithAll.map((topic) => {
      const button = document.createElement("button");
      const cards =
        topic.id === "all"
          ? state.cards
          : state.cards.filter((card) => card.topicId === topic.id);
      const knownCount = countByProgress(cards, "known");

      button.className = "topic-chip";
      button.type = "button";
      button.dataset.topicId = topic.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(topic.id === state.selectedTopicId));
      button.classList.toggle("is-active", topic.id === state.selectedTopicId);

      const name = document.createElement("span");
      name.className = "topic-name";
      name.textContent = topic.name;

      const count = document.createElement("span");
      count.className = "topic-count";
      count.textContent = `${knownCount}/${cards.length}`;

      button.append(name, count);
      button.addEventListener("click", () => setSelectedTopic(topic.id));

      return button;
    })
  );
}

function renderMode() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.mode);
  });
}

function renderStats() {
  const cards = getFilteredCards();
  const known = countByProgress(cards, "known");
  const review = countByProgress(cards, "review");
  const fresh = Math.max(cards.length - known - review, 0);
  const percentage = cards.length === 0 ? 0 : Math.round((known / cards.length) * 100);

  els.knownCount.textContent = known;
  els.reviewCount.textContent = review;
  els.newCount.textContent = fresh;
  els.progressFill.style.width = `${percentage}%`;
  els.progressLabel.textContent = `${known} of ${cards.length} known`;
  els.deckSummary.textContent = `${cards.length} cards - ${state.mode}`;
}

function renderCard() {
  const card = getCurrentCard();
  const hasCard = Boolean(card);

  els.flashcard.classList.toggle("is-flipped", state.isFlipped);
  els.flashcard.setAttribute("aria-pressed", String(state.isFlipped));
  els.knownBtn.disabled = !hasCard;
  els.reviewBtn.disabled = !hasCard;
  els.nextBtn.disabled = !hasCard;
  els.prevBtn.disabled = !hasCard;

  if (!card) {
    els.currentTopic.textContent = "No topic";
    els.cardPosition.textContent = "0 / 0";
    els.questionText.textContent = "No cards available.";
    els.answerText.textContent = "Add cards to data/questions.json.";
    setMark(null);
    return;
  }

  els.currentTopic.textContent = card.topicName;
  els.cardPosition.textContent = `${state.cursor + 1} / ${state.deck.length}`;
  els.questionText.textContent = card.question;
  els.answerText.textContent = card.answer;
  setMark(state.progress[card.id] || null);
}

function setMark(mark) {
  els.cardMark.className = "mark-pill";
  els.knownBtn.classList.remove("is-active");
  els.reviewBtn.classList.remove("is-active");

  if (mark === "known") {
    els.cardMark.textContent = "Known";
    els.cardMark.classList.add("known");
    els.knownBtn.classList.add("is-active");
    return;
  }

  if (mark === "review") {
    els.cardMark.textContent = "Review";
    els.cardMark.classList.add("review");
    els.reviewBtn.classList.add("is-active");
    return;
  }

  els.cardMark.textContent = "New";
}

function countByProgress(cards, mark) {
  return cards.filter((card) => state.progress[card.id] === mark).length;
}

function showError(message) {
  els.errorState.hidden = false;
  els.errorState.textContent = message;
}
