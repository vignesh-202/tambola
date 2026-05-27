export const prizeDefinitions = [
  { key: "early5", label: "Early 5" },
  { key: "topLine", label: "Top Line" },
  { key: "middleLine", label: "Middle Line" },
  { key: "bottomLine", label: "Bottom Line" },
  { key: "housie", label: "Housie" }
];

export const initialPrizes = prizeDefinitions.reduce((accumulator, prize) => {
  accumulator[prize.key] = { amount: "", winners: "" };
  return accumulator;
}, {});
