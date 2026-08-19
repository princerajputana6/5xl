export type ProductFaq = { question: string; answer: string };

const CATEGORY_FAQS: Record<string, ProductFaq[]> = {
  creatine: [
    {
      question: "Is creatine safe to take every day?",
      answer:
        "Creatine is one of the most researched sports supplements available. Daily use at the recommended dose is considered safe for healthy adults — just make sure you're drinking enough water. Check with a doctor first if you have any pre-existing kidney condition.",
    },
    {
      question: "Do I need a loading phase?",
      answer:
        "No — a loading phase (higher doses for the first 5-7 days) saturates your muscles faster, but a steady daily dose gets you to the same place in about 3-4 weeks. Either approach works.",
    },
    {
      question: "Will creatine cause water retention?",
      answer:
        "Creatine draws a small amount of water into your muscle cells, which can show up as a minor weight increase. This is intracellular hydration, not bloating, and supports the strength and recovery benefits.",
    },
    {
      question: "Can I take it on rest days?",
      answer:
        "Yes. Creatine works by keeping your muscle stores topped up over time, so take your usual dose on rest days too, with or without food.",
    },
  ],
  "mass-gainer": [
    {
      question: "Will this make me gain fat?",
      answer:
        "Any calorie surplus can lead to fat gain if it outpaces your training and activity level. Use a gainer to fill the gap between your food intake and your calorie target, not as a replacement for whole meals.",
    },
    {
      question: "When should I drink my gainer shake?",
      answer:
        "Most people take it between meals or post-workout, when appetite is lower but calorie needs are still high. Split larger servings across the day if you find one big shake too filling.",
    },
    {
      question: "Can I mix it with milk instead of water?",
      answer:
        "Yes — milk adds extra calories and protein, which is useful if your goal is aggressive weight gain. Use water if you'd rather keep the shake lighter.",
    },
  ],
  "pre-workout": [
    {
      question: "How long before training should I take it?",
      answer:
        "Most formulas peak 20-30 minutes after consumption, so aim to drink it about half an hour before you start your session.",
    },
    {
      question: "Is it okay to take pre-workout every day?",
      answer:
        "Regular use can build caffeine tolerance over time. Many lifters cycle off for a week every 6-8 weeks, or save it for harder training days, to keep it effective.",
    },
    {
      question: "Will it keep me up at night?",
      answer:
        "It contains stimulants, so avoid taking it within 5-6 hours of bedtime if you're sensitive to caffeine.",
    },
  ],
  bcaa: [
    {
      question: "Do I need BCAAs if I already take whey protein?",
      answer:
        "Whey protein already supplies all the essential amino acids, including BCAAs. This is most useful for intra-workout sipping or fasted training, rather than as a replacement for a complete protein source.",
    },
    {
      question: "Can I take this on an empty stomach?",
      answer:
        "Yes, that's actually one of the most common ways to use it — during fasted cardio or a fasted lifting session.",
    },
  ],
  wellness: [
    {
      question: "Should I take this with food?",
      answer:
        "Most multivitamins and fat-soluble vitamins absorb better with a meal that contains some fat, so taking it alongside breakfast or lunch is a good habit.",
    },
    {
      question: "Can I take this alongside my other supplements?",
      answer:
        "Generally yes. If you're on prescription medication, it's worth a quick check with your doctor or pharmacist to rule out interactions.",
    },
  ],
};

const DEFAULT_FAQS: ProductFaq[] = [
  {
    question: "How do I store this product?",
    answer:
      "Keep it in a cool, dry place away from direct sunlight, and reseal the pack tightly after each use to keep moisture out.",
  },
  {
    question: "Is this suitable for beginners?",
    answer:
      "Yes — start with the recommended serving on the label and adjust based on how your body responds and your training goals.",
  },
  {
    question: "What if I have a medical condition or take medication?",
    answer:
      "Speak with your doctor before adding any new supplement to your routine if you're pregnant, nursing, under 18, or managing a medical condition.",
  },
];

export function getProductFaqs(categorySlug: string | null | undefined): ProductFaq[] {
  if (categorySlug && CATEGORY_FAQS[categorySlug]) return CATEGORY_FAQS[categorySlug];
  return DEFAULT_FAQS;
}
